"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { analyzeSaju } from "@/lib/saju";
import { loadSajuData, saveSajuData } from "@/lib/savedSaju";
import BirthTimePicker, { type BirthTimeValue } from "@/components/BirthTimePicker";

// ─── 드롭다운 피커 ───────────────────────────────────────────────────────────
function DropdownPicker({
  value, options, onChange, placeholder, suffix, disabled,
}: {
  value: string;
  options: Array<{ v: string; label: string }>;
  onChange: (v: string) => void;
  placeholder: string;
  suffix?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (open && listRef.current && value) {
      const el = listRef.current.querySelector(`[data-value="${value}"]`);
      if (el) (el as HTMLElement).scrollIntoView({ block: "center" });
    }
  }, [open, value]);

  const display = options.find(o => o.v === value)?.label ?? "";
  return (
    <div ref={ref} className="relative w-full">
      <div
        onClick={() => !disabled && setOpen(!open)}
        className={`flex items-center justify-between bg-white/5 border rounded-xl px-4 py-3 cursor-pointer transition select-none ${
          disabled ? "opacity-30 cursor-not-allowed" : "hover:border-emerald-500/60"
        } ${open ? "border-emerald-500" : "border-white/10"}`}
      >
        <span className={display ? "text-white text-base" : "text-gray-600 text-base"}>
          {display ? `${display}${suffix ? " " + suffix : ""}` : placeholder}
        </span>
        <span className={`text-gray-500 text-xs transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </div>
      {open && (
        <div ref={listRef} className="absolute z-50 w-full mt-1 bg-[#12121e] border border-white/20 rounded-xl overflow-y-auto shadow-2xl shadow-black/60" style={{ maxHeight: "220px" }}>
          {options.map(opt => (
            <div
              key={opt.v} data-value={opt.v}
              onClick={() => { onChange(opt.v); setOpen(false); }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${value === opt.v ? "text-emerald-300 bg-emerald-900/50 font-semibold" : "text-gray-300 hover:bg-white/8"}`}
            >
              {opt.label}{suffix ? ` ${suffix}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 오행 → 투자 데이터 ─────────────────────────────────────────────────────
const EL_COLOR: Record<string, string> = { 목: "#4ade80", 화: "#fb923c", 토: "#fbbf24", 금: "#a78bfa", 수: "#38bdf8" };
const EL_HAN: Record<string, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };

interface ElData {
  style: string; styleDesc: string; color: string; bg: string; border: string;
  sectors: { emoji: string; name: string; desc: string }[];
  stocks: { ticker: string; name: string; why: string }[];
  etfType: string; etfDesc: string;
  leverageRisk: "극고위험" | "고위험" | "중위험" | "저위험";
  leverageScore: number;
  coinAffinity: number;
  lossPattern: string;
  buyDipTendency: number;
  pyramidUpTendency: number;
  hotStockRisk: number;
  scamStockRisk: number;
  fundAdvice: string;
  coinDesc: string;
  worstCase: string;
  bestAdvice: string;
}

const EL_DATA: Record<string, ElData> = {
  목: {
    style: "성장주 집중형", color: EL_COLOR.목, bg: "rgba(74,222,128,0.07)", border: "rgba(74,222,128,0.22)",
    styleDesc: "성장·혁신 기업에 빠르게 올라타는 타입. 트렌드 파악력이 뛰어나지만 손절이 느립니다.",
    sectors: [
      { emoji: "💻", name: "IT·플랫폼", desc: "NAVER·카카오·크래프톤 등" },
      { emoji: "💊", name: "바이오·헬스케어", desc: "신약·임상 성장주" },
      { emoji: "🌿", name: "친환경·신재생", desc: "태양광·풍력·수소" },
    ],
    stocks: [
      { ticker: "035420", name: "NAVER", why: "AI·클라우드 성장 지속" },
      { ticker: "068270", name: "셀트리온", why: "글로벌 바이오시밀러 확장" },
      { ticker: "035720", name: "카카오", why: "플랫폼 생태계 확장" },
    ],
    etfType: "성장 ETF",
    etfDesc: "TIGER 미국나스닥100 / KODEX 게임산업 / TIGER 2차전지테마",
    leverageRisk: "고위험", leverageScore: 72,
    coinAffinity: 68,
    lossPattern: "\"이번엔 다르다\"를 반복하며 손절 타이밍을 계속 미루다 대규모 손실",
    buyDipTendency: 55,
    pyramidUpTendency: 78,
    hotStockRisk: 81,
    scamStockRisk: 64,
    fundAdvice: "직접 투자도 가능하지만 ISA + 인덱스 ETF 50% 비중 추천",
    coinDesc: "ETH·SOL 등 기술 기반 알트코인에 강하게 끌리는 성향. 한 번에 몰빵 주의.",
    worstCase: "바이오 임상 실패 + 코인 동시 하락 시 원금 70% 이상 손실 가능",
    bestAdvice: "코어-위성 전략: 인덱스 ETF 60% + 성장주 직접 투자 40%",
  },
  화: {
    style: "트렌드 모멘텀형", color: EL_COLOR.화, bg: "rgba(251,146,60,0.07)", border: "rgba(251,146,60,0.22)",
    styleDesc: "시장 분위기에 가장 빨리 올라타는 타입. 단기 수익력은 탁월하지만 FOMO에 취약합니다.",
    sectors: [
      { emoji: "🎵", name: "엔터·미디어", desc: "HYBE·SM·CJ ENM" },
      { emoji: "⚡", name: "2차전지·EV", desc: "LG에너지솔루션·에코프로" },
      { emoji: "🍜", name: "소비재·외식", desc: "트렌드 소비 종목" },
    ],
    stocks: [
      { ticker: "352820", name: "HYBE", why: "K-POP 글로벌 확장" },
      { ticker: "373220", name: "LG에너지솔루션", why: "전기차 배터리 1위" },
      { ticker: "086520", name: "에코프로", why: "2차전지 소재 선두" },
    ],
    etfType: "테마 ETF",
    etfDesc: "TIGER Fn2차전지소재 / KODEX K-엔터테인먼트 / TIGER 미국필라델피아반도체",
    leverageRisk: "극고위험", leverageScore: 89,
    coinAffinity: 85,
    lossPattern: "고점에서 뇌동매수 → 폭락 → 패닉셀. 반복적 고점 물량 패턴",
    buyDipTendency: 30,
    pyramidUpTendency: 90,
    hotStockRisk: 92,
    scamStockRisk: 78,
    fundAdvice: "직접투자 욕구가 강하나 차라리 KODEX200 + 미국 S&P500 ETF가 장기적으로 우위",
    coinDesc: "밈코인·신규 ICO에 강하게 끌리는 성향. 한 번 물리면 본전 생각에 못 팜.",
    worstCase: "급등 후 급락 종목 + 코인 + 레버리지 동시 손실 시 원금 90% 이상 소멸 가능",
    bestAdvice: "매수 전 24시간 대기 룰 설정. 충동매수의 80%는 시간이 지나면 사라집니다.",
  },
  토: {
    style: "안정 가치 배당형", color: EL_COLOR.토, bg: "rgba(251,191,36,0.07)", border: "rgba(251,191,36,0.22)",
    styleDesc: "인내심 있고 장기 보유에 강합니다. 하락장에 흔들리지 않지만 기회를 놓치는 경우가 많습니다.",
    sectors: [
      { emoji: "🏗️", name: "건설·인프라", desc: "삼성물산·DL이앤씨" },
      { emoji: "🛒", name: "소비 필수재", desc: "CJ제일제당·농심" },
      { emoji: "💰", name: "금융·배당주", desc: "KB금융·삼성화재" },
    ],
    stocks: [
      { ticker: "028260", name: "삼성물산", why: "건설·상사 복합 안정" },
      { ticker: "097950", name: "CJ제일제당", why: "필수 소비재 장기 성장" },
      { ticker: "105560", name: "KB금융", why: "고배당 은행지주" },
    ],
    etfType: "배당·가치 ETF",
    etfDesc: "TIGER 코스피고배당 / KODEX 배당성장 / TIGER 미국배당다우존스",
    leverageRisk: "중위험", leverageScore: 38,
    coinAffinity: 25,
    lossPattern: "\"손해 아니니까 안 팔아도 돼\" 마인드로 수익 기회를 놓치거나 오랫동안 손실 방치",
    buyDipTendency: 82,
    pyramidUpTendency: 25,
    hotStockRisk: 30,
    scamStockRisk: 32,
    fundAdvice: "성향 자체가 인덱스 펀드와 가장 잘 맞음. ETF + 배당주 포트폴리오 권장",
    coinDesc: "코인 자체에 큰 관심 없지만 지인 권유에 소액 투자했다가 물리는 패턴 주의.",
    worstCase: "과도한 분산 + 너무 느린 손절로 인플레이션에 실질자산 감소",
    bestAdvice: "연 1~2회 리밸런싱 + 배당 재투자 전략이 가장 잘 맞는 투자자 유형",
  },
  금: {
    style: "분석 가치 투자형", color: EL_COLOR.금, bg: "rgba(167,139,250,0.07)", border: "rgba(167,139,250,0.22)",
    styleDesc: "냉철한 분석과 데이터 기반 결정이 강점. 과분석으로 타이밍을 놓치기도 합니다.",
    sectors: [
      { emoji: "🔬", name: "반도체·하드웨어", desc: "삼성전자·SK하이닉스" },
      { emoji: "⚙️", name: "철강·소재", desc: "POSCO·현대제철" },
      { emoji: "📊", name: "금융·증권", desc: "미래에셋·삼성증권" },
    ],
    stocks: [
      { ticker: "005930", name: "삼성전자", why: "반도체 AI HBM 최대 수혜" },
      { ticker: "000660", name: "SK하이닉스", why: "HBM 글로벌 탑티어" },
      { ticker: "005490", name: "POSCO홀딩스", why: "철강+이차전지소재 복합" },
    ],
    etfType: "섹터·가치 ETF",
    etfDesc: "TIGER 반도체 / KODEX 철강 / TIGER 미국S&P500",
    leverageRisk: "중위험", leverageScore: 44,
    coinAffinity: 38,
    lossPattern: "분석에 너무 오래 걸려 매수 타이밍 상실, 또는 분석 후 과신으로 집중 투자 손실",
    buyDipTendency: 74,
    pyramidUpTendency: 35,
    hotStockRisk: 28,
    scamStockRisk: 22,
    fundAdvice: "직접투자와 인덱스를 병행하는 코어-위성 전략이 가장 적합",
    coinDesc: "비트코인 자산 배분 관점에는 공감하지만 알트코인은 논리적으로 납득 안 됨.",
    worstCase: "한 종목 집중 투자 + 섹터 사이클 역행 시 장기 손실 구간",
    bestAdvice: "종목 분석 후 매수결정은 48시간 이내. 분석 마비에서 벗어나야 합니다.",
  },
  수: {
    style: "글로벌 분산 리서치형", color: EL_COLOR.수, bg: "rgba(56,189,248,0.07)", border: "rgba(56,189,248,0.22)",
    styleDesc: "깊이 있는 리서치와 유연한 적응력이 강점. 너무 자주 포트폴리오를 바꾸는 것이 단점.",
    sectors: [
      { emoji: "📡", name: "통신·인프라", desc: "KT·SKT·LG유플러스" },
      { emoji: "🚢", name: "해운·물류", desc: "HMM·현대글로비스" },
      { emoji: "🌍", name: "글로벌·ETF", desc: "S&P500·나스닥 분산투자" },
    ],
    stocks: [
      { ticker: "030200", name: "KT", why: "5G·B2B 클라우드 성장" },
      { ticker: "011200", name: "HMM", why: "글로벌 해운 사이클 수혜" },
      { ticker: "017670", name: "SK텔레콤", why: "통신+AI 서비스 다각화" },
    ],
    etfType: "글로벌 분산 ETF",
    etfDesc: "TIGER 미국S&P500 / KODEX 미국나스닥100TR / TIGER 글로벌리츠",
    leverageRisk: "중위험", leverageScore: 55,
    coinAffinity: 60,
    lossPattern: "정보 과부하로 결정 지연 → 과도한 종목 교체 → 수익 없이 거래 비용만 증가",
    buyDipTendency: 65,
    pyramidUpTendency: 55,
    hotStockRisk: 50,
    scamStockRisk: 45,
    fundAdvice: "적립식 글로벌 ETF 투자가 장기적으로 직접투자보다 높은 수익 가능성",
    coinDesc: "글로벌 자산 분산 차원에서 BTC 5% 이하 소량 보유는 합리적 판단 가능.",
    worstCase: "잦은 포트폴리오 교체 + 해외 섹터 분산 실패 시 비용 대비 수익률 저조",
    bestAdvice: "월 1회 리뷰 + 1년에 2회만 리밸런싱하는 규칙을 스스로 만들어야 합니다.",
  },
};

// ─── 12운성 투자 에너지 ──────────────────────────────────────────────────────
const UUNSEONG_INVEST: Record<string, { style: string; timing: string; riskLevel: string; advice: string; color: string; smj: boolean }> = {
  장생: { style:"상승 초기 선점형", timing:"신규 섹터·IPO·초기 성장주 선점에 강함", riskLevel:"중위험", advice:"장기 보유 시 높은 수익. 진입 직후 일시 손실도 버티는 인내심 필요.", color:"#4ade80", smj:false },
  목욕: { style:"감각적 단기 트레이더", timing:"단기 고점 매도 감각이 뛰어남", riskLevel:"고위험 ★", advice:"자동 손절 라인 설정 필수. 감각만 믿으면 손실이 반복됩니다.", color:"#c4b5fd", smj:false },
  관대: { style:"자신감 중장기 투자자", timing:"성장주 초·중기 진입 타이밍 양호", riskLevel:"중위험", advice:"자신감 과잉으로 한 종목 집중 주의. 분산 원칙 지키면 좋은 성과.", color:"#86efac", smj:false },
  건록: { style:"독립형 리서치 투자자", timing:"본인 분석 기반 중장기 투자", riskLevel:"중위험", advice:"시장 흐름 완전 무시는 금물. 타인 의견도 일부 참고하세요.", color:"#fbbf24", smj:false },
  제왕: { style:"대세 추종 집중 투자형", timing:"대형 상승 랠리 구간에서 최강", riskLevel:"고위험 ★", advice:"출구 전략을 미리 정하고 반드시 지켜야 합니다.", color:"#f59e0b", smj:false },
  쇠:   { style:"안전자산·현금 비중 중시형", timing:"하락 방어에 탁월", riskLevel:"저위험", advice:"배당주·채권 ETF 비중 유지. 지키는 전략이 이 에너지와 맞습니다.", color:"#94a3b8", smj:false },
  병:   { style:"장기 가치 투자자", timing:"하락장 저가 매수 선호", riskLevel:"중위험", advice:"5년 이상 보유 가능 종목만 매수. 단기 노이즈 차단이 핵심.", color:"#64748b", smj:true },
  사:   { style:"소극적 방어 투자자", timing:"현금 보유 비중 높음", riskLevel:"중위험", advice:"적립식 인덱스 ETF가 최적. 큰 결정 전 전문가 조언 구할 것.", color:"#f87171", smj:true },
  묘:   { style:"장기 적립식 저축형", timing:"적립식 매수에 최적화", riskLevel:"저위험", advice:"월 정액 자동투자 설정하고 마켓타이밍 시도하지 마세요.", color:"#ef4444", smj:true },
  절:   { style:"반복 진출입 투자자", timing:"전환점 포착 시 수익, 오판 시 손실", riskLevel:"고위험 ★", advice:"매매 횟수 월 2회 이하 제한. 전환점 확인 후 진입.", color:"#dc2626", smj:true },
  태:   { style:"아이디어형 기획 투자자", timing:"트렌드 선점 가능성 있음", riskLevel:"고위험", advice:"ETF로 아이디어 섹터 분산. 단일 종목 집중 금지.", color:"#818cf8", smj:false },
  양:   { style:"점진적 성장 투자자", timing:"꾸준한 적립식 투자에 적합", riskLevel:"중위험", advice:"인내심 있게 장기 투자하면 안정적 수익 기대 가능.", color:"#a78bfa", smj:false },
};

const JIJANGAN_FINANCE: Record<string, string> = {
  자:"임수·계수. 지혜로운 재물 운용. 감정 개입 없이 냉정하게 판단하면 수익이 납니다.",
  축:"계수·신금·기토. 인내 속에 재물이 쌓이는 구조. 단기 욕심보다 장기 축적이 맞습니다.",
  인:"무토·병화·갑목. 강한 생명력과 추진력이 숨어 있습니다. 새로운 분야 개척에서 재물이 옵니다.",
  묘:"갑목·을목. 창의성과 성장력이 핵심. 트렌드 앞서가는 분야에서 수익 가능성이 높습니다.",
  진:"을목·계수·무토. 변화와 재생의 힘. 전환점마다 재물 기회가 숨어 있습니다.",
  사:"무토·경금·병화. 강한 의지와 실행력, 재물 기운이 충만합니다. 다만 과열 주의.",
  오:"병화·기토·정화. 열정과 명예욕이 투자에 작용합니다. 감정적 매수 주의, 냉정함이 수익의 열쇠.",
  미:"정화·을목·기토. 포용력과 예술성. 느린 듯하지만 착실히 쌓이는 재물 패턴.",
  신:"무토·임수·경금. 결단력과 지혜. 이성적 분석을 따르면 좋은 결과가 옵니다.",
  유:"경금·신금. 정밀함과 완벽주의. 철저한 리서치 후 집중 투자하는 패턴이 잘 맞습니다.",
  술:"신금·정화·무토. 카리스마와 강한 의지. 장기 보유 종목에서 큰 수익이 나는 패턴.",
  해:"무토·갑목·임수. 지혜와 생명력. 새로운 시작에서 재물 기운이 활성화됩니다.",
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS   = Array.from({ length: CURRENT_YEAR - 1919 }, (_, i) => CURRENT_YEAR - i);
const MONTHS  = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS    = Array.from({ length: 31 }, (_, i) => i + 1);

interface FormState {
  name: string; gender: "male" | "female";
  birthYear: string; birthMonth: string; birthDay: string;
  birthPlace: string;
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
export default function StockPage() {
  const router = useRouter();
  const [step, setStep] = useState<"entry" | "form" | "result">("entry");
  const [showBtn, setShowBtn] = useState(false);
  const [counter] = useState(() => Math.floor(Math.random() * 250) + 130);
  const [totalCount] = useState(() => Math.floor(Math.random() * 12000) + 24000);
  const [hasSaved, setHasSaved] = useState(false);
  const [form, setForm] = useState<FormState>({
    name: "", gender: "female",
    birthYear: "", birthMonth: "", birthDay: "",
    birthPlace: "서울",
  });
  const [birthTime, setBirthTime] = useState<BirthTimeValue>({
    hour: 12, minute: 30, unknown: false, useJajasi: false,
  });
  const [result, setResult] = useState<ReturnType<typeof analyzeSaju> | null>(null);
  const [blurRemoved, setBlurRemoved] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowBtn(true), 2600);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const saved = loadSajuData();
    if (saved) {
      setHasSaved(true);
      setForm({
        name: saved.name || "",
        gender: saved.gender || "female",
        birthYear: saved.birthYear ? String(saved.birthYear) : "",
        birthMonth: saved.birthMonth ? String(saved.birthMonth) : "",
        birthDay: saved.birthDay ? String(saved.birthDay) : "",
        birthPlace: saved.birthPlace || "서울",
      });
      setBirthTime({
        hour: saved.birthHourUnknown ? null : (saved.birthHour ?? 12),
        minute: saved.birthHourUnknown ? null : (saved.birthMinute ?? 30),
        unknown: saved.birthHourUnknown || false,
        useJajasi: saved.useJajasi || false,
      });
    }
  }, []);

  const yearOpts  = YEARS.map(y => ({ v: String(y), label: String(y) }));
  const monthOpts = MONTHS.map(m => ({ v: String(m), label: String(m) }));
  const dayOpts   = DAYS.map(d => ({ v: String(d), label: String(d) }));

  const handleAnalyze = () => {
    const y = parseInt(form.birthYear), mo = parseInt(form.birthMonth), d = parseInt(form.birthDay);
    if (!form.name || isNaN(y) || isNaN(mo) || isNaN(d)) {
      alert("이름과 생년월일을 모두 입력해주세요.");
      return;
    }
    const h = birthTime.unknown ? null : birthTime.hour;
    const min = birthTime.unknown ? null : (birthTime.minute ?? 0);
    saveSajuData({ name: form.name, gender: form.gender, birthYear: y, birthMonth: mo, birthDay: d, birthHour: h, birthMinute: min, birthHourUnknown: birthTime.unknown, birthPlace: form.birthPlace, style: "auto", useJajasi: birthTime.useJajasi });
    const r = analyzeSaju({ birthYear: y, birthMonth: mo, birthDay: d, birthHour: h, birthMinute: h != null ? min : null, name: form.name, gender: form.gender, birthPlace: form.birthPlace, style: "auto", productType: "report", useJajasi: birthTime.useJajasi });
    setResult(r);
    setBlurRemoved(false);
    setStep("result");
  };

  // ── 엔트리 ────────────────────────────────────────────────────────────────
  if (step === "entry") {
    return (
      <main className="min-h-screen bg-[#06060e] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
        <div className="fixed top-5 left-5 z-20">
          <button onClick={() => router.push("/")} className="text-xs text-gray-700 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 홈</button>
        </div>
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-900/25 blur-[160px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-teal-900/20 blur-[130px]" />
        </div>
        <div className="relative z-10 max-w-md w-full text-center">
          <FadeIn delay={0}><div className="text-5xl mb-10 drop-shadow-[0_0_40px_rgba(16,185,129,0.5)]">📈</div></FadeIn>
          <FadeIn delay={100}>
            <div className="flex flex-col items-center gap-2 mb-10">
              <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 rounded-full px-4 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-200 text-sm font-semibold">
                  지금 이 순간 <strong className="text-white">{counter.toLocaleString()}명</strong>이 확인 중
                </span>
              </div>
              <span className="text-xs text-gray-700">
                누적 <strong className="text-gray-500">{totalCount.toLocaleString()}명</strong> 분석 완료
              </span>
            </div>
          </FadeIn>
          <div className="space-y-4 mb-16">
            {[
              { t: "내 친구는 왜 나보다", big: false, delay: 200 },
              { t: "주식으로 잘 버는 걸까?", big: true, delay: 700 },
              { t: "말아먹는 사주가 따로 있습니다.", big: false, delay: 1300 },
              { t: "내 사주는 어느 쪽인지 확인하세요.", big: true, delay: 1800 },
            ].map((l, i) => (
              <FadeIn key={i} delay={l.delay}>
                <p className={`leading-snug ${l.big
                  ? "text-3xl font-black bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent"
                  : "text-xl text-gray-400"}`}>{l.t}</p>
              </FadeIn>
            ))}
          </div>
          <FadeIn delay={2400}>
            <p className="text-sm text-gray-600 mb-10">ETF·레버리지·코인 적합도 · 물타기·불타기 성향 · 무료</p>
          </FadeIn>
          <div style={{ opacity: showBtn ? 1 : 0, transform: showBtn ? "none" : "translateY(20px) scale(0.96)", transition: "opacity 0.7s, transform 0.7s cubic-bezier(0.22,1,0.36,1)" }}>
            <button onClick={() => setStep("form")}
              className="w-full max-w-xs mx-auto block bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-5 px-10 rounded-2xl text-lg shadow-2xl shadow-emerald-900/50 transition-all active:scale-[0.97]">
              {hasSaved ? "✓ 내 사주로 바로 분석" : "내 투자 DNA 확인하기"}
            </button>
            <p className="text-xs text-gray-700 mt-4">{hasSaved ? "저장된 사주로 바로 시작 — 결과 충격 주의" : "무료 · 1분 완성 · 말아먹을 사람은 보지 마세요 😶"}</p>
          </div>
        </div>
      </main>
    );
  }

  // ── 폼 ──────────────────────────────────────────────────────────────────
  if (step === "form") {
    return (
      <main className="min-h-screen bg-[#080810] text-white">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-15%] left-[-15%] w-[700px] h-[700px] rounded-full bg-emerald-900/20 blur-[140px]" />
          <div className="absolute bottom-[-20%] right-[-15%] w-[600px] h-[600px] rounded-full bg-teal-900/20 blur-[120px]" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-16">
          <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setStep("entry")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 처음으로</button>
            {hasSaved && <span className="text-xs text-emerald-400/70 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">✓ 저장된 사주 불러옴</span>}
          </div>
          <div className="text-center mb-8">
            <div className="text-5xl mb-4 drop-shadow-[0_0_30px_rgba(16,185,129,0.5)]">📈</div>
            <h1 className="text-3xl font-black mb-2 bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text text-transparent">사주 주식 투자 분석</h1>
            <p className="text-gray-400 text-sm">오행으로 보는 투자 성향 · ETF · 레버리지 · 코인 친화도</p>
          </div>
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-7 space-y-6 shadow-2xl shadow-black/40">
            {/* 이름 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">이름</label>
              <input type="text" placeholder="홍길동" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition" />
            </div>
            {/* 성별 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">성별</label>
              <div className="flex gap-3">
                {[{ v: "female", l: "여성" }, { v: "male", l: "남성" }].map(g => (
                  <button key={g.v} type="button" onClick={() => setForm({ ...form, gender: g.v as "male" | "female" })}
                    className={`flex-1 py-3 rounded-xl border transition font-medium ${form.gender === g.v ? "bg-emerald-600 border-emerald-500" : "bg-white/5 border-white/10 text-gray-400"}`}>
                    {g.l}
                  </button>
                ))}
              </div>
            </div>
            {/* 생년월일 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">생년월일 (양력)</label>
              <div className="mb-3">
                <DropdownPicker value={form.birthYear} options={yearOpts} onChange={v => setForm({ ...form, birthYear: v })} placeholder="연도 선택" suffix="년" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DropdownPicker value={form.birthMonth} options={monthOpts} onChange={v => setForm({ ...form, birthMonth: v })} placeholder="월 선택" suffix="월" />
                <DropdownPicker value={form.birthDay} options={dayOpts} onChange={v => setForm({ ...form, birthDay: v })} placeholder="일 선택" suffix="일" />
              </div>
            </div>
            {/* 태어난 시간 — 십이시진 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-3">태어난 시간</label>
              <BirthTimePicker
                value={birthTime}
                onChange={setBirthTime}
                accent="emerald"
              />
            </div>
            {/* 도시 */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">태어난 도시</label>
              <input type="text" placeholder="서울 / 부산 / 대구 등" value={form.birthPlace}
                onChange={e => setForm({ ...form, birthPlace: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition" />
            </div>
            <button onClick={handleAnalyze}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] text-lg shadow-lg shadow-emerald-900/40">
              📈 내 사주 투자 성향 분석하기
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── 결과 ──────────────────────────────────────────────────────────────────
  if (!result) return null;

  const yongshin = result.yongshin.yongshin;
  const ed = EL_DATA[yongshin];
  const allEls = ["목", "화", "토", "금", "수"];
  const scoreMax = Math.max(...allEls.map(e => result.scores[e as keyof typeof result.scores]));

  const blurCls = blurRemoved ? "" : "blur-sm select-none pointer-events-none";
  const blurOverlay = !blurRemoved;

  return (
    <main className="min-h-screen bg-[#080810] text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[700px] h-[700px] rounded-full bg-emerald-900/20 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[600px] h-[600px] rounded-full bg-teal-900/20 blur-[120px]" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">
        {/* 상단 네비 */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setStep("form")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 다시 입력</button>
          <button onClick={() => router.push("/")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">홈으로</button>
        </div>

        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">📈</div>
          <h2 className="text-2xl font-black mb-1">{form.name}님의 투자 DNA</h2>
          <p className="text-gray-500 text-sm">{result.fourPillars}</p>
        </div>

        {/* ① 오행 분포 — 공개 */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-4">오행 에너지 분포</p>
          {allEls.map(el => {
            const s = result.scores[el as keyof typeof result.scores];
            const pct = scoreMax > 0 ? Math.round((s / scoreMax) * 100) : 0;
            return (
              <div key={el} className="flex items-center gap-3 mb-3 last:mb-0">
                <span className="text-sm font-bold w-12 shrink-0" style={{ color: EL_COLOR[el] }}>{EL_HAN[el]} {el}</span>
                <div className="flex-1 bg-white/5 rounded-full h-2.5 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: EL_COLOR[el], opacity: 0.85 }} />
                </div>
                <span className="text-xs text-gray-500 w-10 text-right">{s.toFixed(1)}</span>
              </div>
            );
          })}
        </div>

        {/* ② 핵심 투자 성향 — 공개 */}
        <div className="rounded-2xl p-5 mb-4 border" style={{ backgroundColor: ed.bg, borderColor: ed.border }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-xs font-bold tracking-widest mb-1 block" style={{ color: ed.color }}>용신 · 핵심 투자 오행</span>
              <span className="text-2xl font-black" style={{ color: ed.color }}>{EL_HAN[yongshin]} {yongshin} — {ed.style}</span>
            </div>
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{ed.styleDesc}</p>
        </div>

        {/* ③ 추천 섹터 — 공개 */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-4">추천 투자 섹터</p>
          <div className="space-y-3">
            {ed.sectors.map((s, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/[0.03] rounded-xl p-3 border border-white/5">
                <span className="text-2xl shrink-0">{s.emoji}</span>
                <div><p className="text-sm font-bold">{s.name}</p><p className="text-xs text-gray-500 mt-0.5">{s.desc}</p></div>
              </div>
            ))}
          </div>
        </div>

        {/* ④ 관심 종목 — 공개 */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase">관심 종목 예시</p>
            <span className="text-xs text-amber-400/70 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded-full">참고용</span>
          </div>
          <div className="space-y-2.5">
            {ed.stocks.map((s, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/[0.03] rounded-xl p-3 border border-white/5">
                <span className="text-xs font-mono text-gray-500 bg-white/5 rounded-lg px-2 py-1 shrink-0">{s.ticker}</span>
                <div><p className="text-sm font-bold">{s.name}</p><p className="text-xs text-gray-500 mt-0.5">{s.why}</p></div>
              </div>
            ))}
          </div>
        </div>

        {/* ⑤ 말아먹기 패턴 — 공개 (바이럴 트리거) */}
        <div className="bg-red-500/[0.07] border border-red-500/25 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-red-400 text-lg">⚠️</span>
            <p className="text-sm font-black text-red-300">이 오행 조합의 전형적 손실 패턴</p>
          </div>
          <p className="text-sm text-red-200/80 leading-relaxed font-medium">"{ed.lossPattern}"</p>
          <p className="text-xs text-red-400/50 mt-3">같은 사주 유형 투자자 중 이 패턴으로 3년 내 원금 30% 이상 손실한 비율을 분석한 결과입니다.</p>
        </div>

        {/* ⑤-b ☯ 12운성 투자 에너지 */}
        {(() => {
          const dayUU = result.pillarsDetail?.day?.uunseong;
          const uu = dayUU ? UUNSEONG_INVEST[dayUU] : null;
          if (!uu) return null;
          return (
            <div className={`border rounded-2xl p-5 mb-4 ${uu.smj ? "bg-red-950/20 border-red-500/20" : "bg-white/[0.04] border-white/10"}`}>
              <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-3">☯ 일주 12운성 투자 에너지</p>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm font-black" style={{ color: uu.color }}>{dayUU}</span>
                <span className="text-sm text-gray-300 font-bold">— {uu.style}</span>
                {uu.smj && <span className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/25 px-2 py-0.5 rounded-full ml-auto">사묘절 (死墓絶)</span>}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-black/30 rounded-xl p-3">
                  <p className="text-[10px] text-gray-600 mb-1.5">⏱ 투자 타이밍</p>
                  <p className="text-[11px] text-gray-300 leading-relaxed">{uu.timing}</p>
                </div>
                <div className="bg-black/30 rounded-xl p-3">
                  <p className="text-[10px] text-gray-600 mb-1.5">⚡ 위험 수준</p>
                  <p className="text-[11px] leading-relaxed" style={{ color: uu.riskLevel.includes("★") ? "#f87171" : "#94a3b8" }}>{uu.riskLevel}</p>
                </div>
                <div className="bg-black/30 rounded-xl p-3">
                  <p className="text-[10px] text-gray-600 mb-1.5">💡 핵심 조언</p>
                  <p className="text-[11px] text-gray-300 leading-relaxed">{uu.advice}</p>
                </div>
              </div>
              {uu.smj && (
                <div className="mt-3 bg-red-950/40 border border-red-500/20 rounded-xl p-3">
                  <p className="text-xs text-red-300 leading-relaxed">⚠️ 사묘절 에너지: 일간의 기력이 소진·정체·단절되는 구간입니다. <strong>큰 투자 결정 전 반드시 신중하게 검토</strong>하고, 용신 오행 환경으로 에너지를 보충하세요.</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* ⑤-c 🌀 지장간 숨은 재물 기운 */}
        {(() => {
          const dayJj = result.pillarsDetail?.day?.jj;
          const desc = dayJj ? JIJANGAN_FINANCE[dayJj] : null;
          if (!desc) return null;
          return (
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-4">
              <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-3">🌀 지장간 — 숨은 재물 기운</p>
              <p className="text-xs text-gray-500 mb-2">일지(日支) <strong className="text-gray-300">{dayJj}</strong> 안에 숨어 있는 천간의 재물 에너지</p>
              <div className="bg-black/20 rounded-xl p-3">
                <p className="text-sm text-gray-300 leading-relaxed">{desc}</p>
              </div>
            </div>
          );
        })()}

        {/* ⑥ 블러 섹션들 */}
        <div className="relative mb-4">
          {blurOverlay && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl backdrop-blur-md bg-black/30">
              <div className="text-center px-6 py-8">
                <p className="text-2xl mb-3">🔒</p>
                <p className="text-white font-black text-lg mb-2">숨겨진 분석 결과</p>
                <p className="text-gray-400 text-sm mb-1">ETF vs 선물 vs 레버리지 적합도</p>
                <p className="text-gray-400 text-sm mb-1">코인 투자 친화도 & 추천 종류</p>
                <p className="text-gray-400 text-sm mb-1">물타기 / 불타기 성향 점수</p>
                <p className="text-gray-400 text-sm mb-1">급등주 · 작전주 물릴 위험도</p>
                <p className="text-gray-400 text-sm mb-4">차라리 펀드가 나을지 분석</p>
                <button
                  onClick={() => setBlurRemoved(true)}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold px-8 py-3 rounded-xl text-sm shadow-lg shadow-emerald-900/40 hover:from-emerald-500 hover:to-teal-500 transition active:scale-[0.97]"
                >
                  전체 결과 무료 공개 →
                </button>
                <p className="text-xs text-gray-600 mt-2">로그인 없음 · 완전 무료</p>
              </div>
            </div>
          )}

          <div className={blurRemoved ? "" : "blur-md pointer-events-none select-none"}>
            {/* ETF / 레버리지 / 선물 */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-3">
              <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-4">ETF · 레버리지 · 선물 적합도</p>
              <div className="space-y-3">
                <ScoreRow label="일반 ETF 적합도" score={100 - (ed.leverageScore * 0.3)} color="#4ade80" />
                <ScoreRow label="레버리지 ETF 위험도" score={ed.leverageScore} color={ed.leverageScore > 70 ? "#ef4444" : "#fb923c"} />
                <ScoreRow label="선물·파생 손실 위험도" score={ed.leverageScore + 10 > 99 ? 99 : ed.leverageScore + 10} color="#f43f5e" />
              </div>
              <div className="mt-4 p-3 bg-white/[0.03] rounded-xl border border-white/5">
                <p className="text-xs text-gray-400 leading-relaxed">
                  <span className="text-white font-bold">추천 ETF 유형:</span> {ed.etfType}<br />
                  {ed.etfDesc}
                </p>
              </div>
              {ed.leverageScore > 70 && (
                <div className="mt-3 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                  <p className="text-xs text-red-300 leading-relaxed">
                    ⚡ 이 오행 조합은 레버리지 ETF 보유 시 강제 손절 확률이 <strong>매우 높습니다</strong>. 단기 2배 레버리지는 방어 메커니즘이 없는 구조입니다.
                  </p>
                </div>
              )}
            </div>

            {/* 코인 */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-3">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase">코인 투자 친화도</p>
                <span className="text-lg font-black" style={{ color: ed.coinAffinity > 65 ? "#f43f5e" : "#4ade80" }}>
                  {ed.coinAffinity}/100
                </span>
              </div>
              <div className="w-full bg-white/5 rounded-full h-3 mb-4 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${ed.coinAffinity}%`, background: `linear-gradient(90deg, #4ade80, ${ed.coinAffinity > 65 ? "#f43f5e" : "#4ade80"})` }} />
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-3">{ed.coinDesc}</p>
              {ed.coinAffinity > 60 && (
                <div className="p-3 bg-orange-500/10 rounded-xl border border-orange-500/20">
                  <p className="text-xs text-orange-300">🪙 BTC·ETH 외 알트코인 투자 시 포트폴리오의 5% 이내로 제한을 강력 권고합니다.</p>
                </div>
              )}
            </div>

            {/* 물타기 / 불타기 */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-3">
              <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-4">물타기 · 불타기 성향</p>
              <div className="space-y-3">
                <ScoreRow label="물타기 성향 (하락 시 추가매수)" score={ed.buyDipTendency} color={ed.buyDipTendency > 70 ? "#fb923c" : "#4ade80"} />
                <ScoreRow label="불타기 성향 (상승 시 추가매수)" score={ed.pyramidUpTendency} color={ed.pyramidUpTendency > 75 ? "#ef4444" : "#4ade80"} />
              </div>
              <div className="mt-3 p-3 bg-white/[0.03] rounded-xl border border-white/5">
                <p className="text-xs text-gray-400 leading-relaxed">
                  {ed.buyDipTendency > 60
                    ? "⚡ 물타기 성향이 강합니다. 하락 시 추가 매수 전 반드시 '이 회사가 3년 뒤에도 존재하는가'를 먼저 검토하세요."
                    : "물타기 충동은 낮은 편. 하지만 불타기 시 고점 물림에 주의하세요."}
                </p>
              </div>
            </div>

            {/* 급등주 / 작전주 */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-3">
              <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-4">급등주 · 작전주 위험도</p>
              <div className="space-y-3">
                <ScoreRow label="급등주 충동 매수 위험" score={ed.hotStockRisk} color={ed.hotStockRisk > 70 ? "#ef4444" : "#fb923c"} />
                <ScoreRow label="작전주·테마주 물림 위험" score={ed.scamStockRisk} color={ed.scamStockRisk > 60 ? "#ef4444" : "#fb923c"} />
              </div>
              {ed.hotStockRisk > 70 && (
                <div className="mt-3 p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                  <p className="text-xs text-red-300">⚠️ 단기간 3배 이상 급등한 종목은 매수 금지를 규칙으로 정하세요. 이 오행 조합은 테마주 뉴스에 강하게 반응하는 성향이 있습니다.</p>
                </div>
              )}
            </div>

            {/* 펀드 vs 직접투자 */}
            <div className="bg-indigo-500/[0.06] border border-indigo-500/20 rounded-2xl p-5 mb-3">
              <p className="text-xs text-indigo-400 font-semibold tracking-widest uppercase mb-3">차라리 펀드가 나을까?</p>
              <p className="text-sm text-gray-300 leading-relaxed">{ed.fundAdvice}</p>
            </div>

            {/* 최악의 시나리오 */}
            <div className="bg-red-900/[0.15] border border-red-500/30 rounded-2xl p-5 mb-3">
              <p className="text-xs text-red-400 font-semibold tracking-widest uppercase mb-3">⛔ 최악의 시나리오</p>
              <p className="text-sm text-red-200/80 leading-relaxed">{ed.worstCase}</p>
            </div>

            {/* 최선의 전략 */}
            <div className="rounded-2xl p-5 mb-3 border" style={{ backgroundColor: ed.bg, borderColor: ed.border }}>
              <p className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: ed.color }}>✅ 이 사주에 맞는 최선의 전략</p>
              <p className="text-sm text-gray-200 leading-relaxed font-medium">{ed.bestAdvice}</p>
            </div>
          </div>
        </div>

        {/* 면책 */}
        <div className="text-center mt-4">
          <p className="text-xs text-gray-700 leading-relaxed">본 분석은 사주 오행 이론 기반 순수 오락용 콘텐츠입니다. 실제 투자에 활용하지 마세요.</p>
        </div>
        <button onClick={() => setStep("form")} className="w-full mt-6 py-3 rounded-xl border border-white/10 text-gray-500 hover:text-gray-300 text-sm transition">다시 분석하기</button>
      </div>
    </main>
  );
}

// ─── 유틸 컴포넌트 ───────────────────────────────────────────────────────────
function ScoreRow({ label, score, color }: { label: string; score: number; color: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(score)));
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-40 shrink-0">{label}</span>
      <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold w-10 text-right" style={{ color }}>{pct}</span>
    </div>
  );
}

function FadeIn({ children, delay }: { children: React.ReactNode; delay: number }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(18px)", transition: `opacity 0.9s ease ${delay}ms, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

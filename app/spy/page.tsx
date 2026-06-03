"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { analyzeSaju, type SajuResult } from "@/lib/saju";
import AnalysisLoading from "@/components/AnalysisLoading";
import AdultGate from "@/components/AdultGate";

export const dynamic = "force-dynamic";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS  = Array.from({ length: CURRENT_YEAR - 1919 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS   = Array.from({ length: 31 }, (_, i) => i + 1);

// ── 드롭다운 ─────────────────────────────────────────────────────────────────
function DropPick({ value, opts, onChange, placeholder, suffix }: {
  value: string; opts: { v: string; label: string }[];
  onChange: (v: string) => void; placeholder: string; suffix?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref  = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  useEffect(() => {
    if (open && list.current && value) {
      const el = list.current.querySelector(`[data-v="${value}"]`);
      if (el) (el as HTMLElement).scrollIntoView({ block: "center" });
    }
  }, [open, value]);
  const display = opts.find(o => o.v === value)?.label ?? "";
  return (
    <div ref={ref} className="relative w-full">
      <div onClick={() => setOpen(o => !o)}
        className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer select-none transition text-sm ${
          open ? "border-red-500 bg-red-950/30" : "border-white/15 bg-white/5 hover:border-red-500/50"
        }`}>
        <span className={display ? "text-white" : "text-gray-500"}>{display ? `${display}${suffix ? " " + suffix : ""}` : placeholder}</span>
        <span className={`text-gray-500 text-xs transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </div>
      {open && (
        <div ref={list} className="absolute z-50 w-full mt-1 bg-[#1a0808] border border-red-900/40 rounded-xl overflow-y-auto shadow-2xl" style={{ maxHeight: 220 }}>
          {opts.map(o => (
            <div key={o.v} data-v={o.v} onClick={() => { onChange(o.v); setOpen(false); }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                value === o.v ? "text-red-300 bg-red-900/40 font-semibold" : "text-gray-300 hover:bg-white/8"
              }`}>
              {o.label}{suffix ? ` ${suffix}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 일간별 스파이 데이터 ───────────────────────────────────────────────────────
const ILGAN_SPY: Record<string, {
  style: string; desc: string;
  risk: "낮음" | "중간" | "높음"; riskColor: string;
  warning: string; redFlags: string[]; greenFlags: string[];
}> = {
  갑: {
    style: "원칙형 — 바람보다 이별 선택",
    desc: "강한 자존심이 있어 바람을 피우기보다 관계를 끊는 타입입니다. 마음이 식으면 신호 없이 떠납니다.",
    risk: "낮음", riskColor: "#4ade80",
    warning: "바람기 낮음. 단, 잠수·이별 통보가 갑작스럽습니다.",
    redFlags: ["연락이 갑자기 뚝 끊기면 마음이 식은 것", "새 목표·프로젝트 생기면 관계 후순위로"],
    greenFlags: ["한 번 선택하면 쉽게 바꾸지 않음", "배신·이중 행동을 극도로 싫어함"],
  },
  을: {
    style: "집착형 — 감기면 못 빠져나옴",
    desc: "겉은 유연해 보이지만 속은 강철 의지. 한 사람에게 깊이 빠지는 타입이라 바람기는 낮습니다. 단 집착이 심합니다.",
    risk: "낮음", riskColor: "#4ade80",
    warning: "바람기 낮음. 오히려 과한 집착이 문제입니다.",
    redFlags: ["섭섭함을 쌓아두다 폭발", "질투심이 예상보다 훨씬 강함"],
    greenFlags: ["내 사람에게 올인하는 타입", "새로운 이성에게 쉽게 마음 열지 않음"],
  },
  병: {
    style: "열정형 — 불꽃이 다른 곳으로 튈 수 있음",
    desc: "태양처럼 밝고 에너지가 강합니다. 식으면 빠르게 새로운 자극을 찾습니다. 바람기는 아니지만 '이 사람이 맞나?' 고민을 반복합니다.",
    risk: "중간", riskColor: "#fbbf24",
    warning: "자극이 식으면 다른 곳에서 채우려 할 수 있습니다.",
    redFlags: ["권태기에 이성 친구에게 에너지 쏟음", "관심 받고 싶어 다른 이성에게 적극적 행동"],
    greenFlags: ["솔직해서 이중적 행동은 드묾", "들키면 바로 털어놓는 경향"],
  },
  정: {
    style: "감성형 — 공감해주는 이성에게 취약",
    desc: "촛불처럼 은은하지만 한 번 빠지면 깊어집니다. 감정 이입이 강해 공감해주는 이성에게 위험하게 흔들릴 수 있습니다.",
    risk: "중간", riskColor: "#fbbf24",
    warning: "감정적으로 공감해주는 이성에게 취약합니다.",
    redFlags: ["'우리 그냥 친구야'가 위험 신호", "감성 나누는 이성 친구가 많아지면 주의"],
    greenFlags: ["파트너에게 진심으로 헌신하는 타입", "이중성보다 감정 표현이 솔직한 편"],
  },
  무: {
    style: "안정형 — 큰 산은 잘 안 움직임",
    desc: "한 번 자리 잡으면 잘 움직이지 않는 안정형입니다. 바람기 자체가 낮고 관계의 안정을 중요시합니다.",
    risk: "낮음", riskColor: "#4ade80",
    warning: "바람기 매우 낮음. 단, 표현 부족으로 파트너가 외로울 수 있습니다.",
    redFlags: ["감정 표현이 적어 상대가 외로움 호소", "무뚝뚝함이 '관심 없음'으로 오해 받음"],
    greenFlags: ["의리와 책임감이 강함", "관계 자체를 무너뜨리는 행동 거의 안 함"],
  },
  기: {
    style: "이상추구형 — 완벽한 상대를 찾아다님",
    desc: "섬세하고 완벽을 추구하는 기질이 있어 현재 관계에 작은 불만이 쌓이면 더 나은 상대를 상상하기 시작합니다.",
    risk: "중간", riskColor: "#fbbf24",
    warning: "현재 관계 만족도가 낮아지면 다른 가능성을 탐색할 수 있습니다.",
    redFlags: ["잔소리 뒤에 비교가 생기기 시작하면 주의", "완벽한 파트너 기준이 계속 올라감"],
    greenFlags: ["관계에서 책임감은 강한 편", "바람보다 관계 개선 시도를 먼저 함"],
  },
  경: {
    style: "직선형 — 이중 행동이 어려움",
    desc: "직선적이고 솔직한 성격이라 이중적인 행동 자체가 어렵습니다. 관계가 안 맞으면 깔끔하게 정리를 선택합니다.",
    risk: "낮음", riskColor: "#4ade80",
    warning: "바람기 낮음. 단, 현재 관계가 맞지 않으면 이별 통보가 빠릅니다.",
    redFlags: ["'우리 잘 안 맞는 것 같다' 발언이 나오면 신호", "결정이 나면 번복 없음"],
    greenFlags: ["이중적 행동을 극도로 경멸", "좋아하면 직접적으로 표현, 싫으면 정리"],
  },
  신: {
    style: "낭만추구형 — 설렘이 사라지면 위험",
    desc: "섬세한 낭만과 설렘을 추구합니다. 현재 관계의 두근거림이 사라지면 새로운 이성에게서 그 감각을 찾을 위험이 있습니다.",
    risk: "높음", riskColor: "#fb923c",
    warning: "관계가 루틴해지면 외부에서 설렘을 찾을 수 있습니다.",
    redFlags: ["권태기에 갑자기 외모 관리 시작", "이성 친구에게 썸처럼 행동하는 경향"],
    greenFlags: ["감정에 솔직한 편이라 오래 숨기지는 못함", "결국 파트너와 해결하려 함"],
  },
  임: {
    style: "자유형 — 흐르는 물은 가두기 어려움",
    desc: "흐르는 강처럼 자유를 중요시합니다. 구속을 느끼거나 관계에 압박이 생기면 도망치거나 외부에서 숨구멍을 찾습니다.",
    risk: "높음", riskColor: "#fb923c",
    warning: "자유를 억압하면 외부로 향할 수 있습니다.",
    redFlags: ["'숨막혀' 발언이 잦아지면 위험 신호", "혼자만의 시간·공간을 갑자기 강하게 요구"],
    greenFlags: ["진심으로 맞는 사람이면 깊게 헌신함", "인간적 매력과 포용력은 큰 편"],
  },
  계: {
    style: "감수성형 — 공감 관계에 빠질 수 있음",
    desc: "안개처럼 감수성이 풍부합니다. 자신을 깊이 이해해주는 이성에게 감정선이 흔들리는 경우가 있습니다.",
    risk: "중간", riskColor: "#fbbf24",
    warning: "공감·위로를 잘 해주는 이성에게 감정이 흔들릴 수 있습니다.",
    redFlags: ["'그 사람은 나를 이해해줘' 발언이 나오면 주의", "감성적 교류가 깊어지는 이성 친구"],
    greenFlags: ["관계에 충실하고 섬세하게 챙기는 타입", "직접적인 배신보다 감정적 혼란이 더 많음"],
  },
};

// ── 등급 ─────────────────────────────────────────────────────────────────────
const GRADES = [
  { min: 81, grade: "E", label: "적신호", color: "#ef4444", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.35)",
    desc: "도화 기운이 사주 전체를 압도합니다. 냉정하게 상황을 직시할 필요가 있습니다.",
    verdict: "이 사주, 그냥 지나치기 어렵습니다." },
  { min: 61, grade: "D", label: "위험 신호", color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.30)",
    desc: "도화 기운이 매우 강합니다. 주변 환경과 상대의 의지에 따라 크게 달라집니다.",
    verdict: "상황을 면밀히 주시하세요." },
  { min: 41, grade: "C", label: "경계 단계", color: "#fbbf24", bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.25)",
    desc: "도화 기운이 있습니다. 자극적인 상황이 주어지면 흔들릴 수 있습니다.",
    verdict: "안심은 금물. 관계 점검이 필요합니다." },
  { min: 21, grade: "B", label: "주의 필요", color: "#a3e635", bg: "rgba(163,230,53,0.08)", border: "rgba(163,230,53,0.20)",
    desc: "도화 기운이 일부 있지만 크게 우려할 수준은 아닙니다.",
    verdict: "비교적 안정적이지만 방심은 금물." },
  { min: 0,  grade: "A", label: "안정형", color: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.20)",
    desc: "도화 기운이 거의 없습니다. 전반적으로 안정적인 관계 패턴입니다.",
    verdict: "믿을 만한 사주입니다." },
];

function getGrade(score: number) {
  return GRADES.find(g => score >= g.min) ?? GRADES[GRADES.length - 1];
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
function SpyContent() {
  const router = useRouter();
  const [step, setStep] = useState<"entry" | "form" | "loading" | "result">("entry");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [year,  setYear]  = useState("");
  const [month, setMonth] = useState("");
  const [day,   setDay]   = useState("");
  const resultRef = useRef<SajuResult | null>(null);

  const yearOpts  = YEARS.map(y => ({ v: String(y), label: String(y) }));
  const monthOpts = MONTHS.map(m => ({ v: String(m), label: String(m) }));
  const dayOpts   = DAYS.map(d => ({ v: String(d), label: String(d) }));

  function handleAnalyze() {
    if (!year || !month || !day) return;
    const r = analyzeSaju({
      birthYear: parseInt(year), birthMonth: parseInt(month), birthDay: parseInt(day),
      birthHour: null, birthMinute: null,
      name: "그 사람", gender,
      birthPlace: "서울", style: "auto", productType: "report", useJajasi: false,
    });
    resultRef.current = r;
    setStep("loading");
  }

  // ── 진입 ──────────────────────────────────────────────────────────────────
  if (step === "entry") {
    return (
      <main className="min-h-screen bg-[#0a0101] text-white flex flex-col">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[700px] h-[700px] rounded-full bg-red-950/40 blur-[160px]" />
          <div className="absolute bottom-[-20%] right-[-15%] w-[500px] h-[500px] rounded-full bg-rose-950/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-5 py-16 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-red-900/50 border border-red-700/40 text-red-300 text-xs font-bold tracking-wider mb-8">
            ⚠ 이 분석은 매울 수 있습니다
          </div>
          <h1 className="text-4xl font-black mb-4 leading-tight tracking-tight">
            애인 사주<br />
            <span className="text-red-400">염탐하기</span>
          </h1>
          <p className="text-gray-400 text-base mb-2 leading-relaxed">
            당신의 편은 들지 않습니다.<br />
            <span className="text-gray-300 font-medium">오직 사실만 말합니다.</span>
          </p>
          <p className="text-gray-600 text-sm mb-12">
            바람기 · 도화살 · 불륜 가능성까지<br />사주 명리로 정직하게 분석합니다
          </p>

          <div className="w-full space-y-3 mb-10 text-left">
            {[
              ["도화살 · 홍염살 · 진도화", "이성을 끌어당기는 기운이 사주에 있는지"],
              ["일지 목욕 — 12운성의 색정 기운", "가장 위험한 바람기 신호"],
              ["일간별 연애 패턴", "이 사람이 관계에서 어떻게 움직이는지"],
              ["종합 바람기 위험도 A~E 등급", "냉정한 점수 판정"],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-start gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-xs text-gray-600 mb-6">
            애인의 생년월일만 입력합니다.<br />
            사주 명리는 날짜만으로 핵심 기운을 파악합니다.
          </p>

          <button onClick={() => setStep("form")}
            className="w-full py-4 rounded-2xl font-black text-lg tracking-tight bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white shadow-lg shadow-red-900/50 transition-all active:scale-[0.98]">
            염탐 시작하기
          </button>
          <button onClick={() => router.push("/")} className="mt-4 text-xs text-gray-600 hover:text-gray-400 transition">
            돌아가기
          </button>
        </div>
      </main>
    );
  }

  // ── 입력 폼 ───────────────────────────────────────────────────────────────
  if (step === "form") {
    const ready = !!year && !!month && !!day;
    return (
      <main className="min-h-screen bg-[#0a0101] text-white">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full bg-red-950/40 blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setStep("entry")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 뒤로</button>
            <button onClick={() => router.push("/")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">홈으로</button>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">그 사람 정보 입력</h2>
            <p className="text-gray-500 text-sm">이름은 받지 않습니다. 생년월일만으로 충분합니다.</p>
          </div>

          <div className="space-y-5">
            {/* 성별 */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">애인 성별</label>
              <div className="grid grid-cols-2 gap-3">
                {(["male", "female"] as const).map(g => (
                  <button key={g} type="button" onClick={() => setGender(g)}
                    className={`py-3 rounded-xl border font-semibold text-sm transition ${
                      gender === g
                        ? "bg-red-900/50 border-red-500 text-red-200"
                        : "bg-white/5 border-white/15 text-gray-400 hover:border-white/30"
                    }`}>
                    {g === "male" ? "남성" : "여성"}
                  </button>
                ))}
              </div>
            </div>

            {/* 생년월일 */}
            <div>
              <label className="block text-sm font-semibold text-gray-400 mb-3">생년월일</label>
              <div className="mb-3">
                <DropPick value={year} opts={yearOpts} onChange={setYear} placeholder="연도 선택" suffix="년" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <DropPick value={month} opts={monthOpts} onChange={setMonth} placeholder="월" suffix="월" />
                <DropPick value={day}   opts={dayOpts}   onChange={setDay}   placeholder="일" suffix="일" />
              </div>
            </div>

            <div className="bg-red-950/20 border border-red-900/30 rounded-xl px-4 py-3">
              <p className="text-xs text-red-400/80 leading-relaxed">
                시간은 받지 않습니다. 사주 명리는 생년월일만으로도 핵심 기운을 파악합니다.
                이 분석은 엔터테인먼트 목적으로 제공됩니다.
              </p>
            </div>

            <button onClick={handleAnalyze} disabled={!ready}
              className={`w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all active:scale-[0.98] ${
                ready
                  ? "bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white shadow-lg shadow-red-900/50"
                  : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
              }`}>
              사주 염탐 시작
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── 로딩 ──────────────────────────────────────────────────────────────────
  if (step === "loading") {
    return <AnalysisLoading subject="그 사람의 사주" duration={2800} onDone={() => setStep("result")} />;
  }

  // ── 결과 ──────────────────────────────────────────────────────────────────
  const result = resultRef.current;
  if (!result) return null;

  const hasSinsal = (name: string) => result.sinsalList.some(s => s.name === name);
  const has도화  = hasSinsal("도화살");
  const has홍염  = hasSinsal("홍염살");
  const has진도화 = hasSinsal("진도화");
  const has역마  = hasSinsal("역마살");
  const iljiUunseong = result.pillarsDetail.day.uunseong;
  const hasMokYok    = iljiUunseong === "목욕";
  const haHwa        = result.dominant.includes("화");

  let rawScore = 0;
  if (has홍염)   rawScore += 25;
  if (has진도화) rawScore += 30;
  if (has도화)   rawScore += 20;
  if (has역마)   rawScore += 15;
  if (hasMokYok) rawScore += 20;
  if (haHwa)     rawScore += 10;
  const score = Math.min(rawScore, 100);

  const grade   = getGrade(score);
  const ilgan   = result.pillarsDetail.day.cg;
  const spyData = ILGAN_SPY[ilgan] ?? ILGAN_SPY["무"];

  const dangerSinsals: { name: string; desc: string }[] = [];
  if (has진도화) dangerSinsals.push({ name: "진도화(眞桃花)", desc: "일지 기준 진짜 도화. 이성 매력과 인기가 매우 강합니다. 유혹에 노출될 가능성이 높습니다." });
  if (has홍염)  dangerSinsals.push({ name: "홍염살(紅艶殺)", desc: "색정 구설 기운. 이성과의 스캔들 가능성이 사주에 내재되어 있습니다." });
  if (has도화)  dangerSinsals.push({ name: "도화살(桃花殺)", desc: "이성에게 자연스럽게 끌리는 에너지. 주변에 이성 친구가 자연스럽게 많아집니다." });
  if (has역마)  dangerSinsals.push({ name: "역마살(驛馬殺)", desc: "한 곳에 정착 못 하는 기운. 관계에서도 새로운 자극을 끊임없이 추구합니다." });
  if (hasMokYok) dangerSinsals.push({ name: `일지 목욕(沐浴) — ${result.pillarsDetail.day.jj}`, desc: "12운성 중 색정 기운이 가장 강합니다. 유혹과 자극에 취약한 위치입니다." });

  const safePoints: string[] = [];
  if (!has도화 && !has홍염 && !has진도화) safePoints.push("도화·홍염 기운 없음 — 이성을 끌어당기는 신살이 사주에 없습니다.");
  if (!has역마) safePoints.push("역마살 없음 — 한 곳에 정착하려는 기질이 있습니다.");
  if (!hasMokYok) safePoints.push(`일지 ${result.pillarsDetail.day.jj} — 목욕이 아닙니다. 색정 기운이 강하지 않습니다.`);
  if (result.dominant.includes("토")) safePoints.push("토(土) 기운 강함 — 안정·정착 기운이 우세합니다.");
  if (result.dominant.includes("금")) safePoints.push("금(金) 기운 강함 — 원칙과 의리를 중시하는 기질이 있습니다.");
  if (safePoints.length === 0) safePoints.push("종합적으로 판단할 때 주변 환경과 본인의 의지가 결정적입니다.");

  const genderLabel = gender === "male" ? "그 남자" : "그 여자";

  return (
    <main className="min-h-screen bg-[#0a0101] text-white" style={{ animation: "fadeIn 0.45s ease-out" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full blur-[140px]"
          style={{ backgroundColor: grade.color + "18" }} />
        <div className="absolute bottom-[-20%] right-[-15%] w-[500px] h-[500px] rounded-full bg-red-950/20 blur-[120px]" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">

        {/* 네비 */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setStep("form")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 다시 입력</button>
          <button onClick={() => router.push("/")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">홈으로</button>
        </div>

        {/* 헤더 */}
        <div className="text-center mb-6">
          <p className="text-xs text-gray-500 mb-1">{genderLabel}의 일주</p>
          <h2 className="text-3xl font-black mb-1">{result.pillarsDetail.day.cg}{result.pillarsDetail.day.jj}일주</h2>
          <p className="text-gray-600 text-xs">{result.fourPillars}</p>
        </div>

        {/* 종합 등급 배너 */}
        <div className="rounded-2xl p-5 mb-4 border" style={{ backgroundColor: grade.bg, borderColor: grade.border }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-xs font-bold tracking-widest mb-1 block" style={{ color: grade.color }}>
                바람기 위험도 판정
              </span>
              <span className="text-4xl font-black" style={{ color: grade.color }}>
                {grade.grade}등급
              </span>
              <span className="text-lg font-bold ml-2" style={{ color: grade.color }}>{grade.label}</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black" style={{ color: grade.color }}>{score}점</p>
              <p className="text-xs text-gray-500">/ 100</p>
            </div>
          </div>
          {/* 점수 바 */}
          <div className="w-full bg-white/10 rounded-full h-2.5 mb-3">
            <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: grade.color }} />
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{grade.desc}</p>
          <p className="text-sm font-semibold mt-2" style={{ color: grade.color }}>→ {grade.verdict}</p>
        </div>

        {/* 도화 지수 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-4">도화 지수 — 사주 속 이성 기운</p>
          {dangerSinsals.length > 0 ? (
            <div className="space-y-3">
              {dangerSinsals.map(({ name, desc }) => (
                <div key={name} className="flex items-start gap-3 bg-red-950/20 border border-red-900/25 rounded-xl px-4 py-3">
                  <span className="text-red-400 text-sm mt-0.5">●</span>
                  <div>
                    <p className="text-sm font-bold text-red-300">{name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-green-400 font-semibold text-sm">도화·홍염·진도화 없음</p>
              <p className="text-gray-500 text-xs mt-1">이성을 끌어당기는 신살이 사주에 없습니다.</p>
            </div>
          )}
        </div>

        {/* 일간별 연애 패턴 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-1">연애 패턴 — {ilgan}일간</p>
          <p className="text-base font-bold mb-3" style={{ color: spyData.riskColor }}>{spyData.style}</p>
          <p className="text-sm text-gray-300 leading-relaxed mb-4">{spyData.desc}</p>
          <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 mb-4">
            <span className="text-xs text-gray-500 font-semibold">바람기 위험</span>
            <span className="text-xs font-bold" style={{ color: spyData.riskColor }}>{spyData.risk}</span>
            <span className="text-xs text-gray-600 ml-auto">{spyData.warning}</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <p className="text-xs font-bold text-red-400 mb-2">위험 신호</p>
              {spyData.redFlags.map(f => (
                <div key={f} className="flex items-start gap-2 mb-1.5">
                  <span className="text-red-500 text-xs mt-0.5 shrink-0">▲</span>
                  <p className="text-xs text-gray-400">{f}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-bold text-green-400 mb-2">안심 포인트</p>
              {spyData.greenFlags.map(f => (
                <div key={f} className="flex items-start gap-2 mb-1.5">
                  <span className="text-green-500 text-xs mt-0.5 shrink-0">▼</span>
                  <p className="text-xs text-gray-400">{f}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 사주 기반 안심 포인트 */}
        {safePoints.length > 0 && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
            <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-3">사주 안심 포인트</p>
            <div className="space-y-2">
              {safePoints.map(f => (
                <div key={f} className="flex items-start gap-2">
                  <span className="text-green-400 text-xs mt-0.5 shrink-0">✓</span>
                  <p className="text-xs text-gray-400 leading-relaxed">{f}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 오행 분포 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-4">오행 에너지 분포</p>
          {(["목","화","토","금","수"] as const).map(el => {
            const EL_COLOR: Record<string, string> = { 목: "#4ade80", 화: "#fb923c", 토: "#fbbf24", 금: "#a78bfa", 수: "#38bdf8" };
            const EL_HAN:  Record<string, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };
            const allScores = ["목","화","토","금","수"].map(e => result.scores[e as keyof typeof result.scores]);
            const max = Math.max(...allScores);
            const s   = result.scores[el];
            const pct = max > 0 ? Math.round((s / max) * 100) : 0;
            return (
              <div key={el} className="flex items-center gap-3 mb-2.5 last:mb-0">
                <span className="text-xs font-bold w-10 shrink-0" style={{ color: EL_COLOR[el] }}>{EL_HAN[el]} {el}</span>
                <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: EL_COLOR[el], opacity: 0.8 }} />
                </div>
                <span className="text-xs text-gray-600 w-8 text-right">{s.toFixed(1)}</span>
              </div>
            );
          })}
        </div>

        {/* 면책 고지 */}
        <div className="bg-white/[0.02] border border-white/8 rounded-xl px-4 py-3 mb-6">
          <p className="text-xs text-gray-600 leading-relaxed text-center">
            본 분석은 사주 명리학 기반 엔터테인먼트 콘텐츠입니다.<br />
            실제 관계 판단의 근거로 사용하지 마세요.
          </p>
        </div>

        <button onClick={() => { setYear(""); setMonth(""); setDay(""); setStep("form"); }}
          className="w-full py-3.5 rounded-2xl font-bold text-sm border border-red-700/40 text-red-400 hover:bg-red-950/30 transition-all">
          다른 사람 분석하기
        </button>
      </div>
    </main>
  );
}

export default function SpyPage() { return <AdultGate><SpyContent /></AdultGate>; }

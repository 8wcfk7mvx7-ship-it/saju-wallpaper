"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import StarShower from "@/components/StarShower";
import { analyzeSaju, type SajuResult, isGanyeoJidong, GANYEO_JIDONG_LOVE } from "@/lib/saju";
import AnalysisLoading from "@/components/AnalysisLoading";
import BirthInputForm, { BirthFormData, defaultBirthData } from "@/components/BirthInputForm";


export const dynamic = "force-dynamic";



// ── 성적 케미 분석 로직 ───────────────────────────────────────────────────────

const CHEONGAN_HAP_MAP: Record<string, { partner: string; name: string; hanja: string; desc: string; score: number }> = {
  갑: { partner: "기", name: "갑기합", hanja: "甲己合", desc: "중정지합(中正之合) — 가장 안정적이고 바른 결합. 성적으로 지속적인 깊은 화합.", score: 20 },
  을: { partner: "경", name: "을경합", hanja: "乙庚合", desc: "인의지합(仁義之合) — 부드러운 덩굴과 강한 금속의 결합. 부드러움이 강함을 감아드는 케미.", score: 15 },
  병: { partner: "신", name: "병신합", hanja: "丙辛合", desc: "위제지합(威制之合) — 강렬한 화(火)와 금(金)의 만남. 지배·복종의 에너지. 뜨겁고 강렬한 끌림.", score: 25 },
  정: { partner: "임", name: "정임합", hanja: "丁壬合", desc: "음란지합(淫亂之合) — 사주에서 성적 화합이 가장 강한 합. 촛불과 깊은 강물의 결합. 거부 불가능한 끌림.", score: 40 },
  무: { partner: "계", name: "무계합", hanja: "戊癸合", desc: "무정지합(無情之合) — 겉은 차갑지만 속이 뜨거운 조합. 표현하지 않지만 강한 내면의 끌림.", score: 20 },
  기: { partner: "갑", name: "갑기합", hanja: "甲己合", desc: "중정지합(中正之合) — 가장 안정적이고 바른 결합.", score: 20 },
  경: { partner: "을", name: "을경합", hanja: "乙庚合", desc: "인의지합(仁義之合) — 부드러움이 강함을 감아드는 케미.", score: 15 },
  신: { partner: "병", name: "병신합", hanja: "丙辛合", desc: "위제지합(威制之合) — 강렬한 지배·복종 케미.", score: 25 },
  임: { partner: "정", name: "정임합", hanja: "丁壬合", desc: "음란지합(淫亂之合) — 사주에서 성적 화합이 가장 강한 합.", score: 40 },
  계: { partner: "무", name: "무계합", hanja: "戊癸合", desc: "무정지합(無情之合) — 겉은 차갑지만 속이 뜨거운 조합.", score: 20 },
};

// 지지 육합(地支六合) — 속궁합에서 가장 중요하게 보는 요소.
// 일지가 육합이면 가장 끈끈하고 안정적인 신체적·정서적 밀착 케미가 형성됨.
const JIJI_YUKHAP_LIST: { a: string; b: string; name: string; result: string; desc: string; score: number }[] = [
  { a: "자", b: "축", name: "자축합(子丑合)", result: "토(土)", desc: "음습한 물과 단단한 흙이 만나 끈끈하게 엉겨 붙는 합. 한번 붙으면 잘 떨어지지 않는, 가장 안정적이고 깊은 신체적 밀착감을 줍니다.", score: 50 },
  { a: "인", b: "해", name: "인해합(寅亥合)", result: "목(木)", desc: "큰 나무가 깊은 물에 뿌리내리는 합. 서로를 키워주고 감싸주는 따뜻하고 다정한 스킨십 케미입니다.", score: 48 },
  { a: "묘", b: "술", name: "묘술합(卯戌合)", result: "화(火)", desc: "도화의 묘와 강한 술이 만나 불을 피우는 합. 보면 볼수록 불타오르는 강한 매력과 집착에 가까운 끌림.", score: 50 },
  { a: "진", b: "유", name: "진유합(辰酉合)", result: "금(金)", desc: "흙과 보석이 서로를 빛나게 하는 합. 서로의 가치를 알아봐주며 깊이 신뢰하는 끈끈한 궁합.", score: 45 },
  { a: "사", b: "신", name: "사신합(巳申合)", result: "수(水)", desc: "합이면서 동시에 형(刑)의 성질도 품은 애증의 합. 밀고 당기는 자극이 강하고, 한번 엮이면 쉽게 못 끊어내는 운명적 케미.", score: 47 },
  { a: "오", b: "미", name: "오미합(午未合)", result: "화(火)/태양과 땅", desc: "뜨거운 태양과 그것을 품는 대지의 합. 정서적으로도 육체적으로도 서로에게 가장 따뜻하게 녹아드는 궁합입니다.", score: 49 },
];

const JIJI_CHUNG_LIST: { a: string; b: string; name: string; desc: string; score: number }[] = [
  { a: "자", b: "오", name: "자오충(子午沖)", desc: "극과 극의 전기 케미. 차가운 물(水)과 뜨거운 불(火)의 충돌. 거부할 수 없는 강렬한 자극. 함께 있으면 항상 짜릿합니다.", score: 35 },
  { a: "묘", b: "유", name: "묘유충(卯酉沖)", desc: "두 도화살 지지의 충돌. 서로의 매력을 끊임없이 자극합니다. 보기만 해도 끌리는 섹시한 긴장감.", score: 28 },
  { a: "진", b: "술", name: "진술충(辰戌沖)", desc: "강한 마찰과 자극. 갈등 속에서도 강하게 끌리는 에너지.", score: 20 },
  { a: "사", b: "해", name: "사해충(巳亥沖)", desc: "강한 화(火)와 수(水)의 충돌. 다른 극이 강하게 끌어당기는 케미.", score: 20 },
  { a: "인", b: "신", name: "인신충(寅申沖)", desc: "충동적인 자극과 에너지 교환.", score: 15 },
  { a: "축", b: "미", name: "축미충(丑未沖)", desc: "안정된 토끼리의 마찰. 중간 강도의 자극.", score: 12 },
];

interface ChemResult {
  score: number;
  highlights: { rank: number; title: string; desc: string; color: string }[];
  hapName: string | null;
  hapDesc: string | null;
  chungName: string | null;
  chungDesc: string | null;
}

function calcChem(r1: SajuResult, r2: SajuResult): ChemResult {
  const ig1 = r1.pillarsDetail.day.cg;
  const ig2 = r2.pillarsDetail.day.cg;
  const ij1 = r1.pillarsDetail.day.jj;
  const ij2 = r2.pillarsDetail.day.jj;
  const mg1 = r1.pillarsDetail.month.cg;
  const mg2 = r2.pillarsDetail.month.cg;
  const mj1 = r1.pillarsDetail.month.jj;
  const mj2 = r2.pillarsDetail.month.jj;
  const yj1 = r1.pillarsDetail.year.jj;
  const yj2 = r2.pillarsDetail.year.jj;

  let score = 0;
  const highlights: ChemResult["highlights"] = [];
  let hapName: string | null = null;
  let hapDesc: string | null = null;
  let chungName: string | null = null;
  let chungDesc: string | null = null;

  // 0순위(최우선): 일지 육합 — 속궁합에서 가장 중시하는 요소
  for (const y of JIJI_YUKHAP_LIST) {
    if ((ij1 === y.a && ij2 === y.b) || (ij1 === y.b && ij2 === y.a)) {
      score += y.score;
      highlights.push({ rank: 0, title: `일지 ${y.name} → ${y.result}`, color: "#fb7185", desc: y.desc });
      if (!hapName) { hapName = y.name; hapDesc = y.desc; }
      break;
    }
  }

  // 1순위: 정임암합의 정점 — 丁亥일주 + 壬午일주
  const isAmhap = (
    (ig1 === "정" && ij1 === "해" && ig2 === "임" && ij2 === "오") ||
    (ig2 === "정" && ij2 === "해" && ig1 === "임" && ij1 === "오")
  );
  if (isAmhap) {
    score += 60;
    highlights.push({ rank: 1, title: "정임암합(丁亥+壬午) — 최강", color: "#f43f5e",
      desc: "사주에서 가장 강렬한 성적 암합. 丁亥일주와 壬午일주의 만남은 천간에서 丁壬합이 이루어지고, 지지에서도 亥-午의 에너지 교류가 형성됩니다. 거부할 수 없는 인연." });
    hapName = "정임암합(丁亥+壬午)";
    hapDesc = "음란지합(淫亂之合) 중 가장 극적인 조합. 불꽃(丁亥 — 촛불+물)과 강물(壬午 — 강물+불꽃)이 서로를 완성시킵니다.";
  }

  // 2순위: 자오충 일지
  const isJaOChung = (ij1 === "자" && ij2 === "오") || (ij1 === "오" && ij2 === "자");
  if (isJaOChung) {
    score += 35;
    const c = JIJI_CHUNG_LIST[0];
    highlights.push({ rank: 2, title: c.name, color: "#f97316", desc: c.desc });
    if (!chungName) { chungName = c.name; chungDesc = c.desc; }
  }

  // 3순위: 정임합 (일간)
  const hap = CHEONGAN_HAP_MAP[ig1];
  if (hap && hap.partner === ig2) {
    score += hap.score;
    highlights.push({ rank: 3, title: `일간 ${hap.hanja} ${hap.name}`, color: "#ec4899", desc: hap.desc });
    if (!hapName) { hapName = hap.name; hapDesc = hap.desc; }
  }

  // 4순위: 인오술합 (삼합 화국) — 두 사람 사주 합산
  const allJijis = [ij1, ij2, mj1, mj2, yj1, yj2];
  const hasIn = allJijis.includes("인"), hasO = allJijis.includes("오"), hasSul = allJijis.includes("술");
  if (hasIn && hasO && hasSul) {
    score += 18;
    highlights.push({ rank: 4, title: "인오술합(寅午戌) 화국", color: "#fbbf24",
      desc: "두 사람의 사주에서 삼합 화국이 형성됩니다. 뜨거운 열정과 강렬한 에너지가 함께 타오릅니다." });
  }

  // 기타 지지충 (일지)
  for (const c of JIJI_CHUNG_LIST.slice(1)) {
    if ((ij1 === c.a && ij2 === c.b) || (ij1 === c.b && ij2 === c.a)) {
      score += c.score;
      highlights.push({ rank: 5, title: `일지 ${c.name}`, color: "#a855f7", desc: c.desc });
      if (!chungName) { chungName = c.name; chungDesc = c.desc; }
    }
  }

  // 기타 천간합 (일간 — 정임 외)
  if (!hap || hap.partner !== ig2) {
    const hap2 = CHEONGAN_HAP_MAP[ig1];
    if (hap2 && hap2.partner !== ig2) {} // no match
  }

  // 월간 합 (보조)
  const hapM = CHEONGAN_HAP_MAP[mg1];
  if (hapM && hapM.partner === mg2 && !(hap && hap.partner === ig2)) {
    score += Math.floor(hapM.score * 0.4);
    highlights.push({ rank: 6, title: `월간 ${hapM.hanja} ${hapM.name}`, color: "#8b5cf6",
      desc: `사회적 이미지에서도 ${hapM.name}이 형성됩니다. 공개적인 케미도 강합니다.` });
  }

  // 도화 기운 더하기
  const DOHWA_NAMES = ["도화살","홍염살","진도화","나체도화","곤랑도화","녹방도화"];
  const d1 = r1.sinsalList.some(s => DOHWA_NAMES.includes(s.name));
  const d2 = r2.sinsalList.some(s => DOHWA_NAMES.includes(s.name));
  if (d1 && d2) {
    score += 15;
    highlights.push({ rank: 7, title: "양쪽 모두 도화 기운 보유", color: "#6366f1",
      desc: "두 사람 모두 이성을 끌어당기는 도화 기운이 있습니다. 서로의 매력에 강하게 끌립니다." });
  } else if (d1 || d2) {
    score += 8;
    highlights.push({ rank: 8, title: "한쪽 도화 기운 보유", color: "#6366f1",
      desc: "한쪽이 강한 도화 기운을 가지고 있어 먼저 매력을 느끼게 됩니다." });
  }

  // 간여지동 — 합이 형성될 때 매력이 이성에게 강하게 발현되는 구조
  const g1 = isGanyeoJidong(ig1, ij1);
  const g2 = isGanyeoJidong(ig2, ij2);
  if ((g1 || g2) && (hapName || (highlights.length > 0 && highlights.some(h => h.rank <= 4)))) {
    score += 6;
    highlights.push({ rank: 9, title: `${g1 && g2 ? "두 사람 모두" : "한쪽이"} 간여지동 — 합으로 매력 발현`, color: "#f472b6",
      desc: GANYEO_JIDONG_LOVE.hapTrigger });
  }

  highlights.sort((a, b) => a.rank - b.rank);
  return { score: Math.min(score, 100), highlights, hapName, hapDesc, chungName, chungDesc };
}

// ── 등급 ─────────────────────────────────────────────────────────────────────
const GRADES = [
  { min: 100, grade: "SS", label: "전생 연인", color: "#f43f5e", bg: "rgba(244,63,94,0.18)", border: "rgba(244,63,94,0.40)",
    verdict: "사주에 새겨진 인연입니다. 이 조합, 운명입니다." },
  { min: 80, grade: "S",  label: "폭발적 케미", color: "#ec4899", bg: "rgba(236,72,153,0.14)", border: "rgba(236,72,153,0.32)",
    verdict: "강렬한 성적 끌림이 사주에 나타납니다." },
  { min: 60, grade: "A",  label: "강한 끌림", color: "#a855f7", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.28)",
    verdict: "성적 화합이 강합니다. 자연스럽게 이끌립니다." },
  { min: 40, grade: "B",  label: "좋은 케미", color: "#8b5cf6", bg: "rgba(139,92,246,0.10)", border: "rgba(139,92,246,0.24)",
    verdict: "잘 맞는 케미입니다. 함께할수록 깊어집니다." },
  { min: 20, grade: "C",  label: "보통 케미", color: "#6366f1", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.20)",
    verdict: "노력과 이해가 필요합니다." },
  { min: 0,  grade: "D",  label: "화합 약함", color: "#4f46e5", bg: "rgba(79,70,229,0.07)", border: "rgba(79,70,229,0.18)",
    verdict: "성적 기운의 방향이 많이 다릅니다." },
];

function getGrade(score: number) { return GRADES.find(g => score >= g.min) ?? GRADES[GRADES.length - 1]; }

// 부족한 오행을 보강해 속궁합 케미를 끌어올리는 컨설팅
const BOOST_TIP: Record<string, { icon: string; color: string; tip: string }> = {
  목: { icon: "🌿", color: "#16a34a", tip: "스킨십 전 가벼운 산책이나 스트레칭으로 몸을 풀어보세요. 초록색 침구·조명을 더하면 긴장이 풀리고 분위기가 부드러워집니다." },
  화: { icon: "🔥", color: "#dc2626", tip: "조명을 따뜻한 톤(주황·붉은 계열)으로 바꾸고, 음악이나 대화로 분위기를 먼저 달궈보세요. 화 기운이 보강되면 표현력과 열정이 살아납니다." },
  토: { icon: "🏔️", color: "#92400e", tip: "급하게 진행하지 말고 충분한 스킨십과 대화로 신뢰를 먼저 쌓으세요. 안정감이 채워질수록 케미가 깊어집니다." },
  금: { icon: "⚔️", color: "#7c3aed", tip: "정리된 침실, 깨끗한 향(은은한 향수·디퓨저)을 더하면 집중도가 올라갑니다. 금 기운 보강은 절제된 긴장감을 만들어 매력을 키웁니다." },
  수: { icon: "🌊", color: "#0369a1", tip: "샤워나 목욕 등 물과 관련된 시간을 함께 가져보세요. 어둡고 차분한 조명, 충분한 수분 섭취가 수 기운을 채워 감성적 케미를 끌어올립니다." },
};

// ── 메인 ─────────────────────────────────────────────────────────────────────
function HotCompatContent() {
  const router = useRouter();
  const [step, setStep] = useState<"entry" | "form" | "loading" | "result">("entry");
  const [p1, setP1] = useState<BirthFormData>(defaultBirthData("female"));
  const [p2, setP2] = useState<BirthFormData>(defaultBirthData("male"));
  const [isPaid, setIsPaid] = useState(false);
  const [blueberries, setBlueberries] = useState(0);
  const [showering, setShowering] = useState(false);
  const chemRef = useRef<ChemResult | null>(null);
  const r1Ref   = useRef<SajuResult | null>(null);
  const r2Ref   = useRef<SajuResult | null>(null);

  useEffect(() => {
    const isAdmin = localStorage.getItem("sp_admin") === "true";
    setIsPaid(isAdmin || localStorage.getItem("sp_hotcompat_paid") === "true");
    const bb = parseInt(localStorage.getItem("sp_blueberries") ?? "0", 10);
    setBlueberries(isNaN(bb) ? 0 : bb);
  }, []);

  async function handleAnalyze() {
    let y1 = p1.birthYear === "" ? NaN : Number(p1.birthYear);
    let m1 = p1.birthMonth === "" ? NaN : Number(p1.birthMonth);
    let d1 = p1.birthDay === "" ? NaN : Number(p1.birthDay);
    let y2 = p2.birthYear === "" ? NaN : Number(p2.birthYear);
    let m2 = p2.birthMonth === "" ? NaN : Number(p2.birthMonth);
    let d2 = p2.birthDay === "" ? NaN : Number(p2.birthDay);
    if (isNaN(y1) || isNaN(m1) || isNaN(d1) || isNaN(y2) || isNaN(m2) || isNaN(d2)) return;
    if (p1.calendarType === "lunar") {
      try {
        // @ts-ignore
        const KLC = (await import("korean-lunar-calendar")).default;
        const klc = new KLC(); klc.setLunarDate(y1, m1, d1, p1.isLeapMonth);
        const sol = klc.getSolarCalendar(); if (!sol?.year) throw new Error();
        y1 = sol.year; m1 = sol.month; d1 = sol.day;
      } catch { alert("첫 번째 사람의 음력 날짜를 변환할 수 없습니다."); return; }
    }
    if (p2.calendarType === "lunar") {
      try {
        // @ts-ignore
        const KLC = (await import("korean-lunar-calendar")).default;
        const klc = new KLC(); klc.setLunarDate(y2, m2, d2, p2.isLeapMonth);
        const sol = klc.getSolarCalendar(); if (!sol?.year) throw new Error();
        y2 = sol.year; m2 = sol.month; d2 = sol.day;
      } catch { alert("두 번째 사람의 음력 날짜를 변환할 수 없습니다."); return; }
    }
    const h1 = p1.birthHour; const min1 = p1.birthMinute ?? 0;
    const h2 = p2.birthHour; const min2 = p2.birthMinute ?? 0;
    const r1 = analyzeSaju({ birthYear: y1, birthMonth: m1, birthDay: d1, birthHour: h1, birthMinute: h1 != null ? min1 : null, name: "나", gender: p1.gender, birthPlace: p1.city || "서울", style: "auto", productType: "report", useJajasi: p1.useJajasi });
    const r2 = analyzeSaju({ birthYear: y2, birthMonth: m2, birthDay: d2, birthHour: h2, birthMinute: h2 != null ? min2 : null, name: "상대", gender: p2.gender, birthPlace: p2.city || "서울", style: "auto", productType: "report", useJajasi: p2.useJajasi });
    r1Ref.current  = r1;
    r2Ref.current  = r2;
    chemRef.current = calcChem(r1, r2);
    setStep("loading");
  }

  // ── 진입 ────────────────────────────────────────────────────────────────
  if (step === "entry") {
    return (
      <main className="min-h-screen bg-[#08010f] text-white flex flex-col">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full bg-rose-950/40 blur-[160px]" />
          <div className="absolute bottom-[-20%] left-[-15%] w-[500px] h-[500px] rounded-full bg-purple-950/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-5 py-16 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-rose-900/50 border border-rose-700/40 text-rose-300 text-xs font-bold tracking-wider mb-8">⚠ 19금 · 보고 후회할 수 있음</div>
          <h1 className="text-4xl font-black mb-4 leading-tight tracking-tight">
            우리의<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-purple-400">속궁합은?</span>
          </h1>
          <p className="text-gray-400 text-base mb-2 leading-relaxed">
            남들은 다 확인했는데<br />
            <span className="text-gray-200 font-medium">나만 모르고 있던 우리 사이의 진짜 온도</span>
          </p>
          <p className="text-gray-600 text-sm mb-12">
            친구들은 이미 다 해봤다는 그 테스트<br />
            우리 둘만 아직 모르고 있던 진짜 순위
          </p>
          <div className="w-full space-y-3 mb-10 text-left">
            {[
              ["혹시 나만 더 좋아하는 거 아닐까?", "둘 중 누가 더 끌리고 있는지, 숨겨진 온도차를 확인하세요", "#f43f5e"],
              ["남들이랑 비교하면 우리는?", "또래 평균보다 위인지 아래인지 — 보면 안심되거나, 불안해질 수 있음", "#f97316"],
              ["전 애인이랑 비교당하는 기분?", "이번엔 진짜 다른지, 데이터로 확인할 차례", "#ec4899"],
              ["같이 있을 때 그 짜릿함, 진짜였을까?", "느낌만으로는 알 수 없던 둘 사이의 폭발력 지수", "#fbbf24"],
            ].map(([title, desc, color]) => (
              <div key={title} className="flex items-start gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: color }} />
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setStep("form")}
            className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white shadow-lg shadow-rose-900/50 transition-all active:scale-[0.98]">
            성적 케미 분석하기
          </button>
        </div>
      </main>
    );
  }

  // ── 폼 ──────────────────────────────────────────────────────────────────
  if (step === "form") {
    const ready = p1.birthYear !== "" && p1.birthMonth !== "" && p1.birthDay !== "" && p2.birthYear !== "" && p2.birthMonth !== "" && p2.birthDay !== "";
    return (
      <main className="min-h-screen bg-[#08010f] text-white">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full bg-rose-950/35 blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">두 사람 정보 입력</h2>
            <p className="text-gray-500 text-sm">생년월일만으로 성적 케미를 분석합니다</p>
          </div>
          <div className="space-y-4 mb-6">
            <BirthInputForm value={p1} onChange={setP1} label="나" accent="#f43f5e" />
            <div className="flex items-center gap-3"><div className="flex-1 h-px bg-white/10" /><span className="text-gray-600 text-xs">vs</span><div className="flex-1 h-px bg-white/10" /></div>
            <BirthInputForm value={p2} onChange={setP2} label="상대방" accent="#818cf8" />
          </div>
          <button onClick={handleAnalyze} disabled={!ready}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.98] ${ready ? "bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white shadow-lg shadow-rose-900/40" : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"}`}>
            성적 케미 분석
          </button>
        </div>
      </main>
    );
  }

  // ── 로딩 ────────────────────────────────────────────────────────────────
  if (step === "loading") {
    return <AnalysisLoading subject="우리의 속궁합" duration={2800} onDone={() => setStep("result")}
      messages={[
        "두 사람의 합·충 관계를 대조하는 중...",
        "혹시 다른 사람이랑 더 잘 맞지 않을지 확인하는 중...",
        "이 정도면 평균 이상인지 비교하는 중...",
        "둘 중 누가 더 많이 끌리고 있는지 계산하는 중...",
      ]}
    />;
  }

  // ── 결과 ────────────────────────────────────────────────────────────────
  const r1 = r1Ref.current;
  const r2 = r2Ref.current;
  const chem = chemRef.current;
  if (!r1 || !r2 || !chem) return null;

  const grade = getGrade(chem.score);
  const ig1 = r1.pillarsDetail.day.cg, ij1 = r1.pillarsDetail.day.jj;
  const ig2 = r2.pillarsDetail.day.cg, ij2 = r2.pillarsDetail.day.jj;

  return (
    <main className="min-h-screen bg-[#08010f] text-white">
      <BackButton />
      <StarShower active={showering} />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full blur-[140px]" style={{ backgroundColor: grade.color + "18" }} />
        <div className="absolute bottom-[-20%] right-[-15%] w-[500px] h-[500px] rounded-full bg-purple-950/20 blur-[120px]" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">

        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="inline-block px-2 py-0.5 rounded-full bg-rose-900/40 border border-rose-700/30 text-rose-400 text-[10px] font-bold tracking-wider mb-2">19금</div>
          <div className="flex items-center justify-center gap-4 mb-1">
            <span className="text-2xl font-black">{ig1}{ij1}일주</span>
            <span className="text-gray-600">×</span>
            <span className="text-2xl font-black">{ig2}{ij2}일주</span>
          </div>
          <p className="text-gray-600 text-xs">{r1.fourPillars} × {r2.fourPillars}</p>
        </div>

        {/* 종합 등급 */}
        <div className="rounded-2xl p-5 mb-4 border" style={{ backgroundColor: grade.bg, borderColor: grade.border }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-xs font-bold tracking-widest mb-1 block" style={{ color: grade.color }}>성적 케미 등급</span>
              <span className="text-4xl font-black" style={{ color: grade.color }}>{grade.grade}</span>
              <span className="text-lg font-bold ml-2" style={{ color: grade.color }}>{grade.label}</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black" style={{ color: grade.color }}>{chem.score}점</p>
              <p className="text-xs text-gray-500">/ 100</p>
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2.5 mb-3">
            <div className="h-full rounded-full" style={{ width: `${chem.score}%`, background: `linear-gradient(90deg, ${grade.color}, #a855f7)` }} />
          </div>
          <p className="text-sm font-bold" style={{ color: grade.color }}>→ {grade.verdict}</p>
        </div>

        {/* 만족도 그래프 — 여성/남성 체감 차이 */}
        {(() => {
          const seed = (chem.hapName ? chem.hapName.length * 17 : 0) + chem.score;
          const diff = (seed % 5);
          const skewToFemale = seed % 2 === 0;
          let female = Math.min(9, Math.max(1, Math.round(chem.score / 12) + (skewToFemale ? diff : -diff)));
          let male = Math.min(9, Math.max(1, Math.round(chem.score / 12) + (skewToFemale ? -diff : diff)));
          if (female === male) { if (skewToFemale) female = Math.min(9, female + 1); else male = Math.min(9, male + 1); }
          return (
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
              <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-4">예상 만족도 (10점 만점)</p>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-bold text-pink-300">여성 {female}점</span>
                <span className="text-sm font-bold text-sky-300">남성 {male}점</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden flex">
                <div className="h-full flex items-center justify-start pl-2"
                  style={{ width: `${(female / (female + male)) * 100}%`, background: "linear-gradient(90deg, #ec4899, #f472b6)" }} />
                <div className="h-full flex items-center justify-end pr-2"
                  style={{ width: `${(male / (female + male)) * 100}%`, background: "linear-gradient(90deg, #6366f1, #38bdf8)" }} />
              </div>
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                {female > male
                  ? "이 궁합은 여성 쪽이 더 큰 만족을 느끼는 케미예요. 남성은 상대를 더 적극적으로 리드하고 배려할수록 케미가 살아납니다."
                  : female < male
                  ? "이 궁합은 남성 쪽이 더 큰 만족을 느끼는 케미예요. 여성은 표현을 조금 더 적극적으로 할수록 케미가 살아납니다."
                  : "두 사람의 체감 만족도가 비슷한 균형 잡힌 케미입니다."}
              </p>
            </div>
          );
        })()}

        {/* 케미 분석 결과 — 페이월 */}
        <div className="relative mb-4">
          <div className={isPaid ? "" : "blur-sm select-none pointer-events-none"}>
            {/* 속궁합 보강법 */}
            {(() => {
              type Element = "목"|"화"|"토"|"금"|"수";
              const elements: Element[] = ["목","화","토","금","수"];
              const lacking = Array.from(new Set([...(r1.lacking ?? []), ...(r2.lacking ?? [])])) as Element[];
              const targets = (lacking.length > 0 ? lacking : elements.slice(0, 2)).slice(0, 2);
              return (
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
                  <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-1">속궁합을 더 끌어올리는 보강법</p>
                  <p className="text-xs text-gray-600 mb-4 leading-relaxed">두 사람의 사주에서 부족한 오행을 보강하면 케미가 더 살아납니다.</p>
                  <div className="space-y-3">
                    {targets.map(el => {
                      const t = BOOST_TIP[el];
                      return (
                        <div key={el} className="flex items-start gap-3 rounded-xl px-4 py-3 border"
                          style={{ backgroundColor: t.color + "12", borderColor: t.color + "30" }}>
                          <span className="text-xl shrink-0">{t.icon}</span>
                          <div>
                            <p className="text-sm font-bold mb-0.5" style={{ color: t.color }}>{el}(五行) 기운 보강</p>
                            <p className="text-xs text-gray-400 leading-relaxed">{t.tip}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {chem.highlights.length > 0 ? (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
                <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-4">발견된 성적 케미 요소</p>
                <div className="space-y-3">
                  {chem.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-3 border"
                      style={{ backgroundColor: h.color + "12", borderColor: h.color + "30" }}>
                      <span className="font-black text-xs shrink-0 mt-0.5" style={{ color: h.color }}>#{i + 1}</span>
                      <div>
                        <p className="text-sm font-bold mb-0.5" style={{ color: h.color }}>{h.title}</p>
                        <p className="text-xs text-gray-400 leading-relaxed">{h.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
                <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-3">분석 결과</p>
                <p className="text-sm text-gray-400 leading-relaxed">두 사람의 사주에서 강한 성적 케미 요소가 발견되지 않았습니다. 개인의 노력과 감성적 교감이 더 중요한 관계입니다.</p>
              </div>
            )}

            {/* 일주 정보 */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[{ r: r1, label: "첫 번째 사람" }, { r: r2, label: "두 번째 사람" }].map(({ r, label }) => (
                <div key={label} className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className="text-lg font-black">{r.pillarsDetail.day.cg}{r.pillarsDetail.day.jj}일주</p>
                  <p className="text-xs text-gray-600">{r.pillarsDetail.day.uunseong}</p>
                  {(() => {
                    const dohwaNames = r.sinsalList
                      .filter(s => ["도화살","홍염살","진도화","나체도화","곤랑도화","녹방도화"].includes(s.name))
                      .map(s => s.name);
                    return dohwaNames.length > 0 ? (
                      <p className="text-xs text-rose-400 mt-1">{dohwaNames.join(" + ")}</p>
                    ) : null;
                  })()}
                </div>
              ))}
            </div>
          </div>

          {/* 잠금 오버레이 */}
          {!isPaid && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl px-5"
              style={{ background: "rgba(8,1,15,0.75)", backdropFilter: "blur(2px)" }}>
              <p className="text-sm font-black text-white mb-1">🔒 상세 분석 잠김</p>
              <p className="text-xs mb-4 text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
                성적 케미 요소·일주 상세를 보려면 결제하세요
              </p>
              {blueberries >= 4900 ? (
                <button
                  onClick={() => {
                    setShowering(true);
                    const next = blueberries - 4900;
                    localStorage.setItem("sp_blueberries", String(next));
                    localStorage.setItem("sp_hotcompat_paid", "true");
                    setBlueberries(next);
                    setTimeout(() => { setIsPaid(true); setShowering(false); }, 700);
                  }}
                  className="w-full px-6 py-3 rounded-2xl font-black text-sm transition-all active:scale-[0.98] mb-2"
                  style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "#fff", boxShadow: "0 4px 16px rgba(99,102,241,0.4)" }}
                >
                  ✦ 별조각 뿌리고 보기 (4,900개)
                </button>
              ) : (
                <button
                  onClick={() => {
                    const orderId = `hc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                    router.push(`/hotcompat/pay?orderId=${orderId}`);
                  }}
                  className="w-full px-6 py-3 rounded-2xl font-black text-sm transition-all active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #be123c, #f43f5e)", color: "#fff", boxShadow: "0 4px 16px rgba(244,63,94,0.4)" }}
                >
                  결제하기 — ₩4,900
                </button>
              )}
            </div>
          )}
        </div>


        <button onClick={() => { setP1(defaultBirthData("female")); setP2(defaultBirthData("male")); setStep("form"); }}
          className="w-full py-3.5 rounded-2xl font-bold text-sm border border-rose-700/40 text-rose-400 hover:bg-rose-950/30 transition-all">
          다시 분석하기
        </button>
      </div>
    </main>
  );
}

export default function HotCompatPage() {
  return <HotCompatContent />;
}

"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import {
  getDayPillar, analyzeSaju, getUunseong, getSipseong,
  CHEONGAN_ELEMENT, JIJI_BONGI,
  type SajuResult,
} from "@/lib/saju";
import { loadSajuData } from "@/lib/savedSaju";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";
import StarShower from "@/components/StarShower";

export const dynamic = "force-dynamic";

type Step = "splash" | "input" | "result";
type CalType = "solar" | "lunar";

const EVENT_TYPES = [
  { id: "이사", label: "이사일", icon: "🏠", desc: "새 집으로 이동하는 날" },
  { id: "결혼", label: "결혼·혼인신고", icon: "💍", desc: "인생 최고의 날 선택" },
  { id: "시험", label: "시험·면접", icon: "📝", desc: "중요한 시험·면접일" },
  { id: "개업", label: "개업·창업", icon: "🏪", desc: "사업 시작일" },
  { id: "계약", label: "계약·서류", icon: "📋", desc: "중요 계약·서명일" },
  { id: "수술", label: "수술·시술", icon: "🏥", desc: "수술·의료 시술일" },
  { id: "여행", label: "여행 출발", icon: "✈️", desc: "여행·출장 출발일" },
  { id: "투자", label: "투자·거래", icon: "💰", desc: "주식·부동산 계약일" },
  { id: "연애", label: "연애 시작", icon: "💑", desc: "고백·첫 만남일" },
  { id: "임신", label: "임신 준비", icon: "🌱", desc: "임신·출산 준비 시작일" },
];

const DAYS_LABEL = ["일", "월", "화", "수", "목", "금", "토"];

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={className} style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(18px)", transition: `opacity 0.8s ease ${delay}ms, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>
      {children}
    </div>
  );
}


const UUNS_SCORE: Record<string, number> = {
  제왕: 3, 건록: 2, 장생: 2, 관대: 1, 양: 1,
  목욕: 0, 태: 0, 쇠: -1,
  병: -1, 사: -3, 묘: -2, 절: -2,
};

// 조후(調候)용신 보정 — 태어난 월의 계절에 따라 필요한 오행 판단
function johuBonus(birthMonthJj: string, dp: { cg: string; jj: string }): number {
  const cgEl = CHEONGAN_ELEMENT[dp.cg] ?? "";
  const jjEl = CHEONGAN_ELEMENT[JIJI_BONGI[dp.jj] ?? ""] ?? "";
  const hasEl = (el: string) => cgEl === el || jjEl === el;

  // 봄(인·묘·진): 화(火) 용신 — 아직 춥고 목화 기운 필요
  if (["인", "묘", "진"].includes(birthMonthJj)) {
    if (hasEl("화")) return 1;
    if (hasEl("수")) return -1;
  }
  // 여름(사·오·미): 수(水) 용신 — 열기를 식힐 수·금 필요
  if (["사", "오", "미"].includes(birthMonthJj)) {
    if (hasEl("수")) return 1;
    if (hasEl("화")) return -1;
  }
  // 가을(신·유·술): 화(火) 용신 — 금기가 강해 화로 균형
  if (["신", "유", "술"].includes(birthMonthJj)) {
    if (hasEl("화")) return 1;
    if (hasEl("금")) return -1;
  }
  // 겨울(해·자·축): 화(火) 필수 — 혹한기, 화기 있는 날이 매우 길
  if (["해", "자", "축"].includes(birthMonthJj)) {
    if (hasEl("화")) return 2;
    if (hasEl("수")) return -1;
  }
  return 0;
}

function scoreDay(userIlgan: string, dp: { cg: string; jj: string }, eventId: string, birthMonthJj?: string): number {
  const uuns = getUunseong(userIlgan, dp.jj);
  let score = UUNS_SCORE[uuns] ?? 0;
  const cgEl = CHEONGAN_ELEMENT[dp.cg] ?? "토";
  const jjEl = CHEONGAN_ELEMENT[JIJI_BONGI[dp.jj] ?? ""] ?? "토";

  // 조후용신 보정 적용
  if (birthMonthJj) score += johuBonus(birthMonthJj, dp);

  switch (eventId) {
    case "이사":
      if (cgEl === "목" || jjEl === "목") score += 1;
      if (cgEl === "토" || jjEl === "토") score -= 1;
      if (["인", "묘"].includes(dp.jj)) score += 1;
      if (["진", "술", "축", "미"].includes(dp.jj)) score -= 1;
      break;
    case "결혼":
      if (["자", "오", "묘", "유"].includes(dp.jj)) score += 1;
      if (cgEl === "화") score += 1;
      if (["사", "묘", "절"].includes(uuns)) score -= 1;
      break;
    case "시험":
      if (cgEl === "화" || cgEl === "수") score += 1;
      if (cgEl === "토") score -= 1;
      if (uuns === "건록" || uuns === "제왕") score += 1;
      break;
    case "개업":
      if (["장생", "건록", "제왕"].includes(uuns)) score += 1;
      if (["사", "묘", "절"].includes(uuns)) score -= 1;
      if (cgEl === "목" || cgEl === "화") score += 1;
      break;
    case "계약":
      if (cgEl === "금") score += 1;
      if (uuns === "절") score -= 1;
      if (["건록", "제왕"].includes(uuns)) score += 1;
      break;
    case "수술":
      if (["사", "묘", "절"].includes(uuns)) score -= 2;
      if (["장생", "건록"].includes(uuns)) score += 1;
      if (jjEl === "금") score += 1;
      break;
    case "여행":
      if (["인", "신", "사", "해"].includes(dp.jj)) score += 1; // 역마 지지
      if (cgEl === "수") score += 1;
      if (["묘", "절"].includes(uuns)) score -= 1;
      break;
    case "투자":
      if (cgEl === "금" || cgEl === "수") score += 1;
      if (["사", "묘", "절"].includes(uuns)) score -= 1;
      if (["건록", "제왕"].includes(uuns)) score += 1;
      break;
    case "연애":
      if (["자", "오", "묘", "유"].includes(dp.jj)) score += 2; // 도화
      if (cgEl === "화") score += 1;
      if (["절", "사"].includes(uuns)) score -= 1;
      break;
    case "임신":
      if (cgEl === "목" || cgEl === "수") score += 1;
      if (["장생", "양"].includes(uuns)) score += 1;
      if (["사", "절"].includes(uuns)) score -= 2;
      break;
  }
  return score;
}

function classify(score: number): "길" | "보통" | "흉" {
  if (score >= 2) return "길";
  if (score <= -2) return "흉";
  return "보통";
}

const DAY_COLOR: Record<string, { bg: string; text: string; dot: string; ring: string }> = {
  길: { bg: "rgba(16,185,129,0.15)", text: "#34d399", dot: "#10b981", ring: "rgba(16,185,129,0.4)" },
  보통: { bg: "rgba(255,255,255,0.03)", text: "rgba(255,255,255,0.6)", dot: "rgba(255,255,255,0.15)", ring: "rgba(255,255,255,0.1)" },
  흉: { bg: "rgba(239,68,68,0.1)", text: "#f87171", dot: "#ef4444", ring: "rgba(239,68,68,0.3)" },
};

function daysInMonth(y: number, m: number) { return new Date(y, m, 0).getDate(); }
function firstDow(y: number, m: number) { return new Date(y, m - 1, 1).getDay(); }

const CG_HANJA: Record<string, string> = {
  갑:"甲", 을:"乙", 병:"丙", 정:"丁", 무:"戊", 기:"己", 경:"庚", 신:"辛", 임:"壬", 계:"癸",
};
const JJ_HANJA: Record<string, string> = {
  자:"子", 축:"丑", 인:"寅", 묘:"卯", 진:"辰", 사:"巳", 오:"午", 미:"未", 신:"申", 유:"酉", 술:"戌", 해:"亥",
};
const JIJANGAN_DISP: Record<string, Array<{stem: string; role: string}>> = {
  자:[{stem:"임",role:"여"},{stem:"계",role:"정"}],
  축:[{stem:"계",role:"여"},{stem:"신",role:"중"},{stem:"기",role:"정"}],
  인:[{stem:"무",role:"여"},{stem:"병",role:"중"},{stem:"갑",role:"정"}],
  묘:[{stem:"갑",role:"여"},{stem:"을",role:"정"}],
  진:[{stem:"을",role:"여"},{stem:"계",role:"중"},{stem:"무",role:"정"}],
  사:[{stem:"무",role:"여"},{stem:"경",role:"중"},{stem:"병",role:"정"}],
  오:[{stem:"병",role:"여"},{stem:"기",role:"중"},{stem:"정",role:"정"}],
  미:[{stem:"정",role:"여"},{stem:"을",role:"중"},{stem:"기",role:"정"}],
  신:[{stem:"무",role:"여"},{stem:"임",role:"중"},{stem:"경",role:"정"}],
  유:[{stem:"경",role:"여"},{stem:"신",role:"정"}],
  술:[{stem:"신",role:"여"},{stem:"정",role:"중"},{stem:"무",role:"정"}],
  해:[{stem:"무",role:"여"},{stem:"갑",role:"중"},{stem:"임",role:"정"}],
};

const EL_COLOR: Record<string, string> = {
  목: "#4ade80", 화: "#f87171", 토: "#fbbf24", 금: "#94a3b8", 수: "#60a5fa",
};
const EL_BG: Record<string, string> = {
  목: "rgba(74,222,128,0.15)", 화: "rgba(248,113,113,0.15)", 토: "rgba(251,191,36,0.12)", 금: "rgba(148,163,184,0.15)", 수: "rgba(96,165,250,0.15)",
};

const CURRENT_YEAR = 2026;
const YEAR_OPTS = Array.from({ length: CURRENT_YEAR - 1929 }, (_, i) => CURRENT_YEAR - i);
const MONTH_OPTS = Array.from({ length: 12 }, (_, i) => i + 1);

export default function CalendarPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("splash");
  const [showBtn, setShowBtn] = useState(false);
  const [counter] = useState(() => {
    const kstH = new Date(Date.now() + 9 * 3600 * 1000).getUTCHours();
    const isNight = kstH >= 23 || kstH < 7;
    return isNight ? 52 + Math.floor(Math.random() * 29) : 170 + Math.floor(Math.random() * 61);
  });

  // form state
  const [name, setName] = useState("");
  const [form, setForm] = useState<BirthFormData>(defaultBirthData("female"));
  const [selectedEvent, setSelectedEvent] = useState("");
  const [formError, setFormError] = useState("");

  // result state
  const [userIlgan, setUserIlgan] = useState<string | null>(null);
  const [userMonthJj, setUserMonthJj] = useState<string | null>(null);
  const [sajuResult, setSajuResult] = useState<SajuResult | null>(null);
  const [viewYear, setViewYear] = useState(CURRENT_YEAR);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<{ day: number; dp: { cg: string; jj: string }; score: number; uuns: string } | null>(null);

  const [isPaid, setIsPaid] = useState(false);
  const [blueberries, setBlueberries] = useState(0);
  const [showering, setShowering] = useState(false);

  // Compute 3 months upfront so handleUnlock can reference them
  const todayDate = new Date();
  const months: { year: number; month: number }[] = Array.from({ length: 3 }, (_, i) => {
    const d = new Date(todayDate.getFullYear(), todayDate.getMonth() + i, 1);
    return { year: d.getFullYear(), month: d.getMonth() + 1 };
  });

  useEffect(() => { const t = setTimeout(() => setShowBtn(true), 2500); return () => clearTimeout(t); }, []);

  useEffect(() => {
    setIsPaid(localStorage.getItem("sp_admin") === "true" || localStorage.getItem("sp_calendar_paid") === "true");
    const bb = parseInt(localStorage.getItem("sp_blueberries") ?? "0", 10);
    setBlueberries(isNaN(bb) ? 0 : bb);

    // Restore session after payment redirect
    const sess = sessionStorage.getItem("sp_calendar_session");
    if (sess) {
      try {
        const d = JSON.parse(sess);
        if (d.name) setName(d.name);
        if (d.form) setForm(d.form);
        if (d.selectedEvent) setSelectedEvent(d.selectedEvent);
        if (d.userIlgan) {
          setUserIlgan(d.userIlgan);
          if (d.userMonthJj) setUserMonthJj(d.userMonthJj);
          const now = new Date();
          setViewYear(now.getFullYear());
          setViewMonth(now.getMonth() + 1);
          setStep("result");
        }
        sessionStorage.removeItem("sp_calendar_session");
      } catch {}
    } else {
      const saved = loadSajuData();
      if (saved && saved.birthYear) {
        setForm((prev: BirthFormData) => ({
          ...prev,
          ...(saved.gender ? { gender: saved.gender as "male" | "female" } : {}),
          birthYear: saved.birthYear,
          birthMonth: saved.birthMonth || prev.birthMonth,
          birthDay: saved.birthDay || prev.birthDay,
        }));
        if (saved.name) setName(saved.name);
      }
    }
  }, []);

  async function handleAnalyze() {
    if (!form.birthYear || !form.birthMonth || !form.birthDay) { setFormError("생년월일을 모두 입력해주세요."); return; }
    if (!selectedEvent) { setFormError("궁금한 날짜 종류를 선택해주세요."); return; }
    setFormError("");

    let fy = Number(form.birthYear), fm = Number(form.birthMonth), fd = Number(form.birthDay);
    if (form.calendarType === "lunar") {
      try {
        const KLC = (await import("korean-lunar-calendar")).default;
        const klc = new KLC();
        klc.setLunarDate(fy, fm, fd, form.isLeapMonth);
        const sol = klc.getSolarCalendar();
        if (sol?.year) { fy = sol.year; fm = sol.month; fd = sol.day; }
      } catch {}
    }

    try {
      const r = analyzeSaju({
        birthYear: fy, birthMonth: fm, birthDay: fd,
        birthHour: form.birthHour, birthMinute: form.birthMinute ?? 0,
        name: name || "나", gender: form.gender, birthPlace: form.city || "서울",
        style: "auto", productType: "report", useJajasi: form.useJajasi,
      });
      setUserIlgan(r.pillarsDetail.day.cg);
      setUserMonthJj(r.pillarsDetail.month.jj);
      setSajuResult(r);
      const now = new Date();
      setViewYear(now.getFullYear());
      setViewMonth(now.getMonth() + 1);
      setSelectedDay(null);
      setStep("result");
    } catch {
      setFormError("분석 오류. 날짜를 확인해주세요.");
    }
  }

  function handleUnlock() {
    sessionStorage.setItem("sp_calendar_session", JSON.stringify({
      name, form, selectedEvent, userIlgan, userMonthJj,
    }));
    const orderId = `cal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    router.push(`/calendar/pay?orderId=${orderId}`);
  }

  const eventInfo = EVENT_TYPES.find(e => e.id === selectedEvent);

  // ── SPLASH ───────────────────────────────────────────────────────────────────
  if (step === "splash") return (
    <main className="min-h-screen bg-[#06060e] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <BackButton />
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}.pulse{animation:pulse 2s ease-in-out infinite}`}</style>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-900/15 blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-900/15 blur-[130px]" />
      </div>

      <button onClick={() => router.push("/")} className="fixed top-5 left-5 z-20 text-base text-gray-700 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 홈</button>

      <div className="relative z-10 max-w-xl w-full text-center">
        <FadeIn delay={0} className="mb-6">
          <div className="flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5">
              <span className="pulse w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span className="text-base font-bold text-emerald-300 tracking-widest uppercase">Summer Palace · 길일 선택</span>
            </div>
            <div className="text-7xl drop-shadow-[0_0_40px_rgba(16,185,129,0.4)]">📅</div>
          </div>
        </FadeIn>

        <FadeIn delay={100} className="mb-8">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse" />
            <span className="text-lg font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
              지금 <strong className="text-white">{counter.toLocaleString()}명</strong>이 길일·흉일 확인 중
            </span>
          </div>
        </FadeIn>

        <div className="space-y-4 mb-12">
          {[
            { text: "이사·결혼·수술…", big: false, delay: 200 },
            { text: "날짜가 결과를 바꿉니다.", big: true, delay: 700 },
            { text: "사주에 맞는 날을 골라야", big: false, delay: 1200 },
            { text: "기운이 따릅니다.", big: true, delay: 1700 },
          ].map((line, i) => (
            <FadeIn key={i} delay={line.delay}>
              <p className={`leading-snug ${line.big
                ? "text-5xl font-black bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent"
                : "text-3xl text-gray-400 font-medium"}`}>
                {line.text}
              </p>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={2100} className="mb-8">
          <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
            {EVENT_TYPES.slice(0, 4).map(e => (
              <div key={e.id} className="rounded-xl p-3 text-left" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-2xl">{e.icon}</span>
                <p className="text-base font-bold text-white mt-1">{e.label}</p>
                <p className="text-[14px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{e.desc}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        <div style={{ opacity: showBtn ? 1 : 0, transform: showBtn ? "none" : "translateY(20px) scale(0.96)", transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1)" }}>
          <button onClick={() => setStep("input")}
            className="w-full max-w-xs mx-auto block font-bold py-5 px-10 rounded-2xl text-2xl shadow-2xl transition-all active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)", color: "#fff", boxShadow: "0 8px 32px -4px rgba(5,150,105,0.45)" }}>
            길일·흉일 확인하기 →
          </button>
          <p className="text-base text-gray-600 mt-4">이번 달 무료 · 다음 2개월은 ₩990</p>
        </div>
      </div>
    </main>
  );

  // ── INPUT ─────────────────────────────────────────────────────────────────────
  if (step === "input") return (
    <main className="min-h-screen bg-[#06060e] text-white pb-20">
      <BackButton />
      <style>{`select option{background:#0d0d1a;color:#fff}`}</style>
      <div className="max-w-2xl mx-auto px-5 pt-8">
        <h2 className="text-4xl font-black text-white mb-1">길일·흉일 확인</h2>
        <p className="text-lg mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>생년월일시와 날짜 종류를 입력하세요</p>

        <div className="space-y-5">
          {/* 이름 */}
          <div>
            <label className="block text-base text-white/50 mb-2 font-semibold uppercase tracking-wider">이름 <span className="text-[14px] font-normal normal-case text-white/25">(선택)</span></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="홍길동"
              className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-3 text-white text-base placeholder-white/20 focus:outline-none focus:border-emerald-500/50" />
          </div>

          {/* 사주 입력 폼 */}
          <BirthInputForm value={form} onChange={setForm} accent="#06b6d4" />

          {/* 날짜 종류 */}
          <div>
            <label className="block text-sm text-white/50 mb-2 font-semibold uppercase tracking-wider">궁금한 날짜 <span className="text-emerald-400">*</span></label>
            <p className="text-[13px] text-white/25 mb-3">출생일은 선택할 수 없습니다</p>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_TYPES.map(e => (
                <button key={e.id} onClick={() => setSelectedEvent(e.id)}
                  className="flex items-center gap-2 px-3 py-3 rounded-xl border text-base font-semibold text-left transition"
                  style={{
                    borderColor: selectedEvent === e.id ? "#10b981" : "rgba(255,255,255,0.1)",
                    background: selectedEvent === e.id ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)",
                    color: selectedEvent === e.id ? "#34d399" : "rgba(255,255,255,0.55)",
                  }}>
                  <span className="text-xl shrink-0">{e.icon}</span>
                  <span className="leading-tight text-sm">{e.label}</span>
                </button>
              ))}
            </div>
          </div>

          {formError && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{formError}</p>}

          <button onClick={handleAnalyze}
            className="w-full py-5 rounded-2xl font-black text-xl text-white transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #059669, #0d9488)", boxShadow: "0 8px 32px rgba(5,150,105,0.4)" }}>
            길일·흉일 확인 →
          </button>
        </div>
      </div>
    </main>
  );

  // ── RESULT ────────────────────────────────────────────────────────────────────
  const today = todayDate;

  return (
    <main className="min-h-screen bg-[#06060e] text-white pb-24">
      <BackButton />
      <StarShower active={showering} />
      <div className="max-w-2xl mx-auto px-4 pt-8">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl font-black text-white">
              {name ? `${name}의 ` : ""}{eventInfo?.icon} {eventInfo?.label} 길일
            </h1>
            <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              일간 <strong className="text-white">{userIlgan}</strong> 기준 · 향후 3개월
            </p>
          </div>
        </div>

        {/* 원국 (原局) */}
        {sajuResult && (() => {
          const ilgan = sajuResult.pillarsDetail.day.cg;
          const pillars = [
            { label: "연주", pd: sajuResult.pillarsDetail.year },
            { label: "월주", pd: sajuResult.pillarsDetail.month },
            { label: "일주", pd: sajuResult.pillarsDetail.day },
            ...(sajuResult.pillarsDetail.hour ? [{ label: "시주", pd: sajuResult.pillarsDetail.hour! }] : []),
          ];
          // display order: 시주·일주·월주·연주 (right-to-left reading, but we show left-to-right as 시·일·월·연 in Korean apps)
          // Reference app shows 시→일→월→연 from left, so reverse to match
          const orderedPillars = [...pillars].reverse();

          return (
            <div className="mb-6 rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-1 h-5 rounded-full" style={{ background: "linear-gradient(to bottom, #a78bfa, #60a5fa)" }} />
                <h2 className="text-base font-black text-white tracking-wide">원국 <span className="text-xs font-normal" style={{ color: "rgba(255,255,255,0.35)" }}>(原局)</span></h2>
              </div>

              <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${orderedPillars.length}, 1fr)` }}>
                {orderedPillars.map(({ label, pd }) => {
                  const cgEl = CHEONGAN_ELEMENT[pd.cg] ?? "토";
                  const jjEl = CHEONGAN_ELEMENT[JIJI_BONGI[pd.jj] ?? ""] ?? "토";
                  const sipCg = getSipseong(ilgan, pd.cg);
                  const sipJj = getSipseong(ilgan, JIJI_BONGI[pd.jj] ?? "");
                  const jzList = JIJANGAN_DISP[pd.jj] ?? [];

                  return (
                    <div key={label} className="flex flex-col items-center gap-1">
                      {/* 기둥 레이블 */}
                      <span className="text-[11px] font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>{label}</span>

                      {/* 천간 */}
                      <div className="w-full flex flex-col items-center">
                        <span className="text-[11px] font-bold mb-0.5" style={{ color: EL_COLOR[cgEl] }}>{sipCg || "─"}</span>
                        <div className="w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 min-w-0"
                          style={{ background: EL_BG[cgEl], border: `1px solid ${EL_COLOR[cgEl]}40` }}>
                          <span className="font-black leading-none" style={{ fontSize: "clamp(1.4rem,5vw,2rem)", color: EL_COLOR[cgEl] }}>
                            {CG_HANJA[pd.cg] ?? pd.cg}
                          </span>
                          <span className="text-[11px] leading-none" style={{ color: "rgba(255,255,255,0.5)" }}>{pd.cg}</span>
                        </div>
                      </div>

                      {/* 지지 */}
                      <div className="w-full flex flex-col items-center">
                        <div className="w-full aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 min-w-0"
                          style={{ background: EL_BG[jjEl], border: `1px solid ${EL_COLOR[jjEl]}40` }}>
                          <span className="font-black leading-none" style={{ fontSize: "clamp(1.4rem,5vw,2rem)", color: EL_COLOR[jjEl] }}>
                            {JJ_HANJA[pd.jj] ?? pd.jj}
                          </span>
                          <span className="text-[11px] leading-none" style={{ color: "rgba(255,255,255,0.5)" }}>{pd.jj}</span>
                        </div>
                        <span className="text-[11px] font-bold mt-0.5" style={{ color: EL_COLOR[jjEl] }}>{sipJj || "─"}</span>
                      </div>

                      {/* 지장간 */}
                      <div className="w-full rounded-lg p-1.5 flex flex-col items-center gap-1"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        {jzList.map((jz) => {
                          const jzEl = CHEONGAN_ELEMENT[jz.stem] ?? "토";
                          const jzSip = getSipseong(ilgan, jz.stem);
                          return (
                            <div key={jz.stem + jz.role} className="flex flex-col items-center leading-none gap-0.5">
                              <span className="text-[13px] font-black" style={{ color: EL_COLOR[jzEl] }}>
                                {CG_HANJA[jz.stem] ?? jz.stem}
                              </span>
                              <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>{jz.stem}</span>
                              <span className="text-[10px] font-semibold" style={{ color: EL_COLOR[jzEl] }}>{jzSip || "─"}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* 12운성 */}
                      <span className="text-[11px] font-semibold text-center leading-tight" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {pd.uunseong}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* 3개월 분석 공지 */}
        <div className="mb-5 px-4 py-3 rounded-xl text-sm flex items-start gap-2"
          style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}>
          <span style={{ color: "#e8c97a" }}>📌</span>
          <span style={{ color: "rgba(255,255,255,0.55)" }}>
            오늘 기준 <strong className="text-white">3개월</strong> ({months[0].month}월 · {months[1].month}월 · {months[2].month}월) 데이터만 분석됩니다.
            {" "}{months[0].month}월은 무료 공개, {months[1].month}~{months[2].month}월은 ₩990 결제 후 확인 가능합니다.
          </span>
        </div>

        {/* 범례 */}
        <div className="flex items-center gap-4 mb-5 px-4 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {[
            { label: "길일", color: "#34d399", dot: "#10b981" },
            { label: "보통", color: "rgba(255,255,255,0.5)", dot: "rgba(255,255,255,0.2)" },
            { label: "흉일", color: "#f87171", dot: "#ef4444" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: l.dot }} />
              <span className="text-sm font-semibold" style={{ color: l.color }}>{l.label}</span>
            </div>
          ))}
          <span className="ml-auto text-[12px]" style={{ color: "rgba(255,255,255,0.3)" }}>클릭 → 상세</span>
        </div>

        {/* 3개월 캘린더 */}
        {months.map(({ year, month }, monthIdx) => {
          const dim = daysInMonth(year, month);
          const fdow = firstDow(year, month);
          const cells: (number | null)[] = [...Array(fdow).fill(null), ...Array.from({ length: dim }, (_, i) => i + 1)];
          while (cells.length % 7 !== 0) cells.push(null);
          const isLocked = monthIdx > 0 && !isPaid;

          return (
            <div key={`${year}-${month}`} className="mb-8 relative">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-black text-white">{year}년 {month}월</h2>
                <span className="text-[12px] px-2 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)" }}>
                  {eventInfo?.icon} {eventInfo?.label}
                </span>
              </div>

              <div className="grid grid-cols-7 mb-1">
                {DAYS_LABEL.map((d, i) => (
                  <div key={d} className="text-center text-[12px] font-bold py-1"
                    style={{ color: i === 0 ? "#f87171" : i === 6 ? "#60a5fa" : "rgba(255,255,255,0.4)" }}>
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {cells.map((day, idx) => {
                  if (!day) return <div key={idx} className="h-16" />;
                  const dow = idx % 7;
                  const dp = getDayPillar(year, month, day);
                  const score = userIlgan ? scoreDay(userIlgan, dp, selectedEvent, userMonthJj ?? undefined) : 0;
                  const cls = userIlgan ? classify(score) : "보통";
                  const clr = DAY_COLOR[cls];
                  const uuns = userIlgan ? getUunseong(userIlgan, dp.jj) : "";
                  const isToday = year === today.getFullYear() && month === today.getMonth() + 1 && day === today.getDate();
                  const isPast = new Date(year, month - 1, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                  const isSelected = selectedDay?.day === day && viewYear === year && viewMonth === month;

                  return (
                    <div key={idx}
                      onClick={() => {
                        if (isPast) return;
                        setSelectedDay(isSelected ? null : { day, dp, score, uuns });
                        setViewYear(year); setViewMonth(month);
                      }}
                      className={`h-16 rounded-lg relative overflow-hidden transition-all ${isPast ? "opacity-30 cursor-default" : "cursor-pointer"}`}
                      style={{
                        background: isSelected ? `${clr.bg}` : isPast ? "rgba(255,255,255,0.02)" : cls === "길" ? clr.bg : cls === "흉" ? clr.bg : "rgba(255,255,255,0.03)",
                        border: isSelected ? `1px solid ${clr.ring}` : isToday ? "1px solid rgba(201,168,76,0.5)" : "1px solid transparent",
                        boxShadow: cls === "길" && !isPast ? `0 0 8px rgba(16,185,129,0.2)` : "none",
                      }}>
                      <div className="p-1.5 flex flex-col items-center justify-center h-full gap-0.5">
                        <span className="text-[13px] font-bold leading-none"
                          style={{ color: dow === 0 ? "#f87171" : dow === 6 ? "#60a5fa" : isToday ? "#e8c97a" : "rgba(255,255,255,0.7)" }}>
                          {day}
                        </span>
                        {!isPast && (
                          <>
                            <span className="text-[12px] font-black leading-none" style={{ color: clr.text }}>
                              {dp.cg}{dp.jj}
                            </span>
                            <div className="w-2 h-2 rounded-full" style={{ background: clr.dot }} />
                            {uuns && cls !== "보통" && (
                              <span className="text-[10px] leading-none" style={{ color: clr.text }}>{uuns}</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 잠금 오버레이 */}
              {isLocked && (
                <div className="absolute inset-0 rounded-lg flex flex-col items-center justify-center z-10"
                  style={{ backdropFilter: "blur(6px)", background: "rgba(6,6,14,0.75)", border: "1px solid rgba(201,168,76,0.2)" }}>
                  <div className="text-center px-6">
                    <div className="text-4xl mb-2">🔒</div>
                    <p className="text-base font-black text-white mb-1">{month}월 길일·흉일</p>
                    <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>결제 후 즉시 확인 가능</p>
                    {blueberries >= 990 ? (
                      <button
                        onClick={() => {
                          setShowering(true);
                          const next = blueberries - 990;
                          localStorage.setItem("sp_blueberries", String(next));
                          localStorage.setItem("sp_calendar_paid", "true");
                          setBlueberries(next);
                          setTimeout(() => { setIsPaid(true); setShowering(false); }, 700);
                        }}
                        className="px-6 py-3 rounded-xl font-black text-base transition-all active:scale-95"
                        style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "#fff", boxShadow: "0 4px 20px rgba(99,102,241,0.4)" }}>
                        ✦ 별조각 뿌리고 보기 (990개)
                      </button>
                    ) : (
                      <button onClick={handleUnlock}
                        className="px-6 py-3 rounded-xl font-black text-base transition-all active:scale-95"
                        style={{ background: "linear-gradient(135deg, #059669, #0d9488)", color: "#fff", boxShadow: "0 4px 20px rgba(5,150,105,0.4)" }}>
                        ₩990 결제하기
                      </button>
                    )}
                    <p className="text-[12px] mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>한 번 결제로 {months[1].month}~{months[2].month}월 전체 잠금 해제</p>
                  </div>
                </div>
              )}

              {/* 선택된 날 상세 */}
              {!isLocked && selectedDay && viewYear === year && viewMonth === month && (
                <div className="mt-3 rounded-2xl p-5"
                  style={{
                    background: selectedDay.score >= 2 ? "rgba(16,185,129,0.1)" : selectedDay.score <= -2 ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${selectedDay.score >= 2 ? "rgba(16,185,129,0.3)" : selectedDay.score <= -2 ? "rgba(239,68,68,0.25)" : "rgba(255,255,255,0.1)"}`,
                  }}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>{year}년 {month}월 {selectedDay.day}일</p>
                      <p className="text-3xl font-black mt-1" style={{ color: classify(selectedDay.score) === "길" ? "#34d399" : classify(selectedDay.score) === "흉" ? "#f87171" : "rgba(255,255,255,0.8)" }}>
                        {classify(selectedDay.score) === "길" ? "✨ 길일" : classify(selectedDay.score) === "흉" ? "⚠️ 흉일" : "☁️ 보통"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>일주</p>
                      <p className="text-2xl font-black text-white">{selectedDay.dp.cg}{selectedDay.dp.jj}</p>
                      {selectedDay.uuns && <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{selectedDay.uuns}</p>}
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {classify(selectedDay.score) === "길"
                      ? `${eventInfo?.label}에 유리한 날입니다. 12운성 ${selectedDay.uuns}의 기운이 강하게 작용합니다. 오전~오후 초를 활용하세요.`
                      : classify(selectedDay.score) === "흉"
                      ? `${eventInfo?.label}에 불리한 날입니다. ${selectedDay.uuns ? `12운성 ${selectedDay.uuns}` : "기운"}이 약해져 있어 중요한 결정을 피하는 것이 좋습니다.`
                      : `무난한 날입니다. 큰 길흉은 없으나 특별히 유리하지도 않습니다. 길일을 기다릴 여유가 있다면 녹색 날을 선택하세요.`}
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {/* 안내 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-sm font-semibold mb-2 text-white">📌 길일 선택 안내</p>
          <ul className="space-y-1.5 text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            <li>• 일간 <strong className="text-white">{userIlgan}</strong> · 월지 <strong className="text-white">{userMonthJj}</strong> 기준 12운성·조후용신·오행을 종합 분석했습니다</li>
            <li>• 조후(調候)용신 — 태어난 계절에 필요한 오행이 있는 날을 우선 추천합니다</li>
            <li>• 길일이라도 음력 손 없는 날과 함께 확인하면 더욱 좋습니다</li>
            <li>• 흉일은 가급적 피하되, 불가피하다면 오전 시간을 활용하세요</li>
            <li>• 본 결과는 사주 이론 기반 참고용입니다</li>
          </ul>
        </div>

        <button onClick={() => setStep("input")}
          className="w-full py-3 rounded-xl text-base font-semibold transition"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
          다른 날짜 종류로 다시 보기
        </button>
      </div>
    </main>
  );
}

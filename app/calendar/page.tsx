"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getDayPillar, analyzeSaju, getUunseong,
  CHEONGAN_ELEMENT, JIJI_BONGI,
} from "@/lib/saju";
import { loadSajuData } from "@/lib/savedSaju";
import BirthTimePicker, { type BirthTimeValue } from "@/components/BirthTimePicker";

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

function DropPick({ value, opts, onChange, placeholder, suffix, accentColor = "#a78bfa" }: {
  value: string; opts: { v: string; label: string }[];
  onChange: (v: string) => void; placeholder: string; suffix?: string; accentColor?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
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
        className="flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer select-none transition text-sm"
        style={{ borderColor: open ? accentColor : "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)" }}>
        <span className={display ? "text-white" : "text-gray-500"}>
          {display ? `${display}${suffix ? " " + suffix : ""}` : placeholder}
        </span>
        <span className="text-gray-500 text-xs" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
      </div>
      {open && (
        <div ref={list} className="absolute z-50 w-full mt-1 rounded-xl overflow-y-auto shadow-2xl" style={{ maxHeight: 220, background: "#12121e", border: "1px solid rgba(255,255,255,0.2)" }}>
          {opts.map(o => (
            <div key={o.v} data-v={o.v} onClick={() => { onChange(o.v); setOpen(false); }}
              className="px-4 py-2.5 text-sm cursor-pointer transition-colors"
              style={{ color: value === o.v ? accentColor : "rgba(255,255,255,0.65)", background: value === o.v ? "rgba(167,139,250,0.12)" : "transparent", fontWeight: value === o.v ? 600 : 400 }}>
              {o.label}{suffix ? ` ${suffix}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const UUNS_SCORE: Record<string, number> = {
  제왕: 3, 건록: 2, 장생: 2, 관대: 1, 양: 1,
  목욕: 0, 태: 0, 쇠: -1,
  병: -1, 사: -3, 묘: -2, 절: -2,
};

function scoreDay(userIlgan: string, dp: { cg: string; jj: string }, eventId: string): number {
  const uuns = getUunseong(userIlgan, dp.jj);
  let score = UUNS_SCORE[uuns] ?? 0;
  const cgEl = CHEONGAN_ELEMENT[dp.cg] ?? "토";
  const jjEl = CHEONGAN_ELEMENT[JIJI_BONGI[dp.jj] ?? ""] ?? "토";

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
    return isNight ? 28 + Math.floor(Math.random() * 11) : 92 + Math.floor(Math.random() * 17);
  });

  // form state
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("female");
  const [calType, setCalType] = useState<CalType>("solar");
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [birthYear, setBirthYear] = useState(0);
  const [birthMonth, setBirthMonth] = useState(0);
  const [birthDay, setBirthDay] = useState(0);
  const [birthTime, setBirthTime] = useState<BirthTimeValue>({ hour: null, minute: null, unknown: true, useJajasi: false });
  const [selectedEvent, setSelectedEvent] = useState("");
  const [formError, setFormError] = useState("");

  // result state
  const [userIlgan, setUserIlgan] = useState<string | null>(null);
  const [viewYear, setViewYear] = useState(CURRENT_YEAR);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<{ day: number; dp: { cg: string; jj: string }; score: number; uuns: string } | null>(null);

  const [isPaid, setIsPaid] = useState(false);
  const [blueberries, setBlueberries] = useState(0);

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
        if (d.gender) setGender(d.gender);
        if (d.calType) setCalType(d.calType);
        if (d.isLeapMonth !== undefined) setIsLeapMonth(d.isLeapMonth);
        if (d.birthYear) setBirthYear(d.birthYear);
        if (d.birthMonth) setBirthMonth(d.birthMonth);
        if (d.birthDay) setBirthDay(d.birthDay);
        if (d.birthTime) setBirthTime(d.birthTime);
        if (d.selectedEvent) setSelectedEvent(d.selectedEvent);
        if (d.userIlgan) {
          setUserIlgan(d.userIlgan);
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
        if (saved.name) setName(saved.name);
        if (saved.gender) setGender(saved.gender as "male" | "female");
        setBirthYear(saved.birthYear);
        if (saved.birthMonth) setBirthMonth(saved.birthMonth);
        if (saved.birthDay) setBirthDay(saved.birthDay);
      }
    }
  }, []);

  async function handleAnalyze() {
    if (!birthYear || !birthMonth || !birthDay) { setFormError("생년월일을 모두 입력해주세요."); return; }
    if (!selectedEvent) { setFormError("궁금한 날짜 종류를 선택해주세요."); return; }
    setFormError("");

    let fy = birthYear, fm = birthMonth, fd = birthDay;
    if (calType === "lunar") {
      try {
        // @ts-ignore
        const KLC = (await import("korean-lunar-calendar")).default;
        const cal = new KLC();
        cal.setLunarDate(fy, fm, fd, isLeapMonth);
        const sol = cal.getSolarCalendar();
        if (sol?.year) { fy = sol.year; fm = sol.month; fd = sol.day; }
      } catch {}
    }

    try {
      const r = analyzeSaju({
        birthYear: fy, birthMonth: fm, birthDay: fd,
        birthHour: birthTime.unknown ? null : birthTime.hour,
        birthMinute: birthTime.unknown ? null : birthTime.minute,
        name: name || "나", gender, birthPlace: "서울",
        style: "auto", productType: "report", useJajasi: birthTime.useJajasi,
      });
      setUserIlgan(r.pillarsDetail.day.cg);
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
      name, gender, calType, isLeapMonth, birthYear, birthMonth, birthDay,
      birthTime, selectedEvent, userIlgan,
    }));
    const orderId = `cal_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    router.push(`/calendar/pay?orderId=${orderId}`);
  }

  const eventInfo = EVENT_TYPES.find(e => e.id === selectedEvent);

  // ── SPLASH ───────────────────────────────────────────────────────────────────
  if (step === "splash") return (
    <main className="min-h-screen bg-[#06060e] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}.pulse{animation:pulse 2s ease-in-out infinite}`}</style>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-900/15 blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-900/15 blur-[130px]" />
      </div>

      <button onClick={() => router.push("/")} className="fixed top-5 left-5 z-20 text-xs text-gray-700 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 홈</button>

      <div className="relative z-10 max-w-md w-full text-center">
        <FadeIn delay={0} className="mb-6">
          <div className="flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-4 py-1.5">
              <span className="pulse w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
              <span className="text-xs font-bold text-emerald-300 tracking-widest uppercase">Summer Palace · 길일 선택</span>
            </div>
            <div className="text-5xl drop-shadow-[0_0_40px_rgba(16,185,129,0.4)]">📅</div>
          </div>
        </FadeIn>

        <FadeIn delay={100} className="mb-8">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse" />
            <span className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.6)" }}>
              지금 <strong className="text-white">{counter.toLocaleString()}명</strong>이 길일을 확인 중
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
                ? "text-3xl font-black bg-gradient-to-r from-emerald-300 via-teal-200 to-emerald-300 bg-clip-text text-transparent"
                : "text-xl text-gray-400 font-medium"}`}>
                {line.text}
              </p>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={2100} className="mb-8">
          <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
            {EVENT_TYPES.slice(0, 4).map(e => (
              <div key={e.id} className="rounded-xl p-3 text-left" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-xl">{e.icon}</span>
                <p className="text-xs font-bold text-white mt-1">{e.label}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{e.desc}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        <div style={{ opacity: showBtn ? 1 : 0, transform: showBtn ? "none" : "translateY(20px) scale(0.96)", transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1)" }}>
          <button onClick={() => setStep("input")}
            className="w-full max-w-xs mx-auto block font-bold py-5 px-10 rounded-2xl text-lg shadow-2xl transition-all active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #059669 0%, #0d9488 100%)", color: "#fff", boxShadow: "0 8px 32px -4px rgba(5,150,105,0.45)" }}>
            내 길일 찾기 →
          </button>
          <p className="text-xs text-gray-600 mt-4">이번 달 무료 · 다음 2개월은 ₩990</p>
        </div>
      </div>
    </main>
  );

  // ── INPUT ─────────────────────────────────────────────────────────────────────
  if (step === "input") return (
    <main className="min-h-screen bg-[#06060e] text-white pb-20">
      <style>{`select option{background:#0d0d1a;color:#fff}`}</style>
      <div className="max-w-lg mx-auto px-5 pt-8">
        <button onClick={() => setStep("splash")} className="text-xs text-gray-600 hover:text-gray-400 mb-6 inline-flex items-center gap-1 transition">← 뒤로</button>
        <h2 className="text-2xl font-black text-white mb-1">길일 선택</h2>
        <p className="text-sm mb-8" style={{ color: "rgba(255,255,255,0.4)" }}>생년월일시와 날짜 종류를 입력하세요</p>

        <div className="space-y-5">
          {/* 이름 */}
          <div>
            <label className="block text-xs text-white/50 mb-2 font-semibold uppercase tracking-wider">이름 <span className="text-[10px] font-normal normal-case text-white/25">(선택)</span></label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="홍길동"
              className="w-full bg-white/5 border border-white/15 rounded-xl px-3 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-500/50" />
          </div>

          {/* 양력/음력 */}
          <div>
            <label className="block text-xs text-white/50 mb-2 font-semibold uppercase tracking-wider">양력 / 음력</label>
            <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              {(["solar", "lunar"] as CalType[]).map(t => (
                <button key={t} type="button" onClick={() => { setCalType(t); setIsLeapMonth(false); }}
                  className={`flex-1 py-2.5 text-sm font-bold transition ${calType === t ? "bg-emerald-700 text-white" : "text-white/40 hover:text-white/70"}`}>
                  {t === "solar" ? "양력" : "음력"}
                </button>
              ))}
            </div>
          </div>

          {/* 생년월일 */}
          <div>
            <label className="block text-xs text-white/50 mb-2 font-semibold uppercase tracking-wider">생년월일 <span className="text-emerald-400">*</span></label>
            <div className="space-y-2">
              <DropPick value={birthYear ? String(birthYear) : ""} opts={YEAR_OPTS.map(y => ({ v: String(y), label: String(y) }))} onChange={v => setBirthYear(Number(v))} placeholder="출생 연도" suffix="년" />
              <div className="grid grid-cols-2 gap-2">
                <DropPick value={birthMonth ? String(birthMonth) : ""} opts={MONTH_OPTS.map(m => ({ v: String(m), label: String(m) }))} onChange={v => setBirthMonth(Number(v))} placeholder="월" suffix="월" />
                <DropPick value={birthDay ? String(birthDay) : ""} opts={Array.from({ length: 31 }, (_, i) => i + 1).map(d => ({ v: String(d), label: String(d) }))} onChange={v => setBirthDay(Number(v))} placeholder="일" suffix="일" />
              </div>
              {calType === "lunar" && (
                <button type="button" onClick={() => setIsLeapMonth(v => !v)}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition ${isLeapMonth ? "border-emerald-500 bg-emerald-950/30 text-emerald-300" : "border-white/10 bg-white/5 text-gray-500"}`}>
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isLeapMonth ? "border-emerald-400" : "border-gray-600"}`}>
                    {isLeapMonth && <span className="text-[10px] font-black">✓</span>}
                  </span>
                  윤달
                </button>
              )}
            </div>
          </div>

          {/* 태어난 시간 */}
          <div>
            <label className="block text-xs text-white/50 mb-2 font-semibold uppercase tracking-wider">태어난 시간</label>
            <BirthTimePicker value={birthTime} onChange={setBirthTime} accent="emerald" />
          </div>

          {/* 성별 */}
          <div>
            <label className="block text-xs text-white/50 mb-2 font-semibold uppercase tracking-wider">성별</label>
            <div className="grid grid-cols-2 gap-3">
              {(["female", "male"] as const).map(g => (
                <button key={g} onClick={() => setGender(g)}
                  className={`py-3 rounded-xl text-sm font-bold transition border ${gender === g ? "border-emerald-500 bg-emerald-950/30 text-emerald-300" : "border-white/15 bg-white/5 text-gray-400 hover:border-emerald-500/50"}`}>
                  {g === "female" ? "여성" : "남성"}
                </button>
              ))}
            </div>
          </div>

          {/* 날짜 종류 */}
          <div>
            <label className="block text-xs text-white/50 mb-2 font-semibold uppercase tracking-wider">궁금한 날짜 <span className="text-emerald-400">*</span></label>
            <p className="text-[11px] text-white/25 mb-3">출생일은 선택할 수 없습니다</p>
            <div className="grid grid-cols-2 gap-2">
              {EVENT_TYPES.map(e => (
                <button key={e.id} onClick={() => setSelectedEvent(e.id)}
                  className="flex items-center gap-2 px-3 py-3 rounded-xl border text-sm font-semibold text-left transition"
                  style={{
                    borderColor: selectedEvent === e.id ? "#10b981" : "rgba(255,255,255,0.1)",
                    background: selectedEvent === e.id ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.04)",
                    color: selectedEvent === e.id ? "#34d399" : "rgba(255,255,255,0.55)",
                  }}>
                  <span className="text-lg shrink-0">{e.icon}</span>
                  <span className="leading-tight text-xs">{e.label}</span>
                </button>
              ))}
            </div>
          </div>

          {formError && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{formError}</p>}

          <button onClick={handleAnalyze}
            className="w-full py-5 rounded-2xl font-black text-lg text-white transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #059669, #0d9488)", boxShadow: "0 8px 32px rgba(5,150,105,0.4)" }}>
            길일 찾기 →
          </button>
        </div>
      </div>
    </main>
  );

  // ── RESULT ────────────────────────────────────────────────────────────────────
  const today = todayDate;

  return (
    <main className="min-h-screen bg-[#06060e] text-white pb-24">
      <div className="max-w-lg mx-auto px-4 pt-8">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setStep("input")} className="text-gray-600 hover:text-gray-400 transition text-sm">← 다시 입력</button>
          <div className="flex-1">
            <h1 className="text-xl font-black text-white">
              {name ? `${name}의 ` : ""}{eventInfo?.icon} {eventInfo?.label} 길일
            </h1>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
              일간 <strong className="text-white">{userIlgan}</strong> 기준 · 향후 3개월
            </p>
          </div>
        </div>

        {/* 3개월 분석 공지 */}
        <div className="mb-5 px-4 py-3 rounded-xl text-xs flex items-start gap-2"
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
              <span className="text-xs font-semibold" style={{ color: l.color }}>{l.label}</span>
            </div>
          ))}
          <span className="ml-auto text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>클릭 → 상세</span>
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
                <h2 className="text-base font-black text-white">{year}년 {month}월</h2>
                <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: "rgba(16,185,129,0.1)", color: "#34d399", border: "1px solid rgba(16,185,129,0.2)" }}>
                  {eventInfo?.icon} {eventInfo?.label}
                </span>
              </div>

              <div className="grid grid-cols-7 mb-1">
                {DAYS_LABEL.map((d, i) => (
                  <div key={d} className="text-center text-[10px] font-bold py-1"
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
                  const score = userIlgan ? scoreDay(userIlgan, dp, selectedEvent) : 0;
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
                        <span className="text-[11px] font-bold leading-none"
                          style={{ color: dow === 0 ? "#f87171" : dow === 6 ? "#60a5fa" : isToday ? "#e8c97a" : "rgba(255,255,255,0.7)" }}>
                          {day}
                        </span>
                        {!isPast && (
                          <>
                            <span className="text-[10px] font-black leading-none" style={{ color: clr.text }}>
                              {dp.cg}{dp.jj}
                            </span>
                            <div className="w-2 h-2 rounded-full" style={{ background: clr.dot }} />
                            {uuns && cls !== "보통" && (
                              <span className="text-[8px] leading-none" style={{ color: clr.text }}>{uuns}</span>
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
                    <div className="text-3xl mb-2">🔒</div>
                    <p className="text-sm font-black text-white mb-1">{month}월 길일·흉일</p>
                    <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.45)" }}>결제 후 즉시 확인 가능</p>
                    {blueberries >= 990 ? (
                      <button
                        onClick={() => {
                          const next = blueberries - 990;
                          localStorage.setItem("sp_blueberries", String(next));
                          localStorage.setItem("sp_calendar_paid", "true");
                          setBlueberries(next);
                          setIsPaid(true);
                        }}
                        className="px-6 py-3 rounded-xl font-black text-sm transition-all active:scale-95"
                        style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "#fff", boxShadow: "0 4px 20px rgba(99,102,241,0.4)" }}>
                        🫐 블루베리 990개로 즉시 열기
                      </button>
                    ) : (
                      <button onClick={handleUnlock}
                        className="px-6 py-3 rounded-xl font-black text-sm transition-all active:scale-95"
                        style={{ background: "linear-gradient(135deg, #059669, #0d9488)", color: "#fff", boxShadow: "0 4px 20px rgba(5,150,105,0.4)" }}>
                        ₩990 결제 후 전체 보기
                      </button>
                    )}
                    <p className="text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.25)" }}>한 번 결제로 {months[1].month}~{months[2].month}월 전체 잠금 해제</p>
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
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{year}년 {month}월 {selectedDay.day}일</p>
                      <p className="text-2xl font-black mt-1" style={{ color: classify(selectedDay.score) === "길" ? "#34d399" : classify(selectedDay.score) === "흉" ? "#f87171" : "rgba(255,255,255,0.8)" }}>
                        {classify(selectedDay.score) === "길" ? "✨ 길일" : classify(selectedDay.score) === "흉" ? "⚠️ 흉일" : "☁️ 보통"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>일주</p>
                      <p className="text-xl font-black text-white">{selectedDay.dp.cg}{selectedDay.dp.jj}</p>
                      {selectedDay.uuns && <p className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{selectedDay.uuns}</p>}
                    </div>
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
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
          <p className="text-xs font-semibold mb-2 text-white">📌 길일 선택 안내</p>
          <ul className="space-y-1.5 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            <li>• 일간 <strong className="text-white">{userIlgan}</strong>을 기준으로 12운성·오행을 종합 분석했습니다</li>
            <li>• 길일이라도 음력 손 없는 날과 함께 확인하면 더욱 좋습니다</li>
            <li>• 흉일은 가급적 피하되, 불가피하다면 오전 시간을 활용하세요</li>
            <li>• 본 결과는 사주 이론 기반 참고용입니다</li>
          </ul>
        </div>

        <button onClick={() => setStep("input")}
          className="w-full py-3 rounded-xl text-sm font-semibold transition"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
          다른 날짜 종류로 다시 보기
        </button>
      </div>
    </main>
  );
}

"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { analyzeSaju, calcDaewoon, calcSewoon } from "@/lib/saju";
import type { DaewoonResult, SewoonItem } from "@/lib/saju";
import { loadSajuData } from "@/lib/savedSaju";
import ProfilePicker from "@/components/ProfilePicker";
import SaveProfilePrompt from "@/components/SaveProfilePrompt";
import AnalysisLoading from "@/components/AnalysisLoading";

const CY = new Date().getFullYear();
const YEARS_DW  = Array.from({ length: CY - 1919 }, (_, i) => CY - i);
const MONTHS_DW = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS_DW   = Array.from({ length: 31 }, (_, i) => i + 1);
const SIJIN_DW = [
  { v: "",   label: "모름 (시간 불명)" },
  { v: "23", label: "자시(子時) 23:00 – 00:59" },
  { v: "1",  label: "축시(丑時) 01:00 – 02:59" },
  { v: "3",  label: "인시(寅時) 03:00 – 04:59" },
  { v: "5",  label: "묘시(卯時) 05:00 – 06:59" },
  { v: "7",  label: "진시(辰時) 07:00 – 08:59" },
  { v: "9",  label: "사시(巳時) 09:00 – 10:59" },
  { v: "11", label: "오시(午時) 11:00 – 12:59" },
  { v: "13", label: "미시(未時) 13:00 – 14:59" },
  { v: "15", label: "신시(申時) 15:00 – 16:59" },
  { v: "17", label: "유시(酉時) 17:00 – 18:59" },
  { v: "19", label: "술시(戌時) 19:00 – 20:59" },
  { v: "21", label: "해시(亥時) 21:00 – 22:59" },
];

function DwPicker({ value, options, onChange, placeholder, suffix }: {
  value: string; options: {v:string;label:string}[];
  onChange: (v:string) => void; placeholder: string; suffix?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => {
    if (open && listRef.current && value) {
      const el = listRef.current.querySelector(`[data-v="${value}"]`);
      if (el) (el as HTMLElement).scrollIntoView({ block: "center" });
    }
  }, [open, value]);
  const display = options.find(o => o.v === value)?.label ?? "";
  return (
    <div ref={ref} className="relative w-full">
      <div onClick={() => setOpen(!open)}
        className={`flex items-center justify-between bg-white/5 border rounded-xl px-4 py-3 cursor-pointer transition select-none hover:border-violet-500/60 ${open ? "border-violet-500" : "border-white/10"}`}>
        <span className={display ? "text-white text-sm" : "text-gray-600 text-sm"}>
          {display ? `${display}${suffix ? " " + suffix : ""}` : placeholder}
        </span>
        <span className={`text-gray-500 text-xs transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </div>
      {open && (
        <div ref={listRef} className="absolute z-50 w-full mt-1 bg-[#12121e] border border-white/20 rounded-xl overflow-y-auto shadow-2xl" style={{ maxHeight: 200 }}>
          {options.map(opt => (
            <div key={opt.v} data-v={opt.v}
              onClick={() => { onChange(opt.v); setOpen(false); }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${value === opt.v ? "text-violet-300 bg-violet-900/50 font-semibold" : "text-gray-300 hover:bg-white/8"}`}>
              {opt.label}{suffix ? ` ${suffix}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export const dynamic = "force-dynamic";

const PRICE = 15000;

const ELEMENT_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  목: { bg: "#052e16", text: "#4ade80", border: "#14532d" },
  화: { bg: "#450a0a", text: "#f87171", border: "#7f1d1d" },
  토: { bg: "#2d1a00", text: "#fbbf24", border: "#78350f" },
  금: { bg: "#0f0e2e", text: "#a5b4fc", border: "#1e1b4b" },
  수: { bg: "#0a1f3a", text: "#60a5fa", border: "#0c2a4a" },
};

const SIPSEONG_COLOR: Record<string, string> = {
  비견:"#4ade80", 겁재:"#f87171", 식신:"#60a5fa", 상관:"#fb923c",
  편재:"#fbbf24", 정재:"#f59e0b", 편관:"#c084fc", 정관:"#a78bfa",
  편인:"#94a3b8", 정인:"#e2e8f0",
};

const UUNSEONG_FORTUNE: Record<string, { label: string; score: number; color: string; desc: string }> = {
  장생: { label:"장생★★★", score:9, color:"#4ade80", desc:"새로운 시작과 성장. 건강하고 활기찬 기운." },
  목욕: { label:"목욕★★☆", score:6, color:"#34d399", desc:"감성적이고 풍류적인 기운. 인간관계 활발." },
  관대: { label:"관대★★★", score:8, color:"#60a5fa", desc:"배움과 성장. 사회적 지위 향상 기운." },
  건록: { label:"건록★★★", score:10, color:"#818cf8", desc:"가장 안정적이고 건실한 최길 기운." },
  제왕: { label:"제왕★★★", score:10, color:"#c084fc", desc:"에너지 최고조. 성공과 지배의 기운." },
  쇠: { label:"쇠★★☆", score:5, color:"#94a3b8", desc:"기운이 꺾이는 시기. 무리하지 말고 내실을 다지세요." },
  병: { label:"병★☆☆", score:3, color:"#fb923c", desc:"몸과 마음이 지치는 기운. 건강 관리 필수." },
  사: { label:"사☆☆☆", score:1, color:"#ef4444", desc:"에너지 소진. 새 일보다 마무리와 정리가 유리." },
  묘: { label:"묘☆☆☆", score:1, color:"#dc2626", desc:"정체와 답답함. 참고 기다리는 시기." },
  절: { label:"절☆☆☆", score:2, color:"#9333ea", desc:"단절과 전환. 끝내야 할 것을 끝내는 기운." },
  태: { label:"태★★☆", score:6, color:"#fb923c", desc:"새 씨앗이 잉태되는 기운. 계획과 구상에 좋음." },
  양: { label:"양★★☆", score:7, color:"#fbbf24", desc:"서서히 자라나는 기운. 꾸준한 노력이 빛나는 시기." },
};

export default function DaewoonPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("female");
  const [birthYear, setBirthYear] = useState(1995);
  const [birthMonth, setBirthMonth] = useState(6);
  const [birthDay, setBirthDay] = useState(2);
  const [birthHour, setBirthHour] = useState<number | null>(11);
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">("solar");
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [daewoon, setDaewoon] = useState<DaewoonResult | null>(null);
  const [sewoon, setSewoon] = useState<SewoonItem[]>([]);
  const [ilgan, setIlgan] = useState("");
  const [monthJj, setMonthJj] = useState("");
  const [step, setStep] = useState<"splash" | "entry" | "loading" | "preview">("splash");
  const [isPaid, setIsPaid] = useState(false);
  const [counter] = useState(() => Math.floor(Math.random() * 400) + 1800);
  const [totalCount] = useState(() => Math.floor(Math.random() * 5000) + 28000);

  useEffect(() => {
    setIsPaid(sessionStorage.getItem("daewoonPaid") === "true");
    const saved = loadSajuData();
    if (saved) {
      // 이름은 placeholder로 표시 — 직접 입력하게
      setGender((saved.gender as "male" | "female") || "female");
      setBirthYear(saved.birthYear);
      setBirthMonth(saved.birthMonth);
      setBirthDay(saved.birthDay);
      if (saved.birthHour != null) setBirthHour(saved.birthHour);
    }
  }, []);

  async function analyze() {
    if (!birthYear || !birthMonth || !birthDay || birthYear < 1920 || birthMonth < 1 || birthDay < 1) {
      alert("생년월일을 모두 선택해주세요.");
      return;
    }
    let y = birthYear, mo = birthMonth, d = birthDay;
    if (calendarType === "lunar") {
      try {
        // @ts-ignore
        const KLC = (await import("korean-lunar-calendar")).default;
        const cal = new KLC();
        cal.setLunarDate(y, mo, d, isLeapMonth);
        const s = cal.getSolarCalendar();
        if (!s?.year) throw new Error();
        y = s.year; mo = s.month; d = s.day;
      } catch {
        alert("음력 날짜를 양력으로 변환할 수 없습니다. 날짜를 다시 확인해주세요.");
        return;
      }
    }
    try {
      const r = analyzeSaju({
        birthYear: y, birthMonth: mo, birthDay: d,
        birthHour, birthMinute: 0,
        name: name || "분석", gender,
        birthPlace: "서울", style: "auto", productType: "report", useJajasi: false,
      });
      const mp = r.pillarsDetail.month;
      const dw = calcDaewoon(y, mo, d, gender, r.pillarsDetail.day.cg, mp);
      const sw = calcSewoon(y, r.pillarsDetail.day.cg);
      setIlgan(r.pillarsDetail.day.cg);
      setMonthJj(mp.jj);
      setDaewoon(dw);
      setSewoon(sw);
      setStep("loading");
    } catch {
      alert("사주 정보를 다시 확인해주세요.");
    }
  }

  function goPay() {
    const orderId = `dw-${Date.now()}`;
    sessionStorage.setItem("daewoonData", JSON.stringify({ name, gender, birthYear, birthMonth, birthDay, birthHour }));
    router.push(`/daewoon/pay?orderId=${orderId}&amount=${PRICE}`);
  }

  // ── 로딩 ──
  if (step === "loading") return (
    <AnalysisLoading subject={`${name || ""}님의 대운·세운`} onDone={() => setStep("preview")} />
  );

  // ── 스플래시 ──
  if (step === "splash") {
    return (
      <main className="min-h-screen bg-[#06060e] text-white flex flex-col relative overflow-hidden">
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}.pulse{animation:pulse 2s ease-in-out infinite}`}</style>
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full blur-[160px]" style={{ background: "rgba(251,191,36,0.12)" }} />
          <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] rounded-full blur-[140px]" style={{ background: "rgba(192,132,252,0.1)" }} />
        </div>

        <div className="relative z-10 flex items-center px-5 py-4">
          <button onClick={() => router.push("/")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 홈</button>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 max-w-lg mx-auto w-full pb-12">

          <div className="flex items-center gap-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-yellow-400 pulse" />
            <span className="text-xs text-gray-400">지금 <strong className="text-yellow-400">{counter.toLocaleString()}명</strong>이 대운 확인 중</span>
          </div>

          <div className="mb-8 space-y-3">
            <p className="text-4xl font-black leading-tight">
              대운을 모르고<br />
              <span className="text-yellow-400">하는 결정은</span><br />
              전부 도박입니다
            </p>
            <p className="text-gray-400 text-sm leading-relaxed">
              지금 상승기인지, 침체기인지도 모른 채<br />
              투자·이직·결혼·창업을 결정하고 있습니다.<br />
              결과가 안 나오는 이유가 여기 있습니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { icon: "🌊", title: "대운 80년 흐름", desc: "10년 단위 8개 대운 전체" },
              { icon: "📅", title: "세운 14년치", desc: "연도별 상세 흐름" },
              { icon: "⏰", title: "교운기 정확 계산", desc: "첫 대운 진입 나이" },
              { icon: "🤖", title: "AI 대운 해설", desc: "대운별 인생 조언" },
            ].map(f => (
              <div key={f.title} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-2xl">{f.icon}</span>
                <p className="text-sm font-bold text-white mt-2">{f.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>

          <div className="flex gap-4 mb-8 py-4 border-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            <div className="flex-1 text-center">
              <p className="text-lg font-black text-yellow-400">{totalCount.toLocaleString()}</p>
              <p className="text-[10px] text-gray-600 mt-0.5">누적 분석</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-lg font-black text-white">★ 4.9</p>
              <p className="text-[10px] text-gray-600 mt-0.5">평균 평점</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-lg font-black text-green-400">무료</p>
              <p className="text-[10px] text-gray-600 mt-0.5">미리보기</p>
            </div>
          </div>

          <button
            onClick={() => setStep("entry")}
            className="w-full py-5 rounded-2xl font-black text-lg text-black shadow-2xl transition-all active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)" }}
          >
            내 대운 확인하기 →
          </button>
          <p className="text-center text-xs text-gray-600 mt-3">미리보기 무료 · 전체 보고서 ₩{PRICE.toLocaleString()}</p>
        </div>
      </main>
    );
  }

  // ── 입력 화면 ──
  if (step === "entry") {
    return (
      <main className="min-h-screen bg-[#06060e] text-white">
        <div className="max-w-lg mx-auto px-5 py-10 pb-24">
          <button onClick={() => setStep("splash")} className="text-xs text-gray-600 hover:text-gray-400 mb-6 inline-flex items-center gap-1 transition">← 뒤로</button>

          <div className="mb-8">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-3">
              <span className="text-xs text-gray-500 uppercase tracking-widest">Summer Palace</span>
            </div>
            <h1 className="text-2xl font-black mb-2">대운·세운 분석</h1>
            <p className="text-sm text-gray-500 leading-relaxed">
              10년 단위 대운, 연도별 세운, 교운기까지<br />
              내 인생의 큰 흐름을 한눈에 봅니다
            </p>
          </div>

          <div className="bg-gradient-to-r from-amber-950/60 to-yellow-950/60 border border-yellow-700/30 rounded-2xl p-5 mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-yellow-500 font-semibold uppercase tracking-wider">프리미엄 보고서</span>
              <span className="text-2xl font-black text-yellow-400">₩{PRICE.toLocaleString()}</span>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li className="flex items-center gap-2"><span className="text-yellow-400">✓</span> 대운 8개 전체 (80년 흐름)</li>
              <li className="flex items-center gap-2"><span className="text-yellow-400">✓</span> 연도별 세운 14년치</li>
              <li className="flex items-center gap-2"><span className="text-yellow-400">✓</span> 교운기 진입 나이 정확 계산</li>
              <li className="flex items-center gap-2"><span className="text-yellow-400">✓</span> AI 대운별 인생 조언</li>
              <li className="flex items-center gap-2"><span className="text-yellow-400">✓</span> PDF 다운로드 포함</li>
            </ul>
          </div>

          <ProfilePicker onSelect={p => {
            setName(p.name);
            setGender(p.gender);
            setBirthYear(p.birthYear);
            setBirthMonth(p.birthMonth);
            setBirthDay(p.birthDay);
            if (!p.birthHourUnknown && p.birthHour >= 0) setBirthHour(p.birthHour);
            else setBirthHour(null);
          }} />

          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 space-y-4">
            <div>
              <label className="text-xs text-gray-500 block mb-1">이름 (선택)</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="홍길동"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">성별</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as "male" | "female")}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-violet-500 transition"
              >
                <option value="female">여성</option>
                <option value="male">남성</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-2">생년월일</label>
              <div className="flex gap-2 mb-3">
                {(["solar", "lunar"] as const).map(t => (
                  <button key={t} type="button"
                    onClick={() => setCalendarType(t)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${calendarType === t ? "bg-violet-600 text-white" : "bg-white/5 text-gray-400 border border-white/10"}`}
                  >
                    {t === "solar" ? "양력" : "음력"}
                  </button>
                ))}
              </div>
              {calendarType === "lunar" && (
                <label className="flex items-center gap-2 text-xs text-gray-400 mb-3 cursor-pointer select-none">
                  <input type="checkbox" checked={isLeapMonth} onChange={e => setIsLeapMonth(e.target.checked)} className="accent-violet-500" />
                  윤달
                </label>
              )}
              <div className="grid grid-cols-3 gap-2">
                <DwPicker
                  value={String(birthYear)}
                  options={YEARS_DW.map(y => ({ v: String(y), label: String(y) }))}
                  onChange={v => setBirthYear(Number(v))}
                  placeholder="연도" suffix="년"
                />
                <DwPicker
                  value={String(birthMonth)}
                  options={MONTHS_DW.map(m => ({ v: String(m), label: String(m) }))}
                  onChange={v => setBirthMonth(Number(v))}
                  placeholder="월" suffix="월"
                />
                <DwPicker
                  value={String(birthDay)}
                  options={DAYS_DW.map(d => ({ v: String(d), label: String(d) }))}
                  onChange={v => setBirthDay(Number(v))}
                  placeholder="일" suffix="일"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">출생시간 (선택)</label>
              <DwPicker
                value={birthHour == null ? "" : String(birthHour)}
                options={SIJIN_DW}
                onChange={v => setBirthHour(v === "" ? null : Number(v))}
                placeholder="출생시간 선택 (선택)"
              />
            </div>
          </div>

          <button
            onClick={analyze}
            className="mt-6 w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 font-black text-lg text-white shadow-lg hover:opacity-90 transition-opacity"
          >
            대운·세운 미리 보기 →
          </button>
          <p className="text-center text-xs text-gray-600 mt-3">미리보기는 무료 · 상세 분석은 ₩{PRICE.toLocaleString()}</p>
        </div>
      </main>
    );
  }

  // ── 미리보기 / 결과 화면 ──
  if (!daewoon) return null;

  return (
    <main className="min-h-screen bg-[#06060e] text-white">
      <div className="max-w-lg mx-auto px-5 py-8 pb-32">
        <button onClick={() => setStep("entry")} className="text-xs text-gray-600 hover:text-gray-400 mb-6 inline-flex items-center gap-1 transition">← 다시 입력</button>

        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-widest">Summer Palace</span>
          </div>
          <h1 className="text-xl font-black">
            {name ? `${name}님의 ` : ""}대운·세운
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            일간 <strong className="text-white">{ilgan}</strong> ·
            월지 <strong className="text-white">{monthJj}</strong> ·
            {daewoon.direction} ({daewoon.direction === "순행" ? "양남/음녀" : "음남/양녀"})
          </p>
        </div>

        <SaveProfilePrompt
          name={name} birthYear={birthYear} birthMonth={birthMonth} birthDay={birthDay}
          birthHour={birthHour} birthHourUnknown={birthHour == null} gender={gender}
        />

        <div className="bg-violet-500/10 border border-violet-500/25 rounded-2xl p-4 mb-6">
          <p className="text-xs text-violet-400 font-semibold mb-1">⏰ 교운기 (첫 대운 진입)</p>
          <p className="text-2xl font-black text-violet-300">{daewoon.startAge}세</p>
          <p className="text-xs text-gray-500 mt-1">
            출생 후 {daewoon.startAge}세에 첫 대운이 시작됩니다.
            이후 10년마다 대운이 바뀌며 인생의 큰 흐름이 전환됩니다.
          </p>
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-300 mb-3">대운 흐름 (80년)</h2>
          <div className="space-y-2">
            {daewoon.pillars.map((p, i) => {
              const isCurrentDw = i === daewoon.currentIdx;
              const elStyle = ELEMENT_COLOR[p.element] || ELEMENT_COLOR["토"];
              const uunsF = UUNSEONG_FORTUNE[p.uunseong];
              const isBlurred = !isPaid && i >= 3;

              return (
                <div
                  key={i}
                  className={`rounded-xl border p-4 transition-all relative ${isCurrentDw ? "border-yellow-500/50" : ""}`}
                  style={isCurrentDw
                    ? { background: `${elStyle.bg}cc`, borderColor: "#ca8a04" }
                    : { background: `${elStyle.bg}66`, borderColor: elStyle.border }
                  }
                >
                  {isBlurred && (
                    <div className="absolute inset-0 bg-[#06060e]/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
                      <p className="text-xs text-gray-500">🔒 프리미엄 전용</p>
                    </div>
                  )}
                  {isCurrentDw && (
                    <span className="absolute top-2 right-2 text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full font-bold">현재 대운</span>
                  )}
                  <div className="flex items-start gap-4">
                    <div className="text-center min-w-[52px]">
                      <p className="text-2xl font-black" style={{ color: elStyle.text }}>{p.cg}{p.jj}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{p.age}세</p>
                      <p className="text-[10px] text-gray-600">{p.yearStart}년~</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white">{p.sipseongCg}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white">{p.sipseongJj}</span>
                        {uunsF && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${uunsF.color}22`, color: uunsF.color }}>
                            {uunsF.label}
                          </span>
                        )}
                      </div>
                      {uunsF && <p className="text-xs text-gray-400 leading-relaxed">{uunsF.desc}</p>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-300 mb-3">세운 — 연도별 흐름</h2>
          <div className="overflow-x-auto">
            <div className="flex gap-2 pb-2" style={{ minWidth: "max-content" }}>
              {sewoon.map((s, i) => {
                const elStyle = ELEMENT_COLOR[s.element] || ELEMENT_COLOR["토"];
                const uunsF = UUNSEONG_FORTUNE[s.uunseong];
                const isBlurredSw = !isPaid && i >= 4;

                return (
                  <div
                    key={s.year}
                    className="rounded-xl border p-3 min-w-[80px] text-center relative"
                    style={s.isCurrent
                      ? { background: `${elStyle.bg}cc`, borderColor: "#fbbf24" }
                      : { background: `${elStyle.bg}55`, borderColor: elStyle.border }
                    }
                  >
                    {isBlurredSw && (
                      <div className="absolute inset-0 bg-[#06060e]/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
                        <p className="text-[10px] text-gray-600">🔒</p>
                      </div>
                    )}
                    {s.isCurrent && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                        <span className="text-[9px] bg-yellow-500 text-black px-1.5 py-0.5 rounded-full font-bold">올해</span>
                      </div>
                    )}
                    <p className="text-[10px] text-gray-500 mb-1">{s.year}</p>
                    <p className="text-base font-black" style={{ color: elStyle.text }}>{s.cg}{s.jj}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{s.sipseongJj}</p>
                    {uunsF && (
                      <p className="text-[9px] mt-1 font-semibold" style={{ color: uunsF.color }}>{s.uunseong}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {!isPaid && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#06060e] via-[#06060e]/95 to-transparent">
            <div className="max-w-lg mx-auto">
              <button
                onClick={goPay}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-600 to-yellow-600 font-black text-white text-base shadow-xl hover:opacity-90 transition-opacity"
              >
                전체 보고서 + AI 해설 + PDF — ₩{PRICE.toLocaleString()}
              </button>
              <p className="text-center text-xs text-gray-600 mt-2">교운기·대운 8개 전체·세운 14년치 완전 공개</p>
            </div>
          </div>
        )}

        {isPaid && (
          <div className="bg-green-500/10 border border-green-500/25 rounded-xl p-4 text-center">
            <p className="text-green-400 font-semibold text-sm">✓ 프리미엄 보고서 활성화됨</p>
            <p className="text-xs text-gray-500 mt-1">대운 8개 전체 · 세운 14년치 · AI 해설 포함</p>
          </div>
        )}
      </div>
    </main>
  );
}

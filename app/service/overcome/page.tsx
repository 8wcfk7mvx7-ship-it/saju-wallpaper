"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { analyzeSaju } from "@/lib/saju";
import BirthTimePicker, { type BirthTimeValue } from "@/components/BirthTimePicker";

export const dynamic = "force-dynamic";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS  = Array.from({ length: CURRENT_YEAR - 1929 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS   = Array.from({ length: 31 }, (_, i) => i + 1);

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

type Step = "splash" | "input";
type CalType = "solar" | "lunar";

export default function OvercomePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("splash");
  const [year,  setYear]  = useState("");
  const [month, setMonth] = useState("");
  const [day,   setDay]   = useState("");
  const [calType, setCalType] = useState<CalType>("solar");
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [gender, setGender] = useState<"male"|"female">("female");
  const [birthTime, setBirthTime] = useState<BirthTimeValue>({ hour: null, minute: null, unknown: true, useJajasi: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [counter] = useState(() => Math.floor(Math.random() * 400) + 2800);

  async function handleAnalyze() {
    if (!year || !month || !day) { setError("생년월일을 모두 선택해주세요."); return; }
    setError("");
    setLoading(true);
    try {
      let fy = Number(year), fm = Number(month), fd = Number(day);
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
      const h = birthTime.unknown ? null : birthTime.hour;
      const min = birthTime.unknown ? null : birthTime.minute;
      const result = analyzeSaju({
        birthYear: fy, birthMonth: fm, birthDay: fd,
        birthHour: h, birthMinute: min,
        name: "", gender, birthPlace: "서울", style: "auto",
        productType: "report", useJajasi: birthTime.useJajasi,
      });
      const orderId = `overcome_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem("overcomeData", JSON.stringify({
        form: { year: Number(year), month: Number(month), day: Number(day), gender },
        result,
      }));
      router.push(`/overcome/pay?orderId=${orderId}&amount=990`);
    } catch {
      setError("분석 중 오류가 발생했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  }

  if (step === "splash") {
    return (
      <main className="min-h-screen bg-[#06060e] text-white flex flex-col relative overflow-hidden"
        style={{ animation: "fadeIn 0.45s ease-out" }}>
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}.pulse{animation:pulse 2s ease-in-out infinite}`}</style>

        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full blur-[160px]" style={{ background: "rgba(239,68,68,0.1)" }} />
          <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] rounded-full blur-[140px]" style={{ background: "rgba(139,92,246,0.08)" }} />
        </div>

        <div className="relative z-10 flex items-center px-5 py-4">
          <button onClick={() => router.push("/")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 홈</button>
          <span className="ml-3 text-xs px-2 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">₩990</span>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center px-6 max-w-lg mx-auto w-full pb-12">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-2 h-2 rounded-full bg-red-400 pulse" />
            <span className="text-xs text-gray-400">지금까지 <strong className="text-red-400">{counter.toLocaleString()}명</strong>이 확인함</span>
          </div>

          <div className="mb-8 space-y-3">
            <p className="text-xl font-black" style={{ color: "rgba(255,255,255,0.5)" }}>나쁜 사주?</p>
            <p className="text-4xl font-black leading-tight text-white">없습니다.</p>
            <p className="text-4xl font-black leading-tight" style={{ color: "#f87171" }}>방향만 바꾸면<br />됩니다.</p>
            <p className="text-sm text-gray-500 leading-relaxed pt-2">
              내 사주의 신살과 오행 불균형을 찾아내고<br />
              딱 내 사주에 맞는 극복법만 알려드립니다.<br />
              모든 에너지는 방향만 맞으면 강점이 됩니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-8">
            {[
              { icon: "⚡", title: "내 신살만 추출", desc: "역마·귀문관·양인 등 내 사주 기반" },
              { icon: "🌿", title: "오행 불균형 진단", desc: "과다·부족 오행 맞춤 극복법" },
              { icon: "🎨", title: "색·방향·숫자", desc: "나에게 맞는 개운 아이템" },
              { icon: "🍽️", title: "음식·물건", desc: "일상에서 기운 채우는 법" },
            ].map(f => (
              <div key={f.title} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-2xl">{f.icon}</span>
                <p className="text-sm font-bold text-white mt-2">{f.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => setStep("input")}
            className="w-full py-5 rounded-2xl font-black text-lg text-white shadow-2xl transition-all active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #dc2626 0%, #7c3aed 100%)" }}
          >
            내 사주 극복법 확인하기 →
          </button>
          <p className="text-center text-xs text-gray-600 mt-3">생년월일 입력 후 맞춤 분석 · ₩990</p>
        </div>
      </main>
    );
  }

  // ── input step ──
  return (
    <main className="min-h-screen bg-[#06060e] text-white flex flex-col relative overflow-hidden"
      style={{ animation: "fadeIn 0.35s ease-out" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full blur-[160px]" style={{ background: "rgba(239,68,68,0.08)" }} />
      </div>

      <div className="relative z-10 flex items-center px-5 py-4">
        <button onClick={() => setStep("splash")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 뒤로</button>
      </div>

      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 max-w-lg mx-auto w-full pb-16">
        <div className="mb-8">
          <p className="text-xs text-red-400 font-bold tracking-widest uppercase mb-3">Step 1 / 1</p>
          <h2 className="text-3xl font-black text-white mb-2">생년월일 입력</h2>
          <p className="text-sm text-gray-500">사주를 분석해 내 신살과 오행 불균형을 찾아냅니다</p>
        </div>

        <div className="space-y-4 mb-6">
          {/* 양력/음력 */}
          <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
            {(["solar", "lunar"] as CalType[]).map(t => (
              <button key={t} type="button" onClick={() => { setCalType(t); setIsLeapMonth(false); }}
                className={`flex-1 py-2.5 text-sm font-bold transition ${calType === t ? "bg-red-700 text-white" : "text-white/40 hover:text-white/70"}`}>
                {t === "solar" ? "양력" : "음력"}
              </button>
            ))}
          </div>

          <DropPick
            value={year}
            opts={YEARS.map(y => ({ v: String(y), label: String(y) }))}
            onChange={setYear}
            placeholder="출생 연도"
            suffix="년"
          />
          <div className="grid grid-cols-2 gap-3">
            <DropPick
              value={month}
              opts={MONTHS.map(m => ({ v: String(m), label: String(m) }))}
              onChange={setMonth}
              placeholder="월"
              suffix="월"
            />
            <DropPick
              value={day}
              opts={DAYS.map(d => ({ v: String(d), label: String(d) }))}
              onChange={setDay}
              placeholder="일"
              suffix="일"
            />
          </div>

          {/* 윤달 (음력 시) */}
          {calType === "lunar" && (
            <button type="button" onClick={() => setIsLeapMonth(v => !v)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition ${isLeapMonth ? "border-red-500 bg-red-950/30 text-red-300" : "border-white/10 bg-white/5 text-gray-500"}`}>
              <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${isLeapMonth ? "border-red-400" : "border-gray-600"}`}>
                {isLeapMonth && <span className="text-[10px] font-black">✓</span>}
              </span>
              윤달
            </button>
          )}

          {/* 태어난 시간 */}
          <div>
            <p className="text-xs text-white/40 mb-2 font-semibold">태어난 시간</p>
            <BirthTimePicker value={birthTime} onChange={setBirthTime} accent="indigo" />
          </div>

          {/* 성별 */}
          <div className="grid grid-cols-2 gap-3">
            {(["female", "male"] as const).map(g => (
              <button key={g} onClick={() => setGender(g)}
                className={`py-3 rounded-xl text-sm font-bold transition border ${
                  gender === g
                    ? "border-red-500 bg-red-950/30 text-red-300"
                    : "border-white/15 bg-white/5 text-gray-400 hover:border-red-500/50"
                }`}>
                {g === "female" ? "여성" : "남성"}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-400 bg-red-500/10 border border-red-500/20">{error}</div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading || !year || !month || !day}
          className="w-full py-5 rounded-2xl font-black text-lg text-white transition-all active:scale-[0.97] disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ background: "linear-gradient(135deg, #dc2626 0%, #7c3aed 100%)" }}
        >
          {loading ? (
            <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />분석 중...</>
          ) : "분석하고 결제하기 →"}
        </button>
        <p className="text-center text-xs text-gray-600 mt-3">결제 금액 ₩990 · 토스페이 / 카드</p>
      </div>
    </main>
  );
}

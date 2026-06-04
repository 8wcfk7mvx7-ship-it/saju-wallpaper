"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { analyzeSaju, ILGAN_PERSONALITY, ILGAN_INNER_OUTER, type SajuResult } from "@/lib/saju";
import BirthTimePicker, { type BirthTimeValue } from "@/components/BirthTimePicker";
export const dynamic = "force-dynamic";

type Step = "splash" | "input" | "loading" | "result";

const YEAR_OPTS = Array.from({ length: 2026 - 1929 }, (_, i) => 2025 - i);
const MONTH_OPTS = Array.from({ length: 12 }, (_, i) => i + 1);

function DropPick({ value, opts, onChange, placeholder, suffix }: {
  value: string; opts: { v: string; label: string }[];
  onChange: (v: string) => void; placeholder: string; suffix?: string;
}) {
  const [open, setOpen] = useState(false);
  const display = opts.find(o => o.v === value)?.label ?? "";
  return (
    <div className="relative w-full">
      <div onClick={() => setOpen(o => !o)}
        className="flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer select-none text-sm"
        style={{ borderColor: open ? "#f43f5e" : "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)" }}>
        <span className={display ? "text-white" : "text-gray-500"}>
          {display ? `${display}${suffix ? " " + suffix : ""}` : placeholder}
        </span>
        <span className="text-gray-500 text-xs" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
      </div>
      {open && (
        <div className="absolute z-50 w-full mt-1 rounded-xl overflow-y-auto shadow-2xl" style={{ maxHeight: 220, background: "#12121e", border: "1px solid rgba(255,255,255,0.2)" }}>
          {opts.map(o => (
            <div key={o.v} onClick={() => { onChange(o.v); setOpen(false); }}
              className="px-4 py-2.5 text-sm cursor-pointer"
              style={{ color: value === o.v ? "#f43f5e" : "rgba(255,255,255,0.65)", background: value === o.v ? "rgba(244,63,94,0.1)" : "transparent" }}>
              {o.label}{suffix ? ` ${suffix}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface CrushResult {
  idealType: string;
  approach: string;
  psychology: string;
  warning: string;
  moneyStyle: string;
  compatibility: string;
  score: number;
  grade: string;
}

async function analyzeCrush(targetData: {
  birthYear: number; birthMonth: number; birthDay: number;
  birthTime: BirthTimeValue; calType: "solar" | "lunar"; isLeapMonth: boolean;
  gender: "male" | "female"; birthPlace: string;
}, myData?: {
  birthYear: number; birthMonth: number; birthDay: number;
}): Promise<CrushResult> {
  const r = analyzeSaju({
    birthYear: targetData.birthYear,
    birthMonth: targetData.birthMonth,
    birthDay: targetData.birthDay,
    birthHour: targetData.birthTime.unknown ? null : targetData.birthTime.hour,
    birthMinute: targetData.birthTime.unknown ? null : targetData.birthTime.minute,
    name: "상대방", gender: targetData.gender, birthPlace: targetData.birthPlace || "서울",
    style: "auto", productType: "report",
    useJajasi: targetData.birthTime.useJajasi,
  });

  const res = await fetch("/api/crush/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sajuResult: r, gender: targetData.gender, myBirth: myData }),
  });
  if (!res.ok) throw new Error("분석 실패");
  const data = await res.json();
  return data.result;
}

export default function CrushPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("splash");
  const [showBtn, setShowBtn] = useState(false);

  // 상대방 정보
  const [targetGender, setTargetGender] = useState<"male" | "female">("male");
  const [targetCalType, setTargetCalType] = useState<"solar" | "lunar">("solar");
  const [targetIsLeap, setTargetIsLeap] = useState(false);
  const [targetYear, setTargetYear] = useState(0);
  const [targetMonth, setTargetMonth] = useState(0);
  const [targetDay, setTargetDay] = useState(0);
  const [targetTime, setTargetTime] = useState<BirthTimeValue>({ hour: null, minute: null, unknown: true, useJajasi: false });
  const [targetBirthPlace, setTargetBirthPlace] = useState("서울");

  // 내 정보 (선택)
  const [myYear, setMyYear] = useState(0);
  const [myMonth, setMyMonth] = useState(0);
  const [myDay, setMyDay] = useState(0);

  const [formError, setFormError] = useState("");
  const [result, setResult] = useState<CrushResult | null>(null);
  const [targetSaju, setTargetSaju] = useState<SajuResult | null>(null);

  useEffect(() => { const t = setTimeout(() => setShowBtn(true), 2000); return () => clearTimeout(t); }, []);

  async function handleAnalyze() {
    if (!targetYear || !targetMonth || !targetDay) {
      setFormError("상대방의 생년월일을 모두 입력해주세요."); return;
    }
    setFormError("");
    setStep("loading");

    let fy = targetYear, fm = targetMonth, fd = targetDay;
    if (targetCalType === "lunar") {
      try {
        // @ts-ignore
        const KLC = (await import("korean-lunar-calendar")).default;
        const cal = new KLC();
        cal.setLunarDate(fy, fm, fd, targetIsLeap);
        const sol = cal.getSolarCalendar();
        if (sol?.year) { fy = sol.year; fm = sol.month; fd = sol.day; }
      } catch {}
    }

    try {
      const sajuR = analyzeSaju({
        birthYear: fy, birthMonth: fm, birthDay: fd,
        birthHour: targetTime.unknown ? null : targetTime.hour,
        birthMinute: targetTime.unknown ? null : targetTime.minute,
        name: "상대방", gender: targetGender, birthPlace: targetBirthPlace || "서울",
        style: "auto", productType: "report", useJajasi: targetTime.useJajasi,
      });
      setTargetSaju(sajuR);
      const res = await analyzeCrush(
        { birthYear: fy, birthMonth: fm, birthDay: fd, birthTime: targetTime, calType: targetCalType, isLeapMonth: targetIsLeap, gender: targetGender, birthPlace: targetBirthPlace },
        myYear && myMonth && myDay ? { birthYear: myYear, birthMonth: myMonth, birthDay: myDay } : undefined,
      );
      setResult(res);
      setStep("result");
    } catch {
      setFormError("분석 중 오류가 발생했습니다. 다시 시도해주세요.");
      setStep("input");
    }
  }

  // ── SPLASH ───────────────────────────────────────────────────────────────────
  if (step === "splash") return (
    <main className="min-h-screen bg-[#06060e] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[150px]" style={{ background: "rgba(244,63,94,0.08)" }} />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[130px]" style={{ background: "rgba(251,113,133,0.06)" }} />
      </div>

      <button onClick={() => router.push("/")} className="fixed top-5 left-5 z-20 text-xs text-gray-700 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 홈</button>

      <div className="relative z-10 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#fb7185" }}>짝사랑 사주 분석</span>
          </div>
          <div className="text-6xl mb-4 drop-shadow-[0_0_40px_rgba(244,63,94,0.4)]">💘</div>
        </div>

        <div className="space-y-4 mb-12">
          {[
            { text: "그 사람, 어떤 사람인가요?", big: false, delay: 0 },
            { text: "사주가 다 알고 있습니다.", big: true, delay: 500 },
            { text: "이상형·심리·공략 포인트", big: false, delay: 1000 },
            { text: "사주로 완전 분석합니다.", big: true, delay: 1500 },
          ].map((line, i) => (
            <div key={i} style={{ opacity: 1, transition: `opacity 0.8s ease ${line.delay}ms` }}>
              <p className={`leading-snug ${line.big
                ? "text-3xl font-black"
                : "text-xl font-medium"}`}
                style={line.big ? {
                  background: "linear-gradient(135deg, #fb7185, #f43f5e)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
                } : { color: "rgba(255,255,255,0.5)" }}>
                {line.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-6 mx-auto max-w-xs text-left rounded-2xl p-4 space-y-2"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {[
            "💡 이 사람의 이상형 유형",
            "💡 어떻게 접근해야 마음이 열릴까",
            "💡 쟁재남인지, 인성다자인지 진단",
            "💡 연애할 때 조심해야 할 포인트",
            "💡 나와의 궁합 점수 (내 생일 입력 시)",
          ].map((t, i) => (
            <p key={i} className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{t}</p>
          ))}
        </div>

        <div style={{ opacity: showBtn ? 1 : 0, transform: showBtn ? "none" : "translateY(16px)", transition: "opacity 0.7s, transform 0.7s" }}>
          <button onClick={() => setStep("input")}
            className="w-full max-w-xs mx-auto block font-bold py-5 px-10 rounded-2xl text-lg shadow-2xl transition-all active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)", color: "#fff", boxShadow: "0 8px 32px -4px rgba(244,63,94,0.45)" }}>
            그 사람 사주 분석하기 →
          </button>
          <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.25)" }}>무료 · 생년월일만 있으면 됩니다</p>
        </div>
      </div>
    </main>
  );

  // ── INPUT ─────────────────────────────────────────────────────────────────────
  if (step === "input") return (
    <main className="min-h-screen bg-[#06060e] text-white pb-20">
      <div className="max-w-lg mx-auto px-5 pt-8">
        <button onClick={() => setStep("splash")} className="text-xs text-gray-600 hover:text-gray-400 mb-6 inline-flex items-center gap-1 transition">← 뒤로</button>

        <div className="mb-8">
          <h2 className="text-2xl font-black text-white mb-1">그 사람 정보 입력</h2>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>생년월일시만 알면 됩니다</p>
        </div>

        <div className="space-y-5">
          {/* 성별 */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>그 사람 성별</label>
            <div className="grid grid-cols-2 gap-3">
              {(["male", "female"] as const).map(g => (
                <button key={g} onClick={() => setTargetGender(g)}
                  className="py-3 rounded-xl text-sm font-bold border transition"
                  style={{
                    borderColor: targetGender === g ? "#f43f5e" : "rgba(255,255,255,0.1)",
                    background: targetGender === g ? "rgba(244,63,94,0.12)" : "rgba(255,255,255,0.04)",
                    color: targetGender === g ? "#fb7185" : "rgba(255,255,255,0.45)",
                  }}>
                  {g === "male" ? "남성" : "여성"}
                </button>
              ))}
            </div>
          </div>

          {/* 양력/음력 */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>양력 / 음력</label>
            <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              {(["solar", "lunar"] as const).map(t => (
                <button key={t} type="button" onClick={() => { setTargetCalType(t); setTargetIsLeap(false); }}
                  className={`flex-1 py-2.5 text-sm font-bold transition ${targetCalType === t ? "text-white" : "text-white/40"}`}
                  style={{ background: targetCalType === t ? "rgba(244,63,94,0.3)" : "transparent" }}>
                  {t === "solar" ? "양력" : "음력"}
                </button>
              ))}
            </div>
          </div>

          {/* 생년월일 */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
              그 사람 생년월일 <span style={{ color: "#f43f5e" }}>*</span>
            </label>
            <div className="space-y-2">
              <DropPick value={targetYear ? String(targetYear) : ""} opts={YEAR_OPTS.map(y => ({ v: String(y), label: String(y) }))} onChange={v => setTargetYear(Number(v))} placeholder="출생 연도" suffix="년" />
              <div className="grid grid-cols-2 gap-2">
                <DropPick value={targetMonth ? String(targetMonth) : ""} opts={MONTH_OPTS.map(m => ({ v: String(m), label: String(m) }))} onChange={v => setTargetMonth(Number(v))} placeholder="월" suffix="월" />
                <DropPick value={targetDay ? String(targetDay) : ""} opts={Array.from({ length: 31 }, (_, i) => i + 1).map(d => ({ v: String(d), label: String(d) }))} onChange={v => setTargetDay(Number(v))} placeholder="일" suffix="일" />
              </div>
              {targetCalType === "lunar" && (
                <button type="button" onClick={() => setTargetIsLeap(v => !v)}
                  className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition ${targetIsLeap ? "border-rose-500 bg-rose-950/30 text-rose-300" : "border-white/10 bg-white/5 text-gray-500"}`}>
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${targetIsLeap ? "border-rose-400" : "border-gray-600"}`}>
                    {targetIsLeap && <span className="text-[10px] font-black">✓</span>}
                  </span>
                  윤달
                </button>
              )}
            </div>
          </div>

          {/* 태어난 시간 */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
              그 사람 태어난 시간 <span className="text-[10px] font-normal normal-case" style={{ color: "rgba(255,255,255,0.25)" }}>(모르면 모름 선택)</span>
            </label>
            <BirthTimePicker value={targetTime} onChange={setTargetTime} accent="violet" />
          </div>

          {/* 태어난 장소 */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
              그 사람 태어난 장소 <span className="text-[10px] font-normal normal-case" style={{ color: "rgba(255,255,255,0.25)" }}>(진태양시 경도보정 자동 적용)</span>
            </label>
            <input
              type="text"
              value={targetBirthPlace}
              onChange={e => setTargetBirthPlace(e.target.value)}
              placeholder="서울 / 부산 / 도쿄 / 뉴욕 등"
              className="w-full px-4 py-3 rounded-xl text-sm text-white outline-none transition"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)" }}
            />
          </div>

          {/* 구분선 */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>내 정보 (선택 — 궁합 점수 계산)</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
          </div>

          {/* 내 생년월일 (선택) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
              내 생년월일 <span className="text-[10px] font-normal normal-case" style={{ color: "rgba(255,255,255,0.25)" }}>(입력 시 궁합 점수 제공)</span>
            </label>
            <div className="space-y-2">
              <DropPick value={myYear ? String(myYear) : ""} opts={YEAR_OPTS.map(y => ({ v: String(y), label: String(y) }))} onChange={v => setMyYear(Number(v))} placeholder="내 출생 연도" suffix="년" />
              <div className="grid grid-cols-2 gap-2">
                <DropPick value={myMonth ? String(myMonth) : ""} opts={MONTH_OPTS.map(m => ({ v: String(m), label: String(m) }))} onChange={v => setMyMonth(Number(v))} placeholder="월" suffix="월" />
                <DropPick value={myDay ? String(myDay) : ""} opts={Array.from({ length: 31 }, (_, i) => i + 1).map(d => ({ v: String(d), label: String(d) }))} onChange={v => setMyDay(Number(v))} placeholder="일" suffix="일" />
              </div>
            </div>
          </div>

          {formError && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{formError}</p>}

          <button onClick={handleAnalyze}
            className="w-full py-5 rounded-2xl font-black text-lg text-white transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #f43f5e, #fb7185)", boxShadow: "0 8px 32px rgba(244,63,94,0.4)" }}>
            그 사람 사주 분석하기 →
          </button>
        </div>
      </div>
    </main>
  );

  // ── LOADING ───────────────────────────────────────────────────────────────────
  if (step === "loading") return (
    <main className="min-h-screen bg-[#06060e] text-white flex flex-col items-center justify-center gap-6 px-6">
      <div className="text-5xl animate-pulse">💘</div>
      <div className="text-center">
        <p className="text-lg font-bold text-white mb-2">그 사람 사주 분석 중...</p>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>이상형·심리·공략 포인트를 파악하고 있습니다</p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-rose-400"
            style={{ animation: `bounce 1.2s ease ${i * 0.2}s infinite`, animationName: "pulse" }} />
        ))}
      </div>
    </main>
  );

  // ── RESULT ────────────────────────────────────────────────────────────────────
  if (!result) return null;

  const gradeColors: Record<string, string> = {
    S: "#fbbf24", A: "#34d399", B: "#60a5fa", C: "#a78bfa", D: "#f87171",
  };
  const gradeColor = gradeColors[result.grade] || "#e8c97a";

  return (
    <main className="min-h-screen bg-[#06060e] text-white pb-24">
      <div className="max-w-lg mx-auto px-4 pt-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setStep("input")} className="text-gray-600 hover:text-gray-400 transition text-sm">← 다시 분석</button>
          <button onClick={() => router.push("/")} className="ml-auto text-xs text-gray-700 hover:text-gray-500 transition">홈 →</button>
        </div>

        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💘</div>
          <h1 className="text-2xl font-black text-white mb-1">그 사람 사주 완전 분석</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            {targetGender === "male" ? "남성" : "여성"} · {targetYear}년 {targetMonth}월 {targetDay}일생
          </p>
        </div>

        {/* 궁합 점수 (내 생일 입력했을 때만) */}
        {myYear > 0 && (
          <div className="mb-6 rounded-2xl p-5 text-center"
            style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>나와의 궁합 점수</p>
            <div className="flex items-baseline justify-center gap-3 mb-2">
              <span className="text-5xl font-black" style={{ color: gradeColor }}>{result.grade}</span>
              <span className="text-3xl font-black text-white">{result.score}점</span>
            </div>
            <div className="w-full h-2 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.07)" }}>
              <div className="h-2 rounded-full transition-all" style={{ width: `${result.score}%`, background: `linear-gradient(90deg, ${gradeColor}, ${gradeColor}88)` }} />
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{result.compatibility}</p>
          </div>
        )}

        {/* 분석 카드들 */}
        {[
          { icon: "💭", title: "이 사람의 이상형", content: result.idealType, accent: "#f43f5e" },
          { icon: "🎯", title: "공략 포인트 · 이렇게 접근하세요", content: result.approach, accent: "#fb7185" },
          { icon: "🧠", title: "심리 패턴 · 연애할 때 이런 사람", content: result.psychology, accent: "#a78bfa" },
          { icon: "💰", title: "돈·재물 스타일 (쟁재남 진단)", content: result.moneyStyle, accent: "#fbbf24" },
          { icon: "⚠️", title: "주의할 점 · 이건 피하세요", content: result.warning, accent: "#f97316" },
        ].map((card, i) => (
          <div key={i} className="mb-4 rounded-2xl p-5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{card.icon}</span>
              <h3 className="text-sm font-black" style={{ color: card.accent }}>{card.title}</h3>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
              {card.content}
            </p>
          </div>
        ))}

        {/* 상대방 사주 원국 */}
        {targetSaju && (() => {
          const p = targetSaju.pillarsDetail;
          const pillars = [
            { label: "연주", cg: p.year.cg, jj: p.year.jj, ssCg: p.year.sipseongCg, ssJj: p.year.sipseongJj },
            { label: "월주", cg: p.month.cg, jj: p.month.jj, ssCg: p.month.sipseongCg, ssJj: p.month.sipseongJj },
            { label: "일주", cg: p.day.cg, jj: p.day.jj, ssCg: "일간", ssJj: p.day.sipseongJj },
            ...(p.hour ? [{ label: "시주", cg: p.hour.cg, jj: p.hour.jj, ssCg: p.hour.sipseongCg, ssJj: p.hour.sipseongJj }] : []),
          ];
          return (
            <div className="mb-4 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>그 사람의 사주 원국</p>
              <div className={`grid gap-2 ${pillars.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
                {pillars.map((pl, i) => (
                  <div key={i} className="rounded-xl p-3 text-center border" style={{ borderColor: pl.label === "일주" ? "rgba(244,63,94,0.4)" : "rgba(255,255,255,0.08)", background: pl.label === "일주" ? "rgba(244,63,94,0.1)" : "rgba(255,255,255,0.03)" }}>
                    <p className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>{pl.label}</p>
                    <p className="text-[10px] mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{pl.ssCg || "–"}</p>
                    <p className="text-lg font-black text-white">{pl.cg}</p>
                    <div className="h-px my-1" style={{ background: "rgba(255,255,255,0.1)" }} />
                    <p className="text-lg font-black text-white">{pl.jj}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: pl.label === "일주" ? "#fb7185" : "rgba(255,255,255,0.35)" }}>{pl.ssJj || "–"}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3 text-center" style={{ color: "rgba(255,255,255,0.25)" }}>{targetSaju.fourPillars}</p>
            </div>
          );
        })()}

        {/* 일간 성격 — 그 사람 */}
        {targetSaju && (() => {
          const ilgan = targetSaju.pillarsDetail.day.cg;
          const info = ILGAN_PERSONALITY[ilgan];
          if (!info) return null;
          return (
            <div className="mb-4 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🔮</span>
                <h3 className="text-sm font-black" style={{ color: "#f43f5e" }}>그 사람의 일간 — {info.short}</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {info.keyword.split("·").map(k => (
                  <span key={k} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(244,63,94,0.12)", color: "#fb7185", border: "1px solid rgba(244,63,94,0.25)" }}>{k}</span>
                ))}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>{info.detail}</p>
            </div>
          );
        })()}

        {/* 겉모습 vs 속마음 */}
        {targetSaju && (() => {
          const ilgan = targetSaju.pillarsDetail.day.cg;
          const io = ILGAN_INNER_OUTER[ilgan];
          if (!io) return null;
          return (
            <div className="mb-4 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🪞</span>
                <h3 className="text-sm font-black" style={{ color: "#a78bfa" }}>겉모습 vs 속마음</h3>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="rounded-xl p-3" style={{ background: "rgba(168,85,247,0.08)", border: "1px solid rgba(168,85,247,0.2)" }}>
                  <p className="text-[10px] font-bold mb-1" style={{ color: "#a78bfa" }}>밖으로 보이는 모습</p>
                  <p className="text-sm font-bold text-white">{io.outer}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.2)" }}>
                  <p className="text-[10px] font-bold mb-1" style={{ color: "#fb7185" }}>내면의 진짜 욕구</p>
                  <p className="text-sm font-bold text-white">{io.inner}</p>
                </div>
              </div>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{io.synthesis}</p>
            </div>
          );
        })()}

        {/* 신살 목록 */}
        {targetSaju && targetSaju.sinsalList.length > 0 && (
          <div className="mb-4 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">⭐</span>
              <h3 className="text-sm font-black" style={{ color: "#fbbf24" }}>그 사람의 신살 (神殺)</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {targetSaju.sinsalList.map((s, i) => (
                <div key={i} className="rounded-xl px-3 py-2" style={{ background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)" }}>
                  <p className="text-xs font-bold" style={{ color: "#fbbf24" }}>{s.name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 공유 + CTA */}
        <div className="mt-6 rounded-2xl p-5 text-center"
          style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)" }}>
          <p className="text-sm font-bold text-white mb-1">더 깊은 분석이 필요하다면?</p>
          <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>두 사람의 사주 궁합을 더 자세히 알아보세요</p>
          <button onClick={() => router.push("/gunghap")}
            className="px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #f43f5e, #fb7185)", color: "#fff" }}>
            사주 궁합 전체 분석 →
          </button>
        </div>

        <button onClick={() => setStep("input")} className="w-full mt-4 py-3 rounded-xl text-sm font-semibold transition"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
          다시 분석하기
        </button>
      </div>
    </main>
  );
}

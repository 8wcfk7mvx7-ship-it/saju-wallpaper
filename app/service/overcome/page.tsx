"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import { analyzeSaju } from "@/lib/saju";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";

export const dynamic = "force-dynamic";

type Step = "splash" | "input";

export default function OvercomePage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("splash");
  const [form, setForm] = useState<BirthFormData>(defaultBirthData("female"));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [counter] = useState(() => Math.floor(Math.random() * 400) + 2800);

  async function handleAnalyze() {
    if (!form.birthYear || !form.birthMonth || !form.birthDay) { setError("생년월일을 모두 선택해주세요."); return; }
    setError("");
    setLoading(true);
    try {
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
      const result = analyzeSaju({
        birthYear: fy, birthMonth: fm, birthDay: fd,
        birthHour: form.birthHour, birthMinute: form.birthMinute ?? 0,
        name: form.name || "사용자", gender: form.gender, birthPlace: form.city || "서울", style: "auto",
        productType: "report", useJajasi: form.useJajasi,
      });
      const orderId = `overcome_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      sessionStorage.setItem("overcomeData", JSON.stringify({
        form: { year: fy, month: fm, day: fd, gender: form.gender },
        result,
      }));
      router.push(`/service/overcome/pay?orderId=${orderId}&amount=990`);
    } catch {
      setError("분석 중 오류가 발생했습니다. 다시 시도해주세요.");
      setLoading(false);
    }
  }

  if (step === "splash") {
    return (
      <main className="min-h-screen bg-[#06060e] text-white flex flex-col relative overflow-hidden"
        style={{ animation: "fadeIn 0.45s ease-out" }}>
        <BackButton />
        <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}.pulse{animation:pulse 2s ease-in-out infinite}`}</style>

        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full blur-[160px]" style={{ background: "rgba(239,68,68,0.1)" }} />
          <div className="absolute bottom-[-20%] right-[-20%] w-[500px] h-[500px] rounded-full blur-[140px]" style={{ background: "rgba(139,92,246,0.08)" }} />
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
              { icon: "🏃", title: "활동·행동", desc: "내 기운을 살리는 생활 루틴" },
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
      <BackButton />
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full blur-[160px]" style={{ background: "rgba(239,68,68,0.08)" }} />
      </div>


      <div className="relative z-10 flex-1 flex flex-col justify-center px-6 max-w-lg mx-auto w-full pb-16">
        <div className="mb-8">
          <p className="text-xs text-red-400 font-bold tracking-widest uppercase mb-3">Step 1 / 1</p>
          <h2 className="text-3xl font-black text-white mb-2">생년월일 입력</h2>
          <p className="text-sm text-gray-500">사주를 분석해 내 신살과 오행 불균형을 찾아냅니다</p>
        </div>

        <div className="mb-6">
          <BirthInputForm value={form} onChange={setForm} accent="#f97316" />
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm text-red-400 bg-red-500/10 border border-red-500/20">{error}</div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading || !form.birthYear || !form.birthMonth || !form.birthDay}
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

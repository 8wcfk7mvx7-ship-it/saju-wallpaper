"use client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import BackButton from "@/components/BackButton";
import { analyzeSaju, type SajuResult, type Element } from "@/lib/saju";
import { SIPSEONG_DESC, SIPSEONG_MONEY_COMBO } from "@/lib/saju2";
import AnalysisLoading from "@/components/AnalysisLoading";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";

export const dynamic = "force-dynamic";

const ELEMENT_BOOST: Record<Element, { item: string; color: string; tip: string }> = {
  목: { item: "초록·청록 계열, 동쪽 방향, 나무·식물", color: "#4ade80", tip: "동쪽 방향에 화분을 두거나 초록색 소품을 활용하면 재물 기운의 흐름이 살아납니다." },
  화: { item: "빨강·주황 계열, 남쪽 방향, 조명", color: "#f97316", tip: "남쪽 자리를 밝게 유지하고 조명을 추가하면 재물운의 활동성이 올라갑니다." },
  토: { item: "노랑·갈색 계열, 중앙, 도자기 소품", color: "#fbbf24", tip: "책상이나 방의 중앙을 정돈하고 도자기·황토색 소품을 두면 재물이 안정적으로 쌓입니다." },
  금: { item: "흰색·금속 계열, 서쪽 방향, 금속 소품", color: "#e5e7eb", tip: "서쪽 자리에 금속 소품(동전, 액자 프레임 등)을 두면 재물이 단단하게 모이는 기운이 강화됩니다." },
  수: { item: "검정·남색 계열, 북쪽 방향, 어항·물 소품", color: "#38bdf8", tip: "북쪽 방향에 어항이나 물 관련 소품을 두면 재물의 흐름이 막히지 않고 순환됩니다." },
};

export default function WealthPage() {
  const router = useRouter();
  const [step, setStep] = useState<"entry" | "form" | "loading" | "result">("entry");
  const [form, setForm] = useState<BirthFormData>(defaultBirthData("female"));
  const resultRef = useRef<SajuResult | null>(null);

  async function handleAnalyze() {
    if (!form.birthYear || !form.birthMonth || !form.birthDay) return;
    let y = Number(form.birthYear), m = Number(form.birthMonth), d = Number(form.birthDay);
    if (form.calendarType === "lunar") {
      try {
        const KLC = (await import("korean-lunar-calendar")).default;
        const klc = new KLC();
        klc.setLunarDate(y, m, d, form.isLeapMonth);
        const sol = klc.getSolarCalendar();
        if (sol?.year) { y = sol.year; m = sol.month; d = sol.day; }
      } catch {}
    }
    resultRef.current = analyzeSaju({
      birthYear: y, birthMonth: m, birthDay: d,
      birthHour: form.birthHour, birthMinute: form.birthMinute ?? 0,
      name: "나", gender: form.gender,
      birthPlace: form.city || "서울", style: "auto", productType: "report", useJajasi: form.useJajasi,
    });
    setStep("loading");
  }

  if (step === "entry") {
    return (
      <main className="min-h-screen bg-[#0a0805] text-white flex flex-col">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[650px] h-[650px] rounded-full bg-amber-950/40 blur-[160px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-yellow-950/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-5 py-16 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-amber-900/50 border border-amber-700/40 text-amber-300 text-xs font-bold tracking-wider mb-8">
            ⚠ &quot;무재성&quot;, &quot;재물복 없다&quot;는 말 들어본 사람 필수 확인
          </div>
          <h1 className="text-4xl font-black mb-4 leading-tight tracking-tight">
            내 사주에<br />
            <span className="text-amber-400">재물운</span>이 있을까?
          </h1>
          <p className="text-gray-400 text-base mb-2 leading-relaxed">
            벌어도 안 모이고, 모아도 새는 이유.<br />
            <span className="text-gray-300 font-medium">사주에 답이 있습니다.</span>
          </p>
          <p className="text-gray-600 text-sm mb-12">
            지금 확인 안 하면 평생 모르고 삽니다
          </p>

          <div className="w-full space-y-3 mb-10 text-left">
            {[
              ["재성(財星) 보유 여부", "내 사주에 돈이 들어올 자리가 있는지부터 확인"],
              ["돈이 새는 구조 진단", "상관생재 · 일주극재 등 재물이 빠져나가는 패턴"],
              ["재물운 높이는 구체적 방법", "내 오행에 맞는 색상·방향·습관 처방"],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-start gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-bold tracking-wider mb-6">
            ✦ 완전 무료
          </div>

          <button onClick={() => setStep("form")}
            className="w-full py-4 rounded-2xl font-black text-lg tracking-tight bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-900/50 transition-all active:scale-[0.98]">
            내 재물운 확인하기
          </button>
        </div>
      </main>
    );
  }

  if (step === "form") {
    const ready = !!form.birthYear && !!form.birthMonth && !!form.birthDay;
    return (
      <main className="min-h-screen bg-[#0a0805] text-white">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[600px] h-[600px] rounded-full bg-amber-950/40 blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">생년월일 입력</h2>
            <p className="text-gray-500 text-sm">정확한 분석을 위해 출생 정보를 입력해주세요.</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <BirthInputForm value={form} onChange={setForm} label="나의 정보" accent="#f59e0b" />
          </div>
          <button onClick={handleAnalyze} disabled={!ready}
            className={`w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all active:scale-[0.98] ${
              ready
                ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-900/50"
                : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
            }`}>
            재물운 분석하기
          </button>
        </div>
      </main>
    );
  }

  if (step === "loading") {
    return <AnalysisLoading subject="나의 재물운" duration={2200} onDone={() => setStep("result")} />;
  }

  // ── 결과 ──
  const r = resultRef.current;
  if (!r) return null;
  const ilgan = r.pillarsDetail.day.cg;

  const sipseongList = [
    r.pillarsDetail.year.sipseongCg, r.pillarsDetail.year.sipseongJj,
    r.pillarsDetail.month.sipseongCg, r.pillarsDetail.month.sipseongJj,
    r.pillarsDetail.hour?.sipseongCg, r.pillarsDetail.hour?.sipseongJj,
  ].filter(Boolean) as string[];
  const counts: Record<string, number> = {};
  sipseongList.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
  const jaeseongCount = (counts["정재"] || 0) + (counts["편재"] || 0);
  const hasMuJae = jaeseongCount === 0;

  const topSipseong = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topDesc = topSipseong ? SIPSEONG_DESC[topSipseong] : null;

  // 재물 새는 구조 — 상관 多 or 비겁 多
  const sangkwanCount = counts["상관"] || 0;
  const bigeopCount = (counts["비견"] || 0) + (counts["겁재"] || 0);
  let moneyCombo: { name: string; hanja: string; desc: string; advice: string } | null = null;
  if (sangkwanCount >= 2) moneyCombo = SIPSEONG_MONEY_COMBO["상관생재"];
  else if (bigeopCount >= 2) moneyCombo = SIPSEONG_MONEY_COMBO["일주극재"];

  const lacking = r.lacking[0] ?? "토";
  const boost = ELEMENT_BOOST[lacking];

  return (
    <main className="min-h-screen bg-[#0a0805] text-white">
      <BackButton />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-amber-950/30 blur-[160px]" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-16">
        <div className="text-center mb-8">
          <p className="text-amber-400 text-xs font-bold tracking-widest mb-2">MY WEALTH FORTUNE</p>
          <h1 className="text-2xl font-black leading-snug">
            {ilgan}{r.pillarsDetail.day.jj}일주, 당신의 재물운 진단
          </h1>
        </div>

        <div className={`rounded-3xl p-6 mb-5 text-center border ${hasMuJae ? "bg-gradient-to-br from-rose-950/60 to-amber-950/40 border-rose-700/30" : "bg-gradient-to-br from-amber-950/60 to-yellow-950/40 border-amber-700/30"}`}>
          <p className="text-amber-300 text-xs font-bold tracking-widest uppercase mb-2">재성(財星) 진단</p>
          {hasMuJae ? (
            <>
              <p className="text-xl font-black leading-snug mb-1">무재성(無財星) 사주</p>
              <p className="text-sm text-gray-300 leading-relaxed">사주 원국에 정재·편재가 보이지 않습니다. 흔히 &quot;재물복이 없다&quot;고 오해하는 구조지만, 정확히는 <span className="text-amber-300 font-bold">&apos;돈을 버는 방식이 다른 사람과 다르다&apos;</span>는 뜻입니다. 직접 돈을 좇기보다, 재능·전문성으로 돈이 따라오게 만드는 구조가 훨씬 유리합니다.</p>
            </>
          ) : (
            <>
              <p className="text-xl font-black leading-snug mb-1">재성 {jaeseongCount}개 보유</p>
              <p className="text-sm text-gray-300 leading-relaxed">사주 안에 재물을 의미하는 정재·편재 기운이 자리하고 있습니다. 다만 재성이 있다고 끝이 아니라, 그 재물을 <span className="text-amber-300 font-bold">지키고 굴리는 구조</span>가 더 중요합니다. 아래 진단을 확인하세요.</p>
            </>
          )}
        </div>

        {moneyCombo && (
          <div className="bg-white/[0.03] border border-rose-700/20 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-rose-300 mb-1">⚠ 돈이 새는 구조 — {moneyCombo.name} ({moneyCombo.hanja})</p>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">{moneyCombo.desc}</p>
            <p className="text-xs text-emerald-300 font-bold">▶ 처방: {moneyCombo.advice}</p>
          </div>
        )}

        {topDesc && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-violet-300 mb-1">사주에서 가장 강한 기운 — {topSipseong} ({topDesc.hanja})</p>
            <p className="text-xs text-gray-500 mb-2">{topDesc.short}</p>
            <p className="text-sm text-gray-300 leading-relaxed">{topDesc.detail}</p>
          </div>
        )}

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-8">
          <p className="text-sm font-bold mb-1" style={{ color: boost.color }}>재물운 높이는 법 — 부족한 오행 &apos;{lacking}&apos; 보강</p>
          <p className="text-xs text-gray-500 mb-2">추천 아이템: {boost.item}</p>
          <p className="text-sm text-gray-300 leading-relaxed">{boost.tip}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push("/service/overcome")}
            className="py-3.5 rounded-2xl font-bold text-sm bg-white/5 border border-white/10 text-gray-300 active:scale-[0.98] transition-all">
            쓰레기 사주 극복법
          </button>
          <button onClick={() => { setStep("entry"); resultRef.current = null; }}
            className="py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-600 to-orange-600 text-white active:scale-[0.98] transition-all">
            다시 분석하기
          </button>
        </div>
      </div>
    </main>
  );
}

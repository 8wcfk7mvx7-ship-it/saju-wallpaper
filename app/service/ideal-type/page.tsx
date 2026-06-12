"use client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import BackButton from "@/components/BackButton";
import { analyzeSaju, type SajuResult } from "@/lib/saju";
import { SIPSEONG_DESC } from "@/lib/saju2";
import AnalysisLoading from "@/components/AnalysisLoading";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";

export const dynamic = "force-dynamic";

const IDEAL: Record<string, { type: string; desc: string; trait: string; warn: string }> = {
  갑: { type: "조용히 리드해주는 안정적인 사람", desc: "갑목인 이 사람은 자존심이 강하고 곧은 성격이라, 다그치지 않으면서도 묵묵히 중심을 잡아주는 상대에게 끌립니다. 화려한 말보다 행동으로 신뢰를 주는 사람이 진짜 이상형이에요.", trait: "잔소리 없이 믿어주는 사람", warn: "너무 강하게 통제하려 하면 오히려 멀어지게 만듭니다." },
  을: { type: "내 편이 되어주는 다정한 사람", desc: "을목인 이 사람은 유연하지만 속은 여립니다. 감정을 먼저 알아채고 챙겨주는, 다정하고 섬세한 사람에게 강하게 끌려요. 무뚝뚝한 사람보다 표현 잘하는 사람이 잘 맞습니다.", trait: "표현을 아끼지 않는 따뜻한 사람", warn: "감정 기복이 심한 사람과는 쉽게 지칠 수 있어요." },
  병: { type: "에너지를 받아주는 시원한 사람", desc: "병화인 이 사람은 밝고 직진하는 스타일이라, 그 에너지를 부담스러워하지 않고 함께 즐겨줄 사람이 이상형입니다. 너무 차분하고 반응 없는 상대는 답답하게 느껴질 수 있어요.", trait: "리액션이 좋고 같이 노는 사람", warn: "지나치게 진지하고 무거우면 숨 막힐 수 있어요." },
  정: { type: "마음을 깊이 들여다봐 주는 사람", desc: "정화인 이 사람은 은은하지만 감정이 깊습니다. 겉모습보다 내면을 봐주고, 천천히 다가와 주는 사람에게 마음을 엽니다. 빠르게 들이대는 사람은 오히려 부담스러워요.", trait: "천천히, 진심으로 다가오는 사람", warn: "조급하게 관계를 밀어붙이면 피하게 됩니다." },
  무: { type: "큰 변화 없이 곁을 지켜주는 사람", desc: "무토인 이 사람은 안정과 신뢰를 가장 중요하게 여깁니다. 변덕 없이 한결같이 곁에 있어주는 사람, 약속을 지키는 사람이 진짜 이상형이에요.", trait: "한결같고 약속을 지키는 사람", warn: "즉흥적이고 변덕스러우면 오래가기 어려워요." },
  기: { type: "디테일까지 챙겨주는 섬세한 사람", desc: "기토인 이 사람은 꼼꼼하고 완벽주의 성향이 있어, 작은 부분까지 신경 써주는 섬세한 사람에게 끌립니다. 대충대충 하는 사람과는 잘 안 맞아요.", trait: "사소한 것도 기억해주는 사람", warn: "무신경하고 둔감하면 답답하게 느껴집니다." },
  경: { type: "솔직하고 거짓 없는 사람", desc: "경금인 이 사람은 직선적이고 솔직한 성격이라, 똑같이 솔직하게 말해주는 사람을 가장 편하게 느낍니다. 돌려 말하거나 눈치 보는 사람은 답답해요.", trait: "할 말은 하는 시원한 사람", warn: "이중적이거나 뒤에서 다른 말 하는 사람을 가장 싫어해요." },
  신: { type: "설렘을 계속 만들어주는 사람", desc: "신금인 이 사람은 섬세하고 낭만을 추구합니다. 매너 있고 센스 있게 분위기를 만들어주는 사람, 지루하지 않은 사람에게 끌립니다.", trait: "센스 있고 분위기를 잘 만드는 사람", warn: "너무 무던하고 평범한 루틴만 반복하면 매력을 못 느껴요." },
  임: { type: "자유를 인정해주는 사람", desc: "임수인 이 사람은 구속받는 걸 싫어합니다. 간섭하지 않으면서도 묵직하게 신뢰를 주는 사람, 각자의 영역을 존중해주는 사람이 이상형이에요.", trait: "집착하지 않고 믿어주는 사람", warn: "사사건건 확인하고 통제하려 하면 숨 막혀 합니다." },
  계: { type: "마음을 이해해주는 공감형 사람", desc: "계수인 이 사람은 감수성이 풍부합니다. 말하지 않아도 기분을 알아채고, 깊이 공감해주는 사람에게 강하게 끌립니다.", trait: "공감 능력이 뛰어난 사람", warn: "공감 없이 해결책만 제시하면 서운하게 느껴져요." },
};

export default function IdealTypePage() {
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
      <main className="min-h-screen bg-[#0a0612] text-white flex flex-col">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[650px] h-[650px] rounded-full bg-fuchsia-950/40 blur-[160px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-950/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-5 py-16 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-fuchsia-900/50 border border-fuchsia-700/40 text-fuchsia-300 text-xs font-bold tracking-wider mb-8">
            ✦ 완전 무료
          </div>
          <h1 className="text-4xl font-black mb-4 leading-tight tracking-tight">
            그 사람의<br />
            <span className="text-fuchsia-400">진짜 이상형</span>은?
          </h1>
          <p className="text-gray-400 text-base mb-2 leading-relaxed">
            그 사람이 의식적으로 말하는 타입 말고,<br />
            <span className="text-gray-300 font-medium">사주에 새겨진 진짜 끌림</span>을 확인하세요.
          </p>
          <p className="text-gray-600 text-sm mb-12">
            상대방의 생년월일시만 입력하면 1분 안에 결과가 나옵니다
          </p>

          <div className="w-full space-y-3 mb-10 text-left">
            {[
              ["일간 기반 무의식적 끌림", "그 사람이 입으로 말하는 타입과 실제로 끌리는 타입은 다릅니다"],
              ["그 사람이 이끌리는 성향 키워드", "왜 항상 비슷한 사람을 만나는지, 그 이유가 보입니다"],
              ["피해야 할 상대 유형", "내가 그 유형에 해당하는지 미리 확인해보세요"],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-start gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setStep("form")}
            className="w-full py-4 rounded-2xl font-black text-lg tracking-tight bg-gradient-to-r from-fuchsia-700 to-violet-600 hover:from-fuchsia-600 hover:to-violet-500 text-white shadow-lg shadow-fuchsia-900/50 transition-all active:scale-[0.98]">
            그 사람의 진짜 이상형 보기
          </button>
        </div>
      </main>
    );
  }

  if (step === "form") {
    const ready = !!form.birthYear && !!form.birthMonth && !!form.birthDay;
    return (
      <main className="min-h-screen bg-[#0a0612] text-white">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[600px] h-[600px] rounded-full bg-fuchsia-950/40 blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">그 사람의 생년월일 입력</h2>
            <p className="text-gray-500 text-sm">정확한 분석을 위해 상대방의 출생 정보를 입력해주세요.</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <BirthInputForm value={form} onChange={setForm} label="그 사람의 정보" accent="#d946ef" />
          </div>
          <button onClick={handleAnalyze} disabled={!ready}
            className={`w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all active:scale-[0.98] ${
              ready
                ? "bg-gradient-to-r from-fuchsia-700 to-violet-600 hover:from-fuchsia-600 hover:to-violet-500 text-white shadow-lg shadow-fuchsia-900/50"
                : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
            }`}>
            진짜 이상형 분석하기
          </button>
        </div>
      </main>
    );
  }

  if (step === "loading") {
    return <AnalysisLoading subject="그 사람의 진짜 이상형" duration={2200} onDone={() => setStep("result")} />;
  }

  // ── 결과 ──
  const r = resultRef.current;
  if (!r) return null;
  const ilgan = r.pillarsDetail.day.cg;
  const idealData = IDEAL[ilgan] ?? IDEAL["갑"];

  // 사주 내 가장 많은 십성 → saju2 SIPSEONG_DESC 활용
  const sipseongList = [
    r.pillarsDetail.year.sipseongCg, r.pillarsDetail.year.sipseongJj,
    r.pillarsDetail.month.sipseongCg, r.pillarsDetail.month.sipseongJj,
    r.pillarsDetail.hour?.sipseongCg, r.pillarsDetail.hour?.sipseongJj,
  ].filter(Boolean) as string[];
  const counts: Record<string, number> = {};
  sipseongList.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
  const topSipseong = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topDesc = topSipseong ? SIPSEONG_DESC[topSipseong] : null;

  return (
    <main className="min-h-screen bg-[#0a0612] text-white">
      <BackButton />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-fuchsia-950/30 blur-[160px]" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-16">
        <div className="text-center mb-8">
          <p className="text-fuchsia-400 text-xs font-bold tracking-widest mb-2">THEIR TRUE IDEAL TYPE</p>
          <h1 className="text-2xl font-black leading-snug">
            {ilgan}{r.pillarsDetail.day.jj}일주, 그 사람이 진짜 끌리는 사람은
          </h1>
        </div>

        <div className="bg-gradient-to-br from-fuchsia-950/60 to-violet-950/40 border border-fuchsia-700/30 rounded-3xl p-6 mb-5 text-center">
          <p className="text-fuchsia-300 text-xs font-bold tracking-widest uppercase mb-2">한 줄 요약</p>
          <p className="text-xl font-black leading-snug">{idealData.type}</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-fuchsia-300 mb-2">왜 이런 사람에게 끌릴까?</p>
          <p className="text-sm text-gray-300 leading-relaxed">{idealData.desc}</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-emerald-300 mb-1">✓ 끌리는 핵심 키워드</p>
          <p className="text-sm text-gray-300 leading-relaxed">{idealData.trait}</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-rose-300 mb-1">✗ 피해야 할 상대</p>
          <p className="text-sm text-gray-300 leading-relaxed">{idealData.warn}</p>
        </div>

        {topDesc && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-8">
            <p className="text-sm font-bold text-violet-300 mb-1">그 사람의 사주 속 연애 기운 — {topSipseong} ({topDesc.hanja})</p>
            <p className="text-xs text-gray-500 mb-2">{topDesc.short}</p>
            <p className="text-sm text-gray-300 leading-relaxed">{topDesc.detail}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push("/service/hotcompat")}
            className="py-3.5 rounded-2xl font-bold text-sm bg-white/5 border border-white/10 text-gray-300 active:scale-[0.98] transition-all">
            우리 속궁합 보기
          </button>
          <button onClick={() => { setStep("entry"); resultRef.current = null; }}
            className="py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-fuchsia-700 to-violet-600 text-white active:scale-[0.98] transition-all">
            다시 분석하기
          </button>
        </div>
      </div>
    </main>
  );
}

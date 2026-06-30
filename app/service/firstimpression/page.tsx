"use client";
import { useState, useEffect, useRef } from "react";
import BackButton from "@/components/BackButton";
import { analyzeSaju, type SajuResult } from "@/lib/saju";
import AnalysisLoading from "@/components/AnalysisLoading";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";
import ResultFooterActions from "@/components/ResultFooterActions";

export const dynamic = "force-dynamic";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={className} style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(18px)", transition: `opacity 0.8s ease ${delay}ms, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

const CG_IMPRESSION: Record<string, { symbol: string; keyword: string; desc: string; merit: string; risk: string; tip: string }> = {
  갑: {
    symbol: "큰 나무(甲木)",
    keyword: "반듯하고 강직한 리더형 인상",
    desc: "허리를 곧게 펴고 시선을 피하지 않는 분위기 때문에, 처음 본 사람도 \"이 사람 책임감 있겠다\", \"리더 같다\"는 느낌을 받습니다. 말투도 직선적이고 단호한 편이라 신뢰감을 줍니다.",
    merit: "믿음직스럽고 능력 있어 보이는 인상. 자연스럽게 분위기를 이끄는 사람으로 보입니다.",
    risk: "표정 변화가 적고 말이 단호하다 보면 '차갑다', '고집이 세 보인다', '먼저 다가가기 어렵다'는 오해를 살 수 있습니다.",
    tip: "대화 시작할 때 의식적으로 미소를 짓고, 말끝을 살짝 부드럽게 풀어주세요. \"맞아\" 대신 \"맞아요, 그럴 수 있겠네요\"처럼 한 박자 늘리는 것만으로도 인상이 훨씬 유해집니다.",
  },
  을: {
    symbol: "꽃·덩굴(乙木)",
    keyword: "부드럽고 친근한 인상",
    desc: "표정이 유연하고 몸짓이 자연스러워서 처음 봐도 편안하고 다가가기 쉬운 느낌을 줍니다. 상대의 말에 잘 맞춰주는 분위기가 첫 만남에서부터 느껴집니다.",
    merit: "친화력 있고 무해한 인상. 누구와도 쉽게 어울릴 사람처럼 보입니다.",
    risk: "지나치게 맞춰주는 분위기 때문에 '줏대가 없다', '쉬워 보인다', '존재감이 약하다'는 인상을 줄 수 있습니다.",
    tip: "자세를 살짝 곧게 펴고, 대화 중 자신의 의견을 한 번은 분명하게 말해보세요. 목소리 톤을 평소보다 한 단계 낮추는 것도 안정감을 더해줍니다.",
  },
  병: {
    symbol: "태양(丙火)",
    keyword: "에너지 넘치고 화려한 인상",
    desc: "표정과 목소리에 생기가 넘쳐서 등장만으로도 분위기가 환해집니다. 적극적으로 먼저 말을 걸고 리액션이 큰 편이라 강렬한 첫인상을 남깁니다.",
    merit: "밝고 카리스마 있는 인상. 자리의 중심이 되는 사람처럼 보입니다.",
    risk: "텐션이 너무 높으면 '부담스럽다', '가볍다', '내 말은 안 듣고 자기 얘기만 한다'는 인상을 줄 수 있습니다.",
    tip: "대화의 절반 이상을 상대에게 내어주는 연습을 해보세요. 상대가 말할 때 끝까지 듣고 한 박자 쉬었다가 반응하면, 같은 에너지가 훨씬 매력적으로 전달됩니다.",
  },
  정: {
    symbol: "촛불·달빛(丁火)",
    keyword: "은근하고 섬세한 인상",
    desc: "처음엔 조용하고 튀지 않지만, 대화가 이어질수록 따뜻하고 세심한 분위기가 드러납니다. 작은 것까지 챙겨주는 다정함이 느껴지는 타입입니다.",
    merit: "은은하지만 따뜻한 인상. 알아갈수록 매력이 더해지는 '슬로우 스타터'형입니다.",
    risk: "처음 만남에서는 존재감이 약하거나 소심하게 보일 수 있고, '말이 없네', '낯을 많이 가리나봐'라는 오해를 살 수 있습니다.",
    tip: "첫 만남에서 먼저 가벼운 말 한마디(인사, 짧은 질문)를 건네는 것만으로 인상이 확 달라집니다. 어깨를 펴고 목소리 크기를 평소보다 살짝 키워보세요.",
  },
  무: {
    symbol: "산(戊土)",
    keyword: "묵직하고 믿음직한 인상",
    desc: "표정 변화가 크지 않고 말도 신중하게 하는 편이라, 처음 본 사람에게 '진중하다', '듬직하다'는 느낌을 줍니다. 쉽게 흔들리지 않는 안정감이 있습니다.",
    merit: "안정감과 포용력이 느껴지는 인상. 한번 신뢰가 쌓이면 오래가는 관계를 만드는 타입입니다.",
    risk: "표정과 반응이 느리다 보면 '둔하다', '재미없다', '나한테 관심이 없나'라는 오해를 줄 수 있습니다.",
    tip: "대화 중 리액션(끄덕임, 짧은 감탄사)을 의식적으로 늘려보세요. 처음 만난 자리에서 한 번 정도는 먼저 질문을 건네는 것도 도움이 됩니다.",
  },
  기: {
    symbol: "논밭(己土)",
    keyword: "수더분하고 무난한 인상",
    desc: "꾸밈없고 편안한 분위기라서 누구에게나 부담을 주지 않습니다. 함께 있으면 마음이 편해지는, 무리에 자연스럽게 섞이는 타입입니다.",
    merit: "어디서나 편안하게 받아들여지는 인상. 적을 만들지 않는 무난함이 강점입니다.",
    risk: "너무 무난하면 '특별한 인상이 없다', '기억에 잘 안 남는다'는 평을 들을 수 있습니다.",
    tip: "자신만의 포인트(시그니처 색상, 말투, 작은 습관)를 하나 정해서 꾸준히 유지해보세요. 첫 만남에서 자기 의견이나 취향을 한 가지라도 분명히 표현하면 인상에 남습니다.",
  },
  경: {
    symbol: "칼·금속(庚金)",
    keyword: "날카롭고 카리스마 있는 인상",
    desc: "자세가 곧고 표정에 절제가 있어서, 처음 보면 '능력 있어 보인다', '세련됐다'는 느낌을 줍니다. 말도 군더더기 없이 핵심만 전달하는 편입니다.",
    merit: "프로페셔널하고 신뢰감 있는 인상. 일을 잘할 것 같은 느낌을 줍니다.",
    risk: "표정이 굳어 있으면 '도도하다', '차갑다', '말 걸기 어렵다'는 오해를 받기 쉽습니다.",
    tip: "대화를 시작할 때 의식적으로 입꼬리를 올리고, 가벼운 농담이나 일상적인 이야기로 분위기를 한 번 풀어주세요. 그 후의 진중함은 오히려 매력으로 작용합니다.",
  },
  신: {
    symbol: "보석(辛金)",
    keyword: "세련되고 깐깐한 인상",
    desc: "디테일에 신경 쓴 스타일과 정제된 말투 덕분에 '고급스럽다', '안목이 있다'는 인상을 줍니다. 동시에 예민한 감각이 표정과 말투에서 드러납니다.",
    merit: "고급스럽고 감각적인 인상. 안목과 기준이 높은 사람으로 보입니다.",
    risk: "예민함이 드러나면 '비판적이다', '눈치 보게 만든다', '거리감이 느껴진다'는 인상을 줄 수 있습니다.",
    tip: "첫 마디를 가볍고 친근한 톤으로 시작해보세요. 상대의 작은 부분을 칭찬하는 한마디만 더해도, 까칠해 보이던 인상이 '세심한 사람'으로 바뀝니다.",
  },
  임: {
    symbol: "바다(壬水)",
    keyword: "신비롭고 깊은 인상",
    desc: "표정으로 감정을 쉽게 드러내지 않고, 생각이 깊어 보이는 분위기 덕분에 '뭔가 있어 보인다', '지적이다'는 인상을 줍니다. 침착한 태도가 매력으로 작용합니다.",
    merit: "신비롭고 매력적인 인상. 궁금증을 유발하는 타입입니다.",
    risk: "속마음을 드러내지 않으면 '무심하다', '벽이 있다', '나한테 관심 없나'라는 오해를 살 수 있습니다.",
    tip: "대화 중 자신의 생각이나 감정을 한 번씩 짧게라도 표현해보세요. 상대에게 먼저 질문을 던지는 것만으로 '신비로움'이 '편안한 매력'으로 바뀝니다.",
  },
  계: {
    symbol: "이슬·안개(癸水)",
    keyword: "조용하고 청순한 인상",
    desc: "목소리가 차분하고 행동이 조심스러워서 '순수하다', '청순하다'는 인상을 줍니다. 섬세하고 부드러운 분위기가 은은하게 느껴집니다.",
    merit: "맑고 부담 없는 인상. 곁에 있으면 편안함을 주는 타입입니다.",
    risk: "목소리와 행동이 작으면 '존재감이 없다', '소극적이다', '같이 있는지도 몰랐다'는 인상을 줄 수 있습니다.",
    tip: "첫 만남에서 먼저 인사를 건네고, 평소보다 살짝 큰 목소리로 말하는 연습을 해보세요. 작은 미소와 시선 맞춤만으로도 존재감이 또렷해집니다.",
  },
};

const PILLAR_ROLE: { key: "month" | "day" | "year" | "hour"; label: string }[] = [
  { key: "month", label: "사회생활에서 사람들이 가장 먼저 느끼는 분위기" },
  { key: "day", label: "조금 친해진 뒤에 드러나는 진짜 모습" },
  { key: "year", label: "가정·성장 환경에서 형성된 기본 분위기" },
  { key: "hour", label: "헤어질 때, 마무리할 때 남는 잔상" },
];

export default function FirstImpressionPage() {
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
      <main className="min-h-screen bg-[#0a0e14] text-white flex flex-col page-fade-in">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[650px] h-[650px] rounded-full bg-amber-950/40 blur-[160px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-950/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-5 py-16 text-center">
          <FadeIn delay={0}>
            <div className="inline-block px-3 py-1 rounded-full bg-amber-900/50 border border-amber-700/40 text-amber-300 text-xs font-bold tracking-wider mb-8">
              ✨ 나도 모르는 사이, 남들에게 보이는 내 모습
            </div>
            <h1 className="text-3xl font-black mb-4 leading-tight tracking-tight">
              사주로 보는<br />
              <span className="text-amber-400">나의 첫인상</span>
            </h1>
          </FadeIn>

          <FadeIn delay={100}>
            <p className="text-gray-400 text-base mb-2 leading-relaxed">
              처음 만난 사람에게<br />
              <span className="text-gray-300 font-medium">나는 어떤 분위기로 비춰질까?</span>
            </p>
            <p className="text-gray-600 text-sm mb-12">
              천간(天干)에 새겨진 기운으로 첫인상과 개선법까지 알려드립니다
            </p>
          </FadeIn>

          <FadeIn delay={200} className="w-full">
            <div className="w-full space-y-3 mb-10 text-left">
              {[
                ["월간(月干) 중심 분석", "사회생활에서 사람들이 가장 먼저 느끼는 핵심 인상"],
                ["연·월·일·시 4기둥 종합", "베이스 톤부터 끝인상까지 단계별로 진단"],
                ["맞춤 인상 개선법", "오해를 줄이고 매력을 더하는 구체적인 방법"],
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
          </FadeIn>

          <FadeIn delay={300} className="w-full">
            <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-bold tracking-wider mb-6">
              ✦ 완전 무료
            </div>

            <button onClick={() => setStep("form")}
              className="w-full py-4 rounded-2xl font-black text-lg tracking-tight bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white shadow-lg shadow-amber-900/50 transition-all active:scale-[0.98]">
              내 첫인상 확인하기
            </button>
          </FadeIn>
        </div>
      </main>
    );
  }

  if (step === "form") {
    const ready = !!form.birthYear && !!form.birthMonth && !!form.birthDay;
    return (
      <main className="min-h-screen bg-[#0a0e14] text-white">
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
                ? "bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-500 hover:to-orange-400 text-white shadow-lg shadow-amber-900/50"
                : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
            }`}>
            첫인상 분석하기
          </button>
        </div>
      </main>
    );
  }

  if (step === "loading") {
    return (
      <AnalysisLoading
        subject="나의 첫인상"
        duration={2000}
        onDone={() => setStep("result")}
        messages={[
          "월간의 기운을 분석하는 중...",
          "연·월·일·시 4기둥을 종합하는 중...",
          "남들에게 비치는 분위기를 그려보는 중...",
          "맞춤 인상 개선법을 정리하는 중...",
        ]}
      />
    );
  }

  // ── 결과 ──
  const r = resultRef.current;
  if (!r) return null;
  const pd = r.pillarsDetail;

  // 편관 감지: 천간/지지 십성 중 하나라도 편관이면
  const fiAllSipseong = [pd.year, pd.month, pd.day, pd.hour].filter(Boolean).flatMap(p => [p?.sipseongCg, p?.sipseongJj]).filter(Boolean);
  const fiHasPyeongwan = fiAllSipseong.includes("편관");

  const pillarCgMap: Record<string, string> = {
    month: pd.month.cg,
    day: pd.day.cg,
    year: pd.year.cg,
    hour: pd.hour?.cg ?? "",
  };

  const mainCg = pd.month.cg;
  const main = CG_IMPRESSION[mainCg];

  return (
    <main className="min-h-screen bg-[#0a0e14] text-white">
      <BackButton />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-amber-950/30 blur-[160px]" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-16" id="firstimpression-result">
        <div className="text-center mb-8">
          <p className="text-amber-400 text-xs font-bold tracking-widest mb-2">FIRST IMPRESSION</p>
          <h1 className="text-2xl font-black leading-snug">
            당신의 첫인상은
          </h1>
        </div>

        {/* 메인 결과 */}
        <div className="bg-gradient-to-br from-amber-950/40 to-orange-950/10 border border-amber-700/30 rounded-2xl p-5 mb-5">
          <h2 className="text-xl font-black text-white mb-3">&quot;{main.keyword}&quot;</h2>
          <p className="text-sm text-gray-300 leading-relaxed">
            {main.desc} {main.merit} {main.risk}
            {fiHasPyeongwan && " 여기에 강한 카리스마가 더해져서 말 한마디 안 해도 포스가 느껴지는 압도적인 첫인상을 줍니다. 함부로 대할 수 없는 분위기 때문에 처음 만난 사람도 자연스럽게 긴장하게 되고, 강렬하면서도 섹시한 인상을 남기는 타입입니다."}
          </p>
        </div>

        {/* 개선법 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-amber-300 mb-2">💡 맞춤 인상 개선법</p>
          <p className="text-sm text-gray-300 leading-relaxed">{main.tip}</p>
        </div>

        {/* 4기둥 종합 */}
        <div className="mb-2">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-3 px-1">연·월·일·시, 단계별 인상</p>
        </div>
        <div className="space-y-3 mb-8">
          {PILLAR_ROLE.map(({ key, label }) => {
            const cg = pillarCgMap[key];
            if (!cg) return null;
            const info = CG_IMPRESSION[cg];
            return (
              <div key={key} className="bg-white/[0.03] border border-white/10 rounded-2xl p-4">
                <p className="text-[11px] text-gray-500 mb-2">{label}</p>
                <p className="text-sm font-bold mb-1" style={{ color: "#fbbf24" }}>&quot;{info.keyword}&quot;</p>
                <p className="text-xs text-gray-400 leading-relaxed">{info.desc}</p>
              </div>
            );
          })}
        </div>

        {/* 이용방법 안내 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-8">
          <p className="text-sm font-bold text-sky-300 mb-2">📖 이렇게 활용해보세요</p>
          <ul className="text-xs text-gray-400 leading-relaxed space-y-1.5 list-disc list-inside">
            <li>맨 위 결과는 회사·모임 등 사회생활에서 첫 만남에 가장 크게 작용합니다. 면접, 미팅, 소개팅 등 첫 만남 전에 참고해보세요.</li>
            <li>친해진 뒤 드러나는 본모습은 따로 정리되어 있으니, &apos;첫인상과 실제 성격이 다르다&apos;는 말을 듣는다면 이 차이에서 오는 경우가 많습니다.</li>
            <li>&apos;오해받기 쉬운 부분&apos;은 단점이 아니라, 같은 기운이 다르게 보이는 것뿐입니다. 개선법을 하루 한 가지씩만 의식적으로 적용해보세요.</li>
          </ul>
        </div>

        <ResultFooterActions targetId="firstimpression-result" fileName="첫인상분석" />
      </div>
    </main>
  );
}

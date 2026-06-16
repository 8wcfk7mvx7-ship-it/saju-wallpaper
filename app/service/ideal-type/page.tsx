"use client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import BackButton from "@/components/BackButton";
import { analyzeSaju, getSipseongStrength, getJijiRelations, CHEONGAN_ELEMENT, type SajuResult } from "@/lib/saju";
import { SIPSEONG_DESC } from "@/lib/saju2";
import AnalysisLoading from "@/components/AnalysisLoading";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";
import ShareImageButton from "@/components/ShareImageButton";

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

// 용신 오행 → 이상형 에너지 설명
const YONGSHIN_IDEAL: Record<string, string> = {
  목: "성장 지향적이고 유연한 에너지를 가진 사람",
  화: "열정적이고 활발한 에너지를 가진 사람",
  토: "안정적이고 포용력 있는 사람",
  금: "원칙적이고 신뢰감을 주는 사람",
  수: "차분하고 깊이 있는 지성을 지닌 사람",
};

// 일간 오행 → 외적 이상형
const ILGAN_OUTER_IDEAL: Record<string, string> = {
  목: "키가 크고 날씬한 느낌, 자연스럽고 편안한 분위기",
  화: "눈빛이 강렬하고 개성 있는 외모, 활기찬 표정",
  토: "포근하고 친근한 외모, 건강하고 균형 잡힌 체형",
  금: "깔끔하고 단정한 스타일, 날카로운 이목구비",
  수: "부드럽고 세련된 분위기, 신비로운 매력",
};

// 일지 십성 → 배우자 궁 의미
const DAYJI_SIPSEONG_DESC: Record<string, string> = {
  비견: "배우자 자리에 비견이 있어, 동등한 관계를 원하고 친구 같은 파트너십을 추구해요.",
  겁재: "배우자 자리에 겁재가 앉아 있어, 경쟁심이 있는 활기찬 관계를 원하거나 파트너에게 자극을 받고 싶어 하는 경향이 있어요.",
  식신: "배우자 자리가 식신이라, 여유롭고 나를 편하게 해주는 사람, 함께 있으면 즐거운 사람이 이상형이에요.",
  상관: "배우자 자리에 상관이 있어, 개성 강하고 자유로운 에너지를 가진 파트너에게 끌려요. 평범한 만남보다 설레는 만남을 원해요.",
  편재: "배우자 자리에 편재가 있어, 활동적이고 사교적인 파트너를 원해요. 같이 세상을 누비고 싶은 사람을 찾아요.",
  정재: "배우자 자리에 정재가 자리해, 성실하고 현실적인 사람을 원해요. 함께 안정된 삶을 만들어갈 파트너가 이상적이에요.",
  편관: "배우자 자리에 편관이 앉아, 강한 카리스마와 추진력을 가진 파트너에게 강하게 끌리는 편이에요.",
  정관: "배우자 자리에 정관이 있어, 책임감 있고 사회적으로 신뢰받는 사람이 이상형이에요.",
  편인: "배우자 자리에 편인이 있어, 독특한 감수성이나 예술성, 또는 정신적 깊이를 가진 파트너를 원해요.",
  정인: "배우자 자리에 정인이 자리해, 포용력 있고 다정하게 이끌어주는 사람에게 안정감을 느껴요.",
};

// 년지 십성 → 초기 이상형 이미지
const YEARJI_SIPSEONG_DESC: Record<string, string> = {
  비견: "어릴 때부터 '나와 비슷한 사람', 동등한 친구 같은 파트너를 이상형으로 그려왔어요.",
  겁재: "젊은 시절부터 강하고 활기찬 에너지를 가진 사람에게 끌리는 경향이 있었어요.",
  식신: "편안하고 따뜻하게 해주는 사람을 막연하게 꿈꿔왔어요.",
  상관: "개성 있고 자유로운 사람을 동경해왔어요. 틀에 박힌 이상형보다 독특한 매력을 가진 사람이요.",
  편재: "활동적이고 재미있는 사람, 삶을 풍요롭게 해줄 것 같은 사람을 무의식적으로 찾아왔어요.",
  정재: "어릴 때부터 '성실하고 믿음직한 사람'이라는 이상형을 마음에 품어왔어요.",
  편관: "강렬하고 카리스마 넘치는 사람에게 끌리는 경향이 원래부터 있었어요.",
  정관: "어릴 때부터 바르고 사회적으로 인정받는 사람을 이상형으로 생각해왔어요.",
  편인: "독특하고 신비로운 매력을 가진 사람에게 끌리는 감성이 어릴 때부터 있었어요.",
  정인: "나를 진심으로 아껴줄 포근한 사람을 이상형으로 마음에 그려왔어요.",
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
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-5 py-16 text-center">
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
              ["용신·조후로 보는 에너지 궁합", "사주의 균형을 채워줄 파트너 기운을 정확히 짚어냅니다"],
              ["관성·재성으로 보는 연애 패턴", "왜 항상 비슷한 사람을 만나는지, 그 이유가 보입니다"],
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
        <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 pb-24">
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
<<<<<<< HEAD
  const pd = r.pillarsDetail;
  const ilgan = pd.day.cg;
  const ilganEl = CHEONGAN_ELEMENT[ilgan] ?? "토";
=======

  const ilgan = r.pillarsDetail.day.cg;
  const dayJj = r.pillarsDetail.day.jj;
  const monthJj = r.pillarsDetail.month.jj;
  const yearJj = r.pillarsDetail.year.jj;
  const gender = form.gender;
  const ilganEl = CHEONGAN_ELEMENT[ilgan] ?? "목";

>>>>>>> a4f8bde (이상형 페이지: 용신/조후/궁성/관재성/외모 종합 분석으로 대폭 심화)
  const idealData = IDEAL[ilgan] ?? IDEAL["갑"];

  // 용신 기반 이상형 파트너 에너지 (이유 없이 결과만)
  const yongshinEl = r.yongshin.yongshin;
  const YONGSHIN_PARTNER: Record<string, string> = {
    목: "함께 성장하고 발전해 나가는 파트너에게 끌려요. 꿈과 방향이 있고, 유연하게 변화를 받아들이는 사람이 잘 맞아요.",
    화: "열정적이고 따뜻한 에너지를 가진 사람에게 마음이 움직여요. 같이 있으면 기운이 올라가는, 밝고 활발한 스타일이 이상형이에요.",
    토: "안정감과 든든함을 주는 사람이 진짜 이상형이에요. 오래 봐도 믿음이 가고, 말보다 행동으로 신뢰를 쌓는 사람이 잘 맞아요.",
    금: "명확하고 결단력 있는 사람에게 끌려요. 중심이 잡혀 있고 말이 깔끔한, 흐릿하지 않은 사람이 매력적으로 느껴져요.",
    수: "깊고 차분한 내면을 가진 사람에게 자연스럽게 끌려요. 겉보다 속이 풍부하고, 감정선이 섬세한 사람이 잘 맞아요.",
  };

  // 조후 기반 보완 파트너
  const monthJj = pd.month.jj;
  const SEASON_JJ: Record<string, string> = { 인:"봄", 묘:"봄", 진:"봄", 사:"여름", 오:"여름", 미:"여름", 신:"가을", 유:"가을", 술:"가을", 해:"겨울", 자:"겨울", 축:"겨울" };
  const season = SEASON_JJ[monthJj] ?? "봄";
  const HOT_JJ = new Set(["사","오","미","술"]);
  const COLD_JJ = new Set(["해","자","축","인"]);
  const johuPartner = HOT_JJ.has(monthJj)
    ? `태어난 계절이 뜨거운 편이라, 차분하고 쿨한 기운의 파트너가 자연스럽게 보완이 돼요. 감정적으로 흔들리지 않고 중심을 잡아주는 사람이 곁에 있으면 안정감이 커져요.`
    : COLD_JJ.has(monthJj)
    ? `태어난 계절이 차가운 편이라, 따뜻하고 활기찬 에너지의 파트너가 잘 맞아요. 주변을 밝히는 사람, 먼저 말 걸고 분위기를 살려주는 사람이 곁에 있으면 삶이 풍성해져요.`
    : `사주의 오행이 비교적 균형 잡혀 있어서, 특정 기운보다 나와 '다른 매력'을 가진 사람에게 자연스럽게 끌리는 경향이 있어요.`;

  // 일지(배우자 궁) 분석
  const dayJj = pd.day.jj;
  const dayJjSipseong = pd.day.sipseongJj;
  const SPOUSE_JJ_DESC: Record<string, string> = {
    자: "깊고 내면이 풍부한", 축: "성실하고 현실적인", 인: "진취적이고 당당한", 묘: "감성적이고 섬세한",
    진: "든든하고 포용력 있는", 사: "열정적이고 눈빛이 강한", 오: "밝고 존재감 넘치는", 미: "다정하고 배려 깊은",
    신: "깔끔하고 자기관리 잘하는", 유: "세련되고 미적 감각 있는", 술: "뚝심 있고 충성스러운", 해: "자유롭고 지적인",
  };
  const spouseJjDesc = SPOUSE_JJ_DESC[dayJj] ?? "매력적인";

  // 관성/재성 분석 (성별 기반)
  const gender = form.gender;
  const strength = getSipseongStrength(r);
  const gwanseong = strength.find(s => s.group === "관성");
  const jaeseong = strength.find(s => s.group === "재성");
  const targetGroup = gender === "female" ? gwanseong : jaeseong;
  const PARTNER_STATUS_DESC: Record<string, Record<string, string>> = {
    female: {
      강함: "관성이 강하게 드러나 있어, 능력 있고 사회적으로 인정받는 파트너를 원해요. 실력과 책임감을 겸비한 사람에게 자연스럽게 끌려요.",
      보통: "관성이 적절히 있어, 너무 강압적이지 않으면서도 리더십이 있는 파트너를 선호해요. 같이 성장할 수 있는 안정감 있는 사람이 이상형이에요.",
      약함: "관성이 약하거나 숨어 있어, 지나치게 틀에 박힌 사람보다 자유롭고 유연한 파트너가 잘 맞아요. 규칙보다 감성으로 통하는 사람에게 끌려요.",
      무: "관성이 없어, 전통적인 남성상보다 대등하게 소통하는 파트너를 원해요. 지배하거나 통제하려는 사람과는 오래가기 어려워요.",
    },
    male: {
      강함: "재성이 강하게 드러나 있어, 현실적이고 실속 있는 파트너에게 끌려요. 내조를 잘하거나 경제 감각이 있는 사람이 이상형이에요.",
      보통: "재성이 적절히 있어, 너무 의존적이지 않으면서도 삶을 함께 꾸려나갈 수 있는 현실 감각 있는 파트너가 잘 맞아요.",
      약함: "재성이 약해서, 물질적 조건보다 감성과 교감이 되는 파트너에게 더 끌리는 경향이 있어요. 함께 있으면 편한 사람이 진짜 이상형이에요.",
      무: "재성이 없어, 이해타산 없이 순수하게 감정으로 만나는 파트너가 맞아요. 현실적 조건보다 마음이 통하는 사람에게 자연스럽게 끌려요.",
    },
  };
  const partnerRelDesc = targetGroup ? (PARTNER_STATUS_DESC[gender]?.[targetGroup.status] ?? "") : "";

  // 외모 이상형 (일간 오행 + 일지 기반)
  const LOOKS_BY_EL: Record<string, string> = {
    목: "키가 크거나 날씬한 체형, 자연스럽고 꾸미지 않은 듯한 스타일에 끌려요. 지나치게 화려하거나 인위적인 외모보다 청량하고 자연미 있는 사람이 눈에 들어와요.",
    화: "눈빛이 강하고 존재감 있는 외모에 끌려요. 개성 있는 스타일이나 에너지가 느껴지는 사람, 표정이 풍부한 사람이 매력적으로 느껴져요.",
    토: "건강하고 안정감 있는 체형에 끌려요. 지나치게 마르거나 화려하기보다 든든하고 편안한 외모, 따뜻한 인상을 가진 사람이 이상형이에요.",
    금: "단정하고 깔끔한 스타일에 끌려요. 자기 관리가 잘된 느낌, 옷차림이나 헤어가 흐트러지지 않은 세련된 외모를 가진 사람이 시선을 끌어요.",
    수: "신비로운 분위기나 조용하면서도 깊은 눈빛을 가진 사람에게 끌려요. 말보다 눈빛으로 말하는 스타일, 묘하게 빠져드는 매력이 있는 사람이 이상형이에요.",
  };
  const looksDesc = LOOKS_BY_EL[ilganEl] ?? "";

  // 합이 되는 지지 (배우자 궁합)
  const allJj = [pd.year.jj, pd.month.jj, pd.day.jj, ...(pd.hour ? [pd.hour.jj] : [])];
  const jijiRels = getJijiRelations(allJj);
  const hapRels = jijiRels.filter(r => r.type === "육합" || r.type === "삼합" || r.type === "반합");
  const chungRels = jijiRels.filter(r => r.type === "충");
  const JJ_KR: Record<string, string> = { 자:"자(쥐)", 축:"축(소)", 인:"인(호랑이)", 묘:"묘(토끼)", 진:"진(용)", 사:"사(뱀)", 오:"오(말)", 미:"미(양)", 신:"신(원숭이)", 유:"유(닭)", 술:"술(개)", 해:"해(돼지)" };

  // 사주 내 가장 많은 십성 → saju2 SIPSEONG_DESC 활용
  const sipseongList = [
    pd.year.sipseongCg, pd.year.sipseongJj,
    pd.month.sipseongCg, pd.month.sipseongJj,
    pd.hour?.sipseongCg, pd.hour?.sipseongJj,
  ].filter(Boolean) as string[];
  const counts: Record<string, number> = {};
  sipseongList.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
  const topSipseong = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topDesc = topSipseong ? SIPSEONG_DESC[topSipseong] : null;

  // ── 용신 기반 이상형 ──
  const yongshinEl = r.yongshin?.yongshin ?? null;
  const yongshinIdeal = yongshinEl ? YONGSHIN_IDEAL[yongshinEl] : null;

  // ── 조후 보정: 월지 계절 → 파트너 에너지 선호 ──
  const warmBranches = ["인","묘","진","사","오","미"];
  const isWarmSaju = warmBranches.includes(monthJj);
  const johuPartnerDesc = isWarmSaju
    ? `${monthJj}월 출생으로 사주가 따뜻하고 활동적인 기운을 품고 있어요. 이런 사주는 상대적으로 차분하고 침착한 에너지, 조용히 중심을 잡아주는 파트너와 잘 균형을 이룹니다. 불꽃처럼 활활 타오르는 것보다 서로를 식히고 안정시켜주는 관계에서 오래 행복할 수 있어요.`
    : `${monthJj}월 출생으로 사주가 차갑고 정적인 기운을 띠고 있어요. 이런 사주는 온기와 활력을 가진 파트너, 먼저 손 내밀고 분위기를 만들어주는 사람과 만날 때 생기가 돌아요. 서로의 다름이 오히려 강점이 되는 관계가 이상적이에요.`;

  // ── 궁성 분석: 일지·년지 십성 ──
  const dayJjSipseong = r.pillarsDetail.day.sipseongJj;
  const yearJjSipseong = r.pillarsDetail.year.sipseongJj;
  const dayJjDesc = dayJjSipseong ? DAYJI_SIPSEONG_DESC[dayJjSipseong] : null;
  const yearJjDesc = yearJjSipseong ? YEARJI_SIPSEONG_DESC[yearJjSipseong] : null;

  // ── 관성·재성 분석 ──
  const strengthInfo = getSipseongStrength(r);
  const gwanseong = strengthInfo.find(s => s.group === "관성");
  const jaeseong = strengthInfo.find(s => s.group === "재성");

  let partnerPatternDesc = "";
  if (gender === "female") {
    const gwanStatus = gwanseong?.status ?? "무";
    const hasGyeongwan = sipseongList.includes("편관");
    const hasJeongwan = sipseongList.includes("정관");
    if (gwanStatus === "무") {
      partnerPatternDesc = "사주에 관성이 없거나 매우 희미해요. 이런 경우 특정 유형의 남성상을 고집하기보다 독립적이고 자유로운 관계를 자연스럽게 선호해요. 상대가 나를 완성시켜줘야 한다는 생각보다, 각자 온전한 상태로 만나는 관계를 추구하는 편이에요.";
    } else if (hasGyeongwan) {
      partnerPatternDesc = `편관이 ${gwanStatus}한 사주예요. 카리스마 있고 추진력 강한 남성에게 끌리는 경향이 있어요. 평범하고 무난한 사람보다 강렬한 에너지를 가진 사람이 더 매력적으로 느껴지고, 그 강함이 때로는 자신을 이끌어주길 기대하기도 해요.`;
    } else if (hasJeongwan) {
      partnerPatternDesc = `정관이 ${gwanStatus}한 사주예요. 책임감 있고 사회적으로 인정받는 남성상을 이상적으로 생각해요. 신뢰할 수 있고 한결같은 사람에게 진지한 감정이 생기는 편이에요.`;
    } else {
      partnerPatternDesc = `관성이 ${gwanStatus}한 편이에요. 특정 유형보다 관계의 온도와 신뢰를 중요하게 생각하는 사람에게 끌리는 경향이 있어요.`;
    }
  } else {
    const jaeStatus = jaeseong?.status ?? "무";
    const hasPyeonjae = sipseongList.includes("편재");
    const hasJeongjae = sipseongList.includes("정재");
    if (jaeStatus === "무") {
      partnerPatternDesc = "사주에 재성이 없거나 매우 희미해요. 자유롭고 독립적인 관계를 원하고, 파트너에게 많은 것을 기대하기보다 서로 자기 삶에 충실한 관계를 편하게 느껴요.";
    } else if (hasPyeonjae) {
      partnerPatternDesc = `편재가 ${jaeStatus}한 사주예요. 자유분방하고 매력적인 여성에게 끌리는 경향이 있어요. 예측 불가능하고 활동적인 에너지를 가진 사람과 함께할 때 설레고 활력이 생겨요.`;
    } else if (hasJeongjae) {
      partnerPatternDesc = `정재가 ${jaeStatus}한 사주예요. 성실하고 안정적인 여성상을 이상적으로 생각해요. 함께 현실을 꾸려나갈 수 있는 든든한 파트너를 원하는 경향이 있어요.`;
    } else {
      partnerPatternDesc = `재성이 ${jaeStatus}한 편이에요. 특정 외모보다 함께 있을 때 편안하고 신뢰가 가는 사람에게 더 깊이 끌리는 편이에요.`;
    }
  }

  // ── 외적 이상형 ──
  const outerIdeal = ILGAN_OUTER_IDEAL[ilganEl] ?? "";

  // ── 합충 관계 (일지 기준) ──
  const allJjs = [
    r.pillarsDetail.year.jj,
    r.pillarsDetail.month.jj,
    dayJj,
    ...(r.pillarsDetail.hour ? [r.pillarsDetail.hour.jj] : []),
  ];
  const jijiRelations = getJijiRelations(allJjs);
  const dayJjHap = jijiRelations.filter(rel =>
    (rel.jjA === dayJj || rel.jjB === dayJj) &&
    (rel.type === "육합" || rel.type === "삼합" || rel.type === "반합")
  );
  const dayJjChung = jijiRelations.filter(rel =>
    (rel.jjA === dayJj || rel.jjB === dayJj) && rel.type === "충"
  );

  const hapPartners = dayJjHap.map(rel => rel.jjA === dayJj ? rel.jjB : rel.jjA);
  const chungPartners = dayJjChung.map(rel => rel.jjA === dayJj ? rel.jjB : rel.jjA);

  const JJ_TO_ZI: Record<string, string> = {
    자:"쥐띠(자)", 축:"소띠(축)", 인:"호랑이띠(인)", 묘:"토끼띠(묘)",
    진:"용띠(진)", 사:"뱀띠(사)", 오:"말띠(오)", 미:"양띠(미)",
    신:"원숭이띠(신)", 유:"닭띠(유)", 술:"개띠(술)", 해:"돼지띠(해)",
  };

  return (
    <main className="min-h-screen bg-[#0a0612] text-white">
      <BackButton />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-fuchsia-950/30 blur-[160px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-violet-950/25 blur-[120px]" />
      </div>
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 pb-16" id="ideal-type-result">
        <div className="text-center mb-8">
          <p className="text-fuchsia-400 text-xs font-bold tracking-widest mb-2">THEIR TRUE IDEAL TYPE</p>
          <h1 className="text-2xl font-black leading-snug">
<<<<<<< HEAD
            {ilgan}{pd.day.jj}일주 {form.name}님이 진짜 끌리는 사람
          </h1>
        </div>

        {/* 핵심 요약 */}
=======
            {ilgan}{dayJj}일주, 그 사람이 진짜 끌리는 사람은
          </h1>
        </div>

        {/* 한 줄 요약 */}
>>>>>>> a4f8bde (이상형 페이지: 용신/조후/궁성/관재성/외모 종합 분석으로 대폭 심화)
        <div className="bg-gradient-to-br from-fuchsia-950/60 to-violet-950/40 border border-fuchsia-700/30 rounded-3xl p-6 mb-5 text-center">
          <p className="text-fuchsia-300 text-xs font-bold tracking-widest uppercase mb-2">한 줄 요약</p>
          <p className="text-xl font-black leading-snug">{idealData.type}</p>
        </div>

<<<<<<< HEAD
        {/* 성격 이상형 — 일간 기반 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-fuchsia-300 mb-2">왜 이런 사람에게 끌릴까?</p>
          <p className="text-sm text-gray-300 leading-relaxed">{idealData.desc}</p>
          <p className="text-sm text-gray-300 leading-relaxed mt-3">
            끌리는 핵심 키워드는 <span className="text-fuchsia-300 font-semibold">'{idealData.trait}'</span>이에요.
            반대로, {idealData.warn}
          </p>
        </div>

        {/* 용신 기반 파트너 에너지 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-violet-300 mb-2">사주로 보는 이상적인 파트너 에너지</p>
          <p className="text-sm text-gray-300 leading-relaxed">{YONGSHIN_PARTNER[yongshinEl] ?? ""}</p>
        </div>

        {/* 조후 보정 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-orange-300 mb-2">조후(調候)로 보는 보완 파트너</p>
          <p className="text-sm text-gray-300 leading-relaxed">{johuPartner}</p>
        </div>

        {/* 일지 배우자궁 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-cyan-300 mb-2">배우자 자리(일지)가 말해주는 이상형</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            배우자 궁인 일지에 <span className="text-cyan-300 font-semibold">{dayJj}({dayJjSipseong ?? "지지"})</span>이 자리해요.
            이 자리는 무의식적으로 원하는 파트너의 모습을 담고 있는데, {spouseJjDesc} 사람에게 자연스럽게 끌리는 구조예요.
            {dayJjSipseong && ` ${dayJjSipseong} 기운이 배우자 자리에 있다는 건, 그 에너지를 가진 상대를 통해 삶이 채워지는 패턴을 가졌다는 뜻이에요.`}
          </p>
        </div>

        {/* 관성/재성 기반 */}
        {partnerRelDesc && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-emerald-300 mb-2">{gender === "female" ? "관성(官星)으로" : "재성(財星)으로"} 보는 이상형</p>
            <p className="text-sm text-gray-300 leading-relaxed">{partnerRelDesc}</p>
          </div>
        )}

        {/* 외모 이상형 */}
        {looksDesc && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-pink-300 mb-2">외적으로 끌리는 스타일</p>
            <p className="text-sm text-gray-300 leading-relaxed">{looksDesc}</p>
          </div>
        )}

        {/* 합충으로 보는 궁합 지지 */}
        {(hapRels.length > 0 || chungRels.length > 0) && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-amber-300 mb-2">지지 합충으로 보는 궁합</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              {hapRels.length > 0 && (
                <>
                  사주 안에서 <span className="text-emerald-300 font-semibold">{hapRels.map(h => `${JJ_KR[h.jjA] ?? h.jjA}·${JJ_KR[h.jjB] ?? h.jjB} ${h.type}`).join(", ")}</span>이 형성돼요.
                  합이 되는 지지를 가진 상대와는 처음부터 편안한 기운이 흘러요.{" "}
                </>
              )}
              {chungRels.length > 0 && (
                <>
                  반면 <span className="text-rose-300 font-semibold">{chungRels.map(h => `${JJ_KR[h.jjA] ?? h.jjA}·${JJ_KR[h.jjB] ?? h.jjB} 충`).join(", ")}</span>이 있어,
                  해당 지지를 일지로 가진 상대와는 서로 자극은 되지만 충돌이 생기기 쉬운 구조예요. 끌리되 오래가기는 에너지가 많이 들어요.
                </>
              )}
            </p>
          </div>
        )}

        {/* 사주 속 연애 기운 (최다 십성) */}
        {topDesc && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-8">
            <p className="text-sm font-bold text-violet-300 mb-1">사주 속 연애 기운 — {topSipseong} ({topDesc.hanja})</p>
=======
        {/* 일간 기반 무의식적 끌림 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-fuchsia-300 mb-3">일간 {ilgan}({ilganEl}) — 무의식 속 끌림의 뿌리</p>
          <p className="text-sm text-gray-300 leading-relaxed mb-3">{idealData.desc}</p>
          <div className="flex gap-4 pt-3 border-t border-white/[0.06]">
            <div className="flex-1">
              <p className="text-xs text-emerald-400 font-semibold mb-1">끌리는 핵심</p>
              <p className="text-xs text-gray-400 leading-relaxed">{idealData.trait}</p>
            </div>
            <div className="flex-1">
              <p className="text-xs text-rose-400 font-semibold mb-1">피해야 할 유형</p>
              <p className="text-xs text-gray-400 leading-relaxed">{idealData.warn}</p>
            </div>
          </div>
        </div>

        {/* 용신 기반 이상형 */}
        {yongshinIdeal && yongshinEl && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-amber-300 mb-3">용신({yongshinEl}) — 에너지를 채워줄 파트너</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              이 사주의 용신은 <span className="text-amber-200 font-semibold">{yongshinEl}(氣)</span>예요.
              사주의 균형을 채우려면 파트너에게서 그 에너지를 받아야 오래 안정적인 관계를 유지할 수 있어요.
              그 사람에게 필요한 이상형 에너지는 <span className="text-white font-semibold">"{yongshinIdeal}"</span>입니다.
              겉으로는 잘 모를 수 있지만, 그런 에너지를 가진 상대 곁에 있을 때 내면이 편안해지고 관계가 오래 지속되는 걸 느낄 거예요.
            </p>
          </div>
        )}

        {/* 조후 보정 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-sky-300 mb-3">조후(調候) — 계절 기운으로 보는 파트너 궁합</p>
          <p className="text-sm text-gray-300 leading-relaxed">{johuPartnerDesc}</p>
        </div>

        {/* 궁성 분석 */}
        {(dayJjDesc || yearJjDesc) && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-violet-300 mb-3">궁성론(宮星論) — 배우자 자리가 말해주는 것</p>
            {dayJjDesc && (
              <p className="text-sm text-gray-300 leading-relaxed mb-3">
                <span className="text-violet-200 font-semibold">일지({dayJj})의 {dayJjSipseong}</span> —{" "}
                {dayJjDesc}
              </p>
            )}
            {yearJjDesc && (
              <p className="text-sm text-gray-400 leading-relaxed pt-3 border-t border-white/[0.06]">
                <span className="text-violet-300/80 font-semibold">년지({yearJj})의 {yearJjSipseong}</span> —{" "}
                {yearJjDesc}
              </p>
            )}
          </div>
        )}

        {/* 관성·재성 연애 패턴 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-rose-300 mb-3">
            {gender === "female" ? "관성(官星) — 그 사람이 끌리는 남성상" : "재성(財星) — 그 사람이 끌리는 여성상"}
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">{partnerPatternDesc}</p>
        </div>

        {/* 외적 이상형 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-emerald-300 mb-3">외적 이상형 — {ilgan}({ilganEl}) 일간이 끌리는 첫인상</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            {ilganEl}의 기운을 타고난 이 사람은 겉모습에서도 비슷한 결을 추구해요.
            눈에 들어오는 첫인상은 <span className="text-white font-semibold">"{outerIdeal}"</span>이에요.
            물론 외모가 전부는 아니지만, 처음 시선이 머무는 타입으로 의식적·무의식적으로 이런 분위기에 끌리는 편이에요.
          </p>
        </div>

        {/* 합충 관계 */}
        {(hapPartners.length > 0 || chungPartners.length > 0) && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-teal-300 mb-3">합충(合冲) — {dayJj}일지와 잘 맞는 상대, 조심할 상대</p>
            {hapPartners.length > 0 && (
              <p className="text-sm text-gray-300 leading-relaxed mb-3">
                <span className="text-teal-200 font-semibold">잘 맞는 지지</span> — 일지 {dayJj}는{" "}
                {hapPartners.map(j => JJ_TO_ZI[j] ?? j).join(", ")}와 합(合)이 이루어져요.
                이 지지를 가진 사람과는 자연스럽게 편안함이 생기고, 에너지 흐름이 잘 맞아요.
              </p>
            )}
            {chungPartners.length > 0 && (
              <p className="text-sm text-gray-400 leading-relaxed pt-3 border-t border-white/[0.06]">
                <span className="text-orange-300 font-semibold">조심할 지지</span> — 일지 {dayJj}는{" "}
                {chungPartners.map(j => JJ_TO_ZI[j] ?? j).join(", ")}와 충(冲) 관계예요.
                서로 강하게 자극하거나 의견 충돌이 잦을 수 있어요. 끌리지만 쉽지 않은 관계가 될 수 있으니 신중하게 접근하는 게 좋아요.
              </p>
            )}
          </div>
        )}

        {/* 십성 에너지 */}
        {topDesc && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-8">
            <p className="text-sm font-bold text-violet-300 mb-1">사주 속 가장 강한 연애 기운 — {topSipseong} ({topDesc.hanja})</p>
>>>>>>> a4f8bde (이상형 페이지: 용신/조후/궁성/관재성/외모 종합 분석으로 대폭 심화)
            <p className="text-xs text-gray-500 mb-2">{topDesc.short}</p>
            <p className="text-sm text-gray-300 leading-relaxed">{topDesc.detail}</p>
            <p className="text-sm text-amber-200/80 leading-relaxed mt-3 pt-3 border-t border-white/10">⚠️ 그림자 면: {topDesc.shadow}</p>
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
        <ShareImageButton targetId="ideal-type-result" fileName="이상형" />
      </div>
    </main>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import BackButton from "@/components/BackButton";
import { analyzeSaju, type SajuResult } from "@/lib/saju";
import AnalysisLoading from "@/components/AnalysisLoading";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";

export const dynamic = "force-dynamic";

interface DohwaType {
  id: string;
  emoji: string;
  title: string;
  rate: string; // 보유 비율 (희소성 자극)
  pct: number;  // 보유 비율(숫자) — 차트용
  power: number; // 도화력 점수 (0~100)
  desc: string;
  jealousy: string;  // 주변의 질투·부러움
  fomo: string;       // 놓치면 안 되는 기회 (FOMO)
  danger: string;     // 공포 자극 — 주의해야 할 점
  tip: string;
  partner: string;    // 이성을 선택하는 법
}

const TYPES: DohwaType[] = [
  {
    id: "나체도화형",
    emoji: "🔥",
    title: "감출 수 없는 직진 도화 — 나체도화(裸體桃花)",
    rate: "상위 4%", pct: 4, power: 97,
    desc: "일주 자체가 도화와 양인이 동시에 겹친 구조예요. 가만히 있어도 시선이 모이고, 말 한마디·눈빛 하나에도 묘한 끌림이 묻어납니다. 본인은 '난 그냥 평범하게 행동했는데?'라고 생각하지만, 상대는 이미 흔들리고 있는 경우가 많아요.",
    jealousy: "같은 자리에 있던 사람들이 '쟤는 뭘 해도 시선이 가'라는 말을 자주 합니다. 동성 친구들 사이에서는 부러움과 동시에 묘한 경계심을 사기도 해요.",
    fomo: "이 매력은 평생 일정하게 작동하지 않습니다. 특정 시기(대운·세운에서 도화 기운이 강해질 때)에 폭발적으로 드러나는데, 그 타이밍을 모르고 흘려보내면 좋은 인연이 그냥 스쳐 지나갈 수 있어요.",
    danger: "매력이 직관적으로 드러나는 만큼, 의도치 않은 구설수·삼각관계·스캔들에 휘말리기 쉬운 구조예요. '나는 아무것도 안 했는데 오해를 산다'는 경험이 반복된다면, 이 도화살의 영향일 가능성이 높습니다.",
    tip: "매력을 숨기려 하기보다, 그 매력이 향하는 '방향'을 의식적으로 관리하는 것이 핵심이에요. 누구에게 어떤 신호를 보내고 있는지 한 번 더 점검하면 불필요한 구설을 줄일 수 있습니다.",
    partner: "수많은 사람이 다가오는 만큼, '나에게 잘해주는 사람'과 '진심으로 나를 아는 사람'을 구분하는 기준이 반드시 필요해요. 첫인상이나 즉각적인 호감보다, 시간이 지나도 변하지 않는 태도·말과 행동의 일치 여부를 보세요. 특히 질투·집착을 '관심'으로 포장하는 상대는 피하는 것이 좋습니다. 나를 소유하려는 사람보다, 나의 매력을 자랑스러워하면서도 흔들리지 않는 사람이 잘 맞아요.",
  },
  {
    id: "곤랑도화형",
    emoji: "🌪️",
    title: "끌림과 갈등이 함께 오는 — 곤랑도화(滾浪桃花)",
    rate: "상위 7%", pct: 7, power: 88,
    desc: "마음은 강하게 끌리는데, 막상 가까워지면 자꾸 부딪히는 구조예요. 천간끼리는 합(合)을 이루어 깊이 연결되지만, 지지끼리는 형(刑)을 이루어 갈등이 함께 따라옵니다. '좋아하는데 왜 자꾸 싸우지?'라는 패턴이 반복된다면 바로 이 기운이에요.",
    jealousy: "주변에서는 '저렇게 싸우면서도 안 헤어지는 게 신기하다'는 말을 듣기 쉬워요. 그 강렬한 텐션 자체가 누군가에겐 부러움의 대상이 되기도 합니다.",
    fomo: "이 도화는 '안정형 연애'보다 '강렬한 한 시기'에 몰아닥치는 경우가 많아요. 그 시기를 그냥 흘려보내면, 평생 비슷한 강도의 인연을 다시 만나기 어려울 수 있습니다.",
    danger: "치정 시비, 감정 기복으로 인한 관재구설(법적 분쟁·송사)로 번질 위험이 있는 구조예요. '이 정도 갈등은 다들 겪는 거겠지'라고 넘기다가 관계가 파국으로 가는 경우가 많으니 주의가 필요합니다.",
    tip: "감정이 격해지는 순간일수록 물리적인 거리를 두는 습관이 필요해요. 강한 끌림 자체는 자산이지만, 그 에너지를 '거리 조절'이라는 안전장치 없이 그대로 쓰면 소모가 빠릅니다.",
    partner: "강렬하게 끌리는 상대일수록 더 신중하게 봐야 하는 구조예요. 만난 지 얼마 안 됐는데 감정이 롤러코스터처럼 요동친다면, 그건 운명이 아니라 위험 신호일 수 있습니다. 갈등 상황에서 감정을 조절할 줄 알고, 차분하게 대화로 풀어가는 사람을 곁에 두는 것이 핵심이에요. 반대로 싸울 때마다 자극적으로 반응하거나 잠적·연락 차단을 반복하는 상대는 이 기운을 더 증폭시킬 수 있으니 거리를 두는 게 좋습니다.",
  },
  {
    id: "녹방도화형",
    emoji: "👑",
    title: "품격 있는 인기 — 녹방도화(祿傍桃花)",
    rate: "상위 6%", pct: 6, power: 80,
    desc: "이성에게 어필하는 매력이 재물운·명예운(건록·정관)과 함께 자리한 귀한 구조예요. 일부러 끼를 부리지 않아도 '같이 있으면 든든하고 품격 있는 사람'이라는 인상을 줍니다. 인기와 신뢰를 동시에 가져가는, 흔치 않은 조합이에요.",
    jealousy: "겉으로는 화려하지 않은데 사람들이 계속 따르는 모습에, 주변에서는 '뭔가 있는데 뭔지 모르겠다'며 은근한 부러움을 느낍니다.",
    fomo: "이 매력은 사회적 위치가 올라가는 시기와 맞물려 더 강하게 작동해요. 지금 본인의 매력을 '그냥 성격'으로만 여기고 넘어가면, 좋은 인연·좋은 기회가 와도 알아채지 못하고 지나칠 수 있어요.",
    danger: "다만 이 매력을 인식하지 못한 채 방치하면, 다가오는 사람들의 '의도'를 구분하지 못해 호의를 이용당하는 경우가 생길 수 있어요. 인기 자체보다 '누가 진심으로 다가오는가'를 가려내는 안목이 필요합니다.",
    tip: "내가 가진 신뢰감과 매력을 자각하고, 이를 인간관계뿐 아니라 진로·사업적 기회에도 적극적으로 활용해보세요. 가만히 있어도 사람이 모이는 운이니, 그 사람들 중 '함께 갈 사람'을 고르는 연습이 중요합니다.",
    partner: "이 구조는 '안정감 있는 사람'을 알아보는 안목이 이미 뛰어난 편이에요. 화려한 말보다 꾸준한 신뢰를 보여주는 사람, 본인의 성취를 함께 키워줄 수 있는 사람을 선택하면 시너지가 큽니다. 단, 다가오는 사람 중에는 본인의 인맥·자원을 노리고 접근하는 경우도 섞여 있을 수 있으니, '나에게 무엇을 해줄 수 있는 사람'보다 '나와 함께 무엇을 만들 수 있는 사람'인지를 기준으로 보세요.",
  },
  {
    id: "진도화형",
    emoji: "🌸",
    title: "타고난 인기 스타 — 진도화(眞桃花)",
    rate: "상위 10%", pct: 10, power: 78,
    desc: "일지의 도화 기운이 연주나 월주에도 그대로 자리한, 말 그대로 '진짜 도화'예요. 학창 시절부터 또래 사이에서 인기가 많았거나, 가는 곳마다 누군가의 호감을 사는 경험이 반복됐을 가능성이 높습니다.",
    jealousy: "단톡방·모임에서 항상 화두에 오르는 사람. 친한 친구들조차 '쟤 인기는 진짜 어쩔 수 없다'며 인정 반, 부러움 반의 반응을 보입니다. 다만 이 인기는 동성, 특히 여성들 사이에서는 시기·미움으로 돌아오는 경우도 적지 않아요. '예쁘다고 다가오더니 뒤에서는 딴말 한다'는 경험이 있다면, 인기의 그림자 같은 부분일 수 있습니다.",
    fomo: "도화 기운은 특정 나이대(특히 청춘운이 들어오는 시기)에 가장 강하게 작동합니다. 이 시기에 인연을 너무 가볍게 흘려보내면, 나중에 '그때 그 사람이 진짜였는데'라는 후회로 남을 수 있어요.",
    danger: "선택지가 많다는 건 동시에 '결정을 미루는 습관'을 만들기도 합니다. 누구에게도 깊이 마음을 주지 않은 채 시간이 흐르면, 정작 진짜 인연이 왔을 때 놓치는 경우가 많아요.",
    tip: "인기를 '증명'하려 하기보다, 그 인기 속에서 '진짜 나에게 맞는 한 사람'을 알아보는 눈을 기르는 게 중요해요. 많은 호감 중 어떤 것이 진심인지 구분하는 연습이 필요합니다.",
    partner: "선택지가 많을수록 오히려 기준을 단순하게 정하는 것이 도움이 됩니다. '나에게 호감을 표현하는 사람'이 아니라 '내가 힘들 때 곁에 있어주는 사람'을 기준으로 삼아보세요. 특히 동성 친구들 사이에서 평판이 좋은 사람을 곁에 두면 불필요한 시기·구설을 줄일 수 있습니다. 인기에 취해 여러 사람을 동시에 만나는 듯한 태도를 보이면, 정작 진짜 인연이 떠날 수 있다는 점도 기억하세요.",
  },
  {
    id: "홍염살형",
    emoji: "💋",
    title: "색기 있는 매력 — 홍염살(紅艶殺)",
    rate: "상위 12%", pct: 12, power: 70,
    desc: "본인은 의식하지 못해도, 표정·말투·분위기에서 묘한 색기가 흘러나오는 기운이에요. 평범한 대화에도 상대가 '저 사람 좀 묘하게 신경 쓰인다'고 느끼게 만드는 힘이 있습니다.",
    jealousy: "이성 친구든 동성 친구든 '쟤 옆에 있으면 나도 같이 주목받는 느낌'이라는 말을 듣기 쉬워요. 동시에 '나만 모르는 매력'에 대한 호기심과 약간의 경계심을 동시에 받습니다.",
    fomo: "이 기운은 본인이 자신감을 가지고 드러낼 때 배가 됩니다. 반대로 위축돼서 숨기면 매력 자체가 무뎌지는데, 이 '드러내는 시기'를 놓치면 같은 강도로 다시 오기까지 시간이 걸려요.",
    danger: "이성 관계가 의도치 않게 복잡해지거나, '색정 구설'에 오르기 쉬운 구조이기도 해요. 가볍게 던진 호의가 상대에게는 다른 의미로 받아들여져 오해가 쌓이는 경우를 조심해야 합니다.",
    tip: "관계의 '온도'를 분명히 표현하는 습관이 도움이 됩니다. 매력 자체를 줄이기보다, 그 매력이 만드는 신호를 상대가 오해하지 않도록 명확한 태도를 함께 가져가세요.",
    partner: "이 색기는 본인이 의식하지 않아도 상대에게 강한 신호로 전달되기 때문에, 그 신호를 '존중'으로 받아주는 사람인지가 중요해요. 가벼운 호의를 과도하게 해석하거나, 질투·소유욕을 드러내는 상대는 피하는 게 좋습니다. 반대로, 매력을 매력 그대로 인정하면서도 관계의 선을 지켜주는 사람, 즉 '신뢰'를 기반으로 관계를 만들어가는 사람을 만나면 이 기운이 가장 건강하게 발현됩니다.",
  },
  {
    id: "도화살형",
    emoji: "🌷",
    title: "은근하게 스며드는 매력 — 도화살(桃花殺)",
    rate: "상위 18%", pct: 18, power: 58,
    desc: "화려하게 튀는 타입은 아니지만, 알면 알수록 매력이 드러나는 '슬로우 도화'예요. 처음 만났을 땐 평범했는데, 시간이 지날수록 '저 사람 자꾸 생각난다'는 말을 듣는 경우가 많습니다.",
    jealousy: "친해진 사람들 사이에서는 '저 사람이랑 있으면 편한데 왜 자꾸 보고 싶지'라는 말이 나오기 쉬워요. 화려한 인기보다 '깊은 호감'을 사는 타입이라 부러움의 결이 다릅니다.",
    fomo: "이 매력은 '관계의 시간'이 쌓일 때 빛을 발해요. 새로운 사람을 자주 만나기보다, 한 사람과의 시간을 충분히 갖는 것이 이 도화살의 진짜 힘을 끌어내는 방법입니다.",
    danger: "은근한 매력이다 보니, 본인이 매력을 발휘하고 있다는 사실 자체를 자각하지 못해 좋은 기회를 스스로 차단하는 경우가 있어요. '나는 매력 없어'라는 생각이 오히려 가장 큰 리스크입니다.",
    tip: "짧고 강한 인상보다 '꾸준한 관심'이 이 도화살의 무기예요. 누군가와 가까워지고 싶다면, 단번에 어필하기보다 자연스럽게 자주 마주치는 환경을 만들어보세요.",
    partner: "첫눈에 확 끌리는 사람보다, 시간이 갈수록 편안해지고 좋아지는 사람이 이 구조와 잘 맞아요. 처음엔 무덤덤하더라도 만남이 반복될수록 호감이 쌓이는 관계라면 좋은 신호입니다. 반면 처음에만 강렬하고 금방 시들해지는 관계는 이 은근한 매력의 가치를 제대로 못 알아보는 상대일 수 있으니, 너무 빠른 속도로 다가오는 사람은 한 번 더 살펴보는 것이 좋습니다.",
  },
  {
    id: "무도화형",
    emoji: "🧊",
    title: "도화 기운은 약하지만 — 무도화(無桃花)",
    rate: "약 47%", pct: 47, power: 12,
    desc: "사주 원국에 뚜렷한 도화살 구조가 보이지 않습니다. 다만 이건 '매력이 없다'는 뜻이 아니라, 매력이 '인기'보다는 '신뢰·실력·꾸준함' 같은 다른 형태로 드러난다는 의미예요. 도화살이 강한 사람보다 오히려 장기적인 관계에서 더 안정적인 호감을 얻는 경우가 많습니다.",
    jealousy: "화려한 인기는 없지만, '저 사람은 한번 친해지면 진짜 믿을 만하다'는 평가를 받는 타입이에요. 도화살이 강한 사람들이 오히려 이런 안정감을 부러워하기도 합니다.",
    fomo: "대운·세운에서 도화 기운이 들어오는 시기에는 평소와 다른 인기·관심을 경험할 수 있어요. 이 시기를 미리 알고 있으면, 평소보다 적극적으로 사람을 만나는 전략이 효과적입니다.",
    danger: "특별한 위험 신호는 적지만, 본인의 매력 포인트를 '없다'고 단정 짓고 자신감을 갖지 못하는 것이 가장 큰 손실이에요.",
    tip: "도화살이 약하다는 건 '천천히, 길게' 매력이 쌓이는 타입이라는 뜻이에요. 단기간의 인상보다 꾸준한 관계 유지에 집중하면 훨씬 좋은 결과를 얻을 수 있습니다.",
    partner: "화려한 즉흥적 매력보다 '꾸준함'과 '진심'을 알아볼 줄 아는 상대가 잘 맞아요. 만남 초기에 강한 스킨십이나 과한 표현으로 다가오는 사람보다는, 천천히 알아가며 신뢰를 쌓아가는 사람에게서 훨씬 깊은 관계가 만들어집니다. 본인 스스로도 '재미없는 사람'이라는 생각에 위축되지 말고, 신뢰 기반의 관계를 만들 줄 아는 사람을 적극적으로 곁에 두세요.",
  },
];

function FadeIn({ children, delay }: { children: React.ReactNode; delay: number }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return <div style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(18px)", transition: `opacity 0.9s ease ${delay}ms, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>{children}</div>;
}

// 진짜 '도화살' 계열 (홍염살은 별도의 매력살로, 도화살로 취급하지 않음)
const DOHWA_PRIORITY = ["나체도화형", "곤랑도화형", "녹방도화형", "진도화형", "도화살형"];

function pickType(sinsalNames: string[]): DohwaType {
  for (const id of DOHWA_PRIORITY) {
    const key = id.replace("형", "");
    if (sinsalNames.includes(key)) return TYPES.find(t => t.id === id)!;
  }
  return TYPES.find(t => t.id === "무도화형")!;
}

const PILLAR_LABEL: Record<string, string> = { "년": "연주", "연": "연주", "월": "월주", "일": "일주", "시": "시주" };

// 홍염살이 자리한 기둥에 따른 디테일 설명 (일주에 있을 때 가장 강하게 작동)
function getHongyeomDesc(pillars: string[]): string {
  const labels = pillars.map(p => PILLAR_LABEL[p] ?? `${p}주`);
  if (pillars.includes("일")) {
    return `${labels.join("·")} 홍염살이라 가장 기운이 강하답니다. 일주는 '나 자신'을 그대로 드러내는 자리라서, 본인이 의식하지 않아도 표정·말투·분위기에서 묘한 색기가 늘 배어 나와요. 가장 영향력이 큰 자리에 홍염살이 앉아 있는, 보기 드문 케이스입니다.`;
  }
  if (pillars.includes("월")) {
    return `${labels.join("·")} 홍염살이에요. 월주는 사회생활·대외적인 이미지를 보여주는 자리라서, 친구나 직장 동료처럼 가까운 사람들 사이에서 '묘하게 신경 쓰이는 사람'이라는 평가를 자주 듣게 됩니다.`;
  }
  if (pillars.includes("시")) {
    return `${labels.join("·")} 홍염살이에요. 시주는 인생 후반부·내가 만들어가는 환경과 관련된 자리라서, 나이가 들수록 또는 특정 상황(연애·사회생활)에 들어갔을 때 이 색기 있는 매력이 더 또렷하게 드러나는 경향이 있어요.`;
  }
  return `${labels.join("·")} 홍염살이에요. 연주는 가문·뿌리·초년운과 관련된 자리라서, 본인은 잘 못 느껴도 첫인상이나 분위기에서 은근한 색기가 묻어나는 경우가 많습니다.`;
}

export default function DohwasalPage() {
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
      name: form.name || "나", gender: form.gender,
      birthPlace: form.city || "서울", style: "auto", productType: "report", useJajasi: form.useJajasi,
    });
    setStep("loading");
  }

  if (step === "entry") {
    return (
      <main className="min-h-screen bg-[#150812] text-white flex flex-col">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[650px] h-[650px] rounded-full bg-rose-950/40 blur-[160px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-pink-950/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-5 py-16 text-center">
          <FadeIn delay={0}>
            <div className="inline-block px-3 py-1 rounded-full bg-rose-900/50 border border-rose-700/40 text-rose-300 text-xs font-bold tracking-wider mb-8">
              🌸 왜 자꾸 사람들이 나를 신경 쓸까?
            </div>
          </FadeIn>
          <FadeIn delay={80}>
            <h1 className="text-4xl font-black mb-4 leading-tight tracking-tight">
              내가 가진<br />
              <span className="text-rose-400">도화살(桃花殺)</span>은<br />
              어떤 종류일까?
            </h1>
          </FadeIn>
          <FadeIn delay={160}>
            <p className="text-gray-400 text-base mb-2 leading-relaxed">
              도화살은 하나가 아닙니다.<br />
              <span className="text-gray-300 font-medium">나체도화, 곤랑도화, 녹방도화, 진도화...</span><br />
              내 매력의 '종류'와 '부작용'을 확인해보세요.
            </p>
            <p className="text-gray-600 text-sm mb-12">
              상위 4%의 희귀한 도화살을 가지고 있을 수도 있습니다
            </p>
          </FadeIn>

          <div className="w-full space-y-3 mb-10 text-left">
            {[
              ["내 도화살 유형 진단", "7가지 도화살 유형 중 내가 가진 것은 무엇인지"],
              ["주변의 반응 (질투·부러움)", "내 매력이 주변에 어떤 영향을 미치는지"],
              ["놓치면 안 되는 타이밍 (FOMO)", "이 매력이 가장 강하게 작동하는 시기"],
              ["주의해야 할 위험 신호", "구설수·스캔들 등 도화살의 부작용과 대처법"],
            ].map(([title, desc], i) => (
              <FadeIn key={title} delay={220 + i * 70}>
                <div className="flex items-start gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={560}>
            <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-bold tracking-wider mb-6">
              ✦ 완전 무료
            </div>

            <button onClick={() => setStep("form")}
              className="w-full py-4 rounded-2xl font-black text-lg tracking-tight bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-lg shadow-rose-900/50 transition-all active:scale-[0.98]">
              내 도화살 확인하기
            </button>
          </FadeIn>
        </div>
      </main>
    );
  }

  if (step === "form") {
    const ready = !!form.birthYear && !!form.birthMonth && !!form.birthDay;
    return (
      <main className="min-h-screen bg-[#150812] text-white">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[600px] h-[600px] rounded-full bg-rose-950/40 blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">생년월일 입력</h2>
            <p className="text-gray-500 text-sm">정확한 분석을 위해 출생 정보(시간 포함)를 입력해주세요.</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <BirthInputForm value={form} onChange={setForm} label="나의 정보" accent="#f43f5e" />
          </div>
          <button onClick={handleAnalyze} disabled={!ready}
            className={`w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all active:scale-[0.98] ${
              ready
                ? "bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white shadow-lg shadow-rose-900/50"
                : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
            }`}>
            도화살 진단하기
          </button>
        </div>
      </main>
    );
  }

  if (step === "loading") {
    return (
      <AnalysisLoading
        subject="나의 도화살"
        duration={2200}
        onDone={() => setStep("result")}
        messages={[
          "사주 원국에서 도화 기운을 찾는 중...",
          "나체도화·곤랑도화·녹방도화 구조를 대조하는 중...",
          "주변에 미치는 영향을 분석하는 중...",
        ]}
      />
    );
  }

  // ── 결과 ──
  const r = resultRef.current;
  if (!r) return null;
  const ilgan = r.pillarsDetail.day.cg;
  const sinsalNames = r.sinsalList.map(s => s.name);
  const type = pickType(sinsalNames);
  const hasDohwa = DOHWA_PRIORITY.some(id => sinsalNames.includes(id.replace("형", "")));
  const myDohwaList = r.sinsalList.filter(s =>
    ["도화살", "진도화", "나체도화", "곤랑도화", "녹방도화"].includes(s.name)
  );
  const hongyeom = r.sinsalList.find(s => s.name === "홍염살");

  return (
    <main className="min-h-screen bg-[#150812] text-white">
      <BackButton />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-rose-950/30 blur-[160px]" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-16">
        <FadeIn delay={0}>
          <div className="text-center mb-8">
            <p className="text-rose-400 text-xs font-bold tracking-widest mb-2">PEACH BLOSSOM</p>
            <h1 className="text-2xl font-black leading-snug">
              {hasDohwa
                ? <>{ilgan}{r.pillarsDetail.day.jj}일주 {form.name || "나"}님,<br />당신의 도화살은</>
                : <>{form.name || "나"}님의 사주에는<br />도화살이 없어요!</>}
            </h1>
          </div>
        </FadeIn>

        {hasDohwa ? (
          <FadeIn delay={80}>
            <div className="bg-gradient-to-br from-rose-950/60 to-pink-950/40 border border-rose-700/30 rounded-3xl p-6 mb-5 text-center">
              <div className="text-4xl mb-2">{type.emoji}</div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-bold mb-2">
                보유율 {type.rate}
              </div>
              <p className="text-xl font-black leading-snug mb-3">{type.title}</p>
              <p className="text-sm text-gray-300 leading-relaxed text-left">{type.desc}</p>
            </div>
          </FadeIn>
        ) : (
          <FadeIn delay={80}>
            <div className="bg-gradient-to-br from-rose-950/60 to-pink-950/40 border border-rose-700/30 rounded-3xl p-6 mb-5 text-center">
              <div className="text-4xl mb-2">{type.emoji}</div>
              <p className="text-xl font-black leading-snug mb-3">{type.title}</p>
              <p className="text-sm text-gray-300 leading-relaxed text-left">{type.desc}</p>
            </div>
          </FadeIn>
        )}

        <FadeIn delay={120}>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-pink-300 mb-3">📊 나의 도화력은?</p>
            <div className="flex items-center gap-3 mb-1">
              <div className="flex-1 h-3 rounded-full bg-white/10 overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-pink-500 to-rose-500"
                  style={{ width: `${(!hasDohwa && hongyeom) ? type.power + 30 : type.power}%` }} />
              </div>
              <span className="text-sm font-black text-pink-300 shrink-0">
                {(!hasDohwa && hongyeom) ? type.power + 30 : type.power}점
              </span>
            </div>
            <p className="text-xs text-gray-500">
              0에 가까울수록 '무도화', 100에 가까울수록 '나체도화'처럼 강렬하고 직관적인 매력을 뜻해요.
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={160}>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-violet-300 mb-1">📈 도화살 유형별 분포</p>
            <p className="text-xs text-gray-500 mb-3">가도화(약한 도화)만 많은 사람부터, 도화 하나 없는 사람, 강한 도화년에 태어나 도화살을 타고난 사람까지 — 7개 유형 중 내 위치를 확인해보세요.</p>
            <div className="space-y-2">
              {TYPES.map(t => {
                const mine = t.id === type.id;
                return (
                  <div key={t.id} className="flex items-center gap-2">
                    <span className={`text-xs w-24 shrink-0 ${mine ? "text-white font-bold" : "text-gray-500"}`}>
                      {t.emoji} {t.id.replace("형", "")}
                    </span>
                    <div className="flex-1 h-2.5 rounded-full bg-white/5 overflow-hidden">
                      <div className={`h-full rounded-full ${mine ? "bg-gradient-to-r from-rose-500 to-pink-400" : "bg-white/15"}`}
                        style={{ width: `${t.pct * 2}%` }} />
                    </div>
                    <span className={`text-xs w-9 text-right shrink-0 ${mine ? "text-pink-300 font-bold" : "text-gray-600"}`}>{t.pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </FadeIn>

        {!hasDohwa && hongyeom && (
          <FadeIn delay={360}>
            <div className="bg-gradient-to-br from-fuchsia-950/50 to-rose-950/30 border border-fuchsia-700/30 rounded-2xl p-5 mb-5">
              <p className="text-sm font-bold text-fuchsia-300 mb-2">💋 다른 매력살: 홍염살(紅艶殺)이 있어요</p>
              <p className="text-sm text-gray-300 leading-relaxed">{getHongyeomDesc(hongyeom.pillars)}</p>
            </div>
          </FadeIn>
        )}

        <FadeIn delay={280}>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-amber-300 mb-1">😏 주변 사람들의 반응 (질투·부러움)</p>
            <p className="text-sm text-gray-300 leading-relaxed">{type.jealousy}</p>
          </div>
        </FadeIn>

        <FadeIn delay={360}>
          <div className="bg-white/[0.03] border border-violet-700/20 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-violet-300 mb-1">⏳ 지금이 그 타이밍일 수 있어요</p>
            <p className="text-sm text-gray-300 leading-relaxed">{type.fomo}</p>
          </div>
        </FadeIn>

        <FadeIn delay={440}>
          <div className="bg-white/[0.03] border border-rose-700/20 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-rose-300 mb-1">⚠ 주의해야 할 위험 신호</p>
            <p className="text-sm text-gray-300 leading-relaxed">{type.danger}</p>
          </div>
        </FadeIn>

        <FadeIn delay={520}>
          <div className="bg-white/[0.03] border border-emerald-700/20 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-emerald-300 mb-1">💡 이 매력을 다루는 법</p>
            <p className="text-sm text-gray-300 leading-relaxed">{type.tip}</p>
          </div>
        </FadeIn>

        <FadeIn delay={600}>
          <div className="bg-white/[0.03] border border-sky-700/20 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-sky-300 mb-1">💑 이성을 선택하는 법</p>
            <p className="text-sm text-gray-300 leading-relaxed">{type.partner}</p>
          </div>
        </FadeIn>

        {myDohwaList.length > 0 && (
          <FadeIn delay={680}>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-8">
              <p className="text-sm font-bold text-gray-300 mb-3">내 사주에 있는 도화 관련 신살</p>
              <div className="space-y-2">
                {myDohwaList.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-rose-400 text-xs font-bold shrink-0">{s.name}({s.hanja})</span>
                    <span className="text-xs text-gray-500 leading-relaxed">— {s.pillars.join("·")}주</span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        )}

        <FadeIn delay={760}>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => router.push("/service/charm")}
              className="py-3.5 rounded-2xl font-bold text-sm bg-white/5 border border-white/10 text-gray-300 active:scale-[0.98] transition-all">
              매력 분석 보기
            </button>
            <button onClick={() => { setStep("entry"); resultRef.current = null; }}
              className="py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-rose-600 to-pink-600 text-white active:scale-[0.98] transition-all">
              다시 분석하기
            </button>
          </div>
        </FadeIn>
      </div>
    </main>
  );
}

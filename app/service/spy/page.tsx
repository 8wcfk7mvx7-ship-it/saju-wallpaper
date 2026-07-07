"use client";
import { useState, useRef, useEffect } from "react";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={className} style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(18px)", transition: `opacity 0.8s ease ${delay}ms, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import {
  analyzeSaju, getSipseongStrength, getJijiRelations, type SajuResult,
  getJipchaknamNarrative, getHwabuJokNarrative, getMuinseongNarrative, getYangpaltongNarrative,
  getHwasuMultiHongyeomNarrative, getBigeopMultiNarrative, getPporonamNarrative, getJaengjaenamNarrative,
  getJaeseongHonjapNarrative, getGwandanyeoNarrative, getSanggwanGyeongwanNarrative,
  getGwanseongGoripNarrative, getGwanbiAmhapNarrative, getDohwaPositionNarrative,
  getGwanseongSiksangYeonaeNarrative, getGeumMokGwadaNarrative, getIndaSingangMaleNarrative,
  getStrengthTraitNarrative, getExtremeStrengthNarrative, getWoljiSingleGyeopjaeNarrative, isWoljiSingleGyeopjae,
  getHourCheonulIntactGoodFlowNarrative, isHourCheonulIntactGoodFlow,
  getEumgiGadukMaleNarrative,
} from "@/lib/saju";
import { trackTraits } from "@/lib/trackTrait";
import AnalysisLoading from "@/components/AnalysisLoading";

import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";
import ResultFooterActions from "@/components/ResultFooterActions";
import HapchungDiagram from "@/components/HapchungDiagram";

export const dynamic = "force-dynamic";

// ── 일간별 스파이 데이터 ───────────────────────────────────────────────────────
const ILGAN_SPY: Record<string, {
  style: string; desc: string;
  risk: "낮음" | "중간" | "높음"; riskColor: string;
  warning: string; redFlags: string[]; greenFlags: string[];
  jealousy: string; breakup: string; badHabit: string;
  contactPattern: string;
}> = {
  갑: {
    style: "원칙형 — 바람보다 이별 선택",
    desc: "강한 자존심이 있어 바람을 피우기보다 관계를 끊는 타입입니다. 마음이 식으면 신호 없이 떠납니다. 관계에서도 목표를 정하고 전진하는 성향이라, 파트너가 자신의 성장 방향과 맞지 않는다고 느끼면 미련 없이 결론을 내립니다.",
    risk: "낮음", riskColor: "#4ade80",
    warning: "바람기 낮음. 단, 잠수·이별 통보가 갑작스럽습니다.",
    redFlags: ["연락이 갑자기 뚝 끊기면 마음이 식은 것", "새 목표·프로젝트 생기면 관계 후순위로", "말수가 줄고 계획 공유를 안 하기 시작하면 주의"],
    greenFlags: ["한 번 선택하면 쉽게 바꾸지 않음", "배신·이중 행동을 극도로 싫어함", "자기가 선택한 파트너는 끝까지 책임지려 함"],
    jealousy: "질투심이 없는 편입니다. 파트너를 믿으면 자유를 주고, 못 믿으면 관계를 정리하는 쪽을 택합니다. 단 자존심이 건드려지면 차갑게 돌아섭니다.",
    breakup: "이별 통보는 빠르고 단호합니다. 한번 마음이 떠나면 연락도, 재회 시도도 거의 없습니다. 눈물보다 침묵으로 이별을 처리합니다. 절대 매달리지 않아요.",
    badHabit: "표현이 부족합니다. 좋아해도 티를 잘 안 내고, 문제가 생겨도 스스로 해결하려다 파트너를 소외시킵니다. 자존심 때문에 '미안해'가 늦게 나옵니다.",
    contactPattern: "연락이 뚝 끊겼다가 어느 날 목적 있는 한 마디로 돌아옵니다. 잠수 후 다시 연락이 왔다면 이미 결심이 선 것입니다. 감정 표현을 곁들인 긴 문자보다 짧고 직접적인 연락이 전형적인 패턴입니다.",
  },
  을: {
    style: "집착형 — 감기면 못 빠져나옴",
    desc: "겉은 유연해 보이지만 속은 강철 의지. 한 사람에게 깊이 빠지는 타입이라 바람기는 낮습니다. 덩굴처럼 한번 감으면 놓지 않는 성질이 있어, 집착이 때로는 과할 수 있습니다.",
    risk: "낮음", riskColor: "#4ade80",
    warning: "바람기 낮음. 오히려 과한 집착이 문제입니다.",
    redFlags: ["섭섭함을 쌓아두다 폭발", "질투심이 예상보다 훨씬 강함", "파트너의 이성 관계에 지나치게 신경 씀"],
    greenFlags: ["내 사람에게 올인하는 타입", "새로운 이성에게 쉽게 마음 열지 않음", "한번 정한 파트너는 긴 시간을 함께하려 함"],
    jealousy: "질투심이 매우 강합니다. 직접 표현하지 않고 속으로 삭히다가 한꺼번에 터뜨리는 패턴이 많습니다. 파트너의 이성 친구 연락처 하나에도 며칠을 걱정합니다.",
    breakup: "이별을 쉽게 받아들이지 못합니다. 재회를 시도하거나 긴 시간 미련을 가지는 경우가 많습니다. 마지막 이별 통보는 한번 나오면 최종적이지만, 그 전까지 여러 번 흔들립니다.",
    badHabit: "삐치면 말을 안 합니다. 서운함을 직접 말하지 않고 눈치 채주기를 기대하다가 상대가 모르면 더 상처받습니다. 집착이 통제처럼 느껴질 수 있습니다.",
    contactPattern: "연락 빈도가 높고 미련을 놓지 못합니다. 이별 후에도 SNS 반응이나 간접 연락으로 존재를 알리는 경우가 많습니다. 한번 마음이 남으면 직접 연락하지 않더라도 지속적으로 상대 동향을 살핍니다.",
  },
  병: {
    style: "열정형 — 불꽃이 다른 곳으로 튈 수 있음",
    desc: "태양처럼 밝고 에너지가 강합니다. 자신을 중심으로 주변이 돌아가는 걸 좋아하고, 관심과 사랑을 끊임없이 받고 싶어합니다. 에너지가 식으면 빠르게 새로운 자극을 찾습니다.",
    risk: "중간", riskColor: "#fbbf24",
    warning: "자극이 식으면 다른 곳에서 채우려 할 수 있습니다.",
    redFlags: ["권태기에 이성 친구에게 에너지 쏟음", "관심 받고 싶어 다른 이성에게 적극적 행동", "관계 이야기를 주변에 너무 많이 공유함"],
    greenFlags: ["솔직해서 이중적 행동은 드묾", "들키면 바로 털어놓는 경향", "감정이 식으면 직접 말하는 타입"],
    jealousy: "질투가 생기면 바로 티를 냅니다. 속에 쌓아두지 않고 즉각 반응하는 타입이라 상대방은 오히려 알아채기 쉽습니다. 공개적 질투 표현이 많습니다.",
    breakup: "이별 후 빠르게 새 시작을 찾습니다. 오래 혼자 있지 못하고 새로운 인연을 빨리 찾는 경향이 있습니다. 이별 직후엔 상처가 크지만 회복도 빠릅니다.",
    badHabit: "관심받고 싶어 과하게 행동합니다. 파트너가 충분히 반응해주지 않으면 다른 이성에게서 반응을 채우려 하는 패턴이 있습니다. 감정 표현이 과해 상대를 압도하기도 합니다.",
    contactPattern: "적극적이고 빠르게 먼저 연락합니다. 긴 침묵을 못 견디고 먼저 말을 걸어오는 경우가 많습니다. 관심 있을 때는 잦고 화려하게 연락하고, 마음이 식으면 갑자기 연락이 사라지는 것이 신호입니다.",
  },
  정: {
    style: "감성형 — 공감해주는 이성에게 취약",
    desc: "촛불처럼 은은하지만 한 번 빠지면 깊어집니다. 감정 이입이 강해 자신의 감정을 진심으로 알아주는 이성에게 위험하게 흔들릴 수 있습니다. 파트너가 감정 교감을 소홀히 하면 다른 곳에서 채우려 할 수 있습니다.",
    risk: "중간", riskColor: "#fbbf24",
    warning: "감정적으로 공감해주는 이성에게 취약합니다.",
    redFlags: ["'우리 그냥 친구야'가 위험 신호", "감성 나누는 이성 친구가 많아지면 주의", "파트너에게 자신의 감정을 설명하길 포기하기 시작하면 위험"],
    greenFlags: ["파트너에게 진심으로 헌신하는 타입", "이중성보다 감정 표현이 솔직한 편", "깊은 감정 교감이 있으면 외부 유혹에 흔들리지 않음"],
    jealousy: "질투가 생기면 감정적으로 표현합니다. 화를 내기보다 상처받았다는 표현이 먼저 나옵니다. 파트너가 다른 이성에게 감정을 쏟는다고 느끼면 극도로 불안해합니다.",
    breakup: "이별 후 오래 아파합니다. 깊이 감정을 쏟았기 때문에 쉽게 놓아주지 못합니다. 재회를 시도하거나 잊지 못해 전 파트너에 대한 감정을 오랫동안 품는 경우가 많습니다.",
    badHabit: "감정을 너무 깊이 가져갑니다. 상대의 작은 말 한마디에 상처받고 혼자 생각을 키우다가 터뜨리는 패턴이 있습니다. 감정 표현이 과해 파트너를 지치게 합니다.",
    contactPattern: "감성적인 콘텐츠(노래, 영상, 글)를 공유하며 간접적으로 감정을 전합니다. 갑자기 오는 새벽 연락이 많고, 한 번 연락이 오면 깊은 이야기로 이어지는 경향이 있습니다. 연락 없는 시간이 오래되면 오히려 더 큰 감정의 폭발이 올 수 있습니다.",
  },
  무: {
    style: "안정형 — 큰 산은 잘 안 움직임",
    desc: "한 번 자리 잡으면 잘 움직이지 않는 안정형입니다. 관계의 안정과 의리를 가장 중시하는 타입이라 바람기 자체가 낮습니다. 단, 감정 표현이 부족해 파트너가 외로움을 느끼기 쉽습니다.",
    risk: "낮음", riskColor: "#4ade80",
    warning: "바람기 매우 낮음. 단, 표현 부족으로 파트너가 외로울 수 있습니다.",
    redFlags: ["감정 표현이 적어 상대가 외로움 호소", "무뚝뚝함이 '관심 없음'으로 오해 받음", "문제가 생겨도 쉽게 말을 못 꺼내 갈등이 쌓임"],
    greenFlags: ["의리와 책임감이 강함", "관계 자체를 무너뜨리는 행동 거의 안 함", "파트너가 힘들 때 묵묵히 곁을 지키는 타입"],
    jealousy: "질투를 거의 표현하지 않습니다. 속으로는 신경 쓰면서도 태연한 척하는 경향이 있습니다. 파트너가 질투를 알아채주길 기대하지만 표현이 없어 오히려 신경 안 쓰는 것처럼 보입니다.",
    breakup: "이별 결정이 매우 느립니다. 참고 또 참다가 정말 안 되겠다 싶을 때 최종 통보를 합니다. 한번 이별을 결심하면 번복하지 않습니다. 재회 시도도 거의 없습니다.",
    badHabit: "감정 표현이 너무 없습니다. 사랑한다는 말, 고맙다는 말을 아낍니다. 파트너가 감정적으로 채워지지 않아 관계가 점점 무료해지는 원인이 됩니다.",
    contactPattern: "연락 빈도 자체가 낮지만, 오는 연락에는 무게가 있습니다. 오랜 침묵 뒤 갑자기 안부를 묻는 패턴이 전형적입니다. 단체 대화에 조용히 먼저 반응하거나 간단한 이모티콘으로 존재감을 알리다가 서서히 개인 연락으로 발전합니다. 먼저 연락이 왔다면 생각을 많이 한 것입니다.",
  },
  기: {
    style: "이상추구형 — 완벽한 상대를 찾아다님",
    desc: "섬세하고 완벽을 추구하는 기질이 있어 현재 관계에 작은 불만이 쌓이면 더 나은 상대를 상상하기 시작합니다. 현실적이면서도 이상을 포기하지 못해 관계에서 늘 미묘한 불만족을 느끼는 경우가 있습니다.",
    risk: "중간", riskColor: "#fbbf24",
    warning: "현재 관계 만족도가 낮아지면 다른 가능성을 탐색할 수 있습니다.",
    redFlags: ["잔소리 뒤에 비교가 생기기 시작하면 주의", "완벽한 파트너 기준이 계속 올라감", "현재 관계에 대한 불만을 다른 이성에게 털어놓기 시작하면 위험"],
    greenFlags: ["관계에서 책임감은 강한 편", "바람보다 관계 개선 시도를 먼저 함", "가정적이고 배려심이 깊어 장기적으로 좋은 파트너"],
    jealousy: "질투를 간접적으로 표현합니다. 화가 났어도 직접 말하기보다 냉담해지거나 꼬투리를 잡는 식으로 나타납니다. 잔소리 뒤에 질투가 숨어있는 경우가 많습니다.",
    breakup: "이별을 쉽게 결정하지 못합니다. 머릿속으로는 헤어져야 한다고 생각하면서도 현실적 이유로 결정을 미루는 경향이 있습니다. 막상 이별하면 뒤늦게 후회하거나 재회를 시도하기도 합니다.",
    badHabit: "비교합니다. 드러내놓고 말하지는 않아도 '다른 사람은 이런데'라는 생각을 속으로 합니다. 이 기준이 파트너를 지치게 만들 수 있습니다.",
    contactPattern: "직접 연락보다 SNS 스토리 조회, 게시물 반응 등으로 먼저 신호를 보냅니다. 관심이 생기면 일상적인 안부성 메시지('밥 먹었어?')로 시작해 서서히 빈도를 높입니다. 연락 자체는 꼼꼼하고 배려 있게 하지만, 갑자기 뚝 끊기면 상처를 받았거나 거리를 두는 중입니다.",
  },
  경: {
    style: "직선형 — 이중 행동이 어려움",
    desc: "직선적이고 솔직한 성격이라 이중적인 행동 자체가 어렵습니다. 불필요한 것을 쳐내는 기질이라 관계가 안 맞으면 깔끔하게 정리를 선택합니다. 바람을 피우기보다 헤어지고 새로 시작하는 쪽을 택합니다.",
    risk: "낮음", riskColor: "#4ade80",
    warning: "바람기 낮음. 단, 현재 관계가 맞지 않으면 이별 통보가 빠릅니다.",
    redFlags: ["'우리 잘 안 맞는 것 같다' 발언이 나오면 신호", "결정이 나면 번복 없음", "갑자기 미래 계획에서 상대를 빼고 이야기하면 위험"],
    greenFlags: ["이중적 행동을 극도로 경멸", "좋아하면 직접적으로 표현, 싫으면 정리", "파트너에 대한 의리가 강하고 배신을 극히 싫어함"],
    jealousy: "질투를 직접적으로 표현합니다. 눈치껏 알아채주길 기다리지 않고 싫으면 바로 말합니다. 강도는 세지만 속은 단순합니다. 해소되면 깔끔하게 넘어가는 타입입니다.",
    breakup: "이별 통보가 매우 단호합니다. 한번 결심하면 번복이 거의 없습니다. 이별 후 재회 시도는 거의 안 합니다. 다만 드물게 마음이 돌아올 경우 직접적으로 다시 시작하자고 말하는 타입입니다.",
    badHabit: "너무 솔직합니다. 상대방의 단점이 보이면 직접 지적하는 경향이 있어 감정적으로 상처를 주기 쉽습니다. 배려보다 효율이 먼저 나옵니다.",
    contactPattern: "침묵 아니면 직격탄입니다. 연락이 완전히 끊기거나 아니면 짧고 명확하게 용건을 전합니다. 먼저 연락이 왔다는 사실 자체가 의미 있는 신호입니다. 재회를 원할 경우 돌려 말하지 않고 '다시 만날 수 있어?'처럼 직접적으로 묻는 경향이 있습니다.",
  },
  신: {
    style: "낭만추구형 — 설렘이 사라지면 위험",
    desc: "섬세한 낭만과 설렘을 추구합니다. 현재 관계의 두근거림이 사라지면 새로운 이성에게서 그 감각을 찾을 위험이 있습니다. 고급스러운 것을 추구하고 파트너에게도 높은 수준을 기대합니다.",
    risk: "높음", riskColor: "#fb923c",
    warning: "관계가 루틴해지면 외부에서 설렘을 찾을 수 있습니다.",
    redFlags: ["권태기에 갑자기 외모 관리 시작", "이성 친구에게 썸처럼 행동하는 경향", "파트너보다 다른 이성에게 더 신경 써주기 시작하면 위험"],
    greenFlags: ["감정에 솔직한 편이라 오래 숨기지는 못함", "결국 파트너와 해결하려 함", "관계에 대한 책임감은 있는 편"],
    jealousy: "질투가 생기면 냉담해집니다. 화를 내기보다 차갑게 거리를 두면서 상대방이 눈치채게 만드는 방식을 씁니다. 자존심 때문에 '나 질투해'라고 직접 말하기 어려워합니다.",
    breakup: "이별 후 겉으로는 괜찮은 척합니다. 하지만 속으로는 오래 아파하는 타입입니다. 새 인연을 찾기는 하지만 비교하는 경향이 있어 쉽게 새 관계에 만족하지 못합니다.",
    badHabit: "이상화합니다. 처음엔 완벽한 사람처럼 보다가 시간이 지나면 실망이 커집니다. 이상과 현실의 차이에 지속적으로 실망하면서 외부에서 설렘을 찾으려 합니다.",
    contactPattern: "타이밍을 계산한 뒤 정성스러운 메시지를 보냅니다. 기념일, 의미 있는 날짜, 상대가 좋아할 만한 콘텐츠를 활용해 자연스럽게 연락을 여는 방식을 씁니다. 내용 자체가 잘 다듬어져 있어 즉흥적으로 보내는 경우가 거의 없습니다. 연락이 오면 그전에 많이 생각한 것입니다.",
  },
  임: {
    style: "자유형 — 흐르는 물은 가두기 어려움",
    desc: "흐르는 강처럼 자유를 중요시합니다. 구속을 느끼거나 관계에 압박이 생기면 도망치거나 외부에서 숨구멍을 찾습니다. 다양한 사람과의 교류를 즐기고, 한 곳에 오래 집착하기 어려워하는 기질이 있습니다.",
    risk: "높음", riskColor: "#fb923c",
    warning: "자유를 억압하면 외부로 향할 수 있습니다.",
    redFlags: ["'숨막혀' 발언이 잦아지면 위험 신호", "혼자만의 시간·공간을 갑자기 강하게 요구", "새로운 취미나 모임에 갑자기 집중하기 시작하면 주의"],
    greenFlags: ["진심으로 맞는 사람이면 깊게 헌신함", "인간적 매력과 포용력은 큰 편", "솔직해서 감정이 없으면 직접 말하는 경향"],
    jealousy: "질투를 내면 깊이 숨기거나 무관심한 척합니다. 직접적인 질투 표현보다 갑자기 더 자유롭게 행동하거나 연락을 줄이는 방식으로 나타납니다. 질투 자체를 드러내는 것을 약하다고 생각하는 경향이 있습니다.",
    breakup: "이별을 자연스럽게 받아들입니다. 억지로 붙잡거나 매달리는 타입이 아닙니다. 하지만 잊을 때도 천천히, 갑자기 연락이 오거나 새 인연이 들어오면 감정이 되살아나기도 합니다.",
    badHabit: "연락이 불규칙합니다. 관계에 충분히 집중하지 않으면서도 '자유롭게 있어주는 게 사랑'이라고 생각하는 경향이 있습니다. 파트너 입장에서는 방치당하는 느낌을 받기 쉽습니다.",
    contactPattern: "가볍고 자주 연락하다가 갑자기 사라집니다. 잠수 후 아무렇지 않게 돌아오는 것도 이 유형의 특징입니다. 연락 자체는 유쾌하고 재미있지만 깊이가 없을 수 있습니다. 연락이 끊겼어도 마음이 완전히 떠난 게 아닐 수 있습니다.",
  },
  계: {
    style: "감수성형 — 공감 관계에 빠질 수 있음",
    desc: "안개처럼 감수성이 풍부합니다. 자신을 깊이 이해해주는 이성에게 감정선이 흔들리는 경우가 있습니다. 관계에서 정서적 교감을 가장 중시하는 타입입니다.",
    risk: "중간", riskColor: "#fbbf24",
    warning: "공감·위로를 잘 해주는 이성에게 감정이 흔들릴 수 있습니다.",
    redFlags: ["'그 사람은 나를 이해해줘' 발언이 나오면 주의", "감성적 교류가 깊어지는 이성 친구", "파트너보다 다른 이성에게 감정을 더 자주 털어놓으면 위험"],
    greenFlags: ["관계에 충실하고 섬세하게 챙기는 타입", "직접적인 배신보다 감정적 혼란이 더 많음", "파트너가 감정을 잘 이해해주면 강하게 밀착하는 타입"],
    jealousy: "질투를 간접적으로 표현합니다. 눈물이나 우울함으로 나타나는 경우가 많습니다. 직접 말하기보다 파트너가 알아채주길 기대하다가 실망하는 패턴이 반복됩니다.",
    breakup: "이별 후 오래 아파합니다. 감정을 쉽게 정리하지 못하고 과거 기억과 감정에 오래 머뭅니다. 재회 가능성을 마음속에 오래 열어두는 경향이 있습니다.",
    badHabit: "경계가 흐릿합니다. 이성 친구와의 관계에서 어디까지가 우정이고 어디서부터 감정인지 본인도 구분을 못 할 때가 있습니다. 이게 파트너에게 불안감을 줍니다.",
    contactPattern: "감정이 고조되면 새벽에 갑자기 연락하는 경향이 있습니다. 직접 감정을 말하기보다 음악, 영상, 글 등으로 에둘러 마음을 전달합니다. 재회를 원할 경우에도 '별일 없어?'처럼 가볍게 시작해 서서히 감정의 온도를 높이는 방식을 씁니다.",
  },
};

// ── 등급 ─────────────────────────────────────────────────────────────────────
// 점수가 높을수록 위험 신호가 많다는 뜻이라, 등급은 "안전 등급"이 아니라 "위험 등급"으로 읽어야 합니다.
// A(가장 안전)~E(가장 위험) 순으로, 위험 신호가 하나라도 누적되면 B 밑으로 빠르게 떨어지도록 구간을 좁혔습니다.
const GRADES = [
  { min: 70, grade: "E", label: "적신호", color: "#ef4444", bg: "rgba(239,68,68,0.15)", border: "rgba(239,68,68,0.35)",
    desc: "도화·집착·관계 불안 신호가 다수 겹쳐 사주 전체를 압도합니다. 냉정하게 상황을 직시할 필요가 있습니다.",
    verdict: "이 사주, 그냥 지나치기 어렵습니다." },
  { min: 50, grade: "D", label: "위험 신호", color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.30)",
    desc: "여러 위험 신호가 동시에 나타납니다. 주변 환경과 상대의 의지에 따라 크게 달라집니다.",
    verdict: "상황을 면밀히 주시하세요." },
  { min: 30, grade: "C", label: "경계 단계", color: "#fbbf24", bg: "rgba(251,191,36,0.10)", border: "rgba(251,191,36,0.25)",
    desc: "확인된 위험 신호가 있습니다. 자극적인 상황이 주어지면 흔들릴 수 있습니다.",
    verdict: "안심은 금물. 관계 점검이 필요합니다." },
  { min: 12, grade: "B", label: "주의 필요", color: "#a3e635", bg: "rgba(163,230,53,0.08)", border: "rgba(163,230,53,0.20)",
    desc: "위험 신호가 한두 가지 있지만 크게 우려할 수준은 아닙니다.",
    verdict: "비교적 안정적이지만 방심은 금물." },
  { min: 0,  grade: "A", label: "안정형", color: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.20)",
    desc: "위험 신호가 거의 없습니다. 전반적으로 안정적인 관계 패턴입니다.",
    verdict: "믿을 만한 사주입니다." },
];

function getGrade(score: number) {
  return GRADES.find(g => score >= g.min) ?? GRADES[GRADES.length - 1];
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
function SpyContent() {
  const router = useRouter();
  const [step, setStep] = useState<"entry" | "form" | "loading" | "result">("entry");
  const [myForm, setMyForm] = useState<BirthFormData>(defaultBirthData("female"));
  const [theirForm, setTheirForm] = useState<BirthFormData>(defaultBirthData("female"));
  const resultRef   = useRef<SajuResult | null>(null);
  const myResultRef = useRef<SajuResult | null>(null);
  // 훅은 조건부 early return 앞에 선언해야 함 (Rules of Hooks)
  useEffect(() => {
    if (step !== "result" || !resultRef.current) return;
    const r = resultRef.current;
    trackTraits([
      isWoljiSingleGyeopjae(r) ? "woljiSingleGyeopjae" : null,
      r.yongshin.strength === "신강" ? "strengthTrait:신강" : r.yongshin.strength === "신약" ? "strengthTrait:신약" : null,
      getExtremeStrengthNarrative(r) ? "extremeStrength" : null,
      isHourCheonulIntactGoodFlow(r) ? "hourCheonulGoodFlow" : null,
    ], "/service/spy");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  async function handleAnalyze() {
    if (!myForm.birthYear || !myForm.birthMonth || !myForm.birthDay ||
        !theirForm.birthYear || !theirForm.birthMonth || !theirForm.birthDay) return;

    let my = { year: Number(myForm.birthYear), month: Number(myForm.birthMonth), day: Number(myForm.birthDay) };
    let their = { year: Number(theirForm.birthYear), month: Number(theirForm.birthMonth), day: Number(theirForm.birthDay) };

    if (myForm.calendarType === "lunar") {
      try {
        const KLC = (await import("korean-lunar-calendar")).default;
        const klc = new KLC();
        klc.setLunarDate(my.year, my.month, my.day, myForm.isLeapMonth);
        const sol = klc.getSolarCalendar();
        if (sol?.year) { my.year = sol.year; my.month = sol.month; my.day = sol.day; }
      } catch {}
    }
    if (theirForm.calendarType === "lunar") {
      try {
        const KLC = (await import("korean-lunar-calendar")).default;
        const klc = new KLC();
        klc.setLunarDate(their.year, their.month, their.day, theirForm.isLeapMonth);
        const sol = klc.getSolarCalendar();
        if (sol?.year) { their.year = sol.year; their.month = sol.month; their.day = sol.day; }
      } catch {}
    }

    myResultRef.current = analyzeSaju({
      birthYear: my.year, birthMonth: my.month, birthDay: my.day,
      birthHour: myForm.birthHour, birthMinute: myForm.birthMinute ?? 0,
      name: "나", gender: myForm.gender,
      birthPlace: myForm.city || "서울", style: "auto", productType: "report", useJajasi: myForm.useJajasi,
    });
    resultRef.current = analyzeSaju({
      birthYear: their.year, birthMonth: their.month, birthDay: their.day,
      birthHour: theirForm.birthHour, birthMinute: theirForm.birthMinute ?? 0,
      name: "그 사람", gender: theirForm.gender,
      birthPlace: theirForm.city || "서울", style: "auto", productType: "report", useJajasi: theirForm.useJajasi,
    });
    setStep("loading");
  }

  // ── 진입 ──────────────────────────────────────────────────────────────────
  if (step === "entry") {
    return (
      <main className="min-h-screen bg-[#0a0101] text-white flex flex-col page-fade-in">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[700px] h-[700px] rounded-full bg-red-950/40 blur-[160px]" />
          <div className="absolute bottom-[-20%] right-[-15%] w-[500px] h-[500px] rounded-full bg-rose-950/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-4 pt-8 pb-16 text-center">
          <FadeIn delay={0}>
            <div className="inline-block px-3 py-1 rounded-full bg-red-900/50 border border-red-700/40 text-red-300 text-xs font-bold tracking-wider mb-8">
              ⚠ 이 분석은 매울 수 있습니다
            </div>
          </FadeIn>
          <FadeIn delay={100}>
            <h1 className="text-3xl font-black mb-4 leading-tight tracking-tight">
              애인 사주<br />
              <span className="text-red-400">염탐하기</span>
            </h1>
          </FadeIn>
          <FadeIn delay={200}>
            <p className="text-gray-400 text-base mb-2 leading-relaxed">
              당신의 편은 들지 않습니다.<br />
              <span className="text-gray-300 font-medium">오직 사실만 말합니다.</span>
            </p>
            <p className="text-gray-600 text-sm mb-12">
              나와 그 사람의 생년월일을 함께 입력합니다<br />
              성별 무관 — 동성 커플도 분석 가능합니다
            </p>
          </FadeIn>

          <FadeIn delay={300} className="w-full">
            <div className="w-full space-y-3 mb-10 text-left">
              {[
                ["도화살 · 홍염살 · 진도화", "이성을 끌어당기는 기운이 사주에 있는지"],
                ["일지 목욕 — 12운성의 색정 기운", "가장 위험한 바람기 신호"],
                ["일간별 연애 패턴", "이 사람이 관계에서 어떻게 움직이는지"],
                ["종합 바람기 위험도 A~E 등급", "냉정한 점수 판정"],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={400} className="w-full">
            <button onClick={() => setStep("form")}
              className="w-full py-4 rounded-2xl font-black text-lg tracking-tight bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white shadow-lg shadow-red-900/50 transition-all active:scale-[0.98]">
              염탐 시작하기
            </button>
          </FadeIn>

        </div>
      </main>
    );
  }

  // ── 입력 폼 ───────────────────────────────────────────────────────────────
  if (step === "form") {
    const ready = !!myForm.birthYear && !!myForm.birthMonth && !!myForm.birthDay &&
                  !!theirForm.birthYear && !!theirForm.birthMonth && !!theirForm.birthDay;
    return (
      <main className="min-h-screen bg-[#0a0101] text-white">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-20%] w-[600px] h-[600px] rounded-full bg-red-950/40 blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">


          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">생년월일 입력</h2>
            <p className="text-gray-500 text-sm">이름은 받지 않습니다. 생년월일만으로 충분합니다.</p>
          </div>

          <div className="space-y-5">
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
              <BirthInputForm value={myForm} onChange={setMyForm} label="나" accent="#8b5cf6" />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs font-bold text-gray-600 tracking-widest">VS</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
              <BirthInputForm value={theirForm} onChange={setTheirForm} label="상대방" accent="#ec4899" />
            </div>

            <p className="text-xs text-gray-600 text-center">성별 무관 — 동성 커플도 동일하게 분석됩니다.</p>

            <button onClick={handleAnalyze} disabled={!ready}
              className={`w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all active:scale-[0.98] ${
                ready
                  ? "bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white shadow-lg shadow-red-900/50"
                  : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
              }`}>
              사주 염탐 시작
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── 로딩 ──────────────────────────────────────────────────────────────────
  if (step === "loading") {
    return <AnalysisLoading subject="그 사람의 사주" duration={2800} onDone={() => setStep("result")} />;
  }

  // ── 결과 ──────────────────────────────────────────────────────────────────
  const result   = resultRef.current;
  const myResult = myResultRef.current;
  if (!result) return null;

  // ── 십성별 연애 성향 ────────────────────────────────────────────────────────
  const SIPSEONG_LOVE: Record<string, { keyword: string; desc: string; warning: string; color: string }> = {
    비견: { keyword: "독립형", desc: "자존심이 강하고 파트너와 대등한 관계를 고집합니다. 쉽게 양보하지 않습니다.", warning: "경쟁 본능이 연애에도 나타남. 파트너를 이기려 할 수 있음.", color: "#60a5fa" },
    겁재: { keyword: "욕망형", desc: "원하는 것은 반드시 쟁취하려 합니다. 감정 기복이 크고 질투심이 강합니다.", warning: "소유욕과 집착이 강해질 수 있음. 감정 폭발 주의.", color: "#818cf8" },
    식신: { keyword: "여유형", desc: "상대를 따뜻하게 챙기고 표현도 풍부합니다. 연애에서 여유롭고 행복을 추구합니다.", warning: "자기 즐거움에 빠져 관계에 소홀해질 수 있음.", color: "#4ade80" },
    상관: { keyword: "표현형", desc: "감정 표현이 과감하고 상대를 통제하려는 경향이 있습니다. 자유로운 연애를 추구합니다.", warning: "기존 관계에 쉽게 만족 못 함. 이탈·변심 가능성.", color: "#facc15" },
    정재: { keyword: "안정형", desc: "성실하고 책임감 있는 파트너입니다. 현실적으로 안정된 관계를 추구합니다.", warning: "융통성 부족. 지나치게 계산적일 수 있음.", color: "#34d399" },
    편재: { keyword: "자유형", desc: "다수 이성과 교류하며 매력적이고 자유분방합니다. 한 사람에게 오래 집중하기 어렵습니다.", warning: "바람기와 이중성 가능성. 가장 위험한 십성.", color: "#f97316" },
    정관: { keyword: "원칙형", desc: "약속과 도리를 중시하는 파트너입니다. 책임감이 있고 관계를 지킵니다.", warning: "지나친 원칙으로 관계가 딱딱해질 수 있음.", color: "#38bdf8" },
    편관: { keyword: "카리스마형", desc: "강한 의지와 추진력으로 상대를 압도합니다. 극과 극의 관계 패턴이 나타납니다.", warning: "강압적이거나 충동적일 수 있음. 다혈질 주의.", color: "#a78bfa" },
    정인: { keyword: "포용형", desc: "상대를 아끼고 감싸줍니다. 어머니 같은 따뜻함으로 관계에서 헌신합니다.", warning: "의존성이 강해지거나 상대를 과보호할 수 있음.", color: "#f0abfc" },
    편인: { keyword: "독립형", desc: "자유롭고 독창적입니다. 비밀주의적이며 서운함이 쌓이면 조용히 사라집니다.", warning: "감정을 쉽게 표현 안 해 상대가 답답해함. 잠수 주의.", color: "#94a3b8" },
  };

  // ── 일간별 이상형·끌리는 이유 ──────────────────────────────────────────────
  const IDEAL_TYPE: Record<string, { type: string; why: string; notType: string }> = {
    갑: { type: "나를 인정해주고 함께 성장하는 파트너. 능력 있고 독립적인 사람.", why: "강인하고 추진력 있는 모습. 리더십과 자기 기준이 확실한 사람.", notType: "지나치게 의존적이거나 목표 없이 흘러가는 사람은 매력을 못 느낍니다." },
    을: { type: "따뜻하고 나를 감싸주는 사람. 감성적이고 섬세한 파트너.", why: "부드럽고 유연하게 맞춰주는 모습. 덩굴처럼 포근하게 기대게 하는 에너지.", notType: "너무 딱딱하거나 냉정한 사람은 힘듭니다." },
    병: { type: "에너지 넘치고 솔직한 파트너. 밝고 활기 있는 사람.", why: "태양 같은 존재감. 주변을 환하게 만드는 사람.", notType: "소극적이고 어두운 분위기는 오래 곁에 있기 어렵습니다." },
    정: { type: "감성 깊고 나를 진심으로 이해해주는 사람.", why: "촛불 같은 깊고 은은한 따뜻함. 마음이 연결된다는 느낌.", notType: "감정 교감이 없는 건조한 관계는 금방 식습니다." },
    무: { type: "안정감 있고 신뢰할 수 있는 파트너. 가정적인 사람.", why: "든든하고 믿음직한 존재감. 흔들리지 않는 사람.", notType: "자유분방하고 들뜬 사람과는 장기 관계가 힘듭니다." },
    기: { type: "꼼꼼하고 세심하게 챙겨주는 사람. 나를 잘 알아봐주는 파트너.", why: "섬세하게 맞춰주는 능력. 알아서 챙겨주는 세심함.", notType: "무뚝뚝하고 배려 없는 사람은 힘듭니다." },
    경: { type: "원칙 있고 의리 강한 파트너. 실력 있고 단단한 사람.", why: "금속처럼 반짝이는 카리스마. 강인하고 멋있는 모습.", notType: "흐리멍덩하거나 결단력 없는 사람은 답답합니다." },
    신: { type: "고급스럽고 섬세한 파트너. 품격 있는 사람.", why: "서리처럼 차갑고 고급스러운 매력. 자기 관리 철저한 모습.", notType: "지저분하거나 기준이 낮은 사람은 끌리지 않습니다." },
    임: { type: "자유롭고 신비로운 파트너. 깊고 넓은 세계관을 가진 사람.", why: "물처럼 자유롭고 깊은 에너지. 끝을 알 수 없는 매력.", notType: "좁은 세계에 갇힌 사람과는 숨이 막힙니다." },
    계: { type: "감성적이고 내 마음을 알아주는 파트너. 예민하고 섬세한 사람.", why: "안개처럼 스며드는 부드러운 에너지. 감성적 공감 능력.", notType: "무감각하고 둔한 사람과는 연결이 안 됩니다." },
  };
  const idealData = IDEAL_TYPE[result.pillarsDetail.day.cg] ?? IDEAL_TYPE["무"];

  const hasSinsal = (name: string) => result.sinsalList.some(s => s.name === name);
  const has도화   = hasSinsal("도화살");
  const has홍염   = hasSinsal("홍염살");
  const has진도화  = hasSinsal("진도화");
  const has역마   = hasSinsal("역마살");
  const iljiUunseong = result.pillarsDetail.day.uunseong;
  const hasMokYok    = iljiUunseong === "목욕";
  const haHwa        = result.dominant.includes("화");

  let rawScore = 0;
  if (has홍염)   rawScore += 25;
  if (has진도화) rawScore += 30;
  if (has도화)   rawScore += 20;
  if (has역마)   rawScore += 15;
  if (hasMokYok) rawScore += 20;
  if (haHwa)     rawScore += 10;

  const ilgan   = result.pillarsDetail.day.cg;
  const theirGender = theirForm.gender;
  const jipchaknamNarrative = getJipchaknamNarrative(result, theirGender);
  const extraNarrativeFlags = [
    jipchaknamNarrative,
    getYangpaltongNarrative(result, theirGender),
    getHwasuMultiHongyeomNarrative(result),
    getBigeopMultiNarrative(result, theirGender),
    getPporonamNarrative(result, theirGender),
    getJaengjaenamNarrative(result, theirGender),
    getJaeseongHonjapNarrative(result, theirGender),
    getGwandanyeoNarrative(result, theirGender),
    getSanggwanGyeongwanNarrative(result, theirGender),
    getGwanseongGoripNarrative(result, theirGender),
    getGwanbiAmhapNarrative(result, theirGender),
    getGwanseongSiksangYeonaeNarrative(result, theirGender),
    getDohwaPositionNarrative(result),
    getMuinseongNarrative(result),
    getGeumMokGwadaNarrative(result),
    getIndaSingangMaleNarrative(result, theirGender),
    getStrengthTraitNarrative(result),
    getExtremeStrengthNarrative(result),
    getWoljiSingleGyeopjaeNarrative(result),
    getHourCheonulIntactGoodFlowNarrative(result),
    getEumgiGadukMaleNarrative(result, theirGender),
    !jipchaknamNarrative ? getHwabuJokNarrative(result) : null,
  ];
  const extraTraitNarrative = extraNarrativeFlags.filter((s): s is string => !!s).join(" ");
  // 위 서술형 위험 신호도 등급 점수에 함께 반영 (서술에만 노출되고 점수에 빠져있던 문제 수정)
  rawScore += extraNarrativeFlags.filter(Boolean).length * 10;

  const score = Math.min(rawScore, 100);
  const grade   = getGrade(score);
  const spyData = ILGAN_SPY[ilgan] ?? ILGAN_SPY["무"];

  const dangerSinsals: { name: string; desc: string }[] = [];
  if (has진도화) dangerSinsals.push({ name: "진도화(眞桃花)", desc: "일지 기준 진짜 도화. 이성 매력과 인기가 매우 강합니다. 유혹에 노출될 가능성이 높습니다." });
  if (has홍염)  dangerSinsals.push({ name: "홍염살(紅艶殺)", desc: "색정 구설 기운. 이성과의 스캔들 가능성이 사주에 내재되어 있습니다." });
  if (has도화)  dangerSinsals.push({ name: "도화살(桃花殺)", desc: "이성에게 자연스럽게 끌리는 에너지. 주변에 이성 친구가 자연스럽게 많아집니다." });
  if (has역마)  dangerSinsals.push({ name: "역마살(驛馬殺)", desc: "한 곳에 정착 못 하는 기운. 관계에서도 새로운 자극을 끊임없이 추구합니다." });
  if (hasMokYok) dangerSinsals.push({ name: `일지 목욕(沐浴) — ${result.pillarsDetail.day.jj}`, desc: "12운성 중 색정 기운이 가장 강합니다. 유혹과 자극에 취약한 위치입니다." });

  const safePoints: string[] = [];
  if (!has도화 && !has홍염 && !has진도화) safePoints.push("도화·홍염 기운 없음 — 이성을 끌어당기는 신살이 사주에 없습니다.");
  if (!has역마) safePoints.push("역마살 없음 — 한 곳에 정착하려는 기질이 있습니다.");
  if (!hasMokYok) safePoints.push(`일지 ${result.pillarsDetail.day.jj} — 목욕이 아닙니다. 색정 기운이 강하지 않습니다.`);
  if (result.dominant.includes("토")) safePoints.push("토(土) 기운 강함 — 안정·정착 기운이 우세합니다.");
  if (result.dominant.includes("금")) safePoints.push("금(金) 기운 강함 — 원칙과 의리를 중시하는 기질이 있습니다.");
  if (safePoints.length === 0) safePoints.push("종합적으로 판단할 때 주변 환경과 본인의 의지가 결정적입니다.");

  return (
    <main className="min-h-screen bg-[#0a0101] text-white" style={{ animation: "fadeIn 0.45s ease-out" }}>
      <BackButton />
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full blur-[140px]"
          style={{ backgroundColor: grade.color + "18" }} />
        <div className="absolute bottom-[-20%] right-[-15%] w-[500px] h-[500px] rounded-full bg-red-950/20 blur-[120px]" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24" id="spy-result">



        {/* 두 사람의 일주 */}
        {myResult && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
            <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-4">두 사람의 일주</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-4 rounded-xl bg-white/[0.04] border border-white/8">
                <p className="text-[10px] text-gray-600 font-bold tracking-widest uppercase mb-1.5">나</p>
                <p className="text-2xl font-black text-white mb-0.5">{myResult.pillarsDetail.day.cg}{myResult.pillarsDetail.day.jj}</p>
                <p className="text-xs text-gray-500">일주</p>
              </div>
              <div className="text-center p-4 rounded-xl border" style={{ backgroundColor: grade.bg, borderColor: grade.border }}>
                <p className="text-[10px] font-bold tracking-widest uppercase mb-1.5" style={{ color: grade.color }}>그 사람</p>
                <p className="text-2xl font-black mb-0.5" style={{ color: grade.color }}>{result.pillarsDetail.day.cg}{result.pillarsDetail.day.jj}</p>
                <p className="text-xs text-gray-500">일주</p>
              </div>
            </div>
          </div>
        )}

        {/* 나와의 합충(合沖) 분석 — 원국 다이어그램 */}
        {myResult && result && (
          <HapchungDiagram mySaju={myResult} targetSaju={result} />
        )}

        {/* 헤더 */}
        <div className="text-center mb-6">
          <p className="text-xs text-gray-500 mb-1">그 사람의 일주</p>
          <h2 className="text-3xl font-black mb-1">{result.pillarsDetail.day.cg}{result.pillarsDetail.day.jj}일주</h2>
          <p className="text-gray-600 text-xs">{result.fourPillars}</p>
        </div>

        {/* 종합 등급 배너 */}
        <div className="rounded-2xl p-5 mb-4 border" style={{ backgroundColor: grade.bg, borderColor: grade.border }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-xs font-bold tracking-widest mb-1 block" style={{ color: grade.color }}>
                바람기 위험도 판정
              </span>
              <span className="text-4xl font-black" style={{ color: grade.color }}>
                {grade.grade}등급
              </span>
              <span className="text-lg font-bold ml-2" style={{ color: grade.color }}>{grade.label}</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black" style={{ color: grade.color }}>{score}점</p>
              <p className="text-xs text-gray-500">/ 100</p>
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2.5 mb-3">
            <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: grade.color }} />
          </div>
          <p className="text-sm text-gray-300 leading-relaxed">{grade.desc}</p>
          <p className="text-sm font-semibold mt-2" style={{ color: grade.color }}>→ {grade.verdict}</p>
        </div>

        {/* 도화 지수 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-4">도화 지수 — 사주 속 이성 기운</p>
          {dangerSinsals.length > 0 ? (
            <div className="space-y-3">
              {dangerSinsals.map(({ name, desc }) => (
                <div key={name} className="flex items-start gap-3 bg-red-950/20 border border-red-900/25 rounded-xl px-4 py-3">
                  <span className="text-red-400 text-sm mt-0.5">●</span>
                  <div>
                    <p className="text-sm font-bold text-red-300">{name}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-green-400 font-semibold text-sm">도화·홍염·진도화 없음</p>
              <p className="text-gray-500 text-xs mt-1">이성을 끌어당기는 신살이 사주에 없습니다.</p>
            </div>
          )}
        </div>

        {/* 일간별 연애 패턴 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-1">연애 패턴 — {ilgan}일간</p>
          <p className="text-base font-bold mb-3" style={{ color: spyData.riskColor }}>{spyData.style}</p>
          <p className="text-sm text-gray-300 leading-relaxed mb-4">{spyData.desc}{extraTraitNarrative ? ` ${extraTraitNarrative}` : ""}</p>
          <div className="flex items-center gap-2 bg-white/5 rounded-lg px-3 py-2 mb-4">
            <span className="text-xs text-gray-500 font-semibold">바람기 위험</span>
            <span className="text-xs font-bold" style={{ color: spyData.riskColor }}>{spyData.risk}</span>
            <span className="text-xs text-gray-600 ml-auto">{spyData.warning}</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <p className="text-xs font-bold text-red-400 mb-2">위험 신호</p>
              {spyData.redFlags.map(f => (
                <div key={f} className="flex items-start gap-2 mb-1.5">
                  <span className="text-red-500 text-xs mt-0.5 shrink-0">▲</span>
                  <p className="text-xs text-gray-400">{f}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="text-xs font-bold text-green-400 mb-2">안심 포인트</p>
              {spyData.greenFlags.map(f => (
                <div key={f} className="flex items-start gap-2 mb-1.5">
                  <span className="text-green-500 text-xs mt-0.5 shrink-0">▼</span>
                  <p className="text-xs text-gray-400">{f}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 질투·이별·나쁜버릇 심화 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-4">심층 연애 DNA — 질투·이별·버릇</p>
          <div className="space-y-3">
            <div className="rounded-xl p-3.5 border border-yellow-900/30 bg-yellow-950/10">
              <p className="text-xs font-bold text-yellow-400 mb-1.5">🫢 질투·집착 패턴</p>
              <p className="text-xs text-gray-300 leading-relaxed">{spyData.jealousy}</p>
            </div>
            <div className="rounded-xl p-3.5 border border-red-900/30 bg-red-950/10">
              <p className="text-xs font-bold text-red-400 mb-1.5">💔 이별 후 행동</p>
              <p className="text-xs text-gray-300 leading-relaxed">{spyData.breakup}</p>
            </div>
            <div className="rounded-xl p-3.5 border border-orange-900/30 bg-orange-950/10">
              <p className="text-xs font-bold text-orange-400 mb-1.5">⚠ 연애에서 나쁜 버릇</p>
              <p className="text-xs text-gray-300 leading-relaxed">{spyData.badHabit}</p>
            </div>
            <div className="rounded-xl p-3.5 border border-blue-900/30 bg-blue-950/10">
              <p className="text-xs font-bold text-blue-400 mb-1.5">📱 연락 패턴</p>
              <p className="text-xs text-gray-300 leading-relaxed">{spyData.contactPattern}</p>
            </div>
          </div>
        </div>

        {/* 십성 분석 */}
        {(() => {
          const p = result.pillarsDetail;
          const pillars = [
            { label: "연주", cg: p.year.cg, jj: p.year.jj, ssCg: p.year.sipseongCg, ssJj: p.year.sipseongJj },
            { label: "월주", cg: p.month.cg, jj: p.month.jj, ssCg: p.month.sipseongCg, ssJj: p.month.sipseongJj },
            { label: "일주", cg: p.day.cg, jj: p.day.jj, ssCg: "일간", ssJj: p.day.sipseongJj },
            ...(p.hour ? [{ label: "시주", cg: p.hour.cg, jj: p.hour.jj, ssCg: p.hour.sipseongCg, ssJj: p.hour.sipseongJj }] : []),
          ];
          const iljiSs = p.day.sipseongJj;
          const loveData = SIPSEONG_LOVE[iljiSs];
          return (
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4" style={{ animation: "fadeIn 0.7s ease-out 0.7s both" }}>
              <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-4">사주 기운 분석 — 연애 DNA</p>

              {/* 사주팔자 기운 그리드 */}
              <div className={`grid gap-2 mb-5 ${pillars.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
                {pillars.map((p2, i) => (
                  <div key={i} className={`rounded-xl p-3 text-center border ${p2.label === "일주" ? "border-red-800/40 bg-red-950/20" : "border-white/8 bg-white/[0.03]"}`}>
                    <p className="text-[10px] text-gray-600 mb-1">{p2.label}</p>
                    <p className="text-xs text-gray-400 mb-0.5">{p2.ssCg || "–"}</p>
                    <p className="text-base font-black text-white">{p2.cg}</p>
                    <div className="h-px bg-white/10 my-1.5" />
                    <p className="text-base font-black text-white">{p2.jj}</p>
                    <p className="text-xs mt-0.5" style={{ color: p2.label === "일주" ? "#fca5a5" : "rgba(255,255,255,0.35)" }}>{p2.ssJj || "–"}</p>
                  </div>
                ))}
              </div>

              {/* 일지 기운 집중 분석 */}
              {loveData && (
                <div className="rounded-xl p-4 border" style={{ borderColor: loveData.color + "40", backgroundColor: loveData.color + "10" }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: loveData.color + "20", color: loveData.color }}>
                      연애 본능
                    </span>
                    <span className="text-xs font-bold" style={{ color: loveData.color }}>{loveData.keyword}</span>
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed mb-2">{loveData.desc}</p>
                  <div className="flex items-start gap-2">
                    <span className="text-orange-400 text-xs mt-0.5 shrink-0">⚠</span>
                    <p className="text-xs text-gray-400">{loveData.warning}</p>
                  </div>
                </div>
              )}

              {/* 자유로운 이성 교류 기운 경고 */}
              {(p.year.sipseongJj === "편재" || p.month.sipseongJj === "편재" || (p.hour && p.hour.sipseongJj === "편재")) && (
                <div className="mt-3 flex items-start gap-2 bg-orange-950/30 border border-orange-700/30 rounded-xl px-4 py-3">
                  <span className="text-orange-400 text-sm mt-0.5">🔥</span>
                  <p className="text-xs text-gray-400">다수의 이성과 자유롭게 교류하는 기운이 여러 곳에 있습니다. 이성 교류가 많고 다정다감한 만큼 집중도가 낮을 수 있습니다.</p>
                </div>
              )}
            </div>
          );
        })()}

        {/* 사주 기반 안심 포인트 */}
        {safePoints.length > 0 && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
            <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-3">사주 안심 포인트</p>
            <div className="space-y-2">
              {safePoints.map(f => (
                <div key={f} className="flex items-start gap-2">
                  <span className="text-green-400 text-xs mt-0.5 shrink-0">✓</span>
                  <p className="text-xs text-gray-400 leading-relaxed">{f}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 식상·관성 세력 — 직관·충성도 심화 분석 */}
        {(() => {
          const sipseongStrength = getSipseongStrength(result);
          const sik = sipseongStrength.find(s => s.group === "식상");
          const gwan = sipseongStrength.find(s => s.group === "관성");
          const jae = sipseongStrength.find(s => s.group === "재성");
          const GROUP_LABEL: Record<string, string> = { 식상: "표현·직관 기운", 관성: "책임·충성 기운", 재성: "매력·교류 기운" };
          return (
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
              <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-3">기운 세력 — 이 사람의 연애 본능</p>
              <div className="space-y-2 mb-3">
                {[sik, gwan, jae].filter(Boolean).map(s => s && (
                  <div key={s.group} className="flex items-start gap-2">
                    <span className={`shrink-0 px-2 py-0.5 rounded-md text-xs font-bold ${
                      s.status === "강함" ? "bg-red-900/50 text-red-300" :
                      s.status === "보통" ? "bg-sky-900/50 text-sky-300" :
                      s.status === "약함" ? "bg-amber-900/50 text-amber-300" :
                      "bg-white/5 text-gray-500"
                    }`}>{GROUP_LABEL[s.group] ?? s.group} · {s.status}</span>
                    <p className="text-xs text-gray-400 leading-relaxed">{s.reason}</p>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-white/5 space-y-1.5">
                {sik?.status === "강함" && (
                  <p className="text-xs text-rose-300/80 leading-relaxed">
                    ⚠ 표현·직관 기운이 강해 — 표현 욕구가 크고 자기 감정을 밖으로 드러내야 직성이 풀리는 타입이에요. 관계 안에서 억눌리면 밖에서 위로를 찾는 패턴이 생기기 쉬워요.
                  </p>
                )}
                {gwan?.status === "강함" && (
                  <p className="text-xs text-sky-300/80 leading-relaxed">
                    책임·충성 기운이 강해 — 원칙·책임·사회적 시선을 중요하게 생각하는 타입이에요. 충동적인 바람보다는 장기적 관계를 유지하는 경향이 있어요.
                  </p>
                )}
                {jae?.status === "강함" && (
                  <p className="text-xs text-amber-300/80 leading-relaxed">
                    매력·교류 기운이 강해 — 이성에게 매력적으로 다가가는 능력과 다양한 인간관계를 동시에 유지하는 성향이 있어요. 한 사람에게만 집중하기보다 넓게 교류하는 패턴이 나타날 수 있어요.
                  </p>
                )}
              </div>
            </div>
          );
        })()}

        {/* 합충 — 관계 안정성 */}
        {(() => {
          const allJj = [result.pillarsDetail.year.jj, result.pillarsDetail.month.jj, result.pillarsDetail.day.jj, result.pillarsDetail.hour?.jj].filter(Boolean) as string[];
          const jijiRelations = getJijiRelations(allJj);
          const hapList = jijiRelations.filter(rel => ["육합","삼합","반합"].includes(rel.type));
          const chungList = jijiRelations.filter(rel => ["충","원진"].includes(rel.type));
          if (hapList.length === 0 && chungList.length === 0) return null;
          const POS_LABEL = ["년지","월지","일지","시지"];
          return (
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
              <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-3">합·충 — 관계 안정성 흐름</p>
              {hapList.map((rel, i) => (
                <p key={i} className="text-xs text-gray-400 leading-relaxed mb-1.5">
                  <span className="text-emerald-300 font-bold">{POS_LABEL[rel.a]}({rel.jjA})·{POS_LABEL[rel.b]}({rel.jjB}) {rel.type}</span> — 두 기운이 합해져 관계 자체에 끌림의 에너지가 강한 구조예요. 한 사람에게 깊게 빠지는 경향이 있고, 그만큼 이별 후 빠져나오는 것도 오래 걸려요.
                </p>
              ))}
              {chungList.map((rel, i) => (
                <p key={i} className="text-xs text-amber-300/80 leading-relaxed mb-1.5">
                  <span className="font-bold">{POS_LABEL[rel.a]}({rel.jjA})·{POS_LABEL[rel.b]}({rel.jjB}) {rel.type}</span> — 기둥 간 충돌이 있어 감정 기복이 크고, 안정된 관계보다 자극·갈등·화해의 사이클이 반복되기 쉬운 구조예요. 관계 자체가 불안정할 때 외부에서 위안을 찾으려는 충동이 커져요.
                </p>
              ))}
            </div>
          );
        })()}

        {/* 오행 분포 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-4">오행 에너지 분포</p>
          {(["목","화","토","금","수"] as const).map(el => {
            const EL_COLOR: Record<string, string> = { 목: "#4ade80", 화: "#fb923c", 토: "#fbbf24", 금: "#a78bfa", 수: "#38bdf8" };
            const EL_HAN:  Record<string, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };
            const allScores = ["목","화","토","금","수"].map(e => result.scores[e as keyof typeof result.scores]);
            const max = Math.max(...allScores);
            const s   = result.scores[el];
            const pct = max > 0 ? Math.round((s / max) * 100) : 0;
            return (
              <div key={el} className="flex items-center gap-3 mb-2.5 last:mb-0">
                <span className="text-xs font-bold w-10 shrink-0" style={{ color: EL_COLOR[el] }}>{EL_HAN[el]} {el}</span>
                <div className="flex-1 bg-white/5 rounded-full h-2 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: EL_COLOR[el], opacity: 0.8 }} />
                </div>
                <span className="text-xs text-gray-600 w-8 text-right">{s.toFixed(1)}</span>
              </div>
            );
          })}
        </div>

        {/* 이상형 · 끌리는 이유 · 나를 좋아하는 이유 — 하나의 흐름으로 통합 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
          <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-3">이 사람의 진짜 이상형과 끌림의 구조</p>
          {(() => {
            const ss = result.pillarsDetail.day.sipseongJj;
            const WHY_LIKE: Record<string, string> = {
              비견: "대등하게 맞서는 당신의 자존심과 독립심이 이 사람을 자극해요. 질 수 없다는 본능이 끌림으로 이어집니다.",
              겁재: "당신의 에너지와 매력이 이 사람의 소유욕을 자극해요. 가지고 싶어지는 존재로 보입니다.",
              식신: "당신의 따뜻함과 여유가 이 사람을 편하게 만들어요. 옆에 있으면 행복하다고 느낍니다.",
              상관: "당신의 자유로움과 독창성이 이 사람을 매혹해요. 예측불허한 매력에 빠져듭니다.",
              정재: "당신의 안정감과 신뢰감이 이 사람이 원하는 파트너상과 맞아요.",
              편재: "당신의 매력과 자유로움이 이 사람을 설레게 해요. 잡고 싶은 존재로 느껴집니다.",
              정관: "당신의 원칙과 품격이 이 사람이 추구하는 파트너와 일치해요.",
              편관: "당신의 강인함과 카리스마가 이 사람의 지배 본능을 자극해요.",
              정인: "당신의 지적 깊이와 포용력이 이 사람을 안심시켜요. 기대고 싶어집니다.",
              편인: "당신의 신비로움과 독립성이 이 사람의 호기심을 끊임없이 자극해요.",
            };
            const whyLikeMe = WHY_LIKE[ss] ?? "상대의 일지 기운이 당신과 공명해요.";
            return (
              <p className="text-sm text-gray-200 leading-relaxed">
                이 사람이 진짜로 끌리는 이상형은 {idealData.type} {idealData.why} 반대로 {idealData.notType} 한편 일지 기운을 기준으로 봤을 때 {whyLikeMe} 즉 이 사람의 이상형 구조와 지금 당신에게 끌리는 이유가 같은 뿌리에서 나오는 만큼, 두 사람의 끌림은 우연이 아니라 사주 구조상 자연스럽게 발생하는 흐름이라고 볼 수 있어요.
              </p>
            );
          })()}
        </div>

        {/* 면책 고지 */}
        <div className="bg-white/[0.02] border border-white/8 rounded-xl px-4 py-3 mb-6">
          <p className="text-xs text-gray-600 leading-relaxed text-center">
            본 분석은 사주 이론 기반 오락용 콘텐츠입니다.<br />
            실제 관계 판단의 근거로 사용하지 마세요.
          </p>
        </div>

        <button
          onClick={() => { setMyForm(defaultBirthData("female")); setTheirForm(defaultBirthData("female")); setStep("form"); }}
          className="w-full py-3.5 rounded-2xl font-bold text-sm border border-red-700/40 text-red-400 hover:bg-red-950/30 transition-all">
          다른 사람 분석하기
        </button>
        <ResultFooterActions targetId="spy-result" fileName="스파이사주" />
      </div>
    </main>
  );
}

export default function SpyPage() { return <SpyContent />; }

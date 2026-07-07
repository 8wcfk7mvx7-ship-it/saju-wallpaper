"use client";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import BackButton from "@/components/BackButton";
import {
  analyzeSaju, calcDaewoon, getYearPillar, getDayPillar, getSipseong, getUunseong,
  getJijiRelations, sortJijiRelationsByStrength, canonicalJijiPairOrder, CHEONGAN_ELEMENT, EL_STYLE, jijiElement, type SajuResult, type Element, type JijiRelation,
  UUNSEONG_DETAIL, ILGAN_PERSONALITY, getSipseongStrength,
} from "@/lib/saju";
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

const SIPSEONG_GROUP: Record<string, "비겁" | "식상" | "재성" | "관성" | "인성"> = {
  비견: "비겁", 겁재: "비겁",
  식신: "식상", 상관: "식상",
  정재: "재성", 편재: "재성",
  정관: "관성", 편관: "관성",
  정인: "인성", 편인: "인성",
};

const CG_HAP: [string, string][] = [["갑","기"],["을","경"],["병","신"],["정","임"],["무","계"]];
const CG_CHUNG: [string, string][] = [["갑","경"],["을","신"],["병","임"],["정","계"]];

// 십성 그룹별 — 오늘의 일운(日運)이 사주에 들어왔을 때 각 영역에 미치는 기본 흐름
const GROUP_TODAY: Record<string, { 총운: string; 재물: string; 애정: string; 건강: string; 공부문서: string }> = {
  비겁: {
    총운: "오늘은 '나 자신'의 기운이 강해지는 날이에요. 자신감과 추진력이 평소보다 크게 올라가서, 망설이던 일을 결단력 있게 밀고 나가기 좋은 흐름입니다. 다만 평소보다 자존심이 강해지고 남의 말을 듣기 싫어지는 경향도 함께 따라오니, 중요한 협의나 협상은 한 박자 늦추는 것이 좋아요.",
    재물: "재물 면에서는 '내 것'에 대한 집착이 강해지는 날이라, 새로운 투자나 동업·공동 지출보다는 본인 명의의 자산을 점검하는 데 집중하는 게 유리합니다. 친구·형제·동료와의 돈 거래는 특히 조심하세요.",
    애정: "연애·애정 운에서는 자기주장이 강해지는 시기라, 상대와의 의견 차이가 평소보다 크게 느껴질 수 있어요. 다만 솔직하고 직진하는 매력이 발휘되는 날이기도 해서, 고민하던 마음을 표현하기엔 나쁘지 않은 타이밍입니다.",
    건강: "건강 면에서는 체력과 활동력이 평소보다 높아지는 날이에요. 다만 그만큼 무리하기도 쉬워서, 운동이나 신체 활동은 '평소보다 조금 더'가 아니라 '적당히'로 조절하는 게 좋습니다.",
    공부문서: "공부·시험·문서 운에서는 자기 주관이 강해져 본인의 방식을 밀고 나가려는 경향이 큰 날이에요. 새로운 방법을 시도하기보단, 이미 익숙한 방식으로 밀어붙이는 것이 효율적입니다.",
  },
  식상: {
    총운: "오늘은 표현력과 아이디어가 풍부해지는 날이에요. 평소보다 말이 잘 나오고 분위기를 주도하게 되는데, 새로운 기획·창작·발표와 잘 맞는 흐름입니다. 다만 에너지를 너무 밖으로 쏟아내면 저녁쯔음 급격히 지칠 수 있으니 페이스 조절이 필요해요.",
    재물: "재물 면에서는 '소비 욕구'가 평소보다 커지는 날이에요. 맛있는 것, 예쁜 것에 지갑이 쉽게 열릴 수 있습니다. 다만 오늘 표현력·아이디어가 풍부해지는 기운이 새로운 수입원의 씨앗이 되기도 해서, 부수입·사이드 프로젝트 아이디어가 떠오른다면 메모해두면 좋아요.",
    애정: "애정 운에서는 매력과 표현력이 풍부해지는 날이라, 호감을 주고받기에 좋은 흐름입니다. 다만 감정 기복도 함께 커질 수 있어서, 가벼운 말이 오해를 살 수 있으니 표현은 풍부하게 하더라도 단어 선택은 한 번 더 생각해보세요.",
    건강: "건강 면에서는 소화기·식습관과 관련된 부분에 신경 쓰는 게 좋은 날이에요. 과식·과음이 평소보다 늘어나기 쉬우니 양을 조절하면 컨디션을 잘 유지할 수 있습니다.",
    공부문서: "공부·문서 운에서는 새로운 아이디어나 기획안이 잘 풀리는 날이에요. 다만 한 가지에 집중하기보다 여러 갈래로 생각이 뻗어나가기 쉬워서, 마감이 있는 작업은 오전 중에 핵심만 먼저 끝내두는 게 좋습니다.",
  },
  재성: {
    총운: "오늘은 현실적인 감각이 좋아지는 날이에요. 숫자·계약·거래와 관련된 일들이 평소보다 매끄럽게 풀릴 수 있습니다. 다만 돈과 관련된 기운이 강해지면 나 자신의 에너지가 분산되기 쉬워, 너무 많은 일을 동시에 벌이지 않는 것이 좋아요.",
    재물: "재물 운으로는 오늘이 한 달 중 비교적 좋은 흐름에 속해요. 미뤄둔 정산·계약·결제처럼 돈과 직접 관련된 일을 처리하기에 적합한 날입니다. 단, 큰돈이 오갈수록 충동적인 결정은 피하고 한 번 더 검토하는 습관이 필요해요.",
    애정: "애정 운에서는 상대에게 잘 챙겨주고 베푸는 마음이 커지는 날이에요. 다만 그 마음이 '내가 이만큼 했으니'라는 계산으로 흐르면 서운함이 쌓일 수 있으니, 베풀 때는 기대 없이 베푸는 마음가짐이 좋습니다.",
    건강: "건강 면에서는 과로·스트레스로 인한 소모에 주의가 필요한 날이에요. 재물·업무에 신경이 집중되는 만큼, 짧은 휴식을 의식적으로 끼워 넣는 것이 좋습니다.",
    공부문서: "공부·문서 운에서는 실용적인 정보 — 자격증, 재무, 계약서류 — 와 관련된 일이 잘 풀리는 날이에요. 다만 추상적이고 이론적인 공부는 오늘은 집중이 덜 될 수 있습니다.",
  },
  관성: {
    총운: "오늘은 책임감과 사회적 감각이 강해지는 날이에요. 평소보다 '바르게, 제대로' 하려는 마음이 커져서 조직·관계 안에서 신뢰를 쌓기에 좋은 흐름입니다. 다만 스스로에게도, 주변에도 기준이 엄격해지기 쉬워 잔소리나 지적이 늘어날 수 있으니 한 번 더 부드럽게 표현해보세요.",
    재물: "재물 면에서는 즉흥적인 지출보다 계획·규칙에 따른 흐름이 잘 맞는 날이에요. 예산을 세우거나 정기적인 지출을 정리하기에 좋습니다. 다만 세금·과태료·공적인 비용이 발생하기 쉬운 날이기도 하니 일정을 한 번 확인해두세요.",
    애정: "애정 운에서는 책임감 있는 모습이 부각되는 날이에요. 다만 통제하려는 마음이 강해질 수 있어, 상대의 자율성을 존중하는 태도가 관계를 더 편안하게 만들어줍니다. 안정적인 관계라면 진지한 이야기를 나누기에 좋은 타이밍이에요.",
    건강: "건강 면에서는 긴장도가 높아지는 날이에요. 어깨·목처럼 스트레스가 잘 쌓이는 부위가 뻐근해지기 쉬우니, 중간중간 스트레칭으로 풀어주는 게 좋습니다.",
    공부문서: "공부·문서 운에서는 시험·자격증·공식 문서와 관련된 일에 좋은 흐름이 따르는 날이에요. 규칙과 절차를 따르는 공부일수록 효율이 높아집니다. 중요한 서류 제출·계약은 오늘 처리해도 좋아요.",
  },
  인성: {
    총운: "오늘은 생각이 차분해지고 한 발 물러서서 상황을 보게 되는 날이에요. 직관과 통찰이 좋아지는 흐름이라, 새로운 결정을 내리기보다는 정리·점검·휴식에 잘 맞는 하루입니다. 다만 생각이 너무 많아져 행동으로 옮기는 게 늦어질 수 있어요.",
    재물: "재물 면에서는 큰 움직임보다 '지키고 정리하는' 흐름이 좋은 날이에요. 보험·저축·자산 점검처럼 안정성을 챙기는 일에 잘 맞습니다. 새로운 투자 결정은 오늘보다 다른 날로 미루는 게 좋아요.",
    애정: "애정 운에서는 정서적인 교감이 중요해지는 날이에요. 깊은 대화를 나누거나, 서로의 생각을 이해하는 시간을 가지면 관계가 한층 단단해질 수 있습니다. 다만 너무 많은 생각으로 혼자 결론을 내려버리지 않도록 주의하세요.",
    건강: "건강 면에서는 휴식과 회복이 핵심인 날이에요. 평소 피로가 쌓여 있었다면 오늘은 무리한 일정보다 충분한 수면과 휴식을 우선하는 것이 장기적으로 도움이 됩니다.",
    공부문서: "공부·문서 운에서는 새로운 내용을 받아들이고 이해하는 능력이 좋아지는 날이에요. 독서, 강의 수강, 자격증 공부처럼 '입력' 중심의 학습에 특히 잘 맞습니다.",
  },
};

// 1~9 등급 계산 — 도메인별 십성그룹 + 12운성 복합 평가
const UUNSEONG_BASE_SCORE: Record<string, number> = {
  장생: 2, 건록: 1, 제왕: 2, 관대: 3, 양: 4, 목욕: 5, 태: 5, 쇠: 6, 병: 7, 묘: 8, 절: 8, 사: 9,
};
type DomainKey = "재물" | "애정" | "건강" | "공부문서";
const GROUP_DOMAIN_MOD: Record<string, Record<DomainKey, number>> = {
  비겁: { 재물: +1, 애정: +1, 건강: -1, 공부문서: +1 },
  식상: { 재물: 0,  애정: -2, 건강: 0,  공부문서: 0  },
  재성: { 재물: -2, 애정: -1, 건강: +1, 공부문서: +1 },
  관성: { 재물: -1, 애정: 0,  건강: +1, 공부문서: -1 },
  인성: { 재물: +1, 애정: -1, 건강: -1, 공부문서: -2 },
};
function calcDomainGrade(group: string, uunseong: string, domain: DomainKey, hapBonus: boolean, chungPenalty: boolean): number {
  const base = UUNSEONG_BASE_SCORE[uunseong] ?? 5;
  const mod = GROUP_DOMAIN_MOD[group]?.[domain] ?? 0;
  const hap = hapBonus ? -1 : 0;
  const chung = chungPenalty ? +1 : 0;
  return Math.max(1, Math.min(9, base + mod + hap + chung));
}
const GRADE_LABEL: Record<number, { label: string; color: string }> = {
  1: { label: "최상", color: "#22c55e" },
  2: { label: "상",   color: "#4ade80" },
  3: { label: "중상", color: "#86efac" },
  4: { label: "중",   color: "#94a3b8" },
  5: { label: "중",   color: "#94a3b8" },
  6: { label: "중하", color: "#fb923c" },
  7: { label: "하",   color: "#f87171" },
  8: { label: "하",   color: "#ef4444" },
  9: { label: "최하", color: "#dc2626" },
};

// 지지 합충 시각 다이어그램 컴포넌트
// cols: 명식표 컬럼 배열 (시주→일주→월주→년주→대운→세운→오늘 순)
// relations: sortJijiRelationsByStrength 처리된 관계 배열

const MIN_COL_W = 44; // 컬럼 최소 너비(px) — 화면이 좁아지면 가로 스크롤로 전환
const COL_GAP = 6; // 컬럼 간격(px)
const LINE_H = 30; // 각 커넥터 줄의 높이(px)
// 오행별 결과 색상 — 합·충·형·파·해의 "최종적으로 남는/만들어지는 기운"을 오행 색으로 표현
const ELEMENT_COLOR: Record<Element, string> = {
  목: "#4ade80", // 초록
  화: "#f87171", // 빨강
  토: "#fbbf24", // 노랑
  금: "#f3f4f6", // 흰색(밝은 회백)
  수: "#3b82f6", // 파란색
};

// 육합화기(六合化氣): 두 지지가 합쳐져 만들어내는 오행
const YUKHAP_HWA: Record<string, Element> = {
  "자축": "토", "인해": "목", "묘술": "화", "진유": "금", "사신": "수", "오미": "화",
};
// 삼합/반합 결과 오행 — 그룹 전체(또는 절반)가 향하는 오행
const SAMHAP_HWA: { group: string[]; el: Element }[] = [
  { group: ["인", "오", "술"], el: "화" },
  { group: ["사", "유", "축"], el: "금" },
  { group: ["신", "자", "진"], el: "수" },
  { group: ["해", "묘", "미"], el: "목" },
];
const SAMHYEONG_GROUPS: string[][] = [
  ["인", "사", "신"], // 무은지형
  ["축", "술", "미"], // 지세지형
];
const BANGHAP_GROUPS: { group: string[]; el: Element }[] = [
  { group: ["인", "묘", "진"], el: "목" },
  { group: ["사", "오", "미"], el: "화" },
  { group: ["신", "유", "술"], el: "금" },
  { group: ["해", "자", "축"], el: "수" },
];
// 천간합화기(天干合化氣)
const CG_HWA: Record<string, Element> = {
  "갑기": "토", "을경": "금", "병신": "수", "정임": "목", "무계": "화",
};
// 상극(相克) 순환 — key가 value를 극(克)한다 (key가 승자)
const SANGGEUK: Record<Element, Element> = { 목: "토", 토: "수", 수: "화", 화: "금", 금: "목" };

function pairKey(a: string, b: string): string {
  // YUKHAP_HWA/CG_HWA는 고정된 한쪽 순서로 정의되어 있어 양방향 모두 시도
  return `${a}${b}`;
}

function hapElement(a: string, b: string): Element | undefined {
  return YUKHAP_HWA[pairKey(a, b)] ?? YUKHAP_HWA[pairKey(b, a)];
}

function samhapElement(a: string, b: string): Element | undefined {
  return SAMHAP_HWA.find(g => g.group.includes(a) && g.group.includes(b))?.el;
}

function cgHapElement(a: string, b: string): Element | undefined {
  return CG_HWA[pairKey(a, b)] ?? CG_HWA[pairKey(b, a)];
}

// 두 오행이 부딪힐 때 "남는(이기는)" 오행을 상극 순환으로 판정. 같은 오행이면 그대로, 상생 관계처럼
// 명확한 승자가 없으면 undefined를 반환해 반반 색상으로 처리한다.
function survivorElement(elA: Element, elB: Element): Element | undefined {
  if (elA === elB) return elA;
  if (SANGGEUK[elA] === elB) return elA;
  if (SANGGEUK[elB] === elA) return elB;
  return undefined;
}

// 지지 관계 한 쌍의 색상을 오행 기준으로 산출. 합(육합/삼합/반합)은 화기 오행 단색,
// 충/형/파/해는 상극으로 남는 오행 단색(승자가 없으면 반반), 원진(귀문관살 포함)은 항상 반반 색상.
function relColor(type: JijiRelation["type"], jjA: string, jjB: string): string | [string, string] {
  const elA = jijiElement(jjA);
  const elB = jijiElement(jjB);

  if (type === "육합") {
    const el = hapElement(jjA, jjB);
    return el ? ELEMENT_COLOR[el] : ELEMENT_COLOR[elA];
  }
  if (type === "삼합" || type === "반합") {
    const el = samhapElement(jjA, jjB);
    return el ? ELEMENT_COLOR[el] : ELEMENT_COLOR[elA];
  }
  if (type === "원진") {
    return [ELEMENT_COLOR[elA], ELEMENT_COLOR[elB]];
  }
  // 충/형/파/해 — 상극으로 남는 오행 판정
  const survivor = survivorElement(elA, elB);
  return survivor ? ELEMENT_COLOR[survivor] : [ELEMENT_COLOR[elA], ELEMENT_COLOR[elB]];
}

// 천간 관계 색상 — 합은 천간합화기 오행, 충은 상극으로 남는 오행(없으면 반반)
function cgRelColor(type: "합" | "충", cgA: string, cgB: string): string | [string, string] {
  const elA = CHEONGAN_ELEMENT[cgA] as Element;
  const elB = CHEONGAN_ELEMENT[cgB] as Element;
  if (type === "합") {
    const el = cgHapElement(cgA, cgB);
    return el ? ELEMENT_COLOR[el] : ELEMENT_COLOR[elA];
  }
  const survivor = survivorElement(elA, elB);
  return survivor ? ELEMENT_COLOR[survivor] : [ELEMENT_COLOR[elA], ELEMENT_COLOR[elB]];
}

// 해(害) 쌍별 구체 설명
const HAE_PAIR_DESC: Record<string, string> = {
  "자미": "자(子)·미(未) 해 — 가까운 사람이 나도 모르게 발목을 잡는 느낌이 드는 날이에요. 뒤에서 방해를 받거나, 믿었던 사람에게 서운한 일이 생기기 쉬워요. 직접 부딪히기보다 은근히 피해를 보는 흐름이니 중요한 약속·계약은 좀 더 천천히 진행하는 편이 좋아요.",
  "미자": "자(子)·미(未) 해 — 가까운 사람이 나도 모르게 발목을 잡는 느낌이 드는 날이에요. 뒤에서 방해를 받거나, 믿었던 사람에게 서운한 일이 생기기 쉬워요. 직접 부딪히기보다 은근히 피해를 보는 흐름이니 중요한 약속·계약은 좀 더 천천히 진행하는 편이 좋아요.",
  "축오": "축(丑)·오(午) 해 — 잘 되어 가던 일에 뜻밖의 잡음이 끼는 느낌이에요. 주변에서 부정적인 말이 돌거나, 협력하려던 사람이 엉뚱한 방향으로 튀는 날일 수 있어요. 감정이 자극받기 쉬우니 말다툼이 커지지 않게 주의하세요.",
  "오축": "축(丑)·오(午) 해 — 잘 되어 가던 일에 뜻밖의 잡음이 끼는 느낌이에요. 주변에서 부정적인 말이 돌거나, 협력하려던 사람이 엉뚱한 방향으로 튀는 날일 수 있어요. 감정이 자극받기 쉬우니 말다툼이 커지지 않게 주의하세요.",
  "인사": "인(寅)·사(巳) 해 — 형제·친구·동료 사이에서 크고 작은 다툼이나 오해가 불거지기 쉬운 기운이에요. 직접적인 충돌은 아니지만 뒤에서 말이 돌거나 모략·배신 느낌의 상황이 생길 수 있어요. 가까운 사람일수록 오히려 거리를 두고 지켜보는 게 나아요.",
  "사인": "인(寅)·사(巳) 해 — 형제·친구·동료 사이에서 크고 작은 다툼이나 오해가 불거지기 쉬운 기운이에요. 직접적인 충돌은 아니지만 뒤에서 말이 돌거나 모략·배신 느낌의 상황이 생길 수 있어요. 가까운 사람일수록 오히려 거리를 두고 지켜보는 게 나아요.",
  "묘진": "묘(卯)·진(辰) 해 — 해야 할 일이 잘 맞물리지 않고 어긋나는 느낌이 드는 날이에요. 일정이 꼬이거나 사소한 방해가 반복되기 쉬워요. 큰 계획보다는 당장 처리할 것들을 하나씩 정리하는 게 맞는 흐름이에요.",
  "진묘": "묘(卯)·진(辰) 해 — 해야 할 일이 잘 맞물리지 않고 어긋나는 느낌이 드는 날이에요. 일정이 꼬이거나 사소한 방해가 반복되기 쉬워요. 큰 계획보다는 당장 처리할 것들을 하나씩 정리하는 게 맞는 흐름이에요.",
  "신해": "신(申)·해(亥) 해 — 안전사고에 각별히 신경 쓰는 날이에요. 도로·교통 상황이나 물 주변에서 부주의한 순간이 생기지 않도록 서두르지 말고, 무리한 야외 활동은 잠시 미루는 편이 좋아요. 호흡기·비뇨기 쪽 컨디션이 조금 예민해질 수 있으니 수분 섭취와 체온 관리에 신경 쓰세요.",
  "해신": "신(申)·해(亥) 해 — 안전사고에 각별히 신경 쓰는 날이에요. 도로·교통 상황이나 물 주변에서 부주의한 순간이 생기지 않도록 서두르지 말고, 무리한 야외 활동은 잠시 미루는 편이 좋아요. 호흡기·비뇨기 쪽 컨디션이 조금 예민해질 수 있으니 수분 섭취와 체온 관리에 신경 쓰세요.",
  "유술": "유(酉)·술(戌) 해 — 사소한 일로 주변 사람과 의견이 틀어지거나 불필요한 마찰이 생기기 쉬운 기운이에요. 잘 풀려가던 상황에 갑자기 제동이 걸리는 느낌이 들 수 있어요. 소통을 부드럽게 하고 감정 표현을 줄이는 하루로 보내는 게 좋아요.",
  "술유": "유(酉)·술(戌) 해 — 사소한 일로 주변 사람과 의견이 틀어지거나 불필요한 마찰이 생기기 쉬운 기운이에요. 잘 풀려가던 상황에 갑자기 제동이 걸리는 느낌이 들 수 있어요. 소통을 부드럽게 하고 감정 표현을 줄이는 하루로 보내는 게 좋아요.",
};

function jjRelDesc(type: JijiRelation["type"], jjA?: string, jjB?: string): string {
  if (type === "해" && jjA && jjB) {
    const key = jjA + jjB;
    return HAE_PAIR_DESC[key] ?? "은근히 신경 쓰이고 방해가 되는 기운이에요. 가까운 사람과 작은 마찰이 생기거나, 잘 풀리던 일에 뜻밖의 방해가 끼기 쉬운 흐름이에요.";
  }
  switch (type) {
    case "육합": return "두 지지가 짝을 이뤄 서로 끌어당기고 화합하는 관계예요.";
    case "삼합": return "세 지지가 한 덩어리로 뭉쳐 강한 기운을 만드는 관계예요.";
    case "반합": return "삼합의 절반만 작용해 비교적 약하게 기운이 모이는 관계예요.";
    case "충": return "두 기운이 정면으로 부딪혀 갑작스러운 변화나 긴장이 생기는 관계예요.";
    case "형": return "서로 부딪히며 다투거나 시비·구설이 생기기 쉬운 관계예요.";
    case "파": return "관계나 일이 깨지고 흩어지는 느낌을 주는 관계예요.";
    case "해": return "은근히 신경 쓰이고 방해가 되는 기운이에요. 가까운 사람과 작은 마찰이 생기거나, 잘 풀리던 일에 뜻밖의 방해가 끼기 쉬운 흐름이에요.";
    case "원진": return "이유 없이 꺼려지고 거리를 두게 되는 미묘한 관계예요.";
    default: return "";
  }
}

function cgRelDesc(type: "합" | "충"): string {
  return type === "합" ? "두 천간이 합쳐져 새로운 기운으로 바뀌는 관계예요." : "두 천간이 정면으로 부딪히는 관계예요.";
}

interface LineRel {
  aIdx: number;
  bIdx: number;
  label: string;
  color: string | [string, string]; // 단색 또는 [좌측색, 우측색] 반반 색상
  desc: string; // 호버/탭 설명
  midDotColIdx?: number; // 3체 관계(삼합/삼형/방합)의 중간 지지 컬럼 인덱스
}

interface DiagramProps {
  cols: { label: string; cg: string; jj: string }[];
  jjLines: LineRel[]; // 지지 관계 — 명식표 아래쪽에 연결
  cgLines: LineRel[]; // 천간 관계 — 명식표 위쪽에 연결
}

const CG_BADGE_D = 28;
const JJ_BADGE_D = 34;
const LABEL_H = 14;
const ROW_GAP = 6;

// 화살표 마커가 달린 커넥터 라인 — 시작/끝 양쪽에 삼각형 화살촉 + 중앙 레이블 배지(호버/탭 시 설명 표시)
function ConnectorLine({ xA, xB, y, color, label, desc, width, height, midDotX }: { xA: number; xB: number; y: number; color: string | [string, string]; label: string; desc: string; width: number; height: number; midDotX?: number }) {
  const [open, setOpen] = useState(false);
  const lo = Math.min(xA, xB);
  const hi = Math.max(xA, xB);
  const midX = (lo + hi) / 2;
  const tri = 6;
  const badgeW = label.length * 10 + 16;
  const isSplit = Array.isArray(color);
  const cA = isSplit ? color[0] : color;
  const cB = isSplit ? color[1] : color;
  const badgeBg = isSplit ? `linear-gradient(90deg, ${cA} 50%, ${cB} 50%)` : "#1a1a2e";
  const badgeBorder = isSplit ? "1px solid rgba(255,255,255,0.4)" : `1px solid ${cA}`;
  const badgeText = isSplit ? "#0a0a0f" : cA;
  return (
    <>
      <svg style={{ position: "absolute", left: 0, top: 0, width, height, overflow: "visible", pointerEvents: "none" }}>
        <line x1={lo} y1={y} x2={midX} y2={y} stroke={cA} strokeWidth={1.5} strokeOpacity={0.85} />
        <line x1={midX} y1={y} x2={hi} y2={y} stroke={cB} strokeWidth={1.5} strokeOpacity={0.85} />
        {/* 양쪽 화살촉 (서로 바깥쪽을 향함) */}
        <polygon points={`${lo},${y} ${lo + tri},${y - tri / 1.6} ${lo + tri},${y + tri / 1.6}`} fill={cA} opacity={0.9} />
        <polygon points={`${hi},${y} ${hi - tri},${y - tri / 1.6} ${hi - tri},${y + tri / 1.6}`} fill={cB} opacity={0.9} />
        {/* 3체 중간 지지 표시 점 */}
        {midDotX !== undefined && <circle cx={midDotX} cy={y} r={4} fill={cA} opacity={0.9} />}
      </svg>
      {/* 중앙 레이블 배지 — PC: 호버 시 팝업 표시/숨김 / 모바일: 탭 토글 */}
      <div
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen((v: boolean) => !v)}
        style={{
          position: "absolute", left: midX - badgeW / 2, top: y - 9, width: badgeW, height: 18,
          borderRadius: 9, background: badgeBg, border: badgeBorder,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 10, fontWeight: 700, color: badgeText, cursor: "pointer", userSelect: "none",
        }}
      >
        {label}
      </div>
      {open && (
        <div
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
          onClick={() => setOpen(false)}
          style={{
            position: "absolute", left: Math.max(0, Math.min(midX - 90, width - 180)), top: y + 12, width: 180, zIndex: 20,
            background: "#13131f", border: isSplit ? "1px solid rgba(255,255,255,0.4)" : `1px solid ${cA}`, borderRadius: 10, padding: "8px 10px",
            fontSize: 11, lineHeight: 1.5, color: "#d1d5db", boxShadow: "0 4px 16px rgba(0,0,0,0.4)", cursor: "pointer",
          }}
        >
          <span style={{ color: isSplit ? cB : cA, fontWeight: 700 }}>{label}</span> {desc}
        </div>
      )}
    </>
  );
}

// 오행 펜타곤 버블 차트 — 목화토금수 점수를 5각형 배치로 시각화, 점수 비례 원 크기
function OhaengPentagon({ scores }: { scores: Record<Element, number> }) {
  const order: Element[] = ["목", "화", "토", "금", "수"];
  const max = Math.max(1, ...order.map(el => scores[el]));
  const size = 220;
  const cx = size / 2, cy = size / 2 - 6;
  const radius = 78;
  return (
    <div className="flex justify-center">
      <svg width={size} height={size + 10} style={{ overflow: "visible" }}>
        {order.map((el, i) => {
          const angle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
          const x = cx + radius * Math.cos(angle);
          const y = cy + radius * Math.sin(angle);
          const score = scores[el] || 0;
          const r = 14 + (score / max) * 26;
          const color = EL_STYLE[el]?.text ?? "#e5e7eb";
          return (
            <g key={el}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
              <circle cx={x} cy={y} r={r} fill={color} opacity={0.18} stroke={color} strokeWidth={1.5} />
              <text x={x} y={y - 2} textAnchor="middle" fontSize={13} fontWeight={900} fill={color}>{el}</text>
              <text x={x} y={y + 13} textAnchor="middle" fontSize={9} fontWeight={700} fill="rgba(255,255,255,0.5)">{score.toFixed(1)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function RelationDiagram({ cols, jjLines, cgLines }: DiagramProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [colW, setColW] = useState(56);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const measure = () => {
      const avail = el.clientWidth;
      const w = (avail - (cols.length - 1) * COL_GAP) / cols.length;
      setColW(Math.max(MIN_COL_W, w));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cols.length]);

  const colCenterX = (idx: number) => idx * (colW + COL_GAP) + colW / 2;
  const totalW = cols.length * colW + (cols.length - 1) * COL_GAP;
  const cgLinesH = cgLines.length * LINE_H + (cgLines.length > 0 ? ROW_GAP : 0);
  const cgBadgeTop = LABEL_H + cgLinesH;
  const jjBadgeTop = cgBadgeTop + CG_BADGE_D + ROW_GAP;
  const jjLinesTop = jjBadgeTop + JJ_BADGE_D + ROW_GAP;
  const jjLinesH = jjLines.length * LINE_H + (jjLines.length > 0 ? ROW_GAP : 0);
  const totalH = jjLinesTop + jjLinesH + 4;

  return (
    <div ref={wrapRef} style={{ width: "100%" }}>
      <div style={{ position: "relative", width: totalW, height: totalH }}>
        {/* 천간 관계 라인 (위쪽) */}
        {cgLines.map((rel, i) => (
          <ConnectorLine
            key={`cg-${i}`}
            xA={colCenterX(rel.aIdx)} xB={colCenterX(rel.bIdx)}
            y={LABEL_H + i * LINE_H + LINE_H / 2}
            color={rel.color} label={rel.label} desc={rel.desc} width={totalW} height={totalH}
          />
        ))}

        {/* 컬럼 레이블 + 천간/지지 뱃지 */}
        {cols.map((col, i) => {
          const cx = colCenterX(i);
          return (
            <div key={i} style={{ position: "absolute", left: cx - colW / 2, top: 0, width: colW, textAlign: "center" }}>
              <div style={{ position: "absolute", top: 0, width: colW, fontSize: 9, color: "#6b7280", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {col.label.replace(/\s*\(.*\)/, "")}
              </div>
              <div style={{
                position: "absolute", top: cgBadgeTop, left: "50%", transform: "translateX(-50%)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: CG_BADGE_D, height: CG_BADGE_D, borderRadius: "50%",
                background: "rgba(255,255,255,0.05)", border: "1.5px solid rgba(255,255,255,0.15)",
                fontSize: 12, fontWeight: 900, color: EL_STYLE[CHEONGAN_ELEMENT[col.cg] || "토"]?.text ?? "#e5e7eb",
              }}>
                {col.cg === "-" ? "·" : col.cg}
              </div>
              <div style={{
                position: "absolute", top: jjBadgeTop, left: "50%", transform: "translateX(-50%)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                width: JJ_BADGE_D, height: JJ_BADGE_D, borderRadius: "50%",
                background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.18)",
                fontSize: 14, fontWeight: 900, color: EL_STYLE[jijiElement(col.jj)]?.text ?? "#e5e7eb",
              }}>
                {col.jj === "-" ? "·" : col.jj}
              </div>
            </div>
          );
        })}

        {/* 지지 관계 라인 (아래쪽) */}
        {jjLines.map((rel, i) => (
          <ConnectorLine
            key={`jj-${i}`}
            xA={colCenterX(rel.aIdx)} xB={colCenterX(rel.bIdx)}
            y={jjLinesTop + i * LINE_H + LINE_H / 2}
            color={rel.color} label={rel.label} desc={rel.desc} width={totalW} height={totalH}
            midDotX={rel.midDotColIdx !== undefined ? colCenterX(rel.midDotColIdx) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

export default function TodayFortunePage() {
  const router = useRouter();
  const [step, setStep] = useState<"entry" | "form" | "loading" | "result">("entry");
  const [form, setForm] = useState<BirthFormData>(defaultBirthData("female"));
  const resultRef = useRef<SajuResult | null>(null);
  const [selDateStr, setSelDateStr] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [includeDaewoon, setIncludeDaewoon] = useState(true);
  const [includeSewoon, setIncludeSewoon] = useState(true);
  const [includeToday, setIncludeToday] = useState(true);
  const [selDaewoonIdx, setSelDaewoonIdx] = useState<number | null>(null);
  const [selSewoonYear, setSelSewoonYear] = useState<number | null>(null);

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
      <main className="min-h-screen bg-[#06060e] text-white flex flex-col page-fade-in">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[650px] h-[650px] rounded-full bg-slate-800/40 blur-[160px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-zinc-800/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-5 py-16 text-center">
          <FadeIn delay={0}>
          <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-bold tracking-wider mb-8">
            🗓️ 오늘의 일운(日運)
          </div>
          </FadeIn>
          <FadeIn delay={80}>
          <h1 className="text-3xl font-black mb-4 leading-tight tracking-tight">
            내 사주 원국 +<br />
            <span className="text-gray-300">대운·세운·오늘</span><br />
            전부 한 장의 차트로
          </h1>
          </FadeIn>
          <FadeIn delay={160}>
          <p className="text-gray-400 text-base mb-2 leading-relaxed">
            만세력처럼, 원국 4기둥부터 현재 대운·올해 세운·오늘 일진까지<br />
            <span className="text-gray-300 font-medium">합·충 관계를 한눈에 분석합니다.</span>
          </p>
          <p className="text-gray-600 text-sm mb-12">
            총운·재물·애정·건강·공부/문서운까지 한 번에
          </p>
          </FadeIn>

          <div className="w-full space-y-3 mb-10 text-left">
            {[
              ["원국 + 대운 + 세운 + 오늘 명식표", "년/월/일/시주부터 현재 대운, 올해 세운, 오늘 일진까지 한 장에"],
              ["합·충·형·파·해 전체 분석", "오늘과 올해의 기운이 원국과 어떻게 부딪히고 맞물리는지"],
              ["총운·재물·애정·건강·공부/문서운", "오늘의 일운을 5가지 영역으로 상세 해설"],
            ].map(([title, desc], i) => (
              <FadeIn key={title} delay={220 + i * 70}>
              <div className="flex items-start gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={490}>
          <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-bold tracking-wider mb-6">
            ✦ 완전 무료
          </div>
          </FadeIn>

          <FadeIn delay={560}>
          <button onClick={() => setStep("form")}
            className="w-full py-5 rounded-2xl font-black text-base tracking-tight bg-gradient-to-r from-slate-600 to-zinc-600 hover:from-slate-500 hover:to-zinc-500 text-white shadow-lg shadow-black/50 transition-all active:scale-[0.98] flex items-center justify-center px-4">
            오늘의 운세 확인하기
          </button>
          </FadeIn>
        </div>
      </main>
    );
  }

  if (step === "form") {
    const ready = !!form.birthYear && !!form.birthMonth && !!form.birthDay;
    return (
      <main className="min-h-screen bg-[#06060e] text-white">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[600px] h-[600px] rounded-full bg-slate-800/40 blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">생년월일 입력</h2>
            <p className="text-gray-500 text-sm">정확한 분석을 위해 출생 정보를 입력해주세요.</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <BirthInputForm value={form} onChange={setForm} label="나의 정보" accent="#9ca3af" />
          </div>
          <button onClick={handleAnalyze} disabled={!ready}
            className={`w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all active:scale-[0.98] ${
              ready
                ? "bg-gradient-to-r from-slate-600 to-zinc-600 hover:from-slate-500 hover:to-zinc-500 text-white shadow-lg shadow-black/50"
                : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
            }`}>
            오늘의 운세 분석하기
          </button>
        </div>
      </main>
    );
  }

  if (step === "loading") {
    return <AnalysisLoading subject="오늘의 운세" duration={2200} onDone={() => setStep("result")}
      messages={[
        "원국 4기둥을 불러오는 중...",
        "현재 대운과 올해 세운을 계산하는 중...",
        "오늘의 일진과 합충 관계를 분석하는 중...",
        "총운·재물·애정·건강·공부운을 정리하는 중...",
      ]}
    />;
  }

  // ── 결과 ──
  const r = resultRef.current;
  if (!r) return null;
  const ilgan = r.pillarsDetail.day.cg;
  // "오늘" 날짜는 selDateStr로 임의 지정 가능 (기본값: 실제 오늘)
  const [selY, selM, selD] = selDateStr.split("-").map(Number);
  const today = new Date(selY, selM - 1, selD);

  // 대운 — 기본은 선택한 날짜 기준 나이에 해당하는 대운, 칩으로 다른 시기 선택 가능
  const yy = Number(form.birthYear), mm = Number(form.birthMonth), dd = Number(form.birthDay);
  const daewoon = calcDaewoon(yy, mm, dd, form.gender, ilgan, { cg: r.pillarsDetail.month.cg, jj: r.pillarsDetail.month.jj });
  const approxAgeAtSelDate = selY - yy;
  const autoIdx = (() => {
    const idx = daewoon.pillars.findIndex((p, i) => {
      const nextAge = i + 1 < daewoon.pillars.length ? daewoon.pillars[i + 1].age : 999;
      return approxAgeAtSelDate >= p.age && approxAgeAtSelDate < nextAge;
    });
    return idx < 0 ? 0 : idx;
  })();
  const activeDaewoonIdx = selDaewoonIdx ?? autoIdx;
  const currentDaewoon = daewoon.pillars[Math.max(0, Math.min(activeDaewoonIdx, daewoon.pillars.length - 1))];

  // 세운 — 기본은 선택한 날짜의 연도, 칩으로 다른 연도 선택 가능
  const thisYear = selSewoonYear ?? selY;
  const yearPillar = getYearPillar(thisYear);
  const sewoonSipseongCg = getSipseong(ilgan, yearPillar.cg);

  // 오늘 일진
  const dayPillar = getDayPillar(selY, selM, selD);
  const todaySipseongCg = getSipseong(ilgan, dayPillar.cg);
  const todayGroup = SIPSEONG_GROUP[todaySipseongCg] ?? "비겁";
  const todayUunseong = getUunseong(ilgan, dayPillar.jj);

  // 명식표 컬럼 (시-일-월-년-대운-세운-오늘)
  type Col = { label: string; cg: string; jj: string; sipseongCg: string };
  const cols: Col[] = [
    { label: "시주", cg: r.pillarsDetail.hour?.cg ?? "-", jj: r.pillarsDetail.hour?.jj ?? "-", sipseongCg: r.pillarsDetail.hour?.sipseongCg ?? "-" },
    { label: "일주", cg: r.pillarsDetail.day.cg, jj: r.pillarsDetail.day.jj, sipseongCg: "본인" },
    { label: "월주", cg: r.pillarsDetail.month.cg, jj: r.pillarsDetail.month.jj, sipseongCg: r.pillarsDetail.month.sipseongCg },
    { label: "년주", cg: r.pillarsDetail.year.cg, jj: r.pillarsDetail.year.jj, sipseongCg: r.pillarsDetail.year.sipseongCg },
    { label: `대운 (${currentDaewoon.age}세~)`, cg: currentDaewoon.cg, jj: currentDaewoon.jj, sipseongCg: currentDaewoon.sipseongCg },
    { label: `세운 (${thisYear})`, cg: yearPillar.cg, jj: yearPillar.jj, sipseongCg: sewoonSipseongCg },
    { label: "오늘", cg: dayPillar.cg, jj: dayPillar.jj, sipseongCg: todaySipseongCg },
  ];

  // 합충형파해 분석
  const allJjLabels = cols.map(c => c.label);
  const allJjs = cols.map(c => c.jj);

  // 원국 내부 지지는 날짜와 무관하게 항상 고정 표시 (cols 0~3)
  const natalColCount = r.pillarsDetail.hour ? 4 : 3;
  const natalJjs = allJjs.slice(0, natalColCount);
  const natalRawRels = getJijiRelations(natalJjs); // 인덱스가 0..natalColCount-1 기준

  // 전체(원국+대운+세운+오늘) 지지 관계에서 교차 기둥이 포함된 것만
  const allRawRels = getJijiRelations(allJjs);
  const crossRawRels = allRawRels.filter(rel => rel.a >= natalColCount || rel.b >= natalColCount);

  // 원국 내부 관계를 cols 인덱스로 재매핑 (인덱스 오프셋 없음, 이미 0기반)
  const natalRelsRemapped = natalRawRels.map(rel => ({ ...rel }));

  // 합쳐서 정렬
  const rawRelations = sortJijiRelationsByStrength([...natalRelsRemapped, ...crossRawRels]);

  // 삼합 3개 모두 있을 때 → 단일 레이블로 합침 (원국 내부 반합은 유지)
  type MergedRel = (typeof rawRelations)[0] & { mergedGroup?: string[] };
  const relations: MergedRel[] = (() => {
    const used = new Set<number>();
    const result: MergedRel[] = [];
    for (const grp of SAMHAP_HWA) {
      // 전체 allJjs 기준으로 3개 모두 있는지 확인
      const presentIdx = grp.group.map(jj => allJjs.indexOf(jj)).filter(i => i >= 0);
      if (presentIdx.length === 3) {
        const pairIndices: number[] = [];
        rawRelations.forEach((rel, ri) => {
          if ((rel.type === "삼합" || rel.type === "반합") &&
              grp.group.includes(rel.jjA) && grp.group.includes(rel.jjB)) {
            pairIndices.push(ri);
            used.add(ri);
          }
        });
        if (pairIndices.length > 0) {
          const sortedIdx = [...presentIdx].sort((a, b) => a - b);
          const first = rawRelations.find((_, ri) => pairIndices.includes(ri))!;
          result.push({
            ...first,
            a: sortedIdx[0], b: sortedIdx[sortedIdx.length - 1],
            jjA: allJjs[sortedIdx[0]], jjB: allJjs[sortedIdx[sortedIdx.length - 1]],
            type: "삼합",
            mergedGroup: grp.group,
          });
        }
      }
    }
    rawRelations.forEach((rel, ri) => {
      if (!used.has(ri)) {
        result.push(rel.type === "삼합" ? { ...rel, type: "반합" } : rel);
      }
    });
    return result;
  })();

  // 천라지망(天羅地網): 원국·대운·세운·오늘 전체 지지 중 술+해(天羅) 또는 진+사(地網) 조합이 있는지 검사
  const allJjSet = new Set(allJjs);
  const hasCheonra = allJjSet.has("술") && allJjSet.has("해");
  const hasJimang = allJjSet.has("진") && allJjSet.has("사");
  const cheonraJimangLabels = hasCheonra || hasJimang
    ? cols.filter(c => (hasCheonra && (c.jj === "술" || c.jj === "해")) || (hasJimang && (c.jj === "진" || c.jj === "사"))).map(c => c.label)
    : [];

  // 천간합·충 — 오늘/세운/대운의 천간이 원국 천간(일간 포함)과 맺는 관계
  // 원국 천간 4개는 명식표 컬럼 0(시주)~3(년주)에 위치
  const wongukColIdx: Record<string, number> = { 시간: 0, 일간: 1, 월간: 2, 년간: 3 };
  const wonguk천간 = [
    { label: "년간", cg: r.pillarsDetail.year.cg },
    { label: "월간", cg: r.pillarsDetail.month.cg },
    { label: "일간", cg: r.pillarsDetail.day.cg },
    ...(r.pillarsDetail.hour ? [{ label: "시간", cg: r.pillarsDetail.hour.cg }] : []),
  ];
  // 대운(4)·세운(5)·오늘(6) 컬럼
  const flowCg = [
    { label: `대운(${currentDaewoon.age}세~)`, cg: currentDaewoon.cg, colIdx: 4 },
    { label: `세운(${thisYear})`, cg: yearPillar.cg, colIdx: 5 },
    { label: "오늘", cg: dayPillar.cg, colIdx: 6 },
  ];
  const cgRelations: { from: string; to: string; a: string; b: string; type: "합" | "충"; aIdx: number; bIdx: number }[] = [];
  for (const f of flowCg) {
    for (const w of wonguk천간) {
      const wIdx = wongukColIdx[w.label];
      for (const [x, y] of CG_HAP) {
        if ((f.cg === x && w.cg === y) || (f.cg === y && w.cg === x)) {
          const aIdx = f.cg === x ? f.colIdx : wIdx;
          const bIdx = f.cg === x ? wIdx : f.colIdx;
          cgRelations.push({ from: f.label, to: w.label, a: x, b: y, type: "합", aIdx, bIdx });
        }
      }
      for (const [x, y] of CG_CHUNG) {
        if ((f.cg === x && w.cg === y) || (f.cg === y && w.cg === x)) {
          const aIdx = f.cg === x ? f.colIdx : wIdx;
          const bIdx = f.cg === x ? wIdx : f.colIdx;
          cgRelations.push({ from: f.label, to: w.label, a: x, b: y, type: "충", aIdx, bIdx });
        }
      }
    }
  }
  // 원국 내부 천간 합충 (날짜와 무관하게 항상 고정)
  for (let i = 0; i < wonguk천간.length; i++) {
    for (let j = i + 1; j < wonguk천간.length; j++) {
      const wi = wonguk천간[i], wj = wonguk천간[j];
      const iIdx = wongukColIdx[wi.label], jIdx = wongukColIdx[wj.label];
      for (const [x, y] of CG_HAP) {
        if ((wi.cg === x && wj.cg === y) || (wi.cg === y && wj.cg === x)) {
          const aIdx = wi.cg === x ? iIdx : jIdx;
          const bIdx = wi.cg === x ? jIdx : iIdx;
          cgRelations.push({ from: wi.label, to: wj.label, a: x, b: y, type: "합", aIdx, bIdx });
        }
      }
      for (const [x, y] of CG_CHUNG) {
        if ((wi.cg === x && wj.cg === y) || (wi.cg === y && wj.cg === x)) {
          const aIdx = wi.cg === x ? iIdx : jIdx;
          const bIdx = wi.cg === x ? jIdx : iIdx;
          cgRelations.push({ from: wi.label, to: wj.label, a: x, b: y, type: "충", aIdx, bIdx });
        }
      }
    }
  }

  // 오늘 지지가 원국/세운/대운 지지와 맺는 충·합 여부 (영역별 해설 보정용)
  // 합과 충이 동시에 존재할 수 있으므로, 더 많이 겹치는(=기운이 더 큰) 쪽 하나만 골라서 보여준다.
  const todayRelations = relations.filter(rel => allJjLabels[rel.a] === "오늘" || allJjLabels[rel.b] === "오늘");
  const todayHapCount = todayRelations.filter(rel => rel.type === "육합" || rel.type === "삼합" || rel.type === "반합").length
    + cgRelations.filter(c => c.from === "오늘" && c.type === "합").length;
  const todayChungCount = todayRelations.filter(rel => rel.type === "충").length
    + cgRelations.filter(c => c.from === "오늘" && c.type === "충").length;
  const todayDominantFlow: "합" | "충" | null =
    todayHapCount === 0 && todayChungCount === 0 ? null : todayHapCount >= todayChungCount ? "합" : "충";
  const hasTodayHap = todayDominantFlow === "합";
  const hasTodayChung = todayDominantFlow === "충";

  const groupContent = GROUP_TODAY[todayGroup];
  // 평소 사주에서 오늘 들어온 성향(그룹)이 이미 강한지/약한지 — 전문 용어 없이 풀어 설명하는 데 사용
  const natalGroupStrength = getSipseongStrength(r).find(s => s.group === todayGroup);
  const todayGroupFlavorText =
    natalGroupStrength?.status === "강함"
      ? "이 기운은 평소 나에게도 이미 두드러진 성향과 같은 결이에요. 그래서 오늘은 그 모습이 한층 더 진하게 드러나는 날이 될 수 있어요. 강점이 부각되는 만큼, 너무 한쪽으로 치우치지 않도록 균형을 챙기면 더 좋습니다."
      : natalGroupStrength?.status === "무" || natalGroupStrength?.status === "약함"
      ? "이 기운은 평소 나에게는 잘 드러나지 않던 결이에요. 그래서 오늘은 평소와는 조금 다른 낯선 느낌을 받을 수 있는데, 부족했던 부분을 잠시 채워주는 흐름이니 새로운 시도를 해보기에 오히려 좋은 날입니다."
      : "이 기운은 평소 나에게 이미 적절히 자리한 결이에요. 무리하지 않고 평소의 균형을 유지하면서 하루를 보내기 좋은 흐름입니다.";

  // 조후/궁성 보정 오행 차트 — 원국 + (토글된) 대운·세운·오늘을 합산해 재계산
  const JOHU_BOOST_TODAY: Record<string, Partial<Record<Element, number>>> = {
    인: { 목: 1.0 }, 묘: { 목: 1.5 }, 진: { 목: 0.7, 토: 0.4 },
    사: { 화: 1.0 }, 오: { 화: 1.5 }, 미: { 화: 0.7, 토: 0.4 },
    신: { 금: 1.0 }, 유: { 금: 1.5 }, 술: { 금: 0.7, 토: 0.4 },
    해: { 수: 1.0 }, 자: { 수: 1.5 }, 축: { 수: 0.7, 토: 0.4 },
  };
  const ohaengScores: Record<Element, number> = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };
  // 궁성(宮星) 가중치 — 월주·일주를 중심으로, 흐름(대운·세운·오늘)은 토글에 따라 가중 반영
  const natalPillarsForChart = [
    { cg: r.pillarsDetail.year.cg, jj: r.pillarsDetail.year.jj, weight: 0.8 },
    { cg: r.pillarsDetail.month.cg, jj: r.pillarsDetail.month.jj, weight: 1.0 },
    { cg: r.pillarsDetail.day.cg, jj: r.pillarsDetail.day.jj, weight: 1.0 },
    ...(r.pillarsDetail.hour ? [{ cg: r.pillarsDetail.hour.cg, jj: r.pillarsDetail.hour.jj, weight: 0.9 }] : []),
  ];
  const flowPillarsForChart: { cg: string; jj: string; weight: number }[] = [
    ...(includeDaewoon ? [{ cg: currentDaewoon.cg, jj: currentDaewoon.jj, weight: 1.1 }] : []),
    ...(includeSewoon ? [{ cg: yearPillar.cg, jj: yearPillar.jj, weight: 0.9 }] : []),
    ...(includeToday ? [{ cg: dayPillar.cg, jj: dayPillar.jj, weight: 0.6 }] : []),
  ];
  [...natalPillarsForChart, ...flowPillarsForChart].forEach(({ cg, jj, weight }) => {
    const cgEl = CHEONGAN_ELEMENT[cg] as Element | undefined;
    if (cgEl) ohaengScores[cgEl] += 1.5 * weight;
    const jjEl = jijiElement(jj) as Element | undefined;
    if (jjEl) ohaengScores[jjEl] += 1.2 * weight;
  });
  const johuTodayBoost = JOHU_BOOST_TODAY[r.pillarsDetail.month.jj];
  if (johuTodayBoost) {
    (Object.entries(johuTodayBoost) as [Element, number][]).forEach(([el, val]) => {
      ohaengScores[el] += val;
    });
  }

  return (
    <main className="min-h-screen bg-[#06060e] text-white">
      <BackButton />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-slate-800/30 blur-[160px]" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-16" id="today-result">
        <div className="text-center mb-8">
          <p className="text-gray-400 text-xs font-bold tracking-widest mb-2">TODAY&apos;S FORTUNE</p>
          <h1 className="text-2xl font-black leading-snug">
            {ilgan}{r.pillarsDetail.day.jj}일주 {form.name || "나"}님,<br />
            오늘은 {dayPillar.cg}{dayPillar.jj}일 ({todaySipseongCg})
          </h1>
          <p className="text-xs text-gray-500 mt-2">{today.getFullYear()}.{today.getMonth() + 1}.{today.getDate()} · 12운성: {todayUunseong}</p>
          <div className="inline-flex items-center gap-2 mt-3 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <span className="text-[11px] text-gray-500">날짜 변경</span>
            <input
              type="date"
              value={selDateStr}
              onChange={e => setSelDateStr(e.target.value)}
              className="bg-transparent text-xs text-gray-200 outline-none"
            />
          </div>
        </div>

        {/* 명식표 */}
        <FadeIn delay={0}>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 mb-5 overflow-x-auto">
          <p className="text-sm font-bold text-gray-300 mb-3 px-1">원국 · 대운 · 세운 · 오늘 명식표</p>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(56px, 1fr))` }}>
            {cols.map((c, i) => (
              <div key={i} className="text-center text-[10px] text-gray-500 font-bold pb-1">{c.label}</div>
            ))}
            {cols.map((c, i) => (
              <div key={i} className="rounded-lg p-2 text-center"
                style={{ background: i >= 4 ? "rgba(156,163,175,0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${i >= 4 ? "rgba(156,163,175,0.25)" : "rgba(255,255,255,0.06)"}` }}>
                <p className="text-base font-black" style={{ color: EL_STYLE[CHEONGAN_ELEMENT[c.cg] || "토"]?.text }}>{c.cg}</p>
                <p className="text-base font-black" style={{ color: EL_STYLE[jijiElement(c.jj)]?.text }}>{c.jj}</p>
              </div>
            ))}
            {cols.map((c, i) => (
              <div key={i} className="text-center text-[10px] text-gray-500 mt-1">{c.sipseongCg}</div>
            ))}
          </div>
        </div>
        </FadeIn>

        {/* 합충형파해 시각 다이어그램 — 명식표 컬럼 위치와 연결된 화살표 */}
        <FadeIn delay={80}>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-5">
          <p className="text-sm font-bold text-gray-300 mb-1">전체 합충형파해 분석</p>
          <p className="text-[11px] text-gray-500 mb-3">위쪽 화살표: 천간 합·충 · 아래쪽 화살표: 지지 합충형파해 — 명식표 컬럼 위치 기준 (라벨을 누르면 설명이 보여요)</p>

          <div className="mb-2">
            <p className="text-[10px] text-gray-500 mb-1.5">대운 — 클릭하면 그 시기로 즉시 바뀌어요</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {daewoon.pillars.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setSelDaewoonIdx(i)}
                  className="shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-full transition-all whitespace-nowrap"
                  style={{
                    background: i === activeDaewoonIdx ? "rgba(156,163,175,0.25)" : "rgba(255,255,255,0.04)",
                    color: i === activeDaewoonIdx ? "#e5e7eb" : "rgba(255,255,255,0.4)",
                    border: `1px solid ${i === activeDaewoonIdx ? "rgba(156,163,175,0.5)" : "rgba(255,255,255,0.1)"}`,
                  }}
                >
                  {p.age}세 {p.cg}{p.jj}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-2">
            <p className="text-[10px] text-gray-500 mb-1.5">세운 — 클릭하면 그 해로 즉시 바뀌어요</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {Array.from({ length: 5 }, (_, k) => thisYear - 2 + k).map(yr => {
                const yp = getYearPillar(yr);
                return (
                  <button
                    key={yr}
                    onClick={() => setSelSewoonYear(yr)}
                    className="shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-full transition-all whitespace-nowrap"
                    style={{
                      background: yr === thisYear ? "rgba(156,163,175,0.25)" : "rgba(255,255,255,0.04)",
                      color: yr === thisYear ? "#e5e7eb" : "rgba(255,255,255,0.4)",
                      border: `1px solid ${yr === thisYear ? "rgba(156,163,175,0.5)" : "rgba(255,255,255,0.1)"}`,
                    }}
                  >
                    {yr} {yp.cg}{yp.jj}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-[10px] text-gray-500 mb-1.5">일진 — 클릭하면 그 날로 즉시 바뀌어요</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
              {Array.from({ length: 5 }, (_, k) => {
                const d = new Date(selY, selM - 1, selD);
                d.setDate(d.getDate() - 2 + k);
                const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                const dp = getDayPillar(d.getFullYear(), d.getMonth() + 1, d.getDate());
                return { ds, dp, label: k === 2 ? "오늘" : `${d.getMonth() + 1}.${d.getDate()}` };
              }).map(({ ds, dp, label }) => (
                <button
                  key={ds}
                  onClick={() => setSelDateStr(ds)}
                  className="shrink-0 text-[11px] font-bold px-2.5 py-1.5 rounded-full transition-all whitespace-nowrap"
                  style={{
                    background: ds === selDateStr ? "rgba(156,163,175,0.25)" : "rgba(255,255,255,0.04)",
                    color: ds === selDateStr ? "#e5e7eb" : "rgba(255,255,255,0.4)",
                    border: `1px solid ${ds === selDateStr ? "rgba(156,163,175,0.5)" : "rgba(255,255,255,0.1)"}`,
                  }}
                >
                  {label} {dp.cg}{dp.jj}
                </button>
              ))}
            </div>
          </div>

          <RelationDiagram
            cols={cols}
            cgLines={(() => {
              const raw = cgRelations.map(rel => ({ aIdx: rel.aIdx, bIdx: rel.bIdx, label: `${rel.a}${rel.b}${rel.type}`, color: cgRelColor(rel.type, rel.a, rel.b), desc: cgRelDesc(rel.type) }));
              const map = new Map<string, typeof raw[0] & { count: number }>();
              for (const r of raw) {
                const existing = map.get(r.label);
                if (existing) {
                  existing.count++;
                  existing.aIdx = Math.min(existing.aIdx, r.aIdx);
                  existing.bIdx = Math.max(existing.bIdx, r.bIdx);
                } else {
                  map.set(r.label, { ...r, count: 1 });
                }
              }
              return Array.from(map.values()).map(r => ({ ...r, label: r.count > 1 ? `${r.label}×${r.count}` : r.label }));
            })()}
            jjLines={(() => {
              // 육합 쌍 목록 — 해(害)와 겹치는지 확인용
              const YUKHAP_PAIRS = [["자","축"],["인","해"],["묘","술"],["진","유"],["사","신"],["오","미"]];
              const hapJjs = new Set(relations.filter(r => r.type === "육합").flatMap(r => [r.jjA, r.jjB]));
              const raw = relations.map(rel => {
                const [ja, jb] = canonicalJijiPairOrder(rel.jjA, rel.jjB, rel.type);
                const mg = (rel as MergedRel).mergedGroup;
                const isJahyeong = rel.jjA === rel.jjB && rel.type === "형";
                const label = mg ? `${mg[0]}·${mg[1]}·${mg[2]}삼합` : isJahyeong ? `${ja}${jb}자형` : `${ja}${jb}${rel.type}`;
                // 육합인데 그 짝이 해(害)로도 연결된 경우 → 설명에 방해 내용 추가
                let desc = jjRelDesc(rel.type, rel.jjA, rel.jjB);
                if (rel.type === "육합") {
                  // 이 육합 쌍 중 하나가 다른 지지와 해(害) 관계인지 확인
                  const haeRels = relations.filter(r => r.type === "해" && (r.jjA === rel.jjA || r.jjA === rel.jjB || r.jjB === rel.jjA || r.jjB === rel.jjB));
                  if (haeRels.length > 0) {
                    desc += " 단, 이 조화를 방해하는 해(害) 기운도 함께 있어서 — 잘 풀릴 것 같으면서도 중간에 누군가 발목을 잡는 느낌이 반복될 수 있어요. 기대만큼 결과가 나오지 않아도 너무 실망하지 마세요.";
                  }
                }
                if (rel.type === "해") {
                  // 이 해(害) 쌍 중 하나가 육합 쌍에 포함되는지 확인
                  const isBlockingYukhap = YUKHAP_PAIRS.some(([a, b]) =>
                    (rel.jjA === a && hapJjs.has(b)) || (rel.jjA === b && hapJjs.has(a)) ||
                    (rel.jjB === a && hapJjs.has(b)) || (rel.jjB === b && hapJjs.has(a))
                  );
                  if (isBlockingYukhap) {
                    desc += " 특히 이 기운은 오늘 맺어지려는 인연이나 합의를 조용히 방해하는 역할을 해요. 잘 맞는 것 같은데 어딘가 어긋나는 느낌이 든다면, 그 흐름을 억지로 잡으려 하지 말고 잠시 기다리는 쪽이 나아요.";
                  }
                }
                return { aIdx: rel.a, bIdx: rel.b, label, color: relColor(rel.type, rel.jjA, rel.jjB), desc };
              });
              const map = new Map<string, typeof raw[0] & { count: number }>();
              for (const r of raw) {
                const existing = map.get(r.label);
                if (existing) {
                  existing.count++;
                  existing.aIdx = Math.min(existing.aIdx, r.aIdx);
                  existing.bIdx = Math.max(existing.bIdx, r.bIdx);
                } else {
                  map.set(r.label, { ...r, count: 1 });
                }
              }
              return Array.from(map.values()).map(r => ({ ...r, label: r.count > 1 ? `${r.label}×${r.count}` : r.label }));
            })()}
          />
          {relations.length === 0 && cgRelations.length === 0 && (
            <p className="text-xs text-gray-500 mt-3 border-t border-white/10 pt-3">원국·대운·세운·오늘 사이에 두드러진 합충 관계는 보이지 않아요. 큰 동요 없이 평이하게 흘러가는 흐름입니다.</p>
          )}
          {cheonraJimangLabels.length > 0 && (
            <div className="mt-3 border-t border-white/10 pt-3">
              <p className="text-xs font-bold text-amber-300">
                ⚠ {[hasCheonra && "술해천라", hasJimang && "진사지망"].filter(Boolean).join(" · ")} — {cheonraJimangLabels.join("·")}
              </p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                {hasCheonra && hasJimang ? "술·해(天羅)와 진·사(地網)가 모두 갖춰져" : hasCheonra ? "술·해(天羅) 조합이 갖춰져" : "진·사(地網) 조합이 갖춰져"} 오늘은 뜻하지 않은 구속·제약이 느껴지기 쉬운 날이에요. 외부로 일을 벌이기보다 내면에 집중하면 오히려 단단해지는 흐름이에요.
              </p>
            </div>
          )}
        </div>
        </FadeIn>

        {/* 조후/궁성 보정 오행 차트 — 대운·세운 선택에 따라 실시간 변화 */}
        <FadeIn delay={120}>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-5">
          <p className="text-sm font-bold text-gray-300 mb-1">오행 구조 — 조후·궁성 보정</p>
          <p className="text-[11px] text-gray-500 mb-3">아래에서 대운·세운을 바꾸거나 켜고 끌 때마다 보정된 오행 점수가 즉시 다시 계산돼요.</p>

          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => setIncludeDaewoon(v => !v)}
              className="text-[11px] font-bold px-3 py-1.5 rounded-full transition-all"
              style={{ background: includeDaewoon ? "rgba(156,163,175,0.2)" : "rgba(255,255,255,0.04)", color: includeDaewoon ? "#e5e7eb" : "rgba(255,255,255,0.35)", border: `1px solid ${includeDaewoon ? "rgba(156,163,175,0.4)" : "rgba(255,255,255,0.1)"}` }}
            >
              대운 {currentDaewoon.cg}{currentDaewoon.jj} ({currentDaewoon.age}세~)
            </button>
            <button
              onClick={() => setIncludeSewoon(v => !v)}
              className="text-[11px] font-bold px-3 py-1.5 rounded-full transition-all"
              style={{ background: includeSewoon ? "rgba(156,163,175,0.2)" : "rgba(255,255,255,0.04)", color: includeSewoon ? "#e5e7eb" : "rgba(255,255,255,0.35)", border: `1px solid ${includeSewoon ? "rgba(156,163,175,0.4)" : "rgba(255,255,255,0.1)"}` }}
            >
              세운 {yearPillar.cg}{yearPillar.jj} ({thisYear})
            </button>
            <button
              onClick={() => setIncludeToday(v => !v)}
              className="text-[11px] font-bold px-3 py-1.5 rounded-full transition-all"
              style={{ background: includeToday ? "rgba(156,163,175,0.2)" : "rgba(255,255,255,0.04)", color: includeToday ? "#e5e7eb" : "rgba(255,255,255,0.35)", border: `1px solid ${includeToday ? "rgba(156,163,175,0.4)" : "rgba(255,255,255,0.1)"}` }}
            >
              오늘 {dayPillar.cg}{dayPillar.jj}
            </button>
          </div>

          <div className="flex flex-wrap gap-3 mb-4 text-[11px]">
            <label className="flex items-center gap-1.5 text-gray-500">
              대운 선택
              <select
                value={activeDaewoonIdx}
                onChange={e => setSelDaewoonIdx(Number(e.target.value))}
                className="bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-gray-200"
              >
                {daewoon.pillars.map((p, i) => (
                  <option key={i} value={i}>{p.age}세~ {p.cg}{p.jj}</option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-gray-500">
              세운 연도
              <input
                type="number"
                value={thisYear}
                onChange={e => setSelSewoonYear(Number(e.target.value))}
                className="w-20 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-gray-200"
              />
            </label>
          </div>

          <OhaengPentagon scores={ohaengScores} />
        </div>
        </FadeIn>

        {/* 총운 */}
        <FadeIn delay={160}>
        <div className="bg-gradient-to-br from-slate-800/40 to-zinc-900/40 border border-white/10 rounded-3xl p-6 mb-5">
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-2">오늘의 총운 — 일진 {todaySipseongCg} ({todayGroup})</p>
          <p className="text-sm text-gray-200 leading-relaxed">{groupContent.총운}</p>
          <p className="text-sm text-gray-300 leading-relaxed mt-3">{todayGroupFlavorText}</p>
          {hasTodayHap && (
            <p className="text-sm text-emerald-300 leading-relaxed mt-3">✦ 오늘은 주변 기운과 자연스럽게 맞아떨어지는 흐름이 흘러서, 전반적으로 일이 무난하게 풀리고 사람과의 관계도 부드럽게 이어질 가능성이 높은 날입니다.</p>
          )}
          {hasTodayChung && (
            <p className="text-sm text-rose-300 leading-relaxed mt-3">⚠ 오늘은 평소 흐름과 다소 부딪히는 기운이 들어와서, 예상치 못한 변수나 마음이 흔들리는 일이 생기기 쉬운 날이에요. 중요한 결정은 하루 정도 미뤄보는 것도 방법입니다.</p>
          )}
        </div>
        </FadeIn>

        {/* 오늘의 천간 — 일간과의 관계 */}
        <FadeIn delay={190}>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-violet-300 mb-1">🌗 오늘 만나는 기운 — {dayPillar.cg}</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            오늘 일진의 천간 {dayPillar.cg}은(는) 나({ilgan}일간)에게 <span style={{ color: ["비견","겁재"].includes(todaySipseongCg) ? "#94a3b8" : ["식신","상관"].includes(todaySipseongCg) ? "#34d399" : ["편재","정재"].includes(todaySipseongCg) ? "#fbbf24" : ["편관","정관"].includes(todaySipseongCg) ? "#f87171" : "#a78bfa" }}>{todaySipseongCg}</span>으로 작용해요.
          </p>
          {hasTodayHap && (
            <p className="text-sm text-emerald-300 leading-relaxed mt-2">오늘은 이 기운이 나와 합(合)을 이뤄 자연스럽게 흘러들어와요. 막혔던 일이 풀리거나, 사람과의 관계가 부드럽게 맞아떨어지는 흐름이에요.</p>
          )}
          {hasTodayChung && (
            <p className="text-sm text-rose-300 leading-relaxed mt-2">오늘은 이 기운이 나와 충(沖)으로 맞부딪히는 날이에요. 자극이 강하게 들어오지만 좋고 나쁨보다는 '환기'로 받아들이면 오히려 새로운 돌파구가 생기기도 해요.</p>
          )}
          {!hasTodayHap && !hasTodayChung && todayRelations.length > 0 && (
            <p className="text-sm text-amber-200/70 leading-relaxed mt-2">
              오늘 일진과 {todayRelations.map(r => `${r.jjA}${r.jjB} ${r.type}`).join(", ")} 관계가 형성돼요. 직접적인 합충보다는 은근한 영향이 오가는 날이에요.
            </p>
          )}
        </div>
        </FadeIn>

        {/* 오늘의 12운성 상세 */}
        <FadeIn delay={220}>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-cyan-300 mb-1">🌀 오늘의 12운성 — {todayUunseong}{UUNSEONG_DETAIL[todayUunseong] ? `(${UUNSEONG_DETAIL[todayUunseong].hanja})` : ""}</p>
          {UUNSEONG_DETAIL[todayUunseong] && (
            <>
              <p className="text-xs text-gray-500 mb-2">생애 주기로 보면 '{UUNSEONG_DETAIL[todayUunseong].stage}' 단계 — {UUNSEONG_DETAIL[todayUunseong].keyword}</p>
              <p className="text-sm text-gray-300 leading-relaxed">오늘 내 일간의 기운이 {todayUunseong}({UUNSEONG_DETAIL[todayUunseong].hanja}) 자리에 놓여요. {UUNSEONG_DETAIL[todayUunseong].desc}</p>
            </>
          )}
        </div>
        </FadeIn>

        {/* 도메인 운세 — 1~9등급 */}
        {(["재물", "애정", "건강", "공부문서"] as DomainKey[]).map((domain, di) => {
          const grade = calcDomainGrade(todayGroup, todayUunseong, domain, hasTodayHap, hasTodayChung);
          const g = GRADE_LABEL[grade];
          const domainLabel = domain === "공부문서" ? "공부·문서운" : `${domain}운`;
          return (
            <FadeIn key={domain} delay={240 + di * 80}>
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.4)" }}>{domainLabel}</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${g.color}22`, color: g.color, border: `1px solid ${g.color}44` }}>{g.label}</span>
                  <span className="text-3xl font-black tabular-nums" style={{ color: g.color, lineHeight: 1 }}>{grade}</span>
                  <span className="text-xs text-gray-600 self-end mb-0.5">등급</span>
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{groupContent[domain]}</p>
            </div>
            </FadeIn>
          );
        })}

        <FadeIn delay={560}>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push("/service/daewoon")}
            className="py-3.5 rounded-2xl font-bold text-sm bg-white/5 border border-white/10 text-gray-300 active:scale-[0.98] transition-all">
            대운·세운 80년 보기
          </button>
          <button onClick={() => { setStep("entry"); resultRef.current = null; }}
            className="py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-slate-600 to-zinc-600 text-white active:scale-[0.98] transition-all">
            다시 분석하기
          </button>
        </div>
        <ResultFooterActions targetId="today-result" fileName="오늘의_운세" />
        </FadeIn>
      </div>
    </main>
  );
}

// lib/luckEngine.ts — "오늘의 행운" 콘텐츠 생성기
// 절기(계절 기운) + 사용자의 용신(개인 기운) + 성별을 조합해
// 같은 날에는 항상 같은 결과가 나오도록(캐시·새로고침에도 안 흔들리게) 결정적으로 하루 콘텐츠를 뽑는다.
import { getCurrentSolarTerm, ELEMENT_LUCK, type SolarTermInfo } from "@/lib/solarTerms";
import { getSpecialDay, type SpecialDay } from "@/lib/specialDays";
import { getDailyGrades, type DailyGrades } from "@/lib/domainGrades";
import type { Element } from "@/lib/saju";

export interface DailyLuck {
  dateKey: string;
  term: SolarTermInfo;
  ganwoonTip: string;
  aegmagiTip: string;
  // 24절기에는 없지만 오늘이 해당하면 채워지는 특별한 날 (초복·중복·말복 등)
  specialDay: SpecialDay | null;
  // 절기 행운색 — 오늘 절기 자체의 기운 (모두에게 동일)
  seasonColor: string;
  seasonItem: string;
  // 기본 행운 — 내 용신에 따라 정해지는, 날짜와 무관한 "나의 기본값" 컬러
  personalColor?: string;
  personalColorHex?: string;
  personalItem?: string;
  // 오늘의 행운 — 절기 기운과 내 용신의 상생상극 관계를 따져 "오늘 하루"만 특별히 계산되는 컬러·숫자
  todayColor: string;
  todayColorHex: string;
  todayNumbers: [number, number];
  todayRelationNote?: string; // 용신 정보가 있을 때만 채워짐(생년월일 없으면 undefined)
  charmTip: string;
  actionOfDay: string;
  // 애정운·금전운·직장운 S~D 등급 — 생년월일이 있어야 나만의 등급으로 개인화됨
  dailyGrades: DailyGrades;
}

function hashSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

// 한국 시간(Asia/Seoul, UTC+9) 기준 "YYYY-MM-DD"
export function getKstDateKey(date: Date = new Date()): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

// 절기·용신과 무관하게 매일 하나씩 뽑히는 범용 "오늘의 행운 행동" — 소소하지만 실천하기 쉬운 습관들
const LUCK_ACTIONS: string[] = [
  "아침에 물 한 잔을 마시고 하루를 시작해보세요.",
  "오늘 만나는 사람에게 먼저 인사를 건네보세요.",
  "책상 위를 5분만 정리해보세요.",
  "평소 안 가던 길로 잠깐 산책해보세요.",
  "고마운 사람에게 짧은 안부 메시지를 보내보세요.",
  "핸드폰 사진첩을 정리하며 좋은 기억을 다시 꺼내보세요.",
  "오늘 하루의 목표를 딱 하나만 정해보세요.",
  "지갑 속 영수증을 정리해보세요.",
  "좋아하는 음악을 들으며 하루를 시작해보세요.",
  "창문을 열어 집 안 공기를 환기해보세요.",
  "평소보다 10분 일찍 하루를 시작해보세요.",
  "오늘 먹는 음식 중 하나를 사진으로 남겨보세요.",
  "누군가에게 진심 어린 칭찬 한마디를 건네보세요.",
  "미뤄뒀던 답장 하나를 보내보세요.",
  "손이나 머리 정돈처럼 나를 위한 작은 관리를 해보세요.",
  "평소 안 쓰던 향(향수·디퓨저 등)을 시도해보세요.",
  "짧게라도 스트레칭으로 몸을 풀어보세요.",
  "읽고 싶었던 글 한 편을 읽어보세요.",
  "지갑에 여윳돈을 조금 넣어두세요.",
  "오늘 하루를 사진 한 장으로 기록해보세요.",
];

const CHARM_TIPS_FEMALE: string[] = [
  "립밤 하나로도 표정이 화사해 보일 수 있어요. 입술 보습을 챙겨보세요.",
  "먼저 웃으며 인사하면 오늘 하루 호감도가 확 올라가요.",
  "좋아하는 향수를 은은하게 뿌려보세요. 향은 기억에 오래 남아요.",
  "머리를 평소와 다르게 묶어보는 것만으로 분위기가 바뀌어요.",
  "대화할 때 상대의 눈을 조금 더 오래 마주쳐보세요.",
  "고민을 들어주는 것만으로도 매력 포인트가 될 수 있어요.",
  "편한 신발 대신 살짝 포인트 있는 신발을 신어보세요.",
  "메시지에 이모티콘 하나만 더해도 다정한 인상을 줘요.",
  "거울 앞에서 미소 짓는 연습을 오늘 한 번 해보세요.",
  "관심 있는 사람에게 안부를 먼저 물어보세요.",
  "손을 자주 만지작거리기보단 편안하게 두는 게 더 매력적으로 보여요.",
  "오늘 입는 옷 색깔 하나만 밝게 바꿔보세요.",
];

const CHARM_TIPS_MALE: string[] = [
  "목소리 톤을 살짝 낮추고 천천히 말해보세요. 안정감을 줘요.",
  "문을 잡아주거나 작은 배려를 자연스럽게 해보세요.",
  "손톱이나 신발처럼 디테일 하나를 정돈해보세요.",
  "상대의 말을 끊지 않고 끝까지 들어보세요.",
  "향이 좋은 섬유유연제나 향수를 살짝 활용해보세요.",
  "약속 시간보다 5분 일찍 도착해보세요. 신뢰감을 줘요.",
  "오늘은 자세를 곧게 펴고 걸어보세요.",
  "리액션을 조금 더 크게 해보세요. 대화가 더 즐거워져요.",
  "먼저 연락하는 것을 망설이지 말아보세요.",
  "오늘 입는 셔츠나 니트를 한 번 다려서 입어보세요.",
  "무거운 짐을 들어주는 등 자연스러운 배려를 해보세요.",
  "많은 말보다 진심 담은 한마디를 건네보세요.",
];

export interface DailyLuckOptions {
  date?: Date;
  gender?: "male" | "female";
  yongshin?: Element;
  heeshin?: Element; // 용신을 생해주는 오행 — analyzeSaju().yongshin.heeshin
  ilgan?: string; // 일간(사주 원국의 나) — analyzeSaju().pillarsDetail.day.cg, 도메인 등급 계산에 사용
}

// 오행 상생(生) — 각 원소가 무엇을 낳는가: 목생화, 화생토, 토생금, 금생수, 수생목
const SAENG: Record<Element, Element> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
// 오행 상극(剋) — 각 원소가 무엇을 극하는가: 목극토, 토극수, 수극화, 화극금, 금극목
const GEUK: Record<Element, Element> = { 목: "토", 토: "수", 수: "화", 화: "금", 금: "목" };

// 오행 숫자(하도낙서 생성수) — 사주·역학에서 통용되는 오행별 숫자
export const ELEMENT_NUMBER: Record<Element, [number, number]> = {
  수: [1, 6], 화: [2, 7], 목: [3, 8], 금: [4, 9], 토: [5, 10],
};

interface TodayElementResult {
  element: Element;
  note: string;
}

// 오늘의 절기 기운(term)과 내 용신(yongshin)의 관계를 상생상극으로 따져
// "오늘 하루" 특별히 힘을 주는 오행 하나를 골라낸다.
function computeTodayElement(term: Element, yongshin: Element, heeshin: Element): TodayElementResult {
  if (term === yongshin) {
    return { element: yongshin, note: `오늘 기운과 당신의 용신이 같은 ${yongshin} 기운이에요. 하루 종일 든든하게 힘을 받는 날이에요.` };
  }
  if (SAENG[term] === yongshin) {
    return { element: yongshin, note: `오늘 기운(${term})이 당신의 용신(${yongshin})을 생(生)해주는 날이에요. 용신 컬러를 곁들이면 기운이 배가돼요.` };
  }
  if (SAENG[yongshin] === term) {
    return { element: heeshin, note: `오늘은 당신의 기운이 밖으로 많이 흘러나가는(설기) 날이에요. ${heeshin} 컬러로 기운을 채워보세요.` };
  }
  if (GEUK[term] === yongshin) {
    return { element: heeshin, note: `오늘 기운(${term})이 당신의 용신(${yongshin})을 누르는 날이에요. ${heeshin} 컬러로 방어막을 세워보세요.` };
  }
  // GEUK[yongshin] === term — 남은 유일한 경우: 내 용신이 오늘 기운을 극(剋)함
  return { element: yongshin, note: `당신의 용신(${yongshin})이 오늘 기운(${term})을 제압하는 날이에요. 자신감 있게 밀고 나가도 좋아요.` };
}

export function getDailyLuck(opts: DailyLuckOptions = {}): DailyLuck {
  const date = opts.date ?? new Date();
  const dateKey = getKstDateKey(date);
  const term = getCurrentSolarTerm(date);
  const specialDay = getSpecialDay(date);
  const dailyGrades = getDailyGrades(date, opts.ilgan);
  const seed = hashSeed(dateKey);

  const ganwoonTip = pick(term.ganwoonTips, seed);
  const actionOfDay = pick(LUCK_ACTIONS, seed + 7);
  const charmList = opts.gender === "male" ? CHARM_TIPS_MALE : CHARM_TIPS_FEMALE;
  const charmTip = pick(charmList, seed + 13);

  let personalColor: string | undefined;
  let personalColorHex: string | undefined;
  let personalItem: string | undefined;

  // 기본값(비로그인/생년월일 미입력)은 절기 자체의 기운을 "오늘의 행운"으로 사용
  let todayColor = term.luckyColor;
  let todayColorHex = ELEMENT_LUCK[term.element].colorHex;
  let todayNumbers = ELEMENT_NUMBER[term.element];
  let todayRelationNote: string | undefined;

  if (opts.yongshin) {
    const lk = ELEMENT_LUCK[opts.yongshin];
    personalColor = lk.color;
    personalColorHex = lk.colorHex;
    personalItem = lk.item;

    const result = computeTodayElement(term.element, opts.yongshin, opts.heeshin ?? opts.yongshin);
    const todayLk = ELEMENT_LUCK[result.element];
    todayColor = todayLk.color;
    todayColorHex = todayLk.colorHex;
    todayNumbers = ELEMENT_NUMBER[result.element];
    todayRelationNote = result.note;
  }

  return {
    dateKey, term, specialDay, ganwoonTip, aegmagiTip: term.aegmagiTip,
    seasonColor: term.luckyColor, seasonItem: term.luckyItem,
    personalColor, personalColorHex, personalItem,
    todayColor, todayColorHex, todayNumbers, todayRelationNote,
    charmTip, actionOfDay, dailyGrades,
  };
}

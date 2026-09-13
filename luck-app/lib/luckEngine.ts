// lib/luckEngine.ts — "오늘의 행운" 콘텐츠 생성기
// 절기(계절 기운) + 사용자의 용신(개인 기운) + 성별을 조합해
// 같은 날에는 항상 같은 결과가 나오도록(캐시·새로고침에도 안 흔들리게) 결정적으로 하루 콘텐츠를 뽑는다.
import { getCurrentSolarTerm, ELEMENT_LUCK, type SolarTermInfo } from "@/lib/solarTerms";
import { getSpecialDay, type SpecialDay } from "@/lib/specialDays";
import { getDailyGrades, type DailyGrades } from "@/lib/domainGrades";
import { GANWOON_ONE_LINERS, LEAP_DAY_ONE_LINERS } from "@/lib/ganwoonOneLiners";
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
  // "하루 한 줄 개운법" — 매일 결정적으로 뽑히는 짧은 개운법 (lib/ganwoonOneLiners.ts).
  // 보통 하루에 1개지만, 아주 간단한 개운법끼리는 같은 날에 2개를 함께 보여주기도 한다.
  actionOfDay: string[];
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

// 월별 누적 일수(평년 기준) — "하루 한 줄 개운법"을 연도와 무관하게 날짜(월/일)에
// 고정으로 매핑하기 위한 인덱스. 해가 바뀌어도 같은 날짜엔 항상 같은 개운법이 뜨도록 한다.
// 2/29(윤일)은 이 365개 풀과 별개로 LEAP_DAY_ONE_LINERS에서 전용 문구를 뽑는다.
const MONTH_CUM_DAYS = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
function fixedDayIndex(month: number, day: number): number {
  return MONTH_CUM_DAYS[month - 1] + (day - 1);
}

// 한국 시간(Asia/Seoul, UTC+9) 기준 "YYYY-MM-DD"
export function getKstDateKey(date: Date = new Date()): string {
  const kst = new Date(date.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

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
    return { element: yongshin, note: `오늘 기운과 당신의 사주 기운이 같은 ${yongshin} 기운이에요. 하루 종일 든든하게 힘을 받는 날이에요.` };
  }
  if (SAENG[term] === yongshin) {
    return { element: yongshin, note: `오늘 기운(${term})이 당신의 사주 기운(${yongshin})을 생(生)해주는 날이에요. 이 컬러를 곁들이면 기운이 배가돼요.` };
  }
  if (SAENG[yongshin] === term) {
    return { element: heeshin, note: `오늘은 당신의 기운이 밖으로 많이 흘러나가는(설기) 날이에요. ${heeshin} 컬러로 기운을 채워보세요.` };
  }
  if (GEUK[term] === yongshin) {
    return { element: heeshin, note: `오늘 기운(${term})이 당신의 사주 기운(${yongshin})을 누르는 날이에요. ${heeshin} 컬러로 방어막을 세워보세요.` };
  }
  // GEUK[yongshin] === term — 남은 유일한 경우: 내 사주 기운이 오늘 기운을 극(剋)함
  return { element: yongshin, note: `당신의 사주 기운(${yongshin})이 오늘 기운(${term})을 제압하는 날이에요. 자신감 있게 밀고 나가도 좋아요.` };
}

export function getDailyLuck(opts: DailyLuckOptions = {}): DailyLuck {
  const date = opts.date ?? new Date();
  const dateKey = getKstDateKey(date);
  const term = getCurrentSolarTerm(date);
  const specialDay = getSpecialDay(date);
  const dailyGrades = getDailyGrades(date, opts.ilgan);
  const seed = hashSeed(dateKey);

  const ganwoonTip = pick(term.ganwoonTips, seed);
  const [yStr, mStr, dStr] = dateKey.split("-");
  const month = Number(mStr), day = Number(dStr);
  // 윤년은 항상 4의 배수라 연도를 그대로 나머지 연산하면 짝수만 나와 절대 골고루 안 뽑힘 —
  // 4로 나눈 몫으로 나머지 연산해야 윤년이 돌아올 때마다(4년 간격) 실제로 번갈아 뽑힌다.
  const rawAction = month === 2 && day === 29
    ? LEAP_DAY_ONE_LINERS[Math.floor(Number(yStr) / 4) % LEAP_DAY_ONE_LINERS.length]
    : GANWOON_ONE_LINERS[fixedDayIndex(month, day) % GANWOON_ONE_LINERS.length];
  // 슬롯 하나에 짧은 개운법 2개를 묶어둔 날도 있어서(lib/ganwoonOneLiners.ts), 배열로 통일한다.
  const actionOfDay = Array.isArray(rawAction) ? rawAction : [rawAction];

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
    actionOfDay, dailyGrades,
  };
}

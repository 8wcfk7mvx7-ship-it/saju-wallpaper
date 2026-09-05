// lib/luckEngine.ts — "오늘의 행운" 콘텐츠 생성기
// 절기(계절 기운) + 사용자의 용신(개인 기운) + 성별을 조합해
// 같은 날에는 항상 같은 결과가 나오도록(캐시·새로고침에도 안 흔들리게) 결정적으로 하루 콘텐츠를 뽑는다.
import { getCurrentSolarTerm, ELEMENT_LUCK, type SolarTermInfo } from "@/lib/solarTerms";
import type { Element } from "@/lib/saju";

export interface DailyLuck {
  dateKey: string;
  term: SolarTermInfo;
  ganwoonTip: string;
  aegmagiTip: string;
  seasonColor: string;
  seasonItem: string;
  personalColor?: string;
  personalColorHex?: string;
  personalItem?: string;
  synergyNote?: string;
  charmTip: string;
  actionOfDay: string;
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
}

export function getDailyLuck(opts: DailyLuckOptions = {}): DailyLuck {
  const date = opts.date ?? new Date();
  const dateKey = getKstDateKey(date);
  const term = getCurrentSolarTerm(date);
  const seed = hashSeed(dateKey);

  const ganwoonTip = pick(term.ganwoonTips, seed);
  const actionOfDay = pick(LUCK_ACTIONS, seed + 7);
  const charmList = opts.gender === "male" ? CHARM_TIPS_MALE : CHARM_TIPS_FEMALE;
  const charmTip = pick(charmList, seed + 13);

  let personalColor: string | undefined;
  let personalColorHex: string | undefined;
  let personalItem: string | undefined;
  let synergyNote: string | undefined;

  if (opts.yongshin) {
    const lk = ELEMENT_LUCK[opts.yongshin];
    personalColor = lk.color;
    personalColorHex = lk.colorHex;
    personalItem = lk.item;
    synergyNote = opts.yongshin === term.element
      ? `오늘 ${term.name} 절기의 기운과 당신의 용신(${opts.yongshin}) 기운이 같은 결이에요. 절기가 주는 흐름을 그대로 타면 좋은 날이에요.`
      : `오늘 ${term.name} 절기는 ${term.element} 기운이 강하고, 당신의 용신은 ${opts.yongshin}이에요. 절기 개운법과 함께 ${lk.color} 컬러를 곁들이면 부족한 기운이 채워져요.`;
  }

  return {
    dateKey, term, ganwoonTip, aegmagiTip: term.aegmagiTip,
    seasonColor: term.luckyColor, seasonItem: term.luckyItem,
    personalColor, personalColorHex, personalItem, synergyNote,
    charmTip, actionOfDay,
  };
}

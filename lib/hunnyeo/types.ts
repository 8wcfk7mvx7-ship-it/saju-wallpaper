// ── 훈녀생정 자료 구조 ────────────────────────────────────────────────────
// 각 항목은 "준비물 → 하는 방법 → 효과" 순서로 담백하게 정리한다.
// 인터넷 후기 말투는 쓰지 않는다. (예: "뽀얀 피부를 얻을 수 있어요.")

export type HunnyeoCategoryKey =
  | "all"
  | "facepack"  // 제1장 얼굴팩
  | "skin"      // 제2장 피부고민
  | "diet"      // 제3장 다이어트
  | "swelling"  // 제4장 붓기빼기
  | "hair"      // 제5장 머릿결
  | "scalp"     // 제6장 두피·머리숱
  | "foot"      // 제7장 발관리
  | "nail"      // 제8장 손·손톱
  | "lip"       // 제9장 입술·치아
  | "eye"       // 제10장 눈·눈썹
  | "body"      // 제11장 몸매·자세
  | "life"      // 제12장 생활습관
  | "item"      // 제13장 완소템
  | "words";    // 제14장 추억사전

export interface HunnyeoCategory {
  key: HunnyeoCategoryKey;
  label: string;
  desc: string;
  emoji: string;
  accent: string;
}

export const CATEGORIES: HunnyeoCategory[] = [
  { key: "all",      label: "전체보기",    desc: "훈녀생정 전체 목록",         emoji: "🎀", accent: "#ff3d9a" },
  { key: "facepack", label: "얼굴팩",      desc: "밀가루·과일로 만드는 팩",     emoji: "🍎", accent: "#ff6fb5" },
  { key: "skin",     label: "피부고민",    desc: "여드름·모공·잡티 관리",       emoji: "✨", accent: "#f2622e" },
  { key: "diet",     label: "다이어트",    desc: "그 시절 유행한 다이어트",     emoji: "🍉", accent: "#39b96a" },
  { key: "swelling", label: "붓기빼기",    desc: "얼굴·다리 부기 관리",         emoji: "🧊", accent: "#2ba7e0" },
  { key: "hair",     label: "머릿결",      desc: "찰랑거리는 머릿결 만들기",    emoji: "🎀", accent: "#9b6bf5" },
  { key: "scalp",    label: "두피·머리숱", desc: "두피 관리와 머리 기르기",     emoji: "💇‍♀️", accent: "#7c5cd6" },
  { key: "foot",     label: "발관리",      desc: "매끈한 발뒤꿈치 만들기",      emoji: "🩰", accent: "#2bb6c0" },
  { key: "nail",     label: "손·손톱",     desc: "봉숭아물과 손 관리",          emoji: "💅", accent: "#f2622e" },
  { key: "lip",      label: "입술·치아",   desc: "입술 각질과 하얀 이",         emoji: "💋", accent: "#e02b52" },
  { key: "eye",      label: "눈·눈썹",     desc: "눈썹 정리와 눈가 관리",       emoji: "👁️", accent: "#8b5cf6" },
  { key: "body",     label: "몸매·자세",   desc: "자세 교정과 맵시 관리",       emoji: "🩱", accent: "#e0399b" },
  { key: "life",     label: "생활습관",    desc: "잠·물·향기 같은 기본기",      emoji: "🌙", accent: "#5b8def" },
  { key: "item",     label: "완소템",      desc: "그 시절 필수 아이템",         emoji: "💗", accent: "#ff5ca8" },
  { key: "words",    label: "추억사전",    desc: "그 시절 말과 유행 이야기",    emoji: "📖", accent: "#e0a800" },
];

export type TipType = "action" | "read";

export interface HunnyeoTip {
  id: string;
  category: Exclude<HunnyeoCategoryKey, "all">;
  title: string;
  materials?: string[]; // 준비물
  steps: string[]; // 하는 방법 (순서대로)
  effect: string; // 이렇게 하면 얻는 것
  caution?: string; // 현재 기준 안전 안내
  tags: string[];
  points: number; // 체크 완료 시 얻는 훈녀력 점수
  type: TipType; // action = 직접 해보는 것, read = 읽고 아는 것
}

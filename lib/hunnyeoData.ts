// ── 훈녀생정 데이터베이스 (모음) ─────────────────────────────────────────────
// "훈녀생정"은 2000년대 중반, 아직 초·중딩이었던 90년대생들이 블로그·카페에
// 올리고 퍼 나르던 "훈훈한 여자 생활정보"의 줄임말이다.
// 장별 자료는 lib/hunnyeo/tips-*.ts 에 나누어 두고 여기서 하나로 합친다.
//
// 문체 원칙: 그 시절 인터넷 후기 말투를 쓰지 않고, 준비물 → 하는 방법 → 효과
// 순서로 담백하게 정리한다. 예) "뽀얀 피부를 얻을 수 있어요."
//
// ⚠️ 다이어트 등 건강과 관련된 항목은 그 시절 유행을 소개하는 추억 콘텐츠입니다.
// 현재 기준으로 무리한 방식에는 caution 필드로 주의사항을 함께 적습니다.

import { FACEPACK_TIPS } from "./hunnyeo/tips-facepack";
import { SKIN_TIPS } from "./hunnyeo/tips-skin";
import { DIET_TIPS } from "./hunnyeo/tips-diet";
import { SWELLING_TIPS } from "./hunnyeo/tips-swelling";
import { HAIR_TIPS } from "./hunnyeo/tips-hair";
import { SCALP_TIPS } from "./hunnyeo/tips-scalp";
import { FOOT_TIPS } from "./hunnyeo/tips-foot";
import { NAIL_TIPS } from "./hunnyeo/tips-nail";
import { LIP_TIPS } from "./hunnyeo/tips-lip";
import { EYE_TIPS } from "./hunnyeo/tips-eye";
import { BODY_TIPS } from "./hunnyeo/tips-body";
import { LIFE_TIPS } from "./hunnyeo/tips-life";
import { ITEM_TIPS } from "./hunnyeo/tips-item";
import { WORDS_TIPS } from "./hunnyeo/tips-words";
import type { HunnyeoTip } from "./hunnyeo/types";

export { CATEGORIES } from "./hunnyeo/types";
export type { HunnyeoCategoryKey, HunnyeoCategory, HunnyeoTip, TipType } from "./hunnyeo/types";

export const TIPS: HunnyeoTip[] = [
  ...FACEPACK_TIPS,
  ...SKIN_TIPS,
  ...DIET_TIPS,
  ...SWELLING_TIPS,
  ...HAIR_TIPS,
  ...SCALP_TIPS,
  ...FOOT_TIPS,
  ...NAIL_TIPS,
  ...LIP_TIPS,
  ...EYE_TIPS,
  ...BODY_TIPS,
  ...LIFE_TIPS,
  ...ITEM_TIPS,
  ...WORDS_TIPS,
];

export const TOTAL_POSSIBLE_POINTS = TIPS.reduce((sum, t) => sum + t.points, 0);

// ── 훈녀력 레벨 ───────────────────────────────────────────────────────────
export interface HunnyeoLevel {
  name: string;
  emoji: string;
  min: number;
}

export const LEVELS: HunnyeoLevel[] = [
  { name: "새내기 훈녀",      emoji: "🌱", min: 0 },
  { name: "완소 훈녀",        emoji: "🎀", min: 80 },
  { name: "인기짱 훈녀",      emoji: "💅", min: 250 },
  { name: "얼짱각도 마스터",   emoji: "📸", min: 550 },
  { name: "전설의 왕언니",     emoji: "👑", min: 900 },
];

export interface LevelInfo {
  index: number;
  level: HunnyeoLevel;
  next: HunnyeoLevel | null;
  progress: number; // 0~1, 다음 레벨까지 진행률 (마지막 레벨이면 1)
  pointsToNext: number; // 다음 레벨까지 남은 점수 (마지막 레벨이면 0)
}

export function getLevelInfo(points: number): LevelInfo {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].min) index = i;
  }
  const level = LEVELS[index];
  const next = LEVELS[index + 1] ?? null;
  if (!next) return { index, level, next: null, progress: 1, pointsToNext: 0 };
  const span = next.min - level.min;
  const progress = Math.min(1, Math.max(0, (points - level.min) / span));
  return { index, level, next, progress, pointsToNext: Math.max(0, next.min - points) };
}

// ── 방명록 초기 시드 ──────────────────────────────────────────────────────
export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  date: string;
}

export const GUESTBOOK_SEED: GuestbookEntry[] = [
  { id: "gb1", name: "달빛소녀", message: "봉숭아물 들이던 여름밤이 생각나요. 첫눈까지 남았었는지는 기억이 안 나네요.", date: "2026.09.01" },
  { id: "gb2", name: "삐삐머리", message: "밀가루팩 하다가 엄마한테 혼났던 기억이 나요. 반가운 목록이에요.", date: "2026.09.02" },
  { id: "gb3", name: "옆가르마", message: "얼짱 각도 설명 보고 옛날 사진첩을 열어봤어요.", date: "2026.09.03" },
  { id: "gb4", name: "완소완소", message: "완소라는 말 진짜 오랜만에 봐요. 그때 친구들 생각이 나네요.", date: "2026.09.04" },
  { id: "gb5", name: "덴마크실패", message: "황제 다이어트 하다가 셋째 날에 밥 한 공기 먹고 울었던 사람 저요.", date: "2026.09.05" },
];

// ── 로컬 저장 키 ──────────────────────────────────────────────────────────
export const CHECKED_STORAGE_KEY = "hunnyeo_checked_v2";
export const GUESTBOOK_STORAGE_KEY = "hunnyeo_guestbook_v1";
export const VISITED_STORAGE_KEY = "hunnyeo_visited_v1";
export const NICKNAME_STORAGE_KEY = "hunnyeo_nickname_v1";

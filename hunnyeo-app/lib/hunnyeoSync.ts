// ── 기기 간 기록 동기화 ───────────────────────────────────────────────────
// 로그인했을 때만 동작한다. 로그인하지 않아도 앱은 지금처럼 이 기기에만 기록한다.
// 체크·찜은 합집합으로 합쳐서 어느 기기에서 한 것도 사라지지 않게 한다.

import { supabase } from "./hunnyeoSupabase";
import {
  CHECKED_STORAGE_KEY,
  FAVORITE_STORAGE_KEY,
  NICKNAME_STORAGE_KEY,
  AVATAR_STORAGE_KEY,
  STREAK_STORAGE_KEY,
} from "./hunnyeoData";
import { loadJSON, saveJSON } from "./hunnyeoStorage";

// mypage 화면에 있는 상수와 같은 값이다 (글자 크기 저장 키).
const TEXT_SIZE_KEY = "hunnyeo_textsize_v1";

interface StreakInfo {
  last: string;
  count: number;
}

interface HunnyeoRecordRow {
  nickname: string | null;
  avatar: string | null;
  checked: Record<string, boolean> | null;
  favorite: Record<string, boolean> | null;
  streak: StreakInfo | null;
  text_size: string | null;
}

/** 지금 이 기기 기록을 클라우드에 그대로 올린다(덮어쓰기). */
export async function pushRecord(userId: string): Promise<void> {
  await supabase.from("hunnyeo_records").upsert({
    user_id: userId,
    nickname: loadJSON(NICKNAME_STORAGE_KEY, "완소소녀"),
    avatar: loadJSON(AVATAR_STORAGE_KEY, ""),
    checked: loadJSON<Record<string, boolean>>(CHECKED_STORAGE_KEY, {}),
    favorite: loadJSON<Record<string, boolean>>(FAVORITE_STORAGE_KEY, {}),
    streak: loadJSON<StreakInfo>(STREAK_STORAGE_KEY, { last: "", count: 0 }),
    text_size: loadJSON(TEXT_SIZE_KEY, "normal"),
    updated_at: new Date().toISOString(),
  });
}

/** 로그인 직후 호출: 클라우드 기록과 이 기기 기록을 합치고 다시 올린다. */
export async function pullAndMergeRecord(userId: string): Promise<void> {
  const { data } = await supabase
    .from("hunnyeo_records")
    .select("nickname, avatar, checked, favorite, streak, text_size")
    .eq("user_id", userId)
    .maybeSingle<HunnyeoRecordRow>();

  if (data) {
    const localChecked = loadJSON<Record<string, boolean>>(CHECKED_STORAGE_KEY, {});
    const localFavorite = loadJSON<Record<string, boolean>>(FAVORITE_STORAGE_KEY, {});
    const localNickname = loadJSON(NICKNAME_STORAGE_KEY, "완소소녀");
    const localAvatar = loadJSON(AVATAR_STORAGE_KEY, "");

    saveJSON(CHECKED_STORAGE_KEY, { ...(data.checked ?? {}), ...localChecked });
    saveJSON(FAVORITE_STORAGE_KEY, { ...(data.favorite ?? {}), ...localFavorite });
    if (localNickname === "완소소녀" && data.nickname) saveJSON(NICKNAME_STORAGE_KEY, data.nickname);
    if (!localAvatar && data.avatar) saveJSON(AVATAR_STORAGE_KEY, data.avatar);
    if (data.streak) saveJSON(STREAK_STORAGE_KEY, data.streak);
    if (data.text_size) saveJSON(TEXT_SIZE_KEY, data.text_size);
  }

  await pushRecord(userId);
}

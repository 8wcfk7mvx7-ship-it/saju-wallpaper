// ── 기록 백업 / 복원 ──────────────────────────────────────────────────────
// 서버가 없으므로 기기를 바꾸면 기록이 사라진다. 돈 주고 산 앱에서 그러면
// 곤란하므로, 기록을 글자 하나로 뽑아내고 다시 붙여 넣을 수 있게 한다.
// (메모장이나 카톡 내게쓰기에 붙여 두면 그대로 옮겨진다)

import {
  CHECKED_STORAGE_KEY,
  FAVORITE_STORAGE_KEY,
  NICKNAME_STORAGE_KEY,
  STREAK_STORAGE_KEY,
  TIPS,
} from "./hunnyeoData";
import { loadJSON, saveJSON } from "./hunnyeoStorage";

const MAGIC = "훈녀생정";
const VERSION = 1;

interface BackupPayload {
  v: number;
  nickname: string;
  checked: string[];
  favorite: string[];
  streak: { last: string; count: number };
}

/** 지금 기록을 한 덩어리 글자로 만든다. 사진은 용량이 커서 넣지 않는다. */
export function exportRecord(): string {
  const checked = loadJSON<Record<string, boolean>>(CHECKED_STORAGE_KEY, {});
  const favorite = loadJSON<Record<string, boolean>>(FAVORITE_STORAGE_KEY, {});
  const payload: BackupPayload = {
    v: VERSION,
    nickname: loadJSON<string>(NICKNAME_STORAGE_KEY, ""),
    checked: Object.keys(checked).filter(k => checked[k]),
    favorite: Object.keys(favorite).filter(k => favorite[k]),
    streak: loadJSON(STREAK_STORAGE_KEY, { last: "", count: 0 }),
  };
  // 한글이 섞여 있어도 안전하도록 UTF-8 로 바꾼 뒤 base64 로 만든다.
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = "";
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return `${MAGIC}:${btoa(binary)}`;
}

export interface RestoreResult {
  ok: boolean;
  message: string;
  restored?: number;
}

/** 붙여 넣은 글자로 기록을 되돌린다. 형식이 어긋나면 아무것도 건드리지 않는다. */
export function importRecord(code: string): RestoreResult {
  const trimmed = code.trim();
  if (!trimmed) return { ok: false, message: "붙여 넣은 내용이 없어요." };
  if (!trimmed.startsWith(`${MAGIC}:`)) {
    return { ok: false, message: "훈녀생정 백업 코드가 아니에요." };
  }

  let payload: BackupPayload;
  try {
    const binary = atob(trimmed.slice(MAGIC.length + 1));
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    payload = JSON.parse(new TextDecoder().decode(bytes)) as BackupPayload;
  } catch {
    return { ok: false, message: "코드가 중간에 끊긴 것 같아요. 전체를 복사했는지 봐 주세요." };
  }

  if (payload.v !== VERSION || !Array.isArray(payload.checked)) {
    return { ok: false, message: "알 수 없는 형식이에요." };
  }

  // 지금 앱에 없는 항목 id 는 버린다 (예전 버전에서 옮겨온 경우)
  const known = new Set(TIPS.map(t => t.id));
  const checked: Record<string, boolean> = {};
  payload.checked.filter(id => known.has(id)).forEach(id => (checked[id] = true));
  const favorite: Record<string, boolean> = {};
  (payload.favorite ?? []).filter(id => known.has(id)).forEach(id => (favorite[id] = true));

  saveJSON(CHECKED_STORAGE_KEY, checked);
  saveJSON(FAVORITE_STORAGE_KEY, favorite);
  if (payload.nickname) saveJSON(NICKNAME_STORAGE_KEY, payload.nickname);
  if (payload.streak) saveJSON(STREAK_STORAGE_KEY, payload.streak);

  return {
    ok: true,
    message: `${Object.keys(checked).length}개를 되살렸어요.`,
    restored: Object.keys(checked).length,
  };
}

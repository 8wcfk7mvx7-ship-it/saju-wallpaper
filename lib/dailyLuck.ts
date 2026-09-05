"use client";
// lib/dailyLuck.ts — "오늘의 행운" 메모·기록 저장소
// 비로그인 사용자는 localStorage에만 남기고, 로그인 사용자는 서버(Supabase)에 저장하되
// 화면 반응성을 위해 로컬에도 함께 남겨둔다. (blueberry.ts와 동일한 로컬 우선 + 서버 동기화 패턴)
import { supabaseBrowser } from "@/lib/supabaseClient";

const MEMO_KEY = "sp_daily_memos";
const LOG_KEY = "sp_daily_luck_logs";

export interface LuckLogEntry {
  rating: number;
  tags: string[];
  note: string;
}

async function getToken(): Promise<string | null> {
  if (!supabaseBrowser) return null;
  try {
    const { data } = await supabaseBrowser.auth.getSession();
    return data.session?.access_token ?? null;
  } catch {
    return null;
  }
}

function readLocal<T>(key: string): Record<string, T> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch {
    return {};
  }
}

function writeLocal<T>(key: string, data: Record<string, T>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

// ── 메모 ─────────────────────────────────────────────────────────────────
export async function loadMemo(date: string): Promise<string> {
  const token = await getToken();
  if (token) {
    try {
      const res = await fetch(`/api/luck/memo?date=${date}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        const content = json.memos?.[0]?.content;
        if (typeof content === "string") return content;
      }
    } catch {}
  }
  return readLocal<string>(MEMO_KEY)[date] ?? "";
}

export async function saveMemo(date: string, content: string): Promise<void> {
  const memos = readLocal<string>(MEMO_KEY);
  memos[date] = content;
  writeLocal(MEMO_KEY, memos);

  const token = await getToken();
  if (!token) return;
  try {
    await fetch("/api/luck/memo", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ date, content }),
    });
  } catch {}
}

// ── 하루 행운 기록 ────────────────────────────────────────────────────────
export async function loadLog(date: string): Promise<LuckLogEntry | null> {
  const token = await getToken();
  if (token) {
    try {
      const res = await fetch(`/api/luck/log?date=${date}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        const row = json.logs?.[0];
        if (row) return { rating: row.rating, tags: row.tags ?? [], note: row.note ?? "" };
      }
    } catch {}
  }
  return readLocal<LuckLogEntry>(LOG_KEY)[date] ?? null;
}

export async function saveLog(date: string, entry: LuckLogEntry): Promise<void> {
  const logs = readLocal<LuckLogEntry>(LOG_KEY);
  logs[date] = entry;
  writeLocal(LOG_KEY, logs);

  const token = await getToken();
  if (!token) return;
  try {
    await fetch("/api/luck/log", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ date, ...entry }),
    });
  } catch {}
}

// 최근 N일간의 행운 점수 기록 — 스트릭·미니 히스토리 표시용
export async function loadRecentLogs(dateKeys: string[]): Promise<Record<string, LuckLogEntry>> {
  const token = await getToken();
  if (token) {
    try {
      const res = await fetch(`/api/luck/log?days=${dateKeys.length}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const json = await res.json();
        const result: Record<string, LuckLogEntry> = {};
        for (const row of json.logs ?? []) {
          result[row.log_date] = { rating: row.rating, tags: row.tags ?? [], note: row.note ?? "" };
        }
        return result;
      }
    } catch {}
  }
  const local = readLocal<LuckLogEntry>(LOG_KEY);
  const result: Record<string, LuckLogEntry> = {};
  for (const d of dateKeys) if (local[d]) result[d] = local[d];
  return result;
}

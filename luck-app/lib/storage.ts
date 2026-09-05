"use client";
// lib/storage.ts — 행운의 어플 로컬 저장소
// v1은 별도 로그인/서버 없이 기기 안에서만 동작합니다(온보딩 없이 바로 쓸 수 있게).
// 나중에 여러 기기 동기화가 필요해지면 supabase/schema.sql에 맞춰 서버 동기화를 얹으면 됩니다.

export interface SajuProfile {
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number | null; // null = 시간 모름
  calendarType: "solar" | "lunar";
  isLeapMonth: boolean;
  gender: "male" | "female";
}

export interface LuckLogEntry {
  rating: number;
  tags: string[];
  note: string;
}

const PROFILE_KEY = "luck_profile";
const MEMO_KEY = "luck_memos";
const LOG_KEY = "luck_logs";
const SKIP_ONBOARDING_KEY = "luck_skip_onboarding";
const CALL_KEY = "luck_calls";
const ALL_KEYS = [PROFILE_KEY, MEMO_KEY, LOG_KEY, SKIP_ONBOARDING_KEY, CALL_KEY];

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

// ── 사주 프로필 (기기당 1개) ─────────────────────────────────────────────
export function getProfile(): SajuProfile | null {
  return readJson<SajuProfile | null>(PROFILE_KEY, null);
}

export function saveProfile(profile: SajuProfile): void {
  writeJson(PROFILE_KEY, profile);
}

export function clearProfile(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROFILE_KEY);
}

// "생년월일 없이 보기"를 선택했는지 — 선택했다면 다음부터는 인트로를 다시 띄우지 않음
export function getSkipOnboarding(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SKIP_ONBOARDING_KEY) === "1";
}

export function setSkipOnboarding(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(SKIP_ONBOARDING_KEY, "1");
}

// ── 오늘의 메모 ───────────────────────────────────────────────────────────
export function getMemo(date: string): string {
  return readJson<Record<string, string>>(MEMO_KEY, {})[date] ?? "";
}

export function setMemo(date: string, content: string): void {
  const memos = readJson<Record<string, string>>(MEMO_KEY, {});
  memos[date] = content;
  writeJson(MEMO_KEY, memos);
}

// 지금까지 쓴 모든 메모를 최신순으로 반환 (빈 메모는 제외)
export function getAllMemos(): { date: string; content: string }[] {
  const memos = readJson<Record<string, string>>(MEMO_KEY, {});
  return Object.entries(memos)
    .filter(([, content]) => content.trim().length > 0)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, content]) => ({ date, content }));
}

// ── 하루 행운 기록 ────────────────────────────────────────────────────────
export function getLog(date: string): LuckLogEntry | null {
  return readJson<Record<string, LuckLogEntry>>(LOG_KEY, {})[date] ?? null;
}

export function setLog(date: string, entry: LuckLogEntry): void {
  const logs = readJson<Record<string, LuckLogEntry>>(LOG_KEY, {});
  logs[date] = entry;
  writeJson(LOG_KEY, logs);
}

export function getRecentLogs(dateKeys: string[]): Record<string, LuckLogEntry> {
  const all = readJson<Record<string, LuckLogEntry>>(LOG_KEY, {});
  const result: Record<string, LuckLogEntry> = {};
  for (const d of dateKeys) if (all[d]) result[d] = all[d];
  return result;
}

// ── 행운 부르기 — 오늘 하루 한마디로 행운을 불러보는 문구 ─────────────────────
export function getCall(date: string): string {
  return readJson<Record<string, string>>(CALL_KEY, {})[date] ?? "";
}

export function setCall(date: string, text: string): void {
  const calls = readJson<Record<string, string>>(CALL_KEY, {});
  calls[date] = text;
  writeJson(CALL_KEY, calls);
}

// 지금까지 불러본 모든 "행운 부르기" 문구를 최신순으로 반환
export function getAllCalls(): { date: string; text: string }[] {
  const calls = readJson<Record<string, string>>(CALL_KEY, {});
  return Object.entries(calls)
    .filter(([, text]) => text.trim().length > 0)
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, text]) => ({ date, text }));
}

// ── 백업/복원 ───────────────────────────────────────────────────────────
// v1은 이 기기의 localStorage에만 저장되므로(계정·서버 없음), 기기를 바꾸거나
// 앱 데이터를 지우기 전에 이 함수로 내보낸 파일을 보관해두면 그대로 복원할 수 있다.
export function exportAllData(): string {
  const data: Record<string, unknown> = {};
  if (typeof window !== "undefined") {
    for (const key of ALL_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try { data[key] = JSON.parse(raw); } catch { /* 손상된 값은 건너뜀 */ }
      }
    }
  }
  return JSON.stringify({ app: "luck-app", version: 1, exportedAt: new Date().toISOString(), data }, null, 2);
}

export function importAllData(json: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const parsed = JSON.parse(json) as { data?: Record<string, unknown> };
    if (!parsed || typeof parsed.data !== "object" || parsed.data === null) return false;
    for (const key of ALL_KEYS) {
      if (key in parsed.data) localStorage.setItem(key, JSON.stringify(parsed.data[key]));
    }
    return true;
  } catch {
    return false;
  }
}

// 카카오 로그인 회원 전용 생년월일 프로필 저장/불러오기

export interface SavedProfile {
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;        // -1 = 시간 모름
  birthHourUnknown: boolean;
  gender: "male" | "female";
  savedAt: string;          // ISO 8601
  label?: string;           // 별명 (예: "나", "엄마")
}

const KEY = "sp_saved_saju_list";

export function isLoggedIn(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const match = document.cookie.split(";").find(c => c.trim().startsWith("sp_user="));
    if (!match) return false;
    const encoded = match.trim().split("=")[1];
    return !!JSON.parse(atob(encoded));
  } catch {
    return false;
  }
}

export function getProfiles(): SavedProfile[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProfile(p: Omit<SavedProfile, "savedAt">): void {
  if (typeof localStorage === "undefined") return;
  const list = getProfiles();
  list.unshift({ ...p, savedAt: new Date().toISOString() });
  localStorage.setItem(KEY, JSON.stringify(list.slice(0, 20))); // 최대 20개
}

export function deleteProfile(index: number): void {
  if (typeof localStorage === "undefined") return;
  const list = getProfiles();
  list.splice(index, 1);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function isDuplicate(birthYear: number, birthMonth: number, birthDay: number): boolean {
  return getProfiles().some(
    p => p.birthYear === birthYear && p.birthMonth === birthMonth && p.birthDay === birthDay
  );
}

export function formatProfile(p: SavedProfile): string {
  const y = p.birthYear;
  const m = String(p.birthMonth).padStart(2, "0");
  const d = String(p.birthDay).padStart(2, "0");
  const g = p.gender === "male" ? "남" : "여";
  return `${y}.${m}.${d} · ${g}`;
}

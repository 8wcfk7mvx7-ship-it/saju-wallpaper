export interface SavedSajuData {
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number | null;
  birthMinute: number | null;
  birthHourUnknown: boolean;
  name: string;
  gender: "male" | "female";
  birthPlace: string;
  style: string;
  useJajasi: boolean;
  lang?: string;
}

const KEY = "sajuForm";

export function loadSajuData(): SavedSajuData | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as SavedSajuData) : null;
  } catch {
    return null;
  }
}

export function saveSajuData(data: SavedSajuData): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(data));
}

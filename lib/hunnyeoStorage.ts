// ── 훈녀생정 로컬 저장 헬퍼 ───────────────────────────────────────────────
// 모든 상태(체크한 팁, 방명록, 닉네임, 방문 여부)는 브라우저 localStorage에만
// 저장된다. 백엔드 없이도 "나의 훈녀력"이 기기에 누적되도록 하기 위함.

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    if (typeof window === "undefined") return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage 사용 불가 환경(시크릿 모드 등)에서는 조용히 무시
  }
}

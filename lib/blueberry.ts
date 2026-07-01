const KEY = "sp_blueberries";

export function getBalance(): number {
  if (typeof window === "undefined") return 0;
  const raw = localStorage.getItem(KEY);
  const n = parseInt(raw ?? "0", 10);
  return isNaN(n) ? 0 : n;
}

export function addBalance(amount: number): number {
  const next = getBalance() + amount;
  localStorage.setItem(KEY, String(next));
  return next;
}

export function deductBalance(amount: number): boolean {
  const current = getBalance();
  if (current < amount) return false;
  localStorage.setItem(KEY, String(current - amount));
  return true;
}

export function setBalance(amount: number): void {
  localStorage.setItem(KEY, String(amount));
}

// 서버 잔액 조회 (로그인 시 서버 우선, 비로그인 시 로컬 폴백)
export async function getBalanceServer(): Promise<number> {
  try {
    const res = await fetch("/api/balance");
    if (!res.ok) return getBalance();
    const data = await res.json();
    return typeof data.balance === "number" ? data.balance : getBalance();
  } catch {
    return getBalance();
  }
}

// 서버에서 잔액 차감 (로그인 시 서버 검증, 비로그인 시 로컬 폴백)
export async function deductBalanceServer(amount: number): Promise<boolean> {
  try {
    const res = await fetch("/api/balance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deduct", amount }),
    });
    if (res.ok) return true;
    if (res.status === 401) return deductBalance(amount); // 비로그인 로컬 폴백
    return false;
  } catch {
    return deductBalance(amount);
  }
}

// 한국 시간(Asia/Seoul, UTC+9) 기준 "YYYY-MM-DD" 날짜 문자열
export function getKstDateString(): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  return kst.toISOString().slice(0, 10);
}

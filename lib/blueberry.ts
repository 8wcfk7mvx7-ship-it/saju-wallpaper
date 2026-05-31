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

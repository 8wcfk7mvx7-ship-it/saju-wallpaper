// ── 항목 고르기 / 찾기 ────────────────────────────────────────────────────
// 서버가 없으므로 "오늘의 생정"은 날짜를 씨앗 삼아 계산한다.
// 같은 날에는 누가 열어도 같은 항목이 나오고, 날이 바뀌면 자동으로 바뀐다.

import { TIPS } from "./hunnyeoData";
import type { HunnyeoTip } from "./hunnyeo/types";

/** YYYY-MM-DD (기기의 현지 시각 기준) */
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 문자열을 숫자 하나로 접는다 (FNV-1a 방식의 간단 버전) */
function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** 오늘 날짜에 해당하는 항목 하나. 날마다 바뀌고 하루 안에서는 고정된다. */
export function getTodayTip(dateKey: string = todayKey()): HunnyeoTip {
  return TIPS[hashString(dateKey) % TIPS.length];
}

/** 아무거나 하나. 이미 뽑힌 것과는 겹치지 않게 한 번 더 시도한다. */
export function getRandomTip(exceptId?: string): HunnyeoTip {
  const pick = () => TIPS[Math.floor(Math.random() * TIPS.length)];
  let tip = pick();
  if (exceptId && tip.id === exceptId && TIPS.length > 1) tip = pick();
  return tip;
}

/** 제목·태그·준비물·방법에서 찾는다. 공백으로 나눈 낱말을 모두 포함해야 한다. */
export function searchTips(query: string): HunnyeoTip[] {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  return TIPS.filter(tip => {
    const haystack = [
      tip.title,
      tip.effect,
      tip.caution ?? "",
      ...(tip.materials ?? []),
      ...tip.steps,
      ...tip.tags,
    ]
      .join(" ")
      .toLowerCase();
    return words.every(w => haystack.includes(w));
  });
}

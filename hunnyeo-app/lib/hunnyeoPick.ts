// ── 항목 고르기 / 찾기 ────────────────────────────────────────────────────
// 서버가 없으므로 "오늘의 생정"은 날짜를 씨앗 삼아 계산한다.
// 같은 날에는 누가 열어도 같은 항목이 나오고, 날이 바뀌면 자동으로 바뀐다.
//
// 전체 항목이 366개 이상이라, 한 해 안에서는 절대 겹치지 않도록
// "그 해의 순서"를 한 번 섞어 두고 1월 1일부터 순서대로 꺼내 쓴다.
// (연도를 씨앗에 넣기 때문에 해가 바뀌면 순서 자체도 새로 섞인다.)

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

/** 씨앗으로 0~1 사이 숫자를 반복해서 뽑아내는 간단한 난수 생성기 */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** 연도를 씨앗으로 항목 순서를 섞는다. 같은 해에는 항상 같은 순서가 나온다. */
function shuffledOrderForYear(year: number): HunnyeoTip[] {
  const rand = mulberry32(hashString(`hunnyeo-year-${year}`));
  const order = [...TIPS];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

const yearOrderCache = new Map<number, HunnyeoTip[]>();

function getYearOrder(year: number): HunnyeoTip[] {
  let order = yearOrderCache.get(year);
  if (!order) {
    order = shuffledOrderForYear(year);
    yearOrderCache.set(year, order);
  }
  return order;
}

/** 1월 1일을 1로 하는 날짜 순번 (윤년도 그대로 반영된다) */
function dayOfYear(d: Date): number {
  const start = new Date(d.getFullYear(), 0, 1);
  const diff = d.getTime() - start.getTime();
  return Math.floor(diff / 86400000) + 1;
}

/** 오늘 날짜에 해당하는 항목 하나. 날마다 바뀌고, 전체 항목 수가 366개 이상이라
 * 한 해 안에서는 같은 항목이 두 번 나오지 않는다. */
export function getTodayTip(dateKey: string = todayKey()): HunnyeoTip {
  const [yearStr] = dateKey.split("-");
  const year = Number(yearStr);
  const date = Number.isFinite(year) ? new Date(dateKey) : new Date();
  const order = getYearOrder(date.getFullYear());
  const index = (dayOfYear(date) - 1) % order.length;
  return order[index];
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

// lib/specialDays.ts — 24절기에 속하지 않는 "특별한 날" (초복·중복·말복 등)
// 절기는 태양 황경 기준이라 고정된 계산법(getCurrentSolarTerm)이 있지만,
// 복날은 일진(日辰)의 천간이 "경(庚)"인 날을 세는 전통 방식이라 별도로 계산한다.
// 초복 = 하지 후 3번째 경일, 중복 = 하지 후 4번째 경일, 말복 = 입추 후 1번째 경일.
import { Solar } from "lunar-typescript";

export type BokKey = "초복" | "중복" | "말복";

export interface SpecialDay {
  name: BokKey;
  meaning: string;
  ganwoonTips: string[];
  aegmagiTip: string;
}

const BOK_INFO: Record<BokKey, Omit<SpecialDay, "name">> = {
  초복: {
    meaning: "삼복 중 첫 번째 복날로, 본격적인 더위가 시작돼요. 몸의 기운을 보충하기 좋은 날이에요.",
    ganwoonTips: [
      "삼계탕, 육개장 같은 뜨거운 보양식으로 기운을 채워보세요.",
      "땀을 흘린 만큼 수분과 염분을 충분히 보충해보세요.",
    ],
    aegmagiTip: "예로부터 복날에 찬 음식·남은 음식·날음식을 먹으면 복이 달아난다고 여겼어요. 갓 지은 따뜻한 음식으로 몸도 마음도 데워보세요.",
  },
  중복: {
    meaning: "삼복 중 더위가 가장 심해지는 시기예요. 지친 몸을 한 번 더 보충할 때예요.",
    ganwoonTips: [
      "보양식으로 다시 한번 원기를 회복해보세요.",
      "낮잠이나 짧은 휴식으로 체력을 아껴보세요.",
    ],
    aegmagiTip: "중복에도 찬 음식·남은 음식·날음식은 피하는 게 좋아요. 복이 달아난다는 말처럼, 오늘만큼은 따뜻하고 신선한 음식을 챙겨보세요.",
  },
  말복: {
    meaning: "삼복의 마지막 날로, 더위가 한풀 꺾이기 시작하는 시점이에요.",
    ganwoonTips: [
      "마지막 더위를 보양식으로 잘 마무리해보세요.",
      "다가올 가을을 준비하며 몸 상태를 점검해보세요.",
    ],
    aegmagiTip: "마지막 복날까지는 찬 음식·남은 음식·날음식을 조심해서, 복이 달아나지 않게 마무리해보세요.",
  },
};

// from(포함)부터 하루씩 세어 천간이 "庚"인 날을 n번째로 찾는다
function findGyeongIl(from: Solar, n: number): Solar {
  let found = 0;
  const jd = from.getJulianDay();
  for (let i = 0; i < 60; i++) {
    const d = Solar.fromJulianDay(jd + i);
    if (d.getLunar().getDayGan() === "庚") {
      found++;
      if (found === n) return d;
    }
  }
  return from; // 이론상 도달하지 않음(60일 이내 항상 존재)
}

export function getBokDays(year: number): Record<"초복" | "중복" | "말복", Solar> {
  // 6월 1일 기준으로 그 해의 절기표를 가져오면 하지·입추가 모두 포함된다
  const table = Solar.fromYmd(year, 6, 1).getLunar().getJieQiTable();
  const haji = table["夏至"];
  const ipchu = table["立秋"];
  return {
    초복: findGyeongIl(haji, 3),
    중복: findGyeongIl(haji, 4),
    말복: findGyeongIl(ipchu, 1),
  };
}

export function getSpecialDay(date: Date = new Date()): SpecialDay | null {
  const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const bokDays = getBokDays(date.getFullYear());
  for (const key of Object.keys(bokDays) as BokKey[]) {
    if (bokDays[key].toYmd() === dateStr) {
      return { name: key, ...BOK_INFO[key] };
    }
  }
  return null;
}

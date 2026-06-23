// ── 자미두수(紫微斗數) 핵심 엔진 ──────────────────────────────────────────────
// 명궁·신궁·오행국 산출 및 자미성계·천부성계 14주성 배치, 12궁/대한 계산

export const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
export const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];
const YANG_STEMS = new Set(["갑", "병", "무", "경", "임"]);

// 60갑자 납음오행 (0~59, stem=i%10, branch=i%12)
const NAYIN: ("금" | "목" | "수" | "화" | "토")[] = [
  "금","금","화","화","목","목","토","토","금","금",
  "화","화","수","수","토","토","금","금","목","목",
  "수","수","토","토","화","화","목","목","수","수",
  "금","금","화","화","목","목","토","토","금","금",
  "화","화","수","수","토","토","금","금","목","목",
  "수","수","토","토","화","화","목","목","수","수",
];

const NAYIN_TO_BUREAU: Record<string, number> = { 수: 2, 목: 3, 금: 4, 토: 5, 화: 6 };

// 오호둔(五虎遁): 연간 → 정월(寅月) 천간
const YINMONTH_STEM: Record<string, string> = {
  갑: "병", 기: "병",
  을: "무", 경: "무",
  병: "경", 신: "경",
  정: "임", 임: "임",
  무: "갑", 계: "갑",
};

export interface ZiweiStarPlacement {
  branchIndex: number; // 0~11 (자~해)
  name: string;
}

export interface ZiweiPalace {
  branchIndex: number;
  branch: string;
  palaceName: string; // 명궁·형제·부처...
  stars: string[];
  luckyStars: string[]; // 보좌성(좌보·우필·문창·문곡·천괴·천월·록존)
  maleficStars: string[]; // 살성(경양·타라·지공·지겁)
  isLifePalace: boolean;
  isBodyPalace: boolean;
  daeha: { from: number; to: number };
}

export interface ZiweiResult {
  bureau: number; // 오행국 (2~6)
  bureauName: string;
  lifeBranchIndex: number;
  bodyBranchIndex: number;
  ziweiBranchIndex: number;
  tianfuBranchIndex: number;
  palaces: ZiweiPalace[];
  yearGanzhi: string;
  monthGanzhi: string;
  dayGanzhi: string;
  hourGanzhi: string;
}

const PALACE_NAMES = ["명궁", "형제", "부처", "자녀", "재백", "질액", "천이", "교우", "관록", "전택", "복덕", "부모"];

const BUREAU_NAMES: Record<number, string> = { 2: "수이국(水二局)", 3: "목삼국(木三局)", 4: "금사국(金四局)", 5: "토오국(土五局)", 6: "화육국(火六局)" };

function mod(n: number, m: number) {
  return ((n % m) + m) % m;
}

// 십간 록존(祿存) 위치 — 甲祿在寅 乙祿在卯 丙祿在巳 丁祿在午 戊祿在巳 己祿在午 庚祿在申 辛祿在酉 壬祿在亥 癸祿在子
const LUCUN_BRANCH: Record<string, number> = {
  갑: 2, 을: 3, 병: 5, 정: 6, 무: 5, 기: 6, 경: 8, 신: 9, 임: 11, 계: 0,
};

// 십간 천괴(天魁)·천월(天鉞) 위치 — 甲戊庚丑未, 乙己子申, 丙丁亥酉, 壬癸卯巳, 辛午寅
const GWAEWOL_BRANCH: Record<string, [number, number]> = {
  갑: [1, 7], 무: [1, 7], 경: [1, 7],
  을: [0, 8], 기: [0, 8],
  병: [11, 9], 정: [11, 9],
  임: [3, 5], 계: [3, 5],
  신: [6, 2],
};

// 보좌성·살성(보조성) 배치 — 좌보/우필(월), 문창/문곡(시), 천괴/천월·록존/경양/타라(연간), 지공/지겁(시)
function calcAuxStars(yearStem: string, lunarMonth: number, hourBranchIndex: number): Record<number, { lucky: string[]; malefic: string[] }> {
  const result: Record<number, { lucky: string[]; malefic: string[] }> = {};
  const add = (idx: number, kind: "lucky" | "malefic", name: string) => {
    if (!result[idx]) result[idx] = { lucky: [], malefic: [] };
    result[idx][kind].push(name);
  };

  // 좌보(左輔): 辰에서 정월 起 순행, 우필(右弼): 戌에서 정월 起 역행
  add(mod(4 + (lunarMonth - 1), 12), "lucky", "좌보");
  add(mod(10 - (lunarMonth - 1), 12), "lucky", "우필");

  // 문곡(文曲): 辰에서 子時 起 순행, 문창(文昌): 戌에서 子時 起 역행
  add(mod(4 + hourBranchIndex, 12), "lucky", "문곡");
  add(mod(10 - hourBranchIndex, 12), "lucky", "문창");

  // 천괴/천월
  const gw = GWAEWOL_BRANCH[yearStem];
  if (gw) {
    add(gw[0], "lucky", "천괴");
    add(gw[1], "lucky", "천월");
  }

  // 록존 + 경양(록존+1)/타라(록존-1)
  const lucun = LUCUN_BRANCH[yearStem];
  if (lucun !== undefined) {
    add(lucun, "lucky", "록존");
    add(mod(lucun + 1, 12), "malefic", "경양");
    add(mod(lucun - 1, 12), "malefic", "타라");
  }

  // 지겁(地劫): 亥에서 子時 起 순행, 지공(地空): 亥에서 子時 起 역행
  add(mod(11 + hourBranchIndex, 12), "malefic", "지겁");
  add(mod(11 - hourBranchIndex, 12), "malefic", "지공");

  return result;
}

// 자미성 위치 산출 (오행국 B, 음력일 day 기준)
function getZiweiIndex(bureau: number, day: number): number {
  const r0 = day % bureau;
  const q = r0 === 0 ? day / bureau : Math.floor(day / bureau) + 1;
  const r = r0 === 0 ? 0 : bureau - r0;
  const p0 = mod(1 + q, 12); // 寅(2) + (q-1)
  if (r === 0) return p0;
  return r % 2 === 0 ? mod(p0 + r, 12) : mod(p0 - r, 12);
}

export interface ZiweiInput {
  lunarYear: number;
  lunarMonth: number;
  lunarDay: number;
  hourBranchIndex: number; // 0~11 (자시=0)
  gender: "male" | "female";
  yearGanjaText: string; // "경신년" 형식
  monthGanjaText: string;
  dayGanjaText: string;
}

export function calcZiwei(input: ZiweiInput): ZiweiResult {
  const { lunarMonth, lunarDay, hourBranchIndex, gender } = input;

  // 1. 명궁/신궁 지지
  const p = mod(2 + (lunarMonth - 1), 12); // 寅 + (월-1)
  const lifeBranchIndex = mod(p - hourBranchIndex, 12);
  const bodyBranchIndex = mod(p + hourBranchIndex, 12);

  // 2. 명궁 천간 → 납음오행 → 오행국
  const yearStem = input.yearGanjaText[0];
  const yinStem = YINMONTH_STEM[yearStem];
  const yinStemIdx = STEMS.indexOf(yinStem);
  const lifeStemIdx = mod(yinStemIdx + mod(lifeBranchIndex - 2, 12), 10);
  const ganzaIdx60 = [...Array(60).keys()].find(i => i % 10 === lifeStemIdx && i % 12 === lifeBranchIndex)!;
  const nayin = NAYIN[ganzaIdx60];
  const bureau = NAYIN_TO_BUREAU[nayin];

  // 3. 자미·천부 위치
  const ziweiBranchIndex = getZiweiIndex(bureau, lunarDay);
  const tianfuBranchIndex = mod(4 - ziweiBranchIndex, 12);

  // 4. 14주성 배치
  const Z = ziweiBranchIndex, F = tianfuBranchIndex;
  const starMap: Record<number, string[]> = {};
  const place = (idx: number, name: string) => {
    starMap[idx] = starMap[idx] || [];
    starMap[idx].push(name);
  };
  place(Z, "자미");
  place(mod(Z - 1, 12), "천기");
  place(mod(Z - 3, 12), "태양");
  place(mod(Z - 4, 12), "무곡");
  place(mod(Z - 5, 12), "천동");
  place(mod(Z + 4, 12), "염정");
  place(F, "천부");
  place(mod(F + 1, 12), "태음");
  place(mod(F + 2, 12), "탐랑");
  place(mod(F + 3, 12), "거문");
  place(mod(F + 4, 12), "천상");
  place(mod(F + 5, 12), "천량");
  place(mod(F + 6, 12), "칠살");
  place(mod(F + 10, 12), "파군");

  // 5. 대한 방향: 양남음녀 順行(증가), 음남양녀 逆行(감소)
  const isYangYear = YANG_STEMS.has(yearStem);
  const forward = (isYangYear && gender === "male") || (!isYangYear && gender === "female");

  // 6. 보좌성·살성 배치
  const auxMap = calcAuxStars(yearStem, lunarMonth, hourBranchIndex);

  const palaces: ZiweiPalace[] = BRANCHES.map((branch, branchIndex) => {
    // 궁명: 명궁에서 逆行(감소 방향)으로 명궁,형제,부처...순으로 배치
    const palaceOffset = mod(lifeBranchIndex - branchIndex, 12);
    const palaceName = PALACE_NAMES[palaceOffset];

    // 대한: 명궁부터 양남음녀 順行/음남양녀 逆行 방향으로 각 궁에 bureau년씩 배정
    const daehaStep = forward ? mod(branchIndex - lifeBranchIndex, 12) : mod(lifeBranchIndex - branchIndex, 12);
    const daeha = { from: bureau + daehaStep * bureau, to: bureau + daehaStep * bureau + bureau - 1 };

    return {
      branchIndex,
      branch,
      palaceName,
      stars: starMap[branchIndex] || [],
      luckyStars: auxMap[branchIndex]?.lucky || [],
      maleficStars: auxMap[branchIndex]?.malefic || [],
      isLifePalace: branchIndex === lifeBranchIndex,
      isBodyPalace: branchIndex === bodyBranchIndex,
      daeha,
    };
  });

  return {
    bureau,
    bureauName: BUREAU_NAMES[bureau],
    lifeBranchIndex,
    bodyBranchIndex,
    ziweiBranchIndex,
    tianfuBranchIndex,
    palaces,
    yearGanzhi: input.yearGanjaText,
    monthGanzhi: input.monthGanjaText,
    dayGanzhi: input.dayGanjaText,
    hourGanzhi: `${BRANCHES[hourBranchIndex]}시`,
  };
}

// 시각(0~23) → 12지지 시 인덱스 (자시 = 23:00~00:59)
export function getHourBranchIndex(hour: number): number {
  const h = ((hour + 1) % 24);
  return Math.floor(h / 2);
}

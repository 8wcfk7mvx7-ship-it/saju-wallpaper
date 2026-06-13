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

// lib/saju.ts
// 받침 유무에 따라 "을"/"를" 조사를 고른다.
export function objectParticle(word: string): string {
  const ch = word.trim().slice(-1);
  const code = ch.charCodeAt(0) - 0xac00;
  if (code < 0 || code > 11171) return "를";
  return code % 28 === 0 ? "를" : "을";
}

export type Element = "목" | "화" | "토" | "금" | "수";
export type WallpaperStyle = "watercolor" | "pixel" | "illustration" | "game" | "cartoon" | "auto";

export interface ElementScore {
  목: number; 화: number; 토: number; 금: number; 수: number;
}

export interface SajuInput {
  birthYear: number; birthMonth: number; birthDay: number;
  birthHour: number | null; birthMinute: number | null;
  name: string; gender: "male" | "female";
  birthPlace: string; style: WallpaperStyle;
  productType: "mobile" | "report" | "bundle";
  useJajasi: boolean;
}

export interface WallpaperTheme {
  primaryColors: string[]; accentColors: string[];
  pattern: "flowing" | "geometric" | "organic" | "crystalline" | "misty";
  mood: string; description: string;
}

export interface PillarDetail {
  cg: string; jj: string;
  sipseongCg: string; sipseongJj: string;
  uunseong: string; sinsal: string; jijangan: string;
}

export interface SinsalItem {
  name: string;
  hanja: string;
  pillars: string[];   // ['연','월','일','시'] 중 해당하는 것
  desc: string;
  category: 'lucky' | 'unlucky' | 'neutral';
}

// 신강/신약 8단계 세분류 (지수 0~100 기준)
export const SIN_STRENGTH_LEVELS = ["극약", "태약", "신약", "중화신약", "중화신강", "신강", "태강", "극왕"] as const;
export type SinStrengthLevel = typeof SIN_STRENGTH_LEVELS[number];

// 각 단계의 상한선(%) — 마지막 극왕은 상한 없음
const SIN_STRENGTH_THRESHOLDS = [12, 22, 35, 47.5, 60, 72, 85];

export function classifySinStrength(percent: number): SinStrengthLevel {
  for (let i = 0; i < SIN_STRENGTH_THRESHOLDS.length; i++) {
    if (percent < SIN_STRENGTH_THRESHOLDS[i]) return SIN_STRENGTH_LEVELS[i];
  }
  return SIN_STRENGTH_LEVELS[SIN_STRENGTH_LEVELS.length - 1];
}

export interface YongsinResult {
  strength: "신강" | "신약" | "중화";
  percent: number; // 신강/신약 지수 (0~100, 50이 정중앙)
  yongshin: Element;   // 용신 — 사주 균형의 핵심 오행
  heeshin: Element;    // 희신 — 용신을 생해주는 오행
  gishin: Element;     // 기신 — 용신을 극하는 오행
  desc: string;
}

export interface JijiRelation {
  a: number; // 기둥 인덱스
  b: number;
  jjA: string;
  jjB: string;
  type: "육합" | "삼합" | "반합" | "충" | "형" | "파" | "해" | "원진";
}

// 지지 관계 색상 — 합(조화)은 초록/청록 계열, 충은 빨강, 형·파·해·원진은 주황/보라 계열로 통일
export const REL_TYPE_COLOR: Record<string, string> = {
  육합: "#34d399",
  삼합: "#34d399",
  반합: "#6ee7b7",
  충: "#f87171",
  형: "#fb923c",
  파: "#fbbf24",
  해: "#f59e0b",
  원진: "#c084fc",
};

// 세력 강도 순서: 강한 것부터 약한 것 순 (삼합 > 육합/반합 > 충 > 형 > 파 > 해 > 원진)
export const REL_STRENGTH_ORDER: Record<JijiRelation["type"], number> = {
  삼합: 0,
  육합: 1,
  반합: 1,
  충: 2,
  형: 3,
  파: 4,
  해: 5,
  원진: 6,
};

// 같은 관계 유형 내에서도 왕지(자오묘유) > 생지(인신사해) > 고지(진술축미) 순으로 강하다.
const JIJI_TIER: Record<string, number> = {
  자: 0, 오: 0, 묘: 0, 유: 0,
  인: 1, 신: 1, 사: 1, 해: 1,
  진: 2, 술: 2, 축: 2, 미: 2,
};

export function sortJijiRelationsByStrength(relations: JijiRelation[]): JijiRelation[] {
  return [...relations].sort((a, b) => {
    const typeDiff = REL_STRENGTH_ORDER[a.type] - REL_STRENGTH_ORDER[b.type];
    if (typeDiff !== 0) return typeDiff;
    const tierA = Math.min(JIJI_TIER[a.jjA] ?? 1, JIJI_TIER[a.jjB] ?? 1);
    const tierB = Math.min(JIJI_TIER[b.jjA] ?? 1, JIJI_TIER[b.jjB] ?? 1);
    return tierA - tierB;
  });
}

// 4기둥(년/월/일/시)의 지지 배열을 받아 둘씩 짝지어 육합·삼합/반합·충·형·파·해·원진 관계를 찾아낸다.
export function getJijiRelations(jjs: string[]): JijiRelation[] {
  const YUKHAP: [string, string][] = [["자","축"],["인","해"],["묘","술"],["진","유"],["사","신"],["오","미"]];
  const CHUNG: [string, string][] = [["자","오"],["축","미"],["인","신"],["묘","유"],["진","술"],["사","해"]];
  const PA: [string, string][] = [["자","유"],["오","묘"],["인","해"],["사","신"],["진","축"],["술","미"]];
  const HAE: [string, string][] = [["자","미"],["축","오"],["인","사"],["묘","진"],["신","해"],["유","술"]];
  const HYEONG: [string, string][] = [["자","묘"],["인","사"],["사","신"],["신","인"],["축","술"],["술","미"],["미","축"]];
  // 삼합 그룹 — 세 지지가 모두 있어야 "삼합", 둘만 있으면 "반합"
  const SAMHAP_GROUPS: string[][] = [["인","오","술"],["사","유","축"],["신","자","진"],["해","묘","미"]];

  const matches = (pairs: [string, string][], x: string, y: string) =>
    pairs.some(([p, q]) => (p === x && q === y) || (p === y && q === x));

  // 자형살(自刑殺) — 같은 지지가 나란히 중복될 때 성립하는 4가지(진진·오오·유유·해해)만 형(刑)으로 인정.
  // 그 외 같은 지지 중복(자자·축축·인인 등)은 병존(竝存)이며 합충형파해 관계가 아니므로 여기서 제외한다.
  const JAHYEONG_JJS = ["진","오","유","해"];

  const relations: JijiRelation[] = [];
  for (let i = 0; i < jjs.length; i++) {
    for (let j = i + 1; j < jjs.length; j++) {
      const a = jjs[i], b = jjs[j];
      if (!a || !b) continue;

      if (a === b) {
        if (JAHYEONG_JJS.includes(a)) relations.push({ a: i, b: j, jjA: a, jjB: b, type: "형" });
        continue;
      }

      if (matches(YUKHAP, a, b)) relations.push({ a: i, b: j, jjA: a, jjB: b, type: "육합" });

      // 삼합/반합 판정: a, b가 같은 삼합 그룹에 속한 서로 다른 두 글자인지 확인
      const group = SAMHAP_GROUPS.find(g => g.includes(a) && g.includes(b));
      if (group) {
        const allPresent = group.every(jj => jjs.includes(jj));
        relations.push({ a: i, b: j, jjA: a, jjB: b, type: allPresent ? "삼합" : "반합" });
      }

      if (matches(CHUNG, a, b)) relations.push({ a: i, b: j, jjA: a, jjB: b, type: "충" });
      if (matches(HYEONG, a, b)) relations.push({ a: i, b: j, jjA: a, jjB: b, type: "형" });
      if (matches(PA, a, b)) relations.push({ a: i, b: j, jjA: a, jjB: b, type: "파" });
      if (matches(HAE, a, b)) relations.push({ a: i, b: j, jjA: a, jjB: b, type: "해" });
      if (matches(WONJIN_PAIRS, a, b)) relations.push({ a: i, b: j, jjA: a, jjB: b, type: "원진" });
    }
  }
  return relations;
}

// 두 지지를 관습적으로 통용되는 표기 순서(예: 진유합, 자오충)로 정렬해 "진유합"처럼 합쳐 보여줄 때 쓴다.
// 위치(기둥) 기반의 jjA/jjB 순서와는 별개로, 이름을 부를 때만 canonical 순서를 따른다.
const YUKHAP_CANON: [string, string][] = [["자","축"],["인","해"],["묘","술"],["진","유"],["사","신"],["오","미"]];
const CHUNG_CANON: [string, string][] = [["자","오"],["축","미"],["인","신"],["묘","유"],["진","술"],["사","해"]];
const PA_CANON: [string, string][] = [["자","유"],["오","묘"],["인","해"],["사","신"],["진","축"],["술","미"]];
const HAE_CANON: [string, string][] = [["자","미"],["축","오"],["인","사"],["묘","진"],["신","해"],["유","술"]];
const HYEONG_CANON: [string, string][] = [["자","묘"],["인","사"],["사","신"],["신","인"],["축","술"],["술","미"],["미","축"]];
const SAMHAP_GROUPS_CANON: string[][] = [["인","오","술"],["사","유","축"],["신","자","진"],["해","묘","미"]];

export function canonicalJijiPairOrder(jjA: string, jjB: string, type: JijiRelation["type"]): [string, string] {
  const pairsByType: Record<string, [string, string][]> = {
    육합: YUKHAP_CANON, 충: CHUNG_CANON, 파: PA_CANON, 해: HAE_CANON, 형: HYEONG_CANON,
  };
  const pairs = pairsByType[type];
  if (pairs) {
    const found = pairs.find(([p, q]) => (p === jjA && q === jjB) || (p === jjB && q === jjA));
    if (found) return found;
  }
  if (type === "삼합" || type === "반합") {
    const group = SAMHAP_GROUPS_CANON.find(g => g.includes(jjA) && g.includes(jjB));
    if (group) return group.indexOf(jjA) < group.indexOf(jjB) ? [jjA, jjB] : [jjB, jjA];
  }
  return [jjA, jjB];
}


export interface SajuResult {
  scores: ElementScore; rawScores: ElementScore;
  dominant: Element[]; lacking: Element[];
  personality: string; wallpaperTheme: WallpaperTheme;
  fourPillars: string; localTimeNote: string;
  pillarsDetail: {
    year: PillarDetail; month: PillarDetail; day: PillarDetail; hour?: PillarDetail;
  };
  sinsalList: SinsalItem[];
  yongshin: YongsinResult;
}

// 신살 목록을 화면에 나열할 때 쓰는 필터 — 도화살은 가도화/편야도화/진도화/나체도화/곤랑도화/녹방도화의
// 상위 기본 카테고리일 뿐이라 항상 숨기고, 더 구체적인 도화 세부 유형이 함께 있으면
// 약한 신호인 가도화도 중복으로 보이지 않게 같이 숨긴다. (점수 계산 등 내부 로직에는 영향 없음)
const SPECIFIC_DOHWA_NAMES = new Set(["진도화", "나체도화", "곤랑도화", "녹방도화", "편야도화"]);
export function getDisplaySinsalList(sinsalList: SinsalItem[]): SinsalItem[] {
  const hasSpecificDohwa = sinsalList.some(s => SPECIFIC_DOHWA_NAMES.has(s.name));
  return sinsalList.filter(s =>
    s.name !== "도화살" && !(s.name === "가도화" && hasSpecificDohwa)
  );
}

const CHEONGAN = ["갑","을","병","정","무","기","경","신","임","계"];
const JIJI = ["자","축","인","묘","진","사","오","미","신","유","술","해"];

export const CHEONGAN_ELEMENT: Record<string, Element> = {
  갑:"목", 을:"목", 병:"화", 정:"화", 무:"토",
  기:"토", 경:"금", 신:"금", 임:"수", 계:"수",
};

// 지장간 가중치: 정기(본기)=0.76, 중기=0.16, 여기(초기)=0.08
// 정기가 핵심이고, 중기·여기는 보조 역할만 함 (기존 0.6/0.2/0.2 → 과도한 중기 보정 방지)
const JIJANGAN: Record<string, Array<{element: Element; weight: number}>> = {
  자:[{element:"수",weight:1.0}],
  축:[{element:"토",weight:0.76},{element:"수",weight:0.16},{element:"금",weight:0.08}],
  인:[{element:"목",weight:0.76},{element:"화",weight:0.16},{element:"토",weight:0.08}],
  묘:[{element:"목",weight:1.0}],
  진:[{element:"토",weight:0.76},{element:"목",weight:0.16},{element:"수",weight:0.08}],
  // 사(巳): 병화(정기0.76) > 경금(중기0.16) > 무토(여기0.08)
  // 경금 중기를 기존 0.20→0.16으로 줄여 월지에서 금기운 과도 상승 방지
  사:[{element:"화",weight:0.76},{element:"금",weight:0.16},{element:"토",weight:0.08}],
  오:[{element:"화",weight:0.82},{element:"토",weight:0.18}],
  미:[{element:"토",weight:0.76},{element:"화",weight:0.16},{element:"목",weight:0.08}],
  신:[{element:"금",weight:0.76},{element:"수",weight:0.16},{element:"토",weight:0.08}],
  유:[{element:"금",weight:1.0}],
  술:[{element:"토",weight:0.76},{element:"금",weight:0.16},{element:"화",weight:0.08}],
  해:[{element:"수",weight:0.82},{element:"목",weight:0.18}],
};

// 궁성(宮星) 가중치: 전통 점수론 기준 (월지 30점 최강, 연지·일지·시지 각 10-15점)
// 월:1.8 / 일:1.1 / 연:0.9 / 시:0.9 — 시주와 연주를 동등하게
const PILLAR_WEIGHTS = {year: 0.9, month: 1.8, day: 1.1, hour: 0.9};

// 지지 본기(정기)
export const JIJI_BONGI: Record<string, string> = {
  자:"계", 축:"기", 인:"갑", 묘:"을", 진:"무", 사:"병",
  오:"정", 미:"기", 신:"경", 유:"신", 술:"무", 해:"임",
};

// 오행 스타일 (만세력 명식표 컬러 적용법 — 목=초록, 화=빨강, 토=주황/노랑, 금=흰/회색, 수=파랑)
export const EL_STYLE: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  목: { bg: "rgba(34,197,94,0.10)",  text: "#4ade80", border: "rgba(34,197,94,0.25)",  badge: "rgba(34,197,94,0.15)" },
  화: { bg: "rgba(239,68,68,0.10)",  text: "#f87171", border: "rgba(239,68,68,0.25)",  badge: "rgba(239,68,68,0.15)" },
  토: { bg: "rgba(245,158,11,0.10)", text: "#fbbf24", border: "rgba(245,158,11,0.25)", badge: "rgba(245,158,11,0.15)" },
  금: { bg: "rgba(209,213,219,0.10)",text: "#d1d5db", border: "rgba(209,213,219,0.25)",badge: "rgba(209,213,219,0.15)" },
  수: { bg: "rgba(59,130,246,0.10)", text: "#60a5fa", border: "rgba(59,130,246,0.25)",  badge: "rgba(59,130,246,0.15)" },
};

export function jijiElement(jj: string): Element {
  return (CHEONGAN_ELEMENT[JIJI_BONGI[jj] || ""] || "토") as Element;
}

// 지장간 표시 문자열 (여기-중기-본기 순서)
const JIJANGAN_STR: Record<string, string> = {
  자:"임계", 축:"계신기", 인:"무병갑", 묘:"갑을",
  진:"을계무", 사:"무경병", 오:"병기정", 미:"정을기",
  신:"무임경", 유:"경신", 술:"신정무", 해:"무갑임",
};

// 12운성
const UUNSEONG_NAMES = ["장생","목욕","관대","건록","제왕","쇠","병","사","묘","절","태","양"];
const JANGSEAENG_DATA: Record<string, {start: number; forward: boolean}> = {
  갑:{start:11,forward:true}, 을:{start:6,forward:false},
  병:{start:2,forward:true},  정:{start:9,forward:false},
  무:{start:2,forward:true},  기:{start:9,forward:false},
  경:{start:5,forward:true},  신:{start:0,forward:false},
  임:{start:8,forward:true},  계:{start:3,forward:false},
};

// 12신살 (역마살부터 순행)
const SINSAL_NAMES = ["역마살","화개살","겁살","재살","천살","지살","망신살","년살","월살","장성살","반안살","육해살"];

// 신살 메타 정보
const SINSAL_INFO: Record<string, {hanja:string; category:'lucky'|'unlucky'|'neutral'; desc:string}> = {
  // 12신살
  역마살:   {hanja:"驛馬殺", category:"neutral",  desc:"이동·변화·해외 인연이 강해요. 다만 내가 원해서가 아니라 상황에 떠밀려 움직이게 되는 '타의에 의한 이동'의 기운이라, 한곳에 정착하기 어려워요"},
  도화살:   {hanja:"桃花殺", category:"neutral",  desc:"이성에게 매력적이며 인기가 많아요. 풍류 기질이 있답니다"},
  장성살:   {hanja:"將星殺", category:"lucky",    desc:"12신살 중 가장 강한 기운으로, 군대를 지휘하는 장수처럼 강한 통솔력과 카리스마를 타고났어요. 지는 것을 싫어하고 자존심이 강해 어떤 자리에서든 주도권을 잡으려 하며, 리더 역할을 맡았을 때 가장 빛을 발해요. 다만 남의 밑에서 지시받는 위치는 답답하게 느껴질 수 있어요"},
  화개살:   {hanja:"華蓋殺", category:"neutral",  desc:"고독함이 있으나 예술·종교·철학에 뛰어난 재능이 있어요"},
  반안살:   {hanja:"攀鞍殺", category:"lucky",    desc:"12신살 중 가장 길한 기운으로 꼽혀요. 번영살이라고도 불릴 만큼 지위 상승과 재물이 자연스럽게 따라오는데, 겸손한 태도를 유지할 때 그 복이 온전히 들어와요. 거만하거나 자만하는 순간 오히려 위태로워질 수 있어 처신에 신경 쓰는 게 중요해요. 외모나 이미지 관리, 좋은 물건을 갖추는 데에도 관심이 많은 편이에요"},
  겁살:     {hanja:"劫殺",   category:"unlucky",  desc:"12신살 중 가장 강하게 '빼앗기는' 기운이에요. 내 잘못이 아닌데도 휘말리는 사고·다툼·손실처럼, 준비할 틈도 없이 무언가를 잃는 패턴이 반복되기 쉬워요. 들인 노력에 비해 결과가 더디게 따라오는 편이라 조급해하기보다 공부나 문서 작업처럼 차분히 쌓아가는 활동이 잘 맞아요. 위기 속에서 순식간에 판단하고 처신하는 임기응변 능력도 함께 따라오고, 자녀운은 오히려 좋은 편이에요. 큰돈이나 귀중품 관리에 평소보다 신경 쓰는 게 좋아요"},
  재살:     {hanja:"災殺",   category:"unlucky",  desc:"수옥살(囚獄殺)이라고도 불러요. 사고·관재·구설·송사처럼 외부에서 갑자기 닥치는 재난성 사건을 조심해야 하고, 법적 분쟁이나 시비에 휘말리지 않도록 계약·서류 관계를 꼼꼼히 따져보는 습관이 필요해요. 동시에 생존 본능과 임기응변이 매우 발달한 기운이라 위기 대처 능력이 뛰어나고 머리도 비상한 편이에요. 정면승부보다는 측면에서 전략을 짜거나 기습적으로 접근하는 방식을 선호하고, 일을 벌이고 구상하는 데는 강하지만 마무리까지 끌고 가는 힘은 상대적으로 약한 편이에요. 사고방식이 열려 있어 새로운 환경에 잘 적응하고, 특히 역마살과 함께 있으면 해외에서 기회를 잡는 쪽으로 강하게 발현돼요. 이해득실에 민감하게 반응하다 보니 주변에서 오해를 사거나 미움을 받을 수 있어 처신에 신경 쓰는 게 좋아요"},
  천살:     {hanja:"天殺",   category:"unlucky",  desc:"하늘에서 내려오는 살기로, 인간의 노력으로 막기 어려운 갑작스러운 사건·자연재해·건강 이슈와 연관이 깊어요. 큰 불행보다는 사소한 불운이 반복되는 쪽에 가까운데, 그 반복이 누적되면서 의기소침해지거나 정신적으로 위축되기 쉬워요. 형식과 체면·허례의식에 유난히 신경 쓰는 경향도 있어요. 윗사람·부모·상사와의 갈등, 관재구설이 생기기 쉬우니 권위자와의 관계에서 한발 양보하는 태도가 도움이 되고, 동시에 종교·철학적 깨달음과도 인연이 깊은 기운이에요"},
  지살:     {hanja:"地殺",   category:"neutral",  desc:"역마살처럼 이동·변화를 뜻하지만 성격이 달라요. 역마가 타의에 의해 떠밀리듯 움직이는 기운이라면, 지살은 내가 원해서 스스로 결정하고 움직이는 기운이에요. 주도권이 본인에게 있다 보니 역마살처럼 갑작스러운 사고나 변수에 휘둘리는 일은 적고 비교적 안정적으로 움직임을 통제할 수 있어요. 그러면서도 활동 범위는 넓어서 타지·외지에서 새 일을 벌이거나 성과를 내는 경우가 많고, 한곳에 머무르기보다 스스로 새로운 영역을 개척하려는 욕구가 꾸준히 따라와요"},
  년살:     {hanja:"年殺",   category:"unlucky",  desc:"함지살(咸池殺)·도화살의 흉한 측면이라고도 불려요. 이성에게 인기는 많지만 그만큼 주색·풍류·사치로 재물이 줄줄 새기 쉬운 기운이에요. 겉멋과 허영에 흔들리지 않도록 소비 습관을 점검하는 게 중요하고, 한 사람에게 깊이 정착하기보다 여러 인연 사이에서 갈등할 가능성도 있어요"},
  월살:     {hanja:"月殺",   category:"unlucky",  desc:"고초살(枯焦殺)이라고도 해요. 마른 가지처럼 메마르고 정체된 기운이라, 무언가를 시작해도 결실로 이어지기까지 유난히 시간이 오래 걸리고 인덕이 부족하게 느껴질 수 있어요. 특히 임신·출산·새 프로젝트의 초기 단계에서 막힘이 생기기 쉬우니 서두르지 말고 꾸준히 버티는 인내심이 관건이에요"},
  망신살:   {hanja:"亡身殺", category:"unlucky",  desc:"이름 그대로 '몸(명예)을 잃는다'는 뜻으로, 구설수·스캔들·체면 손상과 관련된 사건이 생기기 쉬워요. 동시에 어디를 가든 존재감이 강하게 드러나는 기운이기도 해서, 조용히 있어도 시선을 끌고 사람들 앞에 자주 호명되거나 지목되는 일이 잦아요. 본인에 대한 말이나 평가가 주변에 잘 퍼지는 편이라 말과 행동의 파급력이 큰 편이고, 그만큼 믿었던 사람에게 뒤통수를 맞거나 실수가 두드러지게 드러나는 패턴을 조심해야 해요. 다만 그만큼 위기 속에서 강한 회복력과 반전의 드라마를 만들어내는 힘도 함께 있고, 주목과 관심이 필요한 분야에서는 이 기운이 오히려 강점으로 작용해요"},
  육해살:   {hanja:"六害殺", category:"unlucky",  desc:"몸과 마음 양쪽에서 은근한 방해와 장애가 따르는 기운이에요. 합(조화)을 이루는 힘이 약해서 가까운 사람과 화합이 깨지기 쉽고, 사소한 일에도 예민하고 짜증이 늘어나는 경향이 있어요. 시간 약속이나 일정 관리에는 유난히 철저한 편이고, 두뇌 회전이 빠르고 비상한 머리를 가진 경우가 많아요. 건강 면에서는 큰 사건보다 만성적이고 잘 낫지 않는 자잘한 질환에 시달리기 쉽고, 운의 흐름이 극단적으로 오르내리는 편이라 평소 컨디션 관리와 인간관계의 거리 조절이 중요해요"},
  // 귀인(吉神)
  천을귀인: {hanja:"天乙貴人",category:"lucky",   desc:"12신살·귀인을 통틀어 최고의 길신으로 꼽혀요. 어려운 상황에 처할 때마다 결정적인 도움을 주는 사람이 나타나고, 큰 위기에서도 구사일생으로 빠져나가는 흐름이 반복돼요. 금전적으로도 완전히 끊기지 않고 어떻게든 풀리는 경우가 많아 전생의 공덕이 있다고도 해석해요. 다만 그 복이 본인에게 집중되는 동안 가까운 가족은 상대적으로 마음고생을 하는 경우도 있어요. 사주 전체의 오행 균형이 잘 맞을 때 이 기운이 더 강하게 작용해요"},
  천덕귀인: {hanja:"天德貴人",category:"lucky",   desc:"하늘의 덕으로 재액이 줄어들고 귀인의 도움이 따르는 기운이에요. 스스로에게 귀한 가치를 부여할 줄 알게 되면서 자존감이 자연스럽게 올라가고, 어려운 시기에도 자신감을 잃지 않는 단단함을 갖게 돼요. 사주 원국에 없어도 대운이나 세운에서 들어오는 시기에 그 영향을 받을 수 있어요"},
  월덕귀인: {hanja:"月德貴人",category:"lucky",   desc:"천을귀인·천덕귀인과 함께 3대 귀인으로 불리는 길신이에요. 여성에게 특히 강하게 작용하는 기운으로, 차분하고 부드러운 매력에 용기와 담대함이 더해져 안과 밖의 균형을 갖추게 해줘요. 어려운 상황에서도 의지를 잃지 않고 스스로 길을 밝혀나가는 힘이 있는 기운이에요"},
  태극귀인: {hanja:"太極貴人",category:"lucky",   desc:"자수성가형 길신이에요. 처음부터 큰 도움을 받기보다는 본인이 시작한 일을 끝까지 밀고 나갈 때 결과가 크게 따라오는 기운으로, 특히 말년으로 갈수록 결실이 좋아지는 편이에요. 다만 노력한 것에 비해 결과가 두드러지게 좋다 보니 주변의 시기나 질투를 받기 쉬워서, 가까운 사람의 배신이나 뒷말을 조심하는 게 중요해요"},
  천주귀인: {hanja:"天廚貴人",category:"lucky",   desc:"식복(食福)이 풍부하고 의식주가 넉넉해요"},
  문곡귀인: {hanja:"文曲貴人",category:"lucky",   desc:"학문·문서·예술 분야에서 탁월한 재능이 있어요"},
  금여성:   {hanja:"金輿星", category:"lucky",    desc:"안락하고 귀인의 보살핌을 받아요. 여성에게 특히 길해요"},
  암록:     {hanja:"暗祿",   category:"lucky",    desc:"숨겨진 복록. 뜻밖의 도움이나 재물이 생겨요"},
  // 중성
  진도화:   {hanja:"眞桃花", category:"neutral",  desc:"일지 기준 진짜 도화. 이성 매력과 인기가 매우 강해요"},
  가도화:   {hanja:"假桃花", category:"neutral",  desc:"도화 기운이 한두 자리에만 약하게 자리해, 화려함보다는 잔잔하게 스며드는 매력이에요"},
  편야도화: {hanja:"遍野桃花", category:"neutral", desc:"도화 기운이 사주 전체에 두루 퍼져 있어 어디서든 시선을 끄는 강한 매력이에요. 다만 관계가 산만해지거나 구설에 오르기 쉬우니 한 사람에게 집중하는 연습이 필요해요"},
  귀문관살: {hanja:"鬼門關殺",category:"neutral", desc:"영적 감수성이 예민하고 신경이 날카로워요. 예술·철학에 소질이 있어요"},
  // 흉신(凶神)
  홍염살:   {hanja:"紅艶殺", category:"unlucky",  desc:"이성 관계가 복잡해지기 쉽고 색정 구설이 있어요"},
  양인살:   {hanja:"羊刃殺", category:"unlucky",  desc:"강한 추진력이 있으나 충동적이고 사고·부상을 주의해야 해요"},
  백호살:   {hanja:"白虎殺", category:"unlucky",  desc:"성격이 급하고 행동력이 빨라요. 결정과 추진이 거침없는 만큼 수술·사고·혈액 관련 건강 이슈, 그리고 일을 서두르다 생기는 실수를 주의해야 해요"},
  원진살:   {hanja:"怨嗔殺", category:"unlucky",  desc:"배우자·가까운 사람과 원망·갈등이 반복되기 쉬워요"},
  과숙살:   {hanja:"寡宿殺", category:"unlucky",  desc:"연애·결혼 시기가 늦거나 독신 경향이 강해요. 영적 감수성이 뛰어나고 집중력이 강해요. 여성에게 강하게 작용해요"},
  평두살:   {hanja:"平頭殺", category:"unlucky",  desc:"리더 기질과 강한 고집을 타고났어요. 남 밑에서 통제받는 것을 체질적으로 거부하며, 주도권을 잡아야 에너지가 살아나요. 융통성을 의도적으로 기르지 않으면 독불장군이 되기 쉬워요"},
  나체도화: {hanja:"裸體桃花", category:"neutral",  desc:"매력이 직관적으로 드러나 숨길 수 없어요. 어디서든 시선을 끌고 이성이 자연스럽게 모이는 기운이에요. 그만큼 구설수·치정·스캔들에 휘말리기 쉽고 감정 기복으로 스스로 피곤해지는 경향이 있어요"},
  곤랑도화: {hanja:"滾浪桃花", category:"unlucky",  desc:"천간끼리는 끈끈하게 합을 이루는데 지지끼리는 서로 부딪히는 형(刑)의 구조예요. 겉으로는 깊이 끌리고 가까워지지만 속으로는 갈등과 구설이 쌓이기 쉬운 애정운이에요. 치정 시비나 관재구설로 번지지 않도록 거리 조절이 중요해요"},
  녹방도화: {hanja:"祿傍桃花", category:"lucky",  desc:"이성에게 어필하는 매력이 재물운과 사회적 인정을 부르는 기운과 함께 자리한 귀한 구조예요. 끼를 부리지 않아도 기품 있는 분위기로 사람을 끌고, 그 매력이 곧 사회적 인정과 좋은 인연으로 이어지는 흐름이에요"},
  낙정관살: {hanja:"落井關殺", category:"unlucky",  desc:"수난사고·추락·함몰 관련 사고에 취약해요. 폰 보며 걷다 맨홀·싱크홀에 빠지는 유형의 부주의가 실제 사고로 이어지기 쉬워요. 곡각살과 겹치면 물리적 충격이 더욱 강해지니 이동 중 항상 주변을 살피세요"},
  음인:     {hanja:"陰刃",   category:"unlucky",  desc:"겉으로는 온화하고 만만해 보이나 속에 독한 기운을 품고 있어요. 양인이 정면충돌형 강함이라면 음인은 끈질기고 은밀한 저항력이에요. 위기 상황에서 생존력이 극대화되며, 감정을 오래 쌓아두다 폭발하는 패턴을 주의하세요"},
  고신살:   {hanja:"孤神殺", category:"unlucky",  desc:"고독하고 의지할 곳이 없는 기운이에요. 이별수가 있어요"},
  공망:     {hanja:"空亡",   category:"unlucky",  desc:"해당 기둥의 기운이 비어 약해져요. 해당 분야가 공허해질 수 있어요"},
  천라지망: {hanja:"天羅地網",category:"unlucky", desc:"뜻하지 않은 구속·제약이 따라요 (천라=술해, 지망=진사)"},
  // 문창·학당귀인
  문창귀인: {hanja:"文昌貴人",category:"lucky",   desc:"영리하고 총명해요. 학문·문서 계통에서 뛰어난 재능과 귀인의 도움이 따라요"},
  학당귀인: {hanja:"學堂貴人",category:"lucky",   desc:"문창·문곡귀인과 함께 공부 사주 3대 길신이에요. 학업뿐 아니라 복(福)까지 함께 따라와 윗사람에게 자연스럽게 인정받는 기운이에요. 어떤 집단에서도 조용히 무게중심 역할을 해요. 일간 기준 해당 지지가 사주에 있으면 성립해요"},
  괴강살:   {hanja:"魁罡殺", category:"neutral",  desc:"으뜸이 되고자 하는 기운이에요. 평소엔 차분하게 눌러두지만 어떤 계기로 임계점을 넘으면 내면의 강한 기운이 한꺼번에 표출되는 패턴이 있고, 지는 것을 못 견디고 주변 사람을 통제권 안에 두려는 욕구가 강해요. 차갑고 냉철한 카리스마가 있고 일 처리가 과감하며 판단력이 좋아 지적인 면과 권력욕이 함께 있어요. 목표를 반드시 이루려는 의지력과 행동력·실천력이 있지만, 독단적인 성격 때문에 주변의 시샘을 받기도 해서 독립적으로 일하거나 권한이 본인에게 강하게 주어지는 자리가 잘 맞아요. 사주가 강하면 그 힘을 더 키우고 약하면 더 약하게 만드는 증폭 작용을 하고, 운이 좋을 때는 크게 번창하지만 운이 나쁠 때는 급격히 흔들리는 극단적인 기운이에요. 과거에는 여성에게 불리한 기운으로 여겨졌지만, 사회활동의 폭이 넓어진 지금은 조직 안에서 살아남고 출세하는 데 도움이 되는 기운으로 해석돼요"},
  // 사묘절 (일간 12운성 취약지)
  사지:     {hanja:"死地",   category:"unlucky",  desc:"일간의 기운이 사지(死地)에 들어 에너지가 소진되고 의욕이 저하되기 쉬워요"},
  묘지:     {hanja:"墓地",   category:"unlucky",  desc:"일간의 기운이 묘지(墓地)에 갇혀 답답함과 정체감이 따르기 쉬워요"},
  절지:     {hanja:"絶地",   category:"unlucky",  desc:"일간의 기운이 절지(絶地)에 들어 단절·이별·시작과 끝이 반복되기 쉬워요"},
  // 지지충(六沖) — 사주 내 충 관계
  자오충:   {hanja:"子午沖", category:"unlucky",  desc:"감정 기복이 심하고 직업 변동이 잦아요. 심장·신장 건강을 주의하세요"},
  축미충:   {hanja:"丑未沖", category:"unlucky",  desc:"재산 손실과 부부 갈등이 생기기 쉬워요. 토지·부동산 분쟁을 주의하세요"},
  인신충:   {hanja:"寅申沖", category:"unlucky",  desc:"사고수와 급격한 이동·변화가 강해요. 교통사고·충돌을 각별히 조심하세요"},
  묘유충:   {hanja:"卯酉沖", category:"unlucky",  desc:"부부·형제 갈등이 따르기 쉬워요. 간·폐 건강에 유의하세요"},
  진술충:   {hanja:"辰戌沖", category:"unlucky",  desc:"관재·구설과 재산 다툼이 따르기 쉬워요. 소화기 건강을 주의하세요"},
  사해충:   {hanja:"巳亥沖", category:"unlucky",  desc:"예기치 못한 사고와 변동이 따라요. 심장·신장 건강에 유의하세요"},
  // 삼형살(三刑殺) 및 형(刑)
  인사신삼형:{hanja:"寅巳申三刑",category:"unlucky", desc:"지세지형(持勢之刑). 권력욕이 강하나 자기파괴적 성향이 있어요. 관재·수술·사고·소송을 주의하세요. 세 지지 모두 갖춰질수록 강도가 세진답니다"},
  축술미삼형:{hanja:"丑戌未三刑",category:"unlucky", desc:"무은지형(無恩之刑). 배신당하거나 배신하기 쉬워요. 은혜를 원수로 갚는 관계를 조심하고 다리·위장 건강을 주의하세요"},
  자묘형:   {hanja:"子卯刑",   category:"unlucky",  desc:"무례지형(無禮之刑). 예의 없는 언행으로 구설수에 오르기 쉬워요. 법적 분쟁·관계 갈등에 주의하고 충동을 자제하세요"},
  // 자형살(自刑殺) — 같은 지지 중복
  해해형:   {hanja:"亥亥自刑", category:"unlucky",  desc:"⚠️ 亥亥 자형 — 우울증·정서 불안 주의. 어둠과 물(水)의 기운이 겹쳐 내면의 갈등과 자기파멸적 사고가 깊어져요. 고독·과음·자포자기를 경계하고 정신건강을 챙기세요"},
  오오형:   {hanja:"午午自刑", category:"unlucky",  desc:"午午 자형 — 충동·과로 주의. 화(火) 기운이 과해져 감정 폭발과 번아웃이 잦아져요. 흥분을 가라앉히고 쉬어가는 법을 익혀야 해요"},
  유유형:   {hanja:"酉酉自刑", category:"unlucky",  desc:"酉酉 자형 — 예민·집착 주의. 금(金) 기운이 겹쳐 결벽증적 완벽주의와 날카로운 비판으로 인간관계가 소원해져요. 유연성을 기르세요"},
  진진형:   {hanja:"辰辰自刑", category:"unlucky",  desc:"辰辰 자형 — 고집·자기집착 주의. 토(土) 기운이 굳어져 융통성 없는 독선으로 주변과 마찰이 잦아져요. 타인의 의견을 경청하세요"},
  // 지지파(地支破) — 이별·손재의 기운
  지지파:   {hanja:"地支破",   category:"unlucky",  desc:"이별·손재·인연 파탄의 기운이에요. 재물 손실과 소중한 관계의 이별을 주의하세요. 계약·보증·동업에 신중을 기하세요"},
  // 지지해(地支害/穿) — 방해·배신의 기운
  지지해:   {hanja:"地支害",   category:"unlucky",  desc:"육해(六害). 방해·장애가 따르며 가까운 사람의 배신을 조심하세요. 각 쌍별 작용: 자미·축오·인유·묘신·진해·사술 — 해당 기운의 충돌로 인한 음성적 갈등이에요"},
  현침살:   {hanja:"懸針殺",   category:"neutral",  desc:"말과 글로 상대의 핵심을 꿰뚫는 기운이에요. 독설도 위로도 평범하지 않고 속살을 건드려요. 잘 쓰면 탁월한 치유자, 잘못 쓰면 상처를 남겨요. 갑(甲)·신(辛)·묘(卯)·오(午)·미(未)·신(申)이 해당해요"},
  // 의처살·의부살 — 일주(일간+일지) 기준, 일지 정재/정관 암합
  의처살:   {hanja:"疑妻殺",   category:"unlucky",  desc:"배우자에게 집착하는 경향이 있고, 내심 배우자의 이성 관계를 의심하게 되는 기운이에요. 일지에 숨은 안정적인 돈의 기운이 암합으로 작용해 애착과 의심이 동시에 강해져요"},
  의부살:   {hanja:"疑夫殺",   category:"unlucky",  desc:"배우자에게 집착하는 경향이 있고, 내심 배우자의 이성 관계를 의심하게 되는 기운이에요. 일지에 숨은 규칙·책임의 기운이 암합으로 작용해 애착과 의심이 동시에 강해져요"},
};

// 양인살: 일간 기준 양인 지지
const YANGIN_JJ: Record<string, string> = {
  갑:'묘', 을:'진', 병:'오', 정:'미', 무:'오',
  기:'미', 경:'유', 신:'술', 임:'자', 계:'축',
};

// 홍염살: 일간 기준 홍염 지지
const HONGYEOM_JJ: Record<string, string> = {
  갑:'오', 을:'신', 병:'인', 정:'미', 무:'오',
  기:'미', 경:'술', 신:'유', 임:'자', 계:'신',
};

// 천을귀인: 일간 기준 천을귀인 지지(들)
export const CHEONUL_JJ: Record<string, string[]> = {
  갑:['축','미'], 무:['축','미'], 경:['축','미'],
  을:['자','신'], 기:['자','신'],
  병:['해','유'], 정:['해','유'],
  임:['사','묘'], 계:['사','묘'],
  신:['오','인'],
};

// 문곡귀인: 일간 기준 문곡귀인 지지
// 갑→유, 을→신, 병→오, 정→사, 무→진, 기→묘, 경→인, 신→축, 임→자, 계→해
const MUNGOK_JJ: Record<string, string> = {
  갑:'유', 을:'신', 병:'오', 정:'사', 무:'진',
  기:'묘', 경:'인', 신:'축', 임:'자', 계:'해',
};

// 금여성: 일간 기준 지지
const GEUMYEO_JJ: Record<string,string> = {
  갑:'진', 을:'사', 병:'미', 정:'신', 무:'미',
  기:'신', 경:'술', 신:'해', 임:'축', 계:'인'};
// 암록: 일간 기준 지지
const AMROK_JJ: Record<string,string> = {
  갑:'해', 을:'술', 병:'신', 정:'미', 무:'신',
  기:'미', 경:'사', 신:'진', 임:'인', 계:'축'};
// 백호살: 천간+지지 조합 (갑진·을미·병술·정축·무진·임술·계축 — 사주의 어느 기둥에 있어도 성립)
const BAEHO_ILJU = new Set(['갑진','을미','병술','정축','무진','임술','계축']);

// 의처살(남자)·의부살(여자): 일지 정재/정관 암합 일주
interface UicheoUibuEntry {
  gender: "male" | "female";
  amhap: string; // 일지 지장간 ─ 정재/정관 암합 설명
  base: string[]; // 기본 성향 서술
  baekho?: boolean; // 백호살 동반 여부
  yearGroup?: { type: "도화" | "망신"; note: string }; // 연지 삼합 그룹 조건부 서술
  intensify?: { jj: string; note: string }; // 동주에 있으면 심각해지는 지지
  windRisk?: { jjs: string[]; note: string }; // 바람날 가능성 지지(운에서 와도 해당)
}

const UICHEO_UIBU_DATA: Record<string, UicheoUibuEntry> = {
  갑오: {
    gender: "male",
    amhap: "甲과 午중 己土, 안정적인 돈의 기운이 암합을 이뤄요.",
    base: ["午火가 표현력과 개성의 기운이라 애정표현에 능숙한 애처가형 의처증세를 보여요."],
    yearGroup: { type: "도화", note: "사유축생이면 午火가 도화살이 되어 배우자의 미모와 바람기를 의심하는 인자가 더해져요." },
    intensify: { jj: "해", note: "옆에 해(亥, 직관·예술적 감수성의 기운이 시작되는 자리)가 함께 있으면 의심과 집착이 한층 심각해져요. (亥중 甲木과 암합)" },
  },
  병술: {
    gender: "male",
    amhap: "丙과 戌중 辛金, 안정적인 돈의 기운이 암합을 이뤄요.",
    base: ["戌이 먹을복의 기운이자 입묘지라 '마누라 없으면 못 사는' 애처가형 의처증이에요."],
    baekho: true,
    intensify: { jj: "인", note: "옆에 인(寅, 직관·예술적 감수성의 기운이 시작되는 자리)이 함께 있으면 한층 심각해져요. (寅중 丙火와 암합)" },
  },
  무진: {
    gender: "male",
    amhap: "戊와 辰중 癸水, 안정적인 돈의 기운이 암합을 이뤄요.",
    base: ["辰이 독립심과 자존심의 기운이라, 내 배우자가 그런 기운을 지닌 내 친구를 더 좋아한다는 의처증이에요."],
    baekho: true,
    windRisk: { jjs: ["인", "신", "사", "해"], note: "주변에 사생지(寅申巳亥)가 있으면 암합 인자가 되며, 이 중 巳火가 직관·예술적 감수성의 기운이면 특히 심해요." },
  },
  경진: {
    gender: "male",
    amhap: "庚과 辰중 乙木, 안정적인 돈의 기운이 암합을 이뤄요.",
    base: [
      "辰이 직관·예술적 감수성의 기운이라 의심이 가중되고, 辰 배우자가 용을 닮아 변화무쌍하고 바쁘게 움직여요.",
      "辰은 인묘진(돈 관련 기운)·신유술(경쟁·자존심의 기운)·해자축(표현·결과물을 만드는 기운)에서 모습이 다변해요.",
    ],
    intensify: { jj: "신", note: "옆에 신(申)이 있거나 운에서 申이 오면(申중 庚金과 암합) 한층 심각해져요." },
  },
  임술: {
    gender: "male",
    amhap: "壬과 戌중 丁火, 안정적인 돈의 기운이 암합을 이뤄요.",
    base: ["戌이 통제·압박을 주는 기운이라 스트레스를 심하게 주는 배우자이며, 戌은 동물로는 개예요."],
    baekho: true,
    intensify: { jj: "신", note: "옆에 申(직관·예술적 감수성의 기운이 시작되는 자리)이 있으면 심해지고, 亥子 운에 바람날 가능성이 있어요." },
  },
  을사: {
    gender: "female",
    amhap: "乙과 巳중 庚金, 규칙·책임·사회적 인정의 기운이 암합을 이뤄요.",
    base: ["巳火가 욕지에 자리한 표현력과 개성의 기운이라 잔소리·욕설·무시·변덕을 부리는 의부증세를 보여요."],
    yearGroup: { type: "망신", note: "인오술생이면 巳火가 망신살이 되어, 남편이 철없는 바람기와 망신살의 인연이에요." },
    intensify: { jj: "자", note: "옆에 子(직관·예술적 감수성의 기운), 巳戌귀문관살, 巳申합(극단적 히스테리)이 있으면 심해져요." },
    windRisk: { jjs: ["묘", "진", "미"], note: "옆에 卯辰未(乙庚암합)가 있거나 운에서 오면 바람날 가능성으로 봐요." },
  },
  정해: {
    gender: "female",
    amhap: "丁과 亥중 壬水, 규칙·책임·사회적 인정의 기운이 암합을 이뤄요.",
    base: ["亥水는 태지에서 귀인을 만나는 책임감의 기운이라, 겁이 많고 조바심이 있으며 유교적인 보수성을 지녀요."],
    yearGroup: { type: "망신", note: "신자진생이면 亥水가 귀인망신이 되어, 남편이 귀공자형으로 잘생겨서 오히려 불안해져요." },
    intensify: { jj: "묘", note: "옆에 卯(직관·예술적 감수성의 기운), 辰亥귀문관살이 있으면 丁火는 집요해서 병적인 집착을 보여요." },
    windRisk: { jjs: ["오", "미", "술"], note: "옆에 午未戌(정임암합)이 있거나 운에서 오면 바람날 가능성으로 봐요." },
  },
  기해: {
    gender: "female",
    amhap: "己와 亥중 甲木, 규칙·책임·사회적 인정의 기운이 암합을 이뤄요.",
    base: ["亥水는 태지라 겁이 많고 조바심이 있으며, 안정적인 돈을 향한 애착심으로 인한 의부증이에요."],
    yearGroup: { type: "망신", note: "신자진생이면 亥水가 망신이 되어, 남편이 내 친구나 형제와의 스캔들로 망신당할 인연이에요." },
    intensify: { jj: "오", note: "옆에 午(직관·예술적 감수성의 기운, 甲己암합)·辰亥귀문관살이 있으면 심해져요." },
    windRisk: { jjs: ["축", "오", "미"], note: "옆에 丑午未(甲己암합)가 있거나 운에서 오면 바람날 가능성으로 봐요." },
  },
  신사: {
    gender: "female",
    amhap: "辛과 巳중 丙火, 규칙·책임·사회적 인정의 기운이 암합을 이뤄요.",
    base: [
      "巳는 절지에 자리한 책임감의 기운이라, 남편이 밖에서는 호인이지만 안에서는 무정하고 보수적이에요.",
      "巳火는 巳酉丑 금국(金局)의 삼합운동으로 늘 변하기를 원해요. 巳戌·巳申은 전형적인 변태 기질이라 잘 쓰면 천재성, 잘못 쓰면 신병으로 이어져요.",
    ],
    yearGroup: { type: "망신", note: "인오술생이면 巳火가 망신살이 되어, 남편이 겉은 신사 기질이나 속은 변태(巳)성을 지녀요." },
    intensify: { jj: "축", note: "옆에 丑(직관·예술적 감수성의 기운, 丙辛암합), 巳戌귀문관살, 巳申합이 있으면 심해져요." },
  },
  계해: {
    gender: "female",
    amhap: "癸와 亥중 戊土, 규칙·책임·사회적 인정의 기운이 암합을 이뤄요.",
    base: ["亥중 戊土가 부부궁에 절지를 깔았으니, 밖으로만 도는 남편이 늘 의심스러워요."],
    yearGroup: { type: "망신", note: "신자진생이면 亥水가 망신이 되어, 남편이 내 친구나 형제와의 스캔들로 망신당할 인연이에요." },
    intensify: { jj: "유", note: "옆에 酉(직관·예술적 감수성의 기운, 병지)가 있으면 청정수가 되어, 아주 예민한 결벽성 의부증을 보여요." },
    windRisk: { jjs: ["자", "축"], note: "옆에 子丑(戊癸암합)이 있거나 운에서 오면 바람날 가능성으로 봐요." },
  },
};

function getUicheoUibuNarrative(dayCg: string, dayJj: string, gender: "male" | "female", yeonji: string, jjSet: Set<string>): string {
  const entry = UICHEO_UIBU_DATA[dayCg + dayJj];
  if (!entry || entry.gender !== gender) return "";
  const lines = [entry.amhap, ...entry.base];
  if (entry.baekho) lines.push("백호살을 동반해 배우자와의 이별·사별 가능성의 인자도 함께 자리해요.");
  if (entry.yearGroup) {
    const hit = entry.yearGroup.type === "도화" ? getDohwaJj(yeonji) === dayJj : getSinsal(yeonji, dayJj) === "망신살";
    if (hit) lines.push(entry.yearGroup.note);
  }
  if (entry.intensify && jjSet.has(entry.intensify.jj)) lines.push(entry.intensify.note);
  if (entry.windRisk && entry.windRisk.jjs.some(jj => jjSet.has(jj))) lines.push(entry.windRisk.note);
  return lines.join(" ");
}
// 귀문관살: 지지 쌍 (어느 방향이든)
const GWIMUN_PAIRS = [['자','유'],['축','오'],['인','미'],['묘','신'],['진','해'],['사','술']];
// 원진살: 지지 쌍
export const WONJIN_PAIRS: [string, string][] = [['자','미'],['축','오'],['인','유'],['묘','신'],['진','해'],['사','술']];
// 천주귀인: 일간 기준 지지
const CHEONJU_JJ: Record<string,string> = {
  갑:'사', 을:'오', 병:'사', 정:'유', 무:'해',
  기:'오', 경:'인', 신:'인', 임:'묘', 계:'묘'};
// 천덕귀인: 월지 기준 (값이 천간인지 지지인지 type으로 구분)
const CHEONDUK_MAP: Record<string,{value:string;type:'cg'|'jj'}> = {
  자:{value:'사',type:'jj'}, 축:{value:'경',type:'cg'},
  인:{value:'정',type:'cg'}, 묘:{value:'신',type:'jj'},
  진:{value:'임',type:'cg'}, 사:{value:'신',type:'cg'},
  오:{value:'해',type:'jj'}, 미:{value:'갑',type:'cg'},
  신:{value:'계',type:'cg'}, 유:{value:'인',type:'jj'},
  술:{value:'병',type:'cg'}, 해:{value:'을',type:'cg'}};
// 고신살: 연지 기준 지지
const GOSIN_JJ: Record<string,string> = {
  인:'사', 묘:'사', 진:'사',
  사:'신', 오:'신', 미:'신',
  신:'해', 유:'해', 술:'해',
  해:'인', 자:'인', 축:'인'};
// 월덕귀인: 월지 기준 천간
const WOLDEOK_CG: Record<string,string> = {
  해:'갑', 묘:'갑', 미:'갑',
  인:'병', 오:'병', 술:'병',
  사:'경', 유:'경', 축:'경',
  신:'임', 자:'임', 진:'임'};

// 태극귀인(太極貴人): 일간 기준 연지
const TAEGEUK_JJ: Record<string, string[]> = {
  갑:['자','오'], 을:['자','오'],
  병:['묘','유'], 정:['묘','유'],
  무:['진','술','축','미'], 기:['진','술','축','미'],
  경:['인','해'], 신:['인','해'],
  임:['사','신'], 계:['사','신']};
// 문창귀인(文昌貴人): 일간의 식신 지지
const MUNCHANG_JJ: Record<string,string> = {
  갑:'사', 을:'오', 병:'신', 정:'유', 무:'신',
  기:'유', 경:'해', 신:'자', 임:'인', 계:'묘'};
// 학당귀인(學堂貴人): 일간의 장생지
const HAKDANG_JJ: Record<string,string> = {
  갑:'해', 을:'오', 병:'인', 정:'유', 무:'인',
  기:'유', 경:'사', 신:'자', 임:'신', 계:'묘'};
// 괴강살(魁罡殺): 경진·경술·무진·무술·임진·임술 일주
const GOEGANG_ILJU = new Set(['경진','경술','무진','무술','임진','임술']);

// 나체도화(裸體桃花): 갑자·정묘·경오·계유 일주 — 일주 자체가 도화+양인의 노골적 결합 구조
const NACHE_ILJU = new Set(['갑자','정묘','경오','계유']);

// 낙정관살(落井關殺): 연지 그룹별 해당 지지
// 해자축→辰, 인묘진→未, 사오미→戌, 신유술→丑
const NAKJEONG_MAP: Record<string,string> = {
  해:'진', 자:'진', 축:'진',
  인:'미', 묘:'미', 진:'미',
  사:'술', 오:'술', 미:'술',
  신:'축', 유:'축', 술:'축'};

// 음인(陰刃): 음간의 양인 다음 지지 (을→辰, 정→未, 기→未, 신→戌, 계→丑)
const YINYIN_JJ: Record<string,string> = {
  을:'진', 정:'미', 기:'미', 신:'술', 계:'축'};

// ── 천간 득지/실지 (地盤 강도) 계수 ──────────────────────────────────────
// 각 천간이 자신의 지지에서 어떤 12운성 상태에 있느냐에 따라 강도가 달라짐
// (예: 신금이 사지에 앉으면 사지(死地)→매우 약, 건록에 앉으면→매우 강)
// 양간(甲丙戊庚壬): 완전 적용 / 음간(乙丁己辛癸): 절반 적용 (음간 역행 불확실성 보완)
const UUNSEONG_CG_FACTOR: Record<string, number> = {
  장생: 1.25, 목욕: 0.90, 관대: 1.20, 건록: 1.30,
  제왕: 1.25, 쇠:   0.85, 병:   0.75, 사:   0.50,
  묘:   0.50, 절:   0.45, 태:   0.75, 양:   0.80,
};

// 십성 계산용
const CG_YANG_SET = new Set(["갑","병","무","경","임"]);
const OHAENG_GENERATES: Record<string, Element> = {목:"화",화:"토",토:"금",금:"수",수:"목"};
const OHAENG_CONTROLS: Record<string, Element> = {목:"토",토:"수",수:"화",화:"금",금:"목"};

// 일간 오행 기준, 특정 오행이 어떤 십성 그룹(비겁/식상/재성/관성/인성)에 해당하는지
export function getSipseongGroupByElement(ilganElement: Element, targetElement: Element): string {
  if (ilganElement === targetElement) return "비겁";
  if (OHAENG_GENERATES[ilganElement] === targetElement) return "식상";
  if (OHAENG_CONTROLS[ilganElement] === targetElement) return "재성";
  if (OHAENG_CONTROLS[targetElement] === ilganElement) return "관성";
  if (OHAENG_GENERATES[targetElement] === ilganElement) return "인성";
  return "";
}

// 절기 시작일 근사값 (인덱스 = 양력 월)
// 1=소한(6일), 2=입춘(4일), 3=경칩(6일), 4=청명(5일), 5=입하(6일), 6=망종(6일)
// 7=소서(7일), 8=입추(8일), 9=백로(8일), 10=한로(8일), 11=입동(7일), 12=대설(7일)
export const SOLAR_TERM_DAYS = [0, 6, 4, 6, 5, 6, 6, 7, 8, 8, 8, 7, 7];

// 도시별 경도 — 경도 기준 진태양시 보정: (경도 - 135) × 4분

// ── 도시 별칭 테이블 (로마자 변이형·오타·러시아어 표기 등) ────────────────────
// normalizeCityName 이후 단계에서 이 테이블을 먼저 조회한다
const CITY_ALIASES: Record<string, number> = {
  // ── 부산 ──
  "pusan":129.075,"boosan":129.075,"buzan":129.075,
  // ── 대구 ──
  "taegu":128.601,"taegu-si":128.601,
  // ── 인천 ──
  "inchon":126.705,"incheon-si":126.705,
  // ── 광주 ──
  "kwangju":126.851,"gwangju-si":126.851,
  // ── 대전 ──
  "taejon":127.385,"daejeon-si":127.385,
  // ── 울산 ──
  "ulsan-si":129.312,
  // ── 수원 ──
  "suwon-si":127.009,"soowon":127.009,
  // ── 성남/분당 ──
  "seongnam":127.137,"bundang-gu":127.111,
  // ── 안산 ──
  "ansan-si":126.825,
  // ── 안성 ──
  "ansung":127.280,"anseong-si":127.280,"anseongsi":127.280,"anseong":127.280,
  // ── 안양 ──
  "anyang-si":126.958,
  // ── 평택 ──
  "pyeongtaek":127.112,"pyongtaek":127.112,"pyeongtaek-si":127.112,
  // ── 화성 ──
  "hwaseong":126.948,"hwaseong-si":126.948,
  // ── 용인 ──
  "yongin":127.202,"yongin-si":127.202,"yonginsi":127.202,
  // ── 이천 ──
  "icheon":127.442,"icheon-si":127.442,"icheoncity":127.442,
  // ── 여주 ──
  "yeoju":127.637,"yeoju-si":127.637,
  // ── 춘천 ──
  "chunchon":127.726,"chuncheon-si":127.726,
  // ── 원주 ──
  "wonju-si":127.944,
  // ── 강릉 ──
  "gangneung-si":128.876,"kangnung":128.876,"kangneung":128.876,
  // ── 태백 ──
  "taebaek":128.983,"taeback":128.983,"taebaeksi":128.983,"tabacksi":128.983,
  "taebak":128.983,"taebaek-si":128.983,"taeback-si":128.983,
  // ── 동해 ──
  "donghae-si":129.114,
  // ── 삼척 ──
  "samcheok":129.166,"samchok":129.166,"samcheok-si":129.166,
  // ── 속초 ──
  "sokcho":128.596,"sokchosi":128.596,"sokcho-si":128.596,
  // ── 인제 ──
  "inje":128.170,"inje-gun":128.170,"injegoon":128.170,"injegun":128.170,
  "inje-goon":128.170,"injegon":128.170,
  // ── 횡성 ──
  "hoengseong":127.985,"hoengseong-gun":127.985,
  // ── 평창 ──
  "pyeongchang":128.470,"pyongchang":128.470,
  // ── 청주 ──
  "cheongju-si":127.491,"chongju":127.491,"cheongjusi":127.491,
  // ── 충주 ──
  "chungju-si":127.926,"chungchu":127.926,"chungchusi":127.926,
  // ── 천안 ──
  "cheonan-si":127.149,"chonan":127.149,"cheonansi":127.149,
  // ── 공주 ──
  "gongju-si":127.115,"kongju":127.115,
  // ── 아산 ──
  "asan":127.004,"asan-si":127.004,
  // ── 제천 ──
  "jecheon":128.193,"jecheon-si":128.193,"jecheonsi":128.193,
  // ── 전주 ──
  "jeonju-si":127.148,"chonju":127.148,"jeonjusi":127.148,
  // ── 군산 ──
  "gunsan-si":126.713,"kunsan":126.713,
  // ── 목포 ──
  "mokpo-si":126.388,"mokposi":126.388,
  // ── 여수 ──
  "yeosu-si":127.662,"yosu":127.662,
  // ── 순천 ──
  "suncheon-si":127.483,"sunchonsi":127.483,"sunchon":127.483,
  // ── 광양 ──
  "gwangyang-si":127.696,
  // ── 남원 ──
  "namwon":127.388,"namwon-si":127.388,
  // ── 익산 ──
  "iksan":126.957,"iksan-si":126.957,"iri":126.957,
  // ── 정읍 ──
  "jeongeup":126.866,"jeongeup-si":126.866,
  // ── 경주 ──
  "gyeongju-si":129.211,"kyongju":129.211,"kyonju":129.211,"gyeongjusi":129.211,
  // ── 포항 ──
  "pohang-si":129.343,"pohansi":129.343,
  // ── 창원 ──
  "changwon-si":128.681,"masan":128.681,
  // ── 진주 ──
  "jinju-si":128.107,"chinju":128.107,
  // ── 거제 ──
  "geoje-si":128.621,"kojei":128.621,"geojesi":128.621,
  // ── 밀양 ──
  "milyang":128.746,"milyangsi":128.746,"miryangsi":128.746,"miryang-si":128.746,
  "miryang":128.746,"milyang-si":128.746,
  // ── 통영 ──
  "tongyeong-si":128.433,"chungmu":128.433,"tongyeongsi":128.433,
  // ── 김해 ──
  "gimhae-si":128.889,"kimhae":128.889,"gimhaesi":128.889,
  // ── 양산 ──
  "yangsan-si":129.037,
  // ── 구미 ──
  "gumi-si":128.341,"kumi":128.341,
  // ── 안동 ──
  "andong-si":128.729,
  // ── 사천 ──
  "sacheon":128.063,"sacheon-si":128.063,"sacheonsi":128.063,
  // ── 남해 ──
  "namhae":127.892,"namhae-gun":127.892,
  // ── 하동 ──
  "hadong":127.751,"hadong-gun":127.751,
  // ── 거창 ──
  "geochang":127.910,"geochang-gun":127.910,
  // ── 제주 ──
  "jeju-si":126.531,"cheju":126.531,"chejusi":126.531,"jejusi":126.531,
  "제주도":126.531,"jejudo":126.531,"jeju island":126.531,
  // ── 서귀포 ──
  "seogwipo-si":126.556,"seogwiposi":126.556,
  // ════ 해외 ════
  // 모스크바
  "모스크바":37.617,"moscow":37.617,"moskva":37.617,"moskaw":37.617,
  "moskba":37.617,"moskow":37.617,"moskov":37.617,"moskau":37.617,
  "московa":37.617,"mosква":37.617,
  // 이르쿠츠크
  "이르쿠츠크":104.296,"irkutsk":104.296,"irkuck":104.296,
  "irkoetsk":104.296,"irkutskaya":104.296,"irkutsk-city":104.296,
  // 블라디보스토크
  "블라디보스토크":131.874,"vladivostok":131.874,"vladivostok-city":131.874,
  "владивосток":131.874,
  // 하바롭스크
  "하바롭스크":135.084,"khabarovsk":135.084,"habarovsk":135.084,
  "khabarovsk-city":135.084,
  // 노보시비르스크
  "노보시비르스크":82.920,"novosibirsk":82.920,"novosibirskaya":82.920,
  // 상트페테르부르크
  "상트페테르부르크":30.315,"saint petersburg":30.315,"st. petersburg":30.315,
  "st petersburg":30.315,"sanktpeterburg":30.315,"leningrad":30.315,
  // 베이징 variants
  "peking":116.407,"peiching":116.407,"beijing-shi":116.407,
  // 도쿄 variants
  "tokyo-to":139.692,"tokio":139.692,"tokyo-metropolis":139.692,
  // 오사카 variants
  "osaka-fu":135.502,"osakan":135.502,
  // 교토
  "교토":135.768,"kyoto":135.768,"kyoto-shi":135.768,
  // 나고야
  "나고야":136.906,"nagoya":136.906,"nagoya-shi":136.906,
  // 삿포로
  "삿포로":141.354,"sapporo":141.354,"sapporo-shi":141.354,
  // 후쿠오카
  "후쿠오카":130.401,"fukuoka":130.401,"fukuoka-shi":130.401,
  // 뉴욕 variants
  "new york city":(-74.006),"nyc":(-74.006),"new york, ny":(-74.006),
  "newyork":(-74.006),
  // 로스앤젤레스 variants
  "l.a.":(-118.244),"la":(-118.244),"los angeles ca":(-118.244),
  "losangeles":(-118.244),
  // 런던 variants
  "london uk":(-0.118),"london england":(-0.118),
  // 파리 variants
  "paris france":2.349,"paris, france":2.349,
  // 시드니 variants
  "sydney australia":151.209,"sydney, nsw":151.209,
  // 홍콩 variants
  "hong kong sar":114.109,"hk":114.109,"hongkong":114.109,
  // 싱가포르 variants
  "singapore city":103.820,"sg":103.820,
  // 방콕 variants
  "krung thep":100.501,"bangkok thailand":100.501,
  // 타이베이 variants
  "taipei, taiwan":121.565,"taipei city":121.565,
  // 상하이 variants
  "shanghai-shi":121.474,
  // 광저우
  "광저우":113.264,"guangzhou":113.264,"canton":113.264,
  // 선전
  "선전":114.059,"shenzhen":114.059,"shen zhen":114.059,
  // 청두
  "청두":104.066,"chengdu":104.066,
  // 우한
  "우한":114.305,"wuhan":114.305,
  // 시안
  "시안":108.940,"xian":108.940,"xi'an":108.940,
  // 뭄바이
  "뭄바이":72.878,"mumbai":72.878,"bombay":72.878,
  // 델리
  "델리":77.209,"delhi":77.209,"new delhi":77.209,"newdelhi":77.209,
  // 도하
  "도하":51.531,"doha":51.531,
  // 두바이
  "두바이":55.297,"dubai":55.297,
  // 뉴질랜드 - 오클랜드
  "오클랜드":174.763,"auckland":174.763,
  // 멜버른
  "멜버른":144.946,"melbourne":144.946,
  // 토론토
  "토론토":(-79.383),"toronto":(-79.383),
  // 밴쿠버
  "밴쿠버":(-123.121),"vancouver":(-123.121),
};

const CITY_LONGITUDE: Record<string, number> = {
  // 서울·수도권
  "서울":126.978,"seoul":126.978,
  "인천":126.705,"incheon":126.705,
  "수원":127.009,"suwon":127.009,
  "성남":127.137,"분당":127.111,"판교":127.095,
  "고양":126.835,"일산":126.760,
  "부천":126.783,"안양":126.958,"광명":126.866,
  "시흥":126.803,"안산":126.825,
  "의정부":127.054,"남양주":127.216,"하남":127.214,
  "구리":127.130,"파주":126.780,"김포":126.716,
  "평택":127.112,"화성":126.948,"오산":127.077,
  "용인":127.202,"이천":127.442,"안성":127.280,
  "여주":127.637,
  // 강원
  "춘천":127.726,"chuncheon":127.726,
  "원주":127.944,"wonju":127.944,
  "강릉":128.876,"gangneung":128.876,
  "속초":128.596,"삼척":129.166,"동해":129.114,
  "태백":128.983,"횡성":127.985,"평창":128.470,
  // 충청
  "대전":127.385,"daejeon":127.385,
  "청주":127.491,"cheongju":127.491,
  "천안":127.149,"cheonan":127.149,
  "세종":127.289,"sejong":127.289,
  "충주":127.926,"chungju":127.926,
  "공주":127.115,"아산":127.004,"제천":128.193,
  // 전라
  "광주":126.851,"gwangju":126.851,
  "전주":127.148,"jeonju":127.148,
  "군산":126.713,"gunsan":126.713,
  "목포":126.388,"mokpo":126.388,
  "여수":127.662,"yeosu":127.662,
  "순천":127.483,"suncheon":127.483,
  "광양":127.696,"gwangyang":127.696,
  "남원":127.388,"익산":126.957,"정읍":126.866,
  // 경상
  "부산":129.075,"busan":129.075,
  "대구":128.601,"daegu":128.601,
  "울산":129.312,"ulsan":129.312,
  "경주":129.211,"gyeongju":129.211,
  "포항":129.343,"pohang":129.343,
  "창원":128.681,"changwon":128.681,
  "진주":128.107,"jinju":128.107,
  "거제":128.621,"geoje":128.621,
  "통영":128.433,"tongyeong":128.433,
  "김해":128.889,"gimhae":128.889,
  "양산":129.037,"yangsan":129.037,
  "밀양":128.746,"miryang":128.746,
  "구미":128.341,"gumi":128.341,
  "안동":128.729,"andong":128.729,
  "사천":128.063,"남해":127.892,
  "하동":127.751,"함안":128.406,
  "고성":128.322,
  // 제주
  "제주":126.531,"jeju":126.531,
  "서귀포":126.556,"seogwipo":126.556,
  // 지역 광역 (정확한 도시 미입력 시 대략 보정)
  "경기":127.000,"강원":128.000,
  "충남":126.900,"충북":127.600,
  "전남":126.900,"전북":127.000,
  "경남":128.400,"경북":128.800,
  "제주도":126.531,
  // 해외 주요 도시
  "자카르타":106.845,"jakarta":106.845,
  "싱가포르":103.820,"singapore":103.820,
  "도쿄":139.692,"tokyo":139.692,
  "오사카":135.502,"osaka":135.502,
  "베이징":116.407,"beijing":116.407,
  "상하이":121.474,"shanghai":121.474,
  "방콕":100.501,"bangkok":100.501,
  "홍콩":114.109,"hong kong":114.109,
  "쿠알라룸푸르":101.687,"kuala lumpur":101.687,
  "마닐라":120.984,"manila":120.984,
  "호치민":106.660,"ho chi minh":106.660,
  "타이베이":121.565,"taipei":121.565,
  "뉴욕":-74.006,"new york":-74.006,
  "런던":-0.118,"london":-0.118,
  "파리":2.349,"paris":2.349,
  "시드니":151.209,"sydney":151.209,
  "로스앤젤레스":-118.244,"los angeles":-118.244,
};

function normalizeCityName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // 광역시·특별시·특별자치시·특별자치도·시·군·구·도 접미사 제거
    .replace(/(광역시|특별자치시|특별자치도|특별시|직할시|광역|시도|시군|시$|군$|구$|도$)/g, "")
    .trim();
}

function getLongitude(birthPlace: string): number | null {
  // 1단계: 별칭 테이블 직접 조회 (로마자 변이형·오타·외래어 표기 커버)
  const raw = birthPlace.toLowerCase().replace(/[-·\s]/g, "").trim();
  for (const [alias, lng] of Object.entries(CITY_ALIASES)) {
    const a = alias.toLowerCase().replace(/[-·\s]/g, "");
    if (raw === a || raw.includes(a) || a.includes(raw)) return lng;
  }
  // 2단계: 기존 CITY_LONGITUDE 정규화 조회 (한국어 도시명)
  const input = normalizeCityName(birthPlace);
  for (const [key, lng] of Object.entries(CITY_LONGITUDE)) {
    const k = normalizeCityName(key);
    if (input.includes(k) || k.includes(input)) return lng;
  }
  return null;
}

function getLocalTimeCorrection(birthPlace: string): number {
  const lng = getLongitude(birthPlace);
  if (lng === null) return -30;
  return Math.round((lng - 135) * 4);
}

function getSummerTimeCorrection(year: number, month: number): number {
  if (year >= 1961 && year <= 1987 && month >= 5 && month <= 9) return 60;
  return 0;
}

export function toJDN(y: number, m: number, d: number): number {
  const a = Math.floor((14 - m) / 12);
  const yr = y + 4800 - a;
  const mo = m + 12 * a - 3;
  return d + Math.floor((153*mo+2)/5) + 365*yr +
    Math.floor(yr/4) - Math.floor(yr/100) + Math.floor(yr/400) - 32045;
}

// 도화살 지지 (연지 삼합그룹 기준)
export function getDohwaJj(yeonji: string): string {
  const yi = JIJI.indexOf(yeonji);
  if ([2,6,10].includes(yi)) return '묘';   // 인오술 → 묘
  if ([11,3,7].includes(yi)) return '자';   // 해묘미 → 자
  if ([8,0,4].includes(yi)) return '유';    // 신자진 → 유
  return '오';                               // 사유축 → 오
}

// 과숙살 지지 (연지 기준)
function getGwasukJj(yeonji: string): string {
  const yi = JIJI.indexOf(yeonji);
  if ([2,3,4].includes(yi)) return '축';    // 인묘진 → 축
  if ([5,6,7].includes(yi)) return '진';    // 사오미 → 진
  if ([8,9,10].includes(yi)) return '미';   // 신유술 → 미
  return '술';                               // 해자축 → 술
}

// 십성 계산 (일간 기준)
export function getSipseong(ilgan: string, target: string): string {
  const ilEl = CHEONGAN_ELEMENT[ilgan];
  const tgEl = CHEONGAN_ELEMENT[target];
  if (!ilEl || !tgEl) return "";
  const sameYY = CG_YANG_SET.has(ilgan) === CG_YANG_SET.has(target);
  if (ilEl === tgEl) return sameYY ? "비견" : "겁재";
  if (OHAENG_GENERATES[ilEl] === tgEl) return sameYY ? "식신" : "상관";
  if (OHAENG_CONTROLS[ilEl] === tgEl) return sameYY ? "편재" : "정재";
  if (OHAENG_CONTROLS[tgEl] === ilEl) return sameYY ? "편관" : "정관";
  if (OHAENG_GENERATES[tgEl] === ilEl) return sameYY ? "편인" : "정인";
  return "";
}

// 12운성 (일간 기준, 모든 기둥 지지에 적용)
export function getUunseong(ilgan: string, jj: string): string {
  const jjIdx = JIJI.indexOf(jj);
  const data = JANGSEAENG_DATA[ilgan];
  if (!data || jjIdx < 0) return "";
  const diff = data.forward
    ? (jjIdx - data.start + 12) % 12
    : (data.start - jjIdx + 12) % 12;
  return UUNSEONG_NAMES[diff];
}

// 12운성(十二運星) 상세 — 일간의 기운이 생애 주기처럼 12단계로 강약을 오가는 흐름.
// 사·묘·절·병처럼 약한 시기도 '쇠퇴'가 아니라 '다음 단계로 넘어가기 위한 휴지기'로 풀어 설명한다.
export const UUNSEONG_DETAIL: Record<string, { hanja: string; stage: string; keyword: string; desc: string }> = {
  장생: { hanja: "長生", stage: "출생", keyword: "시작·순수함·성장 잠재력",
    desc: "막 태어난 생명처럼 순수하고 호기심이 많아요. 새로운 것을 배우고 시작하는 힘이 강하고, 주변의 보살핌과 지원을 잘 받는 자리예요. 다만 아직 여물지 않아 시행착오가 따르니, 빠른 성공보다 차근차근 쌓아가는 마음이 필요해요." },
  목욕: { hanja: "沐浴", stage: "성장", keyword: "매력·치장·변덕",
    desc: "막 목욕을 마친 아기처럼 꾸밈없는 매력과 화려함을 타고났어요. 외모·패션·자기표현에 감각이 있고 주목받는 걸 즐겨요. 다만 감정과 마음이 자주 바뀌는 불안정함이 있어, 한 가지에 진득하게 머무는 연습이 도움이 돼요." },
  관대: { hanja: "冠帶", stage: "성년", keyword: "자신감·과시·도전",
    desc: "관(冠)을 쓰고 띠를 두르는 성년식의 기운이에요. 자신감이 넘치고 자기 능력을 드러내고 싶은 욕구가 강해요. 의욕적으로 도전하지만 아직 경험이 충분치 않아 과시나 무리수로 이어질 수 있으니, 실력을 먼저 다지는 게 중요해요." },
  건록: { hanja: "建祿", stage: "사회 진출", keyword: "자립·실력·안정된 성취",
    desc: "스스로 녹(祿, 밥벌이)을 세우는 자리로, 자립심과 실무 능력이 가장 안정적으로 발휘되는 시기예요. 자기 힘으로 성과를 만들어내고 인정받는 흐름이라, 직업적으로 가장 믿을 만한 저력을 보여주는 운성이에요." },
  제왕: { hanja: "帝旺", stage: "전성기", keyword: "최고 에너지·주도권·고집",
    desc: "12운성 중 기운이 가장 강한 정점이에요. 추진력과 카리스마가 폭발적이고, 자기 분야에서 주도권을 쥐려는 의지가 강해요. 다만 너무 강한 기운은 꺾이기도 쉬워서, 정점에서는 오히려 한발 물러나 유연함을 챙기는 지혜가 필요해요." },
  쇠: { hanja: "衰", stage: "원숙", keyword: "노련함·신중함·익숙함",
    desc: "전성기를 지나 한 차례 숙성된 자리예요. 경험과 노하우가 쌓여 노련하고 신중하게 일을 처리하지만, 새로운 모험보다는 익숙한 방식을 고수하려는 경향이 있어요. 변화가 필요한 순간엔 관성을 깨는 용기가 보약이 돼요." },
  병: { hanja: "病", stage: "쇠퇴 초입", keyword: "민감함·내면화·통찰",
    desc: "기운이 약해지며 몸과 마음이 예민해지는 시기예요. 겉으로 드러내기보다 안으로 생각을 곱씹는 시간이 많아지고, 그 과정에서 남들이 못 보는 디테일을 캐치하는 통찰력이 생겨요. 무리하기보다 컨디션 관리를 우선해야 할 때예요." },
  사: { hanja: "死", stage: "정지·내면 집중", keyword: "몰입·영적 감수성·재정비",
    desc: "겉으로 드러나는 활동력은 줄지만, 그만큼 한 가지에 깊이 몰입하는 집중력과 직관·영적 감수성이 살아나는 자리예요. 에너지를 밖으로 쏟기보다 안으로 갈무리하며 재정비하는 시기라, 무기력하게 느껴질 수 있어도 사실은 다음 도약을 준비하는 숨고르기예요." },
  묘: { hanja: "墓", stage: "저장·응축", keyword: "축적·내실·답답함",
    desc: "씨앗이 땅속 창고(墓)에 갈무리되듯, 기운과 자원이 겉으로 드러나지 않고 안에 차곡차곡 쌓이는 자리예요. 답답하고 정체된 느낌이 들 수 있지만, 실은 보이지 않는 곳에서 내실을 다지는 절약·저축의 기운이에요. 급하게 펼치려 하지 말고 때를 기다리는 편이 유리해요." },
  절: { hanja: "絶", stage: "단절·전환", keyword: "끝과 시작·리셋·새 출발",
    desc: "기운이 완전히 끊어지는 듯한 자리지만, 동시에 묵은 것을 끊어내고 완전히 새로 시작할 수 있는 리셋의 힘이기도 해요. 관계·일·환경의 매듭을 짓고 다음 장으로 넘어가는 전환점이 자주 찾아와요. 끝을 두려워하기보다 새 출발의 신호로 받아들이면 흐름이 풀려요." },
  태: { hanja: "胎", stage: "잉태", keyword: "가능성·구상·불안정한 시작",
    desc: "새 생명이 뱃속에서 막 잉태된 자리로, 아직 형태는 없지만 무한한 가능성을 품고 있어요. 아이디어와 구상이 샘솟지만 아직 현실화되기엔 이르고 불안정해요. 조급하게 결과를 내려 하지 말고, 충분히 구상을 다듬는 시간을 가지는 게 중요해요." },
  양: { hanja: "養", stage: "양육", keyword: "보호·성장 준비·의존",
    desc: "뱃속의 생명이 자라며 보호받는 자리예요. 주변의 도움과 환경의 영향을 많이 받으며 천천히 자기 형태를 갖춰가요. 아직 스스로 모든 걸 책임지긴 어려운 시기라, 좋은 사람·좋은 환경 곁에 머무는 것이 성장에 큰 도움이 돼요." },
};

export function getUunseongDetail(stage: string) {
  return UUNSEONG_DETAIL[stage];
}

// 12신살 (연지 삼합 그룹 기준)
function getSinsal(yeonji: string, jj: string): string {
  const yi = JIJI.indexOf(yeonji);
  const ji = JIJI.indexOf(jj);
  if (yi < 0 || ji < 0) return "";
  // 삼합 그룹별 역마살 기준 지지
  let base: number;
  if ([2,6,10].includes(yi)) base = 8;      // 인오술 → 신(申)
  else if ([8,0,4].includes(yi)) base = 2;  // 신자진 → 인(寅)
  else if ([5,9,1].includes(yi)) base = 11; // 사유축 → 해(亥)
  else base = 5;                             // 해묘미 → 사(巳)
  return SINSAL_NAMES[(ji - base + 12) % 12];
}

// 공망 계산 (일주 기준)
export function getGongmang(dayCg: string, dayJj: string): string[] {
  const ci = CHEONGAN.indexOf(dayCg);
  const ji = JIJI.indexOf(dayJj);
  const sunsuJi = (ji - ci + 12) % 12;
  return [JIJI[(sunsuJi + 10) % 12], JIJI[(sunsuJi + 11) % 12]];
}

// 연주
export function getYearPillar(year: number): {cg: string; jj: string} {
  return { cg: CHEONGAN[(year-4)%10], jj: JIJI[(year-4)%12] };
}

// 월주 — 검증: 1995년 6월 = 신사월 (신=7, 사=5)
// 을해년(1995) → 연간 을(1) → 월간 시작: 무(4)
// 6월(사월) = 무+5 = 계? → 틀림
// 실제: 을경년 기두 무인월 → 6월은 신사월
// 연간 인덱스별 1월(인월) 천간:
// 갑기년=병인, 을경년=무인, 병신년=경인, 정임년=임인, 무계년=갑인
export function getMonthPillar(year: number, month: number, day: number): {cg: string; jj: string} {
  // 절기 기준으로 전통 월(月) 결정
  // 해당 월의 절기 시작일 이전이면 전월로 처리
  let calcMonth = month;
  let calcYear = year;
  if (day < SOLAR_TERM_DAYS[month]) {
    calcMonth = month - 1;
    if (calcMonth === 0) { calcMonth = 12; calcYear = year - 1; }
  }

  // 월간(月干) 계산에 쓰는 연도:
  // 입춘(2월 4일) 이전이면 전년도 기준으로 월간 결정
  let stemYear = year;
  if (month === 1 || (month === 2 && day < SOLAR_TERM_DAYS[2])) {
    stemYear = year - 1;
  }

  const yearCgIdx = ((stemYear - 4) % 10 + 10) % 10;
  // 갑기년 → 병인월(2)부터, 을경년 → 무인월(4)부터
  // 병신년 → 경인월(6)부터, 정임년 → 임인월(8)부터, 무계년 → 갑인월(0)부터
  const startMap: Record<number, number> = {0:2,1:4,2:6,3:8,4:0,5:2,6:4,7:6,8:8,9:0};

  // 전통 월 번호 (인월=1, 묘월=2, ... 축월=12)
  const monthToTraditional: Record<number, number> = {
    2:1, 3:2, 4:3, 5:4, 6:5, 7:6, 8:7, 9:8, 10:9, 11:10, 12:11, 1:12
  };
  // 전통 월 → 지지 인덱스 (인=2, 묘=3, ... 축=1)
  const monthToJijiIdx: Record<number, number> = {
    2:2, 3:3, 4:4, 5:5, 6:6, 7:7, 8:8, 9:9, 10:10, 11:11, 12:0, 1:1
  };

  const traditionalMonth = monthToTraditional[calcMonth];
  const monthCgIdx = (startMap[yearCgIdx] + (traditionalMonth - 1)) % 10;
  return { cg: CHEONGAN[monthCgIdx], jj: JIJI[monthToJijiIdx[calcMonth]] };
}

// 일주 — 기준: 1995.06.02 = 갑자일 (갑=0, 자=0)
export function getDayPillar(year: number, month: number, day: number): {cg: string; jj: string} {
  const jdn = toJDN(year, month, day);
  const BASE_JDN = toJDN(1995, 6, 2);
  const diff = jdn - BASE_JDN;
  const cgIdx = ((0 + diff) % 10 + 10) % 10; // 갑=0
  const jjIdx = ((0 + diff) % 12 + 12) % 12; // 자=0
  return { cg: CHEONGAN[cgIdx], jj: JIJI[jjIdx] };
}

// 시주 — 검증: 갑자일 11시 = 기사시 (기=5, 사=5)
// 오시(11-12시) = 지지인덱스 6
// 11시 04분 → 시지: (11+1)/2 = 6 = 오(午)? → 기오시?
// 실제 기사시: 사시 = 9-11시 (사=5)
// 사시 = 9:00~10:59
// 오시 = 11:00~12:59
// 11:04 → 오시 → 기오시가 맞는데 기사시라고 하심
// 사주에서 시지 경계: 사시 = 9시~11시(10:59)
// 11:00부터는 오시
// 부산 진태양시 보정 후 11:04 - 24분 = 10:40 → 사시! → 기사시 맞음
function getHourPillar(dayCgIdx: number, hour: number, minute: number): {cg: string; jj: string} {
  // 시지 경계 (시작시간 기준)
  // 자=23:00~00:59, 축=01:00~02:59, 인=03:00~04:59, 묘=05:00~06:59
  // 진=07:00~08:59, 사=09:00~10:59, 오=11:00~12:59, 미=13:00~14:59
  // 신=15:00~16:59, 유=17:00~18:59, 술=19:00~20:59, 해=21:00~22:59
  const totalMins = hour * 60 + minute;
  let hourJjIdx: number;
  if (totalMins >= 23*60 || totalMins < 1*60) hourJjIdx = 0;      // 자
  else if (totalMins < 3*60) hourJjIdx = 1;   // 축
  else if (totalMins < 5*60) hourJjIdx = 2;   // 인
  else if (totalMins < 7*60) hourJjIdx = 3;   // 묘
  else if (totalMins < 9*60) hourJjIdx = 4;   // 진
  else if (totalMins < 11*60) hourJjIdx = 5;  // 사
  else if (totalMins < 13*60) hourJjIdx = 6;  // 오
  else if (totalMins < 15*60) hourJjIdx = 7;  // 미
  else if (totalMins < 17*60) hourJjIdx = 8;  // 신
  else if (totalMins < 19*60) hourJjIdx = 9;  // 유
  else if (totalMins < 21*60) hourJjIdx = 10; // 술
  else hourJjIdx = 11;                         // 해

  // 시간 천간: 갑기일=갑자시, 을경일=병자시, 병신일=무자시, 정임일=경자시, 무계일=임자시
  const hourCgStartMap: Record<number, number> = {0:0,1:2,2:4,3:6,4:8,5:0,6:2,7:4,8:6,9:8};
  const hourCgIdx = (hourCgStartMap[dayCgIdx] + hourJjIdx) % 10;
  return { cg: CHEONGAN[hourCgIdx], jj: JIJI[hourJjIdx] };
}

// ── 득령(得令) 판단 ────────────────────────────────────────────────────────
// 일간이 월지(月支) 지장간에서 비겁(같은 오행) 또는 인성(나를 생하는 오행)을 만나면 득령
// 득령이면 신강 방향, 실령이면 신약 방향의 제1 기준
function isDeukllyeong(ilgan: string, monthJj: string): boolean {
  const ilEl = CHEONGAN_ELEMENT[ilgan] as Element;
  const GENERATED_BY: Record<string, Element> = {목:"수",화:"목",토:"화",금:"토",수:"금"};
  const inEl = GENERATED_BY[ilEl]; // 인성 오행
  return (JIJANGAN[monthJj] || []).some(j => j.element === ilEl || j.element === inEl);
}

// ── 용신 계산 ──────────────────────────────────────────────────────────────
// 신강/신약 판단 후 용신(用神)·희신(喜神)·기신(忌神) 결정
// 역생(逆生): 목은 수가 생함, 화→목, 토→화, 금→토, 수→금
// 역극(逆克): 목의 관성=금, 화→수, 토→목, 금→화, 수→토
//
// monthJj: 월지 (득령 판단 + 월령 12운성 패널티)
// dayJj:   일지 (통근 보너스)
function computeYongshin(
  ilgan: string, scores: ElementScore,
  monthJj: string, dayJj: string
): YongsinResult {
  const ilganEl = CHEONGAN_ELEMENT[ilgan] as Element;
  const GENERATED_BY: Record<string, Element> = {목:"수",화:"목",토:"화",금:"토",수:"금"};
  const CONTROLLED_BY: Record<string, Element> = {목:"금",화:"수",토:"목",금:"화",수:"토"};

  const inseongEl  = GENERATED_BY[ilganEl];     // 인성: 나를 생하는
  const siksangEl  = OHAENG_GENERATES[ilganEl]; // 식상: 내가 생하는
  const jaeseongEl = OHAENG_CONTROLS[ilganEl];  // 재성: 내가 극하는
  const gwanseongEl= CONTROLLED_BY[ilganEl];    // 관성: 나를 극하는

  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  const jiwon = scores[ilganEl] + scores[inseongEl]; // 일간을 직·간접 지원하는 기운

  // ── 득령/실령 보정 ──────────────────────────────────────────────────────
  // 1단계: 월지 득령 여부
  const isDG = isDeukllyeong(ilgan, monthJj);
  // 2단계: 월지·일지 12운성으로 추가 보정
  const monthUU = getUunseong(ilgan, monthJj);
  const dayUU   = getUunseong(ilgan, dayJj);
  // 기운이 매우 약해지는 운성
  const WEAK_UU   = new Set(["사","묘","절","병"]);
  // 기운이 강해지는 운성
  const STRONG_UU = new Set(["장생","관대","건록","제왕"]);

  let jiwonAdj = jiwon;
  if (isDG) {
    jiwonAdj *= 1.35; // 득령 → 신강 방향 강화
    if (STRONG_UU.has(monthUU)) jiwonAdj *= 1.10; // 장생·건록·제왕월 추가 보강
  } else {
    jiwonAdj *= 0.75; // 실령 → 신약 방향
    if (WEAK_UU.has(monthUU)) jiwonAdj *= 0.82; // 사·묘·절·병지 추가 패널티
  }
  // 일지 통근 보정 (일지 강·약도 반영, 절반만)
  if (STRONG_UU.has(dayUU)) jiwonAdj *= 1.06;
  else if (WEAK_UU.has(dayUU)) jiwonAdj *= 0.94;

  let strength: "신강" | "신약" | "중화";
  let yongshin: Element;
  let heeshin: Element | undefined;
  let desc: string;

  if (jiwonAdj > total * 0.55) {
    strength = "신강";
    // 강한 일간 → 설기(식상) > 재성 > 관성 중 가장 부족한 것
    const cands: Element[] = [siksangEl, jaeseongEl, gwanseongEl];
    yongshin = cands.reduce((a, b) => scores[a] <= scores[b] ? a : b);
    desc = `일간 ${ilgan}의 기운이 강합니다(신강·身强). ${isDG?"월지 득령(得令)으로 기운이 왕성해요. ":""}강한 에너지를 발산·활용하는 ${yongshin} 기운이 용신이에요. 표현·결과물을 만드는 기운과 돈·사회적 책임의 기운을 활용하는 삶이 유리해요.`;
  } else if (jiwonAdj < total * 0.40) {
    strength = "신약";
    // 신약은 일간을 직접 생조하는 인성(印星)을 우선 용신으로 본다.
    // 단, 인성이 비겁의 절반에도 못 미칠 만큼 빈약하면 비겁(일간과 같은 오행)을 용신으로 삼는다.
    yongshin = scores[inseongEl] >= scores[ilganEl] * 0.5 ? inseongEl : ilganEl;
    heeshin = yongshin === inseongEl ? ilganEl : inseongEl; // 희신: 인성·비겁 중 용신이 되지 못한 나머지
    desc = `일간 ${ilgan}의 기운이 약합니다(신약·身弱). ${!isDG?"월지 실령(失令)으로 기운이 쇠약해요. ":""}나를 도와주는 ${yongshin} 기운이 용신이에요. 보호·학문의 기운과 독립심·자존심의 기운을 보강하는 환경이 유리해요.`;
  } else {
    strength = "중화";
    const els: Element[] = ["목","화","토","금","수"];
    yongshin = els.reduce((a, b) => scores[a] <= scores[b] ? a : b);
    desc = `일간의 기운이 중화(中和)에 가까워요. 가장 부족한 ${yongshin} 기운을 보충해 균형을 유지하는 게 좋아요.`;
  }

  heeshin ??= GENERATED_BY[yongshin] as Element;  // 용신을 생해주는 → 희신
  const gishin  = CONTROLLED_BY[yongshin] as Element; // 용신을 극하는 → 기신

  const percent = Math.max(0, Math.min(100, (jiwonAdj / total) * 100));

  return { strength, percent, yongshin, heeshin, gishin, desc };
}

export function analyzeSaju(input: SajuInput): SajuResult {
  const { birthYear, birthMonth, birthDay, birthHour, birthMinute, birthPlace, useJajasi } = input;

  let localTimeNote = "";
  let adjYear = birthYear;
  let adjMonth = birthMonth;
  let adjDay = birthDay;
  let adjHour = birthHour;
  let adjMinute = birthMinute ?? 0;

  if (birthHour !== null) {
    const localCorr = getLocalTimeCorrection(birthPlace);
    const summerCorr = getSummerTimeCorrection(birthYear, birthMonth);
    const lng = getLongitude(birthPlace);
    localTimeNote = `진태양시 보정: ${localCorr>0?"+":""}${localCorr}분 (경도 ${lng ?? "미확인"})${summerCorr>0?` / 서머타임 -${summerCorr}분`:""}`;

    if (useJajasi) {
      // ─── 야자시/조자시 모드 ───────────────────────────────────────────────
      // 일주(日柱)는 역일(曆日) 기준 시간으로 결정:
      //   야자시(夜子時, 23:00~00:00): 역일상 그날이지만 사주는 다음날 일주 → +1일
      //   조자시(早子時, 00:00~01:00): 역일상 이미 다음날이지만 사주는 전날 일주 → -1일
      const rawH = birthHour;
      if (rawH === 23) {
        // 야자시: 일주 +1일
        adjDay += 1;
        const dim = new Date(adjYear, adjMonth, 0).getDate();
        if (adjDay > dim) { adjDay = 1; adjMonth += 1; }
        if (adjMonth > 12) { adjMonth = 1; adjYear += 1; }
        localTimeNote += " / 야자시(夜子時) 보정: 일주 +1일";
      } else if (rawH === 0) {
        // 조자시: 일주 -1일
        adjDay -= 1;
        if (adjDay < 1) {
          adjMonth -= 1;
          if (adjMonth < 1) { adjMonth = 12; adjYear -= 1; }
          adjDay = new Date(adjYear, adjMonth, 0).getDate();
        }
        localTimeNote += " / 조자시(早子時) 보정: 일주 -1일";
      }
      // 시주(時柱)는 진태양시 보정 후 시간으로 결정 (날짜 변경 없이 시간만)
      let solarMins = birthHour * 60 + (birthMinute ?? 0) + localCorr - summerCorr;
      solarMins = ((solarMins % 1440) + 1440) % 1440; // 0~1439분 범위 정규화
      adjHour = Math.floor(solarMins / 60);
      adjMinute = solarMins % 60;
    } else {
      // ─── 야자시/조자시 미적용: 진태양시가 일주에도 영향 ──────────────────
      let totalMins = birthHour * 60 + (birthMinute ?? 0) + localCorr - summerCorr;
      if (totalMins < 0) {
        totalMins += 24 * 60;
        adjDay -= 1;
        if (adjDay < 1) {
          adjMonth -= 1;
          if (adjMonth < 1) { adjMonth = 12; adjYear -= 1; }
          adjDay = new Date(adjYear, adjMonth, 0).getDate();
        }
      } else if (totalMins >= 24 * 60) {
        totalMins -= 24 * 60;
        adjDay += 1;
        const dim = new Date(adjYear, adjMonth, 0).getDate();
        if (adjDay > dim) { adjDay = 1; adjMonth += 1; }
        if (adjMonth > 12) { adjMonth = 1; adjYear += 1; }
      }
      adjHour = Math.floor(totalMins / 60);
      adjMinute = totalMins % 60;
    }
  }

  const yearPillar = getYearPillar(adjYear);
  const monthPillar = getMonthPillar(adjYear, adjMonth, adjDay);
  const dayPillar = getDayPillar(adjYear, adjMonth, adjDay);
  const dayCgIdx = CHEONGAN.indexOf(dayPillar.cg);

  // ─── 시주 계산용 일간 결정 ────────────────────────────────────────────────
  // 조자시(00~01시) 적용 시: 일주는 전날로 빼지만, 시주는 역일(당일) 기준 일간으로 계산.
  // 예: 1999.09.25 00:22 → 조자시 → 일주=기묘(09.24), 시주=경(09.25 일간)의 자시=병자
  // 야자시(23시) 적용 시: 일주는 다음날 → 시주도 다음날(= adjDay 이미 +1) 일간 기준 → 그대로 dayCgIdx
  let hourDayCgIdx = dayCgIdx;
  if (useJajasi && birthHour !== null && birthHour === 0) {
    // 조자시: 역일(원래 날짜)의 일간으로 시주 계산
    const calendarDayPillar = getDayPillar(birthYear, birthMonth, birthDay);
    hourDayCgIdx = CHEONGAN.indexOf(calendarDayPillar.cg);
  }

  let hourPillar: {cg: string; jj: string} | null = null;
  if (adjHour !== null) {
    hourPillar = getHourPillar(hourDayCgIdx, adjHour, adjMinute);
  }

  const scores: ElementScore = {목:0, 화:0, 토:0, 금:0, 수:0};
  const pillars = [
    {cg: yearPillar.cg, jj: yearPillar.jj, weight: PILLAR_WEIGHTS.year},
    {cg: monthPillar.cg, jj: monthPillar.jj, weight: PILLAR_WEIGHTS.month},
    {cg: dayPillar.cg, jj: dayPillar.jj, weight: PILLAR_WEIGHTS.day},
    ...(hourPillar ? [{cg: hourPillar.cg, jj: hourPillar.jj, weight: PILLAR_WEIGHTS.hour}] : []),
  ];

  pillars.forEach(({cg, jj, weight}) => {
    if (CHEONGAN_ELEMENT[cg]) {
      // 천간 득지/실지: 천간이 자신의 지지에서 어떤 12운성인지로 강도 보정
      const uu = getUunseong(cg, jj);
      const rawFactor = UUNSEONG_CG_FACTOR[uu] ?? 1.0;
      // 양간은 완전 적용, 음간은 72% 적용 (음간 역행 불확실성 보완 + 사지/묘지에서 충분한 약화)
      // 예: 辛이 巳地(死地, rawFactor=0.50)에 앉으면 1+(0.50-1)*0.72=0.64 → 기존 0.75보다 더 약화
      const isYang = CG_YANG_SET.has(cg);
      const cgFactor = isYang ? rawFactor : 1 + (rawFactor - 1) * 0.72;
      scores[CHEONGAN_ELEMENT[cg]] += 1.5 * weight * cgFactor;
    }
    if (JIJANGAN[jj]) {
      JIJANGAN[jj].forEach(({element, weight: w}) => {
        scores[element] += w * weight * 2;
      });
    }
  });

  // 삼합(三合)/방합(方合) 보정 — 지지 조합으로 특정 오행 강화
  const SAMHAP_GROUPS: { group: string[]; core: string; element: Element }[] = [
    { group: ["인","오","술"], core: "오", element: "화" },
    { group: ["사","유","축"], core: "유", element: "금" },
    { group: ["신","자","진"], core: "자", element: "수" },
    { group: ["해","묘","미"], core: "묘", element: "목" },
  ];
  const BANGHAP_GROUPS: { group: string[]; element: Element }[] = [
    { group: ["인","묘","진"], element: "목" },
    { group: ["사","오","미"], element: "화" },
    { group: ["신","유","술"], element: "금" },
    { group: ["해","자","축"], element: "수" },
  ];
  const jijiSet = new Set(pillars.map(p => p.jj));
  for (const { group, core, element } of SAMHAP_GROUPS) {
    const cnt = group.filter(j => jijiSet.has(j)).length;
    if (cnt === 3) scores[element] *= 1.35;
    else if (cnt === 2 && jijiSet.has(core)) scores[element] *= 1.18;
    else if (cnt === 2) scores[element] *= 1.07;
  }
  for (const { group, element } of BANGHAP_GROUPS) {
    const cnt = group.filter(j => jijiSet.has(j)).length;
    if (cnt === 3) scores[element] *= 1.25;
    else if (cnt === 2) {
      const presentIdx = group.map((j, i) => jijiSet.has(j) ? i : -1).filter(i => i >= 0);
      if (presentIdx.length === 2 && presentIdx[1] - presentIdx[0] === 1) scores[element] *= 1.10;
    }
  }

  // 보정 전 원점수: 단순 글자 수 기준 (천간 1개=1점, 지지 정기/본기 1개=1점)
  // 예) 기사/갑자/신사/을해 → 목2(갑·을) 화2(사·사) 토1(기) 금1(신) 수2(자·해)
  const rawScores: ElementScore = {목:0, 화:0, 토:0, 금:0, 수:0};
  pillars.forEach(({cg, jj}) => {
    const cgEl = CHEONGAN_ELEMENT[cg];
    if (cgEl) rawScores[cgEl] += 1;
    const bongiEl = CHEONGAN_ELEMENT[JIJI_BONGI[jj]];
    if (bongiEl) rawScores[bongiEl] += 1;
  });

  // === 천간합 보정 ===
  const CHEONGAN_HAP_CORRECT = [
    {a:"갑",b:"기",el:"토" as Element},{a:"을",b:"경",el:"금" as Element},
    {a:"병",b:"신",el:"수" as Element},{a:"정",b:"임",el:"목" as Element},
    {a:"무",b:"계",el:"화" as Element},
  ];
  const allCgs = pillars.map(p => p.cg);
  for (const hap of CHEONGAN_HAP_CORRECT) {
    if (allCgs.includes(hap.a) && allCgs.includes(hap.b)) {
      const aEl = CHEONGAN_ELEMENT[hap.a];
      const bEl = CHEONGAN_ELEMENT[hap.b];
      const aW = pillars.find(p => p.cg === hap.a)!.weight;
      const bW = pillars.find(p => p.cg === hap.b)!.weight;
      const s = 0.35;
      scores[aEl] = Math.max(0, scores[aEl] - 1.5 * aW * s);
      scores[bEl] = Math.max(0, scores[bEl] - 1.5 * bW * s);
      scores[hap.el] += 1.5 * (aW + bW) * s * 0.5;
    }
  }

  // === 육합 보정 ===
  const YUKHAM_CORRECT = [
    {a:"자",b:"축",el:"토" as Element},{a:"인",b:"해",el:"목" as Element},
    {a:"묘",b:"술",el:"화" as Element},{a:"진",b:"유",el:"금" as Element},
    {a:"사",b:"신",el:"수" as Element},{a:"오",b:"미",el:"토" as Element},
  ];
  const allJjs = pillars.map(p => p.jj);
  for (const hap of YUKHAM_CORRECT) {
    if (allJjs.includes(hap.a) && allJjs.includes(hap.b)) {
      const aEl = CHEONGAN_ELEMENT[JIJI_BONGI[hap.a]];
      const bEl = CHEONGAN_ELEMENT[JIJI_BONGI[hap.b]];
      // 육합: 삼합×1.3 비율 → shift 0.45 (이전 0.3에서 상향)
      scores[aEl] = Math.max(0, scores[aEl] - 0.45);
      scores[bEl] = Math.max(0, scores[bEl] - 0.45);
      scores[hap.el] += 0.45;
    }
  }

  // === 암합 보정 (暗合) ===
  // 지지 본기(정기) 천간 간 천간합 관계 → 육합의 약 50% 강도 (s=0.22)
  // 겉으로 드러나지 않는 은밀한 합화 → 두 오행 약화 후 합화 오행 생성
  const AMHAP_JIJI_CORRECT = [
    {a:"인", b:"미", el:"토" as Element},  // 갑기합: 인(본기甲) + 미(본기己)
    {a:"인", b:"축", el:"토" as Element},  // 갑기합: 인(본기甲) + 축(본기己)
    {a:"묘", b:"신", el:"금" as Element},  // 을경합: 묘(본기乙) + 신(본기庚)
    {a:"사", b:"유", el:"수" as Element},  // 병신합: 사(본기丙) + 유(본기辛—실제 경이지만 신과 같은 금)
    {a:"오", b:"해", el:"목" as Element},  // 정임합: 오(본기丁) + 해(본기壬)
    {a:"진", b:"자", el:"화" as Element},  // 무계합: 진(본기戊) + 자(본기癸)
    {a:"술", b:"자", el:"화" as Element},  // 무계합: 술(본기戊) + 자(본기癸)
  ];
  for (const hap of AMHAP_JIJI_CORRECT) {
    if (allJjs.includes(hap.a) && allJjs.includes(hap.b)) {
      const aEl = CHEONGAN_ELEMENT[JIJI_BONGI[hap.a]];
      const bEl = CHEONGAN_ELEMENT[JIJI_BONGI[hap.b]];
      const s = 0.22;
      scores[aEl] = Math.max(0, scores[aEl] - s);
      scores[bEl] = Math.max(0, scores[bEl] - s);
      scores[hap.el] += s;
    }
  }

  // === 삼합 보정 (궁성 가중치 + 합화 오행 전환만) ===
  // 핵심: 합화 오행과 이미 같은 branch(예: 인오술화국에서 오午=화)는 감소 없음
  //        술토처럼 합화 오행과 다른 것만 원래 오행 감소 → 합화 오행 증가
  //        월지(令星)에 해당 지지가 있으면 합화 강도 강화
  const SAMHAP_CORRECT = [
    {branches:["인","오","술"], center:"오", el:"화" as Element},
    {branches:["해","묘","미"], center:"묘", el:"목" as Element},
    {branches:["신","자","진"], center:"자", el:"수" as Element},
    {branches:["사","유","축"], center:"유", el:"금" as Element},
  ];
  for (const hap of SAMHAP_CORRECT) {
    const found = hap.branches.filter(b => allJjs.includes(b));
    if (found.length < 2) continue;

    const hasCenter = found.includes(hap.center);
    // 성립 강도: 완전삼합 100% / 반합(중심지 포함) 65% / 반합(중심지 없음) 40%
    const baseRate = found.length >= 3 ? 1.0 : (hasCenter ? 0.65 : 0.40);
    // 월지(令星)에 해당 지지 포함 시 합화 강도 40% 강화
    const monthBonus = found.includes(monthPillar.jj) ? 1.40 : 1.0;
    const effectiveRate = baseRate * monthBonus;

    let toAdd = 0;
    for (const b of found) {
      const origEl = CHEONGAN_ELEMENT[JIJI_BONGI[b]];
      // 이미 합화 오행과 같으면 감소 없음 (예: 오午는 이미 화, 자子는 이미 수)
      if (origEl === hap.el) continue;
      // 궁성 가중치 적용
      const pWeight = pillars.find(p => p.jj === b)?.weight ?? 1.0;
      const shift = effectiveRate * pWeight * 0.70; // 삼합×1.8 기준, 완전삼합 최강
      scores[origEl] = Math.max(0, scores[origEl] - shift);
      toAdd += shift; // 100% 전환 (이전 0.9에서 상향)
    }
    scores[hap.el] += toAdd;
  }

  // === 방합 보정 (方合) ===
  // 방합: 같은 계절 지지 3개가 모여 해당 오행 강화 (삼합의 ~89% 강도 = ×1.6)
  // 인묘진=목, 사오미=화, 신유술=금, 해자축=수
  // 합화 오행과 이미 같은 지지(인=목·묘=목, 사=화·오=화 등)는 감소 없음, 나머지 토만 전환
  const BANGHAP_CORRECT = [
    {branches:["인","묘","진"], el:"목" as Element},
    {branches:["사","오","미"], el:"화" as Element},
    {branches:["신","유","술"], el:"금" as Element},
    {branches:["해","자","축"], el:"수" as Element},
  ];
  for (const hap of BANGHAP_CORRECT) {
    const found = hap.branches.filter(b => allJjs.includes(b));
    if (found.length < 3) continue; // 방합은 3개 완전히 있어야만 보정
    const baseRate = 0.62;
    const monthBonus = found.includes(monthPillar.jj) ? 1.30 : 1.0;
    const effectiveRate = baseRate * monthBonus;
    let toAdd = 0;
    for (const b of found) {
      const origEl = CHEONGAN_ELEMENT[JIJI_BONGI[b]];
      if (origEl === hap.el) continue; // 이미 합화 오행이면 skip
      const pWeight = pillars.find(p => p.jj === b)?.weight ?? 1.0;
      const shift = effectiveRate * pWeight;
      scores[origEl] = Math.max(0, scores[origEl] - shift);
      toAdd += shift;
    }
    scores[hap.el] += toAdd;
  }

  // === 조후 보정 (월지 계절 기준) ===
  // 조후(調候) 보정: 월지 계절이 해당 오행에 강한 시기 → 점수 boost
  // 월령이 득령(旺相)인 오행은 추가 강화 (포스텔러 계열 기준)
  const JOHU_BOOST: Record<string, Partial<Record<Element, number>>> = {
    인:{목:1.0}, 묘:{목:1.5}, 진:{목:0.7,토:0.4},
    사:{화:1.0}, 오:{화:1.5}, 미:{화:0.7,토:0.4},
    신:{금:1.0}, 유:{금:1.5}, 술:{금:0.7,토:0.4},
    해:{수:1.0}, 자:{수:1.5}, 축:{수:0.7,토:0.4},
  };
  const johuBoost = JOHU_BOOST[monthPillar.jj];
  if (johuBoost) {
    for (const [el, val] of Object.entries(johuBoost) as [Element, number][]) {
      scores[el] = (scores[el] || 0) + val;
    }
  }

  // === 천간충 보정 (갑경충·을신충·병임충·정계충) ===
  // 충은 서로 에너지를 소모시킴 → 두 오행 모두 약화
  const CHEONGAN_CHUNG_CORRECT = [
    {a:"갑", b:"경", aEl:"목" as Element, bEl:"금" as Element},
    {a:"을", b:"신", aEl:"목" as Element, bEl:"금" as Element},
    {a:"병", b:"임", aEl:"화" as Element, bEl:"수" as Element},
    {a:"정", b:"계", aEl:"화" as Element, bEl:"수" as Element},
  ];
  for (const chung of CHEONGAN_CHUNG_CORRECT) {
    if (allCgs.includes(chung.a) && allCgs.includes(chung.b)) {
      const aW = pillars.find(p => p.cg === chung.a)?.weight ?? 1.0;
      const bW = pillars.find(p => p.cg === chung.b)?.weight ?? 1.0;
      const s = 0.22; // 합(0.35)보다 약하게
      scores[chung.aEl] = Math.max(0, scores[chung.aEl] - 1.5 * aW * s);
      scores[chung.bEl] = Math.max(0, scores[chung.bEl] - 1.5 * bW * s);
    }
  }

  // === 지지충 보정 (地支沖) ===
  // 충: 상극 지지끼리 충돌 → 양쪽 오행 모두 약화 (에너지 소모)
  // 강도: 육합의 ~67% = 0.30 × 궁성가중치
  const JIJI_CHUNG_CORRECT = [
    {a:"자", b:"오", aEl:"수" as Element, bEl:"화" as Element},
    {a:"축", b:"미", aEl:"토" as Element, bEl:"토" as Element},
    {a:"인", b:"신", aEl:"목" as Element, bEl:"금" as Element},
    {a:"묘", b:"유", aEl:"목" as Element, bEl:"금" as Element},
    {a:"진", b:"술", aEl:"토" as Element, bEl:"토" as Element},
    {a:"사", b:"해", aEl:"화" as Element, bEl:"수" as Element},
  ];
  for (const chung of JIJI_CHUNG_CORRECT) {
    if (allJjs.includes(chung.a) && allJjs.includes(chung.b)) {
      const aW = pillars.find(p => p.jj === chung.a)?.weight ?? 1.0;
      const bW = pillars.find(p => p.jj === chung.b)?.weight ?? 1.0;
      const s = 0.30;
      scores[chung.aEl] = Math.max(0, scores[chung.aEl] - aW * s);
      scores[chung.bEl] = Math.max(0, scores[chung.bEl] - bW * s);
    }
  }

  // === 지지형 보정 (地支刑) ===
  // 형: 충의 ~67% 강도 = 0.20 (삼형 완전) / 0.14 (이형·반삼형)
  // 인사신 삼형, 축술미 삼형, 자묘 이형
  const jjSet2 = new Set(allJjs);
  // 인사신 삼형 (지세지형) — 3개 모두 있어야 성립 (2개는 삼형 아님)
  const inSaSin = ["인","사","신"].filter(b => jjSet2.has(b));
  if (inSaSin.length >= 3) {
    for (const b of inSaSin) {
      const el = CHEONGAN_ELEMENT[JIJI_BONGI[b]];
      const w = pillars.find(p => p.jj === b)?.weight ?? 1.0;
      scores[el] = Math.max(0, scores[el] - w * 0.20);
    }
  }
  // 축술미 삼형 (무은지형) — 3개 모두 있어야 완전삼형, 2개는 경미한 이형 보정
  const chukSulMi = ["축","술","미"].filter(b => jjSet2.has(b));
  if (chukSulMi.length >= 3) {
    for (const b of chukSulMi) {
      const el = CHEONGAN_ELEMENT[JIJI_BONGI[b]];
      const w = pillars.find(p => p.jj === b)?.weight ?? 1.0;
      scores[el] = Math.max(0, scores[el] - w * 0.20);
    }
  } else if (chukSulMi.length === 2) {
    for (const b of chukSulMi) {
      const el = CHEONGAN_ELEMENT[JIJI_BONGI[b]];
      const w = pillars.find(p => p.jj === b)?.weight ?? 1.0;
      scores[el] = Math.max(0, scores[el] - w * 0.10);
    }
  }
  // 자묘 이형 (무례지형)
  if (jjSet2.has("자") && jjSet2.has("묘")) {
    const jaW = pillars.find(p => p.jj === "자")?.weight ?? 1.0;
    const myoW = pillars.find(p => p.jj === "묘")?.weight ?? 1.0;
    scores["수"] = Math.max(0, scores["수"] - jaW * 0.14);
    scores["목"] = Math.max(0, scores["목"] - myoW * 0.14);
  }

  // === 지지파 보정 (地支破) ===
  // 파: 형의 ~60% = 0.12 × 궁성가중치
  const JIJI_PA_CORRECT = [
    {a:"자", b:"유", aEl:"수" as Element, bEl:"금" as Element},
    {a:"오", b:"묘", aEl:"화" as Element, bEl:"목" as Element},
    {a:"인", b:"해", aEl:"목" as Element, bEl:"수" as Element},
    {a:"사", b:"신", aEl:"화" as Element, bEl:"금" as Element},
    {a:"진", b:"축", aEl:"토" as Element, bEl:"토" as Element},
    {a:"술", b:"미", aEl:"토" as Element, bEl:"토" as Element},
  ];
  for (const pa of JIJI_PA_CORRECT) {
    if (allJjs.includes(pa.a) && allJjs.includes(pa.b)) {
      const aW = pillars.find(p => p.jj === pa.a)?.weight ?? 1.0;
      const bW = pillars.find(p => p.jj === pa.b)?.weight ?? 1.0;
      const s = 0.12;
      scores[pa.aEl] = Math.max(0, scores[pa.aEl] - aW * s);
      scores[pa.bEl] = Math.max(0, scores[pa.bEl] - bW * s);
    }
  }

  // === 지지해 보정 (地支害/穿) ===
  // 해: 파의 ~58% = 0.07 × 궁성가중치
  const JIJI_HAE_CORRECT = [
    {a:"자", b:"미", aEl:"수" as Element, bEl:"토" as Element},
    {a:"축", b:"오", aEl:"토" as Element, bEl:"화" as Element},
    {a:"인", b:"사", aEl:"목" as Element, bEl:"화" as Element},
    {a:"묘", b:"진", aEl:"목" as Element, bEl:"토" as Element},
    {a:"신", b:"해", aEl:"금" as Element, bEl:"수" as Element},
    {a:"유", b:"술", aEl:"금" as Element, bEl:"토" as Element},
  ];
  for (const hae of JIJI_HAE_CORRECT) {
    if (allJjs.includes(hae.a) && allJjs.includes(hae.b)) {
      const aW = pillars.find(p => p.jj === hae.a)?.weight ?? 1.0;
      const bW = pillars.find(p => p.jj === hae.b)?.weight ?? 1.0;
      const s = 0.07;
      scores[hae.aEl] = Math.max(0, scores[hae.aEl] - aW * s);
      scores[hae.bEl] = Math.max(0, scores[hae.bEl] - bW * s);
    }
  }

  // === pillarsDetail 계산 ===
  const ilgan = dayPillar.cg;
  const yeonji = yearPillar.jj;
  const buildDetail = (cg: string, jj: string): PillarDetail => ({
    cg, jj,
    sipseongCg: getSipseong(ilgan, cg),
    sipseongJj: getSipseong(ilgan, JIJI_BONGI[jj] || ""),
    uunseong: getUunseong(ilgan, jj),
    sinsal: getSinsal(yeonji, jj),
    jijangan: JIJANGAN_STR[jj] || "",
  });
  const pillarsDetail = {
    year: buildDetail(yearPillar.cg, yearPillar.jj),
    month: buildDetail(monthPillar.cg, monthPillar.jj),
    day: buildDetail(dayPillar.cg, dayPillar.jj),
    ...(hourPillar ? {hour: buildDetail(hourPillar.cg, hourPillar.jj)} : {}),
  };

  // === 신살 분석 ===
  const detailArr = [
    {label:'연', d: pillarsDetail.year},
    {label:'월', d: pillarsDetail.month},
    {label:'일', d: pillarsDetail.day},
    ...(pillarsDetail.hour ? [{label:'시', d: pillarsDetail.hour}] : []),
  ];
  const sinsalList: SinsalItem[] = [];
  const addSinsal = (name: string, affected: string[]) => {
    if (affected.length === 0) return;
    const info = SINSAL_INFO[name];
    if (!info) return;
    sinsalList.push({name, hanja:info.hanja, pillars:affected, desc:info.desc, category:info.category});
  };

  // 12신살 중 주요 항목 (pillar별 sinsal 값에서 추출)
  for (const ss of ['역마살','장성살','화개살','반안살','겁살','재살','망신살','지살','천살','월살','년살','육해살']) {
    addSinsal(ss, detailArr.filter(p => p.d.sinsal === ss).map(p => p.label));
  }
  // 도화살 (연지 삼합그룹 기준 도화 지지) — 기존 호환을 위해 플래그는 유지하되,
  // 매력 점수 산정을 위해 자리한 위치 개수에 따라 가도화(1~2자리)/편야도화(3자리 이상)로 세분화한다.
  const dohwaPillars = detailArr.filter(p => p.d.jj === getDohwaJj(yeonji)).map(p => p.label);
  addSinsal('도화살', dohwaPillars);
  if (dohwaPillars.length >= 3) {
    addSinsal('편야도화', dohwaPillars);
  } else if (dohwaPillars.length > 0) {
    addSinsal('가도화', dohwaPillars);
  }
  // 천을귀인
  const cheonulJjs = CHEONUL_JJ[ilgan] || [];
  addSinsal('천을귀인', detailArr.filter(p => cheonulJjs.includes(p.d.jj)).map(p => p.label));
  // 태극귀인: 일간 기준으로 연지만 확인
  const taegeukJjs = TAEGEUK_JJ[ilgan] || [];
  addSinsal('태극귀인', detailArr.filter(p => p.label === '연' && taegeukJjs.includes(p.d.jj)).map(p => p.label));
  // 문곡귀인
  addSinsal('문곡귀인', detailArr.filter(p => p.d.jj === MUNGOK_JJ[ilgan]).map(p => p.label));
  // 홍염살
  addSinsal('홍염살', detailArr.filter(p => p.d.jj === HONGYEOM_JJ[ilgan]).map(p => p.label));
  // 양인살
  addSinsal('양인살', detailArr.filter(p => p.d.jj === YANGIN_JJ[ilgan]).map(p => p.label));
  // 음인(陰刃): 음간 일간만 해당
  if (YINYIN_JJ[ilgan]) {
    addSinsal('음인', detailArr.filter(p => p.d.jj === YINYIN_JJ[ilgan]).map(p => p.label));
  }
  // 나체도화: 갑자·정묘·경오·계유 일주
  if (NACHE_ILJU.has(dayPillar.cg + dayPillar.jj)) {
    addSinsal('나체도화', ['일']);
  }
  // 곤랑도화(滾浪桃花): 두 기둥의 천간이 합(合)을 이루면서 동시에 지지가 자묘형(子卯刑, 왕지형)을 이루는 구조
  // (예: 병자일주+신묘시, 갑자일주+기묘시, 계무일주+무자시 등 — 천간합 + 자묘형)
  {
    const HAP_PAIRS = [["갑","기"],["을","경"],["병","신"],["정","임"],["무","계"]];
    const HYEONG_PAIRS = [["자","묘"]];
    const isHap = (a:string,b:string) => HAP_PAIRS.some(([x,y]) => (a===x&&b===y)||(a===y&&b===x));
    const isHyeong = (a:string,b:string) => HYEONG_PAIRS.some(([x,y]) => (a===x&&b===y)||(a===y&&b===x));
    let gonglangFound: string[] = [];
    for (let i = 0; i < detailArr.length; i++) {
      for (let j = i + 1; j < detailArr.length; j++) {
        const a = detailArr[i], b = detailArr[j];
        if (isHap(a.d.cg, b.d.cg) && isHyeong(a.d.jj, b.d.jj)) {
          gonglangFound = [a.label, b.label];
        }
      }
    }
    addSinsal('곤랑도화', gonglangFound);
  }
  // 녹방도화(祿傍桃花): 도화 지지를 가진 기둥이 건록(運星) 또는 정관(十神)과 함께 자리할 때
  {
    const dohwaJjForNokbang = getDohwaJj(yeonji);
    const nokbangPillars = detailArr
      .filter(p => p.d.jj === dohwaJjForNokbang && (p.d.uunseong === '건록' || getSipseong(ilgan, p.d.cg) === '정관'))
      .map(p => p.label);
    addSinsal('녹방도화', nokbangPillars);
  }
  // 낙정관살: 연지 그룹 기준 지지가 사주에 존재
  const nakjeongTarget = NAKJEONG_MAP[yeonji];
  if (nakjeongTarget) {
    const nakHits = detailArr.filter(p => p.d.jj === nakjeongTarget).map(p => p.label);
    if (nakHits.length > 0) addSinsal('낙정관살', nakHits);
  }
  // 과숙살
  addSinsal('과숙살', detailArr.filter(p => p.d.jj === getGwasukJj(yeonji)).map(p => p.label));
  // 평두살: 년간이나 월간에 갑·경 + 일지가 자·오·묘·유
  if ((pillarsDetail.year.cg === "갑" || pillarsDetail.year.cg === "경" || pillarsDetail.month.cg === "갑" || pillarsDetail.month.cg === "경") && ["자","오","묘","유"].includes(pillarsDetail.day.jj)) {
    addSinsal("평두살", ["일"]);
  }
  // 천라지망: 술+해(天羅), 진+사(地網)
  const jjSet = new Set(detailArr.map(p => p.d.jj));
  const hasCheonra = jjSet.has('술') && jjSet.has('해');
  const hasJimang  = jjSet.has('진') && jjSet.has('사');
  if (hasCheonra || hasJimang) {
    const affected: string[] = [];
    detailArr.forEach(p => {
      if ((hasCheonra && (p.d.jj==='술'||p.d.jj==='해')) ||
          (hasJimang  && (p.d.jj==='진'||p.d.jj==='사'))) affected.push(p.label);
    });
    addSinsal('천라지망', [...new Set(affected)]);
  }

  // 금여성
  addSinsal('금여성', detailArr.filter(p => p.d.jj === GEUMYEO_JJ[ilgan]).map(p => p.label));
  // 암록
  addSinsal('암록', detailArr.filter(p => p.d.jj === AMROK_JJ[ilgan]).map(p => p.label));
  // 천주귀인
  addSinsal('천주귀인', detailArr.filter(p => p.d.jj === CHEONJU_JJ[ilgan]).map(p => p.label));
  // 진도화: 일지의 도화 지지가 연주 or 월주 지지에 존재할 때
  const iljiDohwa = getDohwaJj(dayPillar.jj);
  const jinDohwaLabels = detailArr.filter(p =>
    (p.label === '연' || p.label === '월') && p.d.jj === iljiDohwa
  ).map(p => p.label);
  addSinsal('진도화', jinDohwaLabels);
  // 백호살: 사주의 어느 기둥이든 천간+지지 조합이 일치하면 성립
  {
    const baekhoLabels = detailArr.filter(p => BAEHO_ILJU.has(p.d.cg + p.d.jj)).map(p => p.label);
    if (baekhoLabels.length > 0) {
      const info = SINSAL_INFO['백호살'];
      const hasIlju = baekhoLabels.includes('일');
      let desc = info.desc;
      if (baekhoLabels.length >= 2) {
        desc += `. 백호살이 ${baekhoLabels.length}개 기둥에 겹쳐 있어 그 기질이 더욱 강하게 드러나요`;
      } else if (hasIlju) {
        desc += `. 태어난 날 기둥에 자리해 그 기질이 평소 성격으로 강하게 나타나요`;
      }
      sinsalList.push({ name: '백호살', hanja: info.hanja, pillars: baekhoLabels, desc, category: info.category });
    }
  }
  // 의처살(남)·의부살(여): 일주(일간+일지) + 성별 조합 (일지 정재/정관 암합)
  {
    const uuEntry = UICHEO_UIBU_DATA[dayPillar.cg + dayPillar.jj];
    if (uuEntry && uuEntry.gender === input.gender) {
      const name = input.gender === 'male' ? '의처살' : '의부살';
      const info = SINSAL_INFO[name];
      sinsalList.push({
        name, hanja: info.hanja, pillars: ['일'],
        desc: getUicheoUibuNarrative(dayPillar.cg, dayPillar.jj, input.gender, yeonji, jjSet),
        category: info.category,
      });
    }
  }
  // 귀문관살: 사주 내 지지 쌍 조합
  for (const pair of GWIMUN_PAIRS) {
    if (jjSet.has(pair[0]) && jjSet.has(pair[1])) {
      addSinsal('귀문관살', detailArr.filter(p => pair.includes(p.d.jj)).map(p => p.label));
      break;
    }
  }
  // 원진살
  for (const pair of WONJIN_PAIRS) {
    if (jjSet.has(pair[0]) && jjSet.has(pair[1])) {
      addSinsal('원진살', detailArr.filter(p => pair.includes(p.d.jj)).map(p => p.label));
      break;
    }
  }
  // 천덕귀인: 월지 기준, 해당 값이 사주에서 천간이나 지지로 존재하면 해당 기둥 표시
  const cheondukInfo = CHEONDUK_MAP[monthPillar.jj];
  if (cheondukInfo) {
    if (cheondukInfo.type === 'cg') {
      addSinsal('천덕귀인', detailArr.filter(p => p.d.cg === cheondukInfo.value).map(p => p.label));
    } else {
      addSinsal('천덕귀인', detailArr.filter(p => p.d.jj === cheondukInfo.value).map(p => p.label));
    }
  }
  // 월덕귀인: 월지 기준 천간
  const woldeokCg = WOLDEOK_CG[monthPillar.jj];
  if (woldeokCg) {
    addSinsal('월덕귀인', detailArr.filter(p => p.d.cg === woldeokCg).map(p => p.label));
  }
  // 공망: 일주 기준으로 공망 지지 두 개 → 해당 지지를 가진 기둥
  const gongmangJjs = getGongmang(dayPillar.cg, dayPillar.jj);
  addSinsal('공망', detailArr.filter(p => gongmangJjs.includes(p.d.jj)).map(p => p.label));
  // 고신살: 연지 기준
  const gosinJj = GOSIN_JJ[yeonji];
  if (gosinJj) {
    addSinsal('고신살', detailArr.filter(p => p.d.jj === gosinJj).map(p => p.label));
  }
  // 문창귀인
  addSinsal('문창귀인', detailArr.filter(p => p.d.jj === MUNCHANG_JJ[ilgan]).map(p => p.label));
  // 학당귀인
  addSinsal('학당귀인', detailArr.filter(p => p.d.jj === HAKDANG_JJ[ilgan]).map(p => p.label));
  // 괴강살: 일주 조합
  if (GOEGANG_ILJU.has(dayPillar.cg + dayPillar.jj)) {
    addSinsal('괴강살', ['일']);
  }
  // 사묘절: 각 기둥의 12운성이 사/묘/절이면 등록
  for (const {label, d} of detailArr) {
    if (d.uunseong === '사') addSinsal('사지', [label]);
    else if (d.uunseong === '묘') addSinsal('묘지', [label]);
    else if (d.uunseong === '절') addSinsal('절지', [label]);
  }

  // 현침살: 甲·辛(천간) 또는 卯·午·未·申(지지)에 해당하는 글자를 가진 기둥
  const HYEONCHIM_CG = new Set(["갑", "신"]);
  const HYEONCHIM_JJ = new Set(["묘", "오", "미", "신"]);
  const hyeonchimHits = detailArr
    .filter(p => HYEONCHIM_CG.has(p.d.cg) || HYEONCHIM_JJ.has(p.d.jj))
    .map(p => p.label);
  if (hyeonchimHits.length > 0) addSinsal("현침살", hyeonchimHits);

  // === 지지충(六沖) 신살 등록 ===
  const JIJI_CHUNG_SINSAL = [
    {a:"자", b:"오", name:"자오충"},
    {a:"축", b:"미", name:"축미충"},
    {a:"인", b:"신", name:"인신충"},
    {a:"묘", b:"유", name:"묘유충"},
    {a:"진", b:"술", name:"진술충"},
    {a:"사", b:"해", name:"사해충"},
  ] as const;
  for (const cs of JIJI_CHUNG_SINSAL) {
    if (jjSet.has(cs.a) && jjSet.has(cs.b)) {
      addSinsal(cs.name, detailArr.filter(p => p.d.jj === cs.a || p.d.jj === cs.b).map(p => p.label));
    }
  }

  // === 삼형살(三刑殺) 및 형(刑) 신살 등록 ===
  // 인사신 삼형(지세지형): 3개 모두 있어야 삼형 성립
  const inSaSinF = detailArr.filter(p => ["인","사","신"].includes(p.d.jj));
  if (inSaSinF.length >= 3) {
    addSinsal('인사신삼형', inSaSinF.map(p => p.label));
  }
  // 축술미 삼형(무은지형): 3개 모두 있어야 삼형 성립
  const chukSulMiF = detailArr.filter(p => ["축","술","미"].includes(p.d.jj));
  if (chukSulMiF.length >= 3) {
    addSinsal('축술미삼형', chukSulMiF.map(p => p.label));
  }
  // 자묘형(무례지형)
  if (jjSet.has("자") && jjSet.has("묘")) {
    addSinsal('자묘형', detailArr.filter(p => p.d.jj === "자" || p.d.jj === "묘").map(p => p.label));
  }
  // 자형살(自刑殺): 진진·오오·유유·해해 — 같은 지지가 2기둥 이상
  const selfFormCnt: Record<string, string[]> = {};
  for (const {label, d} of detailArr) {
    selfFormCnt[d.jj] = selfFormCnt[d.jj] || [];
    selfFormCnt[d.jj].push(label);
  }
  const selfFormMap: Record<string, string> = {
    해: "해해형", 오: "오오형", 유: "유유형", 진: "진진형",
  };
  for (const b of ["진","오","유","해"]) {
    const affected = selfFormCnt[b] || [];
    if (affected.length >= 2) addSinsal(selfFormMap[b], [...new Set(affected)]);
  }

  // === 지지파(地支破) 신살 등록 ===
  const JIJI_PA_SINSAL_PAIRS = [
    {a:"자", b:"유"}, {a:"오", b:"묘"}, {a:"인", b:"해"},
    {a:"사", b:"신"}, {a:"진", b:"축"}, {a:"술", b:"미"},
  ];
  const paAffected: string[] = [];
  for (const pa of JIJI_PA_SINSAL_PAIRS) {
    if (jjSet.has(pa.a) && jjSet.has(pa.b)) {
      detailArr.filter(p => p.d.jj === pa.a || p.d.jj === pa.b).forEach(p => paAffected.push(p.label));
    }
  }
  if (paAffected.length > 0) addSinsal('지지파', [...new Set(paAffected)]);

  // === 지지해(地支害/穿) 신살 등록 ===
  const JIJI_HAE_SINSAL_PAIRS = [
    {a:"자", b:"미"}, {a:"축", b:"오"}, {a:"인", b:"사"},
    {a:"묘", b:"진"}, {a:"신", b:"해"}, {a:"유", b:"술"},
  ];
  const haeAffected: string[] = [];
  for (const hae of JIJI_HAE_SINSAL_PAIRS) {
    if (jjSet.has(hae.a) && jjSet.has(hae.b)) {
      detailArr.filter(p => p.d.jj === hae.a || p.d.jj === hae.b).forEach(p => haeAffected.push(p.label));
    }
  }
  if (haeAffected.length > 0) addSinsal('지지해', [...new Set(haeAffected)]);

  const elements: Element[] = ["목","화","토","금","수"];
  const sorted = [...elements].sort((a,b) => scores[b]-scores[a]);
  const dominant = sorted.slice(0,2).filter(e => scores[e] >= 2);
  const lacking = sorted.slice(-2).filter(e => scores[e] <= 2);

  // 시일월연 순서
  const fourPillarsStr = [
    hourPillar ? `${hourPillar.cg}${hourPillar.jj}` : "??",
    `${dayPillar.cg}${dayPillar.jj}`,
    `${monthPillar.cg}${monthPillar.jj}`,
    `${yearPillar.cg}${yearPillar.jj}`,
  ].join(" ");

  const yongshin = computeYongshin(ilgan, scores, monthPillar.jj, dayPillar.jj);

  return {
    scores, rawScores, dominant, lacking,
    personality: generatePersonality(dominant, lacking, input.name),
    wallpaperTheme: generateWallpaperTheme(lacking, scores),
    fourPillars: fourPillarsStr,
    localTimeNote,
    pillarsDetail,
    sinsalList,
    yongshin,
  };
}

// 일간(日干)별 성격 핵심 요약
export const ILGAN_PERSONALITY: Record<string, { short: string; detail: string; keyword: string }> = {
  갑: {
    short: "갑목(甲木) — 곧게 뻗는 큰 나무",
    keyword: "추진력·목표지향·리더십",
    detail: "명리학적으로 '어린이'의 기운이에요. 일단 저질러 놓고 보는 실행력이 있어요. '나 안 건들면 너도 안 건들여' 기질로 자유를 중시하고 권위를 싫어해요. 실패해도 그러려니 하고 다시 꿈을 꿉니다. 폼을 중시하고 자기개발에 집착해요. 겉으론 '상관없어'라도 머릿속은 빠르게 계산해요. 돈 관련 기운이 土에 해당해서 부동산·실물 자산에서 재물운이 강해요.",
  },
  을: {
    short: "을목(乙木) — 유연한 넝쿨·풀",
    keyword: "섬세함·적응력·장인정신",
    detail: "환경에 유연하게 적응하는 넝쿨 같은 기질이에요. 섬세한 미적 감각과 장인정신이 강해요. 혼자보다 든든한 지지대가 있을 때 더 높이 올라갑니다. 직관과 감각으로 상황을 빠르게 파악해요.",
  },
  병: {
    short: "병화(丙火) — 하늘의 태양",
    keyword: "외향성·인기·에너지",
    detail: "태양처럼 밝고 외향적이에요. 자연스럽게 주변을 끌어당기는 인기 기질이 있어요. 에너지 발산이 강하며 과시욕도 있어요. 넓고 따뜻하지만 빛이 강한 만큼 그늘도 깊어요.",
  },
  정: {
    short: "정화(丁火) — 촛불·등불",
    keyword: "집중력·예리함·섬세함",
    detail: "하나에 집중하면 깊이 파고드는 예리한 직관력을 가집니다. 따뜻하지만 섬세하고 까다롭어요. 외면보다 내면의 확신이 중요하며, 감정 기복이 있지만 신의가 강해요.",
  },
  무: {
    short: "무토(戊土) — 광활한 황무지·큰 산",
    keyword: "맷집·합리화·안과밖 온도차",
    detail: "상남자 기질 투탑 중 하나이에요. '상관없어'라고 하면 진짜 상관없어요. 무서워하는 것이 없어요. 목극토(木克土)여서 갑목이 극해도 황무지가 너무 광대해 나무가 덮어봐야 마사지 수준이에요. 충조차 안 맞어요. 내 사람에게는 절대적 의리를 보이지만, 그 논리는 외부에 통하지 않어요. 안과 밖의 평가가 극명하게 다르고 예기치 못한 상황에서 폭발적인 말과 행동이 나올 수 있어요. 내부 결속이 강한 만큼 외부에는 배타적으로 보이에요.",
  },
  기: {
    short: "기토(己土) — 비옥한 정원·논밭",
    keyword: "세심함·실용성·관리력",
    detail: "꼼꼼하고 부지런하며 실용적이에요. 관리하고 가꾸는 능력이 뛰어납니다. 작은 차이에서 큰 성과를 만들어내는 내공이 있어요. 집착보다는 일관된 노력으로 결과를 만듭니다.",
  },
  경: {
    short: "경금(庚金) — 도끼·원석 바위",
    keyword: "결단력·직선성·실행력",
    detail: "상남자 기질 투탑 중 하나이에요. 강렬하고 단호하며 직선적이에요. 결단하면 곧바로 실행해요. 감정 표현은 서툴지만 진심이 두텁어요. 글로벌 표준을 만드는 힘이 있어요. 겉으로는 단단한 돌덩이처럼 보이지만 속은 의외로 여리고 진실한 편이에요. 맡은 일을 남에게 떠넘기거나 회피하지 않고 끝까지 책임지려 해서 자연스럽게 리더 역할을 맡게 되는 경우가 많아요. 다만 애교나 화려한 말로 마음을 표현하는 데는 서툴러서, 위로가 필요한 순간에도 위로보다 실질적인 해결책을 먼저 내놓다가 '공감을 못 해준다'는 오해를 사기 쉬워요. 본인은 최선을 다해 마음을 보여주고 있는데, 그 방식이 상대가 원하는 표현과 달라서 다툼이 생기는 경우가 종종 있어요. 대신 한번 마음을 주면 계산하지 않고 직진하는 스타일이에요. 화려한 언변보다 행동과 실천으로 신뢰를 쌓아가고, 통수를 맞아도 다시 마음을 여는 용기를 가진 편이에요. 헤어진 뒤에는 겉으로 미련 없어 보이지만 속마음은 다른 경우가 많아요.",
  },
  신: {
    short: "신금(辛金) — 세공된 보석·날카로운 칼날",
    keyword: "정밀함·예민함·완벽주의",
    detail: "정밀하고 예민하며 완벽을 추구해요. 작은 결점에도 민감하게 반응하고 상처를 오래 기억해요. 정교한 공학과 질서를 추구해요. 섬세하게 다듬어진 결과물을 만드는 능력이 탁월해요.",
  },
  임: {
    short: "임수(壬水) — 광활한 바다·대하(大河)",
    keyword: "진지함·이과형·터프함",
    detail: "명리학적으로 '노인'의 기운이에요. 물상(物象)으로는 밤 — 일요일 저녁의 무드이에요. 바닷물처럼 광대하고 묵직해요. 진지함과 권위의식이 있으며 질서와 위계를 중시해요. 한심한 사람을 가장 싫어하는 일간으로, 타인에게 '이렇게 사는 게 사람이냐'고 꼭꼭 찍는 경향이 있어요. 이번 한번뿐이라는 진지한 마음으로 임하기에 실패하면 완전히 낙담해요. 과학적·이지적이며 논리와 데이터를 우선해요. 감성적 표현과 오글거리는 문구를 불편해해요. 직접적이고 터프한 소통을 선호해요. 연애에서는 섹시하고 성숙하며 깊은 매력을 지녔는데, 겉으로는 무뚝뚝해 보여도 친해지면 애교가 많아져요. 물상이 바다인 것처럼 실제로도 마음을 붙잡기 어려운 경우가 많고, 생각이 매우 많고 신중한 편이면서도 남을 먼저 배려하는 다정함이 있어요. 임수 남자는 자유롭고 매력적인 만큼 정착이 어려운 경우가 많고, 임수 여자는 귀여움과 야시시함이 공존하는 상반된 분위기를 지닌 경우가 많아요.",
  },
  계: {
    short: "계수(癸水) — 빗물·이슬·안개",
    keyword: "계산적·공상적·실속형",
    detail: "명리학적으로 임수가 거대한 바다라면, 계수는 그 바닷물이 하늘로 올라가 응축된 빗물·이슬·안개예요. 형태가 없고 어디든 스며들기 때문에 겉으로는 여리고 순응적으로 보이지만, 실은 행동보다 계산이 먼저인 전략가 기질이에요. 옆에서 조용히 실속을 챙기고, 표현은 부드럽지만 내면에는 '결국 내 뜻대로 가야 한다'는 고집이 숨어 있어요. 공상적인 면과 지적 호기심이 강하고 머리가 좋아서, 남들이 못 보는 디테일과 빈틈을 잘 짚어내요. 냉철한 분석과 합리주의가 강점이지만, 동시에 안개처럼 변화무쌍한 감정선도 함께 가지고 있어 기분에 따라 사람을 대하는 태도가 묘하게 달라질 수 있어요. 물상이 작은 물방울인 만큼 혼자서는 약해 보여도, 모이고 모이면 바위도 뚫는 끈기와 침투력을 발휘해요. 인간관계에서는 한 번에 마음을 다 주지 않고 조금씩 간을 보며 신뢰를 쌓아가는 신중함이 있고, 신뢰가 쌓이면 누구보다 다정하고 헌신적으로 변해요. 연애에서는 계수 여자는 여리여리한 첫인상과 달리 속으로는 계획적이고 실속을 챙기는 면이 있어 의외로 '밀당'에 능하고, 계수 남자는 다정하고 섬세한 배려로 상대를 무장해제시키지만 자기 영역을 침범당하는 건 극도로 싫어해요. 직장에서는 큰소리치지 않으면서도 묵묵히 데이터와 근거를 쌓아 결국 원하는 결론으로 사람들을 이끄는 조용한 협상가 스타일이에요. 비가 땅에 스며들어 만물을 키우듯, 계수는 드러나지 않게 주변 사람을 성장시키는 역할을 자주 맡게 돼요.",
  },
};

function generatePersonality(dominant: Element[], lacking: Element[], name: string): string {
  const traits: Record<Element, string> = {
    목: "목표 지향적이고 추진력 있는",
    화: "열정적이고 표현력이 강한",
    토: "안정적이고 실용적인",
    금: "냉철하고 결단력 있는",
    수: "분석적이고 전략적으로 계산하는",
  };
  const dom = dominant.length > 0 ? dominant.map(e => traits[e]).join(", ") : "균형잡힌";
  const lack = lacking.length > 0 ? `${lacking.join("·")}의 기운을 보완하면 더 균형잡힌` : "이미 균형잡힌";
  return `${name}님은 ${dom} 성향으로, ${lack} 삶을 살 수 있어요.`;
}

export function generateWallpaperTheme(lacking: Element[], scores: ElementScore): WallpaperTheme {
  const themeMap: Record<Element, WallpaperTheme> = {
    목: { primaryColors:["#2D6A4F","#40916C","#52B788","#74C69D"], accentColors:["#B7E4C7","#D8F3DC"],
      pattern:"organic", mood:"성장과 생명력", description:"다양한 자연 요소로 목(木)의 기운을 보강해요" },
    화: { primaryColors:["#E63946","#F4511E","#FF7043","#FF8A65"], accentColors:["#FFCCBC","#FFE0B2"],
      pattern:"flowing", mood:"열정과 활력", description:"다양한 방식으로 화(火)의 기운을 보강해요" },
    토: { primaryColors:["#9C6644","#D4A373","#E9C46A","#F4D03F"], accentColors:["#FEFAE0","#F8EDEB"],
      pattern:"geometric", mood:"안정과 중심", description:"다양한 방식으로 토(土)의 기운을 보강해요" },
    금: { primaryColors:["#ADB5BD","#6C757D","#C9B458","#E8D5A3"], accentColors:["#F8F9FA","#DEE2E6"],
      pattern:"crystalline", mood:"명확함과 결단", description:"다양한 방식으로 금(金)의 기운을 보강해요" },
    수: { primaryColors:["#023E8A","#0077B6","#0096C7","#48CAE4"], accentColors:["#ADE8F4","#CAF0F8"],
      pattern:"misty", mood:"지혜와 흐름", description:"다양한 방식으로 수(Water)의 기운을 보강해요" },
  };
  if (lacking.length > 0) {
    const mostLacking = lacking.reduce((a,b) => scores[a] < scores[b] ? a : b);
    return themeMap[mostLacking];
  }
  return themeMap["토"];
}

export const PRICES = {
  mobile: 2900,    // 오행 배경화면 단품
  report: 8900,    // 사주 상세 보고서 단품 (인상: 7900→8900)
  bundle: 9900,    // 배경화면 + 상세 보고서 패키지 (최고 가성비)
} as const;

// ── 대운(大運) / 세운(歲運) 계산 ──────────────────────────────────────────────

export interface DaewoonPillar {
  age: number;        // 대운 시작 나이 (만)
  yearStart: number;  // 대운 시작 추정 연도
  cg: string; jj: string;
  sipseongCg: string; // 일간 기준 십성 (천간)
  sipseongJj: string; // 일간 기준 십성 (지지 본기)
  uunseong: string;   // 일간 기준 12운성
  element: Element;   // 지지 오행
}

export interface DaewoonResult {
  startAge: number;           // 첫 대운 시작 나이 (교운기)
  direction: "순행" | "역행";
  pillars: DaewoonPillar[];   // 8개 대운
  currentIdx: number;         // 현재 해당 대운 인덱스
}

export function calcDaewoon(
  birthYear: number, birthMonth: number, birthDay: number,
  gender: "male" | "female",
  ilgan: string,
  monthPillar: { cg: string; jj: string },
): DaewoonResult {
  // ① 순역행 결정
  // 양년(갑·병·무·경·임) + 남성 = 순행 / 음년 + 여성 = 순행
  // 음년(을·정·기·신·계) + 남성 = 역행 / 양년 + 여성 = 역행
  const yearCgIdx = ((birthYear - 4) % 10 + 10) % 10;
  const isYangYear = yearCgIdx % 2 === 0;
  const isForward = (isYangYear && gender === "male") || (!isYangYear && gender === "female");

  // ② 출생일 ↔ 절기일 사이 날 수 계산
  const birthJDN = toJDN(birthYear, birthMonth, birthDay);
  let termJDN: number;

  if (isForward) {
    // 다음 절기 찾기 (순행)
    const currentTermDay = SOLAR_TERM_DAYS[birthMonth];
    if (birthDay < currentTermDay) {
      // 이번 달 절기 아직 안 지남 → 이번 달 절기
      termJDN = toJDN(birthYear, birthMonth, currentTermDay);
    } else {
      // 이번 달 절기 지남 → 다음 달 절기
      const nm = birthMonth === 12 ? 1 : birthMonth + 1;
      const ny = birthMonth === 12 ? birthYear + 1 : birthYear;
      termJDN = toJDN(ny, nm, SOLAR_TERM_DAYS[nm]);
    }
  } else {
    // 이전 절기 찾기 (역행)
    const currentTermDay = SOLAR_TERM_DAYS[birthMonth];
    if (birthDay >= currentTermDay) {
      // 이번 달 절기 지남 → 이번 달 절기 = 직전 절기
      termJDN = toJDN(birthYear, birthMonth, currentTermDay);
    } else {
      // 아직 이번 달 절기 전 → 전달 절기
      const pm = birthMonth === 1 ? 12 : birthMonth - 1;
      const py = birthMonth === 1 ? birthYear - 1 : birthYear;
      termJDN = toJDN(py, pm, SOLAR_TERM_DAYS[pm]);
    }
  }

  const daysDiff = Math.abs(termJDN - birthJDN);
  // 3일 = 1년, 1일 = 4개월 → 반올림하여 대운 시작 나이 결정
  const startAge = Math.round(daysDiff / 3.0);

  // ③ 대운 기둥 8개 생성
  const monthCgIdx = CHEONGAN.indexOf(monthPillar.cg);
  const monthJjIdx = JIJI.indexOf(monthPillar.jj);

  const pillars: DaewoonPillar[] = [];
  for (let i = 0; i < 8; i++) {
    const step = isForward ? i + 1 : -(i + 1);
    const cgIdx = ((monthCgIdx + step) % 10 + 10) % 10;
    const jjIdx = ((monthJjIdx + step) % 12 + 12) % 12;
    const cg = CHEONGAN[cgIdx];
    const jj = JIJI[jjIdx];
    const bongi = JIJI_BONGI[jj] || "";
    pillars.push({
      age: startAge + i * 10,
      yearStart: birthYear + startAge + i * 10,
      cg, jj,
      sipseongCg: getSipseong(ilgan, cg),
      sipseongJj: getSipseong(ilgan, bongi),
      uunseong: getUunseong(ilgan, jj),
      element: CHEONGAN_ELEMENT[bongi] || "토" as Element,
    });
  }

  // ④ 현재 해당 대운 인덱스
  const nowYear = new Date().getFullYear();
  const approxAge = nowYear - birthYear;
  let currentIdx = pillars.findIndex((p, i) => {
    const nextAge = i + 1 < pillars.length ? pillars[i + 1].age : 999;
    return approxAge >= p.age && approxAge < nextAge;
  });
  if (currentIdx < 0) currentIdx = 0;

  return { startAge, direction: isForward ? "순행" : "역행", pillars, currentIdx };
}

export interface SewoonItem {
  year: number;
  cg: string; jj: string;
  sipseongCg: string;
  sipseongJj: string;
  uunseong: string;
  element: Element;
  isCurrent: boolean;
}

export function calcSewoon(birthYear: number, ilgan: string, rangeYears = 12): SewoonItem[] {
  const nowYear = new Date().getFullYear();
  const result: SewoonItem[] = [];
  for (let y = nowYear - 2; y <= nowYear + rangeYears; y++) {
    const p = getYearPillar(y);
    const bongi = JIJI_BONGI[p.jj] || "";
    result.push({
      year: y,
      cg: p.cg, jj: p.jj,
      sipseongCg: getSipseong(ilgan, p.cg),
      sipseongJj: getSipseong(ilgan, bongi),
      uunseong: getUunseong(ilgan, p.jj),
      element: CHEONGAN_ELEMENT[bongi] || "토" as Element,
      isCurrent: y === nowYear,
    });
  }
  return result;
}

// ══════════════════════════════════════════════════════════════════════════════
// 확장 데이터 — 어디서든 import해서 사용 가능
// ══════════════════════════════════════════════════════════════════════════════

// ── 십성별 위치(연주/월주/일지/시주) 해석 ──────────────────────────────────────
export const SIPSUNG_BY_POSITION: Record<"연주"|"월주"|"일지"|"시주", Record<string, string>> = {
  연주: {
    비견: "독립심이 강한 환경에서 자람. 장남·장녀 역할 자처",
    겁재: "형제 경쟁 심함. 강인한 의지로 꿈을 이루는 타입",
    식신: "유복한 어린 시절. 풍족하고 밝은 가정환경",
    상관: "창의·예술 기질 조기 발달. 반항기 경험 가능",
    편재: "사업가 집안 또는 부친 영향 강. 돈 보는 눈 조기 발달",
    정재: "안정적인 가정환경. 성실하게 자람",
    편관: "엄격한 가정. 아버지가 강압적이거나 무서웠을 수 있음. 강인함으로 자람",
    정관: "모범적이고 체계적인 환경. 예의 바르게 자람",
    편인: "독특한 환경. 종교·예술적 집안. 독창적 어린 시절",
    정인: "교육열 높은 집안. 공부와 조력자가 함께 있는 환경",
  },
  월주: {
    비견: "독립심이 직업의 근간. 경쟁 심한 청년기 경험",
    겁재: "형제에게 희생. 경쟁의식 강함. 재물 기복 가능",
    식신: "식복 있음. 요리·예술·창의 기질 발달. 직업에서 표현력 발휘",
    상관: "반항적 청년기. 창의·예술 재능 폭발. 직장 상사와 마찰 주의",
    편재: "사교적. 사업 감각 조기 발달. 부친과의 인연 강",
    정재: "성실한 청년기. 돈 관리 철저. 직업의식 강함",
    편관: "강압적 환경에서 자라 추후 권위직 경향. 규율과 통제 경험",
    정관: "체계적 환경. 공직·직장 선호. 명예 추구. 규칙·책임을 중시하는 짜임을 타고남",
    편인: "독특한 학습 방식. 전문 특기 발달. 제도권 교육 부적응 가능",
    정인: "교육열 높은 환경. 어머니 영향 강. 공부로 성공",
  },
  일지: {
    비견: "자기 주관 뚜렷하고 독립적. 배우자도 강한 자아와 자존심",
    겁재: "경쟁심 강. 배우자와 파워 게임 가능. 재산 공동 관리 주의",
    식신: "어떤 상황이든 먹고 사는 것이 중요. 배우자가 능숙하게 살림을 챙김",
    상관: "창의적이고 총명한 배우자 선호. 직장 상사와 마찰 주의",
    편재: "경제적 능력 있는 배우자 선호. 유동적·사업적 배우자 가능",
    정재: "성실하고 안정적인 배우자. 가정 중심적인 삶 추구",
    편관: "강인하고 권위적인 배우자. 군경·법조 배우자 인연 많음",
    정관: "원칙적이고 모범적인 배우자. 안정된 직업 배우자",
    편인: "독특하고 전문적인 배우자. 예술가·종교인 가능. 감정적 거리감 주의",
    정인: "교육적이고 배려 깊은 배우자. 어머니 같은 성격의 파트너",
  },
  시주: {
    비견: "말년에 동료·친구들과 활발히 어울림. 자녀가 독립적",
    겁재: "자녀에게 재산 빼앗길 수 있음. 말년 돈 관리 철저 필요",
    식신: "노후에도 소일거리로 돈 벌음. 소소한 행복 지속",
    상관: "자녀가 창의적이고 반항적. 말년에 사회와 마찰 가능",
    편재: "말년에 사업 기회 생김. 자녀가 사업적 성향",
    정재: "노후 안정. 성실히 모은 재물 누림",
    편관: "자녀가 엄격하거나 권위직 진출. 말년에 압박 받을 수 있음",
    정관: "자녀가 모범적. 노후 명예롭고 안정된 삶",
    편인: "자녀가 독특하거나 종교적. 노후에 정신세계 몰입. 고독 주의",
    정인: "자녀가 교육적. 말년에 공부 또는 가르침으로 보람 느낌",
  },
};

// ── 오행별 건강 분석 ─────────────────────────────────────────────────────────
export const OHAENG_HEALTH: Record<Element, {
  organs: string; symptoms: string[]; caution: string; lifestyle: string;
}> = {
  목: {
    organs: "간(肝)·담낭(膽)",
    symptoms: ["간질환·지방간", "담석증", "시력 저하·안구 건조", "근육·인대 약화", "손발톱 이상", "스트레스성 질환"],
    caution: "목 기운이 약하면 간·눈이 취약해요. 목이 과하면 상극 대상인 토(비장·위장)가 약화돼요.",
    lifestyle: "녹색 채소 섭취, 스트레칭 습관화, 충분한 수면으로 간을 회복하세요.",
  },
  화: {
    organs: "심장(心)·소장(小腸)",
    symptoms: ["심장 질환·부정맥", "혈액순환 장애", "소장 장애", "불면증", "불안·조울증", "혈압 이상"],
    caution: "화 기운이 약하면 심장·혈관이 취약해요. 화가 과하면 금(폐·대장)이 약화돼요.",
    lifestyle: "적절한 유산소 운동, 과로·흥분 자제, 붉은색 과일 섭취로 심장을 보호하세요.",
  },
  토: {
    organs: "비장(脾)·위장(胃)·췌장",
    symptoms: ["소화 장애·위염", "위궤양", "비장 약화", "근육 피로·무기력", "입 주변 염증", "당뇨 취약"],
    caution: "토 기운이 약하면 소화기계 전반이 취약해요. 과하면 수(신장·방광)가 약화돼요.",
    lifestyle: "규칙적인 식사, 과식 금지, 노란색 음식 섭취, 걱정·집착 줄이기.",
  },
  금: {
    organs: "폐(肺)·대장(大腸)",
    symptoms: ["호흡기 질환·천식", "폐렴·기관지염", "대장 이상·과민성장증후군", "피부 트러블", "비염·알레르기", "변비"],
    caution: "금 기운이 약하면 폐·피부가 취약해요. 과하면 목(간·담낭)이 약화돼요.",
    lifestyle: "맑은 공기 마시기, 깊은 복식 호흡, 흰색 음식 섭취, 슬픔·비탄 자제.",
  },
  수: {
    organs: "신장(腎)·방광(膀胱)",
    symptoms: ["신장 질환·신부전", "방광염·요로감염", "골다공증·관절 약화", "청력 저하", "생식기 질환·불임", "탈모·흰머리"],
    caution: "수 기운이 약하면 신장·뼈가 취약해요. 과하면 화(심장·소장)가 약화돼요.",
    lifestyle: "충분한 수분 섭취, 검은색 식품(검은콩·흑미) 섭취, 무릎·허리 보호, 과도한 공포·불안 자제.",
  },
};

// ── 오행별 직업 추천 ──────────────────────────────────────────────────────────
export const OHAENG_CAREER: Record<Element, {
  suited: string[]; industries: string[]; strengths: string; caution: string;
}> = {
  목: {
    suited: ["교육자·교수", "의사·의료인", "연구원·학자", "법률가·변호사", "사회복지사", "기획자·PM"],
    industries: ["교육", "의료·헬스케어", "법률", "환경·생태", "출판·미디어", "사회복지", "IT기획"],
    strengths: "성장을 이끄는 추진력, 사람을 돌보는 봉사심, 지식 전달 능력, 개척·도전 정신",
    caution: "지나친 고집으로 팀 갈등 주의. 너무 많은 프로젝트를 동시에 추진하면 소진돼요.",
  },
  화: {
    suited: ["방송인·MC", "마케터·광고인", "디자이너", "강사·코치", "영업·세일즈", "예술가·공연인"],
    industries: ["방송·미디어", "광고·마케팅", "패션·뷰티", "예술·공연", "서비스·외식", "이벤트·컨설팅"],
    strengths: "화려한 표현력과 인기몰이, 넘치는 에너지, 창의적 아이디어, 사람을 끄는 카리스마",
    caution: "지속력 부족. 열정 폭발 후 냉각 주의. 과도한 외향성이 오히려 거부감을 줄 수 있어요.",
  },
  토: {
    suited: ["부동산 전문가", "건축가·인테리어", "요식업자·셰프", "관리자·CEO", "행정가·공무원", "중재인·조정자"],
    industries: ["부동산·건설", "식품·요식", "농업·원자재", "행정·공공", "금융·보험", "물류·유통"],
    strengths: "안정적인 관리 능력, 중재와 조율, 실용적 판단, 끈질긴 노력과 실행력",
    caution: "변화 적응이 느립니다. 고집이 과하면 기회를 놓칩니다. 지나친 소유욕 주의.",
  },
  금: {
    suited: ["의사·외과의", "군인·경찰", "검사·판사", "엔지니어·개발자", "회계사·세무사", "분석가·연구원"],
    industries: ["의료·외과", "법조·군경", "제조·공학", "금융·회계", "IT·보안·반도체", "정밀기기·금속"],
    strengths: "날카로운 판단력과 단호한 결단, 규칙과 원칙 준수, 냉철한 분석, 완벽한 마무리",
    caution: "감정 표현 부족으로 대인관계가 차갑게 느껴질 수 있어요. 지나친 완벽주의 주의.",
  },
  수: {
    suited: ["철학자·사상가", "심리상담사", "외교관·통역사", "전략가·기획자", "작가·시인", "종교인·명상가"],
    industries: ["학문·연구", "심리·상담", "외교·무역", "창작·문학·영화", "종교·영성", "IT전략·컨설팅"],
    strengths: "깊은 통찰력과 전략적 사고, 유연한 변화 적응력, 광범위한 지식 흡수, 섬세한 감수성",
    caution: "우유부단한 경향. 지나친 내면 집중으로 현실 회피 주의. 과도한 음주·탐닉 경계.",
  },
};

// ── 60갑자 일주론 ─────────────────────────────────────────────────────────────
// 일주(日柱) 동물 — 일지(地支) → 띠 동물, 일간(天干) → 색깔
export const JIJI_ANIMAL: Record<string, string> = {
  자: "쥐", 축: "소", 인: "호랑이", 묘: "토끼", 진: "용", 사: "뱀",
  오: "말", 미: "양", 신: "원숭이", 유: "닭", 술: "개", 해: "돼지",
};
const CHEONGAN_COLOR: Record<string, string> = {
  갑: "푸른", 을: "푸른", 병: "붉은", 정: "붉은", 무: "노란", 기: "노란",
  경: "흰", 신: "흰", 임: "검은", 계: "검은",
};
export function getIljuAnimal(dayCg: string, dayJj: string): string {
  const color = CHEONGAN_COLOR[dayCg] || "";
  const animal = JIJI_ANIMAL[dayJj] || "";
  return `${color} ${animal}`;
}

export const ILJU_60: Record<string, {
  image: string; uunseong: string; keyword: string;
  personality: string; love: string; career: string; caution: string;
}> = {
  갑자: { image:"겨울 강가의 큰 나무", uunseong:"목욕", keyword:"총명·학구적·자존심",
    personality:"60갑자 첫 번째로 1등 기질과 자존심이 강해요. 지식 습득 능력이 탁월하고 감수성이 예민하며 어머니와 친밀한 경우가 많어요.",
    love:"이상이 높고 감성적인 연애를 해요. 이상형을 만나면 헌신적으로 사랑해요.",
    career:"의료·전문직·IT·교육 분야에 적합해요. 자격증 활용 전문직에서 빛납니다. 생명공학·천문학·심리상담 쪽도 일부 어울려요.",
    caution:"자존심에 상처를 받으면 오래 기억해요. 완벽 추구로 인한 번아웃을 주의하세요." },
  갑인: { image:"곧게 뻗은 거대한 나무", uunseong:"건록", keyword:"자립심·리더십·패기",
    personality:"천간과 지지가 같은 기운으로 겹쳐 독립심과 자존심이 극강하고 주관이 뚜렷해요. 리더십이 뛰어나고 혼자서도 충분히 강해요.",
    love:"독립적인 연애 스타일이에요. 자신의 페이스를 존중해주는 파트너가 필요해요.",
    career:"연구직·IT·의료·교육·공학 분야에 적합해요. 언론·정치가·군인 쪽도 일부 어울려요.",
    caution:"고집이 너무 강해 협력이 어려울 수 있어요. 욱하는 성향을 조절하세요." },
  갑진: { image:"비옥한 초원에 뿌리내린 큰 나무", uunseong:"쇠", keyword:"책임감·전투력·교육열",
    personality:"평소 조용하지만 화나면 폭발적이에요. 책임감이 매우 강하고 나이 들어 공부에 뜻을 두는 경우가 많어요.",
    love:"한번 사랑하면 책임지려 해요. 약한 모습을 보이기 싫어 표현이 서툴 수 있어요.",
    career:"의료·부동산·교육 분야에 적합해요. 부동산 투자로 자산을 쌓는 경우도 많어요. 인테리어·원예·농업 쪽도 일부 어울려요.",
    caution:"백호살 기운으로 폭발 후 후회할 언행을 조심하세요." },
  갑오: { image:"숲 위에 뜬 뜨거운 태양", uunseong:"사", keyword:"열정·실행력·직관",
    personality:"강한 열정과 실행력이 탁월해요. 사지(死地)에 앉아 에너지를 소모 후 공허감을 느끼고 영적·직관적 성향도 있어요.",
    love:"열정적으로 사랑하지만 감정 기복이 있어요.",
    career:"예술·창작·사업·교육 분야에 적합해요. 가수·방송·디자인·광고·부동산 쪽도 일부 어울려요.",
    caution:"급하고 진득하지 못한 성향을 조절해야 해요. 에너지 관리가 중요해요." },
  갑신: { image:"결실이 풍요로운 나무", uunseong:"절", keyword:"추진력·사업기질·사업성재물운",
    personality:"강인한 추진력과 결단력이 있어요. 사업·투자성 큰돈을 만드는 감각이 탁월하고 감정 표현이 서툰 편이에요.",
    love:"연애 경험은 많지만 오랜 관계 유지가 어려울 수 있어요. 포용적인 상대가 필요해요.",
    career:"영업·무역·운송·사업 분야에 적합해요. 법학·경찰·외교관 쪽도 일부 어울려요.",
    caution:"감정 표현 부족으로 파트너가 외로움을 느낄 수 있어요." },
  갑술: { image:"산 위에 굳건히 뿌리내린 큰 나무", uunseong:"양", keyword:"책임감·교육재능·복잡한내면",
    personality:"책임감이 강하고 약한 모습을 극도로 싫어해요. 내면은 따뜻하지만 겉으로는 강인함을 고집해요.",
    love:"연애운은 좋으나 이성 관계가 복잡해질 수 있어요.",
    career:"종교·사업·교육·활인업 분야에 적합해요. 금융·투자·상담·역술인 쪽도 일부 어울려요.",
    caution:"지나친 책임감이 스스로를 지칩니다. 쉬는 것도 능력임을 인식하세요." },
  을축: { image:"겨울 논밭의 풀", uunseong:"쇠", keyword:"인내심·서포터·재물주의",
    personality:"인내심이 강하고 뒤에서 지원하는 역할을 잘해요. 감정 기복이 있으나 실생활에 강해요.",
    love:"헌신적으로 사랑해요. 현실적인 책임감과 마음이 부딪혀서 감정과 현실 사이에서 갈등할 수 있어요.",
    career:"서비스·지원 분야에 적합해요. 돈을 편하게 버는 것이 어렵지만 노력으로 성과를 냅니다.",
    caution:"현실과 배움 사이의 충돌이 잦을 수 있어요." },
  을묘: { image:"봄철 무성한 숲", uunseong:"건록", keyword:"강인함·생활력·미남미녀",
    personality:"천간과 지지가 같은 기운으로 겹쳐 강인한 인내심과 고집이 있어요. 미남·미녀가 많고 생활력이 탁월해요.",
    love:"감성적이고 섬세한 연애를 해요. 한번 마음을 주면 진심을 다해요.",
    career:"건록지의 독립심으로 공직·전문직에서 안정적으로 성공해요.",
    caution:"고집이 너무 강해 인간관계에서 마찰이 생길 수 있어요." },
  을사: { image:"여름 불꽃 속의 연약한 풀", uunseong:"목욕", keyword:"창의·예술·섬세함",
    personality:"창의적 재능과 섬세한 감각이 있어요. 예술적 기질이 강하고 감수성이 풍부해요.",
    love:"감성적이고 낭만적인 연애를 즐깁니다. 감수성을 이해해주는 파트너가 필요해요.",
    career:"예술·디자인·문화·교육 분야에 적합해요.",
    caution:"목욕지의 예민함으로 상처를 쉽게 받어요. 자기 보호가 필요해요." },
  을미: { image:"여름 들판의 풀과 꽃", uunseong:"양", keyword:"실용성·배려·온화함",
    personality:"온화하고 실용적인 성격이에요. 배려심이 깊고 주변과 잘 어울립니다.",
    love:"안정적이고 따뜻한 연애를 해요. 가정적인 파트너와 잘 맞어요.",
    career:"서비스·교육·요식·상담 분야에 적합해요.",
    caution:"지나친 배려로 자신을 희생하지 않도록 주의하세요." },
  을유: { image:"날카로운 칼 위의 연약한 꽃", uunseong:"절", keyword:"명예추구·외유내강·승부욕",
    personality:"겉은 부드럽지만 속은 냉정해요. 명예를 중시하고 승부욕과 완벽주의가 강해요.",
    love:"이상이 높아 마음에 드는 파트너를 찾기 어렵어요. 한번 정하면 헌신적이에요.",
    career:"의료·군경·법조·미용·요리 분야에 적합해요. 칼을 쓰는 직종과 인연이 많어요.",
    caution:"완벽주의로 스스로와 타인에게 지나치게 엄격할 수 있어요." },
  을해: { image:"큰 물 위의 연꽃", uunseong:"사", keyword:"수용적·감수성·인내",
    personality:"미남·미녀가 많어요. 수용적이고 인내심이 강하며 감수성이 풍부해요. 진흙에서도 꽃을 피우는 강인함이 있어요.",
    love:"낭만적이고 감성적인 연애를 해요.",
    career:"예술·문화·창작·상담 분야에 적합해요.",
    caution:"지나친 수용으로 자기 주장이 사라질 수 있어요. 경계 설정이 필요해요." },
  병자: { image:"석양이 비추는 바다", uunseong:"태", keyword:"대인관계·이상·양면성",
    personality:"점잖은 미남·미녀가 많어요. 대인관계가 원만하고 이상 목표가 큽니다. 물과 불이 만나는 구조로 양면성이 있어요.",
    love:"넓은 인간관계 속에서 이상형을 찾어요. 자존심이 있어 먼저 다가가기 어렵어요.",
    career:"외교·대인관계 업무·사업·무역 분야에 적합해요.",
    caution:"수화충으로 감정 기복이 있을 수 있어요." },
  병인: { image:"큰 나무 위에 뜬 태양", uunseong:"장생", keyword:"리더십·열정·웅장함",
    personality:"화려하고 웅장한 기상이 있어요. 열정적인 리더십으로 주변을 이끕니다. 장생지에 앉아 활력이 넘칩니다.",
    love:"열정적으로 사랑을 표현해요. 화끈하고 솔직한 연애 스타일이에요.",
    career:"사업·교육·리더십 직군에 적합해요.",
    caution:"너무 넘치는 열정이 주변을 압도할 수 있어요." },
  병진: { image:"봄비 속의 태양", uunseong:"관대", keyword:"봉사·희생·급한성격",
    personality:"베푸는 것을 좋아하고 정이 많어요. 봉사와 희생 정신이 있으나 성격이 급해요.",
    love:"따뜻하고 헌신적인 연애를 해요.",
    career:"의료·공익·서비스·사회복지 분야에 적합해요.",
    caution:"정을 너무 많이 베풀다 지칩니다. 자신을 먼저 챙기세요." },
  병오: { image:"작열하는 정오의 태양", uunseong:"제왕", keyword:"폭발에너지·자유·낙천",
    personality:"천간과 지지가 같은 기운에 강한 승부욕이 더해진 극강 불 에너지예요. 칭찬에 협력하고 비판에 즉각 반격해요. 자유롭고 낙천적이에요.",
    love:"열정적이고 화끈해요. 독립심이 강해 구속을 싫어해요.",
    career:"자기 분야에서 최고를 추구해요. 군인·스포츠·사업에 적합해요.",
    caution:"감정 폭발 후 후회할 언행을 조심하세요." },
  병신: { image:"바위산 위에 내리쬐는 태양", uunseong:"병", keyword:"총명·밝음·충동주의",
    personality:"공부와 지혜를 돕는 귀한 기운이 있어 총명해요. 성격이 밝고 착하며 외모도 수려한 편이에요.",
    love:"밝고 활발한 연애를 해요.",
    career:"교육·문화·예술·지식 관련 전문직에 적합해요.",
    caution:"수화충으로 충동적 결정을 주의하세요." },
  병술: { image:"지는 석양", uunseong:"묘", keyword:"봉사·풍류·정많음",
    personality:"베푸는 것을 좋아하고 정이 넘칩니다. 먹을복이 넘치는 기운으로 먹고 마시고 즐기는 풍류를 사랑해요.",
    love:"따뜻하고 포용적인 연애를 해요.",
    career:"서비스·의료·요식업 분야에 적합해요.",
    caution:"정을 너무 많이 베풀다 뒤통수를 맞을 수 있어요. 분별력이 필요해요." },
  정축: { image:"얼음 속의 촛불", uunseong:"묘", keyword:"집요함·냉정·실용",
    personality:"차갑고 냉정해 보이지만 내면에 뜨거운 열정이 있어요. 집요하고 실용적인 판단을 해요.",
    love:"신중하게 상대를 선택해요. 감정 표현이 서툴지만 한번 정하면 깊이 사랑해요.",
    career:"의료·법조·연구·전문직에 적합해요.",
    caution:"냉정함이 주변을 차갑게 느끼게 할 수 있어요." },
  정묘: { image:"봄날의 촛불", uunseong:"병", keyword:"섬세·예민·예술적",
    personality:"섬세하고 예민하며 예술적 감각이 뛰어납니다. 감정 기복이 있으나 신의가 강해요.",
    love:"감성적이고 낭만적인 연애를 원해요.",
    career:"예술·문화·교육·상담 분야에 적합해요.",
    caution:"지나친 예민함으로 스트레스를 많이 받어요. 자기 회복력을 키우세요." },
  정사: { image:"여름 불꽃 위의 촛불", uunseong:"제왕", keyword:"강한의지·직관·카리스마",
    personality:"강한 의지력과 직관력이 있어요. 제왕지에 앉아 에너지가 충만해요. 집중력이 탁월해요.",
    love:"열정적이고 독점욕이 있어요. 한 사람에게 깊이 집중해요.",
    career:"예술·종교·전문직·리더십 분야에 적합해요.",
    caution:"독단적 결정을 주의하세요." },
  정미: { image:"여름 석양의 촛불", uunseong:"관대", keyword:"따뜻함·표현력·공감",
    personality:"따뜻하고 표현력이 풍부해요. 공감 능력이 뛰어나 주변에서 신뢰를 받어요.",
    love:"따뜻하고 헌신적인 연애를 해요.",
    career:"상담·교육·서비스·예술 분야에 적합해요.",
    caution:"감정 소모가 큽니다. 자신의 에너지를 보충하는 시간이 필요해요." },
  정유: { image:"가을 보석처럼 빛나는 촛불", uunseong:"장생", keyword:"정밀함·명예·품격",
    personality:"정밀하고 섬세한 성격이에요. 명예를 중시하고 품격을 갖추려 해요. 장생지에 앉아 생명력이 넘칩니다.",
    love:"품격 있는 연애를 선호해요. 상대의 예의와 배려를 중시해요.",
    career:"의료·예술·교육·전문직에 적합해요.",
    caution:"지나친 명예 추구로 실리를 놓칠 수 있어요." },
  정해: { image:"겨울 밤의 촛불", uunseong:"태", keyword:"천을귀인·총명·순수",
    personality:"천을귀인(天乙貴人)이 있어 위기 때마다 귀인의 도움을 받어요. 순수하고 총명하며 분위기를 밝게 만듭니다.",
    love:"순수하고 낭만적인 연애를 해요.",
    career:"교육·상담·대인관계 업무에 적합해요.",
    caution:"순수함을 이용당할 수 있어요. 사람을 볼 때 신중함이 필요해요." },
  무자: { image:"겨울 빈 들판", uunseong:"태", keyword:"합리적·융통성·조율자",
    personality:"합리적이고 융통성이 있어요. 주변을 조율하는 능력이 탁월해요.",
    love:"안정적이고 편안한 연애를 선호해요.",
    career:"행정·관리·부동산·중재 분야에 적합해요.",
    caution:"우유부단한 모습이 기회를 놓치게 할 수 있어요." },
  무인: { image:"봄 산", uunseong:"장생", keyword:"든든함·신뢰·안정",
    personality:"든든하고 신뢰감이 있어요. 장생지에 앉아 생명력과 추진력이 넘칩니다.",
    love:"안정적이고 든든한 파트너를 추구해요.",
    career:"건설·부동산·행정·교육 분야에 적합해요.",
    caution:"너무 무거운 책임을 지려다 지칠 수 있어요." },
  무진: { image:"물이 흐르는 큰 산", uunseong:"관대", keyword:"전투력·기복·프로정신",
    personality:"백호살 기운으로 폭발력이 있어요. 강한 카리스마를 지닌 일주라 총명해요. 잘될 때 크게 성공하는 기복이 있어요.",
    love:"강렬하고 드라마틱한 연애를 해요.",
    career:"전문직·기술직·독립적 업무에 적합해요.",
    caution:"감정 폭발 후 큰 손실이 생길 수 있어요." },
  무오: { image:"작열하는 여름 산", uunseong:"제왕", keyword:"제왕·인내·강한에너지",
    personality:"제왕지에 앉아 강한 에너지와 인내력을 가집니다. 한번 결심하면 끝까지 밀고 나가는 의지력이 있어요.",
    love:"강렬하고 독점적인 사랑을 해요.",
    career:"전문직·독립 분야·리더십 직군에 적합해요.",
    caution:"지나친 고집과 강압적 태도가 관계에 악영향을 줄 수 있어요." },
  무신: { image:"가을 광산 속의 산", uunseong:"병", keyword:"실용·재물감각·독립",
    personality:"실용적이고 재물 감각이 있어요. 독립심이 강하고 자신의 방식을 고집해요.",
    love:"현실적인 연애를 해요.",
    career:"사업·금융·부동산 분야에 적합해요.",
    caution:"지나친 현실주의로 감성을 잃지 않도록 주의하세요." },
  무술: { image:"건조한 황무지 산봉우리", uunseong:"묘", keyword:"자존심극강·대범·고독",
    personality:"자존심이 극강하고 고집이 셉니다. 스케일이 크고 대범해요. 괴강일주로 총명하지만 외로움이 있어요.",
    love:"마음에 드는 결혼 상대를 만나기 어렵어요.",
    career:"교육·종교·군경·의약 분야에 적합해요.",
    caution:"특히 여성은 배우자운에 신중해야 해요." },
  기축: { image:"겨울 논밭", uunseong:"묘", keyword:"꼼꼼·실용·인내",
    personality:"꼼꼼하고 실용적이며 인내심이 강해요. 묘지에 앉아 내실을 다지는 능력이 있어요.",
    love:"안정적이고 성실한 연애를 해요.",
    career:"행정·관리·식품·농업 분야에 적합해요.",
    caution:"변화에 대한 두려움이 기회를 놓치게 할 수 있어요." },
  기묘: { image:"봄 비옥한 농토", uunseong:"병", keyword:"세심·관리·적응력",
    personality:"세심하고 관리 능력이 뛰어납니다. 적응력이 좋아 어떤 환경에서도 자리를 잡어요.",
    love:"세심하게 파트너를 배려해요.",
    career:"관리직·서비스·교육·농업 분야에 적합해요.",
    caution:"지나친 세심함이 스트레스로 이어질 수 있어요." },
  기사: { image:"여름 논밭", uunseong:"제왕", keyword:"실속·끈기·제왕기운",
    personality:"실속 있고 끈기가 강해요. 제왕지에 앉아 강한 생존력을 가집니다. 작은 것에서 큰 성과를 만드는 능력이 있어요.",
    love:"실용적이고 현실적인 연애를 해요.",
    career:"식품·농업·행정·서비스 분야에 적합해요.",
    caution:"지나친 실속 추구가 냉정하게 비칠 수 있어요." },
  기미: { image:"구불구불한 길의 논밭", uunseong:"관대", keyword:"이동·활동적·바쁨",
    personality:"천간과 지지가 같은 기운으로 겹쳐 항상 바쁘게 살아갑니다. 이동과 여행이 잦고 활동적인 삶을 삽니다.",
    love:"자유롭고 활동적인 연애를 해요. 구속을 싫어해요.",
    career:"이동·운송·여행·서비스 관련 분야에 적합해요.",
    caution:"너무 바쁘게 살다 정작 중요한 것을 놓치지 않도록 주의하세요." },
  기유: { image:"가을 수확 들판", uunseong:"장생", keyword:"정밀·성실·꼼꼼",
    personality:"정밀하고 성실해요. 일을 꼼꼼하게 처리하는 장인 기질이 있어요. 장생지에 앉아 생명력이 넘칩니다.",
    love:"신중하게 파트너를 선택해요. 한번 정하면 성실하게 사랑해요.",
    career:"농업·식품·금융·관리 분야에 적합해요.",
    caution:"지나친 완벽 추구로 스트레스를 받지 않도록 주의하세요." },
  기해: { image:"겨울 물가의 비옥한 땅", uunseong:"태", keyword:"지혜·전략·내실",
    personality:"지혜롭고 전략적으로 생각해요. 내실을 쌓아가는 능력이 탁월해요.",
    love:"신중하고 계획적인 연애를 해요.",
    career:"전략·기획·농업·식품 분야에 적합해요.",
    caution:"지나친 계산이 자연스러운 감정 표현을 방해할 수 있어요." },
  경자: { image:"겨울 강물 속의 바위", uunseong:"사", keyword:"수재·비판적사고·미남미녀",
    personality:"수재가 많어요. 비판적 사고와 분석력이 탁월해요. 미남·미녀에 목소리도 좋은 편이에요.",
    love:"이성에게 매력적이에요. 높은 기준으로 파트너를 선택해요.",
    career:"교육·연구·언론·IT 분야에 적합해요. 외교관·방송 쪽도 일부 어울려요.",
    caution:"지나친 비판적 시각이 관계를 어렵게 만들 수 있어요." },
  경인: { image:"봄 산 위의 도끼", uunseong:"절", keyword:"결단·개척·직선적",
    personality:"결단력이 강하고 개척 정신이 있어요. 직선적으로 생각하고 행동하며 절지에 앉아 강한 의지로 역경을 극복해요.",
    love:"직선적이고 솔직한 연애를 해요.",
    career:"군경·법조·사업·개척 분야에 적합해요. 회계·무역·교도관 쪽도 일부 어울려요.",
    caution:"너무 직선적인 말이 상대에게 상처를 줄 수 있어요." },
  경진: { image:"물이 흐르는 큰 바위산", uunseong:"양", keyword:"독립·지식나눔·괴강",
    personality:"독립심과 자립심이 강해요. 지식을 나누고 사람을 돌보는 성향이 있어요. 강한 카리스마를 지닌 일주라 인물이 좋고 이목구비가 뚜렷해요.",
    love:"독립적인 연애를 해요. 화날 때 자제력을 잃지 않도록 주의가 필요해요.",
    career:"교사·의사·간호사·종교인·약사 분야에 적합해요. 검찰·정치·공직 쪽도 일부 어울려요.",
    caution:"화가 날 때 자제력 상실을 주의하세요." },
  경오: { image:"여름 태양 아래의 바위", uunseong:"목욕", keyword:"활발·매력·강한에너지",
    personality:"활발하고 매력적이에요. 강한 에너지로 주변을 끌어당기는 인력이 있어요.",
    love:"이성에게 매력적이고 연애 경험이 풍부해요.",
    career:"영업·마케팅·서비스·스포츠 분야에 적합해요. 연예인·방송·공무원 쪽도 일부 어울려요.",
    caution:"목욕지의 충동적 성향을 조절해야 해요." },
  경신: { image:"기암절벽 바위산", uunseong:"건록", keyword:"의리·독립극강·맺고끊음",
    personality:"천간과 지지가 같은 기운으로 겹쳐 의리 있고 독립심이 극강해요. 추진력이 있으며 맺고 끊음이 분명해요.",
    love:"주도적이고 결단력 있는 연애를 해요.",
    career:"군인·검찰·경찰·의약 분야에 적합해요. 운동선수·물류·기업가 쪽도 일부 어울려요.",
    caution:"망신살 기운으로 구설을 조심하세요." },
  경술: { image:"가을 거대한 바위산", uunseong:"쇠", keyword:"강의지·총명·결단",
    personality:"강한 의지력과 독립심, 총명함이 있어요. 강한 카리스마와 결단력이 있어요.",
    love:"한번 마음을 정하면 변하지 않어요.",
    career:"군인·경찰·검찰·개인사업 분야에 적합해요. 세무·회계·기계 쪽도 일부 어울려요.",
    caution:"지나친 자존심이 협력을 어렵게 만들 수 있어요." },
  신축: { image:"진흙 속의 보석", uunseong:"양", keyword:"재능은있으나인정은나중·종교성",
    personality:"탁월한 재능이 있지만 제대로 인정받기까지 오랜 시간이 걸립니다. 영적·종교적 성향이 강해요.",
    love:"깊고 진지한 사랑을 해요.",
    career:"종교·철학·예술·전문직 분야에 적합해요.",
    caution:"재능이 빛을 발하기까지 인내가 필요해요. 조급함을 버리세요." },
  신묘: { image:"봄 풀밭의 보석", uunseong:"절", keyword:"예민·섬세·완벽주의",
    personality:"예민하고 섬세하며 완벽을 추구해요. 절지에 앉아 강한 의지로 역경을 극복해요.",
    love:"세심하게 상대를 배려해요. 상처를 쉽게 받는 편이에요.",
    career:"예술·패션·의료·정밀 기술 분야에 적합해요.",
    caution:"지나친 완벽주의가 자신과 타인을 지치게 만들 수 있어요." },
  신사: { image:"불 속의 보석", uunseong:"사", keyword:"정제된미·강인함·인내",
    personality:"정제된 아름다움을 추구해요. 사지에 앉아 강한 인내력으로 역경을 극복해요.",
    love:"신중하고 깊이 있는 연애를 해요.",
    career:"예술·의료·법조·전문직 분야에 적합해요.",
    caution:"지나친 자기비판이 발전을 막을 수 있어요." },
  신미: { image:"여름 들판의 보석", uunseong:"쇠", keyword:"세련미·현실적·관리력",
    personality:"세련되고 현실적이에요. 관리 능력이 뛰어나고 실용적으로 상황을 처리해요.",
    love:"현실적이고 안정적인 연애를 선호해요.",
    career:"금융·보험·관리·패션 분야에 적합해요.",
    caution:"지나친 현실주의가 감성을 억압할 수 있어요." },
  신유: { image:"완성된 보석", uunseong:"건록", keyword:"정교·완벽·날카로움",
    personality:"간여지동(같은 기운이 겹친 일주)으로 정교하고 완벽을 추구해요. 날카로운 분석력을 가집니다.",
    love:"높은 기준으로 파트너를 선택해요.",
    career:"의료·정밀 기술·법조·공학 분야에 적합해요.",
    caution:"결벽증적 완벽주의가 인간관계를 어렵게 만들 수 있어요." },
  신해: { image:"겨울 물 위의 보석", uunseong:"목욕", keyword:"감수성·직관·유연함",
    personality:"풍부한 감수성과 직관력을 가집니다. 유연하게 상황에 적응하는 능력이 있어요.",
    love:"감성적이고 낭만적인 연애를 해요.",
    career:"예술·상담·의료·창작 분야에 적합해요.",
    caution:"지나친 감수성으로 상처를 쉽게 받을 수 있어요." },
  임자: { image:"드넓은 바다", uunseong:"제왕", keyword:"카리스마·추진력·양인",
    personality:"병오일주와 함께 최강 양인일주이에요. 간여지동(같은 기운이 겹친 일주)으로 카리스마와 추진력이 극강해요.",
    love:"강렬하고 독점적인 사랑을 해요. 대등한 파트너를 원해요.",
    career:"사업·리더십·전문직에 적합해요.",
    caution:"공격적 면을 조절해야 해요." },
  임인: { image:"봄 강", uunseong:"병", keyword:"진지·장기적사고·권위",
    personality:"진지하고 장기적으로 생각해요. 권위의식이 있으며 논리와 데이터를 중시해요. 한심한 사람을 가장 싫어해요.",
    love:"진지하고 책임감 있는 연애를 해요.",
    career:"연구·전문직·리더십·전략 분야에 적합해요.",
    caution:"너무 진지하고 엄격한 기준이 관계를 무겁게 만들 수 있어요." },
  임진: { image:"봄비 내리는 강", uunseong:"묘", keyword:"총명·조용한강함·괴강",
    personality:"조용하지만 무서운 성격을 가집니다. 괴강일주(魁罡日柱)로 매우 총명해요. 백호살 기운으로 폭발력이 있어요.",
    love:"겉으로는 조용하지만 내면에 강렬한 감정이 있어요.",
    career:"군인·검찰·경찰·의약 분야에 적합해요.",
    caution:"폭발력이 강해 감정 표현 방식을 조절해야 해요." },
  임오: { image:"한여름 태양 아래의 강", uunseong:"태", keyword:"수화기제·재물·도화",
    personality:"수화기제(水火旣濟) 구조로 돈과 명예를 모두 가질 수 있어요. 활동적이고 역동적이며 이성에게 매력적이에요.",
    love:"이성에게 인기가 많어요. 역동적이고 활발한 연애를 해요.",
    career:"창업·기업가·사업 분야에 적합해요.",
    caution:"재정 관리에 신중해야 해요. 충동적 투자를 주의하세요." },
  임신: { image:"가을 강", uunseong:"장생", keyword:"통찰·전략·생명력",
    personality:"깊은 통찰력과 전략적 사고를 가집니다. 장생지에 앉아 생명력이 넘칩니다.",
    love:"신중하고 전략적인 연애를 해요. 지적인 파트너를 선호해요.",
    career:"전략·연구·IT·금융 분야에 적합해요.",
    caution:"지나친 계산이 자연스러운 인간관계를 어렵게 만들 수 있어요." },
  임술: { image:"가을 폭풍우의 강", uunseong:"관대", keyword:"백호괴강·폭발력·예술",
    personality:"백호살(白虎殺)과 괴강살(魁罡殺)을 함께 가집니다. 착해 보이지만 강한 전투력이 있어요. 예술 감각도 탁월해요.",
    love:"겉으로는 부드럽지만 내면에 강렬한 감정이 있어요.",
    career:"예술·군인·사업 분야에 적합해요.",
    caution:"폭발력이 강해 분노 조절이 필요해요." },
  계축: { image:"겨울 논밭의 이슬", uunseong:"관대", keyword:"냉정·형살·전투력",
    personality:"평소 냉정해 보이지만 화가 나면 전투력이 급상승해요. 형살 기운으로 날카롭고 예리해요.",
    love:"신중하게 파트너를 선택해요. 감정 표현이 서툴지만 진심이 있어요.",
    career:"경찰·법조·군인 분야에 적합해요.",
    caution:"분노 폭발 후 수습이 어렵어요. 사전 감정 관리가 중요해요." },
  계묘: { image:"봄비 속의 이슬", uunseong:"장생", keyword:"유쾌·순수·일귀격",
    personality:"유쾌하고 밝으며 순수해요. 미남·미녀가 많어요. 일귀격(日貴格)으로 복을 타고났어요.",
    love:"밝고 유쾌한 연애를 해요.",
    career:"예술·교육·상담 분야에 적합해요.",
    caution:"너무 순수해서 사기를 당할 수 있어요. 사람 보는 눈을 키우세요." },
  계사: { image:"여름 불 속의 이슬", uunseong:"태", keyword:"천을귀인·재물·배우자운",
    personality:"천을귀인(天乙貴人)이 있어 귀인의 도움을 받어요. 재관인(財官印) 구조로 재물운과 배우자운이 모두 좋어요.",
    love:"좋은 배우자를 만날 가능성이 높어요.",
    career:"다방면에서 성공 가능해요.",
    caution:"좋은 기운이 있어도 방심하면 기회를 놓칩니다. 꾸준한 노력이 필요해요." },
  계미: { image:"여름 들판의 안개", uunseong:"묘", keyword:"공상·전략·실속",
    personality:"공상적이고 전략적이에요. 행동보다 계산이 먼저이에요. 실속을 챙기는 전략가이에요.",
    love:"계산적이지만 진심이 있어요.",
    career:"전략·기획·상담·분석 분야에 적합해요.",
    caution:"지나친 계산으로 자연스러운 감정이 억압될 수 있어요." },
  계유: { image:"가을 보석 위의 이슬", uunseong:"병", keyword:"예술적감각·직관·미남미녀",
    personality:"탁월한 예술적 감각과 직관력이 있어요. 미남·미녀가 많어요.",
    love:"감성적이고 낭만적인 연애를 해요.",
    career:"예술·디자인·음악·창작 분야에 적합해요.",
    caution:"지나친 예민함이 스트레스가 될 수 있어요." },
  계해: { image:"깊고 맑은 겨울 물", uunseong:"제왕", keyword:"직관·감수성·통찰",
    personality:"간여지동(같은 기운이 겹친 일주)으로 예리한 직관과 풍부한 감수성을 가집니다. 순수한 수기(水氣)로 깊은 통찰력이 있어요.",
    love:"감성적이고 예민한 연애를 해요.",
    career:"상담·심리·예술·철학·영적 분야에 적합해요.",
    caution:"지나치게 흡수적이고 경계가 없어 자기 보호가 필요해요." },
};

// 일주 career 텍스트를 식상(食傷) 세력에 맞춰 보정한다.
// 무식상이면 같은 일주라도 몸 쓰는 직업(군경·스포츠·기계 등)을 추천 목록에서 제외하고,
// 식상이 많으면(2개 이상) 그 일주 추천에 몸 쓰는 직업이 포함돼 있을 때 더 어울린다는 점을 짚어준다.
const BODY_LABOR_TERMS = ["운동선수", "스포츠", "무술", "격투", "군인", "경찰", "소방관", "건설", "기계", "물류", "유통", "교도관"];

function extractCareerListItems(text: string): string[] {
  const items: string[] = [];
  const re = /([가-힣]+(?:·[가-힣]+)*)(?:\s(?:분야에 적합해요|쪽도 일부 어울려요)\.)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) items.push(...m[1].split("·"));
  return items;
}

export function adjustCareerByExpression(career: string, sikSangCount: number): string {
  if (sikSangCount === 0) {
    const cleaned = career
      .replace(/([가-힣]+(?:·[가-힣]+)*)(\s(?:분야에 적합해요|쪽도 일부 어울려요)\.)/g, (_m, list: string, suffix: string) => {
        const items = list.split("·").filter((item: string) => !BODY_LABOR_TERMS.includes(item));
        return items.length === 0 ? "" : items.join("·") + suffix;
      })
      .replace(/\s{2,}/g, " ")
      .trim();
    return cleaned || career;
  }
  if (sikSangCount >= 2) {
    const hasBody = extractCareerListItems(career).some(i => BODY_LABOR_TERMS.includes(i));
    if (hasBody) return career + " 표현·결과물을 만드는 기운이 많아 몸으로 직접 표현하고 부딪히는 일에서 유독 두각을 보일 수 있어요.";
  }
  return career;
}

// ── 조후용신 룩업 테이블 (일간 × 계절) ──────────────────────────────────────
// 조후용신이 억부용신보다 우선: 亥/子/丑/寅월(겨울·초봄) 또는 巳/午/未/申월(여름·초가을)
export const JOHU_YONGSHIN: Record<string, Record<"봄"|"여름"|"가을"|"겨울", { primary: Element; secondary: Element; desc: string }>> = {
  갑: {
    봄:  { primary:"수", secondary:"금", desc:"계수(癸)로 목을 키우고 경금(庚)으로 다듬어요" },
    여름:{ primary:"수", secondary:"금", desc:"임계수(壬癸)로 불기운을 식혀야 해요" },
    가을:{ primary:"금", secondary:"화", desc:"경금(庚)으로 나무를 정리하고 정화(丁)로 온기를 줍니다" },
    겨울:{ primary:"화", secondary:"금", desc:"병화(丙)로 따뜻하게 하고 경금(庚)으로 단단하게 해요" },
  },
  을: {
    봄:  { primary:"수", secondary:"화", desc:"계수(癸)로 생기를 주고 병화(丙)로 햇볕을 줍니다" },
    여름:{ primary:"수", secondary:"토", desc:"임계수(壬癸)로 냉각하고 무토(戊)로 수분을 저장해요" },
    가을:{ primary:"화", secondary:"토", desc:"병화(丙)로 온기를 주고 무토(戊)로 뿌리를 내립니다" },
    겨울:{ primary:"화", secondary:"토", desc:"병화(丙)로 따뜻하게 하고 무토(戊)로 수분을 제어해요" },
  },
  병: {
    봄:  { primary:"목", secondary:"수", desc:"갑목(甲)으로 불을 키우고 임수(壬)로 균형을 잡어요" },
    여름:{ primary:"수", secondary:"목", desc:"임수(壬)로 뜨거운 불을 식히고 갑목(甲)으로 생기를 줍니다" },
    가을:{ primary:"목", secondary:"금", desc:"갑목(甲)으로 불을 키우고 경금(庚)으로 단단하게 해요" },
    겨울:{ primary:"목", secondary:"수", desc:"갑목(甲)으로 불을 피우고 임수(壬)로 조화를 이룹니다" },
  },
  정: {
    봄:  { primary:"목", secondary:"금", desc:"갑목(甲)으로 불을 키우고 경금(庚)으로 방향을 잡어요" },
    여름:{ primary:"수", secondary:"목", desc:"계수(癸)로 뜨거운 불을 조절합니다(임수는 정임합목으로 변질)" },
    가을:{ primary:"목", secondary:"금", desc:"갑목(甲)으로 불을 키우고 경금(庚)으로 다듬어요" },
    겨울:{ primary:"목", secondary:"화", desc:"갑목(甲)으로 불을 피우고 병화(丙)로 온기를 더해요" },
  },
  무: {
    봄:  { primary:"화", secondary:"수", desc:"병화(丙)로 토를 데우고 임수(壬)로 수분을 공급해요" },
    여름:{ primary:"수", secondary:"목", desc:"임수(壬)로 뜨거운 토를 식히고 갑목(甲)으로 생기를 줍니다" },
    가을:{ primary:"금", secondary:"화", desc:"경신금(庚辛)으로 토의 기운을 설기하고 화로 온기를 줍니다" },
    겨울:{ primary:"화", secondary:"목", desc:"병화(丙)로 차가운 토를 데웁니다" },
  },
  기: {
    봄:  { primary:"화", secondary:"수", desc:"병화(丙)로 토를 데우고 계수(癸)로 수분을 공급해요" },
    여름:{ primary:"수", secondary:"금", desc:"계수(癸)로 뜨거운 토를 식히고 금으로 수를 생해요" },
    가을:{ primary:"화", secondary:"토", desc:"병화(丙)로 온기를 주고 토로 안정을 유지해요" },
    겨울:{ primary:"화", secondary:"수", desc:"병화(丙)로 차가운 토를 데웁니다" },
  },
  경: {
    봄:  { primary:"화", secondary:"목", desc:"정화(丁)로 금을 단련하고 갑목(甲)으로 방향을 잡어요" },
    여름:{ primary:"수", secondary:"목", desc:"임수(壬)로 뜨거운 금을 식히고 갑목(甲)으로 균형을 잡어요" },
    가을:{ primary:"토", secondary:"수", desc:"무토(戊)로 금을 생하고 임계수(壬癸)로 설기해요" },
    겨울:{ primary:"화", secondary:"토", desc:"병화(丙)·정화(丁)로 차가운 금을 단련하고 무토(戊)로 지지해요" },
  },
  신: {
    봄:  { primary:"수", secondary:"목", desc:"임수(壬)로 금을 씻어내고 갑목(甲)으로 생기를 줍니다" },
    여름:{ primary:"수", secondary:"토", desc:"임수(壬)로 뜨거운 금을 식히고 무토(戊)로 지지해요" },
    가을:{ primary:"수", secondary:"토", desc:"임수(壬)로 설기하고 무토(戊)로 지지해요" },
    겨울:{ primary:"화", secondary:"토", desc:"정화(丁)로 단련합니다(병화는 병신합수로 신금 소멸 우려)" },
  },
  임: {
    봄:  { primary:"토", secondary:"금", desc:"무토(戊)로 물을 막고 경금(庚)으로 수원을 공급해요" },
    여름:{ primary:"금", secondary:"목", desc:"경금(庚)으로 수원을 공급하고 갑목(甲)으로 균형을 잡어요" },
    가을:{ primary:"토", secondary:"목", desc:"무토(戊)로 물을 막고 갑목(甲)으로 생기를 줍니다" },
    겨울:{ primary:"화", secondary:"토", desc:"병화(丙)로 차가운 물을 데우고 무토(戊)로 제방을 쌓어요" },
  },
  계: {
    봄:  { primary:"화", secondary:"금", desc:"병화(丙)로 이슬을 키우고 신금(辛)으로 수원을 공급해요" },
    여름:{ primary:"금", secondary:"토", desc:"경신금(庚辛)으로 수원을 공급해요" },
    가을:{ primary:"화", secondary:"목", desc:"병화(丙)로 온기를 주고 갑목(甲)으로 생기를 줍니다" },
    겨울:{ primary:"화", secondary:"목", desc:"병화(丙)·정화(丁)로 차가운 이슬을 따뜻하게 해요" },
  },
};

// 월지 → 계절 매핑 (조후용신 사용 시)
export function getSeasonByMonth(monthJj: string): "봄"|"여름"|"가을"|"겨울" {
  if (["인","묘","진"].includes(monthJj)) return "봄";
  if (["사","오","미"].includes(monthJj)) return "여름";
  if (["신","유","술"].includes(monthJj)) return "가을";
  return "겨울";
}

// 조후용신 필요 여부: 극한의 계절(冬/夏)에서 억부보다 조후 우선
export function needsJohu(monthJj: string): boolean {
  return ["사","오","미","해","자","축"].includes(monthJj);
}

// 일주로 ILJU_60 조회 헬퍼
export function getIljuInfo(dayCg: string, dayJj: string) {
  return ILJU_60[dayCg + dayJj] ?? null;
}

// 십성 위치별 해석 헬퍼
export function getSipsungPositionDesc(position: "연주"|"월주"|"일지"|"시주", sipsung: string): string {
  return SIPSUNG_BY_POSITION[position]?.[sipsung] ?? "";
}

// ── 간여지동(干與支同) ─────────────────────────────────────────────────────
// 천간과 지지가 같은 오행·음양일 때 자아가 강하게 고정되는 특성

export interface GanyeoJidongTrait {
  element: string;         // 오행
  general: string;         // 해당 오행 간여지동 공통 특성
  specific: string;        // 해당 일주만의 특성
  stubbornness: number;    // 고집 강도 1~5
  keywords: string[];
}

// 간여지동 전체 공통 특성
export const GANYEO_JIDONG_GENERAL = {
  desc: "천간과 지지가 같은 기운으로 자아(自我)가 한 방향으로 강하게 고정돼요. 속마음이 행동에 그대로 드러나서 '속이 훤히 보이는' 사람이라는 인상을 주기 쉬워요. 자아가 비대해 주변 시선에 영향받지 않으려 하지만, 역설적으로 인정욕구가 강해요.",
  weakness: "월주 간여지동이 일주 간여지동을 극(剋)하는 구조이면 고집이 어느 정도 완화되는 편이에요.",
};

// 일주별 간여지동 상세 특성
export const GANYEO_JIDONG_ILJU: Record<string, GanyeoJidongTrait> = {
  갑인: {
    element: "목",
    general: "목(木) 간여지동: 자기 신념이 곧 진리라고 느끼며 좀처럼 방향을 바꾸지 않아요. 고집의 방향이 '성장'과 연결되어 있어 주변을 이끌려는 성향이 강해요.",
    specific: "갑인일주는 대장 기질이 뚜렷하고 자존심이 매우 세요. 자기 페이스를 방해받으면 불쾌함을 숨기지 못해요.",
    stubbornness: 4,
    keywords: ["독립심","자존심","리더십","고집"],
  },
  을묘: {
    element: "목",
    general: "목(木) 간여지동: 자기 신념이 곧 진리라고 느끼며 좀처럼 방향을 바꾸지 않아요.",
    specific: "을묘일주는 간여지동 중 고집이 가장 완강한 축에 속해요. 부드러운 외모와 달리 내면은 절대 굽히지 않는 심지가 있어요. 갑인보다 소리는 작지만 더 끈질기게 자기 주장을 관철해요. '개 고집'이라는 평을 듣기도 해요.",
    stubbornness: 5,
    keywords: ["고집","인내","유연해 보이지만 불굴","자기중심"],
  },
  병오: {
    element: "화",
    general: "화(火) 간여지동: 열정적이고 즉각적이며 감정 표현이 직접적이에요. 에너지 소모가 빠르고, 관심의 중심에 서고 싶어 해요.",
    specific: "병오일주는 화려하고 표현이 과감해요. 자기 존재감을 드러내고 싶은 욕구가 강해 무리에서 튀는 행동을 하기도 해요. 감정 기복이 있지만 뒤끝은 없어요.",
    stubbornness: 3,
    keywords: ["열정","즉흥","존재감","뒤끝없음"],
  },
  정사: {
    element: "화",
    general: "화(火) 간여지동: 열정적이고 즉각적이며 감정 표현이 직접적이에요.",
    specific: "정사일주는 병오보다 내면 지향적이에요. 자기만의 세계와 취향이 뚜렷하고, 신뢰하는 사람에게만 속을 열어요. 음화(陰火)답게 불꽃이 오래 타며 집착 경향이 있어요.",
    stubbornness: 3,
    keywords: ["집착","신비로움","선택적 개방","지속성"],
  },
  무오: {
    element: "토·화",
    general: "무토 일간이 오화 지지를 깔고 있어 화생토(火生土)로 에너지가 더 강하게 쌓여요. 자신감이 두껍고 쉽게 흔들리지 않아요.",
    specific: "무오일주는 묵직한 자존감과 실용주의가 결합돼요. 말보다 행동이 앞서고, 한번 결정하면 좀처럼 번복하지 않아요.",
    stubbornness: 4,
    keywords: ["자신감","실용","묵직함","불굴"],
  },
  기미: {
    element: "토",
    general: "토(土) 간여지동: 안정 지향적이고 중재하는 척하지만, 실제론 자기 중심축을 절대 움직이지 않아요. 고집이 가장 티 안 나게 강한 유형이에요.",
    specific: "기미일주는 을묘와 함께 고집 랭킹 상위권이에요. 겉으로는 순하고 맞장구를 잘 치지만 막상 자기 뜻과 다른 결론이 나면 움직이지 않아요. 속내를 잘 드러내지 않아요.",
    stubbornness: 5,
    keywords: ["고집","겉다름","순해 보임","내면 불변"],
  },
  경신: {
    element: "금",
    general: "금(金) 간여지동: 논리와 근거로 반박하는 데 탁월해요. '너 똑똑하다' 소리를 듣지만, 상대가 지쳐 포기하게 만드는 방식이에요.",
    specific: "경신일주는 금 간여지동 중 내로남불 경향이 두드러져요. 자신에겐 너그럽고 타인에겐 엄격한 기준을 적용해요. 허세가 섞여 있어 실속보다 이미지를 중시하기도 해요.",
    stubbornness: 4,
    keywords: ["논리","내로남불","허세","자기확신"],
  },
  신유: {
    element: "금",
    general: "금(金) 간여지동: 논리와 근거로 조목조목 반박하는 데 탁월해요. 감정보다 이성으로 설득하려 해요.",
    specific: "신유일주는 경신보다 세밀하고 예민해요. 틀린 것을 그냥 넘기지 못하며, 완벽주의적 고집이 있어요. 음금(陰金)답게 칼날이 날카롭고 비판이 직접적이에요.",
    stubbornness: 4,
    keywords: ["완벽주의","예민함","비판적","논리"],
  },
  임자: {
    element: "수",
    general: "수(水) 간여지동: 사유가 깊고 언변이 유창해요. 생각의 폭이 넓지만 종종 '개똥철학'처럼 보이는 독자적 세계관을 가져요.",
    specific: "임자일주는 말빨이 뛰어나고 자기 세계관이 뚜렷해요. 을묘처럼 고집이 외형에서 드러나지 않고, 공감받지 못하면 내면에서 우울감으로 이어지는 경향이 있어요. '내 말을 이해해줄 사람이 없다'는 외로움을 느끼기 쉬워요.",
    stubbornness: 3,
    keywords: ["말빨","개똥철학","공감욕구","우울감 취약"],
  },
  계해: {
    element: "수",
    general: "수(水) 간여지동: 사유가 깊고 언변이 유창해요.",
    specific: "계해일주는 임자보다 감각적이고 직관적이에요. 음수(陰水)의 특성상 흡수력이 강하고, 상대의 감정을 잘 읽어요. 그러나 자기 감정의 경계선은 함부로 건드리면 차갑게 닫아버려요.",
    stubbornness: 3,
    keywords: ["직관","감수성","경계설정","냉온차이"],
  },
};

// 간여지동과 이성운/궁합 — 흔한 통설("남자복/여자복이 없다")에 대한 명리학적 재해석
export const GANYEO_JIDONG_LOVE = {
  disclaimer: "간여지동을 곧바로 '이성운이 약하다'로 연결하는 건 논리적으로 몇 단계를 건너뛴 해석이에요. 간여지동 자체는 이성운의 좋고 나쁨을 직접 가리키는 표식이 아니에요.",
  charm: "오히려 간여지동은 매력자본을 풍부하게 내포한 구조예요. 여기서 매력이란 '내가 뿜어내는 에너지와 기질이 타인에게 흡인력으로 작용한다'는 의미입니다. 자아가 뚜렷한 만큼 존재감 자체가 강한 인상을 남겨요.",
  hapTrigger: "이 매력은 천간합이나 지지합이 형성될 때 특히 이성에게 강하게 발현돼요. 평소엔 무덤덤해 보여도, 합이 닿는 상대 앞에서는 숨겨둔 매력이 자연스럽게 드러나는 경우가 많아요.",
  bigeopMany: "독립심과 자존심의 기운이 유독 많은 사주(같은 오행이 여러 개 겹친 경우)는 '남자복·여자복이 없다'기보다, 본인의 자아와 기준이 워낙 확고해서 눈에 차는 상대를 만나기 어려운 쪽에 가까워요. 그래서 연애보다 친구·자기 일에서 더 큰 즐거움을 느끼는 경향이 나타나기도 해요.",
  notRequired: "이 기운이 많을수록 '반드시 결혼해야 행복하다'는 틀에서 자유로운 편이에요. 명리학적으로도 결혼이 모든 사주에 정해진 정답은 아니며, 사회가 정답이라 정해둔 기준과 명리학의 해석이 항상 일치하지는 않아요.",
  coupleGanyeo: "간여지동인 두 사람이 부부가 되면, 서로의 강한 자아와 영역을 있는 그대로 인정하고 존중할 수 있어 진실하고 깊은 신뢰의 관계로 이어지는 경우가 많아요.",
  extraFacts: [
    "일지(배우자 자리)가 간여지동이면 배우자 자리에도 강한 자아가 자리해, 부부가 서로의 영역과 결정권을 침범하지 않는 '따로 또 같이'형 관계일 때 오래갑니다.",
    "독립성과 추진력이 강해 1인 기업·전문직·프리랜서처럼 스스로 판단하고 책임지는 일에서 두각을 나타내는 경우가 많아요.",
    "에너지를 한 방향으로 강하게 쏟는 만큼, 과로나 스트레스성 질환(해당 오행과 연결된 장기)에 평소보다 신경 쓰는 것이 좋아요.",
  ],
};

// 간여지동의 강점 — "팔자가 드세다"는 통설을 뒤집는 6가지 포인트
export const GANYEO_JIDONG_STRENGTHS: { title: string; body: string }[] = [
  {
    title: "생각하는 순간 이미 실행 중인 추진력",
    body: "태어난 날의 기운은 천간(생각)과 지지(현실)가 하나로 겹친 자리예요. 이 둘이 같은 오행이라는 건 생각과 현실 사이에 틈이 없다는 뜻이에요. 남들이 '할까 말까' 고민할 때 이미 행동에 들어가 있어요. 좋게 발현되면 결과로 증명하는 실행력이지만, 안 좋게 발현되면 주변을 살피지 않는 독단이 될 수 있어요.",
  },
  {
    title: "끝까지 밀어붙이는 힘 — 자수성가형 사주에 자주 등장",
    body: "사업이나 프로젝트를 끝까지 밀어붙이는 힘이 있어서 성과를 크게 내는 경우가 많아요. 자수성가한 사업가의 사주에서 간여지동이 자주 보이는 이유예요. 다만 에너지가 강한 만큼 주변 사람이 그 기세에 눌려 떠나거나, 혼자 너무 빨리 달리다 중요한 걸 놓칠 위험도 함께 따라와요.",
  },
  {
    title: "직접 겪어야 납득하는 타입",
    body: "남의 조언을 미리 받아들이기보다 직접 부딪쳐 보고 확인하는 타입이에요. 나쁘게 보면 같은 고생을 사서 하는 것처럼 보이지만, 좋게 보면 그 과정에서 누구도 흔들 수 없는 자기만의 노하우와 데이터를 쌓아 독보적인 전문가가 되는 길이기도 해요.",
  },
  {
    title: "자기 확신으로 다시 일어서는 힘",
    body: "일지에 일간과 같은 기운이 한 번 더 있다는 건 자기 확신과 자존감이 그만큼 두텁다는 의미예요. 어떤 역경이 와도 스스로를 믿고 다시 일어설 수 있는 큰 장점이에요. 다만 이게 과해지면 '나만 옳다'는 태도로 흐를 수 있어, 자신을 아끼는 만큼 타인의 영역도 존중하는 연습이 필요해요.",
  },
  {
    title: "배우자와 평등하거나, 매일 부딪치거나",
    body: "배우자 자리에 일간과 비슷한 기운이 앉아 있어서, 서로 취미를 공유하고 친구처럼 평등하게 지낼 때는 더없이 좋은 짝이 돼요. 반대로 서로 양보 없이 기싸움을 시작하면 부딪칠 수밖에 없어요. 책임을 나누고 서로의 선을 지키는 노력이 있을 때 이 강한 기운이 관계의 힘으로 바뀌어요.",
  },
  {
    title: "답정너 소리를 듣지만, 알고 보면 리더감",
    body: "이미 마음속에 답을 정해두고 대화를 시작하는 경우가 많아 '벽보고 얘기하냐'는 말을 듣기도 해요. 하지만 이 확신과 추진력을 목표를 이루는 방향으로 쓰면 카리스마 있는 리더가 돼요. 이 강한 에너지를 자존심 세우기에 쓰느냐, 목표 달성에 쓰느냐의 차이로 결과가 크게 갈려요.",
  },
];

// 간여지동 헬퍼: 해당 일주가 간여지동인지 확인
export function isGanyeoJidong(dayCg: string, dayJj: string): boolean {
  return (dayCg + dayJj) in GANYEO_JIDONG_ILJU;
}

// 간여지동 헬퍼: 월주가 일주를 극하는지 확인 (고집 완화 조건)
const OHAENG_GEUKHAE: Record<string, string> = {
  목: "금", 화: "수", 토: "목", 금: "화", 수: "토",
};
// 오행 상생: key를 생(生)하는 오행 (예: 목 -> 목을 생하는 것은 수)
const OHAENG_SAENG: Record<string, string> = {
  목: "수", 화: "목", 토: "화", 금: "토", 수: "금",
};
const CG_OHAENG: Record<string, string> = {
  갑:"목",을:"목",병:"화",정:"화",무:"토",기:"토",경:"금",신:"금",임:"수",계:"수",
};
export const JJ_OHAENG: Record<string, string> = {
  자:"수",축:"토",인:"목",묘:"목",진:"토",사:"화",오:"화",미:"토",신:"금",유:"금",술:"토",해:"수",
};

export function monthJidongGeuksIlju(monthCg: string, monthJj: string, dayCg: string, dayJj: string): boolean {
  const monthGanyeoKey = monthCg + monthJj;
  const dayTrait = GANYEO_JIDONG_ILJU[dayCg + dayJj];
  if (!dayTrait || !(monthGanyeoKey in GANYEO_JIDONG_ILJU)) return false;
  const monthOhaeng = CG_OHAENG[monthCg] ?? JJ_OHAENG[monthJj];
  const dayOhaeng = CG_OHAENG[dayCg];
  return OHAENG_GEUKHAE[dayOhaeng] === monthOhaeng;
}

// ── 사주 해석 원칙: 격국보다 글자 속성 중심 ──────────────────────────────
// 격국(식신격·상관격 등)은 해석자마다 기준이 달라 일관성이 없다.
// 사주의 본질은 방향 제시에 있으며, 글자(천간·지지) 고유의 속성을 읽는 것이 핵심이다.

// 지지 글자별 시간대 기운 및 핵심 속성
export const JIJI_HOURLY_NATURE: Record<string, {
  time: string; energy: string; trait: string; caution?: string;
}> = {
  자: { time: "23:00~01:00", energy: "깊은 밤의 고요와 응집", trait: "내면에 에너지를 축적하며 밖으로 드러내지 않는다. 집중력과 지혜가 있으나 개방보다 선별적 공유를 선호한다." },
  축: { time: "01:00~03:00", energy: "새벽 전의 인내와 저장", trait: "표면상 느리고 묵직하나 내부 저장력이 강하다. 쉽게 드러내지 않지만 한번 결정하면 흔들리지 않는다." },
  인: { time: "03:00~05:00", energy: "새벽 여명의 팽창과 출발", trait: "계획과 의지가 넘치고 무한한 가능성을 품는다. 초반 추진력이 강하나 지속력이 약해 흥미가 식으면 손을 놓는다.", caution: "시작은 강하나 마무리 지속력을 의식적으로 보완해야 한다." },
  묘: { time: "05:00~07:00", energy: "이른 아침의 섬세함과 개인성", trait: "독립적이고 개인주의적 성향이 강하다. 처음엔 순해 보이나 자기 원칙에 반하는 것은 집요하게 맞선다." },
  진: { time: "07:00~09:00", energy: "아침의 활력과 변화", trait: "변화와 전환에 능하다. 상황을 통합하고 조율하는 능력이 있으며 다양한 기운을 수용한다." },
  사: { time: "09:00~11:00", energy: "오전의 고조와 집중", trait: "집중력과 목적 지향성이 강하다. 현실적 계획 실행 능력이 뛰어나나 과열·과로 경향이 있다." },
  오: { time: "11:00~13:00", energy: "한낮의 최고조 열기", trait: "에너지가 폭발적이고 표현력이 강하다. 열정적이나 지속성 면에서 냉각도 빠르다." },
  미: { time: "13:00~15:00", energy: "오후의 여운과 축적", trait: "따뜻하고 포용적이다. 겉으로는 부드럽지만 내면에 단단한 자기 가치관이 자리잡고 있다." },
  신: { time: "15:00~17:00", energy: "오후의 냉정함과 결단", trait: "논리와 원칙을 중시한다. 감정보다 사실을 우선하며 단호하고 분명한 결정을 내린다." },
  유: { time: "17:00~19:00", energy: "저녁의 정밀함과 완성", trait: "완벽주의적이고 섬세하다. 마무리를 중시하며 품질과 기준에 대한 집착이 강하다." },
  술: { time: "19:00~21:00", energy: "황혼의 저장과 마무리", trait: "감추는 능력이 강하다. 겉으로는 온화하나 내부에 강한 의지와 판단력이 있다." },
  해: { time: "21:00~23:00", energy: "밤의 지혜와 수용", trait: "직관과 통찰이 탁월하다. 흐름을 읽는 능력이 있으나 자기 감정의 경계를 함부로 건드리면 단단히 닫아버린다." },
};

// 일간별 겉모습과 속마음
// 양일간(갑·병·무·경·임)은 상생·설기에 능하고, 음일간(을·정·기·신·계)은 상극에 능하다
export const ILGAN_INNER_OUTER: Record<string, {
  outer: string; inner: string; synthesis: string;
}> = {
  갑: { outer: "독립심과 자존심", inner: "사업·투자성 큰돈", synthesis: "독립적이고 자기 주관이 뚜렷해 보이나, 내면에는 현실적 실리와 외향적 확장 욕구가 있다." },
  을: { outer: "승부욕과 인간관계 변화", inner: "안정적인 돈", synthesis: "경쟁적이고 독립적으로 보이나, 내면은 안정된 고정 수입과 실속을 원한다. 손해를 매우 싫어한다." },
  병: { outer: "먹을복과 재능", inner: "규칙·책임·사회적 인정", synthesis: "표현력 강하고 활달해 보이나, 내면에는 주도권과 통제에 대한 욕구가 있다. 관계에서 칼자루를 쥐려 한다." },
  정: { outer: "표현력과 개성", inner: "규칙·책임·사회적 인정", synthesis: "창의적이고 자유분방해 보이나, 내면에는 원칙과 명예를 중시하는 보수적인 면이 있다." },
  무: { outer: "사업·투자성 큰돈", inner: "직관·예술적 감수성", synthesis: "쾌활하고 사교적으로 보이나, 내면에는 생각이 많고 특정 부분에 대한 집착과 강박이 있다." },
  기: { outer: "안정적인 돈", inner: "공부·문서·보호받는 운", synthesis: "실속 있고 꼼꼼해 보이나, 내면에는 사랑받고 싶고 의미 있는 관계에서 인정받고 싶은 욕구가 깊다." },
  경: { outer: "강한 통제와 경쟁", inner: "독립심과 자존심", synthesis: "강하고 권위적으로 보이나, 내면에는 자기 발전과 독립에 대한 강한 욕구가 있다." },
  신: { outer: "규칙·책임·사회적 인정", inner: "승부욕과 인간관계 변화", synthesis: "단정하고 원칙적으로 보이나, 내면에는 회피 성향과 경쟁·자아 갈등이 잠재해 있다." },
  임: { outer: "직관·예술적 감수성", inner: "먹을복과 재능", synthesis: "생각 많고 분석적으로 보이나, 내면은 지금 이 순간을 즐기고 싶어하는 단순하고 직관적인 욕구가 자리한다." },
  계: { outer: "공부·문서·보호받는 운", inner: "표현력과 개성", synthesis: "사랑스럽고 배려 깊어 보이나, 내면에는 기존 질서를 뒤집으려는 반항적 기운이 잠재해 있다." },
};

// 오행별 식상(食傷) 에너지 방향성
// 내가 생하는 오행이 식상이므로, 그 오행의 속성이 곧 표현 방식을 결정한다
export const SIKSANG_DIRECTION: Record<string, {
  siksangEl: string; direction: "확장" | "억제" | "정화" | "저장" | "변환";
  desc: string;
}> = {
  목: { siksangEl: "화", direction: "확장", desc: "목 일간의 표현·결과물을 만드는 기운은 불(火)이다. 밝히고 드러내고 확산시키는 방향으로 에너지를 쓴다. 표현과 발산, 사람을 모으고 이끄는 방식으로 작동한다." },
  화: { siksangEl: "토", direction: "저장", desc: "화 일간의 표현·결과물을 만드는 기운은 흙(土)이다. 열을 품고 축적하며 안정화시키는 방향이다. 실질을 다지고 기반을 쌓는 방식으로 드러난다." },
  토: { siksangEl: "금", direction: "억제", desc: "토 일간의 표현·결과물을 만드는 기운은 금(金)이다. 정제하고 선별하며 불필요한 것을 걷어내는 방향이다. 날카로운 판단과 기준 제시로 작동한다." },
  금: { siksangEl: "수", direction: "억제", desc: "금 일간의 표현·결과물을 만드는 기운은 물(水)이다. 불을 끄고 흐름을 통제하며 억누르는 방향이다. 확산보다 수렴·제어·차단의 방식으로 에너지가 발현된다." },
  수: { siksangEl: "목", direction: "변환", desc: "수 일간의 표현·결과물을 만드는 기운은 나무(木)이다. 물을 흡수해 성장으로 전환하는 방향이다. 축적된 것을 구체적인 성장과 확장으로 연결하는 방식으로 드러난다." },
};

// ── 식신·상관 심층 해설 ──────────────────────────────────────────────────
export const SIKSANG_SIPSEONG = {
  sikshin: {
    desc: "대가 없이 베푸는 기운. 현재 순간에 충실하며 즉각적인 만족을 추구한다.",
    strength: [
      "표현력과 감수성이 풍부하여 주변 사람의 감정을 끌어올리는 능력이 있다",
      "조직이나 타이틀 없이도 무에서 유를 만들어내는 독창적 역량이 있다",
      "자신감 있는 태도를 유지하여 자연히 위로 올라가는 흐름이 생긴다",
      "감정 정리가 빠르고 이별 후 회복력이 강하다",
    ],
    weakness: [
      "현재에 몰입하여 미래 예측이 약하고 감정 변덕이 심할 수 있다",
      "사소한 약속과 말을 잘 잊어 상대에게 무관심으로 오해받을 수 있다",
      "흥미가 식으면 빠르게 철수하는 경향이 있어 지속성이 약하다",
    ],
    career: "스스로 가치를 만들어내는 독립형 영역. 창작·예술·콘텐츠·전문 기술직에서 두각을 나타낸다.",
    relationship: "초반 매력과 표현력이 강하나, 세세한 것을 기억하지 못해 오해가 생길 수 있다. 의식적인 배려가 필요하다.",
    appearance: "표현·결과물을 만드는 기운이 강한 경우 눈빛이 살아있고 표현이 명확하며 말에 머뭇거림이 없다.",
  },
  sangkwan: {
    desc: "보상을 기대하며 베푸는 기운. 영리하고 전략적이며 불합리에 저항하는 기질이 강하다.",
    strength: [
      "창의적 발상과 반전 사고가 뛰어나다",
      "불합리한 관행을 거부하고 새로운 방식을 개척하는 힘이 있다",
      "언변과 설득력이 강하다",
    ],
    weakness: [
      "기대한 보상이 없을 때 급격히 냉각되거나 불만이 표출된다",
      "권위에 저항하는 성향이 강해 조직 내 갈등을 일으킬 수 있다",
    ],
    career: "기존 구조를 혁신하는 분야. 창업·전문 컨설턴트·예술 혁신 분야에서 강점을 발휘한다.",
    relationship: "명석하고 매력적이나 기대치가 충족되지 않으면 관계에서 급냉하는 경향이 있다.",
    appearance: "표현력과 개성이 강한 경우 눈빛에 날카로움이 있고 말에 논리와 비판적 시각이 드러난다.",
  },
  vs_gwanseong: {
    siksang: "무에서 유를 창조하는 독립형. 구조·타이틀 없이도 자기 능력으로 위로 올라갈 수 있다.",
    gwanseong: "기존 구조와 조직의 힘을 활용하는 체제 활용형. 단독보다 시스템 안에서 성과를 극대화한다.",
  },
  low_siksang: {
    desc: "표현·결과물을 만드는 기운이 부족하거나 크게 빠져나간 경우의 특성.",
    traits: [
      "표현보다 내면에서 문제를 처리하는 경향이 강하다",
      "해결되지 않은 문제가 있으면 쉽게 잠들지 못하고 걱정이 많다",
      "과잉방어적 태도로 나타날 수 있다",
      "말보다 생각이 앞서 표현이 느리거나 불분명해 보일 수 있다",
    ],
  },
};

// ── 신강·신약 심층 기질 해설 ──────────────────────────────────────────────
export const SINGANG_TRAITS: Record<"신강"|"신약"|"중화", {
  mindset: string; boundary: string; mental: string; style: string; caution: string;
}> = {
  신강: {
    mindset: "자기 기준으로 좋고 나쁨을 판단해요. 외부 시선보다 스스로의 판단을 우선하며, 본인에게 검증된 것을 선호해요.",
    boundary: "개인 영역에 대한 감각이 분명해요. 다수의 공론보다 1:1 소통을 선호하며, 스스로 허용한 관계에만 마음을 엽니다.",
    mental: "경쟁보다 내면에서 먼저 이기고 시작하는 정신적 강인함이 있어요. 걱정과 불안도 있으나 스스로 수용하며 균형을 찾는 능력이 탁월해요.",
    style: "익숙함에 가치를 두고, 지금 이 상태에서도 충분한 만족을 찾는 안빈낙도(安貧樂道) 기질이 있어요. 포기처럼 보여도 내면의 욕심은 사라지지 않어요.",
    caution: "경쟁·자존심의 기운이 강하다는 것은 책임지고 싶은 대상이 많다는 뜻이기도 해요. 늘 부족한 듯한 불안감이 있으나, 실제로는 충분히 갖춰져 있는 경우가 많어요.",
  },
  신약: {
    mindset: "외부 환경과 타인의 에너지에 민감하게 반응해요. 분위기를 잘 읽고, 관계 속에서 힘을 얻어요.",
    boundary: "소통과 공유에 열려 있어요. 집단 안에서 에너지를 얻고, 함께할 때 능력이 배가돼요.",
    mental: "환경 변화에 유연하게 적응해요. 좋은 인연과 도움의 기운이 함께할 때 잠재력이 최대로 발현돼요.",
    style: "새로운 정보와 주변의 조언을 적극적으로 수용해요. 최신 흐름에 민감하고 트렌드를 빠르게 흡수해요.",
    caution: "타인의 기운에 지나치게 영향받지 않도록 자신의 중심을 유지하는 것이 중요해요.",
  },
  중화: {
    mindset: "자신의 기준과 외부 정보를 함께 활용하는 균형 감각이 있어요. 편향 없이 상황을 판단해요.",
    boundary: "상황에 따라 유연하게 거리를 조절해요. 극단보다 중도를 선택하는 경향이 있어요.",
    mental: "감정 기복이 크지 않고, 큰 파도 없이 꾸준히 앞으로 나아가는 안정성이 장점이에요.",
    style: "다양한 선택지를 고려한 후 결정해요. 급격한 변화보다 점진적인 성장을 선호해요.",
    caution: "부족한 기운을 보충하는 용신을 꾸준히 활용하는 것이 장기적으로 중요해요.",
  },
};

// ── 재성 위치 심층 해석 (천간·지지·지장간) ──────────────────────────────
// 천간=드러난 재성, 지지=반은 숨긴 재성, 지장간=깊이 숨긴 재성
export const JAESEONG_POSITION_INSIGHT: Record<"천간"|"지지"|"지장간"|"없음", {
  desc: string; wealth: string; style: string;
}> = {
  천간: {
    desc: "재물운이 천간(天干)에 드러나 있어요.",
    wealth: "유동적 자산, 현금 흐름, 빠른 수익 구조와 어울립니다.",
    style: "재물 목표를 공개적으로 드러내고 주변과 정보를 나누는 성향이에요. 기회를 빠르게 포착하지만, 재물이 흩어지거나 외부에 노출될 가능성도 함께 존재해요.",
  },
  지지: {
    desc: "재물운이 지지(地支)에 자리해요.",
    wealth: "부동산·실물 자산·장기 투자와 어울립니다.",
    style: "재물을 드러내지 않고 음적(陰的)으로 축적해요. 가까운 사람에게도 재물 정보를 쉽게 공유하지 않으며, 실속 중심으로 안정되게 보전해요.",
  },
  지장간: {
    desc: "재물운이 지장간(地藏干) 깊숙이 숨어 있어요. 고전 명리에서 '절대 뺏기지 않는 재물'로 해석해요.",
    wealth: "비공개 자산, 조용한 적립, 드러나지 않는 형태의 자산과 어울립니다.",
    style: "재물 정보를 극히 소수에게만 공유하며, 혼자 조용히 실행하는 방식으로 재물을 모읍니다. 외부에 노출되지 않아 뺏기기 어렵고 실속이 단단해요.",
  },
  없음: {
    desc: "사주 내에서 재물운이 두드러지게 발견되지 않어요.",
    wealth: "용신·희신 기운을 통해 간접적으로 재물 흐름이 형성돼요.",
    style: "재물에 대한 직접적 집착보다, 본인의 재능·관계·학식을 통해 자연스럽게 따르는 재물 구조일 수 있어요.",
  },
};

// 사주 결과에서 재성이 천간·지지·지장간 중 어디에 위치하는지 분석
export function analyzeJaeseongPosition(
  ilgan: string,
  pillarsDetail: SajuResult["pillarsDetail"]
): "천간" | "지지" | "지장간" | "없음" {
  const JAESEONG = new Set(["편재", "정재"]);
  const jaeseongEl = OHAENG_CONTROLS[CHEONGAN_ELEMENT[ilgan] as Element];

  const pillars = [
    pillarsDetail.year,
    pillarsDetail.month,
    pillarsDetail.day,
    pillarsDetail.hour,
  ].filter(Boolean) as PillarDetail[];

  for (const p of pillars) {
    if (JAESEONG.has(p.sipseongCg)) return "천간";
  }
  for (const p of pillars) {
    if (JAESEONG.has(p.sipseongJj)) return "지지";
  }
  for (const p of pillars) {
    for (const ch of p.jijangan.split("")) {
      const el = CHEONGAN_ELEMENT[ch];
      if (el && el === jaeseongEl) return "지장간";
    }
  }

  return "없음";
}

// ── 사주 지식 데이터베이스 ─────────────────────────────────────────────────────

export const GWANSEONG_INSIGHT = {
  essence: "사회적 책임과 통제의 기운은 '맞은편에 내가 보인다'는 의미예요. 내가 통제·평가·처벌받는 경험을 통해 자신을 인식하게 돼요. 이 기운이 있는 사람은 고통(규율·압박)을 통해 자아가 형성돼요.",
  noGwanseong: "이 기운이 없으면 타인 시선·평가에 덜 구속돼요. 자기 기준대로 살되 책임 회피 경향도 있어요. 직장·사회 규범 적응이 상대적으로 어려울 수 있어요.",
  jeonggwan: "규칙·책임·사회적 인정: 규칙·원칙 내에서 인정받으려는 욕구예요. 안정 지향, 신뢰감 높음, 틀 안에서 최고를 추구해요.",
  pyeongwan: "강한 통제와 경쟁의 기운: 극단적 압박·경쟁이에요. 이를 극복하면 강인한 리더십, 극복 못하면 피해의식·반항심으로 나타나요.",
  gwansalhongjap: "통제의 기운이 두 갈래로 동시에 존재: 방향성 혼란, 상황따라 원칙/파격을 오가요. 내면 피로도가 높아요.",
};

export const SIKSANG_DEEP_INSIGHT = {
  siksin: "먹을복과 재능: 이기적인 자기보호막이에요. 내가 좋아하는 것만 하는 자기충족형이에요. 표현이 자연스럽고 먹고 즐기는 데서 에너지를 충전해요. 공격성보다 방어적 자기 만족이 커요.",
  sanggwan: "표현력과 개성: 정의감에서 출발하지만 좌절하면 냉소·파괴로 전환(흑화)될 수 있어요. '세상은 틀렸다'는 인식이 강해지면 반사회적 에너지로 변해요. 창의성과 독설이 공존해요.",
  siksangOverflow: "표현·결과물을 만드는 기운 과다: 에너지가 밖으로만 흘러 자기 소진이 생겨요. 말이 많거나 표현 욕구가 과잉돼요. 생산성은 높으나 내면 고갈 위험이 있어요.",
  siksangAndChildren: "표현·결과물을 만드는 기운이 넘치는 해(대운·세운)에 자녀가 생기면 그 기운이 과해진 상태 — 자녀 자리도, 본인 기운도 동시에 흔들려요. 그 기운이 적절한 시기에 태어난 자녀라면 본인도 자녀도 자리가 커요. 단 사주 원국에서 그 기운이 힘을 못 쓰는 구조(통제의 기운이 강하게 제어)라면 세운의 과다가 상대적으로 덜 영향을 미쳐요. 대운과 사주 원국을 반드시 함께 고려해야 해요.",
};

export const JAESEONG_DEEP = {
  essence: "재물운은 주류(정상) 사회 밖으로 밀려나는 것에 대한 두려움이에요. '내가 이 집단에서 쓸모 있는가'에 대한 불안이 재물운의 근원이에요.",
  jaejaenam: "재물·이성을 동시에 좇는 경쟁심: 재물운이 2개 이상 또는 재물 기운이 많은 사주예요. 돈과 여자(이성)를 동시에 원해요. 경쟁적 획득 욕구가 있어요. 한 곳에 집중하지 못하고 여러 군데 재물·이성을 동시에 추구하는 경향이 있어요.",
  mujaenom: "재물운이 약한 경우: 재물운이 없어요. 돈·이성에 덜 집착하거나 다른 방식으로 접근해요. 주류에서 이탈하는 것에 덜 두려워하거나 스스로 아웃사이더 정체성을 택해요.",
  jaeAndRelation: "재물운이 강한 연애: 실용적·물질적 안정을 중시, 파트너를 소유·관리하려는 경향이 있어요. 재물운이 약한 연애: 이상·정신적 연결 중시, 물질보다 마음이에요.",
};

export const WEOLJI_PSYCHOLOGY: Record<string, string> = {
  "인": "인월(寅月): 봄 기운 시작. 개척·도전 욕구가 강해요. 계획하고 돌진하는 선도형이에요. 인정욕구가 높아요.",
  "묘": "묘월(卯月): 봄의 절정. 유연하고 감수성이 풍부해요. 예술적·섬세한 기질이에요. 타인 시선에 예민해요.",
  "진": "진월(辰月): 봄→여름 전환. 다재다능하나 방향성 혼란이 있어요. 저장·축적 본능이 강해요.",
  "사": "사월(巳月): 여름 시작. 탐구·분석·비밀 유지 성향이에요. 내면이 복잡하고 겉은 차분해요. 전략적이에요.",
  "오": "오월(午月): 여름 절정. 감정 기복이 커요. 직관적이고 카리스마가 있어요. 표현 과잉 경향이 있어요.",
  "미": "미월(未月): 여름→가을 전환. 세심하고 완벽주의 성향이에요. 뒷처리를 잘해요. 불안이 내재돼 있어요.",
  "신": "신월(申月): 가을 시작. 현실적이고 냉정해요. 판단이 빠르고 결과 중심이에요. 냉철한 리얼리스트예요.",
  "유": "유월(酉月): 가을 절정. 완벽주의·심미안이 뛰어나요. 고집이 강해요. 독립적이고 날카로워요.",
  "술": "술월(戌月): 가을→겨울 전환. 신념이 강해요. 의리파예요. 한번 틀어지면 오래가요.",
  "해": "해월(亥月): 겨울 시작. 직관·상상력이 탁월해요. 자유로운 영혼이에요. 정착이 어려운 편이에요.",
  "자": "자월(子月): 겨울 절정. 생각이 깊어요. 비밀이 많아요. 본능적·감각적이에요. 내면 세계가 풍부해요.",
  "축": "축월(丑月): 겨울→봄 전환. 성실하고 인내심이 강하며 저축 본능이 있어요. 느리지만 확실해요. 고집스런 완수형이에요.",
};

export const YANG_YIN_TENDENCY = {
  yang: "양간(갑·병·무·경·임): 순행(시계 방향)이에요. 이기심에서 출발해 성숙하면 이타적 헌신으로 발전해요. 외향적·능동적·확장 지향이에요. 직선적으로 행동해요.",
  yin: "음간(을·정·기·신·계): 역행(반시계 방향)이에요. 혼돈·감각·물질에 먼저 끌려요. 내면이 복잡해요. 성숙하면 정교한 관계망을 형성해요. 직관적·수용적이며 적응력이 높아요.",
  yangInLove: "양간 연애: 주도적·정복형이에요. 먼저 들이대는 편이에요. 단순 명확해요. 실망하면 빠르게 끊어요.",
  yinInLove: "음간 연애: 관찰 후 서서히 다가가요. 감정이입이 깊어요. 집착 경향이 있어요. 이별 후 여운이 길어요.",
};

export const JAJASI_PRINCIPLE = {
  rule: "야자시(夜子時)·조자시(早子時) 원칙: 자정(00:00)이 일진 교체의 실질 기준. 23:00~23:59는 관습상 이전 날 자시로 처리하나, 엄밀히는 당일 갑자일을 유지하는 조자시로 보는 견해도 있음.",
  practical: "현대 사주에서 23:00~00:00 사이 출생자는 야자시(전날 일간 유지) vs 조자시(다음날 일간) 두 가지로 계산해 비교. 어느 쪽이 실제 삶과 맞는지 본인 확인 필요.",
  defaultChoice: "불확실 시 야자시(23시는 이전 날 일간)로 계산하는 것이 다수 명리 학파의 관행.",
};

export const OHAENG_CORE_WORRY: Record<Element, string> = {
  "목": "목(木) 근원 걱정: '내가 인정받고 있는가' — 존재 가치와 성장에 대한 불안이에요. 칭찬·인정 없으면 뿌리가 흔들려요.",
  "화": "화(火) 근원 걱정: '내 포지션이 안전한가' — 주목받고 있는가, 빛나고 있는가에 대한 불안이에요. 무시당하면 폭발해요.",
  "토": "토(土) 근원 걱정: '관계가 안정적인가' — 나를 중심으로 한 인간관계 유지에 대한 불안이에요. 갈등·소외를 극도로 두려워해요.",
  "금": "금(金) 근원 걱정: '나는 쓸모 있는가' — 사회적 역할·기능에 대한 불안이에요. 쓸모없어지는 것, 버려지는 것이 가장 두려워요.",
  "수": "수(Water) 근원 걱정: '내가 존재해도 되는가' — 실존적 불안이에요. 의미·방향 없음에 대한 공허함이 있어요. 깊은 철학적 고민이 많아요.",
};

export const ILGAN_BEAUTY = {
  beautiful: ["정", "신"],
  essence: "미인이 많은 일간은 丁(정화)와 辛(신금). 둘 다 음간이라 여성적 기질이 강함. 외모보다 분위기와 느낌을 만들어주는 것이 사주.",
  jeonghwa: "丁정화: 촛불의 그윽하고 아늑한 분위기. 상대를 편안하게 만드는 따뜻함. 자신이 비추는 빛으로 존재감을 발함.",
  singeum: "辛신금: 보석의 반짝임과 날카로운 엣지. 자존심이 극강. 흠이 되는 것을 매우 싫어하고 다스림을 받는 것에 강하게 반응.",
  jeongshinRelation: "丁-辛 관계: 화극금(火克金)으로 정화가 신금을 제련함. 정화 입장에선 신금이 제일 만만하고 편함(두려울 것 없음). 신금 입장에선 정화가 가장 위협적. 신금은 정화의 다가옴에 얼타고 어버버거리거나, 아니면 질려서 도망감. 신금이 도망가면 정화는 '너 어디가냐' — 신금은 후닥닥 자리를 피함.",
  shingeumLove: "신금은 임수(壬水)를 선호함. 보석을 깨끗하게 씻어주는 물이미지. 임수는 신금을 그닥 특별히 좋아하진 않음. 신금의 담당(제련) 일간이 정화이기 때문에 정화에게 어버버 해지는 것.",
};

export const JAESEONG_JEONGJAE_PEONJAE = {
  essence: "재물운은 결과값 예측 — 미래를 보기 때문에 불안이 내재돼요. 항상 머릿속에 숫자(가치 계산)가 떠 있는 상태예요. 안정적인 돈은 방패, 사업·투자성 큰돈은 칼이에요.",
  jeongjae: "안정적인 돈: 방어적·자기 보호 중심이에요. 여성적 기질 강함(음적 표출, 내색 않음). 계산이 완료된 후 다정함이 나와요. 다정하나 이기적 — 자기 이익이 먼저 계산되고, 그 다음 상대를 배려해요. 상대의 동정심은 유발하지만 본인이 상대를 동정하지 않아요. 손실 회피 성향 강함(100만원 손실에 과민반응). 고정수입 확보 후 추가 투자 않음. 단정하고 정돈된 것 선호. 가정적·헌신적(방패로 가족을 감쌈).",
  peonjae: "사업·투자성 큰돈: 공격적·확장 지향이에요. 두서 없으나 상대 기분을 끌어올리려는 성향이에요. 쌈빡한 것 선호. 수익 실현 후 재투자(복리 지향). 남성호르몬적 기질이 강해요.",
  noJaeseong: "재물운이 약한 경우: 가치 예측 없음 → 계산 없이 감정 우선이에요. 조건이 안 맞아도 감정이 앞서면 관계를 맺어요. 로맨틱 지향. 단, 가치 판별력 낮아 선물·소비의 퀄리티가 떨어질 수 있어요.",
  jaeGiftStyle: "재물운이 좋으면 시장 트렌드·가치 체계를 파악하고 있어 선물 퀄리티가 높아요. 재물운이 약하면 비싸거나 무난한 것을 기준으로 선택해요.",
  jaedaAndGender: "재물운이 많은 남자: 여성적 기질 — 공감, 감정 흐름이 여성과 유사해요. 여사친이 많아요. '상처받음' 코드를 자연스럽게 표출해요. 부담감이 낮게 느껴져요. 자기 자신을 사랑하는 구조 — 자기 일신 보호에서 다정함이 파생돼요.",
  jaeMaleVsFemale: "여성의 안정적인 돈: 가정적·헌신적, 방패로 가족을 감싸는 성향이에요. 남성의 안정적인 돈: 자기 이익 우선 계산이 더 두드러져요(여성적 기질이 남성 양기와 혼합되어 이기성 표출이 잦음).",
  marriageAndJaeseong: "재물운이 강한 사주는 감정만으로 결혼 결정을 내리기 어렵다. 목표 의식이 강하고 가치 계산이 먼저 작동하기 때문에 결혼 전 조건·환경·미래 설계를 함께 점검해야 한다.",
  socialRisk: "재물운이 강하면 목표 달성 과정에서 타인의 감정보다 결과 효율을 우선시하게 되어 주변으로부터 미움을 받기 쉽다. 능력에 비해 덕(德)이 부족한 형태로 드러날 수 있다. 속마음을 전략적으로 조율하고, 주변을 도우며 덕을 쌓는 방식으로 균형을 맞춰야 한다. 인기가 쌓이면 재물은 자연히 따라오는 구조다.",
  effortWarning: "재물운이 강한 사주에서 무리한 노력·억지 행동은 오히려 역효과를 낸다. 가치 판단력과 자기 PR 능력이 핵심이므로, 생산한 결과물을 명확하게 설명하고 포지셔닝하는 능력에 집중해야 한다. 자존감(자기 가치 인식)과 연결된다.",
  femaleAndFather: "여성 사주에서 재물운은 아버지를 의미한다. 아버지의 영향력이 왜곡되거나 부재하면 여성의 재물운이 약해져 자기 가치를 판단하는 힘이 저하된다. 이 경우 자존감 손상으로 이어질 수 있다. 재물운이 약한 여성 사주에 아버지 영향이 부정적이면 자기 가치 판단력 저하 → 나쁜 관계에 취약해지는 패턴이 나타난다. 연령이 어릴수록 영향이 크다.",
  parentGenderImpact: "여아의 인격 발달에는 아버지가, 남아의 인격 발달에는 어머니가 핵심적 역할을 한다. 여성의 재물운=아버지, 남성의 보호·학문의 기운=어머니와 대응된다.",
};

export const MUTO_MALE_INSIGHT = {
  essence: "무토(戊土)는 오행 중 토(土)가 가장 이해하기 어려운 속성이며, 그 중 무토가 가장 난해. 그릇(용량)이 극대화되어 있으나 내부에 무엇이 있는지 외부에서 감지하기 어려움. 무토남은 양기(陽氣)로 인해 무토의 황량함·사막성이 극대화됨. 무토녀는 음기로 이 성질이 중화됨.",
  duality: "무의식적 이중성: 무토는 이중성이 있으나 본인이 인식하지 못함. 악의를 인식하는 경우 에너지 흐름이 외부로 감지되지만, 무토는 자기 인식 자체가 없어 에너지 흐름이 드러나지 않음. 즉 속이지 않으나 결과적으로 속이는 구조.",
  indifference: "무심함이 자기 인식보다 훨씬 극단적. 본인이 인식하는 무심함의 수준 이상으로 실제 무심한 행동이 자연스럽게 표출됨. 핵심 이익을 건드리지 않는 범위에서는 외부 자극에 반응하지 않음.",
  realism: "막연한 기대감이 낮음 → 현실 기반 판단, 성실함. '이만하면 됐다'는 심리 — 기준치가 채워지면 추가 욕구가 낮음.",
  counterSystem: "수용력이 넓어 보여 상대방이 감정·의존을 과도하게 투입하는 경향을 유발. 그러나 내부적으로 수신한 것을 카운팅(계산)함. 임계점 초과 시 무심하게 거리를 둠 — 이탈 신호가 외부로 잘 드러나지 않아 상대가 인지하기 어려움.",
  genderDiff: "무토녀(戊土女): 음기 작용으로 무토의 황량성이 중화, 감수성·유연성 보완됨. 무토남(戊土男): 양기 작용으로 무토 특성이 극대화 — 그릇 확장, 내면 불투명성 심화.",
};

export const PEONIN_INSIGHT = {
  essence: "직관·예술적 감수성: 자기 영역 너머로 성장하려는 욕구예요. 사업·투자성 큰돈이 물리적 활동 영역의 확장이라면, 이 기운은 생각의 영역 확장이에요. 일반 상식을 넘어선 사고, 생각에서 생각으로 꼬리물기하여 남이 도달하지 못하는 결론까지 이르는 힘이에요.",
  vsJeongin: "공부·문서·보호받는 운은 권리, 직관·예술적 감수성은 의무예요. 전자는 '내가 무엇을 얻을지' 판단하는 나를 보는 힘이에요. 후자는 착함·의무감이 강해 손해를 더 싫어하면서도 결과적으로 더 손해 보는 상황이 많아요. 전자는 이기적 상황에 단호하나, 후자는 내면 갈등 끝에 열어줘요.",
  negativeForce: "부정적 감정이 긍정보다 5배 강하게 작용해요. 이 기운이 강하면 외로움·걱정·우울이 심화돼요. 자기보호기제로 내면의 벽(바운더리)을 형성해요. 겉으로 이기적으로 보이나 실제로는 착한 마음과 이기성이 충돌하여 내면 괴로움·우울증이 생겨요.",
  idealismTrap: "이상점(理想點)을 미리 그려놓고 관계를 시작해요. 상대의 단점이 계속 눈에 밟혀요. 포용 의지보다 부족한 점 발견이 먼저예요. 자기와 '말이 통하는 사람'이 극히 적어 만성적 외로움·고독이 숙명처럼 따라와요.",
  suspicionParadox: "의심이 많으나 아이러니하게 사기·배신을 잘 당해요. 원리: 평소 극도로 긴장·경계하다가 긴장이 필요한 결정적 순간에 방심(긴장 방전)해요. 한 부분만 보고 전체를 신뢰해버리는 인지적 실수예요. 인간관계·금전 모두 해당돼요.",
  damageMultiplier: "타인에게 데미지 10을 받을 상황에서 100을 받아요. 행동 실수가 잦아요(생각이 많아 정작 현실 판단 공백). 귀인(貴人)이 곁에 있어야 균형이 잡혀요.",
  thinkingStyle: "동전 앞면을 보면 뒷면을 먼저 생각해요. 생각의 편린들이 흩어져있다가 갑자기 연결되어 결론에 급속 도달해요. 남 눈치 보고 관찰하는 것이 습관 — 걸러야 할지 판단하는 과정이에요. 사람을 잘 떠봐요. 생각의 꼬리물기가 종착점에 이르면 쾌감을 느껴요.",
  relationshipStyle: "생각이 임팩트 있는 사람을 선호해요(상식 있는 사람). 상대의 부족함에서 오는 내면 구멍을 채우려는 욕구가 연애 동기예요. 외로움이 타인에 대한 관심으로 표출되나, 알아갈수록 실망하는 패턴이 반복돼요. 남 탓이 많은 것은 내 마음의 결핍을 외부에서 채우려는 기제예요.",
  spiritualTendency: "생각이 많아 종교·명상·철학에 끌려요. '내 삶의 가치는 무엇인가', '인생 왜 사는가'까지 실존적 질문을 일상적으로 탐구해요. 절·성당 등 사색 공간이 생각 정리와 안정에 도움이 돼요.",
  caution: "의심을 줄이고 부정적 기운을 의식적으로 떨쳐내야 해요. 꽉 잡다가 힘이 풀려 다 흘리는 패턴을 인식할 필요가 있어요. 귀인과의 관계 유지, 사기·배신 예방 위한 현실적 판단력 훈련이 필요해요.",
};

export const GEOPJAE_INSIGHT = {
  essence: "승부욕과 인간관계 변화의 기운은 이중성(二重性)의 육신이에요. A를 좋아하면서 B를 선택하는 역설이 핵심이에요. 내면에 중문이 있어 열리면 한없이 넓고 닫히면 한없이 좁아요. 중문의 열쇠는 상대방의 진심이에요.",
  vsJeongjae: "안정적인 돈: 열 가지를 다 봐요(꼼꼼·전방위). 승부욕과 인간관계 변화의 기운: 한두 가지만 꽂히면 그만이에요(선택적 집중). 겉으론 포용력 넓어 보이나 실제는 무관심에서 비롯돼요.",
  byeongwan: "방관자 코드: 남의 프라이버시에 개입하지 않아요 — 내 바운더리도 침범하지 말라는 역설적 표현이에요. 친밀한 관계에서도 '너는 너, 나는 나' 원칙을 유지해요.",
  moneyView: "돈보다 사람의 진심을 우선시해요. 손에 들어온 것은 쉽게 놓지 않으려는 경향이 있으나, 진심으로 대하면 물질을 포기하는 결단도 가능해요. 물질적 집착과 이타적 희생이 공존해요.",
  betrayal: "배신을 가장 증오해요. 진심으로 대하면 전적으로 맞춰주지만 마음을 가지고 놀면 분노가 극에 달해요. 아량이 한순간에 사라지는 구조예요.",
  dailyBehavior: "겉으로 허술해 보이지만 자기만의 원칙이 있어요. 포기가 빠른 편이라 재물이 손에서 빠져나가기 쉬워요. 아쉬운 소리를 못하며, 자존심에 관한 몇 가지 기준은 절대 타협하지 않아요.",
  geopjaeSummary: "승부욕과 인간관계 변화의 기운은 평화주의와 경쟁주의가 공존해요. 마음이 열리면 극도로 이타적, 닫히면 극도로 이기적이에요. 자기가 좋아하는 것에만 집중하다 나머지를 방치하는 패턴이 있어요. 실속보다 자존심과 관계의 진심을 우선시해요.",
};

export const MALE_SAJU_INSIGHT = {
  yangangVsEumgan: `남자 사주 1순위 판단 기준 — 일간의 음양(陰陽) 구분.
양간(陽干): 갑(甲)·병(丙)·무(戊)·경(庚)·임(壬). 발산 에너지 — 좋은 것도 나쁜 것도 외부로 표출됨. 공감 능력 부족, 자기 주도적 기질 강함. 양=증폭 에너지 — 장점이 있으면 탁월하나 결함이 있으면 그 결함도 극대화됨. 음간에 비해 편차가 큼.
음간(陰干): 을(乙)·정(丁)·기(己)·신(辛)·계(癸). 수신 에너지 — 먼저 받아야 반응함. 공감 능력·이해심의 폭이 넓고 다정함. 주도보다 대응하는 성향이라 상대를 생(生)해주는 에너지가 상대적으로 적음. 결함이 있을 경우 소심·치졸함으로 표출됨. 음간이 열등하다는 의미가 아니라, 선(先)수신 후(後)반응 구조.`,
  jijuPriority: `천간보다 지지(地支)를 먼저 봐야 함. 천간은 지지의 생각(사고 방향)이므로 실질적 비중은 지지보다 낮음. 지지가 실제 물질·현실 환경을 결정함.`,
  siksangVsGwan: `지지에 표현력과 개성의 기운이 있는 남자 — 여자 입장에서 물질적·감정적으로 더 받게 됨.
표현력과 개성: 양의 에너지. 위에서 아래로 생(生)하는 방향성. 상대의 상태와 필요를 정확히 파악하고 표현·제공하는 능력. 본능적 욕구에 즉각적으로 반응하며 상대의 변화에 민감함. 관계에서 먼저 주고 챙기는 기질. 정치적 계산보다 즉각적 표현을 우선시하여 사회적 처세에 약한 면이 있음.
사회적 책임·통제의 기운: 음의 에너지. 자기 자신을 향하는 힘. 상대의 외적 변화에 무딤. 자기 체면·기준을 중시하고 내면의 판단을 드러내지 않음. 관계보다 자기 포지션을 우선시하는 경향. 사회적 처세·장기적 계획 관리에 능함.`,
  materialPrinciple: `여자가 생(生)을 받으려면 아래(下)의 포지션에 있어야 함. 표현력과 개성의 기운이 강한 남자는 위에서 아래로 생(生)을 내려주는 구조. 사주에서 남편복이 좋다는 것은 이 생의 흐름을 자연스럽게 받을 수 있는 위치와 연결됨. 음간 남자 중 그 기운이 약한 경우는 예외가 될 수 있음.`,
  gwanMaleSummary: `사회적 책임·통제의 기운이 강한 남자는 여자를 생(生)하지 못함. 자기 자신을 향하는 에너지가 강해 파트너보다 자신에 집중하는 구조. 물질·감정 모두 주도적으로 제공하는 기질이 아님.`,
};

export const FEMALE_SAJU_INSIGHT = {
  gwanseongLove: `사회적 책임·통제의 기운이 강한 여자의 연애 — 이 기운은 직접적·능동적으로 이성을 좇는 기운이 아니라 수동적이고 분위기를 타는 기운임. 본인 의지보다 주변에 형성된 분위기에 영향을 받아 관계가 시작되는 구조. 그래서 이 기운이 강해도 연애 경험이 적은 경우가 흔함.
눈치가 빠르고 자의식이 강해 상처받는 것을 크게 두려워하면서도, 동시에 틀·체계에 묶여 있는 만큼 그 틀 밖의 세계를 향한 갈망도 강하게 공존함. 이 양가적 구조 때문에 관계의 흐름이 예측하기 어렵고 기복 있게 흘러가는 경우가 있음.
이 기운이 강한 여자는 연애를 통해 직접 부딪히며 경험을 쌓아가는 유형. 상처에 예민한 만큼 상대를 신중하게 고르려 하지만, 그 과정에서 시행착오를 반복하며 단련되는 구조.`,
  siksangGwanCombo: `표현력과 개성, 사회적 책임·통제의 기운은 여러 기운들 중에서도 감정 표현이 솔직하고 자기 주관이 뚜렷한 기운으로 분류됨. 전자는 분위기를 주도하며 관계의 흐름을 만들어가는 역할을, 후자는 그 흐름에 맞춰 호흡을 조율하는 역할을 함. 두 기운이 함께 있으면 한쪽이 이끌고 한쪽이 받쳐주는 상호보완적 궁합 구조를 이룸.`,
};

export const CHEONRAJIMANG_INSIGHT = {
  definition: `천라지망(天羅地網): 하늘 그물(天羅)과 땅 그물(地網)이 동시에 드리운 신살. 천라=술(戌)+해(亥) 조합, 지망=진(辰)+사(巳) 조합. 사주 내 이 두 지지가 동시에 존재할 때 성립.`,
  famousCase: `세종대왕도 천라지망을 지닌 사주였음. 천라지망이 있다고 하여 인생이 실패하거나 불운한 것이 아님. 오히려 구속과 제약이라는 압력을 통해 내면의 깊이와 집중력이 만들어지는 구조. 세종이 수많은 질병(안질·당뇨·관절염 등)과 신체적 제약 속에서도 한글을 창제하고 역대 최고의 치세를 이룬 것이 천라지망의 역설적 힘.`,
  coreEnergy: `뜻하지 않은 구속·제약·억제가 삶 전반에 반복적으로 나타남. 자유롭게 나아가려 할 때 보이지 않는 그물에 걸리는 느낌. 단 이 제약이 반드시 외부에서 오는 것이 아니라 내부(건강·심리·환경)에서 올 수도 있음.`,
  paradox: `천라지망의 역설: 억눌릴수록 내면이 단단해짐. 외부 활동보다 내면의 사유·집중·전문성이 강화됨. 대외 활동이 막힐수록 내면 세계가 깊어지고 그 안에서 비범한 성취를 이루는 케이스가 많음. 무언가를 강제로 멈추게 하는 힘이 오히려 진짜 역량을 쌓게 만드는 구조.`,
  lifePattern: `건강 문제, 법적 분쟁, 사회적 제약, 이동 제한, 타의에 의한 결정 등이 삶의 변곡점으로 등장하는 경향. 이를 운명적 방해로 볼 것이 아니라, 방향을 재설정하게 만드는 신호로 해석해야 함.`,
  advice: `천라지망이 있는 사람에게: 막히는 시기에 저항보다 내면 집중을 선택할 것. 외부로 뻗어나가기 어려울 때가 실력을 쌓는 타이밍임. 세종처럼, 제약이 가장 클 때 가장 큰 업적이 준비되는 사주.`,
};

export const YUKHAM_INSIGHT = {
  strongPairs: `합력이 강한 육합 4쌍: 卯戌(묘술) · 巳申(사신) · 寅亥(인해) · 酉辰(유진). 子丑·午未는 합력이 약해 실전에서 비중 낮음.`,
  maleAction: `육합은 여자보다 남자에게 작용력이 큼. 남자가 상대에 대해 지배욕·통제욕이 발화되는 합. 속궁합(신체적 쾌락)이 아닌 정신적 지배 충동이 핵심 작동 원리.`,
  maleSexPsych: `남자의 성적 쾌락에서 신체적 자극보다 정신적 요소가 결정적. 성적 욕구의 첫 발화는 애정보다 공격성·지배욕이 앞섬. 분노·긴장이 해소되는 과정에서 상대에 대한 애착이 형성되는 순서로 작동함.`,
  mechanism: `육합의 핵심 메커니즘: 상대에게서 자기 모습의 30%가 투영됨. 자신의 약점·결함이 상대에게서 보일 때 자기혐오적 분노가 성적 지배 욕구로 전환됨. 동시에 그 모습에 대한 연민·아련함이 공존. 분노와 애착이 교차하며 감정이 층위를 이루어 깊어지는 구조.`,
  cycle: `육합의 감정 사이클: 분노 → 성적 표출 → 아련함 → 분노. 관계가 끊어지지 않고 반복 순환되는 원리. 이것이 육합을 애증(愛憎) 관계로 만드는 구조적 원인.`,
  firstImpression: `초기에는 서로 묘한 거부감을 느끼는 경향. 공통된 속성이 있어 오히려 불쾌하게 느껴짐. 관계가 시작되는 계기가 생기면 남자 쪽에서 지배욕이 강하게 발화됨. 가학성(상처 입히려는 충동)과 보호욕(아껴야 한다는 감각)이 동시에 작동.`,
  pairDynamic: `묘술(卯戌) 조합: 묘 입장에서 술의 고집스러움이 불편하면서도 그 한탄스러운 면에 연민·아련함을 느낌. 끈적하게 지배하려는 욕구가 발생하고 남자가 지속적으로 적극적으로 다가옴. 여자도 그 강도에 이끌려 서서히 감정이 열리는 구조. 사신·인해·유진도 이 패턴이 동일하게 적용됨.`,
  characterization: `육합 관계는 신체적 관계 이후 성적 다양성을 탐색할 가능성이 높음. 내면이 온전히 드러나는 관계이며 감정이 켜켜이 쌓이며 깊어짐. 남자가 주도적이고 여자는 그 강도에 이끌려 감정이 형성됨.`,
  forFemale: `여자 입장에서 육합은 신체적 쾌락의 질보다 남자의 집착·적극성이 특징. 뜨겁고 집착적인 연애를 경험하는 구조.`,
  usageNote: `궁합 분석·속궁합·19금 사주 섹션에서 활용. 두 사람의 일지(日支) 또는 사주 내 지지 조합이 묘술·사신·인해·유진일 때 적용.`,
};

// ── 비겁(比劫) 심층 데이터 ──────────────────────────────────────────────────
export const BIGYEOK_INSIGHT = {
  essence: `독립심과 자존심의 기운의 본질은 자의식(自意識)의 강도. 생각의 출발점이 외부(타인의 시선·평가)가 아닌 내부(자기 자신)에서 시작됨. 독립심과 자존심의 기운이 강할수록 내향성이 짙어지고, 스스로 인정하지 않으면 움직이지 않는 구조. "내가 이걸 좋아하는가"가 행동의 1차 기준이 됨.`,

  shame: `독립심과 자존심의 기운의 첫 번째 속성: 부끄러워할 줄 아는 마음(수치심·자존심). 수치심이 강하다는 것은 자기 내면을 자주 들여다본다는 뜻. 이 자기 점검 능력이 객관적 통찰력의 기반이 됨. 독립심과 자존심의 기운이 강한 사람은 선후 관계·인과를 냉정하게 분석하는 능력이 있음.`,

  fixedMind: `독립심과 자존심의 기운의 두 번째 속성: 강한 고정관념. 생각이 내부에서 출발하므로 외부 기준보다 자기 원칙을 중심으로 사고 체계가 형성됨. 이 고정관념이 책임감·의리·역할 의식의 원천. 아버지답게, 어머니답게, 내가 해야 한다는 의식 모두 고정관념에서 파생됨.`,

  anxiety: `독립심과 자존심의 기운의 내면 불안: 독립심과 자존심의 기운이 강하면 "나는 무엇을 할 수 있는 사람인가"라는 잔잔한 우울감이 내재됨. 외부 성취보다 자기 내면 기준 충족이 어렵기 때문. 이 우울감이 자기 계발 동력이 되기도 하고, 돌파하지 못하면 고립으로 이어지기도 함.`,

  competence: `독립심과 자존심의 기운과 유능함: 독립심과 자존심의 기운이 강하면 사회적 유능함(출세·적응력)과 거리가 생길 수 있음. 대세를 따르기보다 자기 기준을 고수하기 때문. 사회적 성공은 외부 기준에 맞추는 순응 능력과 비례하는 측면이 있으므로, 독립심과 자존심의 기운 강한 사람은 유능함보다 독자성으로 승부하는 경향.`,

  motherhood: `독립심과 자존심의 기운과 모성애: 독립심과 자존심의 기운 특유의 내면 우울감이 출산·육아 후 모성애로 전환되는 기제가 있음. "내가 무언가 할 수 있는 사람"이라는 확인이 자녀를 통해 충족됨. 독립심과 자존심의 기운이 없거나 약한 경우 모성애의 근간 자체가 형성되기 어려울 수 있음. 철없는 부모는 대개 독립심과 자존심의 기운의 내면 불안이 없고 자기 행복감 추구만 남은 구조.`,

  weakToStrong: `독립심과 자존심의 기운의 강약약강(强弱弱强): 권위·강자에게는 경직되거나 반발하는 반면, 약자·초보·불완전한 사람에게는 따뜻하고 기다릴 줄 앎. 자존심이 강하기 때문에 역설적으로 상대방의 자존심을 건드리지 않으려는 배려가 작동함. 빠른 템포로 몰아붙이지 않고 상대 페이스에 맞추는 것이 독립심과 자존심의 기운의 특기.`,

  genderDiff: `남녀 독립심과 자존심의 기운의 차이: 여자 독립심과 자존심의 기운 — 육아·가정 역할에서 모성애·책임감으로 기능하는 경우가 많음. 남자 독립심과 자존심의 기운 — 사회적 수렵(돈 벌이)이라는 역할과 맞물려 40전후 재물 집착·이기주의로 흑화할 가능성 있음. 독립심과 자존심의 기운의 내면 불안이 재물 불안으로 전환되는 시점이 이 나이대. 직장 생활의 경직성과 사업 능력의 부족이 동시에 느껴지는 시기와 맞물림.`,

  failure: `독립심과 자존심의 기운과 실패: 독립심과 자존심의 기운이 강한 사람은 한 번 이상 크게 실패하고 나서 성공하는 패턴이 잦음. 자기 고집으로 인해 사회 흐름에 맞추지 못하거나, 독자 노선이 한 번 좌절을 겪은 뒤 자기 수정이 일어남.`,

  socialRelation: `독립심과 자존심의 기운과 대인관계: 경계의식·까칠함이 강해 동성에게 미움받거나 분위기를 흐리는 경우가 있음. 모든 사람에게 칭찬받는 사람을 경계하는 기질. 공자가 말한 "모든 사람이 좋아하면 의심하라"의 감각을 본능적으로 갖고 있음.`,

  insightAbility: `독립심과 자존심의 기운의 인과 분석력: 자의식이 강하면 상황의 선후 관계·원인을 자기 시선으로 냉정하게 짚어냄. 독립심과 자존심의 기운이 약하면 이 분석력이 흐려져 자기에게 유리한 해석만 남는 경향(인지 왜곡).`,

  mingliView: `명리학적 위상: 독립심과 자존심의 기운은 일간 자신. 나를 돕는 기운이면서 동시에 나와 경쟁하는 기운. 신강(身强) 사주에서 독립심과 자존심의 기운이 과다하면 에너지를 표현·생산, 재물, 조직·책임 쪽으로 흘려야 균형이 잡힘. 신약(身弱)에서는 독립심과 자존심의 기운이 보강 역할. 독립심과 자존심의 기운은 무조건 나쁜 것도, 좋은 것도 아니며 사주 전체 맥락 안에서 평가해야 함.`,

  vsOtherSipseong: `여러 기운들 중에서 독립심과 자존심의 기운을 최우선으로 보는 이유 — 독립심과 자존심의 기운은 자의식·수치심·고정관념·책임감·모성애·강약약강이라는 모든 기질의 근간을 내포하고 있기 때문. 다른 기운들은 외부 활동(표현의 기운=표현, 재물 기운=재물, 사회적 책임의 기운=사회적 통제, 보호·학문의 기운=학습)과 연결되지만, 독립심과 자존심의 기운은 그 모든 활동의 출발점인 자기 자신을 구성함. 독립심과 자존심의 기운이 없으면 나머지 기운들의 활동도 자기 정체성 없이 흘러가는 구조가 됨.`,

  canvas: `도화지 기질: 독립심과 자존심의 기운이 강한 사람은 내면에 무엇을 채워 넣었느냐에 따라 전혀 다른 사람이 됨. 고정관념이 강하기 때문에 어떤 가치관과 경험을 입력받았는지가 인생 전체 방향을 결정함. 강약약강(强弱弱强)이라는 성질 — 강한 것에는 경직·반발, 약한 것에는 따뜻함 — 은 독립심과 자존심의 기운의 고정적 특성.`,

  maleBlackening: `남자 독립심과 자존심의 기운 40전후 흑화 기제: 독립심과 자존심의 기운의 내면 불안(나는 무엇을 할 수 있는가)이 사회 활동 중반기에 재물 불안과 결합하여 극도의 이기주의로 전환될 수 있음. 직장 내 경직감과 독립(사업)에 대한 능력 부족이 동시에 충돌하는 나이대. 성공한 독립심과 자존심의 기운 남성도 대부분 한두 번의 큰 실패 후 방향 재설정을 거침.`,

  mingliEqualityView: `명리와 남녀 구별: 명리학은 남녀평등이 아닌 남녀 구별·차별을 전제로 함. 인간 각자의 쓰임새(用)를 정확히 구별해야 개인의 역할과 삶의 의미를 찾을 수 있다는 관점. 음양론의 핵심 — 낮은 밤이 있어야 존재하고, 밤은 낮으로 인해 의미를 가짐. 한쪽의 자유는 반드시 다른 쪽의 희생을 전제함. 이 상호 의존성을 인식할 때 상대에 대한 소중함과 애틋함이 생김. 독립심과 자존심의 기운의 고정관념(역할 의식)은 이 음양 구별론의 인간적 발현.`,
};

// ══════════════════════════════════════════════════════════════════════════════
// 삼합(三合) · 방합(方合) 분석
// ══════════════════════════════════════════════════════════════════════════════

export interface SamhapResult {
  type: "삼합" | "반합" | "방합";
  name: string; jiji: string[];
  element: Element; color: string;
  title: string; core: string; detail: string;
  career?: string; love?: string; loveStyle?: string; caution: string;
}

const SAMHAP_SETS: Array<{ jiji: string[]; name: string; element: Element; color: string; title: string; core: string; detail: string; career: string; love: string; caution: string }> = [
  {
    jiji: ["해","묘","미"], name:"해묘미 삼합", element:"목", color:"#4ade80",
    title:"의미 탐구형 선지자",
    core:"인생의 '왜'를 끊임없이 물어요. 목표보다 의미가 먼저예요.",
    detail:"봄의 기운(목)이 응축된 삼합이에요. 방향보다 이유를 먼저 찾아요. 세상 돌아가는 원리를 직관적으로 파악하고, 남들이 보지 못하는 구조를 읽어요. 가족보다 세상에 흔적을 남기고 싶다는 욕구가 강해요. 선지자·철학자·예술가 기질이에요.",
    career:"창작·연구·철학·교육·종교·심리 분야에 적합해요. 남들이 정답이라 믿는 것에 의문을 던지는 역할을 해요.",
    love:"상대의 내면 세계와 가치관에 끌려요. 감각적 매력보다 대화의 깊이가 연애의 시작이에요. 이상이 높아 오랜 탐색 후 선택해요.",
    caution:"의미를 찾다가 행동이 늦어져요. '왜'에 집착하다 '어떻게'를 놓치기 쉬워요. 독립성이 강해 팀 협력에서 마찰이 생겨요.",
  },
  {
    jiji: ["인","오","술"], name:"인오술 삼합", element:"화", color:"#f87171",
    title:"성과 실행형 혁명가",
    core:"달리는 것이 본능이에요. 업적을 직접 만들어야 직성이 풀려요.",
    detail:"여름의 기운(화)이 응축된 삼합이에요. 생각보다 행동이 먼저예요. 삶의 고달픔을 알면서도 멈추지 않아요. 자기 힘으로 역사에 이름을 남기고 싶어 해요. 내 가족만 잘 살면 된다는 코드보다 세상을 바꾸고 싶다는 코드가 강해요.",
    career:"리더십이 필요한 모든 분야에 적합해요. 스타트업·사업·군사·스포츠·정치 등에서 강점을 발휘해요. 내가 직접 만들어야 직성이 풀려요.",
    love:"열정적이고 주도적인 연애를 해요. 상대를 위해 온몸으로 뛰어요. 단 쉬지 않고 달리다 번아웃이 오면 관계가 위태로워져요.",
    caution:"과로·번아웃이 최대 리스크예요. 가족을 성과로만 평가하는 실수를 조심해요. 속도를 늦추는 것이 더 큰 성과를 만들어요.",
  },
  {
    jiji: ["사","유","축"], name:"사유축 삼합", element:"금", color:"#d1d5db",
    title:"결과 설계형 전략가",
    core:"어떻게 하면 결과가 최적으로 나오는가를 항상 생각해요. '어떻게'가 삶의 중심이에요.",
    detail:"가을의 기운(금)이 응축된 삼합이에요. 감정보다 공정함을 앞세워요. 과정보다 결론, 의리보다 성과를 중시해요. 이기적인 사람을 극도로 싫어하며, 공정한 분배를 강하게 추구해요. 결과를 위해 모두가 역할을 다해야 한다는 신념이 강해요.",
    career:"법·금융·회계·전략·컨설팅·의학·공학 분야에 적합해요. 최적화와 시스템 설계에 탁월해요.",
    love:"감정 표현보다 신뢰와 안정을 중시해요. 연애도 명확한 목적이 있을 때 움직여요. 이성에게 능력·성실함으로 어필하는 것이 가장 효과적이에요.",
    caution:"차갑게 보일 수 있어요. 감정을 무시한다는 오해를 받기도 해요. 완벽주의로 인해 관계에서 지나친 기대를 걸어요.",
  },
  {
    jiji: ["신","자","진"], name:"신자진 삼합", element:"수", color:"#60a5fa",
    title:"자기 판단 중심의 독자",
    core:"내 기준이 곧 법이에요. 내면의 귀족이랄 수 있어요.",
    detail:"겨울의 기운(수)이 응축된 가장 강력한 삼합이에요. 자기 판단이 절대적이며 외부 기준보다 내면의 확신이 먼저예요. 배타적 성향이 강하고, 공상·전략적 사고가 뛰어나요. 삼합 중 에너지가 가장 강하게 응축돼요.",
    career:"독립 연구·철학·전략·첩보·심리·IT 분야에 적합해요. 혼자 깊게 파고드는 작업에서 진가를 발휘해요.",
    love:"상대를 오래 관찰한 후 선택해요. 한번 선택하면 깊이 헌신해요. 단 자기 기준에 맞지 않으면 빠르게 끊어내요.",
    caution:"배타성이 과하면 고립돼요. 자기 판단이 옳다는 과신이 실수를 만들어요. 타인의 다른 기준도 인정하는 연습이 필요해요.",
  },
];

const BANGHAP_SETS: Array<{ jiji: string[]; name: string; element: Element; color: string; title: string; core: string; detail: string; loveStyle: string; caution: string }> = [
  { jiji:["해","자","축"], name:"해자축 방합", element:"수", color:"#60a5fa",
    title:"겨울형 — 의리 중심 관계자",
    core:"내 편인지 아닌지가 판단의 첫 기준이에요. 친분이 확인되면 무한 신뢰를 줘요.",
    detail:"수의 기운이 한 방향으로 응축된 방합이에요. 내향적으로 오래 관찰한 뒤 관계를 결정해요. 한번 내 울타리 안에 들어온 사람에게는 오랜 시간 기회를 부여하며 쉽게 포기하지 않아요. 객관적 사실보다 친밀감이 판단 기준이 돼요. 고지식해 보이는 면이 있으나 그 고지식함이 의리로 이어져요. 이득과 무관하게 내 사람 곁을 지키는 에너지예요.",
    loveStyle:"관계가 깊어지는 데 시간이 걸리지만 한번 결심하면 흔들리지 않아요. 상대의 결점이 보여도 쉽게 손을 놓지 않고 반복적으로 기회를 줘요.",
    caution:"친분을 앞세워 객관적 판단이 흐려지면 손해를 봐요. 내 편과 남의 편 구분이 지나치게 강해지면 관계의 폭이 좁아져요." },
  { jiji:["인","묘","진"], name:"인묘진 방합", element:"목", color:"#4ade80",
    title:"봄형 — 정(情) 중심 관계자",
    core:"내 주변 사람들과 함께 사는 것이 삶의 핵심이에요. 관계가 에너지원이에요.",
    detail:"목의 기운이 한 방향으로 응축된 방합이에요. 새로운 시작·성장의 에너지가 강해요. 친밀감이 판단 기준이 되며, 내 사람에게는 넓은 포용력을 보여요. 배타적이지만 울타리 안에 들어온 이에게는 따뜻해요. '이렇게 해야 해'라는 고정된 원칙이 있으며, 삼합이 성과·기능 중심이라면 방합은 관계·정(情) 중심이에요.",
    loveStyle:"연인에게 헌신적이며, 상대가 반복적으로 실수해도 관계를 쉽게 끊지 않아요. 내 편이라는 확신이 흔들리면 관계 자체를 의심하기 시작해요.",
    caution:"유연하지 않은 사고방식이 갈등을 일으킬 수 있어요. 고정된 가치관이 상대에게 부담으로 작용하는 경우가 있어요." },
  { jiji:["사","오","미"], name:"사오미 방합", element:"화", color:"#f87171",
    title:"여름형 — 열정 기반 관계자",
    core:"내 사람에게 전력으로 헌신해요. 감정이 판단의 출발점이에요.",
    detail:"화의 기운이 한 방향으로 응축된 방합이에요. 감정 표현이 솔직하고 뜨거워요. 친밀감이 형성되면 경계 없이 에너지를 쏟아요. 내 편이면 어떤 상황에서도 같은 편에 서요. 고지식한 면이 있어 한번 결정한 가치관을 쉽게 바꾸지 않으며, 삼합의 기능·성과 중심과 달리 감정·관계 중심으로 움직여요.",
    loveStyle:"연애에서 전력투구해요. 상대를 위해 아낌없이 헌신해요. 단 배신감을 느끼면 감정이 격하게 반응하며 회복이 어려워요.",
    caution:"감정이 앞서 객관적 판단이 흐려져요. 과도한 헌신이 상대에게 부담이 될 수 있어요." },
  { jiji:["신","유","술"], name:"신유술 방합", element:"금", color:"#d1d5db",
    title:"가을형 — 신뢰 기반 의리형",
    core:"한번 맺은 관계는 끝까지 지켜요. 신뢰가 모든 판단의 기준이에요.",
    detail:"금의 기운이 한 방향으로 응축된 방합이에요. 결실과 완성의 에너지예요. 신뢰가 확인된 관계에는 깊은 의리를 보이며, 이득 여부와 관계없이 내 사람을 지켜요. 객관적 팩트보다 그 사람과의 신뢰 관계를 우선시해요. 고지식한 원칙이 있어 '이것은 무조건 이렇게 해야 해'라는 기준이 뚜렷해요.",
    loveStyle:"안정적이고 믿음직스러운 연애를 해요. 상대에게 충성스러워요. 단 신뢰가 한번 깨지면 관계 회복이 매우 어려워요.",
    caution:"고지식함이 새로운 가능성을 막을 수 있어요. 내 편이 아닌 사람에게는 벽이 높아 기회를 놓치는 경우가 있어요." },
];

export function detectSamhapBanghap(pillarsDetail: SajuResult["pillarsDetail"]): SamhapResult[] {
  const jijis = [
    pillarsDetail.year.jj,
    pillarsDetail.month.jj,
    pillarsDetail.day.jj,
    ...(pillarsDetail.hour ? [pillarsDetail.hour.jj] : []),
  ];

  const results: SamhapResult[] = [];

  for (const s of SAMHAP_SETS) {
    const matched = s.jiji.filter(j => jijis.includes(j));
    if (matched.length === 3) {
      results.push({ type: "삼합", ...s });
    } else if (matched.length === 2) {
      // 반합(半合): 삼합 지지 중 2개만 있음
      results.push({
        type: "반합",
        ...s,
        name: s.name.replace(" 삼합", " 반합"),
        core: `완전한 삼합은 아니지만 ${s.element} 오행의 기운이 부분적으로 형성돼요. ${s.core}`,
      });
    }
  }

  for (const b of BANGHAP_SETS) {
    const matched = b.jiji.filter(j => jijis.includes(j));
    if (matched.length >= 2) {
      results.push({ type: "방합", ...b });
    }
  }

  return results;
}

// ══════════════════════════════════════════════════════════════════════════════
// 명리철학 — 개인 맞춤형 조언 원칙
// ══════════════════════════════════════════════════════════════════════════════

export const HAKDANG_INSIGHT = {
  hanja: "學堂貴人",
  rank: "귀인 중에서도 상급으로 꼽히는 기운이에요. 문창귀인·문곡귀인과 함께 공부 사주의 3대 길신으로 불려요.",
  triggerRule: "일간을 기준으로 정해진 지지가 사주 네 자리 중 어디에든 있으면 성립해요.",
  triggerTable: {
    갑: "해", 을: "오", 병: "인", 정: "유",
    무: "인", 기: "유", 경: "사", 신: "자",
    임: "신", 계: "묘",
  },
  vsOthers: "문창귀인은 배운 내용을 응용하고 설명하는 능력이 강점이고, 문곡귀인은 필기와 정리 능력이 강점이에요. 학당귀인은 문곡귀인과 비슷한 계열이지만, 거기에 어른스러운 분위기와 윗사람에게 인정받는 기운이 더해져요.",
  coreNature: "어떤 집단에서도 무게중심 역할을 해요. 말이 특출나게 많거나 유머가 뛰어나지 않아도 조용히 존재 자체로 중심에 위치하고, 윗사람이 자연스럽게 주목하고 신뢰를 보내는 기운이 있어요.",
  blessingEffect: "복(福) 기운이 함께 작용해서, 들인 노력에 비해 더 좋은 결과나 도움을 주는 인연이 따라와요.",
  magnetism: "말수가 적고 내성적인 편이어도 묘한 존재감이 있어요. 외모·SNS·사업 감각 등 여러 영역에서 핵심을 잘 포착하는 능력이 있고, 겉으로 드러나는 표현보다 실제 능력치가 더 높은 편이에요.",
  businessAptitude: "자기 이름을 걸고 하는 일에 강해요. 대중에게 은근한 매력을 발산하는 구조라 개인 브랜드·강의·전문직 사업에 잘 맞아요.",
  socialShield: "어떤 환경에서도 무례하게 대하기 어려운 분위기를 자연스럽게 만들어요. 보호받는 기운이 있어서 적대적인 상황에서도 정면충돌이 잘 일어나지 않아요.",
};

export const HYEONCHIMSAL_INSIGHT = {
  hanja: "懸針殺",
  triggers: ["갑", "신", "묘", "오", "미", "신(지지)"],
  triggerHanja: ["甲", "辛", "卯", "午", "未", "申"],
  howToCount: "사주 8글자(천간 4 + 지지 4) 중 甲·辛·卯·午·未·申에 해당하는 글자 수를 세어 현침살 개수로 본다.",
  coreNature: "말과 글이 상대의 핵심부를 꿰뚫는 기운. 독설할 때도, 위로할 때도 표면이 아닌 속살에 닿는다. '힘내, 잘 될 거야' 같은 평범한 위로는 현침살의 방식이 아니다. 본질을 짚고, 핵심을 건드린다.",
  dualNature: "같은 기운이 공격과 치유 모두로 작동한다. 현침살이 강한 사람의 한마디는 상대를 무너뜨릴 수도, 일으켜 세울 수도 있다. 방향의 문제다.",
  countEffect: {
    one: "현침살 1개: 말에 날카로움이 있고 직설적인 편이다.",
    two: "현침살 2개: 언어 감각이 예리하고 상대의 아픈 곳을 본능적으로 안다.",
    threeOrMore: "현침살 3개 이상: 최상급 수준의 언어 투과력. 상처를 주거나 깊은 위로를 건네는 양쪽 모두에서 강도가 극대화된다. 이 기운을 어떻게 쓰느냐가 삶의 방향을 가른다.",
  },
  bestUse: "현침살은 억누를 게 아니라 방향을 설정해야 한다. 상담·치유·글쓰기·강연·코칭 분야에서 다른 사람은 흉내 낼 수 없는 깊이를 만들어낸다. 이 기운을 좋은 방향으로 쓸수록 영향력이 커진다.",
  caution: "감정이 격해진 상태에서 내뱉는 한마디가 상대에게 장기간 영향을 줄 수 있다. 화가 났을 때 말을 삼가는 훈련이 필요하다.",
};

export const MYUNGRI_PHILOSOPHY = {
  core: "명리학은 사람마다 다른 에너지 구조(사주)를 전제로 해요. 같은 조언이 모든 사람에게 맞지 않아요. 현대사회가 획일적 기준을 강요하는 것과 달리, 명리는 각자의 오행 구조에 맞는 방향을 제시해요.",
  naturalLaw: "명리의 근거는 자연 순환 법칙이에요. 봄이 지나면 여름이 오고, 여름은 가을로 이어져요. 이 순환은 지구 어디서든, 몇 억 년 전에도 동일했어요. 사주는 이 자연의 흐름이 사람 몸에 기록된 것이에요.",
  siksangWarning: "표현·생산의 기운이 없는 사주는 에너지를 밖으로 발산하는 출구가 부족해요. 몸을 극도로 혹사하는 직업은 피해야 해요. 에너지를 내보내는 방식(표현·창작·봉사)을 찾는 것이 건강과 성취 모두에 중요해요.",
  yinYangLove: "음양론의 핵심은 구별이에요. 양(陽)은 확장·소유·주도 에너지, 음(陰)은 수용·관찰·유연 에너지예요. 연애에서 양간 일간은 주도적으로 움직이고 책임감으로 관계를 유지해요. 음간 일간은 관찰 후 깊이 헌신하며 감정이입이 강해요. 이 차이를 알면 상대를 이해하는 방식이 달라져요.",
  destiny: "운명에 순응한다는 것은 체념이 아니에요. 내 사주가 가진 에너지의 방향을 파악하고, 그 방향으로 담대하게 나아가는 것이에요. 내 기운에 맞는 길로 갈 때 재능과 운이 동시에 열려요.",
};

// 식상(食傷) 분석
export function analyzeSiksang(pillarsDetail: SajuResult["pillarsDetail"]): {
  hasSiksang: boolean; siksangList: string[]; advice: string;
} {
  const siksangSet = new Set(["식신","상관"]);
  const allSipseong = [
    pillarsDetail.year.sipseongCg, pillarsDetail.year.sipseongJj,
    pillarsDetail.month.sipseongCg, pillarsDetail.month.sipseongJj,
    pillarsDetail.day.sipseongCg, pillarsDetail.day.sipseongJj,
    ...(pillarsDetail.hour ? [pillarsDetail.hour.sipseongCg, pillarsDetail.hour.sipseongJj] : []),
  ].filter(Boolean);

  const siksangList = allSipseong.filter(s => siksangSet.has(s));
  const hasSiksang = siksangList.length > 0;

  return {
    hasSiksang,
    siksangList: [...new Set(siksangList)],
    advice: hasSiksang
      ? `표현·생산의 기운이 있어 에너지 발산 통로가 열려 있다. 표현·창작·가르침 활동이 몸과 마음 모두에 활력을 준다.`
      : "표현·생산의 기운이 없는 사주다. 에너지가 내부에 집중되는 구조로, 몸을 극도로 혹사하는 직업·활동은 장기적으로 체력을 소진시킨다. 표현과 발산의 통로(글·말·예술·봉사)를 의도적으로 만드는 것이 중요하다.",
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 십성 구조 분석: 무비겁·무재·쟁재·종격 패턴
// ══════════════════════════════════════════════════════════════════════════════
export interface SipseongPattern {
  name: string;
  hanja: string;
  desc: string;
  advice: string;
}

export function analyzeSipseongPatterns(pillarsDetail: SajuResult["pillarsDetail"]): SipseongPattern[] {
  const allPillars = [
    pillarsDetail.year, pillarsDetail.month, pillarsDetail.day,
    ...(pillarsDetail.hour ? [pillarsDetail.hour] : []),
  ];

  // 천간충(갑경·을신·병임·정계)에 걸린 천간은 십성 구조 판단에서 무력화된 것으로 보고 제외
  const CG_CHUNG_PAIRS: [string, string][] = [["갑","경"],["을","신"],["병","임"],["정","계"]];
  const allCgList = allPillars.map(p => p.cg);
  const chungedCg = new Set<string>();
  for (const [a, b] of CG_CHUNG_PAIRS) {
    if (allCgList.includes(a) && allCgList.includes(b)) { chungedCg.add(a); chungedCg.add(b); }
  }

  // 천간 십성: 충에 걸린 천간이면 무력화 처리. 지지 십성(지장간)은 그대로 반영.
  const allSipseong = [
    chungedCg.has(pillarsDetail.year.cg) ? null : pillarsDetail.year.sipseongCg, pillarsDetail.year.sipseongJj,
    chungedCg.has(pillarsDetail.month.cg) ? null : pillarsDetail.month.sipseongCg, pillarsDetail.month.sipseongJj,
    pillarsDetail.day.sipseongCg, pillarsDetail.day.sipseongJj,
    ...(pillarsDetail.hour ? [chungedCg.has(pillarsDetail.hour.cg) ? null : pillarsDetail.hour.sipseongCg, pillarsDetail.hour.sipseongJj] : []),
  ].filter((s): s is string => !!s);

  const has = (ss: string[]) => ss.some(s => allSipseong.includes(s));
  const countOf = (ss: string[]) => allSipseong.filter(s => ss.includes(s)).length;

  const patterns: SipseongPattern[] = [];

  if (!has(["비견","겁재"])) {
    patterns.push({
      name: "무비겁",
      hanja: "無比劫",
      desc: "사주에 동료·경쟁 기운이 없어요. 경쟁자나 동료 의식이 약하고, 혼자서도 충분히 자립할 수 있는 구조이에요.",
      advice: "협업보다 독립적인 역할에서 빛납니다. 경쟁을 피하고 자기만의 영역을 구축하세요.",
    });
  }

  if (!has(["정재","편재"])) {
    patterns.push({
      name: "무재",
      hanja: "無財",
      desc: "사주에 재물 기운이 없어요. 돈보다 가치와 명예를 우선시하는 구조. 재물이 손에 쥐어지기보다 흘러가기 쉬운 경향.",
      advice: "재물보다 자신의 가치를 높이는 데 집중하세요. 인맥과 실력이 재물을 대신해요.",
    });
  }

  const jaeCount = countOf(["정재","편재"]);
  const bigeupCount = countOf(["비견","겁재"]);
  if (jaeCount >= 1 && bigeupCount >= 2) {
    patterns.push({
      name: "쟁재",
      hanja: "爭財",
      desc: "동료·경쟁 기운이 많고 재물 기운을 두고 다투는 구조이에요. 재물이 생겨도 주변과 나눠야 하거나, 경쟁으로 인해 손실이 생기기 쉽어요.",
      advice: "재물을 혼자 독차지하려 하면 오히려 잃어요. 협력하여 파이를 키우는 전략이 효과적이에요.",
    });
  }

  if (!has(["정관","편관"])) {
    patterns.push({
      name: "무관",
      hanja: "無官",
      desc: "사주에 조직·책임 기운이 없어요. 규칙·조직보다 자유로운 구조를 선호해요. 직장보다 자영업·프리랜서가 더 잘 맞을 수 있어요.",
      advice: "조직 생활보다 독립적인 업무 환경에서 더 능력을 발휘해요.",
    });
  }

  if (!has(["정인","편인"])) {
    patterns.push({
      name: "무인",
      hanja: "無印",
      desc: "사주에 학습·보호 기운이 없어요. 학문·배움보다 실전·경험 중심으로 성장하는 유형이에요.",
      advice: "이론보다 현장 경험을 쌓으세요. 실전에서 빠르게 배우는 능력이 있어요.",
    });
  }

  return patterns;
}

// ══════════════════════════════════════════════════════════════════════════════
// 십성 그룹별 "유기적" 세력 분석: 단순 있음/없음이 아니라, 위치·통근·생극·충 관계를 종합해
// 각 십성 그룹(비겁/식상/재성/관성/인성)의 영향력을 강함/보통/약함/무 로 판단한다.
// ══════════════════════════════════════════════════════════════════════════════
export interface SipseongStrengthInfo {
  group: "비겁" | "식상" | "재성" | "관성" | "인성";
  status: "강함" | "보통" | "약함" | "무";
  reason: string;
}

const SIPSEONG_TO_GROUP: Record<string, "비겁" | "식상" | "재성" | "관성" | "인성"> = {
  비견: "비겁", 겁재: "비겁", 식신: "식상", 상관: "식상",
  정재: "재성", 편재: "재성", 정관: "관성", 편관: "관성", 정인: "인성", 편인: "인성",
};

const SIPSEONG_OF_GROUP: Record<"비겁" | "식상" | "재성" | "관성" | "인성", string[]> = {
  비겁: ["비견", "겁재"], 식상: ["식신", "상관"], 재성: ["정재", "편재"],
  관성: ["정관", "편관"], 인성: ["정인", "편인"],
};

// 십성 그룹의 화면 표시용 평이한 한국어 표현 (reason 문장 등에서 사용)
const SIPSEONG_GROUP_PLAIN: Record<"비겁" | "식상" | "재성" | "관성" | "인성", string> = {
  비겁: "동료·경쟁 기운", 식상: "표현·생산 기운", 재성: "재물 기운",
  관성: "조직·책임 기운", 인성: "학습·보호 기운",
};

export function getSipseongStrength(r: SajuResult): SipseongStrengthInfo[] {
  const pd = r.pillarsDetail;
  const pillars = [
    { key: "year" as const, ...pd.year, weight: 1.0 },
    { key: "month" as const, ...pd.month, weight: 1.2 },
    { key: "day" as const, ...pd.day, weight: 1.0 },
    ...(pd.hour ? [{ key: "hour" as const, ...pd.hour, weight: 0.8 }] : []),
  ];

  // 천간충 쌍 (갑경, 을신, 병임, 정계)
  const CG_CHUNG_PAIRS: [string, string][] = [["갑","경"],["을","신"],["병","임"],["정","계"]];
  const cgList = pillars.map(p => p.cg);

  const results: SipseongStrengthInfo[] = [];

  for (const group of ["비겁", "식상", "재성", "관성", "인성"] as const) {
    const groupNames = SIPSEONG_OF_GROUP[group];

    // 1) 천간(원국 본기둥)에 해당 십성이 드러난 기둥들 — 일주 천간은 일간 자신이므로 제외
    const cgHits = pillars.filter(p => p.key !== "day" && groupNames.includes(p.sipseongCg));
    // 2) 지지 본기(지장간 정기)에 해당 십성이 드러난 기둥들
    const jjHits = pillars.filter(p => groupNames.includes(p.sipseongJj));

    if (cgHits.length === 0 && jjHits.length === 0) {
      results.push({ group, status: "무", reason: `사주 안에 ${SIPSEONG_GROUP_PLAIN[group]}이 전혀 없어요.` });
      continue;
    }

    if (cgHits.length === 0) {
      // 지장간(지지 속)에만 있는 경우 — 잠재적 영향력은 있으나 드러나진 않음
      results.push({
        group, status: "약함",
        reason: `${SIPSEONG_GROUP_PLAIN[group]}이 천간에 드러나지 않고 지지 본기에만 있어 영향력이 약해요.`,
      });
      continue;
    }

    // 천간에 드러난 경우: 통근·충·생극을 종합해 점수화
    let score = 0;
    const reasons: string[] = [];

    for (const hit of cgHits) {
      // 위치 가중치
      score += hit.weight;

      // 충(沖) 확인: 같은 천간이 다른 기둥에 있고 그 둘이 충 쌍을 이루면 무력화 경향
      const otherCgs = pillars.filter(p => p.key !== hit.key).map(p => p.cg);
      const isChunged = CG_CHUNG_PAIRS.some(([a, b]) => {
        if (hit.cg === a) return otherCgs.includes(b);
        if (hit.cg === b) return otherCgs.includes(a);
        return false;
      });

      // 통근(同柱 지지가 해당 천간 오행을 생/같음으로 지원하는지)
      const cgEl = CG_OHAENG[hit.cg];
      const jjEl = JJ_OHAENG[hit.jj] ?? CG_OHAENG[JIJI_BONGI[hit.jj]?.[0] ?? ""];
      const sameJiji = cgEl === jjEl; // 같은 오행 = 통근
      // 같은 기둥 지지가 천간을 극하는 경우 (예: 신금 정관이 사화 위에 앉아 화극금으로 녹는 경우)
      // OHAENG_GEUKHAE[X]는 "X를 극하는 오행"이므로, cgEl을 극하는 오행이 jjEl과 같으면 지지가 천간을 극한다.
      const jjGeuksCg = OHAENG_GEUKHAE[cgEl as string] === jjEl;
      // 같은 기둥 지지가 천간을 생하는 경우 (OHAENG_SAENG[X]는 "X를 생하는 오행")
      const jjSaengsCg = OHAENG_SAENG[cgEl as string] === jjEl;

      if (isChunged) {
        score -= 0.6;
        const posLabel = (k: string) => k === "year" ? "연간" : k === "month" ? "월간" : k === "hour" ? "시간" : "일간";
        const partner = pillars.find(p => p.key !== hit.key && CG_CHUNG_PAIRS.some(([a, b]) => (hit.cg === a && p.cg === b) || (hit.cg === b && p.cg === a)));
        reasons.push(`${posLabel(hit.key)} ${hit.cg}이 ${partner ? posLabel(partner.key) + " " + partner.cg : "다른 천간"}과 충(沖)을 이뤄 약해지는 경향이 있어요`);
      }
      if (sameJiji) {
        score += 0.5;
        reasons.push(`같은 기둥의 지지(${hit.jj})가 통근하여 뿌리가 있어요`);
      } else if (jjGeuksCg) {
        score -= 0.5;
        reasons.push(`바로 아래 지지(${hit.jj})가 ${hit.cg}의 기운을 눌러 약화시켜요`);
      } else if (jjSaengsCg) {
        score += 0.3;
        reasons.push(`바로 아래 지지(${hit.jj})가 ${hit.cg}${objectParticle(hit.cg)} 생(生)해 힘을 더해줘요`);
      }
    }

    // 지지(지장간 본기)에도 같은 그룹이 있으면 약간 가산 (사주 전체에서의 세력)
    if (jjHits.length > 0) {
      score += 0.2 * jjHits.length;
    }

    // 월간/월지가 가장 강한 자리라는 위치적 특성 보너스
    const inMonth = cgHits.some(h => h.key === "month") || jjHits.some(h => h.key === "month");
    if (inMonth) {
      score += 0.3;
      reasons.push("월주는 사주에서 가장 힘이 강한 자리라 일정한 세력을 유지해요");
    }

    let status: SipseongStrengthInfo["status"];
    if (score >= 1.5) status = "강함";
    else if (score >= 0.5) status = "보통";
    else status = "약함";

    results.push({ group, status, reason: reasons.length > 0 ? reasons.join(". ") + "." : `${SIPSEONG_GROUP_PLAIN[group]}이 천간에 자리하고 있어요.` });
  }

  return results;
}

// ══════════════════════════════════════════════════════════════════════════════
// 추가 성향 내러티브 헬퍼 — 기존 십성/오행/신살 데이터를 조합해
// 자연스러운 문장 단편(string | null)으로 변환한다. (UI 카드 신설 금지, 기존 문단에 덧붙이는 용도)
// ══════════════════════════════════════════════════════════════════════════════

const JJ_YANG_SET = new Set(["자","인","진","오","신","술"]);
const CG_HAP_PARTNER: Record<string, string> = {
  갑:"기", 기:"갑", 을:"경", 경:"을", 병:"신", 신:"병", 정:"임", 임:"정", 무:"계", 계:"무",
};

function allPillarsOf(r: SajuResult) {
  const pd = r.pillarsDetail;
  return [pd.year, pd.month, pd.day, ...(pd.hour ? [pd.hour] : [])];
}

function allSipseongOf(r: SajuResult): string[] {
  return allPillarsOf(r).flatMap(p => [p.sipseongCg, p.sipseongJj]).filter((s): s is string => !!s);
}

function sipseongCount(r: SajuResult, names: string[]): number {
  return allSipseongOf(r).filter(s => names.includes(s)).length;
}

function sipseongHas(r: SajuResult, names: string[]): boolean {
  return allSipseongOf(r).some(s => names.includes(s));
}

function groupStrength(r: SajuResult, group: "비겁" | "식상" | "재성" | "관성" | "인성"): SipseongStrengthInfo["status"] {
  const info = getSipseongStrength(r).find(s => s.group === group);
  return info ? info.status : "무";
}

// 1) 집착남 사주 (남자만): 월지 수왕절 + 음일간(계/신/기/무) + 화 부족 + 관성 존재 + 금 존재
export function getJipchaknamNarrative(r: SajuResult, gender?: "male" | "female"): string | null {
  if (gender !== "male") return null;
  const pd = r.pillarsDetail;
  const monthIsSu = JJ_OHAENG[pd.month.jj] === "수";
  const dayCg = pd.day.cg;
  const isEumIlgan = ["계", "신", "기", "무"].includes(dayCg);
  if (!monthIsSu || !isEumIlgan) return null;

  const elements: Element[] = ["목", "화", "토", "금", "수"];
  const minEl = elements.reduce((a, b) => (r.scores[a] <= r.scores[b] ? a : b));
  const hwaLow = r.lacking.includes("화") || minEl === "화";
  if (!hwaLow) return null;

  const hasGwanseong = sipseongHas(r, ["정관", "편관"]);
  if (!hasGwanseong) return null;

  const allCg = allPillarsOf(r).map(p => p.cg);
  const allJj = allPillarsOf(r).map(p => p.jj);
  const hasGeum = allCg.includes("경") || allCg.includes("신") || allJj.includes("신") || allJj.includes("유") || r.scores.금 > 0;
  if (!hasGeum) return null;

  const hasMok = allCg.includes("갑") || allCg.includes("을") || allJj.includes("인") || allJj.includes("묘") || r.scores.목 > 0;

  const sentences: string[] = [
    "한 사람에게 마음이 깊이 들어가면 좀처럼 빠져나오지 못하고, 상대에게 강하게 집착하는 경향이 있는 구조예요.",
  ];
  if (hasMok) {
    sentences.push("거기에 자신이 정한 기준이나 원칙을 끝까지 밀어붙이는 면이 더해져, 한 번 꽂힌 사람·관계를 잘 놓지 못하는 성향이 한층 강해질 수 있어요.");
  }
  sentences.push(getHwabuJokNarrative(r) ?? "");
  return sentences.filter(Boolean).join(" ");
}

// 2) 화기운 보충법 + 화부족 성향 (모든 성별)
export function getHwabuJokNarrative(r: SajuResult): string | null {
  const elements: Element[] = ["목", "화", "토", "금", "수"];
  const minEl = elements.reduce((a, b) => (r.scores[a] <= r.scores[b] ? a : b));
  const hwaLow = r.lacking.includes("화") || minEl === "화";
  if (!hwaLow) return null;

  return "화(火) 기운이 약해서 사치스러운 면이나 노출에 대한 욕구, 짝사랑에 잘 빠지는 면이 있을 수 있고, 잘 웃거나 잘 놀라고 가슴이 자주 두근거리며 더운 걸 유독 싫어하는 편이에요. 드럼이나 피아노 같은 건반악기, 관악기 등 악기를 연주하거나 라틴댄스·필라테스 같은 운동을 즐기면 부족한 화 기운을 자연스럽게 채울 수 있어요.";
}

// 3) 무인성: 인성(정인/편인)이 전혀 없음
export function getMuinseongNarrative(r: SajuResult): string | null {
  if (sipseongHas(r, ["정인", "편인"])) return null;
  return "학습·보호 기운이 없어서 뇌가 해맑은 편이에요. 무언가를 잘 잊어버리는 경향이 있고, 예전에 본 내용도 다시 접하면 매번 새롭게 느껴지곤 해요.";
}

// 4) 양팔통: 4기둥의 천간+지지 8글자가 모두 양
export function getYangpaltongNarrative(r: SajuResult, gender?: "male" | "female"): string | null {
  const pillars = allPillarsOf(r);
  if (pillars.length < 4) return null;
  const allYang = pillars.every(p => CG_YANG_SET.has(p.cg) && JJ_YANG_SET.has(p.jj));
  if (!allYang) return null;

  let s = "사주 8글자가 모두 양(陽)으로만 이루어진 양팔통이에요. 외향적이고 진취적인 기운이 강하고, 추진력과 결단력이 빨라서 한번 마음먹으면 망설임 없이 밀고 나가는 타입이에요. 다만 성격이 급한 편이라 속도 조절이 필요해요.";
  if (gender === "male") {
    s += " 본인 성질을 스스로 제어하기 힘들어하는 순간이 있을 수 있어, 의식적으로 속도를 늦추는 연습이 도움이 돼요.";
  } else if (gender === "female") {
    s += " 여성치고는 남성적인 기질이 강하게 드러나는 편이라, 씩씩하고 주도적인 모습으로 비춰질 때가 많아요.";
  }
  return s;
}

// 5) 화수다자 + 홍염살: 성욕/스킨십/외모 취향 관련 (모든 성별)
export function getHwasuMultiHongyeomNarrative(r: SajuResult): string | null {
  const hasHwa = r.dominant.includes("화");
  const hasSu = r.dominant.includes("수");
  if (!hasHwa || !hasSu) return null;
  const hasHongyeom = r.sinsalList.some(s => s.name === "홍염살");
  if (!hasHongyeom) return null;
  return "화(火)와 수(水) 기운이 동시에 강하고 홍염살까지 자리해, 스킨십이나 애정 표현에 적극적인 편이고 이성에게 매력적으로 비치는 끼가 있어요. 외모나 분위기를 중요하게 여기는 취향도 함께 있는 구조예요.";
}

// 6) 비겁다자: 비견+겁재 2개 이상 (모든 성별, 여성+기신 추가 문장)
export function getBigeopMultiNarrative(r: SajuResult, gender?: "male" | "female"): string | null {
  const bigeupCount = sipseongCount(r, ["비견", "겁재"]);
  if (bigeupCount < 2) return null;

  let s = "독립심과 자존심을 뜻하는 기운이 여러 자리에 있어서 경쟁심과 승부욕이 강한 편이에요. 남에게 지는 걸 싫어하고, 질투심도 또래보다 강하게 느끼는 성향이 있어요.";
  const dayEl = CHEONGAN_ELEMENT[r.pillarsDetail.day.cg];
  if (gender === "female" && bigeupCount >= 3 && r.yongshin.gishin === dayEl) {
    s += " 다만 그 강한 기운이 본인에게는 부담으로 작용하는 구조라, 여성 관계에서 본의 아니게 다른 여성들의 견제나 미움을 사기 쉬운 흐름도 있으니 인간관계를 둥글게 다루는 노력이 도움이 돼요.";
  }
  return s;
}

// 7) 오행별 기운이 강한 장소 추천 (dominant 오행 기준)
const OHAENG_PLACES: Record<Element, string[]> = {
  목: ["등산", "산장", "전통찻집", "책방", "만화방", "식물원", "가구가게", "수목원", "시골", "산림욕"],
  화: ["사람 많은 곳", "시장", "백화점", "노래방", "스포츠 관람", "콘서트", "경마장", "하이킹", "꽃 많은 곳"],
  토: ["올림픽공원", "농원", "대학로", "조각공원", "동물원", "운동장", "들판", "잔디공원", "흙길 둘레길"],
  금: ["오락실", "피시방", "비디오방", "미술관", "암반계곡"],
  수: ["수영장", "호프집", "섬", "재즈카페", "온천욕", "낚시", "강", "바다", "호수공원"],
};

export function getOhaengPlaceNarrative(r: SajuResult): string | null {
  if (r.dominant.length === 0) return null;
  const el = r.dominant[0];
  const places = OHAENG_PLACES[el];
  if (!places || places.length === 0) return null;
  // 결과가 매번 같은 두 곳만 나오지 않도록 사주 점수 합으로 시작 인덱스를 살짝 흔든다.
  const seed = Math.round((r.scores[el] ?? 0) * 10);
  const a = places[seed % places.length];
  const b = places[(seed + 3) % places.length];
  return `${el}(${el}) 기운이 강한 사주라, 기운을 채우고 싶을 땐 ${a}이나 ${b} 같은 곳에 가보는 것도 좋아요.`;
}

// 8) 공망 다자: 4기둥 중 2개 이상의 지지가 공망에 해당
export function getGongmangNarrative(r: SajuResult): string | null {
  const pd = r.pillarsDetail;
  const gongmangJjs = getGongmang(pd.day.cg, pd.day.jj);
  const pillars = allPillarsOf(r);
  const hitCount = pillars.filter(p => gongmangJjs.includes(p.jj)).length;
  if (hitCount < 2) return null;
  return "공망에 해당하는 기둥이 여러 자리라, 평생 돈 생각이 머리에서 잘 떠나지 않는 흐름이 있을 수 있어요. 채워도 채워지지 않는 듯한 허전함이 돈에 대한 집착으로 이어지기 쉬우니, 돈 자체보다 돈을 버는 과정과 의미에 마음을 두는 게 마음 편한 길이에요.";
}

// 9) 일지도화 vs 월지도화
export function getDohwaPositionNarrative(r: SajuResult): string | null {
  const pd = r.pillarsDetail;
  const dohwaJj = getDohwaJj(pd.year.jj);
  const ilji = pd.day.jj === dohwaJj;
  const wolji = pd.month.jj === dohwaJj;
  if (!ilji && !wolji) return null;
  if (ilji && wolji) {
    return "일지와 월지에 모두 도화 기운이 자리해, 이성에게 인기가 많으면서 동시에 업무나 성과 면에서도 크게 주목받고 인정받는 타입이에요.";
  }
  if (ilji) return "도화 기운이 일지에 자리해, 이성에게 인기 있는 타입이에요.";
  return "도화 기운이 월지에 자리해, 업무나 성과 면에서 더 크게 주목받고 인정받는 타입이에요.";
}

// 10) 직장을 대하는 시각 — 각 십성 그룹 강함 상태별 한 문장
const JIKJANG_SISEON: Record<"비겁" | "식상" | "재성" | "관성" | "인성", string> = {
  비겁: "직장을 동료·경쟁자와 함께 부대끼는 곳으로 여기다 보니, 동료나 상사와 친하게 지내고 회식 같은 자리도 즐기는 편이에요.",
  식상: "직장에서도 말이나 표현을 통해 에너지를 쏟는 편이라, 회의나 대화 자리에서 말이 많아지고 아이디어를 적극적으로 풀어내는 타입이에요.",
  재성: "직장을 무엇보다 생계를 책임지는 수단으로 보는 경향이 강해서, 보상이나 실질적인 이득에 민감하게 반응하는 편이에요.",
  관성: "조직의 질서나 위계를 존중하는 편이라 상사의 말을 잘 따르고, 정해진 규칙 안에서 인정받으려는 태도가 강해요.",
  인성: "스스로 다 해내기보다 '어떻게든 되겠지, 도와주겠지' 하는 마음으로 주변의 도움이나 배움에 의존하는 경향이 있어요.",
};

export function getJikjangSiseonNarrative(r: SajuResult): string | null {
  const strong = getSipseongStrength(r).filter(s => s.status === "강함").map(s => s.group);
  if (strong.length === 0) return null;
  return strong.map(g => JIKJANG_SISEON[g]).join(" ");
}

// 11) 기신대운 진입 시 주의
export function getGishinDaewoonCaution(r: SajuResult, daewoonElement: Element): string | null {
  if (daewoonElement !== r.yongshin.gishin) return null;
  return "지금 흘러가는 대운의 기운이 기신에 해당해서, 무리한 시도나 급격한 변화는 피하고 몸과 마음을 돌보는 시기로 삼는 게 좋아요.";
}

// 14) 비겁다 무관 "뽀로로남" (남자만)
export function getPporonamNarrative(r: SajuResult, gender?: "male" | "female"): string | null {
  if (gender !== "male") return null;
  if (groupStrength(r, "비겁") !== "강함") return null;
  if (sipseongHas(r, ["정관", "편관"])) return null;
  return "독립심과 자존심을 뜻하는 기운은 강한데 조직·책임을 뜻하는 기운이 전혀 없어서, 가정이나 책임에 대한 개념이 약하고 노는 것을 우선시하는 성향이 있을 수 있어요. 제대로 된 남편 역할을 기대하기에는 다소 아쉬울 수 있는 구조라, 책임감을 의식적으로 키우려는 노력이 필요해요.";
}

// 15) 쟁재남 (남자만)
export function getJaengjaenamNarrative(r: SajuResult, gender?: "male" | "female"): string | null {
  if (gender !== "male") return null;
  const jaeCount = sipseongCount(r, ["정재", "편재"]);
  const bigeupCount = sipseongCount(r, ["비견", "겁재"]);
  if (!(jaeCount >= 1 && bigeupCount >= 2)) return null;
  return "평소엔 무난하게 잘 지내다가도, 헤어지자는 이야기가 나오면 갑자기 집착이나 연락, 소유욕이 강해지는 경향이 있어요. 관계를 쉽게 끝내기 어려운 상대일 수 있어요.";
}

// 16) 재성혼잡 재다남 (남자만)
export function getJaeseongHonjapNarrative(r: SajuResult, gender?: "male" | "female"): string | null {
  if (gender !== "male") return null;
  const hasJeongjae = sipseongHas(r, ["정재"]);
  const hasPyeonjae = sipseongHas(r, ["편재"]);
  if (!hasJeongjae || !hasPyeonjae) return null;
  const jaeCount = sipseongCount(r, ["정재", "편재"]);
  const isMulti = jaeCount >= 3 || groupStrength(r, "재성") === "강함";
  if (!isMulti) return null;
  return "처음엔 상대를 잘 챙겨주고 다정한 모습을 보이지만, 상대의 상황이 어려워지면 마음이 쉽게 떠날 수 있는 구조예요. 외도나 바람기로 흐를 가능성에도 주의가 필요해요.";
}

// 17) 관다녀 (여자만)
export function getGwandanyeoNarrative(r: SajuResult, gender?: "male" | "female"): string | null {
  if (gender !== "female") return null;
  const count = sipseongCount(r, ["정관", "편관"]);
  const isMulti = count >= 3 || groupStrength(r, "관성") === "강함";
  if (!isMulti) return null;
  return "주변에 호감을 보이는 남자가 많아서 인연이 복잡해지기 쉬운 구조예요. 스스로 중심을 잡고 선을 분명히 하는 게 중요해요.";
}

// 18) 상관견관녀 (여자만)
export function getSanggwanGyeongwanNarrative(r: SajuResult, gender?: "male" | "female"): string | null {
  if (gender !== "female") return null;
  if (!sipseongHas(r, ["상관"]) || !sipseongHas(r, ["정관"])) return null;
  return "욱하는 성격이나 잡도리하려는 태도가 배우자를 궁지로 밀어넣는 경향이 있을 수 있어요.";
}

// 19) 관성고립녀 (여자만, 단순화: 관성 1개 + 재성 0개)
export function getGwanseongGoripNarrative(r: SajuResult, gender?: "male" | "female"): string | null {
  if (gender !== "female") return null;
  const gwanCount = sipseongCount(r, ["정관", "편관"]);
  const jaeCount = sipseongCount(r, ["정재", "편재"]);
  if (gwanCount !== 1 || jaeCount !== 0) return null;
  return "결혼 생활에서 외로움이나 소통 부족을 느끼기 쉬운 구조예요. 배우자와의 정서적 교류를 의식적으로 늘리려는 노력이 필요해요.";
}

// 20) 관비암합녀 (여자만, 단순화: 일간 천간합 짝이 다른 자리에 정관/편관으로 존재)
export function getGwanbiAmhapNarrative(r: SajuResult, gender?: "male" | "female"): string | null {
  if (gender !== "female") return null;
  const dayCg = r.pillarsDetail.day.cg;
  const partner = CG_HAP_PARTNER[dayCg];
  if (!partner) return null;
  const others = allPillarsOf(r).filter(p => p !== r.pillarsDetail.day);
  const hit = others.some(p => p.cg === partner && ["정관", "편관"].includes(p.sipseongCg));
  if (!hit) return null;
  return "모르는 사이에 다른 사람에게 끌리거나 남편 외의 인연과 묘하게 얽히는 기류가 생기기 쉬운 구조라, 인간관계의 선을 분명히 하는 게 좋아요.";
}

// 21) 이성 인연·표현 기운의 연애 패턴 (여자만)
export function getGwanseongSiksangYeonaeNarrative(r: SajuResult, gender?: "male" | "female"): string | null {
  if (gender !== "female") return null;
  const hasGwan = sipseongHas(r, ["정관", "편관"]);
  const hasSik = sipseongHas(r, ["식신", "상관"]);
  if (!hasGwan && !hasSik) return null;
  const parts: string[] = [];
  if (hasGwan) {
    parts.push("연애에서 먼저 다가가기보다 간접적으로 돌아가며 접근하는 방식을 갖고 있어요. 주변 분위기나 무드에 영향을 많이 받는 편이고, 자의식이 강해서 상처받는 것에 대한 두려움이 있어요. 미리 조심하기보다 관계를 직접 겪어보면서 배우는 스타일이에요.");
  }
  if (hasSik) {
    parts.push("자신을 표현하고 분위기를 이끄는 능력이 재물로 이어지는 통로가 되는 기운도 있어요.");
  }
  if (hasGwan && hasSik) {
    parts.push("분위기를 만드는 힘과 그 분위기에 맞춰가는 힘이 함께 있어서, 둘이 만나면 연애의 호흡이 잘 맞아떨어지는 조합이에요.");
  }
  return parts.join(" ");
}

// 22) 금일간 + 목 3개 이상: 금이 목을 쳐내는 기운이 과도하게 강한 구조
export function getGeumMokGwadaNarrative(r: SajuResult): string | null {
  const dayCg = r.pillarsDetail.day.cg;
  const isGeumIlgan = dayCg === "경" || dayCg === "신";
  if (!isGeumIlgan) return null;
  if (r.rawScores.목 < 3) return null;
  return "금(金) 일간인데 사주 안에 목(木) 기운이 3개 이상 깔린 구조예요. 금이 목을 쳐내는 작용이 과도하게 누적되어, 감정 기복이나 충동을 다스리는 힘이 약해지기 쉬운 사주예요. 자기 감정을 객관적으로 점검하고 거르는 습관을 의식적으로 들이는 게 특히 중요해요.";
}

// 22-1) 도와주는 기운이 많아 신강한 남자 (의존적 성향)
export function isIndaSingangMale(r: SajuResult): boolean {
  if (r.yongshin.strength !== "신강") return false;
  if (groupStrength(r, "인성") !== "강함") return false;
  if (groupStrength(r, "비겁") === "강함") return false;
  return true;
}

export function getIndaSingangMaleNarrative(r: SajuResult, gender?: "male" | "female"): string | null {
  if (gender !== "male") return null;
  if (!isIndaSingangMale(r)) return null;
  return "자신을 도와주는 기운이 유난히 많아 신강한 사주예요. 어른스럽고 독립적인 모습보다는 누군가에게 의지하려는 경향이 강하게 나타나고, 무뚝뚝하거나 모성애가 강한 상대에게 매력으로 비치는 경우가 많아요. 부드러운 태도와 애교로 호감을 얻는 편이지만, 관계에서는 자신이 원하는 방향으로 상대가 맞춰주길 바라는 마음이 커요. 직접 요구하기보다 차분하고 설득력 있는 말투로 천천히 자기 뜻대로 유도하는 방식을 쓰는 경향이 있고, 말투는 부드러운데 내용을 들여다보면 일관성이 없거나 자기 위주인 경우가 있어요. 주변 사람에게는 다정한 편이라 관계를 정리하기 어렵게 느껴지기도 해요. 전반적으로 게으른 편이고 서운함이나 투정을 자주 표현하며, 은근히 경제적인 도움을 요구하는 경우도 있어요. 상대를 적극적으로 보호하거나 책임지는 역할은 약한 편이고, 외모나 과거 연애 상대를 은근히 비교하는 말을 하기도 하며, 자신에게는 후하고 상대에게는 엄격한 이중적인 기준을 보이는 경향도 있어요.";
}

// 22-2) 월지 단일 겁재: 원국에 겁재가 정확히 하나이고 그것이 월지에 위치
export function isWoljiSingleGyeopjae(r: SajuResult): boolean {
  if (sipseongCount(r, ["겁재"]) !== 1) return false;
  return r.pillarsDetail.month.sipseongJj === "겁재";
}

export function getWoljiSingleGyeopjaeNarrative(r: SajuResult): string | null {
  if (!isWoljiSingleGyeopjae(r)) return null;
  return "무언가를 뚝심 있게 밀고 나가거나 주위에 사람을 모으는 힘은 일간을 받쳐주는 경쟁·승부 기운이 적절히 있을 때 잘 나타나는데, 이 사주는 그 기운이 딱 하나, 그것도 한 해의 흐름을 좌우하는 자리(월지)에 자리잡고 있어요. 그래서 남들 눈치 보지 않고 밀어붙이는 자기만의 깡과 기본 무게감이 있고, 이 기운이 사주 전체의 중심축 역할을 하면서 사람을 이끄는 카리스마로 작용하는 경우가 많아요.";
}

// 22-3) 신강/신약 기질 특징 (용어 노출 없이 성향만 서술)
export function getStrengthTraitNarrative(r: SajuResult): string | null {
  if (r.yongshin.strength === "신강") {
    return "사주 전체가 자신을 강하게 받쳐주고 채워주는 기운으로 이루어져 있어서 정서적으로 매우 안정적인 구조예요. 그래서 겉으로는 의외로 부드럽고 온화하며 조용한 인상을 주는 경우가 많아요. 사람에 대한 근거 없는 믿음이 있는 편이라 자잘한 인간관계 트러블에는 크게 신경 쓰지 않고, 누군가 미묘한 신경전을 걸어와도 쉽게 흔들리지 않아요. 주변의 조언을 들어도 깊이 새기기보다는 가볍게 흘려듣고 결국 원래 마음먹은 대로 행동하는 경향이 뚜렷하며, 스스로 의식하는 것보다 주변에 미치는 영향력은 훨씬 큰 편이에요.";
  }
  if (r.yongshin.strength === "신약") {
    return "자신을 받쳐주는 기운보다 자신을 소모시키고 부담을 주는 기운이 더 강한 구조라, 내면에 위기감과 긴장감이 늘 깔려 있는 사주예요. 그래서 스스로를 강하게 보이려 애쓰고 사람에 대한 경계심도 강한 편이에요. 부족함을 메우려는 동력이 꾸준히 작동해서 자기계발이나 준비, 대비를 멈추지 않고 성취를 쌓아가는 경우가 많아요. 다만 마음 한구석에 항상 불안함이 있어 제대로 쉬는 걸 불편해하고, 타인의 시선을 의식하는 정도가 강해서 대인관계에서 오는 스트레스도 큰 편이에요.";
  }
  return null;
}

// 22-4) 극신강/신왕(극왕·태강) 기질 — 비견·겁재가 일간을 떠받치고 인성이 그 힘을 다시 키워주는 구조 (용어 노출 없이 성향만 서술)
export function getExtremeStrengthNarrative(r: SajuResult): string | null {
  const level = classifySinStrength(r.yongshin.percent);
  if (level !== "극왕" && level !== "태강") return null;
  return "사주 전체가 일간 본인을 떠받치는 기운으로 가득 차 있고, 그 위에 자신을 더 키워주는 기운까지 겹쳐 있어서 자기 확신과 추진력이 극단적으로 강한 구조예요. 본인의 판단을 의심하지 않고 주변의 통제나 제약을 잘 받아들이지 않으며, 자신과 비슷한 힘을 가진 존재와는 타협보다 경쟁을 택하는 경향이 강해요. 강한 자기 동력으로 조직을 만들고 사람을 끌어모으는 데는 탁월하지만, 본인보다 강한 권위나 규율 앞에서는 부딫히기 쉽고, 주변의 조언이나 견제를 무시한 채 독단적으로 밀고 나가다 고립되거나 갈등을 키우는 결과로 이어지는 경우가 많아요.";
}

// 22-5) 시지 천을귀인이 합충형파해 없이 온전하고, 오행 순환(상생)이 원활한 구조
function ohaengCirculatesWell(r: SajuResult): boolean {
  const pd = r.pillarsDetail;
  const seq = [pd.year.cg, pd.month.cg, pd.day.cg, ...(pd.hour ? [pd.hour.cg] : [])];
  const els = seq.map(c => CG_OHAENG[c]);
  let saengCount = 0, geukCount = 0;
  for (let i = 0; i < els.length - 1; i++) {
    if (OHAENG_SAENG[els[i + 1]] === els[i]) saengCount++;
    else if (OHAENG_GEUKHAE[els[i]] === els[i + 1] || OHAENG_GEUKHAE[els[i + 1]] === els[i]) geukCount++;
  }
  return geukCount === 0 && saengCount >= Math.ceil((els.length - 1) / 2);
}

export function isHourCheonulIntactGoodFlow(r: SajuResult): boolean {
  const pd = r.pillarsDetail;
  if (!pd.hour) return false;
  const cheonul = r.sinsalList.find(s => s.name === "천을귀인");
  if (!cheonul || !cheonul.pillars.includes("시")) return false;
  const order = [
    { label: "연", jj: pd.year.jj },
    { label: "월", jj: pd.month.jj },
    { label: "일", jj: pd.day.jj },
    { label: "시", jj: pd.hour.jj },
  ];
  const hourIdx = order.findIndex(o => o.label === "시");
  const rels = getJijiRelations(order.map(o => o.jj));
  if (rels.some(rel => rel.a === hourIdx || rel.b === hourIdx)) return false;
  return ohaengCirculatesWell(r);
}

export function getHourCheonulIntactGoodFlowNarrative(r: SajuResult): string | null {
  if (!isHourCheonulIntactGoodFlow(r)) return null;
  return "시지에 자리한 천을귀인이 다른 어떤 글자와도 합이나 충으로 얽히지 않고 온전한 힘을 그대로 유지하고 있어서, 어려운 순간마다 결정적인 도움을 받는 기운이 손상 없이 끝까지 살아 있는 구조예요. 여기에 더해 사주 전체 오행이 서로 부딫히지 않고 순서대로 생해주는 흐름을 이루고 있어서, 막히거나 정체되는 부분 없이 기운이 원활하게 순환돼요. 이런 구조는 성격적으로도 모난 데 없이 둥글고 온화하며, 주변과 부딫히기보다 자연스럽게 조화를 이루는 성품으로 나타나는 경우가 많아요. 전체적으로 무리 없이 풀려나가는 아주 좋은 사주 구조 중 하나로 꼽혀요.";
}

// 23) 학당귀인 보유자의 직업·학업 적합도
export function getHakdangCareerNarrative(r: SajuResult): string | null {
  const count = r.sinsalList.find(s => s.name === "학당귀인")?.pillars.length ?? 0;
  if (count <= 0) return null;
  return `${HAKDANG_INSIGHT.coreNature} ${HAKDANG_INSIGHT.businessAptitude}`;
}

const CG_BYEONGJON_DESC: Record<string, string> = {
  "갑": "변화와 경쟁심이 강해지고 고집이 세지는 경향이 있어요.",
  "을": "예민함이 커지고 인간관계에서 스트레스를 받기 쉬워요.",
  "병": "열정이 과해져 욱하는 성향이나 사고·구설을 조심해야 해요.",
  "정": "신경이 과민해지고 감정 기복이 커질 수 있어요.",
  "무": "고독함과 우직함이 동시에 강해지는 구조예요.",
  "기": "의심과 변덕이 늘어나 마음이 잘 흔들릴 수 있어요.",
  "경": "강한 결단력과 동시에 사고·수술 등을 조심해야 할 기운이에요.",
  "신": "손재(損財)나 시비·다툼이 생기기 쉬운 구조예요.",
  "임": "이동·변동이 많아지고 색정(色情)으로 인한 풍파를 조심해야 해요.",
  "계": "눈물 많고 풍파가 따르는, 감정의 기복이 큰 구조예요.",
};

const JJ_BYEONGJON_DESC: Record<string, string> = {
  "자": "역마성이 강해져 이동·변화가 많은 구조예요.",
  "축": "고집과 인내심이 동시에 강해지는 구조예요.",
  "인": "추진력이 매우 강해져 일을 벌이는 일이 많아져요.",
  "묘": "예민함과 손재주가 동시에 두드러지는 구조예요.",
  "진": "변화와 변동이 잦고 기복이 큰 구조예요.",
  "사": "은근한 경쟁심과 신경과민이 강해지는 구조예요.",
  "오": "열정과 조급함이 동시에 커지는 구조예요.",
  "미": "고집과 답답함이 동시에 강해지는 구조예요.",
  "신": "재주와 예리함이 강해지지만 시비도 늘어나요.",
  "유": "예민함과 결벽 성향이 강해지는 구조예요.",
  "술": "의리와 고집이 동시에 강해지는 구조예요.",
  "해": "이동수와 다정함이 동시에 강해지는 구조예요.",
};

export interface ByeongjonPattern {
  name: string;
  hanja: string;
  desc: string;
  advice: string;
}

export function detectByeongjon(pillarsDetail: SajuResult["pillarsDetail"]): ByeongjonPattern[] {
  const allPillars = [
    pillarsDetail.year, pillarsDetail.month, pillarsDetail.day,
    ...(pillarsDetail.hour ? [pillarsDetail.hour] : []),
  ];

  const result: ByeongjonPattern[] = [];

  const cgCount: Record<string, number> = {};
  const jjCount: Record<string, number> = {};
  for (const p of allPillars) {
    cgCount[p.cg] = (cgCount[p.cg] || 0) + 1;
    jjCount[p.jj] = (jjCount[p.jj] || 0) + 1;
  }

  for (const [cg, n] of Object.entries(cgCount)) {
    if (n >= 2 && CG_BYEONGJON_DESC[cg]) {
      result.push({
        name: `${cg}${cg}병존`,
        hanja: "竝存",
        desc: `천간에 ${cg}이 ${n}개 겹쳐 있는 '${cg}${cg}병존' 구조예요. 해당 천간의 기운이 강하게 증폭돼요.`,
        advice: CG_BYEONGJON_DESC[cg],
      });
    }
  }

  for (const [jj, n] of Object.entries(jjCount)) {
    if (n >= 2 && JJ_BYEONGJON_DESC[jj]) {
      result.push({
        name: `${jj}${jj}병존`,
        hanja: "竝存",
        desc: `지지에 ${jj}이 ${n}개 겹쳐 있는 '${jj}${jj}병존' 구조예요. 해당 지지의 기운이 강하게 증폭돼요.`,
        advice: JJ_BYEONGJON_DESC[jj],
      });
    }
  }

  return result;
}

export interface DohwaTypeResult {
  name: string;
  hanja: string;
  desc: string;
}

// 도화살의 위치(연/월/일/시)와 형충 여부에 따른 세부 유형 판단
export function analyzeDohwaTypes(pillarsDetail: SajuResult["pillarsDetail"]): DohwaTypeResult[] {
  const dohwaJj = getDohwaJj(pillarsDetail.year.jj);
  const pillars = [
    { label: "연주", jj: pillarsDetail.year.jj },
    { label: "월주", jj: pillarsDetail.month.jj },
    { label: "일주", jj: pillarsDetail.day.jj },
    ...(pillarsDetail.hour ? [{ label: "시주", jj: pillarsDetail.hour.jj }] : []),
  ];
  const has = (label: string) => pillars.find(p => p.label === label)?.jj === dohwaJj;

  const results: DohwaTypeResult[] = [];

  if (has("연주") || has("월주")) {
    results.push({
      name: "원내도화", hanja: "墻內桃花",
      desc: "도화가 연주·월주(가까운 사람·집안 쪽)에 있어요. 가족·지인 사이에서 인기가 많고, 가까운 관계 안에서 매력이 먼저 드러나는 구조예요.",
    });
  }
  if (has("일주")) {
    results.push({
      name: "야외도화", hanja: "牆外桃花",
      desc: "도화가 일주(자기 자신)에 있어요. 사회생활·바깥 활동에서 인기가 많고, 본인 스스로 매력의 중심이 되는 구조예요.",
    });
  }
  if (has("시주")) {
    results.push({
      name: "편야도화", hanja: "編野桃花",
      desc: "도화가 시주(노년·말년)에 있어요. 나이가 들수록 인기가 늘거나, 늦바람·뒤늦은 연애운이 들어오기 쉬운 구조예요.",
    });
  }

  const jjs = pillars.map(p => p.jj);
  const dohwaIdx = pillars.findIndex(p => p.jj === dohwaJj);
  if (dohwaIdx >= 0) {
    const rels = getJijiRelations(jjs);
    const isClashed = rels.some(r => (r.a === dohwaIdx || r.b === dohwaIdx) && (r.type === "충" || r.type === "형"));
    if (isClashed) {
      results.push({
        name: "도삽도화", hanja: "倒揷桃花",
        desc: "도화 지지가 충(沖) 또는 형(刑)을 맞고 있어요. 인기·매력은 있지만 그로 인한 구설·치정 시비나 감정 기복을 겪기 쉬운 구조예요. 관계의 거리 조절이 중요해요.",
      });
    }
  }

  return results;
}

// ══════════════════════════════════════════════════════════════════════════════
// 신약·신강 대응 방식 + 합·충 성격 + 천간충 건강
// ══════════════════════════════════════════════════════════════════════════════

export const SINGANG_RESPONSE_STYLE = {
  신강: {
    core: "외부 의견을 자기 기준으로 걸러냅니다. 타인의 평가나 주류 흐름에 흔들리지 않으며, 자신의 방식을 고수하는 것이 오히려 에너지를 강화해요.",
    socialStyle: "외부 기대에 맞추려 하면 에너지가 소진돼요. 자기 기준을 지키는 것이 신강에겐 생존 전략이에요.",
    decisionStyle: "타인의 의견보다 자신의 판단을 우선해요. 설득보다 원칙이 앞섭니다.",
    caution: "완고함이 관계 마찰을 유발할 수 있어요. 유연성을 의도적으로 훈련하세요.",
  },
  신약: {
    core: "외부 환경과 타인의 기준에 잘 적응해요. 유연한 수용력이 강점이며, 주변 흐름을 타고 성장하는 방식이 맞어요.",
    socialStyle: "타인의 피드백을 수용하고 맞춰가는 것이 신약에겐 현명한 전략이에요. 저항보다 적응에서 기회가 생깁니다.",
    decisionStyle: "외부 의견을 참고해 판단해요. 혼자 결정하기보다 신뢰하는 사람과 상의하는 것이 유리해요.",
    caution: "자기 기준 없이 흔들리면 정체성이 희미해집니다. 핵심 가치는 지키되 방법은 유연하게.",
  },
};

export const HAP_CHUNG_CHARACTER = {
  합: {
    name: "합(合)이 많은 사주",
    core: "에너지의 흐름이 순행해요. 갈등보다 조화를 추구하고, 부드럽게 흘러가는 성질이 있어요.",
    strength: "적응력과 포용력이 뛰어납니다. 관계에서 마찰이 적고 분위기를 부드럽게 만드는 능력이 있어요.",
    weakness: "변화에 저항이 없어 방향성이 흐려질 수 있어요. 강한 자극이나 도전 없이는 성장 동력이 약해질 수 있어요.",
    loveStyle: "상대의 변덕을 자연스럽게 받아줍니다. 충이 많은 상대에게는 방향을 잡아주는 역할을 할 수 있어요.",
    compatible: "충이 많은 상대를 이끌어주고 방향을 제시하는 역할이 맞어요. 충 상대의 실속 감각을 수용하면 시너지가 납니다.",
  },
  충: {
    name: "충(沖)이 많은 사주",
    core: "에너지가 서로 충돌하며 소용돌이 치는 구조이에요. 한 방향으로 흐르지 않고 내부에서 긴장이 지속돼요.",
    strength: "현실적 판단력과 영리한 실속 감각이 뛰어납니다. 손익을 빠르게 파악하고 상대가 더 유리한 행동을 하도록 이끄는 능력이 있어요.",
    weakness: "에너지가 정체되거나 소용돌이쳐 의사결정이 복잡해질 수 있어요. 감정 기복과 내부 갈등이 잦을 수 있어요.",
    loveStyle: "강하게 이끌어주는 상대가 필요해요. 애매하게 배려하는 것보다 명확하게 방향을 제시하고 끌어주는 스타일이 편해요.",
    compatible: "합이 많은 상대가 방향을 잡아줄 때 안정돼요. 자신의 실속 감각으로 상대의 부족한 현실 판단을 보완하는 역할을 해요.",
  },
};

export const CHUNGAN_CHUNG_HEALTH: Record<string, { pair: [string, string]; body: string; desc: string }> = {
  갑경충: {
    pair: ["갑","경"],
    body: "두부(頭部)",
    desc: "갑목(甲木)과 경금(庚金)이 충돌해요. 두통, 편두통, 머리 관련 신경 증상에 주의가 필요해요. 스트레스가 쌓이면 두통으로 표출되는 경향이 있어요.",
  },
  을신충: {
    pair: ["을","신"],
    body: "간·신경계",
    desc: "을목(乙木)과 신금(辛金)이 충돌해요. 간 기능 저하, 신경계 문제, 근육·힘줄 관련 질환에 주의하세요. 과로나 스트레스가 간에 먼저 영향을 미칩니다.",
  },
  병임충: {
    pair: ["병","임"],
    body: "심장·혈관",
    desc: "병화(丙火)와 임수(壬水)가 충돌해요. 심장 관련 질환, 혈압 문제, 순환계 이상에 주의가 필요해요. 감정 기복이 심하면 심혈관에 부담이 돼요.",
  },
  정계충: {
    pair: ["정","계"],
    body: "안구(眼球)·신장",
    desc: "정화(丁火)와 계수(癸水)가 충돌해요. 안구 질환, 시력 저하, 신장 기능 문제에 주의하세요. 수면 부족이나 과로가 눈과 신장에 가장 먼저 나타납니다.",
  },
};

export function detectChunganChung(pillarsDetail: SajuResult["pillarsDetail"]): (typeof CHUNGAN_CHUNG_HEALTH)[string][] {
  const cgs = [
    pillarsDetail.year.cg,
    pillarsDetail.month.cg,
    pillarsDetail.day.cg,
    ...(pillarsDetail.hour ? [pillarsDetail.hour.cg] : []),
  ];
  const cgSet = new Set(cgs);
  return Object.values(CHUNGAN_CHUNG_HEALTH).filter(c => cgSet.has(c.pair[0]) && cgSet.has(c.pair[1]));
}

// ── 십성 심층 해석 ─────────────────────────────────────────────
export const SIPSEONG_DEEP: Record<string, {
  essence: string;
  painPoint: string;
  relationship: string;
  modern: string;
}> = {
  정관: {
    essence: "물질(음)을 소유하기 위해 머리를 굽히는 에너지. 책임감을 느끼는 것이지 실천을 보장하지 않음. 자아는 크되 정체성이 약해 주변 분위기에 물들기 쉬움.",
    painPoint: "나를 보면 고통이 따름. 조직·책임을 뜻하는 이 기운은 맞은편에 내가 보이는 에너지이므로 자기 인식이 고통을 수반함.",
    relationship: "주변 환경과 네트워크가 삶의 방향을 결정함. 좋은 환경에서 좋게 물들고, 나쁜 환경에서 나쁘게 물듦.",
    modern: "SNS 등 자기 고통 자각이 높아질수록 이 기운이 주는 부담이 커짐. 책임감 없는 모습에 대한 평가가 두려워 행동함.",
  },
  편관: {
    essence: "정신적인 것(양)을 위해 고개를 굽히지 않으려는 에너지. 강한 압박과 통제의 기운.",
    painPoint: "사회적 압박과 고통이 강함. 극복하면 강한 리더십이 되지만 극복 못하면 자기 파괴.",
    relationship: "사랑을 주는 사람에게 타협함. 조직·책임을 뜻하는 기운이 두 갈래로 뒤섞이면 돈과 사랑 모두 원하고 모두 부담스러워함.",
    modern: "이 기운이 두 갈래로 뒤섞인 것이 바람의 원인이 아니라, 불만과 부담감이 원인. 욕망의 다양성 문제.",
  },
  정재: {
    essence: "주류에서 소외될까 두려워하는 에너지. 세상의 보편적 기준(적절함)을 아는 것. 두려움 기반 인내.",
    painPoint: "주변 주류의 시각과 가치관에 따라 판단 기준이 달라짐. 사회/문화적 맥락 없이는 이 재물 기운의 해석이 어려움.",
    relationship: "내가 얼마짜리인지 알고, 상대방 가치에 맞는 서비스를 함. 자기 가치에 손상되지 않으려 함.",
    modern: "이 재물 기운이 강할수록 주류를 따름. 친구·환경·SNS 여론이 가치관을 결정함.",
  },
  편재: {
    essence: "구체적이고 확실한 결과물을 얻고자 하는 에너지. 더 좋은 것이 보이면 이동하는 성질.",
    painPoint: "바람기 잠재. '저기 더 좋은 것이 보인다' 심리가 관계에도 적용됨.",
    relationship: "상대에게 잘해주지만 비교를 통해 특별함을 느꼈을 때만 유지됨.",
    modern: "베푸는 기운이 재물로 잘 이어지는 구조는 상대에게 바라는 것이 없지만, 더 좋은 대상이 나타나면 이동 가능성 있음.",
  },
  무재: {
    essence: "보편적인 적절함을 모르는 것. 다이소가 있다는 걸 모르는 사람. 자기 기준에 함몰.",
    painPoint: "상대방에게 적법한 대우를 모름. 고집 세면 소통 불가. 마음이 힘들게 함.",
    relationship: "여자의 자리를 마련해두지 않음. 일반적인 것이 왜 그래야 하는지 납득을 못함.",
    modern: "재물 기운이 없어도 성공 가능. 단 관계에서 지속적인 어긋남 발생.",
  },
  쟁재: {
    essence: "재물을 뜻하는 기운이 여러 개 뒤섞임. 다이소 한 점만 아는 것. 동료·경쟁 기운이 겹쳐 '해도 된다'는 마음 발생.",
    painPoint: "여자를 함부로 대하는 경향. 가학성 잠재. 몸이 상하게 함.",
    relationship: "재물 기운이 없는 경우급으로 볼 수 있음. 아는 곳만 집착하고 그 안에서 손상 발생.",
    modern: "재물을 두고 다투는 구조=몸이 힘듦. 재물 기운이 없는 구조=마음이 힘듦.",
  },
  정인: {
    essence: "나에게 좋은 것을 수용하는 에너지. 누리고 권리를 행사하는 것. 사적인 기운.",
    painPoint: "이 학습·보호 기운이 많으면 후회가 많고 상대를 압박함. 이기고 지는 것에 민감해짐.",
    relationship: "강자를 사랑함. 강자에게 맞춰 사랑받는 에너지. 윗사람에게 이쁨받음.",
    modern: "공공 가치보다 나의 사적 기준이 우선. 재물·조직 기운이 공적이라면 학습·자존 기운은 사적.",
  },
  편인: {
    essence: "편향된 수용. 모성 없는 어머니 에너지. 독특한 방식으로 흡수.",
    painPoint: "효율적이지만 차갑게 작용할 수 있음.",
    relationship: "베푸는 기운을 눌러 표현력을 막을 수 있음.",
    modern: "현대사회 전문직·기술직에 잘 맞음.",
  },
  식신: {
    essence: "내가 겪은 문제를 두 번 다시 겪지 않도록 방어막을 치는 에너지. 타인의 니즈 충족을 통한 재화 획득.",
    painPoint: "소시오패스적으로 리스크 헷징하는 면 있음. 호구가 아님.",
    relationship: "바라는 것 없이 베풀지만 그 이면에 철저한 리스크 관리가 있음.",
    modern: "열심히 하면 된다는 마인드. 장기적으로 쌓아올리는 힘이 보상을 기대하며 베푸는 기운보다 큼.",
  },
  상관: {
    essence: "기존 질서를 상하게 하는 에너지. 약자를 사랑함. 순수했다가 흑화한 에너지.",
    painPoint: "해준 것만큼 돌아오지 않음. 약자 구제 본능으로 인복이 적어짐. 순두부 멘탈.",
    relationship: "약자를 사랑하니 강자에게 사랑받지 못함. 학습·보호 기운(강자사랑)보다 인복이 적음.",
    modern: "굳이 안 해도 될 말을 해서 적을 만들 수 있음. 과정을 건너뛰는 습성.",
  },
  비겁: {
    essence: "자기 자신과 같은 에너지. 경쟁과 협력의 이중성.",
    painPoint: "재물을 두고 다투는 상황 발생 시 '해도 된다'는 심리 강화.",
    relationship: "이 동료·경쟁 기운이 많으면 나눔보다 경쟁 우위를 취하려는 성향.",
    modern: "현대사회 협업 환경에서는 이 동료·경쟁 기운을 잘 활용해야 함.",
  },
};

// ── 일간별 심층 성향 ───────────────────────────────────────────
export const ILGAN_DEEP: Record<string, {
  findType: string;
  painCore: string;
  socialStyle: string;
  moneyStyle: string;
  caution: string;
  structureNote?: string;
}> = {
  갑: {
    findType: "여동생 타입. 자기 말을 잘 들어줄 부드럽고 여성스러운 상대를 선호.",
    painCore: "양간 여자와 반목이 심함. 나를 제지하는 상대를 건방지게 느낌.",
    socialStyle: "이기적→이타적 감정선. 먼저 나를 챙기고 나서 타인을 챙김.",
    moneyStyle: "재물 기운보다 학습·보호 기운이 발달. 방향은 잘 잡지만 많이 얻지 못하는 경향.",
    caution: "완고하고 고집이 강해 관계에서 벽을 만들 수 있음.",
  },
  을: {
    findType: "엄마 타입. 연상 혹은 자신을 보살펴줄 수 있는 포용력 있는 상대를 선호.",
    painCore: "학습·보호 기운(수)이 없는 구조. 고아의 심정. 정신적으로 취약함.",
    socialStyle: "12운성 역행. 열심히 해도 기대와 반대 결과가 나오는 경험 반복.",
    moneyStyle: "분할매수형. 타이밍이 어긋나도 꾸준히 쌓아가는 방식. 생존 에너지.",
    caution: "집착이 생기면 상대를 숨막히게 할 수 있음. 섭섭함을 직접 말 못하고 쌓아둠.",
  },
  병: {
    findType: "마음을 다독여줄 사람. 물질보다 정서적 지지가 우선.",
    painCore: "밝아 보이지만 홀로 남겨졌다는 고독감이 내면에 있음. 에너지를 발산하되 외로움 동반.",
    socialStyle: "목화팀의 정신적 대장. 포기하고 싶을 때 '아직 끝나지 않았다'고 말할 수 있는 유일한 일간.",
    moneyStyle: "병신합(수) 주의. 잘못된 합으로 추락 위험. 재물보다 명예를 먼저 추구.",
    caution: "병신합이 되는 상대(신금)와의 관계에서 추락 위험 있음.",
  },
  정: {
    findType: "자신의 멋진 모습에 빠진 상대. 통제하려 하지 않음.",
    painCore: "에너지가 한정적인데 발산하는 일간. 에너지 소진 시와 충전 시 모습이 극단적으로 다름.",
    socialStyle: "발산형. 촛불처럼 외부 환경에 흔들림. 회피 기질이 강함.",
    moneyStyle: "일관성보다 감성에 따른 판단. 상황에 따라 재물 추구 방식이 바뀜.",
    caution: "힘들면 놔버리는 성향. 기토와 만나면 일관성 없음으로 오해받을 수 있음.",
  },
  무: {
    findType: "중용적인 상대. 극단적 감정 변동 없는 안정적인 사람.",
    painCore: "공감 능력이 낮아 보이지만 실제로는 중용을 지키기 위해 감정을 삭히는 것.",
    socialStyle: "양과 음의 절충. 신을 믿지 않는 신부형. 평판에 민감해 극심한 감정 변동을 자제.",
    moneyStyle: "시장 중심적 사고. 실리와 명분을 동시에 추구.",
    caution: "속을 알기 가장 어려운 일간. 거짓말하지 않으면서도 속내를 드러내지 않음.",
  },
  기: {
    findType: "자신을 1등급으로 대우해줄 상대. 말이 아닌 실질적 가치를 보여주는 사람.",
    painCore: "사람을 등급으로 나누는 기준이 자신에게도 적용됨. 자기 등급을 높이기 위해 끊임없이 노력.",
    socialStyle: "겉으로 드러나는 재물 기운과 속에 품은 학습·보호 기운 모두 길신인 유일한 일간. 품격을 유지하며 윗사람에게 이쁨받음.",
    moneyStyle: "고급 서비스업, 호텔업 적합. 적절한 서비스 수준과 품격을 본능적으로 앎.",
    caution: "잘못을 하면 알지만 합리화하거나 숨기는 두 가지 옵션만 있음.",
  },
  경: {
    findType: "자신을 넉넉하게 이해해줄 상대. 습한(포용력 있는) 일간 선호.",
    painCore: "장기전에 불리. 낮보다 밤에 강한 구조. 성실하면 몸이 상함.",
    socialStyle: "욕망의 일간. 한방에 역전하는 전략이 맞음. 고부가가치를 택해야 함.",
    moneyStyle: "타이밍의 일간. 목 끝까지 참은 다음 한번 더 참으면 그때가 타이밍.",
    caution: "내부에서 무너짐. 자기 자신이 최대의 적. 습한 일간 파트너 추천, 조한 일간은 피할 것.",
    structureNote: "경금은 누군가에게 도움을 받아 강해지기보다, 비슷한 동료·경쟁 기운이 곁에서 함께 받쳐줄 때 더 단단한 칼이 돼요. 도와주는 기운이 너무 많으면 오히려 장점이 죽는 경우가 많고, 적더라도 곁에 살짝 있는 정도가 가장 잘 맞아요. 책임감을 다스리는 조직·책임 기운을 유독 잘 다루는 일간이라, 재물 기운이 책임감 기운으로 흘러가는 흐름을 가장 능숙하게 쓸 줄 알아요. 한편 표현·생산 기운으로 기운을 크게 흘려보내는 구조를 타면 큰 시장·흐름을 읽는 능력으로 발현되는데, 이때는 도움을 주는 기운이 곁에 있는 게 오히려 도움이 돼요. 재물 기운을 다루는 솜씨도 좋은데, 단순히 사업가형이라기보다는 판을 짜고 이끄는 통치자형에 가까워요. 정반대 기운과 가깝게 묶이는 합(을경합)은 좋게 풀리는 경우를 보기 어려운 편이고, 기운을 적당히 식혀주는 흐름은 도움이 돼요.",
  },
  신: {
    findType: "자신을 조심스럽게 대해주는 사람. 무해한 사람.",
    painCore: "낙오에 대한 불안감. 외부 충격에는 강하지만 내부 작은 상처에 깨짐.",
    socialStyle: "100명이 yes해도 no 할 수 있는 유일한 일간. 소수 의견 대변. 미움받을 용기 필요.",
    moneyStyle: "2진법적 판단. 돈과 권력이 핵심 동력. 품위 유지비가 많이 듦.",
    caution: "유리형. 자기 스스로 부족함을 드러낼 수 있어도 타인이 지적하는 것을 못 참음.",
  },
  임: {
    findType: "자신의 능력을 인정해주는 사람. 논리와 실력으로 어필해야 함.",
    painCore: "신분 상승에 대한 고민이 눈에 보임. 타인을 위한 준비를 하는 참모형.",
    socialStyle: "이타적→이기적 감정선. 너를 위한 준비를 하되 결국 이기적 선택을 함.",
    moneyStyle: "목줄이 묶여 있어 성실함. 재물 기운이 많이 옴. 분야의 왕이 되는 구조.",
    caution: "별생각 없어 보이지만 신분 상승에 대한 욕망이 강함. 감성 오버는 역효과.",
  },
  계: {
    findType: "자신의 감성을 받아줄 사람. 스며들 듯 가까워지는 관계.",
    painCore: "안개처럼 부드러운 인상이지만 내면에 강한 욕구 있음.",
    socialStyle: "음간 역행. 혼돈 속에서 확실한 것을 잡으려는 경향.",
    moneyStyle: "재물 기운이 옴. 확실한 결과물을 원함.",
    caution: "청순하지만 실제로는 집요하게 파고드는 타입.",
  },
};

// ── 월지별 핵심 고통 ───────────────────────────────────────────
export const WOLJI_PAIN: Record<string, {
  coreWound: string;
  lifeStyle: string;
  relationship: string;
  health: string;
}> = {
  인: {
    coreWound: "비선형적 삶. 과정을 건너뛰고 싶은 욕망과 현실의 충돌.",
    lifeStyle: "악(비도덕)을 이용해서라도 목표에 도달하려 함. 과거는 없고 미래만 있음.",
    relationship: "사람을 거래 상대로 봄. 되는 사람과 안되는 사람을 철저히 구분.",
    health: "심장 부정맥 주의. 혈액순환 계통.",
  },
  묘: {
    coreWound: "내가 마지막에 중요. 헌신이 불가능한 구조.",
    lifeStyle: "도화 에너지. 자연스럽게 사람을 끌어당기지만 자신이 최우선.",
    relationship: "상대에게 헌신한다는 것이 불가능에 가까움. 마지막엔 나를 선택함.",
    health: "간담계통 주의.",
  },
  진: {
    coreWound: "완성 직전의 좌절. 마지막 결실을 눈앞에서 놓치는 경험.",
    lifeStyle: "봄의 마무리. 에너지 집결기. 준비를 철저히 하지만 타이밍을 놓칠 수 있음.",
    relationship: "집착이 생기면 강함. 완성하려는 욕구가 관계에서도 작용.",
    health: "근골격계, 알레르기 주의.",
  },
  사: {
    coreWound: "현실 때문에 꿈을 포기해야 하는 고통.",
    lifeStyle: "음양 혼잡. 물질과 명예 모두 원함. 9회말 역전 홈런 가능한 일간.",
    relationship: "강압적 성향. 뱀처럼 지혜롭게 다가가야 상대방이 따라옴.",
    health: "심장·혈압 주의. 홍역·피부 계통.",
  },
  오: {
    coreWound: "기능인간으로 살아가는 것. 자아가 없고 능력으로만 평가받음.",
    lifeStyle: "자아를 희생하고 기능으로 변모. 주변에 사람이 많지만 진심 나눌 사람 없음.",
    relationship: "내가 누군지를 모름. 진짜 모습을 보여줬다가 버림받는 경험 반복.",
    health: "심장·소장 주의. 과열 주의.",
  },
  미: {
    coreWound: "열심히 살았는데 남는 게 없는 허탈감.",
    lifeStyle: "시스템 안에서 성과 추구. 과정을 중시하지만 결실이 늦음.",
    relationship: "자기 감정을 드러내지 않음. 허탈감을 혼자 삭힘. 갑자기 잠수.",
    health: "위장·비장 주의.",
  },
  신: {
    coreWound: "낙오에 대한 불안감이 삶 전체를 관통.",
    lifeStyle: "외부 충격에 강하지만 내부 상처에 약함. 품위 유지비가 많이 필요.",
    relationship: "자기 상처를 절대 말하지 않음. 못나 보이면 조용히 사라짐.",
    health: "폐·대장 주의.",
  },
  유: {
    coreWound: "평생 해야 하는 숙제가 있는 삶. 시지프스의 형벌.",
    lifeStyle: "아름다움을 추구하며 자연 상태(엔트로피 증가)를 막으려 함. 잔소리가 많음.",
    relationship: "사랑하는 사람을 조심스럽게 대해주는 것을 원함. 비자발적 헌신주의자.",
    health: "폐·피부 주의. 수치 민감도 매우 높음. 성관계 신중히.",
  },
  술: {
    coreWound: "지우고 싶은 과거가 생기는 것. 되돌릴 수 없는 순간.",
    lifeStyle: "얕게 살아야 안전. 빠지면 헤어나기 어려움. 확인하고 바로 유턴.",
    relationship: "오아시스인지 신기루인지 계속 확인. 수동적이지만 사람 관심 많음.",
    health: "폐·기관지 주의. 우울감 주의. 노화가 느린 경향.",
  },
  해: {
    coreWound: "인생 자체가 하드코어. 급작스러운 상황 변동이 잦음.",
    lifeStyle: "사각돛배. 우연한 만남과 기회로 삶이 결정됨. 자기은신 능숙.",
    relationship: "복수심이 강함. 타인을 통제하고 싶은 욕망. 집요하게 파고드는 성향.",
    health: "신경성 질환 주의. 스트레스 매우 높음. 횡재수 있음.",
  },
  자: {
    coreWound: "양기인데 음기에 갇혀 자기 자신을 학대하게 됨.",
    lifeStyle: "낮의 모습과 밤의 모습이 다름. 철저하게 자기 자신만을 위해 살아야 맞음.",
    relationship: "능력 있는 사람과 없는 사람을 수직적으로 구분. 수준 모르는 사람을 견디지 못함.",
    health: "신장·방광 주의. 저체온·수면 계통.",
  },
  축: {
    coreWound: "다리 역할을 하지만 아무도 고마워하지 않음. 에펠탑을 꿈꾸지만 다리로 삶.",
    lifeStyle: "생각의 감옥에 빠지기 쉬움. 무질서를 싫어함. 우선법으로 꾸준히 나아감.",
    relationship: "연인에게 일편단심. 손해 보는 것을 극도로 싫어함. 돈에 매우 민감.",
    health: "비장·위장 주의. 강박 경향. 삭신이 쑤리는 증상.",
  },
};

// ── 음양간 특성 ────────────────────────────────────────────────
export const UMYANG_NATURE = {
  양간: {
    desc: "12운성 순행. 열심히 하면 된다는 마인드. 이기적→이타적 감정선. 나를 위한 준비를 하며 책임이 따름.",
    relationship: "자기주도적. 여동생형(보살핌받는 상대) 선호.",
    trait: "순행적 마인드. 예측 가능한 인과관계에 익숙.",
  },
  음간: {
    desc: "12운성 역행. 열심히 해도 기대와 다른 결과가 나오는 경험이 잦음. 혼돈과 불안이 기저에 있음.",
    relationship: "자상해 보이지만 고통 회피 기질. 이타적→이기적 감정선.",
    trait: "확실한 것(물질)을 잡으려는 경향. 돈에 민감한 것도 혼돈에 대한 방어.",
  },
};

// ── 관성의 진짜 의미 ──────────────────────────────────────────
export const GWANSEONG_TRUTH = {
  essence: "맞은편에서 내가 보이는 에너지. 나를 보면 고통이 따름. 인간의 추악한 면을 자각하게 되는 구조.",
  responsibility: "책임감을 느끼는 것과 책임감을 실천하는 것은 완전히 다름. 관이 많으면 책임감을 강하게 느끼기에 오히려 실천 못할 수도 있음.",
  crime: "조직·책임 기운이 강한 쪽의 범죄: 나도 고통스러우니 너도 고통받아야 한다. 이 기운이 없는 쪽의 범죄: 상대의 고통에 둔감하여 저지름. 어느 쪽이든 범죄 가능.",
  identity: "자아는 크되 정체성이 약함. 주변 분위기에 물들기 쉬움. 환경이 삶의 방향을 결정함.",
  modern: "현대사회일수록 조직·책임 기운으로 인한 고통 자각이 높아짐. SNS로 자신을 더 많이 보게 되어 그 고통이 증가.",
};

// 오행별 생활 처방 행동 (부족한 오행 보완)
export const OHAENG_ACTIONS: Record<string, { title: string; actions: string[] }> = {
  목: {
    title: "목(木) 기운 충전",
    actions: ["새벽 기상 후 스트레칭", "식물·화분 가꾸기", "숲·공원 걷기", "계획 세우고 실행", "새로운 것 시작하기", "초록 채소 섭취"],
  },
  화: {
    title: "화(火) 기운 충전",
    actions: ["햇빛 쐬기 (오전 30분)", "사람 많은 곳 나가기", "발표·스피치 연습", "운동 강도 올리기", "빨간색·주황색 활용", "열정적인 프로젝트 시작"],
  },
  토: {
    title: "토(土) 기운 충전",
    actions: ["같은 시간 기상·취침", "식사 시간 일정화", "방 정리·청소", "자동저축 설정", "장기 프로젝트 완주", "하체 운동·걷기", "과한 냉식 피하기"],
  },
  금: {
    title: "금(金) 기운 충전",
    actions: ["숫자·재무 관리", "기준·원칙 세우기", "불필요한 인간관계 정리", "장비·도구 정돈", "결단력 연습", "흰색·은색 활용", "계약·문서 꼼꼼히"],
  },
  수: {
    title: "수(水) 기운 충전",
    actions: ["충분한 수면 (7-8시간)", "물 자주 마시기", "혼자 조용히 사색하기", "독서·공부 시간 확보", "직관 일기 쓰기", "명상·마음챙김", "검은색·네이비 활용"],
  },
};

// 십신(十神) 단문 설명 (Threads 참고)
// SIPSEONG_DESC, SIPSEONG_MONEY_COMBO, JIJANGAN_DISPLAY 는 lib/saju2.ts 로 이동됨
export { SIPSEONG_DESC, SIPSEONG_MONEY_COMBO, JIJANGAN_DISPLAY } from "./saju2";

// ── 格局 패턴 / 병존(竝存) 감지 ──────────────────────────────────────────────
// 매력 분석(charm)뿐 아니라 만세력 등 사주 원국을 보여주는 모든 곳에서
// 동일한 기준으로 격국·병존을 판정하기 위한 공용 로직.
export interface GagukPattern {
  name: string; hanja: string; color: string;
  desc: string; charmDesc: string;
}
export function detectGagukPatterns(result: SajuResult): GagukPattern[] {
  const ilgan = result.pillarsDetail.day.cg;
  const sc = result.scores;
  const dom = result.dominant;
  const patterns: GagukPattern[] = [];
  const pd = result.pillarsDetail;
  const pillars = [pd.year, pd.month, pd.day, ...(pd.hour ? [pd.hour] : [])];

  // 금수쌍청: 경·신 일간이 녹왕지에 뿌리를 두고(건록·제왕), 조토(미·술)의 방해가 없으며,
  // 해자월에 태어나 천간에 식상수(경금→임수, 신금→계수)가 투출하고,
  // 한랭한 금수를 조후하는 관성 화기(경금→병화, 신금→정화)가 투출하면서 유기(有氣)한 경우에만 인정한다.
  if (["경","신"].includes(ilgan)) {
    const hasRoot = pillars.some(p => p.uunseong === "건록" || p.uunseong === "제왕");
    const hasJoto = pillars.some(p => p.jj === "미" || p.jj === "술");
    const isHaejaMonth = ["해","자"].includes(pd.month.jj);
    const isStrongSu = dom.includes("수") || sc.수 >= 2;
    const hwaYugi = dom.includes("화") || sc.화 >= 1;
    // 경금 일간 → 임수 투출 + 병화 정관 투출 / 신금 일간 → 계수 투출 + 정화 정관 투출
    const susang = ilgan === "경" ? "임" : "계";
    const gwanseong = ilgan === "경" ? "병" : "정";
    const susangTugan = pillars.some(p => p.cg === susang);
    const gwanseongTugan = pillars.some(p => p.cg === gwanseong);
    // 경술처럼 조토(술)가 일주 등에 끼어 있으면 '순도 100% 금수쌍청'보다
    // '토를 바탕으로 한 금수상생'으로 보는 경우가 많다.
    if (hasRoot && hasJoto && isHaejaMonth && susangTugan && isStrongSu) {
      patterns.push({ name:"토를 바탕으로 한 금수상생", hanja:"土金水相生", color:"#cbd5e1",
        desc:"금(金)과 수(水)가 맞닿아 있지만, 조토(燥土)가 한 축에 자리해 순도 100% 금수쌍청이라기보다 토(土)가 금(金)을 생해주며 그 위에서 금수의 맑은 기운이 흐르는 구조입니다. 차가운 명석함에 묵직한 안정감이 더해진 인상입니다.",
        charmDesc:"날카로운 두뇌와 카리스마는 그대로 가지면서도, 한 박자 더 든든하고 안정된 무게감이 느껴지는 타입. 이성은 '예리한데 믿음직스럽다'는 인상을 받습니다." });
    }
    // 금백수청(金白水淸) — 삼명통회 기준
    // ① 경신(庚申)·신유(辛酉) 일주 (건록 일주)
    // ② 가을철(신유술월) 출생
    // ③ 시상에 임·계수가 있고, 지지에 해·자수의 무리가 있을 것
    // ④ 형충파해가 없을 것
    // ⑤ 금수가 상정(相停)하고, 화·토가 훼방하지 않을 것 (여름철 출생은 해당 안 됨)
    const isIljuGeonrok = (ilgan === "경" && pd.day.jj === "신") || (ilgan === "신" && pd.day.jj === "유");
    const isFallMonth = ["신","유","술"].includes(pd.month.jj);
    const isWinterMonth = ["해","자","축"].includes(pd.month.jj);
    const isSummerMonth = ["사","오","미"].includes(pd.month.jj);
    const susangSisang = pd.hour && (pd.hour.cg === "임" || pd.hour.cg === "계");
    const allJj = pillars.map(p => p.jj);
    const haejaGroup = allJj.includes("해") || allJj.includes("자");
    const noHyungChungPaHae = getJijiRelations(allJj).every(r => !["충","형","파","해"].includes(r.type));
    const geumSuSangjeong = sc.금 >= 1.5 && sc.수 >= 1.5 && sc.화 < 1.5 && sc.토 < 1.5;
    // 경진·경자·계사·계유·계축 일주가 가을·겨울에 태어나 화상관·토의 극제 없이
    // 금수상정을 이루면 같은 격으로 인정한다 (봄철은 운행이 서북금수로 흘러야 하므로 제외)
    const altIljuList = ["경진","경자","계사","계유","계축"];
    const isAltIlju = altIljuList.includes(`${ilgan}${pd.day.jj}`);
    const isGeumbaeksuByMain = isIljuGeonrok && isFallMonth && !isSummerMonth && susangSisang && haejaGroup;
    const isGeumbaeksuByAlt = isAltIlju && (isFallMonth || isWinterMonth);
    if ((isGeumbaeksuByMain || isGeumbaeksuByAlt) && noHyungChungPaHae && geumSuSangjeong) {
      patterns.push({ name:"금백수청", hanja:"金白水淸", color:"#bae6fd",
        desc:"한 마디로 '인생 클린 버전'. 금(金)이 새하얗게, 수(水)가 투명하게 맑은 상태로 만나 형충파해 같은 잡음도 없고, 화·토의 방해도 없이 깨끗하게 흘러가는 조합이에요. 옛 문헌에서는 이 구조를 가진 사람은 시험·승진·평가에서 두각을 드러내고, 글이나 콘텐츠로 이름을 알리는 경우가 많다고 봤어요. 부와 명예를 동시에 가져가는 '엘리트 라인' 사주로 통합니다.",
        charmDesc:"꾸안꾸로 정제된 분위기, 말과 글에 잡티가 없는 깔끔한 인상. 이성에게는 '이 사람 뭔가 다르다, 능력 있어 보인다'는 인상을 단번에 심어주는 타입이에요." });
    }
    if (hasRoot && !hasJoto && isHaejaMonth && susangTugan && isStrongSu) {
      const hasGwanseong = gwanseongTugan && hwaYugi;
      patterns.push({ name:"금수쌍청", hanja:"金水雙淸", color:"#93c5fd",
        desc: hasGwanseong
          ? "금(金)과 수(水)가 맑고 순수하게 배치되고, 한랭한 금수를 조직·책임을 뜻하는 화기(火氣)가 따뜻하게 조후해주는 격. 지적 명석함과 냉철한 카리스마에 더해 명성을 누릴 그릇을 타고났습니다."
          : "금(金)과 수(水)가 맑고 순수하게 배치된 사주. 지적 명석함과 냉철한 카리스마가 타고난 격이나, 조직·책임을 뜻하는 화기(火氣)의 조후가 더해지면 그 격이 한층 빛을 발할 수 있습니다.",
        charmDesc: hasGwanseong
          ? "두뇌 회전이 빠르고 말 한마디가 날카롭게 꽂히는데, 그 안에 따뜻한 온기까지 갖춘 타입. 이성은 '대화하고 싶다'와 '곁에 있고 싶다'를 동시에 느낍니다."
          : "두뇌 회전이 빠르고 말 한마디가 날카롭게 꽂히는 타입. 이성은 '대화하고 싶다'는 본능을 느낍니다." });
    }
  }
  // 목화통명: 갑·을 일간이 ① 통근하여 뿌리가 있고(목이 완전히 무력하지 않음)
  // ② 천간에 병·정화가 투출하여 식상(또는 상관)으로 빛을 발하며
  // ③ 화기가 적절히 유기하되 과열(목분비회)되지 않고
  // ④ 수의 극제로 화가 꺼지거나, 금의 과다한 극제로 목이 먼저 꺾이지 않은 경우에만 성립한다.
  if (["갑","을"].includes(ilgan)) {
    const mokHasRoot = sc.목 >= 1.5 || pillars.some(p => ["갑","을"].includes(p.cg) && p !== pd.day) || pillars.some(p => ["인","묘"].includes(p.jj));
    const hwaTugan = pillars.some(p => p.cg === "병" || p.cg === "정");
    const hwaJeokjeol = sc.화 >= 1.5 && sc.화 < 4;
    const noSuGeukHwa = sc.수 < sc.화;
    const noGeumGeukMok = sc.금 <= sc.목 + 1;
    if (mokHasRoot && hwaTugan && hwaJeokjeol && noSuGeukHwa && noGeumGeukMok) {
      patterns.push({ name:"목화통명", hanja:"木火通明", color:"#fbbf24",
        desc:"목(木)이 화(火)를 품어 빛이 사방으로 통하는 사주. 뿌리가 단단한 목이 화를 적절히 길러내 지혜와 화려함이 동시에 발산됩니다.",
        charmDesc:"눈빛이 빛나고 말할 때 에너지가 강하게 뿜어나옵니다. 처음 만난 이성이 '이 사람 특별하다'를 직감합니다." });
    }
  }
  // 화토동궁: 병·정 일간 + 토 기운 강함
  if (["병","정"].includes(ilgan) && (dom.includes("토") || sc.토 >= 2)) {
    patterns.push({ name:"화토동궁", hanja:"火土同宮", color:"#fb923c",
      desc:"화(火)와 토(土)가 같은 궁에 함께하는 사주. 따뜻하고 든든한 보호자적 매력이 강합니다.",
      charmDesc:"곁에 있으면 마음이 편안해지는 타입. 이성이 '이 사람 옆에 있고 싶다'는 안도감을 느낍니다." });
  }
  // 수목청기: 임·계 일간 + 목 기운 강함
  if (["임","계"].includes(ilgan) && (dom.includes("목") || sc.목 >= 2)) {
    patterns.push({ name:"수목청기", hanja:"水木淸氣", color:"#4ade80",
      desc:"수(水)가 목(木)을 맑게 생해주는 사주. 지혜로움과 생기가 동시에 발산됩니다.",
      charmDesc:"신선하고 생동감 넘치는 에너지. 이성은 '저 사람 보면 기분이 좋아진다'고 느낍니다." });
  }
  // 토금상생: 무·기 일간 + 금 기운 강함
  if (["무","기"].includes(ilgan) && (dom.includes("금") || sc.금 >= 2)) {
    patterns.push({ name:"토금상생", hanja:"土金相生", color:"#e2e8f0",
      desc:"토(土)가 금(金)을 생해주는 사주. 안정적이면서도 날카로운 이중 매력이 발현됩니다.",
      charmDesc:"믿음직스럽고 세련된 분위기. '이 사람이라면 믿을 수 있겠다'는 신뢰 매력이 핵심입니다." });
  }
  // 금목교전: 경·신 일간 + 목 기운 강함 → 강렬한 갈등의 카리스마
  if (["경","신"].includes(ilgan) && (dom.includes("목") || sc.목 >= 2)) {
    patterns.push({ name:"금목교전", hanja:"金木交戰", color:"#f87171",
      desc:"금(金)과 목(木)이 상극하는 긴장감 넘치는 사주. 강렬하고 도발적인 카리스마가 흘러나옵니다.",
      charmDesc:"'무서운데 눈을 못 뗀다'는 반응을 자주 듣는 타입. 강한 자기 주관이 이성의 호기심을 폭발시킵니다." });
  }
  // 화련주옥: 병·정 일간 + 금 기운 강함 → 화가 금을 적절히 단련해 보석처럼 빛나게 하는 격
  if (["병","정"].includes(ilgan) && (dom.includes("금") || sc.금 >= 2)) {
    patterns.push({ name:"화련주옥", hanja:"火煉珠玉", color:"#fde68a",
      desc:"화(火)가 금(金)을 적절히 달구어 보석처럼 다듬어내는 사주. 뜨거운 열정이 날카로운 재능과 만나, 거칠던 원석이 세련된 빛을 내는 구조입니다.",
      charmDesc:"열정적인데 디테일까지 챙기는 타입. 이성은 '에너지도 넘치는데 일도 잘하고 멋도 안다'는 인상을 받습니다." });
  }
  // 수화기제: 임·계 일간 + 화 기운 강함 → 지혜+열정의 균형
  if (["임","계"].includes(ilgan) && (dom.includes("화") || sc.화 >= 2)) {
    patterns.push({ name:"수화기제", hanja:"水火旣濟", color:"#c084fc",
      desc:"수(水)와 화(火)가 이미 완성에 이른 균형. 냉철함과 열정이 공존하는 희귀한 매력 구조입니다.",
      charmDesc:"차가운 듯 따뜻한 반전 매력. 이성이 '도무지 파악이 안 된다'며 계속 신경 쓰게 됩니다." });
  }

  // 정(丁) 병존(竝存): 사주 천간에 정화가 2개 이상이고, 또 다른 천간이 2개 이상 짝을 이루어
  // 같은 글자끼리 서로 호응하는 구조 — 두 글자의 기운이 짙게 작용한다.
  const allCg = pillars.map(p => p.cg);
  const cgCount: Record<string, number> = {};
  allCg.forEach(c => { cgCount[c] = (cgCount[c] || 0) + 1; });
  if ((cgCount["정"] || 0) >= 2) {
    const JEONG_BYEONGJON: Record<string, { name: string; hanja: string; color: string; desc: string; charmDesc: string }> = {
      갑: { name:"정갑병존", hanja:"丁甲竝存", color:"#fde68a",
        desc:"큰 나무에 꽃이 핀 듯한 유신유화(有薪有華)의 상. 다만 비를 만나면 꽃이 떨어지듯 수(水)가 과하면 결실을 맺기 어려우니, 따뜻한 토양과 적절한 물의 균형이 관건입니다.",
        charmDesc:"존재감이 환하게 피어나는 타입. 다만 감정의 비가 너무 자주 오면 매력이 흐려질 수 있어, 평정심을 유지할수록 빛이 오래갑니다." },
      을: { name:"정을병존", hanja:"丁乙竝存", color:"#fef08a",
        desc:"화초에 꽃이 핀 화초개화(花草介花)의 상. 적당한 토양과 물이 갖추어지면 인덕과 부모복, 재물복까지 고루 따르는 안정적인 구조입니다.",
        charmDesc:"화사하고 다정한 분위기로 사람을 끌어모으는 타입. 주변의 보살핌과 지지를 잘 받을수록 매력이 더 풍성하게 피어납니다." },
      병: { name:"정병병존", hanja:"丁丙竝存", color:"#fbbf24",
        desc:"크고 작은 꽃들이 만발한 화화분분(花華奔奔)의 상. 인덕이 좋고 예술적 감각·표현력이 뛰어나지만, 수기가 지나치면 감정 기복이 커질 수 있습니다.",
        charmDesc:"존재 자체가 화려하게 빛나는 타입. 표현력이 풍부해 예술·창작 분야에서 매력이 폭발하지만, 감정의 파도를 다스리는 법을 익히면 더욱 안정적으로 빛납니다." },
      정: { name:"정정병존", hanja:"丁丁竝存", color:"#fca5a5",
        desc:"두 개의 불, 두 개의 별이 함께 빛나는 양화위염(兩火爲炎)의 상. 목(木)의 기운이 든든하게 받쳐주면 금상첨화로 인덕과 부모복이 커지는 구조입니다.",
        charmDesc:"은근하지만 꺼지지 않는 두 개의 불씨 같은 매력. 곁에서 함께 타오를 사람을 만나면 그 빛이 오래도록 유지됩니다." },
      무: { name:"정무병존", hanja:"丁戊竝存", color:"#fdba74",
        desc:"화로 속의 불 또는 넓은 들판의 불빛인 유화유로(有火有爐)의 상. 홀로면 다소 외롭지만, 다른 화 기운이 더해지면 넓은 들판의 화려한 꽃무리처럼 인덕과 실행력이 크게 살아납니다.",
        charmDesc:"혼자서도 묵묵히 자기 빛을 내는 타입. 함께할 동료나 인연이 더해질 때 그 매력과 영향력이 훨씬 크게 퍼져나갑니다." },
      기: { name:"정기병존", hanja:"丁己竝存", color:"#fde047",
        desc:"작은 정원에 핀 한 송이 꽃, 성타구진(星墮句陳)의 상. 그 자체로는 외로움이 있지만 화·토의 기운이 더 보태지면 의식주가 충분하고 재물복과 인덕까지 따르는 구조입니다.",
        charmDesc:"잔잔하지만 묘하게 신경 쓰이는 매력. 곁에 든든한 기반과 사람이 쌓일수록 외로움이 풍요로움으로 바뀌어 갑니다." },
      경: { name:"정경병존", hanja:"丁庚竝存", color:"#fcd34d",
        desc:"불로 제련하여 보석을 만드는 화련진금(火鍊眞金)의 상. 금 기운이 발달해 있으면 재물이 따르고, 화 기운이 1~2개 더 받쳐주면 최고로 가치 있는 사주가 됩니다.",
        charmDesc:"원석을 보석으로 다듬어내는 듣기 좋은 카리스마. 다듬어질수록 가치가 올라가는 타입이라, 자기 관리에 신경 쓸수록 매력이 배가됩니다." },
      신: { name:"정신병존", hanja:"丁辛竝存", color:"#f9a8d4",
        desc:"보석을 불로 세공하는 화련주옥(火鍊珠玉)의 상. 예쁜 꽃·달빛에 해당하는 정(丁)과 보석에 해당하는 신(辛)이 만나 미남미녀가 많은 구조로, 수 기운이 더해지면 인기·연예·예술·문학에서 큰 능력을 발휘합니다.",
        charmDesc:"세공된 보석처럼 정제된 비주얼·분위기 매력. 인기와 시선이 자연스럽게 따라붙는 타입으로, 끼를 발산할 무대가 있을수록 빛이 더 납니다." },
      임: { name:"정임병존", hanja:"丁壬竝存", color:"#93c5fd",
        desc:"달이 물을 비추는 호수화조(胡水火照)의 상. 사람들의 시선이 머무는 연예·예술·방송·문학 분야에 끼를 발휘하기 좋고, 병화나 정화가 1~2개 더 있으면 외로움도 보완됩니다.",
        charmDesc:"호수에 비친 달빛 같은 잔잔하고 신비로운 매력. 무대 위에서, 혹은 사람들 앞에서 자연스럽게 시선을 끄는 타입입니다." },
      계: { name:"정계병존", hanja:"丁癸竝存", color:"#a5b4fc",
        desc:"별빛이 구름에 가려진 성영투운(星影投雲)의 상. 예쁘지만 외로움이 있는 구조로, 화·수 기운이 더해지면 인덕·재물복·명예운이 따르고 목(木)이 있으면 부동산복까지 넘쳐납니다.",
        charmDesc:"살짝 가려진 별빛처럼 신비롭고 은은한 매력. 곁에 따뜻한 사람과 자원이 더해질수록 가려진 빛이 환하게 드러납니다." },
    };
    Object.entries(JEONG_BYEONGJON).forEach(([cg, info]) => {
      if (cg === "정" ? (cgCount["정"] || 0) >= 2 : (cgCount[cg] || 0) >= 2) {
        patterns.push({ name: info.name, hanja: info.hanja, color: info.color, desc: info.desc, charmDesc: info.charmDesc });
      }
    });
  }

  return patterns;
}

// ── 성생활(性) 경향 인사이트 ─────────────────────────────────────────────────
// 일간 신강/신약, 십성(재성·관성·인성) 분포, 오행 우세, 지지 그룹을 토대로
// 성적 경향을 보여주는 공용 데이터/함수. eros 등 관련 서비스에서 사용.
export interface SexlifeInsight { title: string; desc: string; color: string }

const SEXLIFE_OHAENG_INSIGHT: Record<Element, SexlifeInsight> = {
  목: { title: "목(木) 기운 우세 — 솔직 적극형", color: "#4ade80",
    desc: "감정과 욕구를 숨기지 않고 솔직하게 표현하는 타입. 좋아하면 적극적으로 다가가고, 관계에서도 가장 능동적이고 직진하는 스타일입니다." },
  화: { title: "화(火) 기운 우세 — 강렬한 첫인상형", color: "#f87171",
    desc: "처음 끌릴 때의 텐션이 누구보다 강렬합니다. 다만 불꽃처럼 빠르게 타올랐다가 빨리 식는 경향이 있어, 꾸준한 온도 유지가 관건입니다." },
  토: { title: "토(土) 기운 우세 — 신중·자기완결형", color: "#fbbf24",
    desc: "주도적으로 먼저 나서기보다는 받아들이는 쪽에 가깝습니다. 표현이 적극적이지 않아 혼자 마음을 정리하는 경우가 많으니, 편하게 표현할 수 있는 분위기가 중요합니다." },
  금: { title: "금(金) 기운 우세 — 분위기 의존형", color: "#cbd5e1",
    desc: "분위기와 타이밍에 많이 좌우되는 타입. 마음에 안 들면 단호하게 거리를 두지만, 분위기가 맞으면 한순간에 몰입도가 확 올라갑니다." },
  수: { title: "수(水) 기운 우세 — 적응력 최강형", color: "#60a5fa",
    desc: "상대와 상황에 맞춰 유연하게 변하는 적응력이 가장 뛰어난 타입. 한번 빠지면 깊이 몰입하는 만큼, 한 사람·한 관계에 과도하게 의존하지 않도록 균형이 필요합니다." },
};

const SEXLIFE_JIJI_GROUP_INSIGHT: { jjs: string[]; insight: SexlifeInsight }[] = [
  { jjs: ["인","신","사","해"], insight: {
    title: "역마(寅申巳亥) — 호기심 탐구형", color: "#a78bfa",
    desc: "새로운 경험과 자극에 호기심이 많은 편. 익숙함보다 변화와 다양함을 즐기는 타입입니다." } },
  { jjs: ["자","오","묘","유"], insight: {
    title: "도화(子午卯酉) — 취향 확고형", color: "#f9a8d4",
    desc: "자기만의 취향과 기준이 확실한 타입. 한번 좋아하는 패턴이 생기면 그 방향을 고집하는 경향이 있습니다." } },
  { jjs: ["진","술","축","미"], insight: {
    title: "화개(辰戌丑未) — 수용·몰입형", color: "#93c5fd",
    desc: "스스로 주도하기보다는 분위기에 자연스럽게 따라가며 몰입하는 편. 상대가 리드해줄 때 더 깊이 빠져드는 타입입니다." } },
];

export function getSexlifeInsights(result: SajuResult): SexlifeInsight[] {
  const insights: SexlifeInsight[] = [];
  const pd = result.pillarsDetail;
  const pillars = [pd.year, pd.month, pd.day, ...(pd.hour ? [pd.hour] : [])];

  // 십성 카운트
  const count = (names: string[]) =>
    pillars.reduce((acc, p) => acc + (names.includes(p.sipseongCg) ? 1 : 0) + (names.includes(p.sipseongJj) ? 1 : 0), 0);
  const jaeseong = count(["편재", "정재"]);
  const gwanseong = count(["편관", "정관"]);
  const inseong = count(["편인", "정인"]);
  const strength = result.yongshin.strength;

  if (strength === "신약" && jaeseong >= 2) {
    insights.push({ title: "재물 기운 과다·몸 약형 — 맞춤형", color: "#fbbf24",
      desc: "자기주장보다 상대의 반응과 컨디션을 먼저 살피는 타입. 상대를 만족시키는 데 집중하는 만큼, 본인 욕구 표현에도 신경 쓰는 게 좋습니다." });
  } else if (strength === "신약" && gwanseong >= 2) {
    insights.push({ title: "조직·책임 기운 강·몸 약형 — 맞춤형", color: "#f87171",
      desc: "상대의 기분과 분위기에 맞춰주려는 성향이 강합니다. 관계에서 끌려가는 느낌이 들지 않도록, 본인의 속도와 의사를 표현하는 연습이 도움이 됩니다." });
  } else if (strength === "신강") {
    insights.push({ title: "신강(身强) — 주도형", color: "#4ade80",
      desc: "관계에서 자연스럽게 주도권을 쥐는 타입. 자기 표현이 분명하고, 원하는 방향으로 분위기를 이끌어가는 데 익숙합니다." });
  } else if (strength === "신약") {
    insights.push({ title: "신약(身弱) — 수용형", color: "#60a5fa",
      desc: "주도하기보다 상대에게 맞춰주는 편안한 포지션을 선호하는 타입. 신뢰가 쌓일수록 마음을 더 여는 경향이 있습니다." });
  }

  if (inseong >= 2) {
    insights.push({ title: "학습·보호 기운 강 — 정서적 교감형", color: "#c4b5fd",
      desc: "육체적 끌림보다 정서적 교감과 신뢰가 우선인 타입. 마음이 통한다는 느낌이 들 때 비로소 마음을 열게 됩니다." });
  }

  const domEl = SEXLIFE_OHAENG_INSIGHT[result.dominant[0] as Element];
  if (domEl) insights.push(domEl);

  const jjList = pillars.map(p => p.jj);
  for (const g of SEXLIFE_JIJI_GROUP_INSIGHT) {
    if (jjList.filter(jj => g.jjs.includes(jj)).length >= 2) {
      insights.push(g.insight);
      break;
    }
  }

  return insights;
}

// ── 적성: 조후(調候) 기반 분야 추천 ─────────────────────────────────────
export interface JohuCareerInsight {
  climate: "한랭" | "온열" | "건조" | "습윤" | "균형";
  title: string;
  desc: string;
  fields: string;
}

// 일간 오행 + 월지 계절을 바탕으로 사주의 '기온/습도' 치우침을 진단하고
// 그 불균형을 보완하거나 활용하기에 좋은 업무 환경/분야를 제안한다.
export function getJohuCareerInsight(ilgan: string, monthJj: string): JohuCareerInsight {
  const ilEl = CHEONGAN_ELEMENT[ilgan];
  const season = getSeasonByMonth(monthJj);
  const coldElements: Element[] = ["수", "금"];
  const hotElements: Element[] = ["화", "목"];
  const isWinter: boolean = season === "겨울";
  const isSummer: boolean = season === "여름";

  // 한랭(寒冷): 겨울 출생이거나 일간이 차가운 오행(수·금)이면서 여름이 아닌 경우
  if (isWinter || (coldElements.includes(ilEl) && !isSummer)) {
    return {
      climate: "한랭",
      title: "조후상 한랭(寒冷)한 사주 — 온기를 더하는 환경이 잘 맞아요",
      desc: `${ilgan}일간이 ${season}에 태어나 사주 전체가 차갑고 정적인 기운으로 치우쳐 있어요. 이런 사주는 가만히 앉아서 혼자 깊게 파고드는 일은 잘 맞지만, 변화나 활기가 없는 곳에 너무 오래 있으면 의욕이 쉽게 가라앉아요. 따뜻한 에너지(화·목)를 채워주는 분야나, 사람들과 활발히 부딪히는 일을 의식적으로 선택하면 훨씬 활력 있게 일할 수 있어요.`,
      fields: "교육·상담·헬스케어·기획처럼 사람과 직접 소통하는 일, 또는 트렌디하고 역동적인 분야(마케팅·이벤트·콘텐츠)",
    };
  }
  // 온열(溫熱): 여름 출생이거나 일간이 화/목이면서 여름인 경우
  if (isSummer || (hotElements.includes(ilEl) && !isWinter)) {
    return {
      climate: "온열",
      title: "조후상 온열(溫熱)한 사주 — 식혀주는 환경이 잘 맞아요",
      desc: `${ilgan}일간이 ${season}에 태어나 사주 전체가 뜨겁고 급한 기운으로 가득해요. 에너지와 추진력은 넘치지만, 그만큼 쉽게 소진되거나 성급한 판단으로 일을 그르치기 쉬워요. 차분하고 체계적인 흐름(수·금 기운)을 가진 환경, 즉 데이터·분석·시스템이 갖춰진 곳에서 일하면 본인의 열정이 폭주하지 않고 좋은 결과로 이어져요.`,
      fields: "금융·데이터분석·연구·IT처럼 체계와 논리가 중심인 분야, 혹은 의료·법률처럼 냉정한 판단력이 필요한 전문직",
    };
  }
  // 건조: 토 일간이면서 여름/가을
  if (ilEl === "토" && (isSummer || season === "가을")) {
    return {
      climate: "건조",
      title: "조후상 건조(乾燥)한 사주 — 수분(유연함)을 더하는 환경이 잘 맞아요",
      desc: `${ilgan}일간이 ${season}에 태어나 단단하고 건조한 기운이 강해요. 원칙과 기준이 뚜렷한 건 장점이지만, 너무 뻣뻣하면 변화하는 상황에 대응이 늦어질 수 있어요. 유연하고 흐름이 있는 분야(수 기운 - 무역·서비스·콘텐츠 유통)에서 일하면 본래의 단단함이 더 큰 신뢰로 이어져요.`,
      fields: "부동산·건설·행정처럼 토대를 다지는 일에 유연성을 더한 분야, 또는 유통·물류·서비스업",
    };
  }
  // 습윤: 수 일간이면서 봄/여름이 아닌 경우 등 - fallback
  if (ilEl === "수" && !isSummer) {
    return {
      climate: "습윤",
      title: "조후상 습한(濕) 기운이 도는 사주 — 따뜻하게 데워주는 환경이 잘 맞아요",
      desc: `${ilgan}일간이 ${season}에 태어나 사주에 물기운이 정체되기 쉬운 구조예요. 생각이 깊고 신중한 건 강점이지만, 고여있으면 우울감이나 결정 지연으로 이어질 수 있어요. 활기차고 따뜻한 분위기(화 기운)의 조직, 또는 적극적으로 표현해야 하는 직무를 선택하면 정체된 기운이 잘 순환돼요.`,
      fields: "영업·교육·엔터테인먼트처럼 사람을 직접 만나고 표현하는 일, 또는 활동량이 많은 야외·현장직",
    };
  }

  return {
    climate: "균형",
    title: "조후상 비교적 균형 잡힌 사주 — 환경을 크게 가리지 않아요",
    desc: `${ilgan}일간이 ${season}에 태어나 사주의 한온조습이 비교적 균형을 이루고 있어요. 특정 환경에 크게 구애받지 않고 적응력이 좋은 편이라, 오히려 본인의 표현·생산, 재물, 조직·책임, 학습·보호 기운이 보여주는 방향성에 맞춰 분야를 고르는 게 더 중요해요.`,
    fields: "환경적 제약보다 본인의 강점 기운(표현·생산/재물/조직·책임/학습·보호)에 맞는 분야 선택이 핵심",
  };
}

// ── 적성: 궁성(宮星)별 십성 배치 요약 ───────────────────────────────────
export interface GungseongCareerItem {
  position: "연주" | "월주" | "일지" | "시주";
  palaceLabel: string;
  sipseong: string;
  desc: string;
}

// 십성 화면 표시용 평이한 한국어 표현 (getGungseongCareerSummary 등에서 사용)
const SIPSEONG_PLAIN_LABEL: Record<string, string> = {
  비견: "독립·자존 기운", 겁재: "경쟁·승부 기운",
  식신: "표현·여유 기운", 상관: "창의·반전 기운",
  편재: "유동적인 재물 기운", 정재: "안정적인 재물 기운",
  편관: "강한 통제 기운", 정관: "원칙·책임 기운",
  편인: "독특한 학습 기운", 정인: "포용·교육 기운",
};

// 각 기둥(궁)에 자리한 십성을 바탕으로, 그 궁이 의미하는 인생 영역(사회적 뿌리/직업·사회생활/배우자/자녀·노후)에서
// 어떤 진로 신호가 드러나는지 정리한다. 월주와 일지는 진로(직업/사회생활)에 가장 직결되므로 우선 노출한다.
export function getGungseongCareerSummary(pd: SajuResult["pillarsDetail"]): GungseongCareerItem[] {
  const items: GungseongCareerItem[] = [];
  const PALACE_LABEL: Record<"연주"|"월주"|"일지"|"시주", string> = {
    연주: "조상·사회적 뿌리 자리", 월주: "직업·사회생활 자리",
    일지: "본인·배우자 자리", 시주: "자녀·노후 자리",
  };

  const entries: Array<{ position: "연주"|"월주"|"일지"|"시주"; sipseong: string | undefined }> = [
    { position: "연주", sipseong: pd.year?.sipseongCg },
    { position: "월주", sipseong: pd.month?.sipseongCg },
    { position: "일지", sipseong: pd.day?.sipseongJj },
    { position: "시주", sipseong: pd.hour?.sipseongCg },
  ];

  for (const { position, sipseong } of entries) {
    if (!sipseong) continue;
    const desc = getSipsungPositionDesc(position, sipseong);
    if (!desc) continue;
    items.push({ position, palaceLabel: PALACE_LABEL[position], sipseong: SIPSEONG_PLAIN_LABEL[sipseong] ?? sipseong, desc });
  }

  return items;
}

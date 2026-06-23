import type { ZiweiPalace } from "./ziwei";

// zimidousu.ts — 자미두수(紫微斗數) 라이트 버전 데이터베이스
// 12궁(宮)과 14주성(主星)의 기본 데이터 + 명궁(命宮) 산출 로직
// 정통 자미두수의 전체 별자리 배치는 오행국·기성결 등 복잡한 절차를 거치지만,
// 이 라이트 버전은 명궁(命宮) 산출 + 명궁 오행에 대응하는 대표 주성을 통해
// 핵심 성향을 짚어주는 보조 콘텐츠로 구성했어요.

export interface ZimiPalace {
  name: string;
  hanja: string;
  desc: string;
}

// 12지지의 한자 표기 — 명궁/신궁/12궁 표시에 공통으로 사용
export const JIJI_HANJA: Record<string, string> = {
  자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳",
  오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥",
};

export const PALACES: ZimiPalace[] = [
  { name: "명궁", hanja: "命宮", desc: "타고난 본질, 인생 전체를 관통하는 캐릭터의 핵심. 다른 11개 궁의 출발점이 되는 가장 중요한 자리예요." },
  { name: "형제궁", hanja: "兄弟宮", desc: "형제자매·동료와의 관계, 그리고 가까운 사람들과 협력하는 방식을 보여줘요." },
  { name: "부처궁", hanja: "夫妻宮", desc: "배우자·연인과의 관계 패턴, 그리고 결혼 생활에서의 궁합과 갈등 포인트를 보여줘요." },
  { name: "자녀궁", hanja: "子女宮", desc: "자녀와의 인연, 그리고 창의성·기획력 같은 '내가 만들어내는 것'에 대한 운을 함께 봐요." },
  { name: "재백궁", hanja: "財帛宮", desc: "돈을 버는 방식과 재물을 대하는 태도, 현금 흐름의 안정성을 보여줘요." },
  { name: "질액궁", hanja: "疾厄宮", desc: "건강·체력의 기본 컨디션, 그리고 스트레스를 받을 때 약해지는 부위를 암시해요." },
  { name: "천이궁", hanja: "遷移宮", desc: "이동·이주·해외운, 그리고 익숙한 환경을 벗어났을 때 드러나는 또 다른 모습을 보여줘요." },
  { name: "노복궁", hanja: "奴僕宮", desc: "주변 사람·아랫사람·팀원과의 관계, 그리고 내가 누군가를 이끄는 방식을 보여줘요." },
  { name: "관록궁", hanja: "官祿宮", desc: "직업·사회적 위치, 일에서의 성취 방식을 보여줘요. 명궁 다음으로 많이 보는 자리예요." },
  { name: "전택궁", hanja: "田宅宮", desc: "집·부동산·가정 환경, 그리고 내가 안정감을 느끼는 공간의 형태를 보여줘요." },
  { name: "복덕궁", hanja: "福德宮", desc: "정신적 만족감, 취향과 여가를 즐기는 방식, 타고난 복(福)의 그릇을 보여줘요." },
  { name: "부모궁", hanja: "父母宮", desc: "부모와의 관계, 그리고 윗사람·권위자와 어떻게 지내는지를 보여줘요." },
];

export interface ZimiStar {
  name: string;
  hanja: string;
  element: "목" | "화" | "토" | "금" | "수";
  keyword: string;
  desc: string;
  career: string;
  love: string;
}

export const MAIN_STARS: Record<string, ZimiStar> = {
  자미: {
    name: "자미", hanja: "紫微", element: "토",
    keyword: "제왕·리더십·품격",
    desc: "14주성 중 최고의 별로 불리는 제왕성(帝王星)이에요. 자연스럽게 무리의 중심이 되고, 책임지는 자리를 맡았을 때 오히려 안정감을 느끼는 타입이에요. 다만 자존심이 강해서 한 번 자존심이 상하면 관계를 정리해버리는 경향도 있어요.",
    career: "조직의 리더, 대표, 기획·총괄 포지션에서 빛나요. 남이 만든 틀 안에서 일하는 것보다 스스로 방향을 정하는 역할이 잘 맞아요.",
    love: "상대에게도 존중받기를 원해요. 자존심을 세워주는 사람과는 오래가지만, 무시당한다고 느끼면 미련 없이 떠나는 편이에요.",
  },
  천기: {
    name: "천기", hanja: "天機", element: "목",
    keyword: "지혜·기획·임기응변",
    desc: "머리 회전이 빠르고 상황 판단이 뛰어난 지혜의 별이에요. 새로운 정보와 변화에 민감하게 반응하고, 한 가지 일을 오래 붙들기보다 여러 가능성을 동시에 굴려보는 스타일이에요.",
    career: "기획·전략·컨설팅·분석 업무에서 강점이 드러나요. 다만 생각이 너무 많아 결정이 늦어질 수 있으니, 마감 기한을 스스로 정해두는 게 좋아요.",
    love: "대화가 잘 통하는 상대에게 끌려요. 머리 싸움처럼 느껴지는 밀당을 즐기지만, 정서적 안정감을 주는 상대를 만나면 훨씬 편안해져요.",
  },
  태양: {
    name: "태양", hanja: "太陽", element: "화",
    keyword: "명예·관대함·존재감",
    desc: "어디서든 존재감이 드러나는 밝은 에너지의 별이에요. 베푸는 걸 좋아하고 주변을 챙기는 역할을 자연스럽게 맡게 되지만, 정작 본인의 속마음은 잘 드러내지 않는 경우가 많아요.",
    career: "사람을 상대하는 일, 대외 업무, 공공성이 강한 분야에서 인정받기 쉬워요. 이름이 드러나는 자리일수록 동기부여가 커져요.",
    love: "헌신적으로 챙기는 스타일이지만, 본인의 감정 표현에는 서툴러서 상대가 오해할 수 있어요. 가끔은 받는 연습도 필요해요.",
  },
  무곡: {
    name: "무곡", hanja: "武曲", element: "금",
    keyword: "재물·결단력·실행력",
    desc: "재물성(財星)으로 불리는 강한 실행력의 별이에요. 한 번 목표를 정하면 묵묵히 밀고 나가는 추진력이 있고, 돈 관리에도 현실적이고 계획적인 면모를 보여요.",
    career: "금융·재무·제조·기술직처럼 결과가 숫자로 명확히 드러나는 분야에서 강점을 보여요. 본인 명의의 사업에서도 안정적으로 자리를 잡는 편이에요.",
    love: "표현이 무뚝뚝해 보이지만 행동으로 책임지는 스타일이에요. 말보다 행동에서 진심을 봐주는 상대와 잘 맞아요.",
  },
  천동: {
    name: "천동", hanja: "天同", element: "금",
    keyword: "온화함·평화주의·복덕",
    desc: "다툼을 싫어하고 평화로운 분위기를 만드는 복덕(福德)의 별이에요. 큰 욕심을 부리지 않고 주어진 환경에서 만족을 찾는 편안한 기운을 가졌어요.",
    career: "팀워크가 중요한 환경, 서비스·복지·상담 분야에서 신뢰를 얻어요. 경쟁이 과도한 환경보다 안정적인 조직에서 오래 능력을 발휘해요.",
    love: "갈등을 피하려다 속마음을 누르는 경우가 많아요. 편안한 관계일수록 오히려 솔직한 대화 연습이 필요해요.",
  },
  염정: {
    name: "염정", hanja: "廉貞", element: "화",
    keyword: "열정·승부욕·카리스마",
    desc: "강렬한 에너지와 승부욕을 가진 별이에요. 평소엔 매력적이고 화려하지만, 욕망과 감정의 기복이 커서 극단적인 선택을 할 때도 있어요.",
    career: "경쟁이 치열한 영업·미디어·예체능 분야에서 두드러져요. 압박감 속에서 오히려 집중력이 올라가는 타입이에요.",
    love: "끌림이 강렬하고 한 번 빠지면 깊게 몰입해요. 다만 감정이 격해질 때 극단적인 말이 나올 수 있으니, 화났을 때는 잠시 거리를 두는 게 관계를 지키는 방법이에요.",
  },
  천부: {
    name: "천부", hanja: "天府", element: "토",
    keyword: "안정·포용력·재물 관리",
    desc: "넉넉하고 포용력 있는 재물의 창고와 같은 별이에요. 위기 상황에서도 크게 흔들리지 않고, 차분하게 자원을 관리하는 능력이 뛰어나요.",
    career: "관리·운영·자산관리처럼 '지키고 관리하는' 역할에서 신뢰를 얻어요. 새로운 걸 만들기보다 기존의 것을 단단하게 키우는 데 강해요.",
    love: "안정감을 주는 든든한 파트너예요. 다만 변화를 싫어해서 관계가 늘어져도 정리하지 못하고 끌고 가는 경우가 있어요.",
  },
  태음: {
    name: "태음", hanja: "太陰", element: "수",
    keyword: "감성·섬세함·내적 풍요",
    desc: "은은하고 섬세한 감성의 별이에요. 겉으로 드러내기보다 마음속에 차곡차곡 쌓아두는 타입이라, 가까운 사람만 그 깊이를 알아채는 경우가 많아요.",
    career: "예술·디자인·심리·돌봄처럼 섬세한 감각이 필요한 분야에서 강점을 보여요. 혼자 집중하는 시간이 보장될 때 결과물의 질이 올라가요.",
    love: "조용히 마음을 표현하는 스타일이라 상대가 둔감하면 서운함이 쌓이기 쉬워요. 감정을 말로 표현하는 연습이 관계에 큰 도움이 돼요.",
  },
  탐랑: {
    name: "탐랑", hanja: "貪狼", element: "목",
    keyword: "욕망·다재다능·매력",
    desc: "다재다능하고 욕망이 큰 별이에요. 호기심이 많아 여러 분야에 손을 대고, 사람을 끄는 매력도 타고났지만 한 가지에 집중하는 끈기는 약할 수 있어요.",
    career: "다양한 경험이 자산이 되는 분야 — 예술·기획·영업·창업에서 빛을 발해요. 여러 부업을 동시에 운영하는 것도 잘 맞는 편이에요.",
    love: "매력이 넘쳐서 인기가 많지만, 그만큼 선택지도 많아 갈팡질팡할 수 있어요. 한 사람에게 집중하는 의식적인 노력이 관계를 오래가게 해요.",
  },
  거문: {
    name: "거문", hanja: "巨門", element: "수",
    keyword: "언변·분석력·구설",
    desc: "말과 논리의 별이에요. 분석력과 언변이 뛰어나 설득력이 있지만, 직설적인 표현 때문에 의도치 않게 구설에 오르기 쉬워요.",
    career: "강의·상담·법률·언론처럼 말과 논리로 사람을 움직이는 분야에서 강점을 보여요. 같은 말이라도 표현 방식을 다듬는 연습이 평판에 큰 영향을 줘요.",
    love: "솔직한 화법이 매력이지만, 직설적인 말이 상대에게 상처가 될 수 있어요. '맞는 말'보다 '듣기 좋은 타이밍'을 고려하면 관계가 훨씬 부드러워져요.",
  },
  천상: {
    name: "천상", hanja: "天相", element: "수",
    keyword: "보조·신뢰·균형감",
    desc: "균형감각이 뛰어나고 중재 역할을 잘하는 별이에요. 스스로 앞에 나서기보다 누군가를 보좌하거나 여러 사람 사이를 조율할 때 능력이 빛나요.",
    career: "비서·운영·HR·중재 역할에서 신뢰를 얻어요. 책임은 무겁지만 드러나지 않는 자리에서도 묵묵히 제 몫을 해내는 타입이에요.",
    love: "상대를 배려하는 마음이 커서 자기 욕구를 뒤로 미루는 경우가 많아요. 가끔은 본인이 원하는 것을 먼저 말하는 연습이 필요해요.",
  },
  천량: {
    name: "천량", hanja: "天梁", element: "토",
    keyword: "신중함·보호자 기질·원칙",
    desc: "어른스럽고 신중한 보호자형 별이에요. 위기 상황에서 침착하게 해결책을 찾고, 주변 사람을 챙기는 책임감이 강해요.",
    career: "의료·법률·교육·상담처럼 신뢰와 원칙이 중요한 분야에서 인정받아요. 다만 너무 신중해서 기회를 놓치는 경우가 있으니, 적절한 타이밍에 결단하는 연습이 필요해요.",
    love: "신뢰를 바탕으로 천천히 깊어지는 연애를 선호해요. 즉흥적인 관계보다 오래 두고 지켜본 사람에게 마음을 여는 편이에요.",
  },
  칠살: {
    name: "칠살", hanja: "七殺", element: "금",
    keyword: "추진력·독립성·결단",
    desc: "강한 추진력과 독립심을 가진 장군의 별이에요. 위기와 변화를 두려워하지 않고 정면으로 돌파하는 힘이 있지만, 평소엔 그 에너지를 발산할 곳이 없어 답답함을 느낄 수 있어요.",
    career: "변화가 크고 도전적인 환경 — 창업, 신사업, 군·경·특수직처럼 결단력이 요구되는 분야에서 진가를 발휘해요. 안정적이지만 변화 없는 환경에서는 오히려 무기력해질 수 있어요.",
    love: "직진형 연애 스타일이에요. 마음을 정하면 빠르게 행동하지만, 그만큼 관계에서 주도권을 쥐려는 경향이 있어 상대와의 균형이 중요해요.",
  },
  파군: {
    name: "파군", hanja: "破軍", element: "수",
    keyword: "변화·개척·파격",
    desc: "기존의 틀을 깨고 새로 시작하는 변화의 별이에요. 익숙한 것에 안주하지 못하고, 큰 변화를 겪으며 인생의 전환점을 여러 번 만들어가는 타입이에요.",
    career: "창업·개척·구조조정·신사업처럼 '판을 새로 짜는' 역할에서 강점을 보여요. 다만 변화가 잦은 만큼 안정적인 자산 관리 체계를 따로 마련해두는 게 좋아요.",
    love: "관계의 시작과 끝이 분명한 편이에요. 권태로운 관계를 못 견뎌서 스스로 변화를 만들기도 하니, 안정기에도 새로운 자극을 함께 만드는 노력이 필요해요.",
  },
};

const JIJI = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];

// 시각(0~23시)을 12지지 인덱스로 변환 (23시~01시 = 자시)
export function hourToJijiIndex(hour: number | null): number {
  if (hour === null) return 0;
  const h = (hour + 1) % 24;
  return Math.floor(h / 2);
}

// 명궁(命宮) 산출 — 寅(인,index2)에서 시작해 음력 월수만큼 순행, 시지만큼 역행
export function getMyeonggungIndex(lunarMonth: number, hourJijiIndex: number): number {
  const base = 2; // 寅
  let idx = (base + (lunarMonth - 1) - hourJijiIndex) % 12;
  if (idx < 0) idx += 12;
  return idx;
}

export function getMyeonggungJiji(lunarMonth: number, hour: number | null): string {
  const hIdx = hourToJijiIndex(hour);
  return JIJI[getMyeonggungIndex(lunarMonth, hIdx)];
}

// 신궁(身宮) 산출 — 寅에서 시작해 음력 월수, 시지 모두 순행으로 더함
export function getSingungIndex(lunarMonth: number, hourJijiIndex: number): number {
  const base = 2; // 寅
  return (base + (lunarMonth - 1) + hourJijiIndex) % 12;
}

export function getSingungJiji(lunarMonth: number, hour: number | null): string {
  const hIdx = hourToJijiIndex(hour);
  return JIJI[getSingungIndex(lunarMonth, hIdx)];
}
// 명궁을 기준으로 12궁이 순행 배치된다고 보고, 각 궁의 지지를 반환
export function getPalaceJiji(myeonggungIndex: number): string[] {
  return Array.from({ length: 12 }, (_, i) => JIJI[(myeonggungIndex + i) % 12]);
}

export interface ZimiTmi {
  id: string;
  text: string;
  match: (palaces: ZiweiPalace[]) => boolean;
}

function palaceOf(palaces: ZiweiPalace[], name: string): ZiweiPalace | undefined {
  return palaces.find(p => p.palaceName === name);
}

// 자미두수에서 자주 화제가 되는 "한 줄 TMI" — 명식에 실제로 등장하는 주성·궁 조합만 매칭한다.
// (좌보·우필·경양·타라·천형·천요 등 보좌성/살성과 묘왕지평함 등급은 라이트 버전 엔진 범위 밖이라 제외했어요.)
export const ZIMI_TMI: ZimiTmi[] = [
  {
    id: "myeonggung-ziwei-only",
    text: "명궁에 자미 하나만 단독으로 자리하고 있어요. 고집이 꽤 강하고 남의 말을 잘 듣지 않는 타입이에요. 사람을 가려서 사귀고 호불호가 분명한 편이에요.",
    match: palaces => { const p = palaceOf(palaces, "명궁"); return !!p && p.stars.length === 1 && p.stars[0] === "자미"; },
  },
  {
    id: "myeonggung-chilsal-only",
    text: "명궁에 칠살 하나만 단독으로 자리하고 있어요. 사무직처럼 정해진 틀보다 예체능·의료·경찰·사업처럼 스스로 판을 짜는 일이 잘 맞아요. 본인이 본 사주 풀이가 마음에 들지 않으면 그 풀이 자체를 잘 믿지 않으려는 면도 있어요.",
    match: palaces => { const p = palaceOf(palaces, "명궁"); return !!p && p.stars.length === 1 && p.stars[0] === "칠살"; },
  },
  {
    id: "myeonggung-empty",
    text: "명궁에 자리한 주성이 없는 '공궁(空宮)'이에요. 고집은 센데 그 고집을 뒷받침할 근거가 약해서, 사람을 너무 쉽게 믿었다가 곤란을 겪을 수 있어요. 중요한 결정 앞에서는 한 번 더 검증하는 습관을 들이면 좋아요.",
    match: palaces => { const p = palaceOf(palaces, "명궁"); return !!p && p.stars.length === 0; },
  },
  {
    id: "myeonggung-cheongi",
    text: "명궁에 천기가 자리하고 있어요. 늘 누군가를 보좌하는 2인자 자리에서 능력이 빛나지만, 마음 한편에는 스스로 중심이 되고 싶은 욕구도 함께 있어요. 그 욕구를 인정하고 조절하는 게 관계를 오래 지키는 비결이에요.",
    match: palaces => { const p = palaceOf(palaces, "명궁"); return !!p && p.stars.includes("천기"); },
  },
  {
    id: "janyeo-yeomjeong-ziwei",
    text: "자녀궁에 염정·자미의 기운이 자리하고 있어요. 자녀가 보통보다 성격이 강하고 주관이 뚜렷한 편이라, 어릴 때부터 본인의 의견을 존중해주는 양육이 잘 맞아요.",
    match: palaces => { const p = palaceOf(palaces, "자녀"); return !!p && (p.stars.includes("염정") || p.stars.includes("자미")); },
  },
  {
    id: "gwallok-geomun",
    text: "관록궁에 거문이 자리하고 있어요. 말로 풀어내는 직업과 잘 맞아요 — 강의·법률·서비스·상담·콜센터처럼 언변이 무기가 되는 일에서 강점을 발휘해요.",
    match: palaces => { const p = palaceOf(palaces, "관록"); return !!p && p.stars.includes("거문"); },
  },
  {
    id: "bucheo-cheonryang",
    text: "부처궁에 천량이 자리하고 있어요. 배우자가 나보다 나이가 많거나, 다정함이 깊어져 때로는 집착처럼 느껴질 수 있어요. 신뢰가 쌓이고 나면 누구보다 오래, 단단하게 곁을 지키는 사람이에요.",
    match: palaces => { const p = palaceOf(palaces, "부처"); return !!p && p.stars.includes("천량"); },
  },
  {
    id: "jilaek-ziwei",
    text: "질액궁에 자미가 자리하고 있어요. 체질적으로 살이 잘 붙는 편이라 한 번 찐 살을 빼는 데 시간이 좀 걸려요. 꾸준한 루틴을 만들어두는 게 평소 컨디션 관리에 큰 도움이 돼요.",
    match: palaces => { const p = palaceOf(palaces, "질액"); return !!p && p.stars.includes("자미"); },
  },
];

export function matchZimiTmi(palaces: ZiweiPalace[]): ZimiTmi[] {
  return ZIMI_TMI.filter(t => t.match(palaces));
}

// 부처궁(배우자운) 심층 분석 — 주성·보좌성·살성·잡성의 조합을 풀어서 하나의 흐르는 글로 엮어낸다.
export function getBucheoNarrative(palaces: ZiweiPalace[]): string {
  const bu = palaces.find(p => p.palaceName === "부처");
  const myeong = palaces.find(p => p.palaceName === "명궁");
  if (!bu) return "";

  const parts: string[] = [];
  const stars = bu.stars;
  const hasTanRyeomPa = stars.some(s => ["탐랑", "염정", "파군"].includes(s));
  const hasCheonryo = bu.minorStars.includes("천요");
  const hasJigongJigeop = bu.maleficStars.includes("지공") && bu.maleficStars.includes("지겁");
  const hasGwasukGojin = bu.minorStars.includes("과숙") || bu.minorStars.includes("고진");
  const hasGyeongyangTara = bu.maleficStars.includes("경양") || bu.maleficStars.includes("타라");
  const hasGilseong = bu.luckyStars.length > 0;
  const myeongHasTaeeum = !!myeong?.stars.includes("태음");

  if (hasTanRyeomPa) {
    parts.push("초반에는 미쳐 날뛰듯 좋아하며 빠르게 빠져들지만, 그 강렬함이 오래가지 못하고 어느 순간 공허해지는 흐름이 자리해 있어요.");
  }

  if (hasCheonryo) {
    let t = "연애결혼으로 성공할 확률이 꽤 높은 자리예요. 평소엔 천요가 매력·호감으로 작용해 인연을 끌어오지만, 주변에서 살성이 함께 들어오는 시기에는 이 기운이 바람·외도·배신, 혹은 치명적인 성격 차이로 돌변할 수 있어요.";
    if (hasJigongJigeop) {
      t += " 여기에 지공·지겁이 함께 자리해 재물 파탄이나 허탈감과 맞물리면 '정신적으로 같이 못 살겠다', '돈 문제나 신뢰가 바닥났다'는 생각이 들면서 다 내려놓고 무(無)의 상태로 돌아가고 싶은 심리가 강해질 수 있어요.";
    }
    parts.push(t);
  } else if (hasJigongJigeop) {
    parts.push("지공·지겁이 함께 자리해, 결혼 생활 속에서 갑작스러운 재물 파탄이나 허탈감을 겪을 때 모든 걸 내려놓고 무(無)로 돌아가고 싶은 심리가 크게 일어날 수 있어요.");
  }

  if (hasGwasukGojin) {
    parts.push("그동안 꾸역꾸역 참아온 고독감이 쌓여있는 자리이기도 해요. 다만 이건 단순한 이혼수보다는 '고독'에 가까운 결과라서, 따로 각방을 쓰는 식으로 거리를 두면 결혼 생활 자체는 유지할 수 있는 경우가 많아요.");
  }

  if (hasGyeongyangTara && !hasCheonryo) {
    parts.push("경양·타라 같은 살성이 함께 있어, 배우자와의 사이에서 잔잔한 마찰이나 신경전이 잦을 수 있는 자리예요.");
  }

  if (hasGilseong && !hasGwasukGojin) {
    parts.push(`${bu.luckyStars.join("·")} 같은 길성이 함께해, 배우자 덕을 보거나 결혼 생활이 비교적 안정적으로 흘러갈 가능성을 높여주고 있어요.`);
  }

  if (myeongHasTaeeum) {
    parts.push("다만 원국 명궁에 태음이 있어서, 평소엔 감정을 안으로 누르며 어떻게든 버텨내는 힘이 있는 사람이에요. 그래서 위와 같은 흐름이 와도 겉으로는 꾸역꾸역 잘 지내는 것처럼 보일 수 있어요.");
  }

  if (parts.length === 0) {
    parts.push(`부처궁에 ${stars.length > 0 ? stars.join("·") + "이 자리해" : "특별한 살성·잡성 충돌 없이"} 비교적 무난하게 흘러가는 자리예요. 배우자와의 관계에서 극단적인 굴곡보다는 평이한 흐름이 이어질 가능성이 높아요.`);
  }

  return parts.join(" ");
}

// 명궁 지지의 오행에 대응하는 대표 주성 목록
export const ELEMENT_TO_STARS: Record<"목" | "화" | "토" | "금" | "수", string[]> = {
  목: ["천기", "탐랑"],
  화: ["태양", "염정"],
  토: ["자미", "천부", "천량"],
  금: ["무곡", "천동", "칠살"],
  수: ["태음", "거문", "천상", "파군"],
};

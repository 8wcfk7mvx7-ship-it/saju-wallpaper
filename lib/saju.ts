// lib/saju.ts
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

export interface YongsinResult {
  strength: "신강" | "신약" | "중화";
  yongshin: Element;   // 용신 — 사주 균형의 핵심 오행
  heeshin: Element;    // 희신 — 용신을 생해주는 오행
  gishin: Element;     // 기신 — 용신을 극하는 오행
  desc: string;
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
  역마살:   {hanja:"驛馬殺", category:"neutral",  desc:"이동·변화·해외 인연이 강합니다. 한곳에 정착하기 어렵습니다"},
  도화살:   {hanja:"桃花殺", category:"neutral",  desc:"이성에게 매력적이며 인기가 많습니다. 풍류 기질이 있습니다"},
  장성살:   {hanja:"將星殺", category:"lucky",    desc:"강한 통솔력과 지도자 기질을 타고났습니다"},
  화개살:   {hanja:"華蓋殺", category:"neutral",  desc:"고독함이 있으나 예술·종교·철학에 뛰어난 재능이 있습니다"},
  반안살:   {hanja:"攀鞍殺", category:"lucky",    desc:"지위 상승과 재물이 모이는 기운입니다"},
  겁살:     {hanja:"劫殺",   category:"unlucky",  desc:"빼앗기거나 예기치 못한 손실이 생길 수 있습니다"},
  재살:     {hanja:"災殺",   category:"unlucky",  desc:"사고·재난을 조심해야 합니다"},
  천살:     {hanja:"天殺",   category:"unlucky",  desc:"하늘의 살기. 관재·구설·어른과의 갈등이 생기기 쉽습니다"},
  지살:     {hanja:"地殺",   category:"neutral",  desc:"이동·출장이 잦고 활동 범위가 넓습니다"},
  년살:     {hanja:"年殺",   category:"unlucky",  desc:"함지살이라고도 함. 주색·풍류로 재물이 새기 쉽습니다"},
  월살:     {hanja:"月殺",   category:"unlucky",  desc:"고초살이라고도 함. 고독하고 인덕이 부족해지기 쉽습니다"},
  망신살:   {hanja:"亡身殺", category:"unlucky",  desc:"명예 손상이나 구설수에 오르기 쉽습니다"},
  육해살:   {hanja:"六害殺", category:"unlucky",  desc:"방해·장애가 많고 주변과 마찰이 생기기 쉽습니다"},
  // 귀인(吉神)
  천을귀인: {hanja:"天乙貴人",category:"lucky",   desc:"위기 때마다 귀인이 나타나 도움을 줍니다. 최고의 길신입니다"},
  천덕귀인: {hanja:"天德貴人",category:"lucky",   desc:"하늘의 덕으로 재액이 소멸되고 귀인의 도움이 따릅니다"},
  월덕귀인: {hanja:"月德貴人",category:"lucky",   desc:"달의 덕으로 귀인이 돕고 재물운이 따릅니다"},
  천주귀인: {hanja:"天廚貴人",category:"lucky",   desc:"식복(食福)이 풍부하고 의식주가 넉넉합니다"},
  문곡귀인: {hanja:"文曲貴人",category:"lucky",   desc:"학문·문서·예술 분야에서 탁월한 재능이 있습니다"},
  금여성:   {hanja:"金輿星", category:"lucky",    desc:"안락하고 귀인의 보살핌을 받습니다. 여성에게 특히 길합니다"},
  암록:     {hanja:"暗祿",   category:"lucky",    desc:"숨겨진 복록. 뜻밖의 도움이나 재물이 생깁니다"},
  // 중성
  진도화:   {hanja:"眞桃花", category:"neutral",  desc:"일지 기준 진짜 도화. 이성 매력과 인기가 매우 강합니다"},
  귀문관살: {hanja:"鬼門關殺",category:"neutral", desc:"영적 감수성이 예민하고 신경이 날카롭습니다. 예술·철학에 소질이 있습니다"},
  // 흉신(凶神)
  홍염살:   {hanja:"紅艶殺", category:"unlucky",  desc:"이성 관계가 복잡해지기 쉽고 색정 구설이 있습니다"},
  양인살:   {hanja:"羊刃殺", category:"unlucky",  desc:"강한 추진력이 있으나 충동적이고 사고·부상을 주의해야 합니다"},
  백호살:   {hanja:"白虎殺", category:"unlucky",  desc:"혈광지재(血光之災). 수술·사고·혈액 관련 질환을 주의하세요"},
  원진살:   {hanja:"怨嗔殺", category:"unlucky",  desc:"배우자·가까운 사람과 원망·갈등이 반복되기 쉽습니다"},
  과숙살:   {hanja:"寡宿殺", category:"unlucky",  desc:"배우자와의 인연이 약하거나 혼자 지내는 시간이 많습니다"},
  고신살:   {hanja:"孤神殺", category:"unlucky",  desc:"고독하고 의지할 곳이 없는 기운입니다. 이별수가 있습니다"},
  공망:     {hanja:"空亡",   category:"unlucky",  desc:"해당 기둥의 기운이 비어 약해집니다. 해당 분야가 공허해질 수 있습니다"},
  천라지망: {hanja:"天羅地網",category:"unlucky", desc:"뜻하지 않은 구속·제약이 따릅니다 (천라=술해, 지망=진사)"},
  // 문창·학당귀인
  문창귀인: {hanja:"文昌貴人",category:"lucky",   desc:"영리하고 총명합니다. 학문·문서 계통에서 뛰어난 재능과 귀인의 도움이 따릅니다"},
  학당귀인: {hanja:"學堂貴人",category:"lucky",   desc:"학습 능력이 뛰어나고 교육·학문에 인연이 깊습니다. 지식으로 성공하는 기운입니다"},
  괴강살:   {hanja:"魁罡殺", category:"neutral",  desc:"강렬한 카리스마와 결단력. 극단적 기복이 있으며 총명하나 고집이 셉니다"},
  // 사묘절 (일간 12운성 취약지)
  사지:     {hanja:"死地",   category:"unlucky",  desc:"일간의 기운이 사지(死地)에 들어 에너지가 소진되고 의욕이 저하되기 쉽습니다"},
  묘지:     {hanja:"墓地",   category:"unlucky",  desc:"일간의 기운이 묘지(墓地)에 갇혀 답답함과 정체감이 따르기 쉽습니다"},
  절지:     {hanja:"絶地",   category:"unlucky",  desc:"일간의 기운이 절지(絶地)에 들어 단절·이별·시작과 끝이 반복되기 쉽습니다"},
  // 지지충(六沖) — 사주 내 충 관계
  자오충:   {hanja:"子午沖", category:"unlucky",  desc:"감정 기복이 심하고 직업 변동이 잦습니다. 심장·신장 건강을 주의하세요"},
  축미충:   {hanja:"丑未沖", category:"unlucky",  desc:"재산 손실과 부부 갈등이 생기기 쉽습니다. 토지·부동산 분쟁을 주의하세요"},
  인신충:   {hanja:"寅申沖", category:"unlucky",  desc:"사고수와 급격한 이동·변화가 강합니다. 교통사고·충돌을 각별히 조심하세요"},
  묘유충:   {hanja:"卯酉沖", category:"unlucky",  desc:"부부·형제 갈등이 따르기 쉽습니다. 간·폐 건강에 유의하세요"},
  진술충:   {hanja:"辰戌沖", category:"unlucky",  desc:"관재·구설과 재산 다툼이 따르기 쉽습니다. 소화기 건강을 주의하세요"},
  사해충:   {hanja:"巳亥沖", category:"unlucky",  desc:"예기치 못한 사고와 변동이 따릅니다. 심장·신장 건강에 유의하세요"},
  // 삼형살(三刑殺) 및 형(刑)
  인사신삼형:{hanja:"寅巳申三刑",category:"unlucky", desc:"지세지형(持勢之刑). 권력욕이 강하나 자기파괴적 성향이 있습니다. 관재·수술·사고·소송을 주의하세요. 세 지지 모두 갖춰질수록 강도가 세집니다"},
  축술미삼형:{hanja:"丑戌未三刑",category:"unlucky", desc:"무은지형(無恩之刑). 배신당하거나 배신하기 쉽습니다. 은혜를 원수로 갚는 관계를 조심하고 다리·위장 건강을 주의하세요"},
  자묘형:   {hanja:"子卯刑",   category:"unlucky",  desc:"무례지형(無禮之刑). 예의 없는 언행으로 구설수에 오르기 쉽습니다. 법적 분쟁·관계 갈등에 주의하고 충동을 자제하세요"},
  // 자형살(自刑殺) — 같은 지지 중복
  해해형:   {hanja:"亥亥自刑", category:"unlucky",  desc:"⚠️ 亥亥 자형 — 우울증·정서 불안 주의. 어둠과 물(水)의 기운이 겹쳐 내면의 갈등과 자기파멸적 사고가 깊어집니다. 고독·과음·자포자기를 경계하고 정신건강을 챙기세요"},
  오오형:   {hanja:"午午自刑", category:"unlucky",  desc:"午午 자형 — 충동·과로 주의. 화(火) 기운이 과해져 감정 폭발과 번아웃이 잦아집니다. 흥분을 가라앉히고 쉬어가는 법을 익혀야 합니다"},
  유유형:   {hanja:"酉酉自刑", category:"unlucky",  desc:"酉酉 자형 — 예민·집착 주의. 금(金) 기운이 겹쳐 결벽증적 완벽주의와 날카로운 비판으로 인간관계가 소원해집니다. 유연성을 기르세요"},
  진진형:   {hanja:"辰辰自刑", category:"unlucky",  desc:"辰辰 자형 — 고집·자기집착 주의. 토(土) 기운이 굳어져 융통성 없는 독선으로 주변과 마찰이 잦아집니다. 타인의 의견을 경청하세요"},
  // 지지파(地支破) — 이별·손재의 기운
  지지파:   {hanja:"地支破",   category:"unlucky",  desc:"이별·손재·인연 파탄의 기운입니다. 재물 손실과 소중한 관계의 이별을 주의하세요. 계약·보증·동업에 신중을 기하세요"},
  // 지지해(地支害/穿) — 방해·배신의 기운
  지지해:   {hanja:"地支害",   category:"unlucky",  desc:"육해(六害). 방해·장애가 따르며 가까운 사람의 배신을 조심하세요. 각 쌍별 작용: 자미·축오·인유·묘신·진해·사술 — 해당 기운의 충돌로 인한 음성적 갈등"},
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
const CHEONUL_JJ: Record<string, string[]> = {
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
// 백호살: 해당 일주(천간+지지)
const BAEHO_ILJU = new Set(['갑진','을미','병술','정축','무진','기미','경술','신축','임진','계미']);
// 귀문관살: 지지 쌍 (어느 방향이든)
const GWIMUN_PAIRS = [['자','유'],['축','오'],['인','미'],['묘','신'],['진','해'],['사','술']];
// 원진살: 지지 쌍
const WONJIN_PAIRS = [['자','미'],['축','오'],['인','유'],['묘','신'],['진','해'],['사','술']];
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
  인:'병', 오:'병', 술:'병',
  해:'임', 묘:'임', 미:'임',
  신:'경', 자:'경', 진:'경',
  사:'무', 유:'무', 축:'무'};

// 문창귀인(文昌貴人): 일간의 식신 지지
const MUNCHANG_JJ: Record<string,string> = {
  갑:'사', 을:'오', 병:'신', 정:'유', 무:'신',
  기:'유', 경:'해', 신:'자', 임:'인', 계:'묘'};
// 학당귀인(學堂貴人): 일간의 장생지
const HAKDANG_JJ: Record<string,string> = {
  갑:'해', 을:'오', 병:'인', 정:'유', 무:'인',
  기:'유', 경:'사', 신:'자', 임:'신', 계:'묘'};
// 괴강살(魁罡殺): 경진·경술·임진·임술 일주
const GOEGANG_ILJU = new Set(['경진','경술','임진','임술']);

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
function getDohwaJj(yeonji: string): string {
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
function getGongmang(dayCg: string, dayJj: string): string[] {
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
  let desc: string;

  if (jiwonAdj > total * 0.55) {
    strength = "신강";
    // 강한 일간 → 설기(식상) > 재성 > 관성 중 가장 부족한 것
    const cands: Element[] = [siksangEl, jaeseongEl, gwanseongEl];
    yongshin = cands.reduce((a, b) => scores[a] <= scores[b] ? a : b);
    desc = `일간 ${ilgan}의 기운이 강합니다(신강·身强). ${isDG?"월지 득령(得令)으로 기운이 왕성합니다. ":""}강한 에너지를 발산·활용하는 ${yongshin}(${yongshin}) 기운이 용신입니다. 식상·재성·관성을 활용하는 삶이 유리합니다.`;
  } else if (jiwonAdj < total * 0.40) {
    strength = "신약";
    // 약한 일간 → 인성 > 비겁 중 가장 부족한 것
    yongshin = scores[inseongEl] <= scores[ilganEl] ? inseongEl : ilganEl;
    desc = `일간 ${ilgan}의 기운이 약합니다(신약·身弱). ${!isDG?"월지 실령(失令)으로 기운이 쇠약합니다. ":""}나를 도와주는 ${yongshin}(${yongshin}) 기운이 용신입니다. 인성·비겁을 보강하는 환경이 유리합니다.`;
  } else {
    strength = "중화";
    const els: Element[] = ["목","화","토","금","수"];
    yongshin = els.reduce((a, b) => scores[a] <= scores[b] ? a : b);
    desc = `일간의 기운이 중화(中和)에 가깝습니다. 가장 부족한 ${yongshin}(${yongshin}) 기운을 보충해 균형을 유지하는 것이 좋습니다.`;
  }

  const heeshin = GENERATED_BY[yongshin] as Element;  // 용신을 생해주는 → 희신
  const gishin  = CONTROLLED_BY[yongshin] as Element; // 용신을 극하는 → 기신

  return { strength, yongshin, heeshin, gishin, desc };
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
  // 도화살 (연지 삼합그룹 기준 도화 지지)
  addSinsal('도화살', detailArr.filter(p => p.d.jj === getDohwaJj(yeonji)).map(p => p.label));
  // 천을귀인
  const cheonulJjs = CHEONUL_JJ[ilgan] || [];
  addSinsal('천을귀인', detailArr.filter(p => cheonulJjs.includes(p.d.jj)).map(p => p.label));
  // 문곡귀인
  addSinsal('문곡귀인', detailArr.filter(p => p.d.jj === MUNGOK_JJ[ilgan]).map(p => p.label));
  // 홍염살
  addSinsal('홍염살', detailArr.filter(p => p.d.jj === HONGYEOM_JJ[ilgan]).map(p => p.label));
  // 양인살
  addSinsal('양인살', detailArr.filter(p => p.d.jj === YANGIN_JJ[ilgan]).map(p => p.label));
  // 과숙살
  addSinsal('과숙살', detailArr.filter(p => p.d.jj === getGwasukJj(yeonji)).map(p => p.label));
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
  // 백호살: 일주(일간+일지) 조합
  if (BAEHO_ILJU.has(dayPillar.cg + dayPillar.jj)) {
    addSinsal('백호살', ['일']);
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
  // 인사신 삼형(지세지형): 2개 이상이면 형살 성립
  const inSaSinF = detailArr.filter(p => ["인","사","신"].includes(p.d.jj));
  if (inSaSinF.length >= 2) {
    addSinsal('인사신삼형', inSaSinF.map(p => p.label));
  }
  // 축술미 삼형(무은지형): 2개 이상이면 형살 성립
  const chukSulMiF = detailArr.filter(p => ["축","술","미"].includes(p.d.jj));
  if (chukSulMiF.length >= 2) {
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
    detail: "명리학적으로 '소년'의 기운입니다. 일단 저질러 놓고 보는 실행력이 있습니다. '나 안 건들면 너도 안 건들여' 기질로 자유를 중시하고 권위를 싫어합니다. 실패해도 그러려니 하고 다시 꿈을 꿉니다. 폼을 중시하고 자기개발에 집착합니다. 겉으론 '상관없어'라도 머릿속은 빠르게 계산합니다. 재성이 土이므로 부동산·실물 자산에서 재물운이 강합니다.",
  },
  을: {
    short: "을목(乙木) — 유연한 넝쿨·풀",
    keyword: "섬세함·적응력·장인정신",
    detail: "환경에 유연하게 적응하는 넝쿨 같은 기질입니다. 섬세한 미적 감각과 장인정신이 강합니다. 혼자보다 든든한 지지대가 있을 때 더 높이 올라갑니다. 직관과 감각으로 상황을 빠르게 파악합니다.",
  },
  병: {
    short: "병화(丙火) — 하늘의 태양",
    keyword: "외향성·인기·에너지",
    detail: "태양처럼 밝고 외향적입니다. 자연스럽게 주변을 끌어당기는 인기 기질이 있습니다. 에너지 발산이 강하며 과시욕도 있습니다. 넓고 따뜻하지만 빛이 강한 만큼 그늘도 깊습니다.",
  },
  정: {
    short: "정화(丁火) — 촛불·등불",
    keyword: "집중력·예리함·섬세함",
    detail: "하나에 집중하면 깊이 파고드는 예리한 직관력을 가집니다. 따뜻하지만 섬세하고 까다롭습니다. 외면보다 내면의 확신이 중요하며, 감정 기복이 있지만 신의가 강합니다.",
  },
  무: {
    short: "무토(戊土) — 광활한 황무지·큰 산",
    keyword: "맷집·합리화·안과밖 온도차",
    detail: "상남자 기질 투탑 중 하나입니다. '상관없어'라고 하면 진짜 상관없습니다. 무서워하는 것이 없습니다. 목극토(木克土)여서 갑목이 극해도 황무지가 너무 광대해 나무가 덮어봐야 마사지 수준입니다. 충조차 안 맞습니다. 내 사람에게는 절대적 의리를 보이지만, 그 논리는 외부에 통하지 않습니다. 안과 밖의 평가가 극명하게 다르고 예기치 못한 상황에서 폭발적인 말과 행동이 나올 수 있습니다. 중국(무토)처럼 내부 결속이 강한 만큼 외부에는 배타적으로 보입니다.",
  },
  기: {
    short: "기토(己土) — 비옥한 정원·논밭",
    keyword: "세심함·실용성·관리력",
    detail: "꼼꼼하고 부지런하며 실용적입니다. 관리하고 가꾸는 능력이 뛰어납니다. 작은 차이에서 큰 성과를 만들어내는 내공이 있습니다. 집착보다는 일관된 노력으로 결과를 만듭니다.",
  },
  경: {
    short: "경금(庚金) — 도끼·원석 바위",
    keyword: "결단력·직선성·실행력",
    detail: "상남자 기질 투탑 중 하나입니다. 강렬하고 단호하며 직선적입니다. 결단하면 곧바로 실행합니다. 감정 표현은 서툴지만 진심이 두텁습니다. 미국(경금)처럼 글로벌 표준을 만드는 힘이 있습니다.",
  },
  신: {
    short: "신금(辛金) — 세공된 보석·날카로운 칼날",
    keyword: "정밀함·예민함·완벽주의",
    detail: "정밀하고 예민하며 완벽을 추구합니다. 작은 결점에도 민감하게 반응하고 상처를 오래 기억합니다. 독일(신금)처럼 정교한 공학과 질서를 추구합니다. 섬세하게 다듬어진 결과물을 만드는 능력이 탁월합니다.",
  },
  임: {
    short: "임수(壬水) — 광활한 바다·대하(大河)",
    keyword: "진지함·이과형·터프함",
    detail: "명리학적으로 '노인'의 기운입니다. 물상(物象)으로는 밤 — 일요일 저녁의 무드입니다. 바닷물처럼 광대하고 묵직합니다. 진지함과 권위의식이 있으며 질서와 위계를 중시합니다. 한심한 사람을 가장 싫어하는 일간으로, 타인에게 '이렇게 사는 게 사람이냐'고 꼭꼭 찍는 경향이 있습니다. 이번 한번뿐이라는 진지한 마음으로 임하기에 실패하면 완전히 낙담합니다. 과학적·이지적이며 논리와 데이터를 우선합니다. 감성적 표현과 오글거리는 문구를 불편해합니다. 직접적이고 터프한 소통을 선호합니다.",
  },
  계: {
    short: "계수(癸水) — 빗물·이슬·안개",
    keyword: "계산적·공상적·실속형",
    detail: "행동보다 계산이 먼저입니다. 옆에서 실속을 챙겨주는 전략가입니다. 표현은 부드럽지만 내면에 '내 말 들어' 기질이 있습니다. 공상적인 면과 지적 호기심이 있고 머리가 좋습니다. 영국(계수)처럼 냉철한 분석과 합리주의가 강점입니다. 귀여운 면도 있어 주변에 도움이 되는 존재입니다.",
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
  return `${name}님은 ${dom} 성향으로, ${lack} 삶을 살 수 있습니다.`;
}

export function generateWallpaperTheme(lacking: Element[], scores: ElementScore): WallpaperTheme {
  const themeMap: Record<Element, WallpaperTheme> = {
    목: { primaryColors:["#2D6A4F","#40916C","#52B788","#74C69D"], accentColors:["#B7E4C7","#D8F3DC"],
      pattern:"organic", mood:"성장과 생명력", description:"다양한 자연 요소로 목(木)의 기운을 보강합니다" },
    화: { primaryColors:["#E63946","#F4511E","#FF7043","#FF8A65"], accentColors:["#FFCCBC","#FFE0B2"],
      pattern:"flowing", mood:"열정과 활력", description:"다양한 방식으로 화(火)의 기운을 보강합니다" },
    토: { primaryColors:["#9C6644","#D4A373","#E9C46A","#F4D03F"], accentColors:["#FEFAE0","#F8EDEB"],
      pattern:"geometric", mood:"안정과 중심", description:"다양한 방식으로 토(土)의 기운을 보강합니다" },
    금: { primaryColors:["#ADB5BD","#6C757D","#C9B458","#E8D5A3"], accentColors:["#F8F9FA","#DEE2E6"],
      pattern:"crystalline", mood:"명확함과 결단", description:"다양한 방식으로 금(金)의 기운을 보강합니다" },
    수: { primaryColors:["#023E8A","#0077B6","#0096C7","#48CAE4"], accentColors:["#ADE8F4","#CAF0F8"],
      pattern:"misty", mood:"지혜와 흐름", description:"다양한 방식으로 수(Water)의 기운을 보강합니다" },
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
    정관: "체계적 환경. 공직·직장 선호. 명예 추구. 격(格)이 정관격",
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
    caution: "목 기운이 약하면 간·눈이 취약합니다. 목이 과하면 상극 대상인 토(비장·위장)가 약화됩니다.",
    lifestyle: "녹색 채소 섭취, 스트레칭 습관화, 충분한 수면으로 간을 회복하세요.",
  },
  화: {
    organs: "심장(心)·소장(小腸)",
    symptoms: ["심장 질환·부정맥", "혈액순환 장애", "소장 장애", "불면증", "불안·조울증", "혈압 이상"],
    caution: "화 기운이 약하면 심장·혈관이 취약합니다. 화가 과하면 금(폐·대장)이 약화됩니다.",
    lifestyle: "적절한 유산소 운동, 과로·흥분 자제, 붉은색 과일 섭취로 심장을 보호하세요.",
  },
  토: {
    organs: "비장(脾)·위장(胃)·췌장",
    symptoms: ["소화 장애·위염", "위궤양", "비장 약화", "근육 피로·무기력", "입 주변 염증", "당뇨 취약"],
    caution: "토 기운이 약하면 소화기계 전반이 취약합니다. 과하면 수(신장·방광)가 약화됩니다.",
    lifestyle: "규칙적인 식사, 과식 금지, 노란색 음식 섭취, 걱정·집착 줄이기.",
  },
  금: {
    organs: "폐(肺)·대장(大腸)",
    symptoms: ["호흡기 질환·천식", "폐렴·기관지염", "대장 이상·과민성장증후군", "피부 트러블", "비염·알레르기", "변비"],
    caution: "금 기운이 약하면 폐·피부가 취약합니다. 과하면 목(간·담낭)이 약화됩니다.",
    lifestyle: "맑은 공기 마시기, 깊은 복식 호흡, 흰색 음식 섭취, 슬픔·비탄 자제.",
  },
  수: {
    organs: "신장(腎)·방광(膀胱)",
    symptoms: ["신장 질환·신부전", "방광염·요로감염", "골다공증·관절 약화", "청력 저하", "생식기 질환·불임", "탈모·흰머리"],
    caution: "수 기운이 약하면 신장·뼈가 취약합니다. 과하면 화(심장·소장)가 약화됩니다.",
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
    caution: "지나친 고집으로 팀 갈등 주의. 너무 많은 프로젝트를 동시에 추진하면 소진됩니다.",
  },
  화: {
    suited: ["방송인·MC", "마케터·광고인", "디자이너", "강사·코치", "영업·세일즈", "예술가·공연인"],
    industries: ["방송·미디어", "광고·마케팅", "패션·뷰티", "예술·공연", "서비스·외식", "이벤트·컨설팅"],
    strengths: "화려한 표현력과 인기몰이, 넘치는 에너지, 창의적 아이디어, 사람을 끄는 카리스마",
    caution: "지속력 부족. 열정 폭발 후 냉각 주의. 과도한 외향성이 오히려 거부감을 줄 수 있습니다.",
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
    caution: "감정 표현 부족으로 대인관계가 차갑게 느껴질 수 있습니다. 지나친 완벽주의 주의.",
  },
  수: {
    suited: ["철학자·사상가", "심리상담사", "외교관·통역사", "전략가·기획자", "작가·시인", "종교인·명상가"],
    industries: ["학문·연구", "심리·상담", "외교·무역", "창작·문학·영화", "종교·영성", "IT전략·컨설팅"],
    strengths: "깊은 통찰력과 전략적 사고, 유연한 변화 적응력, 광범위한 지식 흡수, 섬세한 감수성",
    caution: "우유부단한 경향. 지나친 내면 집중으로 현실 회피 주의. 과도한 음주·탐닉 경계.",
  },
};

// ── 60갑자 일주론 ─────────────────────────────────────────────────────────────
export const ILJU_60: Record<string, {
  image: string; uunseong: string; keyword: string;
  personality: string; love: string; career: string; caution: string;
}> = {
  갑자: { image:"겨울 강가의 큰 나무", uunseong:"목욕", keyword:"총명·학구적·자존심",
    personality:"60갑자 첫 번째로 1등 기질과 자존심이 강합니다. 지식 습득 능력이 탁월하고 감수성이 예민하며 어머니와 친밀한 경우가 많습니다.",
    love:"이상이 높고 감성적인 연애를 합니다. 이상형을 만나면 헌신적으로 사랑합니다.",
    career:"의료·전문직·IT·교육 분야에 적합합니다. 자격증 활용 전문직에서 빛납니다.",
    caution:"자존심에 상처를 받으면 오래 기억합니다. 완벽 추구로 인한 번아웃을 주의하세요." },
  갑인: { image:"곧게 뻗은 거대한 나무", uunseong:"건록", keyword:"자립심·리더십·패기",
    personality:"간여지동(비견일주)으로 자존심이 극강하고 주관이 뚜렷합니다. 리더십이 뛰어나고 혼자서도 충분히 강합니다.",
    love:"독립적인 연애 스타일입니다. 자신의 페이스를 존중해주는 파트너가 필요합니다.",
    career:"연구직·IT·의료·교육·공학 분야에 적합합니다.",
    caution:"고집이 너무 강해 협력이 어려울 수 있습니다. 욱하는 성향을 조절하세요." },
  갑진: { image:"비옥한 초원에 뿌리내린 큰 나무", uunseong:"쇠", keyword:"책임감·전투력·교육열",
    personality:"평소 조용하지만 화나면 폭발적입니다. 책임감이 매우 강하고 나이 들어 공부에 뜻을 두는 경우가 많습니다.",
    love:"한번 사랑하면 책임지려 합니다. 약한 모습을 보이기 싫어 표현이 서툴 수 있습니다.",
    career:"의료·부동산·교육 분야에 적합합니다. 부동산 투자로 자산을 쌓는 경우도 많습니다.",
    caution:"백호살 기운으로 폭발 후 후회할 언행을 조심하세요." },
  갑오: { image:"숲 위에 뜬 뜨거운 태양", uunseong:"사", keyword:"열정·실행력·직관",
    personality:"강한 열정과 실행력이 탁월합니다. 사지(死地)에 앉아 에너지를 소모 후 공허감을 느끼고 영적·직관적 성향도 있습니다.",
    love:"열정적으로 사랑하지만 감정 기복이 있습니다.",
    career:"예술·창작·사업·교육 분야에 적합합니다.",
    caution:"급하고 진득하지 못한 성향을 조절해야 합니다. 에너지 관리가 중요합니다." },
  갑신: { image:"결실이 풍요로운 나무", uunseong:"절", keyword:"추진력·사업기질·편재",
    personality:"강인한 추진력과 결단력이 있습니다. 편재 기운으로 사업적 감각이 탁월하고 감정 표현이 서툰 편입니다.",
    love:"연애 경험은 많지만 오랜 관계 유지가 어려울 수 있습니다. 포용적인 상대가 필요합니다.",
    career:"영업·무역·운송·사업 분야에 적합합니다.",
    caution:"감정 표현 부족으로 파트너가 외로움을 느낄 수 있습니다." },
  갑술: { image:"산 위에 굳건히 뿌리내린 큰 나무", uunseong:"양", keyword:"책임감·교육재능·복잡한내면",
    personality:"책임감이 강하고 약한 모습을 극도로 싫어합니다. 내면은 따뜻하지만 겉으로는 강인함을 고집합니다.",
    love:"연애운은 좋으나 이성 관계가 복잡해질 수 있습니다.",
    career:"종교·사업·교육·활인업 분야에 적합합니다.",
    caution:"지나친 책임감이 스스로를 지칩니다. 쉬는 것도 능력임을 인식하세요." },
  을축: { image:"겨울 논밭의 풀", uunseong:"쇠", keyword:"인내심·서포터·재물주의",
    personality:"인내심이 강하고 뒤에서 지원하는 역할을 잘합니다. 감정 기복이 있으나 실생활에 강합니다.",
    love:"헌신적으로 사랑합니다. 재극인(財剋印) 구조로 감정과 현실 사이에서 갈등할 수 있습니다.",
    career:"서비스·지원 분야에 적합합니다. 돈을 편하게 버는 것이 어렵지만 노력으로 성과를 냅니다.",
    caution:"재극인 구조로 배움과 현실 사이의 충돌이 잦을 수 있습니다." },
  을묘: { image:"봄철 무성한 숲", uunseong:"건록", keyword:"강인함·생활력·미남미녀",
    personality:"간여지동(비견일주)으로 강인한 인내심과 고집이 있습니다. 미남·미녀가 많고 생활력이 탁월합니다.",
    love:"감성적이고 섬세한 연애를 합니다. 한번 마음을 주면 진심을 다합니다.",
    career:"건록지의 독립심으로 공직·전문직에서 안정적으로 성공합니다.",
    caution:"고집이 너무 강해 인간관계에서 마찰이 생길 수 있습니다." },
  을사: { image:"여름 불꽃 속의 연약한 풀", uunseong:"목욕", keyword:"창의·예술·섬세함",
    personality:"창의적 재능과 섬세한 감각이 있습니다. 예술적 기질이 강하고 감수성이 풍부합니다.",
    love:"감성적이고 낭만적인 연애를 즐깁니다. 감수성을 이해해주는 파트너가 필요합니다.",
    career:"예술·디자인·문화·교육 분야에 적합합니다.",
    caution:"목욕지의 예민함으로 상처를 쉽게 받습니다. 자기 보호가 필요합니다." },
  을미: { image:"여름 들판의 풀과 꽃", uunseong:"양", keyword:"실용성·배려·온화함",
    personality:"온화하고 실용적인 성격입니다. 배려심이 깊고 주변과 잘 어울립니다.",
    love:"안정적이고 따뜻한 연애를 합니다. 가정적인 파트너와 잘 맞습니다.",
    career:"서비스·교육·요식·상담 분야에 적합합니다.",
    caution:"지나친 배려로 자신을 희생하지 않도록 주의하세요." },
  을유: { image:"날카로운 칼 위의 연약한 꽃", uunseong:"절", keyword:"명예추구·외유내강·승부욕",
    personality:"겉은 부드럽지만 속은 냉정합니다. 명예를 중시하고 승부욕과 완벽주의가 강합니다.",
    love:"이상이 높아 마음에 드는 파트너를 찾기 어렵습니다. 한번 정하면 헌신적입니다.",
    career:"의료·군경·법조·미용·요리 분야에 적합합니다. 칼을 쓰는 직종과 인연이 많습니다.",
    caution:"완벽주의로 스스로와 타인에게 지나치게 엄격할 수 있습니다." },
  을해: { image:"큰 물 위의 연꽃", uunseong:"사", keyword:"수용적·감수성·인내",
    personality:"미남·미녀가 많습니다. 수용적이고 인내심이 강하며 감수성이 풍부합니다. 진흙에서도 꽃을 피우는 강인함이 있습니다.",
    love:"낭만적이고 감성적인 연애를 합니다.",
    career:"예술·문화·창작·상담 분야에 적합합니다.",
    caution:"지나친 수용으로 자기 주장이 사라질 수 있습니다. 경계 설정이 필요합니다." },
  병자: { image:"석양이 비추는 바다", uunseong:"태", keyword:"대인관계·이상·양면성",
    personality:"점잖은 미남·미녀가 많습니다. 대인관계가 원만하고 이상 목표가 큽니다. 수화기제(水火旣濟) 구조로 양면성이 있습니다.",
    love:"넓은 인간관계 속에서 이상형을 찾습니다. 자존심이 있어 먼저 다가가기 어렵습니다.",
    career:"외교·대인관계 업무·사업·무역 분야에 적합합니다.",
    caution:"수화충으로 감정 기복이 있을 수 있습니다." },
  병인: { image:"큰 나무 위에 뜬 태양", uunseong:"장생", keyword:"리더십·열정·웅장함",
    personality:"화려하고 웅장한 기상이 있습니다. 열정적인 리더십으로 주변을 이끕니다. 장생지에 앉아 활력이 넘칩니다.",
    love:"열정적으로 사랑을 표현합니다. 화끈하고 솔직한 연애 스타일입니다.",
    career:"사업·교육·리더십 직군에 적합합니다.",
    caution:"너무 넘치는 열정이 주변을 압도할 수 있습니다." },
  병진: { image:"봄비 속의 태양", uunseong:"관대", keyword:"봉사·희생·급한성격",
    personality:"베푸는 것을 좋아하고 정이 많습니다. 봉사와 희생 정신이 있으나 성격이 급합니다.",
    love:"따뜻하고 헌신적인 연애를 합니다.",
    career:"의료·공익·서비스·사회복지 분야에 적합합니다.",
    caution:"정을 너무 많이 베풀다 지칩니다. 자신을 먼저 챙기세요." },
  병오: { image:"작열하는 정오의 태양", uunseong:"제왕", keyword:"폭발에너지·자유·낙천",
    personality:"간여지동(비견일주)+양인(羊刃)의 극강 불 에너지. 칭찬에 협력하고 비판에 즉각 반격합니다. 자유롭고 낙천적입니다.",
    love:"열정적이고 화끈합니다. 독립심이 강해 구속을 싫어합니다.",
    career:"자기 분야에서 최고를 추구합니다. 군인·스포츠·사업에 적합합니다.",
    caution:"감정 폭발 후 후회할 언행을 조심하세요." },
  병신: { image:"바위산 위에 내리쬐는 태양", uunseong:"병", keyword:"총명·밝음·충동주의",
    personality:"문창귀인(文昌貴人)이 있어 총명합니다. 성격이 밝고 착하며 외모도 수려한 편입니다.",
    love:"밝고 활발한 연애를 합니다.",
    career:"교육·문화·예술·지식 관련 전문직에 적합합니다.",
    caution:"수화충으로 충동적 결정을 주의하세요." },
  병술: { image:"지는 석양", uunseong:"묘", keyword:"봉사·풍류·정많음",
    personality:"베푸는 것을 좋아하고 정이 넘칩니다. 식신(食神) 일지로 먹고 마시고 즐기는 풍류를 사랑합니다.",
    love:"따뜻하고 포용적인 연애를 합니다.",
    career:"서비스·의료·요식업 분야에 적합합니다.",
    caution:"정을 너무 많이 베풀다 뒤통수를 맞을 수 있습니다. 분별력이 필요합니다." },
  정축: { image:"얼음 속의 촛불", uunseong:"묘", keyword:"집요함·냉정·실용",
    personality:"차갑고 냉정해 보이지만 내면에 뜨거운 열정이 있습니다. 집요하고 실용적인 판단을 합니다.",
    love:"신중하게 상대를 선택합니다. 감정 표현이 서툴지만 한번 정하면 깊이 사랑합니다.",
    career:"의료·법조·연구·전문직에 적합합니다.",
    caution:"냉정함이 주변을 차갑게 느끼게 할 수 있습니다." },
  정묘: { image:"봄날의 촛불", uunseong:"병", keyword:"섬세·예민·예술적",
    personality:"섬세하고 예민하며 예술적 감각이 뛰어납니다. 감정 기복이 있으나 신의가 강합니다.",
    love:"감성적이고 낭만적인 연애를 원합니다.",
    career:"예술·문화·교육·상담 분야에 적합합니다.",
    caution:"지나친 예민함으로 스트레스를 많이 받습니다. 자기 회복력을 키우세요." },
  정사: { image:"여름 불꽃 위의 촛불", uunseong:"제왕", keyword:"강한의지·직관·카리스마",
    personality:"강한 의지력과 직관력이 있습니다. 제왕지에 앉아 에너지가 충만합니다. 집중력이 탁월합니다.",
    love:"열정적이고 독점욕이 있습니다. 한 사람에게 깊이 집중합니다.",
    career:"예술·종교·전문직·리더십 분야에 적합합니다.",
    caution:"독단적 결정을 주의하세요." },
  정미: { image:"여름 석양의 촛불", uunseong:"관대", keyword:"따뜻함·표현력·공감",
    personality:"따뜻하고 표현력이 풍부합니다. 공감 능력이 뛰어나 주변에서 신뢰를 받습니다.",
    love:"따뜻하고 헌신적인 연애를 합니다.",
    career:"상담·교육·서비스·예술 분야에 적합합니다.",
    caution:"감정 소모가 큽니다. 자신의 에너지를 보충하는 시간이 필요합니다." },
  정유: { image:"가을 보석처럼 빛나는 촛불", uunseong:"장생", keyword:"정밀함·명예·품격",
    personality:"정밀하고 섬세한 성격입니다. 명예를 중시하고 품격을 갖추려 합니다. 장생지에 앉아 생명력이 넘칩니다.",
    love:"품격 있는 연애를 선호합니다. 상대의 예의와 배려를 중시합니다.",
    career:"의료·예술·교육·전문직에 적합합니다.",
    caution:"지나친 명예 추구로 실리를 놓칠 수 있습니다." },
  정해: { image:"겨울 밤의 촛불", uunseong:"태", keyword:"천을귀인·총명·순수",
    personality:"천을귀인(天乙貴人)이 있어 위기 때마다 귀인의 도움을 받습니다. 순수하고 총명하며 분위기를 밝게 만듭니다.",
    love:"순수하고 낭만적인 연애를 합니다.",
    career:"교육·상담·대인관계 업무에 적합합니다.",
    caution:"순수함을 이용당할 수 있습니다. 사람을 볼 때 신중함이 필요합니다." },
  무자: { image:"겨울 빈 들판", uunseong:"태", keyword:"합리적·융통성·조율자",
    personality:"합리적이고 융통성이 있습니다. 주변을 조율하는 능력이 탁월합니다.",
    love:"안정적이고 편안한 연애를 선호합니다.",
    career:"행정·관리·부동산·중재 분야에 적합합니다.",
    caution:"우유부단한 모습이 기회를 놓치게 할 수 있습니다." },
  무인: { image:"봄 산", uunseong:"장생", keyword:"든든함·신뢰·안정",
    personality:"든든하고 신뢰감이 있습니다. 장생지에 앉아 생명력과 추진력이 넘칩니다.",
    love:"안정적이고 든든한 파트너를 추구합니다.",
    career:"건설·부동산·행정·교육 분야에 적합합니다.",
    caution:"너무 무거운 책임을 지려다 지칠 수 있습니다." },
  무진: { image:"물이 흐르는 큰 산", uunseong:"관대", keyword:"전투력·기복·프로정신",
    personality:"백호살 기운으로 폭발력이 있습니다. 괴강일주(魁罡日柱)로 총명합니다. 잘될 때 크게 성공하는 기복이 있습니다.",
    love:"강렬하고 드라마틱한 연애를 합니다.",
    career:"전문직·기술직·독립적 업무에 적합합니다.",
    caution:"감정 폭발 후 큰 손실이 생길 수 있습니다." },
  무오: { image:"작열하는 여름 산", uunseong:"제왕", keyword:"제왕·인내·강한에너지",
    personality:"제왕지에 앉아 강한 에너지와 인내력을 가집니다. 한번 결심하면 끝까지 밀고 나가는 의지력이 있습니다.",
    love:"강렬하고 독점적인 사랑을 합니다.",
    career:"전문직·독립 분야·리더십 직군에 적합합니다.",
    caution:"지나친 고집과 강압적 태도가 관계에 악영향을 줄 수 있습니다." },
  무신: { image:"가을 광산 속의 산", uunseong:"병", keyword:"실용·재물감각·독립",
    personality:"실용적이고 재물 감각이 있습니다. 독립심이 강하고 자신의 방식을 고집합니다.",
    love:"현실적인 연애를 합니다.",
    career:"사업·금융·부동산 분야에 적합합니다.",
    caution:"지나친 현실주의로 감성을 잃지 않도록 주의하세요." },
  무술: { image:"건조한 황무지 산봉우리", uunseong:"묘", keyword:"자존심극강·대범·고독",
    personality:"자존심이 극강하고 고집이 셉니다. 스케일이 크고 대범합니다. 괴강일주로 총명하지만 외로움이 있습니다.",
    love:"마음에 드는 결혼 상대를 만나기 어렵습니다.",
    career:"교육·종교·군경·의약 분야에 적합합니다.",
    caution:"특히 여성은 배우자운에 신중해야 합니다." },
  기축: { image:"겨울 논밭", uunseong:"묘", keyword:"꼼꼼·실용·인내",
    personality:"꼼꼼하고 실용적이며 인내심이 강합니다. 묘지에 앉아 내실을 다지는 능력이 있습니다.",
    love:"안정적이고 성실한 연애를 합니다.",
    career:"행정·관리·식품·농업 분야에 적합합니다.",
    caution:"변화에 대한 두려움이 기회를 놓치게 할 수 있습니다." },
  기묘: { image:"봄 비옥한 농토", uunseong:"병", keyword:"세심·관리·적응력",
    personality:"세심하고 관리 능력이 뛰어납니다. 적응력이 좋아 어떤 환경에서도 자리를 잡습니다.",
    love:"세심하게 파트너를 배려합니다.",
    career:"관리직·서비스·교육·농업 분야에 적합합니다.",
    caution:"지나친 세심함이 스트레스로 이어질 수 있습니다." },
  기사: { image:"여름 논밭", uunseong:"제왕", keyword:"실속·끈기·제왕기운",
    personality:"실속 있고 끈기가 강합니다. 제왕지에 앉아 강한 생존력을 가집니다. 작은 것에서 큰 성과를 만드는 능력이 있습니다.",
    love:"실용적이고 현실적인 연애를 합니다.",
    career:"식품·농업·행정·서비스 분야에 적합합니다.",
    caution:"지나친 실속 추구가 냉정하게 비칠 수 있습니다." },
  기미: { image:"구불구불한 길의 논밭", uunseong:"관대", keyword:"이동·활동적·바쁨",
    personality:"간여지동(비견일주)으로 항상 바쁘게 살아갑니다. 이동과 여행이 잦고 활동적인 삶을 삽니다.",
    love:"자유롭고 활동적인 연애를 합니다. 구속을 싫어합니다.",
    career:"이동·운송·여행·서비스 관련 분야에 적합합니다.",
    caution:"너무 바쁘게 살다 정작 중요한 것을 놓치지 않도록 주의하세요." },
  기유: { image:"가을 수확 들판", uunseong:"장생", keyword:"정밀·성실·꼼꼼",
    personality:"정밀하고 성실합니다. 일을 꼼꼼하게 처리하는 장인 기질이 있습니다. 장생지에 앉아 생명력이 넘칩니다.",
    love:"신중하게 파트너를 선택합니다. 한번 정하면 성실하게 사랑합니다.",
    career:"농업·식품·금융·관리 분야에 적합합니다.",
    caution:"지나친 완벽 추구로 스트레스를 받지 않도록 주의하세요." },
  기해: { image:"겨울 물가의 비옥한 땅", uunseong:"태", keyword:"지혜·전략·내실",
    personality:"지혜롭고 전략적으로 생각합니다. 내실을 쌓아가는 능력이 탁월합니다.",
    love:"신중하고 계획적인 연애를 합니다.",
    career:"전략·기획·농업·식품 분야에 적합합니다.",
    caution:"지나친 계산이 자연스러운 감정 표현을 방해할 수 있습니다." },
  경자: { image:"겨울 강물 속의 바위", uunseong:"사", keyword:"수재·비판적사고·미남미녀",
    personality:"수재가 많습니다. 비판적 사고와 분석력이 탁월합니다. 미남·미녀에 목소리도 좋은 편입니다.",
    love:"이성에게 매력적입니다. 높은 기준으로 파트너를 선택합니다.",
    career:"교육·연구·언론·IT 분야에 적합합니다.",
    caution:"지나친 비판적 시각이 관계를 어렵게 만들 수 있습니다." },
  경인: { image:"봄 산 위의 도끼", uunseong:"절", keyword:"결단·개척·직선적",
    personality:"결단력이 강하고 개척 정신이 있습니다. 직선적으로 생각하고 행동하며 절지에 앉아 강한 의지로 역경을 극복합니다.",
    love:"직선적이고 솔직한 연애를 합니다.",
    career:"군경·법조·사업·개척 분야에 적합합니다.",
    caution:"너무 직선적인 말이 상대에게 상처를 줄 수 있습니다." },
  경진: { image:"물이 흐르는 큰 바위산", uunseong:"양", keyword:"독립·지식나눔·괴강",
    personality:"독립심과 자립심이 강합니다. 지식을 나누고 사람을 돌보는 성향이 있습니다. 괴강일주로 인물이 좋고 이목구비가 뚜렷합니다.",
    love:"독립적인 연애를 합니다. 화날 때 자제력을 잃지 않도록 주의가 필요합니다.",
    career:"교사·의사·간호사·종교인·약사 분야에 적합합니다.",
    caution:"화가 날 때 자제력 상실을 주의하세요." },
  경오: { image:"여름 태양 아래의 바위", uunseong:"목욕", keyword:"활발·매력·강한에너지",
    personality:"활발하고 매력적입니다. 강한 에너지로 주변을 끌어당기는 인력이 있습니다.",
    love:"이성에게 매력적이고 연애 경험이 풍부합니다.",
    career:"영업·마케팅·서비스·스포츠 분야에 적합합니다.",
    caution:"목욕지의 충동적 성향을 조절해야 합니다." },
  경신: { image:"기암절벽 바위산", uunseong:"건록", keyword:"의리·독립극강·맺고끊음",
    personality:"간여지동(비견일주)으로 의리 있고 독립심이 극강합니다. 추진력이 있으며 맺고 끊음이 분명합니다.",
    love:"주도적이고 결단력 있는 연애를 합니다.",
    career:"군인·검찰·경찰·의약 분야에 적합합니다.",
    caution:"망신살(亡身殺) 기운으로 구설을 조심하세요." },
  경술: { image:"가을 거대한 바위산", uunseong:"쇠", keyword:"강의지·총명·결단",
    personality:"강한 의지력과 독립심, 총명함이 있습니다. 괴강일주의 카리스마와 결단력이 있습니다.",
    love:"한번 마음을 정하면 변하지 않습니다.",
    career:"군인·경찰·검찰·개인사업 분야에 적합합니다.",
    caution:"지나친 자존심이 협력을 어렵게 만들 수 있습니다." },
  신축: { image:"진흙 속의 보석", uunseong:"양", keyword:"재능은있으나인정은나중·종교성",
    personality:"탁월한 재능이 있지만 제대로 인정받기까지 오랜 시간이 걸립니다. 영적·종교적 성향이 강합니다.",
    love:"깊고 진지한 사랑을 합니다.",
    career:"종교·철학·예술·전문직 분야에 적합합니다.",
    caution:"재능이 빛을 발하기까지 인내가 필요합니다. 조급함을 버리세요." },
  신묘: { image:"봄 풀밭의 보석", uunseong:"절", keyword:"예민·섬세·완벽주의",
    personality:"예민하고 섬세하며 완벽을 추구합니다. 절지에 앉아 강한 의지로 역경을 극복합니다.",
    love:"세심하게 상대를 배려합니다. 상처를 쉽게 받는 편입니다.",
    career:"예술·패션·의료·정밀 기술 분야에 적합합니다.",
    caution:"지나친 완벽주의가 자신과 타인을 지치게 만들 수 있습니다." },
  신사: { image:"불 속의 보석", uunseong:"사", keyword:"정제된미·강인함·인내",
    personality:"정제된 아름다움을 추구합니다. 사지에 앉아 강한 인내력으로 역경을 극복합니다.",
    love:"신중하고 깊이 있는 연애를 합니다.",
    career:"예술·의료·법조·전문직 분야에 적합합니다.",
    caution:"지나친 자기비판이 발전을 막을 수 있습니다." },
  신미: { image:"여름 들판의 보석", uunseong:"쇠", keyword:"세련미·현실적·관리력",
    personality:"세련되고 현실적입니다. 관리 능력이 뛰어나고 실용적으로 상황을 처리합니다.",
    love:"현실적이고 안정적인 연애를 선호합니다.",
    career:"금융·보험·관리·패션 분야에 적합합니다.",
    caution:"지나친 현실주의가 감성을 억압할 수 있습니다." },
  신유: { image:"완성된 보석", uunseong:"건록", keyword:"정교·완벽·날카로움",
    personality:"간여지동(비견일주)으로 정교하고 완벽을 추구합니다. 날카로운 분석력을 가집니다.",
    love:"높은 기준으로 파트너를 선택합니다.",
    career:"의료·정밀 기술·법조·공학 분야에 적합합니다.",
    caution:"결벽증적 완벽주의가 인간관계를 어렵게 만들 수 있습니다." },
  신해: { image:"겨울 물 위의 보석", uunseong:"목욕", keyword:"감수성·직관·유연함",
    personality:"풍부한 감수성과 직관력을 가집니다. 유연하게 상황에 적응하는 능력이 있습니다.",
    love:"감성적이고 낭만적인 연애를 합니다.",
    career:"예술·상담·의료·창작 분야에 적합합니다.",
    caution:"지나친 감수성으로 상처를 쉽게 받을 수 있습니다." },
  임자: { image:"드넓은 바다", uunseong:"제왕", keyword:"카리스마·추진력·양인",
    personality:"병오일주와 함께 최강 양인일주입니다. 간여지동(비견일주)으로 카리스마와 추진력이 극강합니다.",
    love:"강렬하고 독점적인 사랑을 합니다. 대등한 파트너를 원합니다.",
    career:"사업·리더십·전문직에 적합합니다.",
    caution:"공격적 면을 조절해야 합니다." },
  임인: { image:"봄 강", uunseong:"병", keyword:"진지·장기적사고·권위",
    personality:"진지하고 장기적으로 생각합니다. 권위의식이 있으며 논리와 데이터를 중시합니다. 한심한 사람을 가장 싫어합니다.",
    love:"진지하고 책임감 있는 연애를 합니다.",
    career:"연구·전문직·리더십·전략 분야에 적합합니다.",
    caution:"너무 진지하고 엄격한 기준이 관계를 무겁게 만들 수 있습니다." },
  임진: { image:"봄비 내리는 강", uunseong:"묘", keyword:"총명·조용한강함·괴강",
    personality:"조용하지만 무서운 성격을 가집니다. 괴강일주(魁罡日柱)로 매우 총명합니다. 백호살 기운으로 폭발력이 있습니다.",
    love:"겉으로는 조용하지만 내면에 강렬한 감정이 있습니다.",
    career:"군인·검찰·경찰·의약 분야에 적합합니다.",
    caution:"폭발력이 강해 감정 표현 방식을 조절해야 합니다." },
  임오: { image:"한여름 태양 아래의 강", uunseong:"태", keyword:"수화기제·재물·도화",
    personality:"수화기제(水火旣濟) 구조로 돈과 명예를 모두 가질 수 있습니다. 활동적이고 역동적이며 이성에게 매력적입니다.",
    love:"이성에게 인기가 많습니다. 역동적이고 활발한 연애를 합니다.",
    career:"창업·기업가·사업 분야에 적합합니다.",
    caution:"재정 관리에 신중해야 합니다. 충동적 투자를 주의하세요." },
  임신: { image:"가을 강", uunseong:"장생", keyword:"통찰·전략·생명력",
    personality:"깊은 통찰력과 전략적 사고를 가집니다. 장생지에 앉아 생명력이 넘칩니다.",
    love:"신중하고 전략적인 연애를 합니다. 지적인 파트너를 선호합니다.",
    career:"전략·연구·IT·금융 분야에 적합합니다.",
    caution:"지나친 계산이 자연스러운 인간관계를 어렵게 만들 수 있습니다." },
  임술: { image:"가을 폭풍우의 강", uunseong:"관대", keyword:"백호괴강·폭발력·예술",
    personality:"백호살(白虎殺)과 괴강살(魁罡殺)을 함께 가집니다. 착해 보이지만 강한 전투력이 있습니다. 예술 감각도 탁월합니다.",
    love:"겉으로는 부드럽지만 내면에 강렬한 감정이 있습니다.",
    career:"예술·군인·사업 분야에 적합합니다.",
    caution:"폭발력이 강해 분노 조절이 필요합니다." },
  계축: { image:"겨울 논밭의 이슬", uunseong:"관대", keyword:"냉정·형살·전투력",
    personality:"평소 냉정해 보이지만 화가 나면 전투력이 급상승합니다. 형살 기운으로 날카롭고 예리합니다.",
    love:"신중하게 파트너를 선택합니다. 감정 표현이 서툴지만 진심이 있습니다.",
    career:"경찰·법조·군인 분야에 적합합니다.",
    caution:"분노 폭발 후 수습이 어렵습니다. 사전 감정 관리가 중요합니다." },
  계묘: { image:"봄비 속의 이슬", uunseong:"장생", keyword:"유쾌·순수·일귀격",
    personality:"유쾌하고 밝으며 순수합니다. 미남·미녀가 많습니다. 일귀격(日貴格)으로 복을 타고났습니다.",
    love:"밝고 유쾌한 연애를 합니다.",
    career:"예술·교육·상담 분야에 적합합니다.",
    caution:"너무 순수해서 사기를 당할 수 있습니다. 사람 보는 눈을 키우세요." },
  계사: { image:"여름 불 속의 이슬", uunseong:"태", keyword:"천을귀인·재물·배우자운",
    personality:"천을귀인(天乙貴人)이 있어 귀인의 도움을 받습니다. 재관인(財官印) 구조로 재물운과 배우자운이 모두 좋습니다.",
    love:"좋은 배우자를 만날 가능성이 높습니다.",
    career:"다방면에서 성공 가능합니다.",
    caution:"좋은 기운이 있어도 방심하면 기회를 놓칩니다. 꾸준한 노력이 필요합니다." },
  계미: { image:"여름 들판의 안개", uunseong:"묘", keyword:"공상·전략·실속",
    personality:"공상적이고 전략적입니다. 행동보다 계산이 먼저입니다. 실속을 챙기는 전략가입니다.",
    love:"계산적이지만 진심이 있습니다.",
    career:"전략·기획·상담·분석 분야에 적합합니다.",
    caution:"지나친 계산으로 자연스러운 감정이 억압될 수 있습니다." },
  계유: { image:"가을 보석 위의 이슬", uunseong:"병", keyword:"예술적감각·직관·미남미녀",
    personality:"탁월한 예술적 감각과 직관력이 있습니다. 미남·미녀가 많습니다.",
    love:"감성적이고 낭만적인 연애를 합니다.",
    career:"예술·디자인·음악·창작 분야에 적합합니다.",
    caution:"지나친 예민함이 스트레스가 될 수 있습니다." },
  계해: { image:"깊고 맑은 겨울 물", uunseong:"제왕", keyword:"직관·감수성·통찰",
    personality:"간여지동(비견일주)으로 예리한 직관과 풍부한 감수성을 가집니다. 순수한 수기(水氣)로 깊은 통찰력이 있습니다.",
    love:"감성적이고 예민한 연애를 합니다.",
    career:"상담·심리·예술·철학·영적 분야에 적합합니다.",
    caution:"지나치게 흡수적이고 경계가 없어 자기 보호가 필요합니다." },
};

// ── 조후용신 룩업 테이블 (일간 × 계절) ──────────────────────────────────────
// 조후용신이 억부용신보다 우선: 亥/子/丑/寅월(겨울·초봄) 또는 巳/午/未/申월(여름·초가을)
export const JOHU_YONGSHIN: Record<string, Record<"봄"|"여름"|"가을"|"겨울", { primary: Element; secondary: Element; desc: string }>> = {
  갑: {
    봄:  { primary:"수", secondary:"금", desc:"계수(癸)로 목을 키우고 경금(庚)으로 다듬습니다" },
    여름:{ primary:"수", secondary:"금", desc:"임계수(壬癸)로 불기운을 식혀야 합니다" },
    가을:{ primary:"금", secondary:"화", desc:"경금(庚)으로 나무를 정리하고 정화(丁)로 온기를 줍니다" },
    겨울:{ primary:"화", secondary:"금", desc:"병화(丙)로 따뜻하게 하고 경금(庚)으로 단단하게 합니다" },
  },
  을: {
    봄:  { primary:"수", secondary:"화", desc:"계수(癸)로 생기를 주고 병화(丙)로 햇볕을 줍니다" },
    여름:{ primary:"수", secondary:"토", desc:"임계수(壬癸)로 냉각하고 무토(戊)로 수분을 저장합니다" },
    가을:{ primary:"화", secondary:"토", desc:"병화(丙)로 온기를 주고 무토(戊)로 뿌리를 내립니다" },
    겨울:{ primary:"화", secondary:"토", desc:"병화(丙)로 따뜻하게 하고 무토(戊)로 수분을 제어합니다" },
  },
  병: {
    봄:  { primary:"목", secondary:"수", desc:"갑목(甲)으로 불을 키우고 임수(壬)로 균형을 잡습니다" },
    여름:{ primary:"수", secondary:"목", desc:"임수(壬)로 뜨거운 불을 식히고 갑목(甲)으로 생기를 줍니다" },
    가을:{ primary:"목", secondary:"금", desc:"갑목(甲)으로 불을 키우고 경금(庚)으로 단단하게 합니다" },
    겨울:{ primary:"목", secondary:"수", desc:"갑목(甲)으로 불을 피우고 임수(壬)로 조화를 이룹니다" },
  },
  정: {
    봄:  { primary:"목", secondary:"금", desc:"갑목(甲)으로 불을 키우고 경금(庚)으로 방향을 잡습니다" },
    여름:{ primary:"수", secondary:"목", desc:"계수(癸)로 뜨거운 불을 조절합니다(임수는 정임합목으로 변질)" },
    가을:{ primary:"목", secondary:"금", desc:"갑목(甲)으로 불을 키우고 경금(庚)으로 다듬습니다" },
    겨울:{ primary:"목", secondary:"화", desc:"갑목(甲)으로 불을 피우고 병화(丙)로 온기를 더합니다" },
  },
  무: {
    봄:  { primary:"화", secondary:"수", desc:"병화(丙)로 토를 데우고 임수(壬)로 수분을 공급합니다" },
    여름:{ primary:"수", secondary:"목", desc:"임수(壬)로 뜨거운 토를 식히고 갑목(甲)으로 생기를 줍니다" },
    가을:{ primary:"금", secondary:"화", desc:"경신금(庚辛)으로 토의 기운을 설기하고 화로 온기를 줍니다" },
    겨울:{ primary:"화", secondary:"목", desc:"병화(丙)로 차가운 토를 데웁니다" },
  },
  기: {
    봄:  { primary:"화", secondary:"수", desc:"병화(丙)로 토를 데우고 계수(癸)로 수분을 공급합니다" },
    여름:{ primary:"수", secondary:"금", desc:"계수(癸)로 뜨거운 토를 식히고 금으로 수를 생합니다" },
    가을:{ primary:"화", secondary:"토", desc:"병화(丙)로 온기를 주고 토로 안정을 유지합니다" },
    겨울:{ primary:"화", secondary:"수", desc:"병화(丙)로 차가운 토를 데웁니다" },
  },
  경: {
    봄:  { primary:"화", secondary:"목", desc:"정화(丁)로 금을 단련하고 갑목(甲)으로 방향을 잡습니다" },
    여름:{ primary:"수", secondary:"목", desc:"임수(壬)로 뜨거운 금을 식히고 갑목(甲)으로 균형을 잡습니다" },
    가을:{ primary:"토", secondary:"수", desc:"무토(戊)로 금을 생하고 임계수(壬癸)로 설기합니다" },
    겨울:{ primary:"화", secondary:"토", desc:"병화(丙)·정화(丁)로 차가운 금을 단련하고 무토(戊)로 지지합니다" },
  },
  신: {
    봄:  { primary:"수", secondary:"목", desc:"임수(壬)로 금을 씻어내고 갑목(甲)으로 생기를 줍니다" },
    여름:{ primary:"수", secondary:"토", desc:"임수(壬)로 뜨거운 금을 식히고 무토(戊)로 지지합니다" },
    가을:{ primary:"수", secondary:"토", desc:"임수(壬)로 설기하고 무토(戊)로 지지합니다" },
    겨울:{ primary:"화", secondary:"토", desc:"정화(丁)로 단련합니다(병화는 병신합수로 신금 소멸 우려)" },
  },
  임: {
    봄:  { primary:"토", secondary:"금", desc:"무토(戊)로 물을 막고 경금(庚)으로 수원을 공급합니다" },
    여름:{ primary:"금", secondary:"목", desc:"경금(庚)으로 수원을 공급하고 갑목(甲)으로 균형을 잡습니다" },
    가을:{ primary:"토", secondary:"목", desc:"무토(戊)로 물을 막고 갑목(甲)으로 생기를 줍니다" },
    겨울:{ primary:"화", secondary:"토", desc:"병화(丙)로 차가운 물을 데우고 무토(戊)로 제방을 쌓습니다" },
  },
  계: {
    봄:  { primary:"화", secondary:"금", desc:"병화(丙)로 이슬을 키우고 신금(辛)으로 수원을 공급합니다" },
    여름:{ primary:"금", secondary:"토", desc:"경신금(庚辛)으로 수원을 공급합니다" },
    가을:{ primary:"화", secondary:"목", desc:"병화(丙)로 온기를 주고 갑목(甲)으로 생기를 줍니다" },
    겨울:{ primary:"화", secondary:"목", desc:"병화(丙)·정화(丁)로 차가운 이슬을 따뜻하게 합니다" },
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
  desc: "천간과 지지가 같은 기운으로 자아(自我)가 한 방향으로 강하게 고정된다. 속마음이 행동에 그대로 드러나서 '속이 훤히 보이는' 사람이라는 인상을 주기 쉽다. 자아가 비대해 주변 시선에 영향받지 않으려 하지만, 역설적으로 인정욕구가 강하다.",
  weakness: "월주 간여지동이 일주 간여지동을 극(剋)하는 구조이면 고집이 어느 정도 완화되는 편이다.",
};

// 일주별 간여지동 상세 특성
export const GANYEO_JIDONG_ILJU: Record<string, GanyeoJidongTrait> = {
  갑인: {
    element: "목",
    general: "목(木) 간여지동: 자기 신념이 곧 진리라고 느끼며 좀처럼 방향을 바꾸지 않는다. 고집의 방향이 '성장'과 연결되어 있어 주변을 이끌려는 성향이 강하다.",
    specific: "갑인일주는 대장 기질이 뚜렷하고 자존심이 매우 세다. 자기 페이스를 방해받으면 불쾌함을 숨기지 못한다.",
    stubbornness: 4,
    keywords: ["독립심","자존심","리더십","고집"],
  },
  을묘: {
    element: "목",
    general: "목(木) 간여지동: 자기 신념이 곧 진리라고 느끼며 좀처럼 방향을 바꾸지 않는다.",
    specific: "을묘일주는 간여지동 중 고집이 가장 완강한 축에 속한다. 부드러운 외모와 달리 내면은 절대 굽히지 않는 심지가 있다. 갑인보다 소리는 작지만 더 끈질기게 자기 주장을 관철한다. '개 고집'이라는 평을 듣기도 한다.",
    stubbornness: 5,
    keywords: ["고집","인내","유연해 보이지만 불굴","자기중심"],
  },
  병오: {
    element: "화",
    general: "화(火) 간여지동: 열정적이고 즉각적이며 감정 표현이 직접적이다. 에너지 소모가 빠르고, 관심의 중심에 서고 싶어 한다.",
    specific: "병오일주는 화려하고 표현이 과감하다. 자기 존재감을 드러내고 싶은 욕구가 강해 무리에서 튀는 행동을 하기도 한다. 감정 기복이 있지만 뒤끝은 없다.",
    stubbornness: 3,
    keywords: ["열정","즉흥","존재감","뒤끝없음"],
  },
  정사: {
    element: "화",
    general: "화(火) 간여지동: 열정적이고 즉각적이며 감정 표현이 직접적이다.",
    specific: "정사일주는 병오보다 내면 지향적이다. 자기만의 세계와 취향이 뚜렷하고, 신뢰하는 사람에게만 속을 연다. 음화(陰火)답게 불꽃이 오래 타며 집착 경향이 있다.",
    stubbornness: 3,
    keywords: ["집착","신비로움","선택적 개방","지속성"],
  },
  무오: {
    element: "토·화",
    general: "무토 일간이 오화 지지를 깔고 있어 화생토(火生土)로 에너지가 더 강하게 쌓인다. 자신감이 두껍고 쉽게 흔들리지 않는다.",
    specific: "무오일주는 묵직한 자존감과 실용주의가 결합된다. 말보다 행동이 앞서고, 한번 결정하면 좀처럼 번복하지 않는다.",
    stubbornness: 4,
    keywords: ["자신감","실용","묵직함","불굴"],
  },
  기미: {
    element: "토",
    general: "토(土) 간여지동: 안정 지향적이고 중재하는 척하지만, 실제론 자기 중심축을 절대 움직이지 않는다. 고집이 가장 티 안 나게 강한 유형이다.",
    specific: "기미일주는 을묘와 함께 고집 랭킹 상위권이다. 겉으로는 순하고 맞장구를 잘 치지만 막상 자기 뜻과 다른 결론이 나면 움직이지 않는다. 속내를 잘 드러내지 않는다.",
    stubbornness: 5,
    keywords: ["고집","겉다름","순해 보임","내면 불변"],
  },
  경신: {
    element: "금",
    general: "금(金) 간여지동: 논리와 근거로 반박하는 데 탁월하다. '너 똑똑하다' 소리를 듣지만, 상대가 지쳐 포기하게 만드는 방식이다.",
    specific: "경신일주는 금 간여지동 중 내로남불 경향이 두드러진다. 자신에겐 너그럽고 타인에겐 엄격한 기준을 적용한다. 허세가 섞여 있어 실속보다 이미지를 중시하기도 한다.",
    stubbornness: 4,
    keywords: ["논리","내로남불","허세","자기확신"],
  },
  신유: {
    element: "금",
    general: "금(金) 간여지동: 논리와 근거로 조목조목 반박하는 데 탁월하다. 감정보다 이성으로 설득하려 한다.",
    specific: "신유일주는 경신보다 세밀하고 예민하다. 틀린 것을 그냥 넘기지 못하며, 완벽주의적 고집이 있다. 음금(陰金)답게 칼날이 날카롭고 비판이 직접적이다.",
    stubbornness: 4,
    keywords: ["완벽주의","예민함","비판적","논리"],
  },
  임자: {
    element: "수",
    general: "수(水) 간여지동: 사유가 깊고 언변이 유창하다. 생각의 폭이 넓지만 종종 '개똥철학'처럼 보이는 독자적 세계관을 갖는다.",
    specific: "임자일주는 말빨이 뛰어나고 자기 세계관이 뚜렷하다. 을묘처럼 고집이 외형에서 드러나지 않고, 공감받지 못하면 내면에서 우울감으로 이어지는 경향이 있다. '내 말을 이해해줄 사람이 없다'는 외로움을 느끼기 쉽다.",
    stubbornness: 3,
    keywords: ["말빨","개똥철학","공감욕구","우울감 취약"],
  },
  계해: {
    element: "수",
    general: "수(水) 간여지동: 사유가 깊고 언변이 유창하다.",
    specific: "계해일주는 임자보다 감각적이고 직관적이다. 음수(陰水)의 특성상 흡수력이 강하고, 상대의 감정을 잘 읽는다. 그러나 자기 감정의 경계선은 함부로 건드리면 차갑게 닫아버린다.",
    stubbornness: 3,
    keywords: ["직관","감수성","경계설정","냉온차이"],
  },
};

// 간여지동 헬퍼: 해당 일주가 간여지동인지 확인
export function isGanyeoJidong(dayCg: string, dayJj: string): boolean {
  return (dayCg + dayJj) in GANYEO_JIDONG_ILJU;
}

// 간여지동 헬퍼: 월주가 일주를 극하는지 확인 (고집 완화 조건)
const OHAENG_GEUKHAE: Record<string, string> = {
  목: "금", 화: "수", 토: "목", 금: "화", 수: "토",
};
const CG_OHAENG: Record<string, string> = {
  갑:"목",을:"목",병:"화",정:"화",무:"토",기:"토",경:"금",신:"금",임:"수",계:"수",
};
const JJ_OHAENG: Record<string, string> = {
  자:"수",축:"토",인:"목",묘:"목",진:"토",사:"화",오:"화",미:"토",신:"금",유:"금",술:"토",해:"수",
};

export function monthJidongGeuksIlju(monthCg: string, monthJj: string, dayCg: string, dayJj: string): boolean {
  const monthGanyeoKey = monthCg + monthJj;
  const dayTrait = GANYEO_JIDONG_ILJU[dayCg + dayJj];
  if (!dayTrait || !(monthGanyeoKey in GANYEO_JIDONG_ILJU)) return false;
  const monthOhaeng = CG_OHAENG[monthCg] ?? JJ_OHAENG[monthJj];
  const dayOhaeng = CG_OHAENG[dayCg];
  return OHAENG_GEUKHAE[monthOhaeng] === dayOhaeng;
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
  갑: { outer: "비견", inner: "편재", synthesis: "독립적이고 자기 주관이 뚜렷해 보이나, 내면에는 현실적 실리와 외향적 확장 욕구가 있다." },
  을: { outer: "겁재", inner: "정재", synthesis: "경쟁적이고 독립적으로 보이나, 내면은 안정된 고정 수입과 실속을 원한다. 손해를 매우 싫어한다." },
  병: { outer: "식신", inner: "편관", synthesis: "표현력 강하고 활달해 보이나, 내면에는 주도권과 통제에 대한 욕구가 있다. 관계에서 칼자루를 쥐려 한다." },
  정: { outer: "상관", inner: "정관", synthesis: "창의적이고 자유분방해 보이나, 내면에는 원칙과 명예를 중시하는 보수적인 면이 있다." },
  무: { outer: "편재", inner: "편인", synthesis: "쾌활하고 사교적으로 보이나, 내면에는 생각이 많고 특정 부분에 대한 집착과 강박이 있다." },
  기: { outer: "정재", inner: "정인", synthesis: "실속 있고 꼼꼼해 보이나, 내면에는 사랑받고 싶고 의미 있는 관계에서 인정받고 싶은 욕구가 깊다." },
  경: { outer: "편관", inner: "비견", synthesis: "강하고 권위적으로 보이나, 내면에는 자기 발전과 독립에 대한 강한 욕구가 있다." },
  신: { outer: "정관", inner: "겁재", synthesis: "단정하고 원칙적으로 보이나, 내면에는 회피 성향과 경쟁·자아 갈등이 잠재해 있다." },
  임: { outer: "편인", inner: "식신", synthesis: "생각 많고 분석적으로 보이나, 내면은 지금 이 순간을 즐기고 싶어하는 단순하고 직관적인 욕구가 자리한다." },
  계: { outer: "정인", inner: "상관", synthesis: "사랑스럽고 배려 깊어 보이나, 내면에는 기존 질서를 뒤집으려는 반항적 기운이 잠재해 있다." },
};

// 오행별 식상(食傷) 에너지 방향성
// 내가 생하는 오행이 식상이므로, 그 오행의 속성이 곧 표현 방식을 결정한다
export const SIKSANG_DIRECTION: Record<string, {
  siksangEl: string; direction: "확장" | "억제" | "정화" | "저장" | "변환";
  desc: string;
}> = {
  목: { siksangEl: "화", direction: "확장", desc: "목 일간의 식상은 불(火)이다. 밝히고 드러내고 확산시키는 방향으로 에너지를 쓴다. 표현과 발산, 사람을 모으고 이끄는 방식으로 식상이 작동한다." },
  화: { siksangEl: "토", direction: "저장", desc: "화 일간의 식상은 흙(土)이다. 열을 품고 축적하며 안정화시키는 방향이다. 실질을 다지고 기반을 쌓는 방식으로 식상이 드러난다." },
  토: { siksangEl: "금", direction: "억제", desc: "토 일간의 식상은 금(金)이다. 정제하고 선별하며 불필요한 것을 걷어내는 방향이다. 날카로운 판단과 기준 제시로 식상이 작동한다." },
  금: { siksangEl: "수", direction: "억제", desc: "금 일간의 식상은 물(水)이다. 불을 끄고 흐름을 통제하며 억누르는 방향이다. 확산보다 수렴·제어·차단의 방식으로 식상 에너지가 발현된다." },
  수: { siksangEl: "목", direction: "변환", desc: "수 일간의 식상은 나무(木)이다. 물을 흡수해 성장으로 전환하는 방향이다. 축적된 것을 구체적인 성장과 확장으로 연결하는 방식으로 식상이 드러난다." },
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
    appearance: "식상이 강한 경우 눈빛이 살아있고 표현이 명확하며 말에 머뭇거림이 없다.",
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
    appearance: "상관이 강한 경우 눈빛에 날카로움이 있고 말에 논리와 비판적 시각이 드러난다.",
  },
  vs_gwanseong: {
    siksang: "무에서 유를 창조하는 독립형. 구조·타이틀 없이도 자기 능력으로 위로 올라갈 수 있다.",
    gwanseong: "기존 구조와 조직의 힘을 활용하는 체제 활용형. 단독보다 시스템 안에서 성과를 극대화한다.",
  },
  low_siksang: {
    desc: "식상이 부족하거나 극설기(剋泄氣)된 경우의 특성.",
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
    mindset: "자기 기준으로 좋고 나쁨을 판단합니다. 외부 시선보다 스스로의 판단을 우선하며, 본인에게 검증된 것을 선호합니다.",
    boundary: "개인 영역에 대한 감각이 분명합니다. 다수의 공론보다 1:1 소통을 선호하며, 스스로 허용한 관계에만 마음을 엽니다.",
    mental: "경쟁보다 내면에서 먼저 이기고 시작하는 정신적 강인함이 있습니다. 걱정과 불안도 있으나 스스로 수용하며 균형을 찾는 능력이 탁월합니다.",
    style: "익숙함에 가치를 두고, 지금 이 상태에서도 충분한 만족을 찾는 안빈낙도(安貧樂道) 기질이 있습니다. 포기처럼 보여도 내면의 욕심은 사라지지 않습니다.",
    caution: "비겁이 강하다는 것은 책임지고 싶은 대상이 많다는 뜻이기도 합니다. 늘 부족한 듯한 불안감이 있으나, 실제로는 충분히 갖춰져 있는 경우가 많습니다.",
  },
  신약: {
    mindset: "외부 환경과 타인의 에너지에 민감하게 반응합니다. 분위기를 잘 읽고, 관계 속에서 힘을 얻습니다.",
    boundary: "소통과 공유에 열려 있습니다. 집단 안에서 에너지를 얻고, 함께할 때 능력이 배가됩니다.",
    mental: "환경 변화에 유연하게 적응합니다. 좋은 인연과 도움의 기운이 함께할 때 잠재력이 최대로 발현됩니다.",
    style: "새로운 정보와 주변의 조언을 적극적으로 수용합니다. 최신 흐름에 민감하고 트렌드를 빠르게 흡수합니다.",
    caution: "타인의 기운에 지나치게 영향받지 않도록 자신의 중심을 유지하는 것이 중요합니다.",
  },
  중화: {
    mindset: "자신의 기준과 외부 정보를 함께 활용하는 균형 감각이 있습니다. 편향 없이 상황을 판단합니다.",
    boundary: "상황에 따라 유연하게 거리를 조절합니다. 극단보다 중도를 선택하는 경향이 있습니다.",
    mental: "감정 기복이 크지 않고, 큰 파도 없이 꾸준히 앞으로 나아가는 안정성이 장점입니다.",
    style: "다양한 선택지를 고려한 후 결정합니다. 급격한 변화보다 점진적인 성장을 선호합니다.",
    caution: "부족한 기운을 보충하는 용신을 꾸준히 활용하는 것이 장기적으로 중요합니다.",
  },
};

// ── 재성 위치 심층 해석 (천간·지지·지장간) ──────────────────────────────
// 천간=드러난 재성, 지지=반은 숨긴 재성, 지장간=깊이 숨긴 재성
export const JAESEONG_POSITION_INSIGHT: Record<"천간"|"지지"|"지장간"|"없음", {
  desc: string; wealth: string; style: string;
}> = {
  천간: {
    desc: "재성(財星)이 천간(天干)에 드러나 있습니다.",
    wealth: "유동적 자산, 현금 흐름, 빠른 수익 구조와 어울립니다.",
    style: "재물 목표를 공개적으로 드러내고 주변과 정보를 나누는 성향입니다. 기회를 빠르게 포착하지만, 재물이 흩어지거나 외부에 노출될 가능성도 함께 존재합니다.",
  },
  지지: {
    desc: "재성(財星)이 지지(地支)에 자리합니다.",
    wealth: "부동산·실물 자산·장기 투자와 어울립니다.",
    style: "재물을 드러내지 않고 음적(陰的)으로 축적합니다. 가까운 사람에게도 재물 정보를 쉽게 공유하지 않으며, 실속 중심으로 안정되게 보전합니다.",
  },
  지장간: {
    desc: "재성(財星)이 지장간(地藏干) 깊숙이 숨어 있습니다. 고전 명리에서 '절대 뺏기지 않는 재물'로 해석합니다.",
    wealth: "비공개 자산, 조용한 적립, 드러나지 않는 형태의 자산과 어울립니다.",
    style: "재물 정보를 극히 소수에게만 공유하며, 혼자 조용히 실행하는 방식으로 재물을 모읍니다. 외부에 노출되지 않아 뺏기기 어렵고 실속이 단단합니다.",
  },
  없음: {
    desc: "사주 내에서 재성(財星)이 두드러지게 발견되지 않습니다.",
    wealth: "용신·희신 기운을 통해 간접적으로 재물 흐름이 형성됩니다.",
    style: "재물에 대한 직접적 집착보다, 본인의 재능·관계·학식을 통해 자연스럽게 따르는 재물 구조일 수 있습니다.",
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
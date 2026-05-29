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
  인사신삼형:{hanja:"寅巳申三刑",category:"unlucky", desc:"지세지형(持勢之刑). 권력욕이 강하나 자기파괴적 성향이 있습니다. 관재·수술·사고를 주의하세요"},
  축술미삼형:{hanja:"丑戌未三刑",category:"unlucky", desc:"무은지형(無恩之刑). 배신당하거나 배신하기 쉽습니다. 다리·위장 건강 주의"},
  자묘형:   {hanja:"子卯刑",   category:"unlucky",  desc:"무례지형(無禮之刑). 예의 없는 행동으로 구설수에 오르기 쉽습니다. 관계 갈등 주의"},
  자형살:   {hanja:"自刑殺",   category:"unlucky",  desc:"같은 지지가 겹쳐 스스로 화를 자초합니다. 자기파괴적 행동과 자해적 결정을 주의하세요"},
  // 지지파(地支破) — 이별·손재의 기운
  지지파:   {hanja:"地支破",   category:"unlucky",  desc:"이별·손재·인연 파탄의 기운입니다. 재물 손실과 관계의 이별을 주의하세요"},
  // 지지해(地支害/穿) — 방해·배신의 기운
  지지해:   {hanja:"地支害",   category:"unlucky",  desc:"육해(六害). 방해와 장애가 따르며 가까운 사람의 배신을 조심하세요"},
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
  const selfFormAffected: string[] = [];
  for (const b of ["진","오","유","해"]) {
    if ((selfFormCnt[b] || []).length >= 2) selfFormAffected.push(...(selfFormCnt[b] || []));
  }
  if (selfFormAffected.length > 0) addSinsal('자형살', [...new Set(selfFormAffected)]);

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

function generatePersonality(dominant: Element[], lacking: Element[], name: string): string {
  const traits: Record<Element, string> = {
    목:"창의적이고 성장 지향적인", 화:"열정적이고 표현력이 강한",
    토:"안정적이고 신뢰감 있는", 금:"날카롭고 결단력 있는", 수:"지혜롭고 유연한",
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
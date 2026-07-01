"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ILJU_60, ILGAN_PERSONALITY, SINGANG_TRAITS, OHAENG_HEALTH, OHAENG_CAREER,
  detectSamhapBanghap, adjustCareerByExpression, WONJIN_PAIR_TIER, MI_WONJIN_NOTE
} from "@/lib/saju";

// ── 스크롤 페이드인 컴포넌트 ────────────────────────────────────────────────
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.06 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(30px)",
      transition: `opacity 0.65s ease ${delay}ms, transform 0.65s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

type Lang = "ko" | "en" | "id";

const ELEMENT_INFO: Record<string, { emoji: string; color: string; hanja: string; en: string; danger: string; tip: string }> = {
  // 금(金)의 전통 오행색은 백(白) = 흰색
  목: { emoji: "🌿", color: "#52B788", hanja: "木", en: "Wood",
    danger: "목이 부족하면 결단력이 떨어지고 새로운 시작이 두려워집니다. 발전이 멈추고 무기력함이 찾아올 수 있어요.",
    tip: "초록색 계열의 자연 이미지가 목의 기운을 보충해줍니다." },
  화: { emoji: "🔥", color: "#FF7043", hanja: "火", en: "Fire",
    danger: "화가 부족하면 열정이 사그라들고 대인관계가 소극적이 됩니다. 인정받지 못한다는 느낌이 들 수 있어요.",
    tip: "붉고 따뜻한 색상의 이미지가 화의 기운을 불어넣어 줍니다." },
  토: { emoji: "🌍", color: "#D4A373", hanja: "土", en: "Earth",
    danger: "토가 부족하면 중심을 잡기 어렵고 쉽게 흔들립니다. 신뢰를 잃거나 재물이 손에 쥐어지지 않을 수 있어요.",
    tip: "황토색·베이지 계열의 안정적인 이미지가 토의 기운을 잡아줍니다." },
  금: { emoji: "⚡", color: "#dde6f0", hanja: "金", en: "Metal",
    danger: "금이 부족하면 결단을 못 내리고 우유부단해집니다. 금전적 손실이나 건강 문제로 이어질 수 있어요.",
    tip: "금속성 질감이나 흰색·금색 계열의 이미지가 금의 기운을 강화합니다." },
  수: { emoji: "💧", color: "#48CAE4", hanja: "水", en: "Water",
    danger: "수가 부족하면 지혜가 흐려지고 감정 조절이 어려워집니다. 기억력 저하나 대인 갈등이 잦아질 수 있어요.",
    tip: "파란색·남색 계열의 물·밤하늘 이미지가 수의 기운을 채워줍니다." },
};

const CHEONGAN_MEANING: Record<string, string> = {
  갑: "갑(甲) - 양목, 큰 나무, 리더십", 을: "을(乙) - 음목, 풀꽃, 유연함",
  병: "병(丙) - 양화, 태양, 열정", 정: "정(丁) - 음화, 촛불, 섬세함",
  무: "무(戊) - 양토, 산, 포용력", 기: "기(己) - 음토, 논밭, 실용성",
  경: "경(庚) - 양금, 바위, 강직함", 신: "신(辛) - 음금, 보석, 예민함",
  임: "임(壬) - 양수, 큰 강, 지혜", 계: "계(癸) - 음수, 빗물, 감수성",
};

const JIJI_MEANING: Record<string, string> = {
  자: "자(子) - 쥐, 11월, 자정, 지혜", 축: "축(丑) - 소, 12월, 인내",
  인: "인(寅) - 호랑이, 1월, 도전", 묘: "묘(卯) - 토끼, 2월, 온화함",
  진: "진(辰) - 용, 3월, 카리스마", 사: "사(巳) - 뱀, 4월, 직관",
  오: "오(午) - 말, 5월, 정오, 활력", 미: "미(未) - 양, 6월, 온순함",
  신: "신(申) - 원숭이, 7월, 재치", 유: "유(酉) - 닭, 8월, 완벽주의",
  술: "술(戌) - 개, 9월, 충성심", 해: "해(亥) - 돼지, 10월, 순수함",
};

const CHEONGAN_HANJA: Record<string, string> = {
  갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊", 기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸",
};

const JIJI_HANJA: Record<string, string> = {
  자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳", 오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥",
};

const CG_ELEMENT: Record<string, string> = {
  갑:"목", 을:"목", 병:"화", 정:"화", 무:"토",
  기:"토", 경:"금", 신:"금", 임:"수", 계:"수",
};

const JIJANGAN_DISPLAY: Record<string, Array<{stem:string; role:"정기"|"중기"|"여기"}>> = {
  자:[{stem:"임",role:"여기"},{stem:"계",role:"정기"}],
  축:[{stem:"계",role:"여기"},{stem:"신",role:"중기"},{stem:"기",role:"정기"}],
  인:[{stem:"무",role:"여기"},{stem:"병",role:"중기"},{stem:"갑",role:"정기"}],
  묘:[{stem:"갑",role:"여기"},{stem:"을",role:"정기"}],
  진:[{stem:"을",role:"여기"},{stem:"계",role:"중기"},{stem:"무",role:"정기"}],
  사:[{stem:"무",role:"여기"},{stem:"경",role:"중기"},{stem:"병",role:"정기"}],
  오:[{stem:"병",role:"여기"},{stem:"기",role:"중기"},{stem:"정",role:"정기"}],
  미:[{stem:"정",role:"여기"},{stem:"을",role:"중기"},{stem:"기",role:"정기"}],
  신:[{stem:"무",role:"여기"},{stem:"임",role:"중기"},{stem:"경",role:"정기"}],
  유:[{stem:"경",role:"여기"},{stem:"신",role:"정기"}],
  술:[{stem:"신",role:"여기"},{stem:"정",role:"중기"},{stem:"무",role:"정기"}],
  해:[{stem:"무",role:"여기"},{stem:"갑",role:"중기"},{stem:"임",role:"정기"}],
};

const CHEONGAN_HAP_RULES = [
  {stems:["갑","기"], result:"토", name:"甲己合土", ko:"갑기합토", desc:"안정과 실용을 추구하는 조화"},
  {stems:["을","경"], result:"금", name:"乙庚合金", ko:"을경합금", desc:"의리와 결단력이 강해지는 조화"},
  {stems:["병","신"], result:"수", name:"丙辛合水", ko:"병신합수", desc:"지혜와 영리함이 발달하는 조화"},
  {stems:["정","임"], result:"목", name:"丁壬合木", ko:"정임합목", desc:"창의성과 성장 욕구가 강한 조화"},
  {stems:["무","계"], result:"화", name:"戊癸合火", ko:"무계합화", desc:"열정적이지만 충동적일 수 있는 조화"},
];

const YUKHAM_RULES = [
  {branches:["자","축"], result:"토", name:"子丑合土", ko:"자축합토", desc:"안정과 신뢰의 결합"},
  {branches:["인","해"], result:"목", name:"寅亥合木", ko:"인해합목", desc:"성장과 시작의 결합"},
  {branches:["묘","술"], result:"화", name:"卯戌合火", ko:"묘술합화", desc:"따뜻하고 강인한 결합"},
  {branches:["진","유"], result:"금", name:"辰酉合金", ko:"진유합금", desc:"정밀하고 완벽한 결합"},
  {branches:["사","신"], result:"수", name:"巳申合水", ko:"사신합수", desc:"지혜와 변화의 결합"},
  {branches:["오","미"], result:"토", name:"午未合土", ko:"오미합토", desc:"풍요와 안정의 결합"},
];

const SAMHAP_RULES = [
  {branches:["인","오","술"], result:"화", name:"寅午戌 三合火", ko:"인오술 삼합화", desc:"강력한 열정과 리더십의 에너지"},
  {branches:["해","묘","미"], result:"목", name:"亥卯未 三合木", ko:"해묘미 삼합목", desc:"창의성과 성장 에너지"},
  {branches:["신","자","진"], result:"수", name:"申子辰 三合水", ko:"신자진 삼합수", desc:"지혜와 유연한 흐름의 에너지"},
  {branches:["사","유","축"], result:"금", name:"巳酉丑 三合金", ko:"사유축 삼합금", desc:"결단력과 완성의 에너지"},
];

const BANGHAP_RULES = [
  {branches:["인","묘","진"], result:"목", name:"寅卯辰 方合木", ko:"인묘진 방합목", desc:"봄의 기운, 강력한 성장력"},
  {branches:["사","오","미"], result:"화", name:"巳午未 方合火", ko:"사오미 방합화", desc:"여름의 기운, 왕성한 활력"},
  {branches:["신","유","술"], result:"금", name:"申酉戌 方合金", ko:"신유술 방합금", desc:"가을의 기운, 결실과 수확"},
  {branches:["해","자","축"], result:"수", name:"亥子丑 方合水", ko:"해자축 방합수", desc:"겨울의 기운, 지혜와 저장"},
];

const CHUNG_RULES = [
  {branches:["자","오"], name:"子午沖", ko:"자오충", desc:"감정과 이성의 충돌, 변화가 잦고 이동이 많음"},
  {branches:["축","미"], name:"丑未沖", ko:"축미충", desc:"재물과 건강의 기복, 안정이 흔들리기 쉬움"},
  {branches:["인","신"], name:"寅申沖", ko:"인신충", desc:"직업과 이동의 변화, 활동적이지만 불안정"},
  {branches:["묘","유"], name:"卯酉沖", ko:"묘유충", desc:"대인관계의 갈등, 배신이나 오해를 주의"},
  {branches:["진","술"], name:"辰戌沖", ko:"진술충", desc:"고집과 갈등이 생기기 쉬움, 소화기 건강 주의"},
  {branches:["사","해"], name:"巳亥沖", ko:"사해충", desc:"지혜와 행동의 충돌, 계획이 뒤집히기 쉬움"},
];

const HAE_RULES = [
  {branches:["자","미"], name:"子未害", ko:"자미해", desc:"소통의 어려움, 오해가 생기기 쉬움"},
  {branches:["축","오"], name:"丑午害", ko:"축오해", desc:"재물운의 방해, 인내심이 약해짐"},
  {branches:["인","사"], name:"寅巳害", ko:"인사해", desc:"도움이 방해로 바뀌기 쉬운 관계"},
  {branches:["묘","진"], name:"卯辰害", ko:"묘진해", desc:"가까운 관계에서의 예상치 못한 마찰"},
  {branches:["신","해"], name:"申亥害", ko:"신해해", desc:"계획이 틀어지거나 방해를 받기 쉬움"},
  {branches:["유","술"], name:"酉戌害", ko:"유술해", desc:"금전과 명예에 손상이 오기 쉬움"},
];

const PA_RULES = [
  {branches:["자","유"], name:"子酉破", ko:"자유파", desc:"노력이 허사가 되기 쉬움"},
  {branches:["오","묘"], name:"午卯破", ko:"오묘파", desc:"인간관계의 균열이 생기기 쉬움"},
  {branches:["사","신"], name:"巳申破", ko:"사신파", desc:"계획과 실행 사이의 균열"},
  {branches:["인","해"], name:"寅亥破", ko:"인해파", desc:"시작한 일이 흐지부지되기 쉬움"},
  {branches:["축","진"], name:"丑辰破", ko:"축진파", desc:"재물이나 터전의 손실"},
  {branches:["술","미"], name:"戌未破", ko:"술미파", desc:"안정적인 기반이 흔들리기 쉬움"},
];

const HYEONG_RULES: Array<{branches:string[]; name:string; ko:string; type:string; desc:string}> = [
  {branches:["인","사","신"], name:"寅巳申 三刑", ko:"인사신 삼형", type:"삼형", desc:"무은지형 - 은혜를 잊기 쉬운 에너지. 법적 문제, 사고 주의"},
  {branches:["축","술","미"], name:"丑戌未 三刑", ko:"축술미 삼형", type:"삼형", desc:"지세지형 - 세력 다툼이 생기기 쉬운 에너지. 인간관계 갈등"},
  {branches:["자","묘"], name:"子卯刑", ko:"자묘형", type:"이형", desc:"무례지형 - 예의와 규범을 무시하게 되기 쉬움. 구설수 주의"},
];
const JAHYEONG_JJ = ["진","오","유","해"];

// 천간충 (갑경·을신·병임·정계)
const CHEONGAN_CHUNG_RULES = [
  {stems:["갑","경"], name:"甲庚沖", ko:"갑경충", desc:"목과 금의 충돌. 강한 추진력이 막히고 변화·사고가 잦습니다"},
  {stems:["을","신"], name:"乙辛沖", ko:"을신충", desc:"목과 금의 음충. 유연함이 꺾이고 마찰이 생기기 쉽습니다"},
  {stems:["병","임"], name:"丙壬沖", ko:"병임충", desc:"화와 수의 충돌. 열정과 이성이 맞부딪쳐 결단이 어렵습니다"},
  {stems:["정","계"], name:"丁癸沖", ko:"정계충", desc:"화와 수의 음충. 감성과 이성이 갈등하며 불안감이 생깁니다"},
];

// 암합 (지지 본기 천간합 관계)
const AMHAP_RULES = [
  {branches:["인","미"], result:"토", name:"寅未暗合", ko:"인미암합", desc:"갑기 암합. 은밀한 안정과 신뢰의 결합"},
  {branches:["인","축"], result:"토", name:"寅丑暗合", ko:"인축암합", desc:"갑기 암합. 숨겨진 안정의 에너지"},
  {branches:["묘","신"], result:"금", name:"卯申暗合", ko:"묘신암합", desc:"을경 암합. 은밀한 결단력의 결합"},
  {branches:["사","유"], result:"수", name:"巳酉暗合", ko:"사유암합", desc:"병신 암합. 숨겨진 지혜와 변화의 결합"},
  {branches:["오","해"], result:"목", name:"午亥暗合", ko:"오해암합", desc:"정임 암합. 은밀한 창의와 성장의 결합"},
  {branches:["진","자"], result:"화", name:"辰子暗合", ko:"진자암합", desc:"무계 암합. 숨겨진 열정의 결합"},
  {branches:["술","자"], result:"화", name:"戌子暗合", ko:"술자암합", desc:"무계 암합. 은밀한 열정의 결합"},
];

const VIRAL_CONTENT_KO = [
  { icon: "📱", title: "핸드폰 배경화면이 운을 바꾼다고?",
    content: "우리는 하루 평균 스마트폰을 150번 이상 봅니다. 그 순간마다 눈에 들어오는 색상과 이미지가 잠재의식에 영향을 줍니다. 매일 수백 번 보는 배경화면의 오행 에너지는 생각보다 훨씬 강력한 보완 효과를 냅니다." },
  { icon: "🧬", title: "오행 불균형이 당신의 삶을 방해하고 있다",
    content: "사주에서 특정 오행이 부족하면 그 오행이 담당하는 삶의 영역에서 반복적인 어려움이 생깁니다. 수(水)가 부족한 사람은 아이디어는 넘치지만 실행력에서 막히고, 금(金)이 부족한 사람은 노력은 하지만 결실을 맺기 어렵습니다." },
  { icon: "🎯", title: "성공한 사람들이 색상을 고르는 방법",
    content: "동양의 성공한 사업가들이 명함, 인테리어, 의상의 색상을 사주에 맞춰 고른다는 사실을 아시나요? 풍수 컨설턴트를 수백만 원을 내고 고용하는 이유가 있습니다. 배경화면은 가장 쉽고 저렴하게 시작할 수 있는 방법이에요." },
  { icon: "⚠️", title: "지금 당신의 오행이 보내는 경고 신호",
    content: "최근 이유 없이 피곤하거나, 하는 일마다 잘 안 풀리거나, 대인관계에서 반복적인 패턴이 느껴진다면 오행 불균형을 의심해보세요. 부족한 기운을 보충하는 것은 내비게이션처럼 올바른 방향을 찾는 일입니다." },
];

const VIRAL_CONTENT_EN = [
  { icon: "📱", title: "Can your phone wallpaper change your luck?",
    content: "We check our phones over 150 times a day. Each glance, the colors and images on your screen influence your subconscious. The elemental energy of your wallpaper — seen hundreds of times daily — has a surprisingly powerful balancing effect." },
  { icon: "🧬", title: "Elemental imbalance is blocking your life",
    content: "When a Five Element is lacking in your Saju, that element's life domain shows recurring difficulty. People lacking Water have ideas but struggle with execution. Those lacking Metal work hard but rarely reap rewards." },
  { icon: "🎯", title: "How successful people choose their colors",
    content: "Did you know successful East Asian entrepreneurs choose business card colors, interiors, and clothing based on their Saju? They pay Feng Shui consultants millions of won because environment affects energy." },
  { icon: "⚠️", title: "Warning signs your Five Elements are sending",
    content: "If you've been inexplicably tired, things keep not working out, or you notice repeating patterns in relationships — suspect elemental imbalance. Supplementing lacking elements is like using navigation to find the right direction." },
];

const UUNSEONG_LIFE: Record<string, {
  energy: string; life: string; career: string; health: string; love: string; color: string; tier: "strong"|"weak"|"mid";
}> = {
  장생: { energy:"왕성한 성장기", life:"새로운 시작과 성장의 기운. 발전과 향상이 두드러집니다.", career:"사업 시작·신규 프로젝트에 유리. 개척 정신이 강합니다.", health:"건강하고 생명력이 강함. 회복력이 뛰어납니다.", love:"새 인연·만남의 기운이 강합니다.", color:"#4ade80", tier:"strong" },
  목욕: { energy:"활발하지만 불안정", life:"다재다능하나 집중력이 분산. 풍류 기질이 있습니다.", career:"예술·서비스·대인 분야에 유리. 화려한 환경을 선호합니다.", health:"피부·신장 건강 주의. 과음·과식 조심.", love:"이성 인기 높지만 감정 기복이 심합니다.", color:"#c4b5fd", tier:"mid" },
  관대: { energy:"기운이 점점 강해짐", life:"자신감이 넘치고 명예를 중시. 성장 가속 시기.", career:"관직·공직·교육 분야에 길합니다.", health:"건강 양호. 과로·스트레스 주의.", love:"자기 중심적 성향으로 갈등 가능.", color:"#86efac", tier:"strong" },
  건록: { energy:"독립적 왕성함", life:"독립과 자수성가의 기운. 의지와 책임감이 강합니다.", career:"자영업·독립창업·전문직에 유리. 스스로 개척합니다.", health:"건강 왕성. 다만 독불장군 스트레스 주의.", love:"독립적 성향. 혼자 있는 것을 즐깁니다.", color:"#fbbf24", tier:"strong" },
  제왕: { energy:"최강의 기운", life:"최고조의 기세. 리더십과 통솔력이 최고조.", career:"리더·경영자·최고 성과 달성에 적합.", health:"건강 최고지만 지나치면 역효과.", love:"강한 존재감. 주도적 관계를 선호합니다.", color:"#f59e0b", tier:"strong" },
  쇠: { energy:"서서히 쇠퇴", life:"안정을 추구하며 현상 유지 경향. 보수적.", career:"유지·관리·지원 역할이 적합합니다.", health:"체력 저하 시작. 관절·혈액순환 주의.", love:"안정적이나 새로움이 부족합니다.", color:"#94a3b8", tier:"mid" },
  병: { energy:"기운이 약해짐", life:"고독함과 내성적 기질. 신중하고 철학적.", career:"정신세계·종교·연구 분야에 인연이 있습니다.", health:"만성 피로·면역 저하 주의.", love:"소수의 깊은 관계를 선호합니다.", color:"#64748b", tier:"weak" },
  사: { energy:"기운 소진",  life:"에너지가 소진되는 기운. 의욕 저하·정적인 삶.", career:"결과보다 과정에 집중. 장기 계획이 필요합니다.", health:"심장·혈관·소화기 건강 주의.", love:"감성적이고 이별에 민감합니다.", color:"#f87171", tier:"weak" },
  묘: { energy:"기운이 갇힘",  life:"인내와 저축의 기운. 축적하지만 답답함이 있습니다.", career:"보관·관리·저장 업무. 장기 투자에 적합.", health:"울체·소화기 문제 주의.", love:"마음을 잘 드러내지 않습니다.", color:"#ef4444", tier:"weak" },
  절: { energy:"기운 단절·새 출발", life:"단절과 새 시작의 반복. 변화와 이별이 잦습니다.", career:"이직·변화·새 출발이 많습니다.", health:"신경·호흡기 계통 주의.", love:"인연의 단절과 새 만남이 반복됩니다.", color:"#dc2626", tier:"weak" },
  태: { energy:"새 생명의 씨앗", life:"잠재력은 크지만 아직 미성숙. 준비 단계.", career:"준비·기획·아이디어 단계. 기반 구축이 필요합니다.", health:"면역 예민. 건강 관리에 신경 써야 합니다.", love:"순수하고 이상적인 연애관을 가집니다.", color:"#818cf8", tier:"mid" },
  양: { energy:"기운이 자라남", life:"서서히 성장하는 기운. 인내심이 필요한 시기.", career:"수련·학습·성장 중인 단계. 꾸준함이 열쇠.", health:"성장통 주의. 체력 보충이 필요합니다.", love:"관계가 서서히 천천히 발전합니다.", color:"#a78bfa", tier:"mid" },
};

const JIJANGAN_LIFE: Record<string, string> = {
  자:"겨울 물의 기운(壬癸). 지혜와 직관, 감수성이 숨어 있습니다.",
  축:"토 속에 수·금이 숨어 있습니다(癸辛己). 인내 속에 재물과 지혜가 잠재됩니다.",
  인:"봄 나무의 핵심(戊丙甲). 생명력과 열정, 리더십이 내면에 가득합니다.",
  묘:"순수한 목 기운(甲乙). 창의성과 성장력이 집중되어 있습니다.",
  진:"토 속에 목·수가 숨어 있습니다(乙癸戊). 변화와 재생의 힘이 내재됩니다.",
  사:"화 속에 금·토가 숨어 있습니다(戊庚丙). 강한 의지와 실행력, 재물운이 있습니다.",
  오:"여름 불의 정수(丙己丁). 열정과 표현력, 명예욕이 강렬합니다.",
  미:"토 속에 화·목이 숨어 있습니다(丁乙己). 따뜻함과 포용력, 예술성이 있습니다.",
  신:"가을 금의 핵심(戊壬庚). 결단력과 지혜, 강인함이 내재됩니다.",
  유:"순수한 금 기운(庚辛). 정밀함과 완벽주의, 결단력이 집중됩니다.",
  술:"토 속에 금·화가 숨어 있습니다(辛丁戊). 카리스마와 지도력, 충성심이 있습니다.",
  해:"겨울 물의 생명(戊甲壬). 지혜와 생명력, 새로운 시작의 씨앗이 있습니다.",
};

export default function ResultPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [lang, setLang] = useState<Lang>("ko");
  const [activeScores, setActiveScores] = useState<Record<string, number>>({});
  const [showRaw, setShowRaw] = useState(false);
  const [productType, setProductType] = useState("mobile");
  const [name, setName] = useState("");
  const [birthMonth, setBirthMonth] = useState(1);
  const [aiWallpapers, setAiWallpapers] = useState<Array<{url:string;theme:string;themeKo:string}>>([]);
  const [paymentDone, setPaymentDone] = useState(false);
  const [blueberries, setBlueberries] = useState(0);
  const [bbError, setBbError] = useState("");
  const [bbLoading, setBbLoading] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem("sajuResult");
    const formRaw = sessionStorage.getItem("sajuForm");
    if (!raw) { router.push("/"); return; }
    const parsed = JSON.parse(raw);
    // AI 생성 배경화면 및 결제 상태 로드
    try {
      const wpRaw = sessionStorage.getItem("generatedWallpapers");
      if (wpRaw) setAiWallpapers(JSON.parse(wpRaw));
    } catch {}
    setPaymentDone(sessionStorage.getItem("paymentDone") === "true");
    const bb = parseInt(localStorage.getItem("sp_blueberries") ?? "0", 10);
    setBlueberries(isNaN(bb) ? 0 : bb);
    const form = formRaw ? JSON.parse(formRaw) : {};
    setData(parsed);
    setLang(form.lang || "ko");
    setName(form.name || "");
    setBirthMonth(form.birthMonth || 1);
    setActiveScores(parsed.sajuResult?.scores || {});
  }, [router]);

  useEffect(() => {
    if (!data) return;
    setActiveScores(showRaw
      ? (data.sajuResult?.rawScores ?? data.sajuResult.scores)
      : data.sajuResult.scores);
  }, [data, showRaw]);

  if (!data) return null;

  const { sajuResult } = data;
  const elements = ["목", "화", "토", "금", "수"];
  const maxScore = Math.max(...elements.map(e => activeScores[e] || 0), 1);
  const sorted = [...elements].sort((a, b) => (activeScores[a] || 0) - (activeScores[b] || 0));
  const lacking = sorted.slice(0, 2).filter(e => (activeScores[e] || 0) <= 2.5);
  const excess = sorted.slice(-1).filter(e => (activeScores[e] || 0) >= 3);
  // 인도네시아어는 결과 화면에서 영어로 fallback
  const displayLang: "ko" | "en" = lang === "ko" ? "ko" : "en";
  const viralContent = displayLang === "ko" ? VIRAL_CONTENT_KO : VIRAL_CONTENT_EN;

  // 사주팔자 파싱 — 시일월연 순서
  const pillarsRaw = sajuResult.fourPillars?.split(" ") || [];
  const stems    = pillarsRaw.map((p: string) => p[0]).filter((s: string) => s && s !== "?");
  const branches = pillarsRaw.map((p: string) => p[1]).filter((b: string) => b && b !== "?");

  // 합·충·형·파·해 감지
  const detectedCGHap   = CHEONGAN_HAP_RULES.filter(r => stems.includes(r.stems[0]) && stems.includes(r.stems[1]));
  const detectedYukhap  = YUKHAM_RULES.filter(r => branches.includes(r.branches[0]) && branches.includes(r.branches[1]));
  const detectedSamhap  = SAMHAP_RULES.map(r => ({...r, cnt: r.branches.filter((b: string) => branches.includes(b)).length})).filter(r => r.cnt >= 2);
  // 방합은 3개 모두 있어야 성립 (2개짜리 부분 방합은 표시 안 함)
  const detectedBanghap = BANGHAP_RULES.map(r => ({...r, cnt: r.branches.filter((b: string) => branches.includes(b)).length})).filter(r => r.cnt >= 3);
  const detectedAmhap   = AMHAP_RULES.filter(r => branches.includes(r.branches[0]) && branches.includes(r.branches[1]));
  const detectedCGChung = CHEONGAN_CHUNG_RULES.filter(r => stems.includes(r.stems[0]) && stems.includes(r.stems[1]));
  const detectedChung   = CHUNG_RULES.filter(r => branches.includes(r.branches[0]) && branches.includes(r.branches[1]));
  const detectedHae     = HAE_RULES.filter(r => branches.includes(r.branches[0]) && branches.includes(r.branches[1]));
  const detectedPa      = PA_RULES.filter(r => branches.includes(r.branches[0]) && branches.includes(r.branches[1]));
  // 삼형(인사신·축술미)은 3개 모두 있어야 성립, 이형(자묘)은 2개로 성립
  const detectedHyeong  = HYEONG_RULES.map(r => ({...r, cnt: r.branches.filter(b => branches.includes(b)).length})).filter(r => r.type === "이형" ? r.cnt >= 2 : r.cnt >= 3);
  const detectedJahyeong = JAHYEONG_JJ.filter(jj => branches.filter((b: string) => b === jj).length >= 2);

  const hasHap = [detectedCGHap, detectedYukhap, detectedSamhap, detectedBanghap, detectedAmhap].some(a => a.length > 0);
  const hasNeg = [detectedCGChung, detectedChung, detectedHae, detectedPa, detectedHyeong].some(a => a.length > 0) || detectedJahyeong.length > 0;

  const pillarLabels = displayLang === "ko"
    ? ["시주", "일주", "월주", "연주"]
    : ["Hour", "Day", "Month", "Year"];

  const PRICES: Record<string, string> = { mobile: "₩2,000", report: "₩8,900", bundle: "₩9,900" };
  const PRICE_AMOUNTS: Record<string, number> = { mobile: 2000, report: 8900, bundle: 9900 };
  const bbPrice = PRICE_AMOUNTS[productType];
  const canAffordBb = blueberries >= bbPrice;

  function handleBlueberryPayment() {
    setBbError("");
    if (!canAffordBb) {
      setBbError(`별조각이 부족합니다. 현재 ${blueberries.toLocaleString()}개 / 필요 ${bbPrice.toLocaleString()}개`);
      return;
    }
    setBbLoading(true);
    localStorage.setItem("sp_blueberries", String(blueberries - bbPrice));
    sessionStorage.setItem("paymentDone", "true");
    sessionStorage.setItem("paymentProductType", productType);
    router.push(`/generating?productType=${productType}`);
  }

  // 쟁재(爭財) 감지: 비겁이 재성보다 훨씬 많은 경우
  const det2 = sajuResult.pillarsDetail;
  const allSS: string[] = [];
  if (det2) {
    (['year','month','day','hour'] as const).forEach(k => {
      const d = (det2 as any)[k];
      if (d) { allSS.push(d.sipseongCg, d.sipseongJj); }
    });
  }
  const bigeobCnt = allSS.filter(s => s === '비견' || s === '겁재').length;
  const jaengJaeCnt = allSS.filter(s => s === '편재' || s === '정재').length;
  const hasJaengJae = bigeobCnt >= 2 && jaengJaeCnt >= 1;

  return (
    <main className="min-h-screen bg-[#080810] text-white">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-15%] w-[700px] h-[700px] rounded-full bg-indigo-900/25 blur-[140px]" />
        <div className="absolute bottom-[-15%] right-[-15%] w-[600px] h-[600px] rounded-full bg-purple-900/25 blur-[120px]" />
        <div className="absolute top-[40%] right-[-10%] w-[400px] h-[400px] rounded-full bg-violet-900/15 blur-[100px]" />
      </div>

      {/* 상단 네비 */}
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-5 pb-0">
        <button onClick={() => router.push("/")}
          className="text-sm text-gray-600 hover:text-gray-300 transition flex items-center gap-1">
          ← {displayLang === "ko" ? "처음으로" : "Back"}
        </button>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-8 pb-16 space-y-5">

        {/* 헤더 */}
        <FadeIn>
        <div className="text-center pb-2">
          <div className="text-5xl mb-3 drop-shadow-[0_0_20px_rgba(99,102,241,0.5)]">🔮</div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">
            {displayLang === "ko" ? `${name}님의 사주 분석 결과` : `${name}'s Saju Analysis`}
          </h1>
        </div>
        </FadeIn>

        {/* 사주팔자 만세력 표 */}
        <FadeIn delay={80}>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
          <h2 className="font-bold text-lg mb-4">
            {displayLang === "ko" ? "📋 사주팔자" : "📋 Four Pillars"}
          </h2>

          {(() => {
            const det = sajuResult.pillarsDetail;
            if (!det) return null;

            // 오행 색상 — 금(金)은 전통 백(白) = 흰색
            const EL_COLOR: Record<string, string> = {
              목:"#4ade80", 화:"#f87171", 토:"#d4a373", 금:"#dde6f0", 수:"#7dd3fc"
            };
            // 십성 색상
            const SS_COLOR: Record<string, string> = {
              비견:"#cbd5e1", 겁재:"#94a3b8",
              식신:"#fb923c", 상관:"#f97316",
              편재:"#34d399", 정재:"#10b981",
              편관:"#f87171", 정관:"#ef4444",
              편인:"#a5b4fc", 정인:"#818cf8",
            };
            const uColor = (u: string) => {
              if (['사','묘','절'].includes(u)) return '#f87171';
              if (['장생','건록','제왕','관대'].includes(u)) return '#fbbf24';
              if (['목욕'].includes(u)) return '#c4b5fd';
              return '#4b5563';
            };

            const cols = [
              { key:"시", label: lang==="ko"?"시주":"Hour",  d: det.hour ?? null, isHour: true },
              { key:"일", label: lang==="ko"?"일주":"Day",   d: det.day,          isHour: false },
              { key:"월", label: lang==="ko"?"월주":"Month", d: det.month,        isHour: false },
              { key:"연", label: lang==="ko"?"연주":"Year",  d: det.year,         isHour: false },
            ];

            return (
              <div className="grid grid-cols-4 gap-2">
                {cols.map((col, ci) => {
                  const isDay = col.key === "일";

                  // 시주 미입력
                  if (col.isHour && !col.d) return (
                    <div key={ci} className="rounded-2xl bg-white/[0.02] border border-white/[0.06] flex flex-col items-center justify-center py-6 gap-1">
                      <p className="text-[10px] text-gray-700 font-medium">{col.label}</p>
                      <p className="text-gray-700 text-lg">–</p>
                    </div>
                  );

                  const d = col.d!;
                  const cgEl = CG_ELEMENT[d.cg];
                  const bongi = JIJANGAN_DISPLAY[d.jj]?.find(h => h.role === "정기")?.stem || "";
                  const jjEl = bongi ? CG_ELEMENT[bongi] : "";
                  const cgCol = cgEl ? EL_COLOR[cgEl] : "#e2e8f0";
                  const jjCol = jjEl ? EL_COLOR[jjEl] : "#c4b5fd";

                  // 지장간 색상
                  const jjgArr = JIJANGAN_DISPLAY[d.jj] || [];

                  return (
                    <div key={ci} className={`rounded-2xl border flex flex-col items-center text-center overflow-hidden ${
                      isDay
                        ? "bg-indigo-950/50 border-indigo-500/40 shadow-[0_0_20px_-4px_rgba(99,102,241,0.3)]"
                        : "bg-white/[0.04] border-white/[0.09]"
                    }`}>
                      {/* 기둥명 */}
                      <div className={`w-full py-1.5 text-[11px] font-semibold tracking-widest ${
                        isDay ? "bg-indigo-500/20 text-indigo-300" : "bg-white/[0.05] text-gray-500"
                      }`}>
                        {col.label}
                      </div>

                      {/* 천간 영역 */}
                      <div className="w-full px-1 pt-3 pb-2 border-b border-white/[0.08]">
                        {/* 십성 뱃지 */}
                        <div className="text-[10px] font-medium mb-1.5 h-4" style={{color: SS_COLOR[d.sipseongCg] || "transparent"}}>
                          {d.sipseongCg || (isDay ? "일간" : " ")}
                        </div>
                        {/* 천간 대자 */}
                        <div className="text-[2.2rem] font-bold leading-none" style={{color: cgCol}}>
                          {d.cg}
                        </div>
                        <div className="text-base opacity-40 mt-0.5" style={{color: cgCol}}>
                          {CHEONGAN_HANJA[d.cg] || ""}
                        </div>
                        {/* 오행명 */}
                        <div className="text-[9px] mt-1 font-medium opacity-60" style={{color: cgCol}}>
                          {cgEl || ""}
                        </div>
                      </div>

                      {/* 지지 영역 */}
                      <div className="w-full px-1 pt-2 pb-3">
                        {/* 지지 대자 */}
                        <div className="text-[2.2rem] font-bold leading-none" style={{color: jjCol}}>
                          {d.jj}
                        </div>
                        <div className="text-base opacity-40 mt-0.5" style={{color: jjCol}}>
                          {JIJI_HANJA[d.jj] || ""}
                        </div>
                        {/* 오행명 */}
                        <div className="text-[9px] mt-1 font-medium opacity-60" style={{color: jjCol}}>
                          {jjEl || ""}
                        </div>
                        {/* 지지 십성 */}
                        <div className="text-[10px] font-medium mt-1.5 h-4" style={{color: SS_COLOR[d.sipseongJj] || "transparent"}}>
                          {d.sipseongJj || " "}
                        </div>
                      </div>

                      {/* 하단 정보 */}
                      <div className="w-full border-t border-white/[0.07] px-1.5 py-2 space-y-1.5">
                        {/* 지장간 */}
                        <div className="flex justify-center gap-0.5">
                          {jjgArr.map((item, ii) => {
                            const el = CG_ELEMENT[item.stem];
                            return (
                              <span key={ii} className="text-[11px] font-bold" style={{color: el ? EL_COLOR[el] : '#4b5563', opacity: item.role==="정기"?1:0.6}}>
                                {item.stem}
                              </span>
                            );
                          })}
                        </div>
                        {/* 운성 */}
                        <div className="text-[10px] font-medium" style={{color: uColor(d.uunseong)}}>
                          {d.uunseong || ""}
                        </div>
                        {/* 신살 */}
                        {d.sinsal && (
                          <div className="text-[9px] text-amber-400/80 leading-tight px-1">
                            {d.sinsal}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* 사묘절 원국 아래 요약 */}
          {(() => {
            const det = sajuResult.pillarsDetail;
            if (!det) return null;
            const SMJ = [
              {label:'연', u: det.year?.uunseong},
              {label:'월', u: det.month?.uunseong},
              {label:'일', u: det.day?.uunseong},
              ...(det.hour ? [{label:'시', u: det.hour?.uunseong}] : []),
            ].filter(p => p.u && ['사','묘','절'].includes(p.u));
            if (SMJ.length === 0) return null;
            const HANJA: Record<string,string> = {사:'死地',묘:'墓地',절:'絶地'};
            return (
              <div className="mt-3 p-3 bg-red-950/40 border border-red-500/25 rounded-xl">
                <p className="text-[11px] font-medium text-red-400 mb-1.5">⚠️ 사묘절 (死墓絶) — 일간 기운 취약 기둥</p>
                <div className="flex gap-2 flex-wrap">
                  {SMJ.map((p, i) => (
                    <span key={i} className="text-[11px] bg-red-500/15 text-red-300 px-2 py-0.5 rounded-full font-medium">
                      {p.label}주 {p.u}{p.u && HANJA[p.u] ? `(${HANJA[p.u]})` : ''}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 mt-1">해당 기둥에서 일간의 기력이 소진·정체·단절됩니다</p>
              </div>
            );
          })()}

          {sajuResult.localTimeNote && (
            <p className="text-xs text-indigo-400 mt-3">⏱ {sajuResult.localTimeNote}</p>
          )}

          {/* 천간/지지 의미 */}
          <div className="space-y-1.5 mt-4 pt-4 border-t border-white/10">
            <p className="text-xs text-gray-500 mb-2">{lang==="ko" ? "각 글자의 의미" : "Character meanings"}</p>
            {pillarsRaw.map((pillar: string, idx: number) => {
              const cg = pillar[0]; const jj = pillar[1];
              return (
                <div key={idx} className="text-xs text-gray-400 space-y-0.5">
                  {cg && CHEONGAN_MEANING[cg] && <p>• {CHEONGAN_MEANING[cg]}</p>}
                  {jj && JIJI_MEANING[jj] && <p>• {JIJI_MEANING[jj]}</p>}
                </div>
              );
            })}
          </div>
        </div>
        </FadeIn>

        {/* ─── 일주 60갑자 분석 ─── */}
        {sajuResult.pillarsDetail?.day && (() => {
          const dayCg = sajuResult.pillarsDetail.day.cg;
          const dayJj = sajuResult.pillarsDetail.day.jj;
          const key = dayCg + dayJj;
          const ilju = ILJU_60[key];
          if (!ilju) return null;
          const ilganInfo = ILGAN_PERSONALITY[dayCg];
          const pd = sajuResult.pillarsDetail;
          const ssAll = [pd.year?.sipseongCg, pd.year?.sipseongJj, pd.month?.sipseongCg, pd.month?.sipseongJj, pd.day?.sipseongJj, pd.hour?.sipseongCg, pd.hour?.sipseongJj].filter(Boolean) as string[];
          const sikSangCount = ssAll.filter(s => s === "식신" || s === "상관").length;
          const iljuCareer = adjustCareerByExpression(ilju.career, sikSangCount);
          return (
            <FadeIn delay={60}>
            <div className="bg-gradient-to-br from-violet-950/60 to-indigo-950/50 border border-violet-500/25 rounded-2xl overflow-hidden">
              <div className="px-6 pt-6 pb-4 border-b border-white/8">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div>
                    <p className="text-xs text-violet-400 font-bold tracking-widest uppercase mb-1.5">일주 (日柱) 분석</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-white">{dayCg}{dayJj}일주</span>
                      <span className="text-sm text-violet-300">{ilju.uunseong}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{ilju.image}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-600 mb-0.5">핵심 키워드</p>
                    <p className="text-xs font-bold text-violet-300 bg-violet-500/15 border border-violet-500/25 px-2.5 py-1 rounded-full">{ilju.keyword}</p>
                  </div>
                </div>
                {ilganInfo && (
                  <p className="text-[11px] text-gray-500 mt-2">{ilganInfo.short} · {ilganInfo.keyword}</p>
                )}
              </div>
              <div className="px-6 py-5 space-y-3">
                <div className="bg-black/20 border border-white/8 rounded-xl p-4">
                  <p className="text-[10px] text-violet-400 font-bold tracking-widest mb-2">성격·기질</p>
                  <p className="text-sm text-gray-200 leading-relaxed">{ilju.personality}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-black/20 border border-white/8 rounded-xl p-3">
                    <p className="text-[10px] text-rose-400 font-bold tracking-widest mb-1.5">❤️ 연애 스타일</p>
                    <p className="text-xs text-gray-300 leading-relaxed">{ilju.love}</p>
                  </div>
                  <div className="bg-black/20 border border-white/8 rounded-xl p-3">
                    <p className="text-[10px] text-amber-400 font-bold tracking-widest mb-1.5">💼 직업 적성</p>
                    <p className="text-xs text-gray-300 leading-relaxed">{iljuCareer}</p>
                  </div>
                </div>
                <div className="bg-orange-950/30 border border-orange-500/20 rounded-xl p-3">
                  <p className="text-[10px] text-orange-400 font-bold tracking-widest mb-1.5">⚠️ 주의 사항</p>
                  <p className="text-xs text-gray-400 leading-relaxed">{ilju.caution}</p>
                </div>
              </div>
            </div>
            </FadeIn>
          );
        })()}

        {/* ─── 일간 성격 심층 분석 ─── */}
        {sajuResult.pillarsDetail?.day && (() => {
          const dayCg = sajuResult.pillarsDetail.day.cg;
          const info = ILGAN_PERSONALITY[dayCg];
          if (!info) return null;
          const CG_HANJA: Record<string,string> = {갑:"甲",을:"乙",병:"丙",정:"丁",무:"戊",기:"己",경:"庚",신:"辛",임:"壬",계:"癸"};
          const CG_EL_COLOR: Record<string,string> = {갑:"#4ade80",을:"#4ade80",병:"#f87171",정:"#f87171",무:"#d4a373",기:"#d4a373",경:"#dde6f0",신:"#dde6f0",임:"#7dd3fc",계:"#7dd3fc"};
          return (
            <FadeIn delay={60}>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-black border border-white/20"
                  style={{ backgroundColor: CG_EL_COLOR[dayCg] + "22", color: CG_EL_COLOR[dayCg] }}>
                  {CG_HANJA[dayCg]}
                </div>
                <div>
                  <h2 className="font-bold text-lg">{info.short}</h2>
                  <p className="text-xs text-gray-500">{info.keyword}</p>
                </div>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{info.detail}</p>
            </div>
            </FadeIn>
          );
        })()}

        {/* 오행 차트 */}
        <FadeIn delay={60}>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-lg">
              {displayLang === "ko" ? "⚖️ 오행 분포" : "⚖️ Five Elements"}
            </h2>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={showRaw}
                onChange={e => setShowRaw(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-indigo-500"
              />
              <span className="text-xs text-gray-400">{displayLang === "ko" ? "보정 전 원점수" : "Raw scores"}</span>
            </label>
          </div>
          {showRaw && (
            <p className="text-[11px] text-amber-400 mb-3 bg-amber-900/20 rounded-lg px-3 py-1.5">
              ⚠️ 천간합·삼합·조후 보정 적용 전 원점수입니다
            </p>
          )}
          <div className="space-y-3">
            {elements.map((el) => {
              const info = ELEMENT_INFO[el];
              const score = activeScores[el] || 0;
              const pct = Math.min(100, (score / maxScore) * 100);
              const isLacking = lacking.includes(el);
              const isExcess = excess.includes(el);
              return (
                <div key={el} className="flex items-center gap-3">
                  <span className="w-16 text-sm flex items-center gap-1 flex-shrink-0">
                    <span>{info.emoji}</span>
                    <span className={isLacking ? "text-red-400 font-bold" : isExcess ? "text-amber-400" : "text-gray-300"}>
                      {info.hanja}
                    </span>
                  </span>
                  <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
                    <div className="h-3 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: info.color }} />
                  </div>
                  <div className="w-20 flex items-center gap-1 justify-end flex-shrink-0">
                    <span className="text-xs text-gray-400">{score.toFixed(1)}</span>
                    {isLacking && <span className="text-xs text-red-400 font-medium">부족</span>}
                    {isExcess && <span className="text-xs text-amber-400 font-medium">과다</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-white/10">
            <p className="text-[11px] text-gray-500">
              {lang==="ko" ? "천간합·지지합·삼합·조후·궁성 보정이 자동 적용된 점수입니다" : "Scores include stem/branch merge, seasonal & palace correction"}
            </p>
          </div>
        </div>
        </FadeIn>

        {/* 핵심 분석 문구 */}
        <FadeIn delay={60}>
        <div className="rounded-2xl overflow-hidden border border-white/10">
          {/* 상단: 이름 + 타이틀 */}
          <div className="bg-gradient-to-br from-indigo-950/80 to-purple-950/60 px-7 pt-7 pb-5">
            <p className="text-xs text-indigo-400 font-medium tracking-widest uppercase mb-1.5">
              {displayLang === "ko" ? "사주 오행 분석 결과" : "Five Elements Analysis"}
            </p>
            <p className="text-2xl font-black text-white">
              {displayLang === "ko" ? `${name}님의 사주` : `${name}'s Four Pillars`}
            </p>
          </div>

          {/* 부족한 기운 카드들 */}
          <div className="bg-black/20 px-7 pt-6 pb-5 space-y-3">
            <p className="text-xs text-gray-500 font-medium tracking-wide uppercase mb-4">
              {displayLang === "ko" ? "보충이 필요한 기운" : "Elements to Supplement"}
            </p>

            {lacking[0] && (() => {
              const el = ELEMENT_INFO[lacking[0]];
              return (
                <div className="flex items-center gap-4 bg-white/5 rounded-xl px-5 py-4 border border-white/8">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0 border border-white/10"
                    style={{ backgroundColor: el?.color + "22", boxShadow: `0 0 16px ${el?.color}44` }}>
                    {el?.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black" style={{ color: el?.color }}>{lacking[0]}</span>
                      <span className="text-base text-gray-400 font-medium">{el?.hanja}</span>
                      <span className="text-xs text-gray-600">{el?.en}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {displayLang === "ko" ? "가장 부족한 기운" : "Primary lacking element"}
                    </p>
                  </div>
                  <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2.5 py-1.5 rounded-full font-bold flex-shrink-0">
                    {displayLang === "ko" ? "1순위" : "#1"}
                  </span>
                </div>
              );
            })()}

            {lacking[1] && (() => {
              const el = ELEMENT_INFO[lacking[1]];
              return (
                <div className="flex items-center gap-4 bg-white/[0.03] rounded-xl px-5 py-4 border border-white/5">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: el?.color + "18" }}>
                    {el?.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold" style={{ color: el?.color + "cc" }}>{lacking[1]}</span>
                      <span className="text-sm text-gray-500">{el?.hanja}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {displayLang === "ko" ? "두 번째로 부족한 기운" : "Secondary lacking element"}
                    </p>
                  </div>
                  <span className="text-[10px] bg-orange-500/15 text-orange-500 border border-orange-500/20 px-2.5 py-1.5 rounded-full font-bold flex-shrink-0">
                    {displayLang === "ko" ? "2순위" : "#2"}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* 과한 기운 + 마무리 문구 */}
          <div className="bg-gradient-to-br from-indigo-950/60 to-purple-950/40 px-7 py-5 flex items-center justify-between gap-4 border-t border-white/5">
            {excess[0] ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>{displayLang === "ko" ? "과한 기운" : "Excess"}:</span>
                <span style={{ color: ELEMENT_INFO[excess[0]]?.color + "99" }}>
                  {ELEMENT_INFO[excess[0]]?.emoji} {excess[0]}({ELEMENT_INFO[excess[0]]?.hanja})
                </span>
              </div>
            ) : <div />}
            <p className="text-sm font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent whitespace-nowrap">
              {displayLang === "ko" ? "딱 맞는 배경화면 준비됨 ✨" : "Perfect wallpaper ready ✨"}
            </p>
          </div>
        </div>
        </FadeIn>

        {/* ─── 용신·희신·기신 ─── */}
        {sajuResult.yongshin && (() => {
          const y = sajuResult.yongshin;
          const EL_EMOJI: Record<string,string> = {목:"🌿",화:"🔥",토:"🌍",금:"⚡",수:"💧"};
          const EL_COL: Record<string,string>   = {목:"#4ade80",화:"#f87171",토:"#d4a373",금:"#d4b54a",수:"#94a3b8"};
          return (
            <FadeIn delay={60}>
            <div className="bg-gradient-to-br from-amber-950/50 to-orange-950/30 border border-amber-500/20 rounded-2xl px-7 py-7">
              <div className="flex items-center gap-3 mb-5">
                <h2 className="font-bold text-lg">⚜️ 용신 분석</h2>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  y.strength==='신강' ? 'bg-amber-500/25 text-amber-300 border border-amber-500/30' :
                  y.strength==='신약' ? 'bg-sky-500/25 text-sky-300 border border-sky-500/30' :
                  'bg-emerald-500/25 text-emerald-300 border border-emerald-500/30'
                }`}>{y.strength}</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-6">{y.desc}</p>
              <div className="grid grid-cols-3 gap-4">
                {([
                  {label:'용신 用神', el: y.yongshin, sublabel:'핵심 보완', borderCls:'border-amber-500/30', bgCls:'bg-amber-500/10'},
                  {label:'희신 喜神', el: y.heeshin,  sublabel:'용신을 도움', borderCls:'border-emerald-500/30', bgCls:'bg-emerald-500/10'},
                  {label:'기신 忌神', el: y.gishin,   sublabel:'피할 오행', borderCls:'border-red-500/30', bgCls:'bg-red-500/10'},
                ] as const).map((item, i) => (
                  <div key={i} className={`${item.bgCls} border ${item.borderCls} rounded-xl px-4 py-5 text-center`}>
                    <p className="text-[10px] text-gray-500 mb-2.5 tracking-wide">{item.label}</p>
                    <p className="text-3xl mb-2">{EL_EMOJI[item.el as string]}</p>
                    <p className="text-xl font-bold mb-2" style={{color: EL_COL[item.el as string]}}>{item.el}</p>
                    <p className="text-[10px] text-gray-500 tracking-wide">{item.sublabel}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-gray-600 mt-6">
                ※ 용신 색상과 환경, 관련 직업군이 운의 흐름을 도와줍니다
              </p>
            </div>
            </FadeIn>
          );
        })()}

        {/* ─── 신강/신약 심층 분석 ─── */}
        {sajuResult.yongshin?.strength && (() => {
          const strength = sajuResult.yongshin.strength as "신강" | "신약" | "중화";
          const traits = SINGANG_TRAITS[strength];
          if (!traits) return null;
          const colorMap: Record<string, { bg: string; border: string; text: string }> = {
            신강: { bg: "from-amber-950/50 to-orange-950/30", border: "border-amber-500/25", text: "text-amber-300" },
            신약: { bg: "from-sky-950/50 to-indigo-950/30", border: "border-sky-500/25", text: "text-sky-300" },
            중화: { bg: "from-emerald-950/40 to-teal-950/30", border: "border-emerald-500/25", text: "text-emerald-300" },
          };
          const c = colorMap[strength];
          return (
            <FadeIn delay={60}>
            <div className={`bg-gradient-to-br ${c.bg} border ${c.border} rounded-2xl p-6`}>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="font-bold text-lg">🧭 {strength} — 내 사주의 힘</h2>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold border ${c.border} ${c.text} bg-white/5`}>{strength}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "사고 방식", value: traits.mindset, icon: "🧠" },
                  { label: "대인 관계", value: traits.boundary, icon: "🤝" },
                  { label: "정신적 강점", value: traits.mental, icon: "💪" },
                  { label: "삶의 스타일", value: traits.style, icon: "✦" },
                ].map((item, i) => (
                  <div key={i} className="bg-black/20 border border-white/8 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 font-bold mb-1.5">{item.icon} {item.label}</p>
                    <p className="text-xs text-gray-300 leading-relaxed">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 bg-black/25 border border-white/8 rounded-xl p-3">
                <p className="text-[10px] text-gray-500 font-bold mb-1">⚠️ 주의 포인트</p>
                <p className="text-xs text-gray-400 leading-relaxed">{traits.caution}</p>
              </div>
            </div>
            </FadeIn>
          );
        })()}

        {/* ─── 12운성 인생 분석 ─── */}
        {sajuResult.pillarsDetail && (() => {
          const det = sajuResult.pillarsDetail;
          const pillarEntries = [
            { key: "연", d: det.year },
            { key: "월", d: det.month },
            { key: "일", d: det.day },
            ...(det.hour ? [{ key: "시", d: det.hour }] : []),
          ].filter(p => p.d && p.d.uunseong);

          if (pillarEntries.length === 0) return null;

          return (
            <FadeIn delay={60}>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <h2 className="font-bold text-lg">☯ 12운성 인생 분석</h2>
                <span className="text-xs text-gray-500">각 기둥이 인생에 미치는 영향</span>
              </div>

              <div className="space-y-3">
                {pillarEntries.map(({ key, d }) => {
                  const uu = d.uunseong;
                  const info = UUNSEONG_LIFE[uu];
                  if (!info) return null;
                  const tierBg = info.tier === "strong"
                    ? "bg-amber-950/30 border-amber-500/20"
                    : info.tier === "weak"
                    ? "bg-red-950/30 border-red-500/20"
                    : "bg-white/[0.04] border-white/10";
                  return (
                    <div key={key} className={`rounded-xl border p-4 ${tierBg}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs bg-white/10 text-gray-400 px-2 py-0.5 rounded-full font-medium">{key}주</span>
                        <span className="text-sm font-bold" style={{ color: info.color }}>{uu}</span>
                        <span className="text-xs text-gray-500">{info.energy}</span>
                        {info.tier === "strong" && <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full ml-auto">길(吉)</span>}
                        {info.tier === "weak" && <span className="text-[10px] bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full ml-auto">취약(弱)</span>}
                      </div>
                      <p className="text-xs text-gray-300 mb-3 leading-relaxed">{info.life}</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-black/20 rounded-lg p-2">
                          <p className="text-[10px] text-gray-600 mb-1">💼 직업·재물</p>
                          <p className="text-[11px] text-gray-400 leading-relaxed">{info.career}</p>
                        </div>
                        <div className="bg-black/20 rounded-lg p-2">
                          <p className="text-[10px] text-gray-600 mb-1">🏃 건강</p>
                          <p className="text-[11px] text-gray-400 leading-relaxed">{info.health}</p>
                        </div>
                        <div className="bg-black/20 rounded-lg p-2">
                          <p className="text-[10px] text-gray-600 mb-1">❤️ 관계·사랑</p>
                          <p className="text-[11px] text-gray-400 leading-relaxed">{info.love}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-3 border-t border-white/10">
                <p className="text-[11px] text-gray-600">
                  ☯ 일주(日柱)의 12운성이 삶의 핵심 에너지를 결정합니다. 사·묘·절은 취약지로, 용신 오행으로 보완하면 운의 흐름이 개선됩니다.
                </p>
              </div>
            </div>
            </FadeIn>
          );
        })()}

        {/* ─── 지장간 숨겨진 기운 ─── */}
        {sajuResult.pillarsDetail && (() => {
          const det = sajuResult.pillarsDetail;
          const pillarEntries = [
            { key: "연주", jj: det.year.jj },
            { key: "월주", jj: det.month.jj },
            { key: "일주", jj: det.day.jj },
            ...(det.hour ? [{ key: "시주", jj: det.hour.jj }] : []),
          ];
          const EL_COLOR: Record<string, string> = { 목:"#4ade80", 화:"#f87171", 토:"#d4a373", 금:"#dde6f0", 수:"#7dd3fc" };
          const CG_EL: Record<string, string> = { 갑:"목", 을:"목", 병:"화", 정:"화", 무:"토", 기:"토", 경:"금", 신:"금", 임:"수", 계:"수" };
          const JIJANGAN_DISPLAY2: Record<string, Array<{stem:string;role:"정기"|"중기"|"여기"}>> = {
            자:[{stem:"임",role:"여기"},{stem:"계",role:"정기"}],
            축:[{stem:"계",role:"여기"},{stem:"신",role:"중기"},{stem:"기",role:"정기"}],
            인:[{stem:"무",role:"여기"},{stem:"병",role:"중기"},{stem:"갑",role:"정기"}],
            묘:[{stem:"갑",role:"여기"},{stem:"을",role:"정기"}],
            진:[{stem:"을",role:"여기"},{stem:"계",role:"중기"},{stem:"무",role:"정기"}],
            사:[{stem:"무",role:"여기"},{stem:"경",role:"중기"},{stem:"병",role:"정기"}],
            오:[{stem:"병",role:"여기"},{stem:"기",role:"중기"},{stem:"정",role:"정기"}],
            미:[{stem:"정",role:"여기"},{stem:"을",role:"중기"},{stem:"기",role:"정기"}],
            신:[{stem:"무",role:"여기"},{stem:"임",role:"중기"},{stem:"경",role:"정기"}],
            유:[{stem:"경",role:"여기"},{stem:"신",role:"정기"}],
            술:[{stem:"신",role:"여기"},{stem:"정",role:"중기"},{stem:"무",role:"정기"}],
            해:[{stem:"무",role:"여기"},{stem:"갑",role:"중기"},{stem:"임",role:"정기"}],
          };
          return (
            <FadeIn delay={60}>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <h2 className="font-bold text-lg">🌀 지장간 — 숨겨진 기운</h2>
                <span className="text-xs text-gray-500">지지 안에 감춰진 천간의 에너지</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {pillarEntries.map(({ key, jj }) => {
                  const stems = JIJANGAN_DISPLAY2[jj] || [];
                  const lifeDesc = JIJANGAN_LIFE[jj];
                  return (
                    <div key={key} className="bg-black/20 border border-white/8 rounded-xl p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-gray-500">{key}</span>
                        <div className="flex gap-1">
                          {stems.map((s, si) => {
                            const el = CG_EL[s.stem];
                            return (
                              <span key={si} className="text-sm font-bold"
                                style={{ color: el ? EL_COLOR[el] : "#6b7280", opacity: s.role === "정기" ? 1 : s.role === "중기" ? 0.7 : 0.45 }}>
                                {s.stem}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">{lifeDesc}</p>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] text-gray-600 mt-3 pt-3 border-t border-white/10">
                지장간의 정기(본기)가 가장 강한 영향을 미치며, 대운·세운과 만날 때 그 기운이 활성화됩니다.
              </p>
            </div>
            </FadeIn>
          );
        })()}

        {/* ─── 건강 주의 분석 ─── */}
        {lacking[0] && (() => {
          const el = lacking[0] as "목"|"화"|"토"|"금"|"수";
          const health = OHAENG_HEALTH[el];
          if (!health) return null;
          const EL_COLOR: Record<string,string> = {목:"#4ade80",화:"#f87171",토:"#d4a373",금:"#dde6f0",수:"#7dd3fc"};
          const col = EL_COLOR[el];
          return (
            <FadeIn delay={60}>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <h2 className="font-bold text-lg">🏥 건강 주의 분석</h2>
                <span className="text-xs text-gray-500">{el}(기운 부족) 기준</span>
              </div>
              <div className="flex items-start gap-4 mb-4 bg-black/20 border border-white/8 rounded-xl p-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">취약 장기</p>
                  <p className="text-base font-bold" style={{color:col}}>{health.organs}</p>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-500 mb-1.5">주의 증상</p>
                  <div className="flex flex-wrap gap-1.5">
                    {health.symptoms.map((s,i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                        style={{ background: col+"18", border:`1px solid ${col}30`, color: col }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl p-3 mb-3">
                <p className="text-[10px] text-blue-400 font-bold mb-1">💡 생활 관리법</p>
                <p className="text-xs text-gray-300 leading-relaxed">{health.lifestyle}</p>
              </div>
              <p className="text-[11px] text-gray-600 leading-relaxed">{health.caution}</p>
            </div>
            </FadeIn>
          );
        })()}

        {/* ─── 직업 적성 분석 ─── */}
        {(() => {
          const dominant = [...Object.entries(activeScores)].sort((a,b) => b[1]-a[1]);
          const topEl = dominant[0]?.[0] as "목"|"화"|"토"|"금"|"수";
          if (!topEl) return null;
          const career = OHAENG_CAREER[topEl];
          if (!career) return null;
          const EL_COLOR: Record<string,string> = {목:"#4ade80",화:"#f87171",토:"#d4a373",금:"#dde6f0",수:"#7dd3fc"};
          const EL_EMOJI: Record<string,string> = {목:"🌿",화:"🔥",토:"🌍",금:"⚡",수:"💧"};
          const col = EL_COLOR[topEl];
          return (
            <FadeIn delay={60}>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-5">
                <h2 className="font-bold text-lg">💼 직업 적성 분석</h2>
                <span className="text-xs" style={{color:col}}>{EL_EMOJI[topEl]} {topEl} 기운 우세</span>
              </div>
              <div className="mb-4">
                <p className="text-xs text-gray-500 mb-2.5">추천 직종</p>
                <div className="flex flex-wrap gap-2">
                  {career.suited.map((s,i) => (
                    <span key={i} className="text-xs px-3 py-1.5 rounded-full font-medium"
                      style={{ background: col+"18", border:`1px solid ${col}30`, color: col }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mb-4 bg-black/20 border border-white/8 rounded-xl p-3">
                <p className="text-[10px] text-gray-500 mb-1.5">핵심 강점</p>
                <p className="text-xs text-gray-300 leading-relaxed">{career.strengths}</p>
              </div>
              <div className="mb-3 bg-black/20 border border-white/8 rounded-xl p-3">
                <p className="text-[10px] text-gray-500 mb-1.5">유리한 산업군</p>
                <p className="text-xs text-gray-400">{career.industries.join(" · ")}</p>
              </div>
              <div className="bg-orange-950/30 border border-orange-500/20 rounded-xl p-3">
                <p className="text-[10px] text-orange-400 font-bold mb-1">⚠️ 주의</p>
                <p className="text-xs text-gray-400 leading-relaxed">{career.caution}</p>
              </div>
            </div>
            </FadeIn>
          );
        })()}

        {/* 부족한 오행 상세 */}
        {lacking.slice(0, 2).map((el, idx) => (
          <FadeIn key={el} delay={idx * 80}>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="font-bold text-base mb-2 flex items-center gap-2">
              <span>{ELEMENT_INFO[el].emoji}</span>
              <span style={{ color: ELEMENT_INFO[el].color }}>
                {displayLang === "ko" ? `${el}(${ELEMENT_INFO[el].hanja}) 부족` : `Lacking ${ELEMENT_INFO[el].en}`}
              </span>
            </h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-3">{ELEMENT_INFO[el].danger}</p>
            <div className="bg-white/5 rounded-xl p-3">
              <p className="text-xs text-indigo-300">💡 {ELEMENT_INFO[el].tip}</p>
            </div>
          </div>
          </FadeIn>
        ))}

        {/* 합 */}
        <FadeIn delay={60}>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-4">{displayLang === "ko" ? "✨ 합 - 조화로운 에너지" : "✨ Combinations"}</h2>
          {!hasHap ? (
            <p className="text-sm text-gray-500">{displayLang === "ko" ? "현재 사주에 합이 없습니다." : "No combinations found."}</p>
          ) : (
            <div className="space-y-2">
              {detectedCGHap.map((r, i) => (
                <div key={i} className="bg-green-900/20 border border-green-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-green-300">{r.ko}</span>
                    <span className="text-xs text-gray-500">{r.name}</span>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">천간합</span>
                    <span className="text-xs text-gray-400">→ {r.result}</span>
                  </div>
                  <p className="text-xs text-gray-400">{r.desc}</p>
                </div>
              ))}
              {detectedYukhap.map((r, i) => (
                <div key={i} className="bg-green-900/20 border border-green-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-green-300">{r.ko}</span>
                    <span className="text-xs text-gray-500">{r.name}</span>
                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">육합</span>
                    <span className="text-xs text-gray-400">→ {r.result}</span>
                  </div>
                  <p className="text-xs text-gray-400">{r.desc}</p>
                </div>
              ))}
              {detectedSamhap.map((r, i) => (
                <div key={i} className="bg-emerald-900/20 border border-emerald-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-emerald-300">{r.ko}</span>
                    <span className="text-xs text-gray-500">{r.name}</span>
                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                      {r.cnt === 3 ? "삼합 완전" : "반합 (半合)"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{r.desc}</p>
                </div>
              ))}
              {detectedBanghap.map((r, i) => (
                <div key={i} className="bg-teal-900/20 border border-teal-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-teal-300">{r.ko}</span>
                    <span className="text-xs text-gray-500">{r.name}</span>
                    <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-0.5 rounded-full">
                      {r.cnt === 3 ? "방합 완전" : `방합 부분 (${r.cnt}/3)`}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">{r.desc}</p>
                </div>
              ))}
              {detectedAmhap.map((r, i) => (
                <div key={i} className="bg-violet-900/20 border border-violet-500/20 rounded-xl p-3">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-sm font-bold text-violet-300">{r.ko}</span>
                    <span className="text-xs text-gray-500">{r.name}</span>
                    <span className="text-xs bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">암합</span>
                    <span className="text-xs text-gray-400">→ {r.result}</span>
                  </div>
                  <p className="text-xs text-gray-400">{r.desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        </FadeIn>

        {/* 충·형·파·해 */}
        <FadeIn delay={60}>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <h2 className="font-bold text-lg mb-4">{displayLang === "ko" ? "⚡ 충·형·파·해 - 긴장하는 에너지" : "⚡ Clashes & Tensions"}</h2>
          {!hasNeg ? (
            <p className="text-sm text-gray-400">{displayLang === "ko" ? "✅ 충·형·파·해가 없는 안정적인 사주입니다." : "✅ No clashes — a stable chart."}</p>
          ) : (
            <div className="space-y-4">
              {detectedCGChung.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-rose-400 mb-2">⚡ 천간충 (天干沖) - 천간끼리 충돌하는 에너지</p>
                  <div className="space-y-2">
                    {detectedCGChung.map((r, i) => (
                      <div key={i} className="bg-rose-900/20 border border-rose-500/20 rounded-xl p-3">
                        <p className="text-sm font-bold text-rose-300 mb-1">{r.ko} <span className="text-xs text-gray-500 font-normal">{r.name}</span></p>
                        <p className="text-xs text-gray-400">{r.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {detectedChung.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-400 mb-2">⚡ 지지충 (地支沖) - 지지끼리 충돌하는 에너지</p>
                  <div className="space-y-2">
                    {detectedChung.map((r, i) => (
                      <div key={i} className="bg-red-900/20 border border-red-500/20 rounded-xl p-3">
                        <p className="text-sm font-bold text-red-300 mb-1">{r.ko} <span className="text-xs text-gray-500 font-normal">{r.name}</span></p>
                        <p className="text-xs text-gray-400">{r.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(detectedHyeong.length > 0 || detectedJahyeong.length > 0) && (
                <div>
                  <p className="text-sm font-medium text-orange-400 mb-2">🔺 형 (刑) - 서로를 압박하는 에너지</p>
                  <div className="space-y-2">
                    {detectedHyeong.map((r, i) => (
                      <div key={i} className="bg-orange-900/20 border border-orange-500/20 rounded-xl p-3">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="text-sm font-bold text-orange-300">{r.ko}</span>
                          <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                            {r.type}{r.type === "삼형" && r.cnt < 3 ? ` 부분(${r.cnt}/3)` : ""}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400">{r.desc}</p>
                      </div>
                    ))}
                    {detectedJahyeong.map((jj, i) => (
                      <div key={i} className="bg-orange-900/20 border border-orange-500/20 rounded-xl p-3">
                        <p className="text-sm font-bold text-orange-300 mb-1">{jj}{jj} 자형 <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">자형</span></p>
                        <p className="text-xs text-gray-400">같은 지지가 두 번 - 그 기운이 스스로를 압박함</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {detectedPa.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-amber-400 mb-2">💢 파 (破) - 균열을 만드는 에너지</p>
                  <div className="space-y-2">
                    {detectedPa.map((r, i) => (
                      <div key={i} className="bg-amber-900/20 border border-amber-500/20 rounded-xl p-3">
                        <p className="text-sm font-bold text-amber-300 mb-1">{r.ko} <span className="text-xs text-gray-500 font-normal">{r.name}</span></p>
                        <p className="text-xs text-gray-400">{r.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {detectedHae.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-yellow-400 mb-2">🌀 해 (害) - 방해하는 에너지</p>
                  <div className="space-y-2">
                    {detectedHae.map((r, i) => (
                      <div key={i} className="bg-yellow-900/20 border border-yellow-500/20 rounded-xl p-3">
                        <p className="text-sm font-bold text-yellow-300 mb-1">{r.ko} <span className="text-xs text-gray-500 font-normal">{r.name}</span></p>
                        <p className="text-xs text-gray-400">{r.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        </FadeIn>

        {/* 신살·귀인 분석 */}
        {sajuResult.sinsalList && sajuResult.sinsalList.length > 0 && (
          <FadeIn delay={60}>
          <div className="rounded-2xl overflow-hidden border border-white/10">
            <div className="bg-gradient-to-br from-indigo-950/70 to-purple-950/50 px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <h2 className="font-bold text-lg">✦ 신살·귀인 분석</h2>
                <span className="text-xs text-gray-500">사주에 새겨진 특수 기운들</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">길신은 타고난 축복, 흉신은 인생의 과제입니다</p>
            </div>

            <div className="bg-black/20 px-6 py-5 space-y-5">
              {/* 길신 */}
              {sajuResult.sinsalList.filter((s: any) => s.category === 'lucky').length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 bg-gradient-to-b from-amber-400 to-emerald-400 rounded-full" />
                    <p className="text-sm font-bold text-emerald-300">길신 (吉神) — 타고난 복</p>
                  </div>
                  <div className="space-y-2">
                    {sajuResult.sinsalList.filter((s: any) => s.category === 'lucky').map((s: any, i: number) => (
                      <div key={i} className="bg-emerald-950/40 border border-emerald-500/25 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-emerald-300">{s.name}</span>
                              <span className="text-xs text-gray-600">{s.hanja}</span>
                            </div>
                            <div className="flex gap-1 mt-1">
                              {s.pillars.map((p: string, pi: number) => (
                                <span key={pi} className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full">{p}주</span>
                              ))}
                            </div>
                          </div>
                          <span className="text-lg flex-shrink-0">✨</span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 흉신 */}
              {sajuResult.sinsalList.filter((s: any) => s.category === 'unlucky').length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 bg-gradient-to-b from-red-500 to-orange-500 rounded-full" />
                    <p className="text-sm font-bold text-red-300">흉신 (凶神) — 인생의 과제</p>
                  </div>
                  <div className="space-y-2">
                    {sajuResult.sinsalList.filter((s: any) => s.category === 'unlucky').map((s: any, i: number) => (
                      <div key={i} className="bg-red-950/30 border border-red-500/20 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-red-300">{s.name}</span>
                              <span className="text-xs text-gray-600">{s.hanja}</span>
                            </div>
                            <div className="flex gap-1 mt-1">
                              {s.pillars.map((p: string, pi: number) => (
                                <span key={pi} className="text-[10px] bg-red-500/15 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded-full">{p}주</span>
                              ))}
                            </div>
                          </div>
                          <span className="text-lg flex-shrink-0">⚠️</span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">{s.desc}</p>
                        {s.name === "원진살" && (() => {
                          const pd = sajuResult.pillarsDetail;
                          if (!pd) return null;
                          const pillarMap: Record<string, string> = {
                            연: pd.year?.jj ?? "", 월: pd.month?.jj ?? "", 일: pd.day?.jj ?? "", 시: pd.hour?.jj ?? ""
                          };
                          const jjs = (s.pillars as string[]).map(p => pillarMap[p]).filter(j => j);
                          const pairKey = jjs.length === 2 ? `${jjs[0]}${jjs[1]}` : "";
                          const tier = WONJIN_PAIR_TIER[pairKey] ?? -1;
                          const tierLabel = tier === 0 ? "이 원진은 상대적으로 강한 편이에요 (인유·묘신 계열)."
                            : tier === 1 ? "이 원진은 중간 강도예요 (자미·진해 계열)."
                            : tier === 2 ? "이 원진은 세 종류 중 가장 약한 편이에요 (사술·축오 계열)." : null;
                          const allJjs = [pd.year?.jj, pd.month?.jj, pd.day?.jj, pd.hour?.jj].filter(Boolean);
                          const hasMi = allJjs.includes("미");
                          return (
                            <>
                              {tierLabel && <p className="text-[11px] text-purple-400 mt-1.5 leading-relaxed">{tierLabel}</p>}
                              {hasMi && <p className="text-[11px] text-purple-300 mt-1 leading-relaxed">{MI_WONJIN_NOTE}</p>}
                            </>
                          );
                        })()}
                        <p className="text-[11px] text-gray-500 mt-1.5">💡 용신 오행의 환경을 가까이하면 흉신의 영향이 완화됩니다.</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 중성 */}
              {sajuResult.sinsalList.filter((s: any) => s.category === 'neutral').length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-1 h-4 bg-gradient-to-b from-indigo-400 to-blue-400 rounded-full" />
                    <p className="text-sm font-bold text-indigo-300">중성 신살 — 특성</p>
                  </div>
                  <div className="space-y-2">
                    {sajuResult.sinsalList.filter((s: any) => s.category === 'neutral').map((s: any, i: number) => (
                      <div key={i} className="bg-indigo-950/30 border border-indigo-500/20 rounded-xl p-4">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-sm font-bold text-indigo-300">{s.name}</span>
                              <span className="text-xs text-gray-600">{s.hanja}</span>
                            </div>
                            <div className="flex gap-1 mt-1">
                              {s.pillars.map((p: string, pi: number) => (
                                <span key={pi} className="text-[10px] bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded-full">{p}주</span>
                              ))}
                            </div>
                          </div>
                          <span className="text-lg flex-shrink-0">🔵</span>
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed">{s.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white/[0.02] border-t border-white/5 px-6 py-3">
              <p className="text-[11px] text-gray-600">※ 신살은 선천적 기질과 경향성입니다. 길신은 더욱 활용하고, 흉신은 용신 보강으로 완화할 수 있습니다.</p>
            </div>
          </div>
          </FadeIn>
        )}

        {/* ─── 삼합·방합 기질 분석 ─── */}
        {(() => {
          const samhapList = sajuResult.pillarsDetail ? detectSamhapBanghap(sajuResult.pillarsDetail) : [];
          if (!samhapList || samhapList.length === 0) return null;
          return (
            <FadeIn delay={60}>
            <div className="rounded-2xl overflow-hidden border border-white/10">
              <div className="bg-gradient-to-br from-yellow-950/60 to-amber-950/40 px-6 pt-6 pb-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-bold text-lg">✦ 삼합·방합 기질</h2>
                  <span className="text-xs text-gray-500">지지의 합 에너지</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">사주 지지에 형성된 합국이 기질과 삶의 방향에 영향을 줍니다</p>
              </div>
              <div className="bg-black/20 px-6 py-5 space-y-3">
                {samhapList.map((s: any, i: number) => {
                  const badgeStyle =
                    s.type === "삼합" ? { bg: "bg-amber-500/20", text: "text-amber-300", border: "border-amber-500/30" } :
                    s.type === "반합" ? { bg: "bg-yellow-500/20", text: "text-yellow-300", border: "border-yellow-500/30" } :
                    { bg: "bg-green-500/20", text: "text-green-300", border: "border-green-500/30" };
                  return (
                    <div key={i} className="bg-white/[0.04] border border-white/10 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}>{s.type}</span>
                        <span className="text-sm font-bold text-white">{s.name}</span>
                        <span className="text-xs text-gray-500">{s.element} 기운</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{s.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>
            </FadeIn>
          );
        })()}

        {/* ─── 쟁재 분석 ─── */}
        {hasJaengJae && (() => {
          const isStrong = bigeobCnt >= 4;
          return (
            <FadeIn delay={60}>
            <div className="bg-orange-950/30 border border-orange-500/20 rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-3">
                <h3 className="font-bold text-base">⚔️ {isStrong ? '군겁쟁재 (群劫爭財)' : '쟁재 (爭財)'}</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold border ${
                  isStrong ? 'bg-red-500/20 text-red-300 border-red-500/30'
                           : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                }`}>{isStrong ? '강함' : '경미'}</span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed mb-3">
                비겁({bigeobCnt}개)이 재성({jaengJaeCnt}개)을 둘러싸고 있습니다. 여러 비겁이 하나의 재성을 서로 빼앗으려는 형국으로, 재물이 한 곳에 모이기 어렵고 동업·합자·공동투자에 불리합니다.
              </p>
              <div className="bg-orange-950/40 border border-orange-500/15 rounded-xl p-3">
                <p className="text-xs text-orange-200 leading-relaxed">
                  💡 독립 창업보다 안정적인 직장이 유리하며, 재무 관리를 타인에게 위임하지 않는 것이 좋습니다. 용신이 재성을 도와주는 오행이라면 시기를 잘 골라 재물 활동을 하는 것이 중요합니다.
                </p>
              </div>
            </div>
            </FadeIn>
          );
        })()}

        {/* 바이럴 읽을거리 */}
        <div className="space-y-4">
          <FadeIn>
          <h2 className="text-xl font-bold text-center text-white">
            {displayLang === "ko" ? "📖 알고 계셨나요?" : "📖 Did you know?"}
          </h2>
          </FadeIn>
          {viralContent.map((item, i) => (
            <FadeIn key={i} delay={i * 80}>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-3 flex items-center gap-2">
                <span className="text-2xl">{item.icon}</span>
                <span className="text-white">{item.title}</span>
              </h3>
              <p className="text-gray-300 text-base leading-relaxed">{item.content}</p>
            </div>
            </FadeIn>
          ))}
        </div>

        {/* 배경화면 미리보기 / AI 생성 결과 */}
        <FadeIn delay={60}>
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          {aiWallpapers.length > 0 ? (
            /* ── AI 생성 완료: 실제 이미지 표시 ── */
            <>
              <div className="py-3 px-4 border-b border-white/10 flex items-center justify-between">
                <p className="text-sm text-green-400 font-medium">✅ AI 배경화면 완성!</p>
                <p className="text-xs text-gray-500">길게 눌러 저장</p>
              </div>
              <div className="grid grid-cols-3 gap-2 p-3">
                {aiWallpapers.map((wp, i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden group cursor-pointer"
                    style={{ aspectRatio: "9/16" }}>
                    <img
                      src={wp.url}
                      alt={wp.themeKo}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-end pb-3">
                      <a
                        href={wp.url}
                        download={`saju-wallpaper-${wp.theme}.png`}
                        className="bg-white/20 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full"
                        onClick={e => e.stopPropagation()}
                      >
                        💾 저장
                      </a>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent py-2 px-2">
                      <p className="text-xs text-white font-medium text-center">{wp.themeKo}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-500 text-center py-2 border-t border-white/5">
                이미지를 길게 눌러 저장하거나 💾 버튼을 누르세요
              </p>
            </>
          ) : (
            /* ── 미결제: 잠금 미리보기 ── */
            <>
              <p className="text-sm text-gray-400 text-center py-3 border-b border-white/10">
                {displayLang === "ko" ? "🖼 AI 배경화면 미리보기 (결제 후 생성)" : "🖼 AI Wallpaper Preview (unlocked after payment)"}
              </p>
              <div className="grid grid-cols-3 gap-2 p-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="relative rounded-xl overflow-hidden"
                    style={{ aspectRatio: "9/16", background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)" }}>
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                        <span className="text-xl">{paymentDone ? "⏳" : "🔒"}</span>
                      </div>
                      <p className="text-xs text-gray-600">{displayLang === "ko" ? "결제 후 공개" : "After payment"}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-600 text-center py-3">
                {displayLang === "ko" ? "AI가 당신의 오행에 맞춰 3장을 생성합니다" : "AI generates 3 custom wallpapers for your elements"}
              </p>
            </>
          )}
        </div>
        </FadeIn>

        {/* ─── 상품 선택 + 결제 ─── */}
        <FadeIn delay={60}>
        <div className="bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border border-indigo-500/20 rounded-2xl p-6 space-y-4">
          <h2 className="font-bold text-lg">{displayLang === "ko" ? "💳 상품 선택" : "💳 Choose Your Product"}</h2>

          {/* 상품 1: 배경화면 단품 */}
          <button type="button" onClick={() => setProductType("mobile")}
            className={`w-full py-4 px-4 rounded-xl border transition flex items-center justify-between ${
              productType === "mobile"
                ? "bg-indigo-600/30 border-indigo-400/60 shadow-lg shadow-indigo-900/30"
                : "bg-white/5 border-white/10 hover:border-white/20"
            }`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">①</span>
              <div className="text-left">
                <p className="font-bold text-sm">{displayLang === "ko" ? "📱 오행 배경화면" : "📱 Elemental Wallpaper"}</p>
                <p className="text-xs text-gray-400">{displayLang === "ko" ? "맞춤 배경화면 3장 (1080×2340)" : "3 custom wallpapers (1080×2340)"}</p>
              </div>
            </div>
            <p className="text-2xl font-black text-indigo-300 flex-shrink-0 ml-3">{PRICES.mobile}</p>
          </button>

          {/* 상품 2: 보고서 단품 */}
          <button type="button" onClick={() => setProductType("report")}
            className={`w-full py-4 px-4 rounded-xl border transition flex items-center justify-between ${
              productType === "report"
                ? "bg-indigo-600/30 border-indigo-400/60 shadow-lg shadow-indigo-900/30"
                : "bg-white/5 border-white/10 hover:border-white/20"
            }`}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">②</span>
              <div className="text-left">
                <p className="font-bold text-sm">{displayLang === "ko" ? "📋 상세 보고서" : "📋 Full Saju Report"}</p>
                <p className="text-xs text-gray-400">{displayLang === "ko" ? "심화 사주 분석 PDF (용신·대운·직업)" : "In-depth PDF (Yongshin, fortune, career)"}</p>
              </div>
            </div>
            <p className="text-2xl font-black text-indigo-300 flex-shrink-0 ml-3">{PRICES.report}</p>
          </button>

          {/* 상품 3: 패키지 (강조) */}
          <button type="button" onClick={() => setProductType("bundle")}
            className={`w-full py-4 px-4 rounded-xl border-2 transition relative overflow-hidden ${
              productType === "bundle"
                ? "bg-gradient-to-r from-amber-600/30 to-orange-600/20 border-amber-400/70 shadow-lg shadow-amber-900/30"
                : "bg-amber-950/20 border-amber-500/30 hover:border-amber-400/50"
            }`}>
            <span className="absolute top-2 right-2 text-[10px] bg-gradient-to-r from-amber-500 to-orange-500 text-white px-2.5 py-0.5 rounded-full font-bold">
              {displayLang === "ko" ? "🔥 베스트" : "🔥 Best Value"}
            </span>
            <div className="flex items-center justify-between pr-16">
              <div className="flex items-center gap-3">
                <span className="text-2xl">③</span>
                <div className="text-left">
                  <p className="font-bold text-sm text-amber-200">{displayLang === "ko" ? "🎁 배경화면 + 상세 보고서" : "🎁 Wallpaper + Full Report"}</p>
                  <p className="text-xs text-gray-400">{displayLang === "ko" ? "①+② 묶음 · ₩1,900 할인" : "①+② Bundle · ₩1,900 off"}</p>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-2xl font-black text-amber-300">₩9,900</p>
                <p className="text-[10px] text-gray-500 line-through">{displayLang === "ko" ? "₩11,800 상당" : "Worth ₩11,800"}</p>
              </div>
            </div>
          </button>

          {/* 별조각 보유 현황 */}
          <div className="rounded-xl p-3 flex items-center justify-between" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
            <div className="flex items-center gap-2">
              <span className="text-lg">✨</span>
              <div>
                <p className="text-[11px]" style={{ color: "#a78bfa" }}>{displayLang === "ko" ? "내 별조각" : "My Star Pieces"}</p>
                <p className="text-sm font-black text-white">{blueberries.toLocaleString()}개</p>
              </div>
            </div>
            <p className="text-xs font-bold" style={{ color: canAffordBb ? "#a78bfa" : "#f87171" }}>
              {displayLang === "ko" ? "필요" : "Need"} {bbPrice.toLocaleString()}개
            </p>
          </div>

          {bbError && (
            <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{bbError}</p>
          )}

          {/* 결제 버튼들 */}
          <div className="space-y-2 pt-1">
            <button
              onClick={handleBlueberryPayment}
              disabled={bbLoading || !canAffordBb}
              className="w-full py-4 rounded-xl font-black text-base transition-all active:scale-[0.98] disabled:opacity-40"
              style={{
                background: canAffordBb ? "linear-gradient(135deg, #6366f1, #818cf8)" : "rgba(99,102,241,0.3)",
                color: "#fff",
                boxShadow: canAffordBb ? "0 6px 24px rgba(99,102,241,0.4)" : "none",
              }}>
              ✨ {displayLang === "ko" ? `별조각 ${bbPrice.toLocaleString()}개로 결제` : `Pay with ${bbPrice.toLocaleString()} Star Pieces`}
              {!canAffordBb && <span className="text-xs ml-1 opacity-70">{displayLang === "ko" ? "(부족)" : "(insufficient)"}</span>}
            </button>
            {!canAffordBb && (
              <button
                onClick={() => router.push("/charge")}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: "#a78bfa" }}>
                ✨ {displayLang === "ko" ? "별조각 충전하기" : "Charge Star Pieces"}
              </button>
            )}
            <button
              onClick={() => router.push(`/payment?orderId=${data.orderId}&productType=${productType}&amount=${PRICE_AMOUNTS[productType]}`)}
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:scale-[0.98] text-white font-bold py-4 rounded-xl transition-all text-base shadow-lg shadow-indigo-900/40">
              {displayLang === "ko" ? "💳 신용/체크카드로 결제" : "💳 Pay by Card"}
            </button>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => router.push(`/payment?orderId=${data.orderId}&productType=${productType}&amount=${PRICE_AMOUNTS[productType]}&method=tosspay`)}
                className="w-full font-bold py-3.5 rounded-xl transition active:scale-[0.98] text-sm flex items-center justify-center gap-1.5"
                style={{ backgroundColor: "#0064FF", color: "#fff" }}>
                <span className="font-black text-base">T</span>
                {displayLang === "ko" ? "토스페이" : "Toss Pay"}
              </button>
              <button
                onClick={() => router.push(`/payment?orderId=${data.orderId}&productType=${productType}&amount=${PRICE_AMOUNTS[productType]}&method=kakaopay`)}
                className="w-full font-bold py-3.5 rounded-xl transition active:scale-[0.98] text-sm"
                style={{ backgroundColor: "#FEE500", color: "#191919" }}>
                💛 {displayLang === "ko" ? "카카오페이" : "KakaoPay"}
              </button>
            </div>
          </div>

          <p className="text-[11px] text-gray-700 text-center leading-relaxed">
            {displayLang === "ko"
              ? "디지털 콘텐츠 특성상 다운로드 후 환불 불가 · 이용약관 · 환불정책"
              : "No refunds after download · Terms · Refund Policy"}
          </p>
        </div>
        </FadeIn>

        {/* 하단 여백 + 홈으로 */}
        <div className="text-center pt-4 pb-4 flex flex-col items-center gap-3">
          <a
            href="http://pf.kakao.com/_cuksX"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-yellow-600/70 hover:text-yellow-400/80 transition flex items-center gap-1"
          >
            💬 카카오 채널 문의
          </a>
          <button onClick={() => router.push("/")}
            className="text-xs text-gray-700 hover:text-gray-500 transition">
            {displayLang === "ko" ? "← AI Studio 홈으로" : "← Back to AI Studio"}
          </button>
        </div>

      </div>
    </main>
  );
}

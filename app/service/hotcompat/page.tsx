"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/components/BackButton";
import StarShower from "@/components/StarShower";
import { analyzeSaju, type SajuResult, isGanyeoJidong, GANYEO_JIDONG_LOVE, WONJIN_PAIRS } from "@/lib/saju";
import AnalysisLoading from "@/components/AnalysisLoading";
import BirthInputForm, { BirthFormData, defaultBirthData } from "@/components/BirthInputForm";
import ResultFooterActions from "@/components/ResultFooterActions";

export const dynamic = "force-dynamic";

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={className} style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(18px)", transition: `opacity 0.8s ease ${delay}ms, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

// ── 오행/음양 매핑 ───────────────────────────────────────────────────────────
const CHEONGAN_ELEMENT: Record<string, string> = {
  갑:"목", 을:"목", 병:"화", 정:"화", 무:"토", 기:"토", 경:"금", 신:"금", 임:"수", 계:"수"
};
const JIJI_ELEMENT: Record<string, string> = {
  자:"수", 축:"토", 인:"목", 묘:"목", 진:"토", 사:"화", 오:"화", 미:"토", 신:"금", 유:"금", 술:"토", 해:"수"
};
const JIJI_EUMYANG: Record<string, "양"|"음"> = {
  자:"양", 인:"양", 진:"양", 오:"양", 신:"양", 술:"양",
  축:"음", 묘:"음", 사:"음", 미:"음", 유:"음", 해:"음"
};
const CHEONGAN_EUMYANG: Record<string, "양"|"음"> = {
  갑:"양", 병:"양", 무:"양", 경:"양", 임:"양",
  을:"음", 정:"음", 기:"음", 신:"음", 계:"음"
};

// ── 천간합 ───────────────────────────────────────────────────────────────────
const CHEONGAN_HAP_MAP: Record<string, { partner: string; name: string; hanja: string; desc: string; score: number }> = {
  갑: { partner: "기", name: "갑기합", hanja: "甲己合", desc: "중정지합(中正之合) — 가장 안정적이고 바른 결합. 성적으로 지속적인 깊은 화합.", score: 20 },
  을: { partner: "경", name: "을경합", hanja: "乙庚合", desc: "인의지합(仁義之合) — 부드러운 덩굴과 강한 금속의 결합. 부드러움이 강함을 감아드는 케미.", score: 15 },
  병: { partner: "신", name: "병신합", hanja: "丙辛合", desc: "위제지합(威制之合) — 강렬한 화(火)와 금(金)의 만남. 지배·복종의 에너지. 뜨겁고 강렬한 끌림.", score: 25 },
  정: { partner: "임", name: "정임합", hanja: "丁壬合", desc: "음란지합(淫亂之合) — 사주에서 성적 화합이 가장 강한 합. 촛불과 깊은 강물의 결합. 거부 불가능한 끌림.", score: 40 },
  무: { partner: "계", name: "무계합", hanja: "戊癸合", desc: "무정지합(無情之合) — 겉은 차갑지만 속이 뜨거운 조합. 표현하지 않지만 강한 내면의 끌림.", score: 20 },
  기: { partner: "갑", name: "갑기합", hanja: "甲己合", desc: "중정지합(中正之合) — 가장 안정적이고 바른 결합. 기토(己)가 갑목(甲)의 뿌리를 품어주는 구조라, 돌봄과 안정을 주는 관계에서 성적 신뢰와 편안함이 자연스럽게 형성됩니다.", score: 20 },
  경: { partner: "을", name: "을경합", hanja: "乙庚合", desc: "인의지합(仁義之合) — 부드러운 을목이 강한 경금을 감아드는 케미. 강함이 부드러움에 무너지는 구조라, 을목이 주도적으로 접근하면 경금이 의외로 쉽게 녹습니다.", score: 15 },
  신: { partner: "병", name: "병신합", hanja: "丙辛合", desc: "위제지합(威制之合) — 병화의 강렬한 열기가 신금을 달구는 지배·복종 케미. 신금의 차가운 도도함이 병화의 기운에 서서히 무너지는 구조라, 처음엔 밀고 당기다 결국 서로에게 강하게 끌리게 됩니다.", score: 25 },
  임: { partner: "정", name: "정임합", hanja: "丁壬合", desc: "음란지합(淫亂之合) — 사주에서 성적 화합이 가장 강한 합. 촛불(丁)과 큰 강(壬)이 만나 서로를 완전히 채워주는 구조라, 본능적으로 끌리고 떨어지기 어려운 인연이 됩니다.", score: 40 },
  계: { partner: "무", name: "무계합", hanja: "戊癸合", desc: "무정지합(無情之合) — 겉은 차갑지만 속이 뜨거운 조합. 계수의 빗물이 무토의 광활한 땅에 스며드는 구조라, 표면적으로는 담담해 보여도 내면에서 강한 연결감과 의존이 형성됩니다.", score: 20 },
};

// 지지 육합
const JIJI_YUKHAP_LIST: { a: string; b: string; name: string; result: string; desc: string; score: number }[] = [
  { a: "자", b: "축", name: "자축합(子丑合)", result: "토(土)", desc: "음습한 물과 단단한 흙이 만나 끈끈하게 엉겨 붙는 합. 한번 붙으면 잘 떨어지지 않는, 가장 안정적이고 깊은 신체적 밀착감을 줍니다.", score: 50 },
  { a: "인", b: "해", name: "인해합(寅亥合)", result: "목(木)", desc: "큰 나무가 깊은 물에 뿌리내리는 합. 서로를 키워주고 감싸주는 따뜻하고 다정한 스킨십 케미입니다.", score: 48 },
  { a: "묘", b: "술", name: "묘술합(卯戌合)", result: "화(火)", desc: "도화의 묘와 강한 술이 만나 불을 피우는 합. 보면 볼수록 불타오르는 강한 매력과 집착에 가까운 끌림.", score: 50 },
  { a: "진", b: "유", name: "진유합(辰酉合)", result: "금(金)", desc: "흙과 보석이 서로를 빛나게 하는 합. 서로의 가치를 알아봐주며 깊이 신뢰하는 끈끈한 궁합.", score: 45 },
  { a: "사", b: "신", name: "사신합(巳申合)", result: "수(水)", desc: "합이면서 동시에 형(刑)의 성질도 품은 애증의 합. 밀고 당기는 자극이 강하고, 한번 엮이면 쉽게 못 끊어내는 운명적 케미.", score: 47 },
  { a: "오", b: "미", name: "오미합(午未合)", result: "화(火)", desc: "뜨거운 태양과 그것을 품는 대지의 합. 정서적으로도 육체적으로도 서로에게 가장 따뜻하게 녹아드는 궁합입니다.", score: 49 },
];

const JIJI_CHUNG_LIST: { a: string; b: string; name: string; desc: string; score: number }[] = [
  { a: "자", b: "오", name: "자오충(子午沖)", desc: "극과 극의 전기 케미. 차가운 물(水)과 뜨거운 불(火)의 충돌. 거부할 수 없는 강렬한 자극. 함께 있으면 항상 짜릿합니다.", score: 35 },
  { a: "묘", b: "유", name: "묘유충(卯酉沖)", desc: "두 도화살 지지의 충돌. 서로의 매력을 끊임없이 자극합니다. 보기만 해도 끌리는 섹시한 긴장감.", score: 28 },
  { a: "진", b: "술", name: "진술충(辰戌沖)", desc: "두 창고 기운이 맞부딪히는 충이라, 품어두었던 에너지가 폭발합니다. 갈등 속에서도 강하게 끌리는 에너지라 싸우고 화해하는 과정에서 오히려 더 깊이 엮이는 경우가 많아요.", score: 20 },
  { a: "사", b: "해", name: "사해충(巳亥沖)", desc: "사(巳)의 뜨거운 불기운과 해(亥)의 깊은 물기운이 정면으로 맞서는 구조예요. 극과 극이 강하게 당기는 케미라 처음 만나는 순간부터 묘하게 시선이 끌리고, 쉽게 인연을 끊기 어려운 자력이 있습니다.", score: 20 },
  { a: "인", b: "신", name: "인신충(寅申沖)", desc: "나무(寅)와 금속(申)의 충돌. 서로 강하게 흔들어 깨우는 관계라, 만날 때마다 새로운 자극을 주고받으며 쉽게 지루해지지 않아요.", score: 15 },
  { a: "축", b: "미", name: "축미충(丑未沖)", desc: "같은 토(土) 기운끼리의 마찰. 처음엔 비슷해 보이다 가까워질수록 미묘한 결이 다름을 느끼게 됩니다. 지루하지 않게 적당한 긴장감을 유지하는 조합이에요.", score: 12 },
];

// ── 천간×지지 조합 분석 ──────────────────────────────────────────────────────
interface CgJjCombo {
  cg_rel: "합"|"충"|"비견"|"기타";
  jj_rel: "육합"|"삼합"|"충"|"기타";
  combo_title: string;
  combo_desc: string;
  score_mod: number;
}

function analyzeCheonganJiji(ig1: string, ij1: string, ig2: string, ij2: string): CgJjCombo {
  const cgHap = CHEONGAN_HAP_MAP[ig1]?.partner === ig2;
  const cgChung = (["갑경","경갑","을신","신을","병임","임병","정계","계정"] as string[])
    .includes(ig1 + ig2);
  const cgBigyeon = CHEONGAN_ELEMENT[ig1] === CHEONGAN_ELEMENT[ig2];

  const jjYukhap = JIJI_YUKHAP_LIST.some(y => (ij1===y.a&&ij2===y.b)||(ij1===y.b&&ij2===y.a));
  const jjChung = JIJI_CHUNG_LIST.some(c => (ij1===c.a&&ij2===c.b)||(ij1===c.b&&ij2===c.a));
  const SAMHAP: string[][] = [["인","오","술"],["신","자","진"],["해","묘","미"],["사","유","축"]];
  const jjSamhap = SAMHAP.some(g => g.includes(ij1) && g.includes(ij2));

  const cg_rel: "합"|"충"|"비견"|"기타" = cgHap ? "합" : cgChung ? "충" : cgBigyeon ? "비견" : "기타";
  const jj_rel: "육합"|"삼합"|"충"|"기타" = jjYukhap ? "육합" : jjChung ? "충" : jjSamhap ? "삼합" : "기타";

  if (cg_rel === "합" && jj_rel === "육합") {
    return { cg_rel, jj_rel, score_mod: 25,
      combo_title: "천간합 × 일지 육합 — 완벽한 조화",
      combo_desc: "머리로도, 몸으로도 완벽하게 통하는 조합이에요. 천간에서 서로를 향한 끌림이 강하고, 일지에서도 끈끈하게 밀착되는 구조라 자연스럽게 깊이 녹아들게 됩니다. 이 조합은 100점을 받는 게 어려운 일이 아니에요." };
  }
  if (cg_rel === "합" && jj_rel === "삼합") {
    return { cg_rel, jj_rel, score_mod: 18,
      combo_title: "천간합 × 일지 삼합 — 열정이 넘치는 관계",
      combo_desc: "서로에게 끌리는 감정도 강하고, 에너지도 잘 통합니다. 삼합의 뜨거운 기운이 두 사람 사이를 달궈주는 아주 좋은 구조예요." };
  }
  if (cg_rel === "합" && jj_rel === "충") {
    return { cg_rel, jj_rel, score_mod: 5,
      combo_title: "천간합 × 일지 충 — 끌리지만 자극적인 관계",
      combo_desc: "마음은 강하게 끌리는데 몸의 리듬이 충돌하는 조합이에요. 잠자리에서 서로의 스타일이 달라 불만이 생길 수 있지만, 천간의 합 덕분에 감정적으로는 계속 붙어 있게 됩니다. 맞춰가는 노력이 필요하지만, 그 과정에서 더 강해지기도 해요." };
  }
  if (cg_rel === "충" && jj_rel === "육합") {
    return { cg_rel, jj_rel, score_mod: 8,
      combo_title: "천간충 × 일지 육합 — 싸우다 잠자리에서 화해하는 관계",
      combo_desc: "머리로는 맨날 싸우고 지지고 볶고 헤어지네 마네 하지만, 잠자리에서 엎치락뒤치락하다 보면 다 잊어버리는 수가 있어요. 몸이 맞는 관계라 아무리 싸워도 결국 다시 붙게 됩니다. 일지 육합의 끈끈함이 갈등을 녹여내는 구조예요." };
  }
  if (cg_rel === "충" && jj_rel === "삼합") {
    return { cg_rel, jj_rel, score_mod: 3,
      combo_title: "천간충 × 일지 삼합 — 말다툼 많지만 열정은 살아있는 관계",
      combo_desc: "말로는 자주 부딪히고 의견 충돌이 잦지만, 몸이 통하는 에너지가 있어서 쉽게 끝내지 못하는 관계예요. 열정은 꾸준히 살아있습니다." };
  }
  if (cg_rel === "충" && jj_rel === "충") {
    return { cg_rel, jj_rel, score_mod: -8,
      combo_title: "천간충 × 일지 충 — 도 아니면 모",
      combo_desc: "생각도 다르고 몸의 리듬도 충돌합니다. 이 조합은 정말 극단적이에요. 처음에 폭발적으로 끌리거나, 아니면 처음부터 전혀 맞지 않거나 둘 중 하나입니다. 잘 풀리면 서로를 완전히 바꿔놓는 강렬한 인연이 되고, 안 풀리면 서로 상처만 남기고 끝나게 됩니다. 감정의 롤러코스터가 심하고 장기 관계를 유지하려면 상당한 노력이 필요해요." };
  }
  if (cg_rel === "비견" && jj_rel === "육합") {
    return { cg_rel, jj_rel, score_mod: 12,
      combo_title: "같은 오행 × 일지 육합 — 동지이자 연인",
      combo_desc: "같은 에너지를 공유하면서 일지에서는 끈끈하게 붙는 구조예요. 친구 같은 편안함과 연인의 끌림이 공존합니다." };
  }
  if (cg_rel === "비견" && jj_rel === "충") {
    return { cg_rel, jj_rel, score_mod: -2,
      combo_title: "천간 동기 × 일지 충",
      combo_desc: "천간충처럼 격렬한 충돌은 없지만, 일지의 리듬 차이가 잠자리에서 미묘한 불만족으로 이어질 수 있어요." };
  }
  if (cg_rel === "합") {
    return { cg_rel, jj_rel, score_mod: 8,
      combo_title: "천간합 — 마음이 통하는 관계",
      combo_desc: "감정적 끌림과 정서적 유대감이 강합니다. 일지 합까지 이루어진다면 더 완벽한 조합이 될 수 있어요." };
  }
  if (cg_rel === "충") {
    return { cg_rel, jj_rel, score_mod: -3,
      combo_title: "천간충 — 끊임없이 자극하는 관계",
      combo_desc: "생각과 가치관이 자주 부딪히는 조합이에요. 지속적인 갈등 스트레스가 성적 에너지를 소모시킬 수 있습니다." };
  }
  if (jj_rel === "육합") {
    return { cg_rel, jj_rel, score_mod: 10,
      combo_title: "일지 육합 — 몸이 통하는 관계",
      combo_desc: "일지에서 끈끈하게 붙는 구조예요. 신체적 밀착감이 자연스럽게 형성됩니다." };
  }
  if (jj_rel === "충") {
    return { cg_rel, jj_rel, score_mod: -2,
      combo_title: "일지 충 — 배우자궁이 부딪히는 관계",
      combo_desc: "배우자궁이 충돌하는 구조예요. 잠자리 스타일의 차이가 생길 수 있습니다." };
  }
  return { cg_rel, jj_rel, score_mod: 0, combo_title: "", combo_desc: "" };
}

// ── 배우자궁 생극 분석 ───────────────────────────────────────────────────────
interface SaengGukResult {
  type: "상생"|"상극"|"비화";
  dir: string;
  desc: string;
  satisfactionNote: string;
}

function analyzeSaengGuk(ij1: string, ij2: string, label1: string, label2: string): SaengGukResult | null {
  const el1 = JIJI_ELEMENT[ij1];
  const el2 = JIJI_ELEMENT[ij2];
  if (!el1 || !el2) return null;
  if (el1 === el2) {
    return { type: "비화", dir: "동일 오행", desc: `두 사람의 배우자궁이 같은 ${el1} 오행이에요.`, satisfactionNote: "비슷한 에너지끼리의 만남이라 공감대가 높지만, 자극이 부족할 수 있어요." };
  }
  const SAENG: Record<string,string> = { 목:"화", 화:"토", 토:"금", 금:"수", 수:"목" };
  const GUK: Record<string,string> = { 목:"토", 토:"수", 수:"화", 화:"금", 금:"목" };
  if (SAENG[el1] === el2) {
    return { type: "상생", dir: `${label1}→${label2} 생(生)`, desc: `${label1}의 배우자궁(${el1})이 ${label2}의 배우자궁(${el2})을 생해주는 관계예요.`, satisfactionNote: `생을 받는 ${label2} 쪽이 더 편안하고 만족스럽게 느끼는 구조입니다. ${label1}은 자신이 더 많이 챙겨주는 느낌이 들 수 있어요.` };
  }
  if (SAENG[el2] === el1) {
    return { type: "상생", dir: `${label2}→${label1} 생(生)`, desc: `${label2}의 배우자궁(${el2})이 ${label1}의 배우자궁(${el1})을 생해주는 관계예요.`, satisfactionNote: `생을 받는 ${label1} 쪽이 더 보살핌 받는 느낌으로 만족도가 높습니다. ${label2}는 자연스럽게 리드하는 역할이 됩니다.` };
  }
  if (GUK[el1] === el2) {
    return { type: "상극", dir: `${label1}→${label2} 극(剋)`, desc: `${label1}의 배우자궁(${el1})이 ${label2}의 배우자궁(${el2})을 극하는 관계예요.`, satisfactionNote: `${label1}이 ${label2}를 압도하는 에너지 구조예요. 이 긴장감이 성적 자극이 되기도 하지만, 장기적으로 ${label2}에게 부담이 쌓일 수 있어요.` };
  }
  if (GUK[el2] === el1) {
    return { type: "상극", dir: `${label2}→${label1} 극(剋)`, desc: `${label2}의 배우자궁(${el2})이 ${label1}의 배우자궁(${el1})을 극하는 관계예요.`, satisfactionNote: `${label2}가 ${label1}을 리드하고 압도하는 에너지 구조예요. 강한 리드가 끌림이 되기도 하지만, 장기적으로 ${label1}에게 부담이 쌓일 수 있어요.` };
  }
  return null;
}

// ── 개인 음양/수기운/성욕 분석 ──────────────────────────────────────────────
interface LibidoResult {
  waterStrong: boolean;
  yinyang: "양기 강함"|"음기 강함"|"균형";
  libidomsg: string;
  gwanSalWarning: string | null;
}

function analyzeLibido(r: SajuResult, gender: "male"|"female"): LibidoResult {
  const pd = r.pillarsDetail;
  const allJijis = [pd.year.jj, pd.month.jj, pd.day.jj, pd.hour?.jj].filter(Boolean) as string[];
  const allCgs = [pd.year.cg, pd.month.cg, pd.day.cg, pd.hour?.cg].filter(Boolean) as string[];
  const waterCount = allJijis.filter(j => JIJI_ELEMENT[j] === "수").length
    + allCgs.filter(c => CHEONGAN_ELEMENT[c] === "수").length;
  const waterStrong = waterCount >= 2;

  const yangCount = allJijis.filter(j => JIJI_EUMYANG[j] === "양").length
    + allCgs.filter(c => CHEONGAN_EUMYANG[c] === "양").length;
  const yinCount = allJijis.filter(j => JIJI_EUMYANG[j] === "음").length
    + allCgs.filter(c => CHEONGAN_EUMYANG[c] === "음").length;
  const yinyang: "양기 강함"|"음기 강함"|"균형" =
    yangCount > yinCount + 1 ? "양기 강함" : yinCount > yangCount + 1 ? "음기 강함" : "균형";

  // 관성 과다 체크
  const allSip = [pd.year.sipseongCg, pd.month.sipseongCg, pd.day.sipseongCg, pd.hour?.sipseongCg,
                  pd.year.sipseongJj, pd.month.sipseongJj, pd.day.sipseongJj, pd.hour?.sipseongJj]
                 .filter(Boolean) as string[];
  const gwanCount = allSip.filter(s => s.includes("관") || s.includes("살")).length;
  const gwanSalWarning = gwanCount >= 3 && gender === "male"
    ? "조직·규율에 얽매이는 기운이 많아 스트레스를 많이 받는 구조예요. 심리적 압박이 클 때 성욕이 감퇴하거나 발기부전 같은 문제가 나타날 수 있어요. 스트레스 관리가 성생활에도 직결됩니다."
    : null;

  let libidomsg = "";
  if (gender === "female") {
    if (waterStrong) {
      libidomsg = "수(水) 기운이 강해 자연스러운 색기와 감각적 매력이 있어요. 성적 감수성이 풍부하고 관능적인 분위기를 풍기는 타입입니다.";
    } else if ((r.lacking ?? []).includes("수")) {
      libidomsg = "수(水) 기운이 부족한 구조라 성욕이 잘 일어나지 않거나 감각적인 면이 다소 건조하게 느껴질 수 있어요.";
    } else {
      libidomsg = "균형 잡힌 성적 에너지를 가지고 있어요.";
    }
  } else {
    if (gwanSalWarning) {
      libidomsg = "조직·규율에 얽매이는 기운이 많은 구조라 외부 스트레스에 민감해요. 성욕이 심리 상태에 크게 영향을 받는 타입입니다.";
    } else if (waterStrong) {
      libidomsg = "수(水) 기운이 강해 성적 에너지와 욕구가 충분합니다.";
    } else if ((r.lacking ?? []).includes("수")) {
      libidomsg = "수(水) 기운이 약해 성적 에너지가 다소 부족한 구조예요.";
    } else {
      libidomsg = "균형 잡힌 성적 에너지를 가지고 있어요.";
    }
  }

  return { waterStrong, yinyang, libidomsg, gwanSalWarning };
}

// ── 섹스리스 위험도 ──────────────────────────────────────────────────────────
function checkSexlessRisk(r1: SajuResult, r2: SajuResult, g1: "male"|"female", g2: "male"|"female"): string | null {
  const rF = g1 === "female" ? r1 : r2;
  const rM = g1 === "male" ? r1 : r2;
  const pdF = rF.pillarsDetail;
  const pdM = rM.pillarsDetail;

  const sipF = [pdF.year.sipseongCg, pdF.month.sipseongCg, pdF.day.sipseongCg, pdF.hour?.sipseongCg,
                pdF.year.sipseongJj, pdF.month.sipseongJj, pdF.day.sipseongJj, pdF.hour?.sipseongJj].filter(Boolean) as string[];
  const sipM = [pdM.year.sipseongCg, pdM.month.sipseongCg, pdM.day.sipseongCg, pdM.hour?.sipseongCg,
                pdM.year.sipseongJj, pdM.month.sipseongJj, pdM.day.sipseongJj, pdM.hour?.sipseongJj].filter(Boolean) as string[];

  const femaleHasJae = sipF.some(s => s.includes("재"));
  const maleGwanCount = sipM.filter(s => s.includes("관") || s.includes("살")).length;
  const maleSiksangCount = sipM.filter(s => s.includes("식") || s.includes("상")).length;

  if (!femaleHasJae && maleGwanCount >= 3) {
    return "여성에게 활동적인 재물 기운이 없고 남성에게는 조직·규율에 얽매이는 기운이 많은 조합이에요. 여성은 성적 욕구가 잘 일어나지 않고, 남성은 스트레스로 인한 성욕 감퇴가 생기기 쉬운 구조입니다. 두 사람 모두 솔직한 대화가 필요해요.";
  }
  if (!femaleHasJae && maleSiksangCount === 0) {
    return "여성의 활동적인 재물 기운도, 남성의 표현력·창의성 기운도 사주에서 잘 보이지 않는 구조예요. 남녀 모두 성적인 욕구 표현이 적고 잠자리에 대한 관심 자체가 낮을 수 있어요. 서로 비슷하게 담백한 관계가 될 가능성이 높지만, 점차 섹스리스로 흐르기 쉽습니다.";
  }
  return null;
}

// ── ChemResult 인터페이스 ────────────────────────────────────────────────────
interface ChemResult {
  score: number;
  highlights: { rank: number; title: string; desc: string; color: string }[];
  hapName: string | null;
  hapDesc: string | null;
  chungName: string | null;
  chungDesc: string | null;
  cgJjCombo: CgJjCombo;
}

function calcChem(r1: SajuResult, r2: SajuResult): ChemResult {
  const ig1 = r1.pillarsDetail.day.cg;
  const ig2 = r2.pillarsDetail.day.cg;
  const ij1 = r1.pillarsDetail.day.jj;
  const ij2 = r2.pillarsDetail.day.jj;
  const mg1 = r1.pillarsDetail.month.cg;
  const mg2 = r2.pillarsDetail.month.cg;
  const mj1 = r1.pillarsDetail.month.jj;
  const mj2 = r2.pillarsDetail.month.jj;
  const yj1 = r1.pillarsDetail.year.jj;
  const yj2 = r2.pillarsDetail.year.jj;

  let score = 0;
  const highlights: ChemResult["highlights"] = [];
  let hapName: string | null = null;
  let hapDesc: string | null = null;
  let chungName: string | null = null;
  let chungDesc: string | null = null;

  // 천간×지지 조합
  const cgJjCombo = analyzeCheonganJiji(ig1, ij1, ig2, ij2);
  score += cgJjCombo.score_mod;

  // 0순위: 일지 육합
  for (const y of JIJI_YUKHAP_LIST) {
    if ((ij1 === y.a && ij2 === y.b) || (ij1 === y.b && ij2 === y.a)) {
      score += y.score;
      highlights.push({ rank: 0, title: `일지 ${y.name} → ${y.result}`, color: "#fb7185", desc: y.desc });
      if (!hapName) { hapName = y.name; hapDesc = y.desc; }
      break;
    }
  }

  // 1순위: 정임암합 정점
  const isAmhap = (
    (ig1 === "정" && ij1 === "해" && ig2 === "임" && ij2 === "오") ||
    (ig2 === "정" && ij2 === "해" && ig1 === "임" && ij1 === "오")
  );
  if (isAmhap) {
    score += 60;
    highlights.push({ rank: 1, title: "정임암합(丁亥+壬午) — 최강", color: "#f43f5e",
      desc: "사주에서 가장 강렬한 성적 암합. 丁亥일주와 壬午일주의 만남은 천간에서 丁壬합이 이루어지고, 지지에서도 亥-午의 에너지 교류가 형성됩니다. 거부할 수 없는 인연." });
    hapName = "정임암합(丁亥+壬午)";
    hapDesc = "음란지합(淫亂之合) 중 가장 극적인 조합.";
  }

  // 2순위: 자오충 일지
  const isJaOChung = (ij1 === "자" && ij2 === "오") || (ij1 === "오" && ij2 === "자");
  if (isJaOChung) {
    score += 35;
    const c = JIJI_CHUNG_LIST[0];
    highlights.push({ rank: 2, title: c.name, color: "#f97316", desc: c.desc });
    if (!chungName) { chungName = c.name; chungDesc = c.desc; }
  }

  // 3순위: 천간합 (일간)
  const hap = CHEONGAN_HAP_MAP[ig1];
  if (hap && hap.partner === ig2) {
    score += hap.score;
    highlights.push({ rank: 3, title: `일간 ${hap.hanja} ${hap.name}`, color: "#ec4899", desc: hap.desc });
    if (!hapName) { hapName = hap.name; hapDesc = hap.desc; }
  }

  // 4순위: 삼합 화국
  const allJijis = [ij1, ij2, mj1, mj2, yj1, yj2];
  const hasIn = allJijis.includes("인"), hasO = allJijis.includes("오"), hasSul = allJijis.includes("술");
  if (hasIn && hasO && hasSul) {
    score += 18;
    highlights.push({ rank: 4, title: "인오술합(寅午戌) 화국", color: "#fbbf24",
      desc: "두 사람의 사주에서 삼합 화국이 형성됩니다. 뜨거운 열정과 강렬한 에너지가 함께 타오릅니다." });
  }

  // 기타 지지충 (일지)
  for (const c of JIJI_CHUNG_LIST.slice(1)) {
    if ((ij1 === c.a && ij2 === c.b) || (ij1 === c.b && ij2 === c.a)) {
      score += c.score;
      highlights.push({ rank: 5, title: `일지 ${c.name}`, color: "#a855f7", desc: c.desc });
      if (!chungName) { chungName = c.name; chungDesc = c.desc; }
    }
  }

  // 월간 합
  const hapM = CHEONGAN_HAP_MAP[mg1];
  if (hapM && hapM.partner === mg2 && !(hap && hap.partner === ig2)) {
    score += Math.floor(hapM.score * 0.4);
    highlights.push({ rank: 6, title: `월간 ${hapM.hanja} ${hapM.name}`, color: "#8b5cf6",
      desc: `사회적 이미지에서도 ${hapM.name}이 형성됩니다. 공개적인 케미도 강합니다.` });
  }

  // 신살
  const SINSAL_NAMES = ["도화살","진도화","나체도화","곤랑도화","녹방도화","홍염살","년살","목욕"];
  const ss1 = r1.sinsalList.filter(s => SINSAL_NAMES.includes(s.name)).map(s => s.name);
  const ss2 = r2.sinsalList.filter(s => SINSAL_NAMES.includes(s.name)).map(s => s.name);
  const hasSinsal1 = ss1.length > 0;
  const hasSinsal2 = ss2.length > 0;
  if (hasSinsal1 || hasSinsal2) {
    score += hasSinsal1 && hasSinsal2 ? 15 : 8;
    const who = hasSinsal1 && hasSinsal2 ? "양쪽 모두" : hasSinsal1 ? "한쪽(여)" : "한쪽(남)";
    const list1 = ss1.join("·");
    const list2 = ss2.join("·");
    const sinsalDesc = hasSinsal1 && hasSinsal2
      ? `여성(${list1}), 남성(${list2}) — 두 사람 모두 속궁합에 영향을 주는 신살이 있어요. 서로의 매력을 더 강하게 느끼는 구조예요.`
      : hasSinsal1
      ? `여성에게 ${list1}이 있어요. 상대가 이 사람에게 강하게 끌리는 구조가 만들어져요.`
      : `남성에게 ${list2}이 있어요. 상대가 이 사람에게 강하게 끌리는 구조가 만들어져요.`;
    highlights.push({ rank: 7, title: `${who} 속궁합 관련 신살 보유`, color: "#6366f1", desc: sinsalDesc });
  }

  // 간여지동
  const g1 = isGanyeoJidong(ig1, ij1);
  const g2 = isGanyeoJidong(ig2, ij2);
  if ((g1 || g2) && (hapName || highlights.some(h => h.rank <= 4))) {
    score += 6;
    highlights.push({ rank: 9, title: `${g1 && g2 ? "두 사람 모두" : "한쪽이"} 간여지동 — 합으로 매력 발현`, color: "#f472b6",
      desc: GANYEO_JIDONG_LOVE.hapTrigger });
  }

  // 원진
  const hj1 = r1.pillarsDetail.hour?.jj;
  const hj2 = r2.pillarsDetail.hour?.jj;
  const samePos: [string | undefined, string | undefined, string][] = [
    [yj1, yj2, "연지"], [mj1, mj2, "월지"], [ij1, ij2, "일지"], [hj1, hj2, "시지"],
  ];
  for (const [a, b, label] of samePos) {
    if (!a || !b) continue;
    if (WONJIN_PAIRS.some(([p, q]) => (p === a && q === b) || (p === b && q === a))) {
      score -= 8;
      highlights.push({ rank: 10, title: `${label} ${a}${b} 원진(怨嗔)`, color: "#c084fc",
        desc: "끌림은 있지만 사소한 말이나 행동에도 서운함과 원망이 쌓이기 쉬운 조합입니다. 서로의 가치관 차이를 인정하고 직접 대화로 풀어내는 노력이 필요해요." });
    }
  }

  highlights.sort((a, b) => a.rank - b.rank);
  return { score: Math.min(score, 100), highlights, hapName, hapDesc, chungName, chungDesc, cgJjCombo };
}

// ── 등급 ─────────────────────────────────────────────────────────────────────
const GRADES = [
  { min: 95, grade: "SS", label: "전생 연인", color: "#f43f5e", bg: "rgba(244,63,94,0.18)", border: "rgba(244,63,94,0.40)",
    verdict: "사주에 새겨진 인연입니다. 몇 세기를 돌아도 다시 만날 수밖에 없는 구조예요. 이 정도 조합은 매우 드뭅니다." },
  { min: 75, grade: "S",  label: "폭발적 케미", color: "#ec4899", bg: "rgba(236,72,153,0.14)", border: "rgba(236,72,153,0.32)",
    verdict: "강렬한 성적 끌림이 사주에 뚜렷하게 나타납니다. 처음 만나는 순간부터 이유 없이 자꾸 생각나는 타입이에요." },
  { min: 60, grade: "A+", label: "환장 케미", color: "#f97316", bg: "rgba(249,115,22,0.12)", border: "rgba(249,115,22,0.28)",
    verdict: "서로에게 빠져들 수밖에 없는 궁합이에요. 화학적 반응이 강하게 일어나는 조합이라, 함께하는 시간이 길어질수록 더 깊이 끌립니다." },
  { min: 45, grade: "A",  label: "강한 끌림", color: "#a855f7", bg: "rgba(168,85,247,0.12)", border: "rgba(168,85,247,0.28)",
    verdict: "성적 화합이 강합니다. 억지로 맞추지 않아도 자연스럽게 이끌리고, 함께할수록 리듬이 맞아들어가는 느낌이 있어요." },
  { min: 30, grade: "B",  label: "좋은 케미", color: "#8b5cf6", bg: "rgba(139,92,246,0.10)", border: "rgba(139,92,246,0.24)",
    verdict: "잘 맞는 케미입니다. 처음에는 평균처럼 느껴질 수 있지만, 함께하는 시간이 늘수록 서로에게 더 편안하고 깊어지는 관계예요." },
  { min: 18, grade: "C",  label: "보통 케미", color: "#6366f1", bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.20)",
    verdict: "노력과 이해가 필요합니다. 본능적인 끌림보다는 서로를 알아가면서 만들어가는 케미예요. 감정적 교감이 쌓이면 더 나아질 수 있습니다." },
  { min: 8,  grade: "D",  label: "화합 약함", color: "#4f46e5", bg: "rgba(79,70,229,0.07)", border: "rgba(79,70,229,0.18)",
    verdict: "성적 기운의 방향이 많이 다릅니다. 서로의 속도와 표현 방식이 잘 맞지 않아 불만이 쌓이기 쉬운 구조예요. 솔직한 대화가 필수입니다." },
  { min: 0,  grade: "F",  label: "섹스리스 위험", color: "#64748b", bg: "rgba(100,116,139,0.07)", border: "rgba(100,116,139,0.18)",
    verdict: "서로의 성적 에너지가 잘 연결되지 않는 구조입니다. 관계를 유지하려면 성적인 부분 외의 정서적 교감과 배려에 집중하는 것이 현실적인 방법이에요." },
];

function getGrade(score: number) { return GRADES.find(g => score >= g.min) ?? GRADES[GRADES.length - 1]; }

const BOOST_TIP: Record<string, { icon: string; color: string; tip: string }> = {
  목: { icon: "🌿", color: "#16a34a", tip: "스킨십 전 가벼운 산책이나 스트레칭으로 몸을 풀어보세요. 초록색 침구·조명을 더하면 긴장이 풀리고 분위기가 부드러워집니다." },
  화: { icon: "🔥", color: "#dc2626", tip: "조명을 따뜻한 톤(주황·붉은 계열)으로 바꾸고, 음악이나 대화로 분위기를 먼저 달궈보세요. 화 기운이 보강되면 표현력과 열정이 살아납니다." },
  토: { icon: "🏔️", color: "#92400e", tip: "급하게 진행하지 말고 충분한 스킨십과 대화로 신뢰를 먼저 쌓으세요. 안정감이 채워질수록 케미가 깊어집니다." },
  금: { icon: "⚔️", color: "#7c3aed", tip: "정리된 침실, 깨끗한 향(은은한 향수·디퓨저)을 더하면 집중도가 올라갑니다. 금 기운 보강은 절제된 긴장감을 만들어 매력을 키웁니다." },
  수: { icon: "🌊", color: "#0369a1", tip: "샤워나 목욕 등 물과 관련된 시간을 함께 가져보세요. 어둡고 차분한 조명, 충분한 수분 섭취가 수 기운을 채워 감성적 케미를 끌어올립니다." },
};

// ── 메인 ─────────────────────────────────────────────────────────────────────
function HotCompatContent() {
  const router = useRouter();
  const [step, setStep] = useState<"entry" | "form" | "loading" | "result">("entry");
  const [p1, setP1] = useState<BirthFormData>(defaultBirthData("female"));
  const [p2, setP2] = useState<BirthFormData>(defaultBirthData("male"));
  const [isPaid, setIsPaid] = useState(false);
  const [blueberries, setBlueberries] = useState(0);
  const [showering, setShowering] = useState(false);
  const chemRef = useRef<ChemResult | null>(null);
  const r1Ref   = useRef<SajuResult | null>(null);
  const r2Ref   = useRef<SajuResult | null>(null);

  useEffect(() => {
    const isAdmin = localStorage.getItem("sp_admin") === "true";
    setIsPaid(isAdmin || localStorage.getItem("sp_hotcompat_paid") === "true");
    const bb = parseInt(localStorage.getItem("sp_blueberries") ?? "0", 10);
    setBlueberries(isNaN(bb) ? 0 : bb);
  }, []);

  async function handleAnalyze() {
    let y1 = p1.birthYear === "" ? NaN : Number(p1.birthYear);
    let m1 = p1.birthMonth === "" ? NaN : Number(p1.birthMonth);
    let d1 = p1.birthDay === "" ? NaN : Number(p1.birthDay);
    let y2 = p2.birthYear === "" ? NaN : Number(p2.birthYear);
    let m2 = p2.birthMonth === "" ? NaN : Number(p2.birthMonth);
    let d2 = p2.birthDay === "" ? NaN : Number(p2.birthDay);
    if (isNaN(y1) || isNaN(m1) || isNaN(d1) || isNaN(y2) || isNaN(m2) || isNaN(d2)) return;
    if (p1.calendarType === "lunar") {
      try {
        // @ts-ignore
        const KLC = (await import("korean-lunar-calendar")).default;
        const klc = new KLC(); klc.setLunarDate(y1, m1, d1, p1.isLeapMonth);
        const sol = klc.getSolarCalendar(); if (!sol?.year) throw new Error();
        y1 = sol.year; m1 = sol.month; d1 = sol.day;
      } catch { alert("첫 번째 사람의 음력 날짜를 변환할 수 없습니다."); return; }
    }
    if (p2.calendarType === "lunar") {
      try {
        // @ts-ignore
        const KLC = (await import("korean-lunar-calendar")).default;
        const klc = new KLC(); klc.setLunarDate(y2, m2, d2, p2.isLeapMonth);
        const sol = klc.getSolarCalendar(); if (!sol?.year) throw new Error();
        y2 = sol.year; m2 = sol.month; d2 = sol.day;
      } catch { alert("두 번째 사람의 음력 날짜를 변환할 수 없습니다."); return; }
    }
    const h1 = p1.birthHour; const min1 = p1.birthMinute ?? 0;
    const h2 = p2.birthHour; const min2 = p2.birthMinute ?? 0;
    const r1 = analyzeSaju({ birthYear: y1, birthMonth: m1, birthDay: d1, birthHour: h1, birthMinute: h1 != null ? min1 : null, name: "나", gender: p1.gender, birthPlace: p1.city || "서울", style: "auto", productType: "report", useJajasi: p1.useJajasi });
    const r2 = analyzeSaju({ birthYear: y2, birthMonth: m2, birthDay: d2, birthHour: h2, birthMinute: h2 != null ? min2 : null, name: "상대", gender: p2.gender, birthPlace: p2.city || "서울", style: "auto", productType: "report", useJajasi: p2.useJajasi });
    r1Ref.current  = r1;
    r2Ref.current  = r2;
    chemRef.current = calcChem(r1, r2);
    setStep("loading");
  }

  if (step === "entry") {
    return (
      <main className="min-h-screen bg-[#08010f] text-white flex flex-col page-fade-in">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full bg-rose-950/40 blur-[160px]" />
          <div className="absolute bottom-[-20%] left-[-15%] w-[500px] h-[500px] rounded-full bg-purple-950/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-5 py-16 text-center">
          <FadeIn delay={0}>
            <div className="inline-block px-3 py-1 rounded-full bg-rose-900/50 border border-rose-700/40 text-rose-300 text-xs font-bold tracking-wider mb-8">⚠ 19금 · 보고 후회할 수 있음</div>
            <h1 className="text-3xl font-black mb-4 leading-tight tracking-tight">
              우리의<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-purple-400">속궁합은?</span>
            </h1>
          </FadeIn>
          <FadeIn delay={100}>
            <p className="text-gray-400 text-base mb-2 leading-relaxed">
              남들은 다 확인했는데<br />
              <span className="text-gray-200 font-medium">나만 모르고 있던 우리 사이의 진짜 온도</span>
            </p>
            <p className="text-gray-600 text-sm mb-12">
              친구들은 이미 다 해봤다는 그 테스트<br />
              우리 둘만 아직 모르고 있던 진짜 순위
            </p>
          </FadeIn>
          <FadeIn delay={200} className="w-full">
            <div className="w-full space-y-3 mb-10 text-left">
              {[
                ["혹시 나만 더 좋아하는 거 아닐까?", "둘 중 누가 더 끌리고 있는지, 숨겨진 온도차를 확인하세요", "#f43f5e"],
                ["남들이랑 비교하면 우리는?", "또래 평균보다 위인지 아래인지 — 보면 안심되거나, 불안해질 수 있음", "#f97316"],
                ["전 애인이랑 비교당하는 기분?", "이번엔 진짜 다른지, 데이터로 확인할 차례", "#ec4899"],
                ["같이 있을 때 그 짜릿함, 진짜였을까?", "느낌만으로는 알 수 없던 둘 사이의 폭발력 지수", "#fbbf24"],
              ].map(([title, desc, color]) => (
                <div key={title} className="flex items-start gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: color }} />
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>
          <FadeIn delay={300} className="w-full">
            <button onClick={() => setStep("form")}
              className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white shadow-lg shadow-rose-900/50 transition-all active:scale-[0.98]">
              성적 케미 분석하기
            </button>
          </FadeIn>
        </div>
      </main>
    );
  }

  if (step === "form") {
    const ready = p1.birthYear !== "" && p1.birthMonth !== "" && p1.birthDay !== "" && p2.birthYear !== "" && p2.birthMonth !== "" && p2.birthDay !== "";
    return (
      <main className="min-h-screen bg-[#08010f] text-white">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] rounded-full bg-rose-950/35 blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">두 사람 정보 입력</h2>
            <p className="text-gray-500 text-sm">생년월일만으로 성적 케미를 분석합니다</p>
          </div>
          <div className="space-y-4 mb-6">
            <BirthInputForm value={p1} onChange={setP1} label="나" accent="#f43f5e" />
            <div className="flex items-center gap-3"><div className="flex-1 h-px bg-white/10" /><span className="text-gray-600 text-xs">vs</span><div className="flex-1 h-px bg-white/10" /></div>
            <BirthInputForm value={p2} onChange={setP2} label="상대방" accent="#818cf8" />
          </div>
          <button onClick={handleAnalyze} disabled={!ready}
            className={`w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.98] ${ready ? "bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white shadow-lg shadow-rose-900/40" : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"}`}>
            성적 케미 분석하기
          </button>
        </div>
      </main>
    );
  }

  if (step === "loading") {
    return <AnalysisLoading subject="우리의 속궁합" duration={2800} onDone={() => setStep("result")}
      messages={[
        "두 사람의 합·충 관계를 대조하는 중...",
        "혹시 다른 사람이랑 더 잘 맞지 않을지 확인하는 중...",
        "이 정도면 평균 이상인지 비교하는 중...",
        "둘 중 누가 더 많이 끌리고 있는지 계산하는 중...",
      ]}
    />;
  }

  // ── 결과 ────────────────────────────────────────────────────────────────────
  const r1 = r1Ref.current;
  const r2 = r2Ref.current;
  const chem = chemRef.current;
  if (!r1 || !r2 || !chem) return null;

  const grade = getGrade(chem.score);
  const ig1 = r1.pillarsDetail.day.cg, ij1 = r1.pillarsDetail.day.jj;
  const ig2 = r2.pillarsDetail.day.cg, ij2 = r2.pillarsDetail.day.jj;

  const label1 = p1.gender === "female" ? "여성" : "남성";
  const label2 = p2.gender === "female" ? "여성" : "남성";
  const g1 = p1.gender as "male"|"female";
  const g2 = p2.gender as "male"|"female";

  const saengGuk = analyzeSaengGuk(ij1, ij2, label1, label2);
  const libido1 = analyzeLibido(r1, g1);
  const libido2 = analyzeLibido(r2, g2);
  const sexlessRisk = checkSexlessRisk(r1, r2, g1, g2);

  // 양기 강한 남자 + 음기 강한 여자 여부
  const maleLibido = g1 === "male" ? libido1 : libido2;
  const femaleLibido = g1 === "female" ? libido1 : libido2;
  const yangYinMatch = maleLibido.yinyang === "양기 강함" && femaleLibido.yinyang === "음기 강함";

  return (
    <main className="min-h-screen bg-[#08010f] text-white">
      <BackButton />
      <StarShower active={showering} />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full blur-[140px]" style={{ backgroundColor: grade.color + "18" }} />
        <div className="absolute bottom-[-20%] right-[-15%] w-[500px] h-[500px] rounded-full bg-purple-950/20 blur-[120px]" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24" id="hotcompat-result">

        {/* 헤더 */}
        <div className="text-center mb-6">
          <div className="inline-block px-2 py-0.5 rounded-full bg-rose-900/40 border border-rose-700/30 text-rose-400 text-[10px] font-bold tracking-wider mb-2">19금</div>
          <div className="flex items-center justify-center gap-4 mb-1">
            <span className="text-2xl font-black">{ig1}{ij1}일주</span>
            <span className="text-gray-600">×</span>
            <span className="text-2xl font-black">{ig2}{ij2}일주</span>
          </div>
          <p className="text-gray-600 text-xs">{r1.fourPillars} × {r2.fourPillars}</p>
        </div>

        {/* 종합 등급 */}
        <div className="rounded-2xl p-5 mb-4 border" style={{ backgroundColor: grade.bg, borderColor: grade.border }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-xs font-bold tracking-widest mb-1 block" style={{ color: grade.color }}>성적 케미 등급</span>
              <span className="text-4xl font-black" style={{ color: grade.color }}>{grade.grade}</span>
              <span className="text-lg font-bold ml-2" style={{ color: grade.color }}>{grade.label}</span>
            </div>
            <div className="text-right">
              <p className="text-2xl font-black" style={{ color: grade.color }}>{chem.score}점</p>
              <p className="text-xs text-gray-500">/ 100</p>
            </div>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2.5 mb-3">
            <div className="h-full rounded-full" style={{ width: `${chem.score}%`, background: `linear-gradient(90deg, ${grade.color}, #a855f7)` }} />
          </div>
          <p className="text-sm font-bold" style={{ color: grade.color }}>→ {grade.verdict}</p>
        </div>

        {/* 천간×지지 관계 요약 — 항상 노출 */}
        {chem.cgJjCombo.combo_title && (
          <div className="bg-white/[0.04] border border-rose-500/20 rounded-2xl p-5 mb-4">
            <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-2">배우자궁 × 일간 관계</p>
            <p className="text-sm font-black text-rose-300 mb-2">{chem.cgJjCombo.combo_title}</p>
            <p className="text-xs text-gray-400 leading-relaxed">{chem.cgJjCombo.combo_desc}</p>
          </div>
        )}

        {/* 일지·월지 관계 다이어그램 */}
        {(() => {
          const yj1 = r1.pillarsDetail.year.jj;
          const yj2 = r2.pillarsDetail.year.jj;
          const mj1 = r1.pillarsDetail.month.jj;
          const mj2 = r2.pillarsDetail.month.jj;
          const hj1 = r1.pillarsDetail.hour?.jj;
          const hj2 = r2.pillarsDetail.hour?.jj;
          const SAMHAP_GROUPS: string[][] = [["인","오","술"],["신","자","진"],["해","묘","미"],["사","유","축"]];
          const BANGSHAP_GROUPS: string[][] = [["인","묘","진"],["사","오","미"],["신","유","술"],["해","자","축"]];
          function getJjRel(a: string, b: string): { type: string; color: string; bg: string; desc: string } {
            if (JIJI_YUKHAP_LIST.some(y => (y.a===a&&y.b===b)||(y.a===b&&y.b===a)))
              return { type: "육합", color: "#f472b6", bg: "rgba(244,114,182,0.15)", desc: "본능적으로 끌려 엉겨붙는 가장 끈끈한 합" };
            if (SAMHAP_GROUPS.some(g => g.includes(a) && g.includes(b)))
              return { type: "삼합", color: "#fbbf24", bg: "rgba(251,191,36,0.15)", desc: "같은 방향으로 에너지가 흐르는 강한 합" };
            if (BANGSHAP_GROUPS.some(g => g.includes(a) && g.includes(b)))
              return { type: "방합", color: "#34d399", bg: "rgba(52,211,153,0.15)", desc: "같은 계절 기운을 공유하는 편안한 합" };
            if (JIJI_CHUNG_LIST.some(c => (c.a===a&&c.b===b)||(c.a===b&&c.b===a)))
              return { type: "충", color: "#f87171", bg: "rgba(248,113,113,0.15)", desc: "서로 부딪히지만 강한 자극을 주는 관계" };
            return { type: "무관", color: "#6b7280", bg: "rgba(107,114,128,0.1)", desc: "직접적인 관계 없음" };
          }
          const rows = [
            { rowLabel: "년지 — 뿌리·환경 에너지", a: yj1, b: yj2 },
            { rowLabel: "월지 — 사회·활동 에너지", a: mj1, b: mj2 },
            { rowLabel: "일지 — 배우자·본인 에너지", a: ij1, b: ij2 },
            ...(hj1 && hj2 ? [{ rowLabel: "시지 — 내면·욕구 에너지", a: hj1, b: hj2 }] : []),
          ];
          return (
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
              <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-5">년지 · 월지 · 일지 · 시지 관계 다이어그램</p>
              <div className="space-y-5">
                {rows.map(({ rowLabel, a, b }) => {
                  const rel = getJjRel(a, b);
                  return (
                    <div key={rowLabel}>
                      <p className="text-[10px] text-gray-600 font-bold tracking-widest mb-3">{rowLabel}</p>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black border-2 border-rose-400/50" style={{ background: "rgba(244,63,94,0.1)" }}>{a}</div>
                          <span className="text-[10px] text-gray-500">나</span>
                        </div>
                        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                          <span className="text-xs font-black px-2.5 py-1 rounded-lg" style={{ color: rel.color, background: rel.bg }}>{rel.type}</span>
                          <div className="w-14 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg, rgba(244,63,94,0.5), ${rel.color}, rgba(129,140,248,0.5))` }} />
                          <span className="text-[9px] text-gray-600 text-center leading-tight max-w-[80px]">{rel.desc}</span>
                        </div>
                        <div className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black border-2 border-indigo-400/50" style={{ background: "rgba(99,102,241,0.1)" }}>{b}</div>
                          <span className="text-[10px] text-gray-500">상대</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap gap-x-3 gap-y-1">
                {([["육합","#f472b6","본능적으로 끌려 엉겨붙는 합"],["삼합","#fbbf24","같은 방향으로 흐르는 강한 합"],["방합","#34d399","같은 계절 기운의 합"],["충","#f87171","부딪히지만 자극적인 관계"]] as [string,string,string][]).map(([t,c,d]) => (
                  <span key={t} className="text-[10px] text-gray-500"><span className="font-bold" style={{ color: c }}>{t}</span> {d}</span>
                ))}
              </div>
            </div>
          );
        })()}

        {/* 만족도 그래프 */}
        {(() => {
          const base = Math.min(10, Math.max(4, Math.round(chem.score / 10)));
          const seed = (chem.hapName ? chem.hapName.length * 17 : 0) + chem.score;
          const skewToFemale = seed % 2 === 0;
          const diff = (seed % 3 === 0) ? 2 : 1;
          let female = Math.min(10, Math.max(3, base + (skewToFemale ? diff : -diff)));
          let male = Math.min(10, Math.max(3, base + (skewToFemale ? -diff : diff)));
          if (female === male) { if (skewToFemale) female = Math.min(10, female + 1); else male = Math.min(10, male + 1); }

          // 생해주는 쪽이 만족도 낮게 보정
          if (saengGuk && saengGuk.type === "상생") {
            if (saengGuk.dir.startsWith(label1)) {
              female = Math.max(3, female - 1);
              male = Math.min(10, male + 1);
            } else {
              male = Math.max(3, male - 1);
              female = Math.min(10, female + 1);
            }
          }

          return (
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
              <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-4">예상 만족도 (10점 만점)</p>
              <div className="flex justify-between mb-1.5">
                <span className="text-sm font-bold text-pink-300">{label1} {female}점</span>
                <span className="text-sm font-bold text-sky-300">{label2} {male}점</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden flex">
                <div className="h-full" style={{ width: `${(female / (female + male)) * 100}%`, background: "linear-gradient(90deg, #ec4899, #f472b6)" }} />
                <div className="h-full" style={{ width: `${(male / (female + male)) * 100}%`, background: "linear-gradient(90deg, #6366f1, #38bdf8)" }} />
              </div>
              <p className="text-xs text-gray-500 mt-3 leading-relaxed">
                {female > male
                  ? `이 궁합은 ${label1} 쪽이 더 큰 만족을 느끼는 케미예요.`
                  : female < male
                  ? `이 궁합은 ${label2} 쪽이 더 큰 만족을 느끼는 케미예요.`
                  : "두 사람의 체감 만족도가 비슷한 균형 잡힌 케미입니다."}
                {saengGuk && saengGuk.type === "상생" && ` ${saengGuk.satisfactionNote}`}
              </p>
            </div>
          );
        })()}

        {/* ── 페이월 영역 ── */}
        <div className="relative mb-4">
          <div className={isPaid ? "" : "blur-sm select-none pointer-events-none"}>

            {/* 배우자궁 생극 + 음양 + 섹스리스 — 줄글 */}
            {(saengGuk || yangYinMatch || sexlessRisk) && (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
                <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-3">두 사람의 잠자리 궁합</p>
                <p className="text-sm text-gray-300 leading-relaxed">
                  {saengGuk && `${saengGuk.desc} ${saengGuk.satisfactionNote} `}
                  {yangYinMatch && "양기가 강한 남성이 음기가 강한 여성에게 환장하는 조합이라, 서로의 에너지가 자연스럽게 보완되면서 강한 끌림이 생기는 구조예요. 음양의 밸런스가 맞아떨어지면 성적 케미가 배가됩니다. "}
                  {sexlessRisk}
                </p>
              </div>
            )}

            {/* 개인 음양/수기운/성욕 분석 — 줄글 */}
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
              <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-4">서로가 서로에게 느끼는 점</p>
              <p className="text-sm text-gray-300 leading-relaxed">
                {label1}이 {label2}에게 느끼는 점은, {libido1.libidomsg} {libido1.gwanSalWarning ?? ""}
                {libido1.yinyang === "양기 강함" && " 양기가 강해서 먼저 다가가고 리드하려는 욕구가 큰 편이에요."}
                {libido1.yinyang === "음기 강함" && " 음기가 강해서 자극에 섬세하게 반응하고, 분위기와 감정 교감을 먼저 원하는 편이에요."}
                {libido1.waterStrong && " 수(水) 기운이 받쳐줘서 끌리는 마음을 숨기지 못하고 자연스럽게 드러내는 타입이기도 해요."}
              </p>
              <p className="text-sm text-gray-300 leading-relaxed mt-3">
                반대로 {label2}이 {label1}에게 느끼는 점은, {libido2.libidomsg} {libido2.gwanSalWarning ?? ""}
                {libido2.yinyang === "양기 강함" && " 양기가 강해서 먼저 다가가고 리드하려는 욕구가 큰 편이에요."}
                {libido2.yinyang === "음기 강함" && " 음기가 강해서 자극에 섬세하게 반응하고, 분위기와 감정 교감을 먼저 원하는 편이에요."}
                {libido2.waterStrong && " 수(水) 기운이 받쳐줘서 끌리는 마음을 숨기지 못하고 자연스럽게 드러내는 타입이기도 해요."}
              </p>
            </div>

            {/* 속궁합 보강법 */}
            {(() => {
              type El = "목"|"화"|"토"|"금"|"수";
              const elements: El[] = ["목","화","토","금","수"];
              const lacking = Array.from(new Set([...(r1.lacking ?? []), ...(r2.lacking ?? [])])) as El[];
              const targets = (lacking.length > 0 ? lacking : elements.slice(0, 2)).slice(0, 2);
              return (
                <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
                  <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-1">속궁합을 더 끌어올리는 보강법</p>
                  <p className="text-xs text-gray-600 mb-4 leading-relaxed">두 사람의 사주에서 부족한 오행을 보강하면 케미가 더 살아납니다.</p>
                  <div className="space-y-3">
                    {targets.map(el => {
                      const t = BOOST_TIP[el];
                      return (
                        <div key={el} className="flex items-start gap-3 rounded-xl px-4 py-3 border"
                          style={{ backgroundColor: t.color + "12", borderColor: t.color + "30" }}>
                          <span className="text-xl shrink-0">{t.icon}</span>
                          <div>
                            <p className="text-sm font-bold mb-0.5" style={{ color: t.color }}>{el}(五行) 기운 보강</p>
                            <p className="text-xs text-gray-400 leading-relaxed">{t.tip}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {chem.highlights.length > 0 ? (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
                <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-4">발견된 성적 케미 요소</p>
                <div className="space-y-3">
                  {chem.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-xl px-4 py-3 border"
                      style={{ backgroundColor: h.color + "12", borderColor: h.color + "30" }}>
                      <span className="font-black text-xs shrink-0 mt-0.5" style={{ color: h.color }}>#{i + 1}</span>
                      <div>
                        <p className="text-sm font-bold mb-0.5" style={{ color: h.color }}>{h.title}</p>
                        <p className="text-xs text-gray-400 leading-relaxed">{h.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5">
                <p className="text-xs text-gray-500 font-bold tracking-widest uppercase mb-3">분석 결과</p>
                <p className="text-sm text-gray-400 leading-relaxed">두 사람의 사주에서 강한 성적 케미 요소가 발견되지 않았습니다. 개인의 노력과 감성적 교감이 더 중요한 관계입니다.</p>
              </div>
            )}

            {/* 일주 정보 */}
            <div className="grid grid-cols-2 gap-3 mt-4">
              {[{ r: r1, label: label1 }, { r: r2, label: label2 }].map(({ r, label }) => (
                <div key={label} className="bg-white/[0.03] border border-white/10 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className="text-lg font-black">{r.pillarsDetail.day.cg}{r.pillarsDetail.day.jj}일주</p>
                  <p className="text-xs text-gray-600">{r.pillarsDetail.day.uunseong}</p>
                  {(() => {
                    const dohwaNames = r.sinsalList
                      .filter(s => ["도화살","홍염살","진도화","나체도화","곤랑도화","녹방도화"].includes(s.name))
                      .map(s => s.name);
                    return dohwaNames.length > 0 ? (
                      <p className="text-xs text-rose-400 mt-1">{dohwaNames.join(" + ")}</p>
                    ) : null;
                  })()}
                </div>
              ))}
            </div>
          </div>

          {/* 잠금 오버레이 */}
          {!isPaid && (
            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl px-5"
              style={{ background: "rgba(8,1,15,0.75)", backdropFilter: "blur(2px)" }}>
              <p className="text-sm font-black text-white mb-1">🔒 상세 분석 잠김</p>
              <p className="text-xs mb-4 text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
                성적 케미 요소·일주 상세를 보려면 결제하세요
              </p>
              {blueberries >= 4900 ? (
                <button
                  onClick={() => {
                    setShowering(true);
                    const next = blueberries - 4900;
                    localStorage.setItem("sp_blueberries", String(next));
                    localStorage.setItem("sp_hotcompat_paid", "true");
                    setBlueberries(next);
                    setTimeout(() => { setIsPaid(true); setShowering(false); }, 700);
                  }}
                  className="w-full px-6 py-3 rounded-2xl font-black text-sm transition-all active:scale-[0.98] mb-2"
                  style={{ background: "linear-gradient(135deg, #6366f1, #818cf8)", color: "#fff", boxShadow: "0 4px 16px rgba(99,102,241,0.4)" }}
                >
                  ✦ 별조각 뿌리고 보기 (4,900개)
                </button>
              ) : (
                <button
                  onClick={() => {
                    const orderId = `hc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                    router.push(`/hotcompat/pay?orderId=${orderId}`);
                  }}
                  className="w-full px-6 py-3 rounded-2xl font-black text-sm transition-all active:scale-[0.98]"
                  style={{ background: "linear-gradient(135deg, #be123c, #f43f5e)", color: "#fff", boxShadow: "0 4px 16px rgba(244,63,94,0.4)" }}
                >
                  결제하기 — ₩4,900
                </button>
              )}
            </div>
          )}
        </div>

        <button onClick={() => { setP1(defaultBirthData("female")); setP2(defaultBirthData("male")); setStep("form"); }}
          className="w-full py-3.5 rounded-2xl font-bold text-sm border border-rose-700/40 text-rose-400 hover:bg-rose-950/30 transition-all">
          다시 분석하기
        </button>
        <ResultFooterActions targetId="hotcompat-result" fileName="연애핫매칭" />
      </div>
    </main>
  );
}

export default function HotCompatPage() {
  return <HotCompatContent />;
}

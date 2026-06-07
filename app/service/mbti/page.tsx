"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { analyzeSaju, ILGAN_PERSONALITY, ILGAN_INNER_OUTER, CHEONGAN_ELEMENT } from "@/lib/saju";
import { loadSajuData, saveSajuData } from "@/lib/savedSaju";
import type { SajuResult, Element } from "@/lib/saju";
import ProfilePicker from "@/components/ProfilePicker";
import SaveProfilePrompt from "@/components/SaveProfilePrompt";
import AnalysisLoading from "@/components/AnalysisLoading";
import BirthTimePicker, { type BirthTimeValue } from "@/components/BirthTimePicker";

const CY_MB = new Date().getFullYear();
const YEARS_MB = Array.from({ length: CY_MB - 1919 }, (_, i) => CY_MB - i);
const MONTHS_MB = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS_MB = Array.from({ length: 31 }, (_, i) => i + 1);

function MbPicker({ value, options, onChange, placeholder, suffix }: {
  value: string; options: { v: string; label: string }[];
  onChange: (v: string) => void; placeholder: string; suffix?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(() => {
    if (open && listRef.current && value) {
      const el = listRef.current.querySelector(`[data-v="${value}"]`);
      if (el) (el as HTMLElement).scrollIntoView({ block: "center" });
    }
  }, [open, value]);
  const display = options.find(o => o.v === value)?.label ?? "";
  return (
    <div ref={ref} className="relative w-full">
      <div onClick={() => setOpen(!open)}
        className={`flex items-center justify-between bg-white/5 border rounded-xl px-3 py-2.5 cursor-pointer transition select-none hover:border-violet-500/60 ${open ? "border-violet-500" : "border-white/10"}`}>
        <span className={`text-sm ${display ? "text-white" : "text-gray-600"}`}>
          {display ? `${display}${suffix ? " " + suffix : ""}` : placeholder}
        </span>
        <span className={`text-gray-500 text-xs transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </div>
      {open && (
        <div ref={listRef} className="absolute z-50 w-full mt-1 bg-[#12121e] border border-white/20 rounded-xl overflow-y-auto shadow-2xl" style={{ maxHeight: 180 }}>
          {options.map(opt => (
            <div key={opt.v} data-v={opt.v}
              onClick={() => { onChange(opt.v); setOpen(false); }}
              className={`px-3 py-2 text-sm cursor-pointer transition-colors ${value === opt.v ? "text-violet-300 bg-violet-900/50 font-semibold" : "text-gray-300 hover:bg-white/8"}`}>
              {opt.label}{suffix && opt.v ? ` ${suffix}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const MBTI_TYPES = ["INTJ","INTP","INFJ","INFP","ISTJ","ISTP","ISFJ","ISFP","ENTJ","ENTP","ENFJ","ENFP","ESTJ","ESTP","ESFJ","ESFP"] as const;
type MBTI = typeof MBTI_TYPES[number];

type Element = "목" | "화" | "토" | "금" | "수";

// MBTI별 오행 주력 매핑
const MBTI_ELEMENT: Record<MBTI, { primary: Element; secondary: Element; desc: string }> = {
  INTJ: { primary:"금", secondary:"수", desc:"냉철한 전략가. 금(金)의 결단과 수(水)의 통찰이 조화를 이룹니다." },
  INTP: { primary:"수", secondary:"금", desc:"논리적 사색가. 수(水)의 지혜와 금(金)의 분석력이 빛납니다." },
  INFJ: { primary:"수", secondary:"목", desc:"통찰력 있는 이상주의자. 수(水)의 직관과 목(木)의 성장이 어우러집니다." },
  INFP: { primary:"목", secondary:"수", desc:"창의적 몽상가. 목(木)의 감수성과 수(水)의 상상력이 핵심입니다." },
  ISTJ: { primary:"토", secondary:"금", desc:"신뢰할 수 있는 관리자. 토(土)의 안정과 금(金)의 정밀함이 강점입니다." },
  ISTP: { primary:"금", secondary:"토", desc:"용감한 실험가. 금(金)의 실행력과 토(土)의 현실감각이 탁월합니다." },
  ISFJ: { primary:"토", secondary:"수", desc:"헌신적인 수호자. 토(土)의 포용과 수(水)의 공감이 특징입니다." },
  ISFP: { primary:"목", secondary:"토", desc:"호기심 넘치는 예술가. 목(木)의 자유와 토(土)의 따뜻함이 조화롭습니다." },
  ENTJ: { primary:"화", secondary:"금", desc:"대담한 지도자. 화(火)의 열정과 금(金)의 추진력이 최강입니다." },
  ENTP: { primary:"화", secondary:"수", desc:"뜨거운 변론가. 화(火)의 창의와 수(水)의 통찰로 새로운 길을 엽니다." },
  ENFJ: { primary:"화", secondary:"목", desc:"카리스마 있는 주인공. 화(火)의 리더십과 목(木)의 인문 에너지가 빛납니다." },
  ENFP: { primary:"목", secondary:"화", desc:"열정적인 활동가. 목(木)의 성장과 화(火)의 표현이 무한한 가능성을 만듭니다." },
  ESTJ: { primary:"토", secondary:"화", desc:"확고한 관리자. 토(土)의 실용주의와 화(火)의 추진력이 조직을 이끕니다." },
  ESTP: { primary:"화", secondary:"토", desc:"모험을 즐기는 사업가. 화(火)의 즉흥성과 토(土)의 현실감각이 기회를 잡습니다." },
  ESFJ: { primary:"토", secondary:"목", desc:"사교적인 외교관. 토(土)의 조화와 목(木)의 인간관계가 사람을 모읍니다." },
  ESFP: { primary:"화", secondary:"목", desc:"자유로운 연예인. 화(火)의 표현력과 목(木)의 창의성으로 무대를 빛냅니다." },
};

// MBTI × 일간 조합 시너지
const ILGAN_MBTI_SYNERGY: Record<string, Record<string, string>> = {
  갑: { ENTJ:"갑목(甲木) + ENTJ = 역대급 리더. 큰 나무처럼 조직을 지배하는 타고난 CEO형.", ENFJ:"갑목의 성장 에너지와 ENFJ의 카리스마가 결합, 교육·사회적 리더에서 최강.", INTJ:"갑목의 독립심과 INTJ의 전략이 만나 장기 목표를 반드시 달성하는 유형.", INFP:"갑목의 자유로운 창의와 INFP의 이상주의가 예술·문학에서 독보적 세계를 구축.", ISTJ:"갑목의 추진력과 ISTJ의 성실함이 결합, 장기 프로젝트를 반드시 완성시키는 유형.", ENTP:"갑목의 확장력과 ENTP의 논쟁력이 신사업·벤처에서 폭발적 시너지를 만듭니다." },
  을: { INFP:"을목(乙木) + INFP = 최고의 예술혼. 섬세한 감수성이 예술·글쓰기에서 독보적.", ISFJ:"을목의 유연함과 ISFJ의 헌신이 만나 주변을 따뜻하게 이끄는 이상적 조합.", ENFP:"을목의 적응력과 ENFP의 열정이 결합, 어떤 환경에서도 꽃피우는 생명력.", INTP:"을목의 섬세함과 INTP의 분석력이 만나 세밀한 연구·분석에서 빛을 발합니다.", ISFP:"을목의 자연친화와 ISFP의 예술 감각이 만나 아름다움을 창조하는 유형." },
  병: { ENTJ:"병화(丙火) + ENTJ = 역사에 남는 지도자. 태양 같은 존재감으로 조직을 장악.", ENFJ:"병화의 따뜻한 열정과 ENFJ의 영감이 만나 수많은 사람을 움직이는 멘토형.", ESTP:"병화의 즉흥성과 ESTP의 행동력이 비즈니스·영업에서 폭발적 결과를 만듭니다.", ESFP:"병화의 밝은 에너지와 ESFP의 표현력이 결합, 군중을 사로잡는 연예인형.", ENTP:"병화의 창의와 ENTP의 변론이 만나 새로운 트렌드를 만드는 혁신가." },
  정: { INFJ:"정화(丁火) + INFJ = 신비로운 통찰가. 촛불처럼 내면의 빛으로 사람을 이끕니다.", ENFP:"정화의 감성과 ENFP의 열정이 만나 예술·상담·교육에서 깊은 감동을 줍니다.", ISFJ:"정화의 헌신과 ISFJ의 돌봄이 결합, 의료·복지에서 타의 추종을 불허합니다.", INTJ:"정화의 직관과 INTJ의 전략이 만나 깊이 있는 계획을 실행하는 고독한 천재형.", INFP:"정화의 예술혼과 INFP의 이상이 만나 세상을 바꾸는 작품을 만드는 유형." },
  무: { ESTJ:"무토(戊土) + ESTJ = 조직의 기둥. 산처럼 흔들리지 않는 안정된 관리자.", ISTJ:"무토의 신뢰와 ISTJ의 성실이 결합, 어떤 조직에서도 핵심 인재로 자리잡습니다.", ENTJ:"무토의 포용력과 ENTJ의 리더십이 만나 큰 조직을 이끄는 경영자형.", ISFJ:"무토의 보호본능과 ISFJ의 헌신이 결합, 가정·조직에서 든든한 버팀목.", ESFJ:"무토의 안정과 ESFJ의 사교성이 만나 공동체를 화합시키는 이상적 조합." },
  기: { ISFJ:"기토(己土) + ISFJ = 세상에서 가장 믿음직한 사람. 조용하고 따뜻하게 모두를 돌봅니다.", ISFP:"기토의 실용성과 ISFP의 예술 감각이 만나 생활 속 아름다움을 만드는 유형.", ESFJ:"기토의 중화와 ESFJ의 사교성이 결합, 누구와도 잘 어울리는 사회의 윤활유.", INFJ:"기토의 현실감과 INFJ의 통찰이 만나 실질적인 변화를 이끄는 상담사형.", ISTJ:"기토의 성실함과 ISTJ의 꼼꼼함이 만나 정확하고 꾸준한 업무의 달인." },
  경: { INTJ:"경금(庚金) + INTJ = 최강의 전략가. 날카로운 검처럼 목표를 향해 정확히 나아갑니다.", ENTJ:"경금의 결단력과 ENTJ의 추진력이 결합, 경쟁 분야에서 압도적 성과를 냅니다.", ISTP:"경금의 실행력과 ISTP의 기술력이 만나 전문 영역에서 장인의 경지에 이릅니다.", ESTJ:"경금의 원칙과 ESTJ의 관리력이 만나 조직을 칼같이 운영하는 전형적 리더.", ESTP:"경금의 추진력과 ESTP의 승부사 기질이 비즈니스 전쟁에서 연전연승." },
  신: { INTP:"신금(辛金) + INTP = 날카로운 분석의 달인. 보석처럼 아이디어를 정제해냅니다.", INTJ:"신금의 완벽주의와 INTJ의 전략이 만나 세밀하면서도 강력한 계획을 실행합니다.", ISFP:"신금의 심미안과 ISFP의 예술 감각이 결합, 주얼리·패션·예술에서 두각을 나타냅니다.", INFJ:"신금의 직관과 INFJ의 통찰이 만나 사람의 본질을 꿰뚫어 보는 심리 전문가형.", ISTP:"신금의 기술과 ISTP의 실용성이 만나 정밀한 전문직에서 빛나는 장인 유형." },
  임: { ENTP:"임수(壬水) + ENTP = 무한한 아이디어를 현실로. 바다처럼 넓고 깊은 혁신가.", INTP:"임수의 지혜와 INTP의 논리가 만나 학문·연구에서 전인미답의 경지를 개척합니다.", INFJ:"임수의 통찰과 INFJ의 직관이 결합, 사람의 미래를 읽는 심오한 상담사형.", ENTJ:"임수의 전략적 사고와 ENTJ의 실행력이 만나 비즈니스 혁신을 이끄는 유형.", ENFP:"임수의 자유로운 흐름과 ENFP의 열정이 만나 경계를 넘나드는 크리에이터형." },
  계: { INFP:"계수(癸水) + INFP = 깊은 감성의 샘. 조용하지만 무한한 창의력을 품고 있습니다.", INFJ:"계수의 내면 깊이와 INFJ의 통찰이 결합, 영적 탐구와 심리 분야에서 독보적.", ISFP:"계수의 감수성과 ISFP의 예술 감각이 만나 섬세한 예술 작품을 창조하는 유형.", INTP:"계수의 성찰과 INTP의 분석이 만나 철학·수학·언어학에서 깊은 연구를 이룹니다.", ISFJ:"계수의 공감과 ISFJ의 헌신이 결합, 고요하지만 강한 치유의 힘을 가진 유형." },
};

// 오행 × MBTI 궁합
const ELEMENT_MBTI_COMPAT: Record<Element, { best: MBTI[]; good: MBTI[]; caution: MBTI[] }> = {
  목: { best:["ENFP","INFP","ENFJ","ENTJ"], good:["INFJ","ENTP","INTJ","ISFP"], caution:["ESTJ","ISTJ","ESTP","ISTP"] },
  화: { best:["ENFJ","ENTJ","ESTP","ENFP"], good:["ESFP","ENTP","ESTJ","ESFJ"], caution:["INTP","INFP","INTJ","ISFP"] },
  토: { best:["ISTJ","ESFJ","ESTJ","ISFJ"], good:["ISTP","ISFP","ENTJ","ESFP"], caution:["INTP","INFP","ENTP","INFJ"] },
  금: { best:["INTJ","ENTJ","ISTJ","ISTP"], good:["ESTJ","INTP","ESTP","ENTP"], caution:["INFP","ENFP","ISFP","ESFP"] },
  수: { best:["INTP","INTJ","INFJ","INFP"], good:["ENTP","ENFJ","ISFJ","ISFP"], caution:["ESTJ","ESFJ","ESTP","ESFP"] },
};

const ELEMENT_COLOR: Record<Element, string> = {
  목:"#4ade80", 화:"#f87171", 토:"#fbbf24", 금:"#a5b4fc", 수:"#60a5fa",
};

const MBTI_CAREER: Record<MBTI, string[]> = {
  INTJ:["전략 컨설턴트","시스템 아키텍트","과학자","투자 분석가"],
  INTP:["연구원","수학자","철학자","소프트웨어 개발자"],
  INFJ:["상담사","작가","심리치료사","사회적 기업가"],
  INFP:["작가·시인","예술가","교육자","NGO 활동가"],
  ISTJ:["공무원","회계사","관리자","의사"],
  ISTP:["엔지니어","외과의","파일럿","스포츠 선수"],
  ISFJ:["간호사","교사","사회복지사","영양사"],
  ISFP:["디자이너","사진작가","셰프","음악가"],
  ENTJ:["CEO·경영자","변호사","정치인","사업가"],
  ENTP:["스타트업 창업자","발명가","토론가","마케터"],
  ENFJ:["강사·코치","NGO 리더","배우·앵커","HR 전문가"],
  ENFP:["크리에이터","홍보 전문가","광고인","심리상담사"],
  ESTJ:["군·경찰 간부","판사","프로젝트 매니저","은행원"],
  ESTP:["영업 전문가","기업가","응급의학과 의사","운동선수"],
  ESFJ:["이벤트 플래너","교사","의료 코디네이터","영업직"],
  ESFP:["연예인·가수","이벤트 사회자","관광 가이드","뷰티 전문가"],
};


// ── 사주 기반 5가지 성향 축 (MBTI 스타일 차트) ──────────────────────────────────
const YANG_GAN = new Set(["갑", "병", "무", "경", "임"]);
type SajuAxis = { key: string; left: string; right: string; score: number; color: string; desc: string };

function calcSajuMbtiAxes(result: SajuResult): SajuAxis[] {
  const ilgan = result.pillarsDetail.day.cg;
  const isYang = YANG_GAN.has(ilgan);
  const total = Object.values(result.scores).reduce((a, b) => a + b, 0) || 1;
  const pct = (el: "목" | "화" | "토" | "금" | "수") => (result.scores[el] / total) * 100;
  const clamp = (n: number) => Math.max(6, Math.min(94, Math.round(n)));

  // 십성 그룹 카운트 (연·월·일·시 천간/지지, 일간 자신 제외)
  const pillars = [result.pillarsDetail.year, result.pillarsDetail.month, result.pillarsDetail.day, result.pillarsDetail.hour].filter(Boolean) as { sipseongCg: string; sipseongJj: string }[];
  const sipCounts: Record<string, number> = {};
  pillars.forEach((p, i) => {
    if (!(i === 2)) sipCounts[p.sipseongCg] = (sipCounts[p.sipseongCg] || 0) + 1; // 일간 천간(자기 자신) 제외
    sipCounts[p.sipseongJj] = (sipCounts[p.sipseongJj] || 0) + 1;
  });
  const cnt = (...names: string[]) => names.reduce((a, n) => a + (sipCounts[n] || 0), 0);

  // ① 외향성 ↔ 내향성 (일간 음양 + 화/수/금 기운)
  const eiScore = clamp(50 + (isYang ? 12 : -12) + (pct("화") - 20) * 0.7 - (pct("수") - 20) * 0.6 - (pct("금") - 20) * 0.4);

  // ② 추상적 사고 ↔ 현실적 사고 (수·목=직관/사색, 토·금=감각/현실)
  const abstractRealScore = clamp(50 - (pct("수") + pct("목") - 40) * 0.6 + (pct("토") + pct("금") - 40) * 0.6);

  // ③ 결과지향 ↔ 과정지향 (금·화=속도와 완성, 목·수=흐름과 성장)
  const resultProcessScore = clamp(50 - (pct("금") + pct("화") - 40) * 0.55 + (pct("목") + pct("수") - 40) * 0.55);

  // ④ 통제형(계획·관리) ↔ 자유형(판단에 얽매이지 않음) — 관성 vs 식상
  const gwanCnt = cnt("정관", "편관"), siksangCnt = cnt("식신", "상관");
  const controlFreeScore = clamp(50 + (gwanCnt - siksangCnt) * 11);

  // ⑤ 자기주도형 ↔ 신중형 — 비겁 vs 인성
  const bigyeopCnt = cnt("비견", "겁재"), inseongCnt = cnt("편인", "정인");
  const leadCarefulScore = clamp(50 + (bigyeopCnt - inseongCnt) * 11);

  return [
    {
      key: "ei", left: "내향(I)", right: "외향(E)", score: eiScore, color: "#f472b6",
      desc: eiScore >= 50
        ? `일간이 ${isYang ? "양간(陽干)이라 에너지가 밖으로 발산" : "음간(陰干)이지만 화(火) 기운이 강해 표현 욕구가 살아있"}는 구조예요. 사람들과 부대끼며 에너지를 얻고, 생각을 입 밖으로 꺼내며 정리하는 타입이에요.`
        : `일간이 ${!isYang ? "음간(陰干)이라 에너지를 안으로 갈무리" : "양간이지만 수(水)·금(金) 기운이 안정적으로 받쳐주어 차분하게 가라앉히"}는 구조예요. 혼자만의 시간 속에서 에너지를 충전하고, 생각을 충분히 정리한 뒤에 표현하는 타입이에요.`
    },
    {
      key: "ns", left: "현실 감각(S)", right: "추상·직관(N)", score: abstractRealScore, color: "#60a5fa",
      desc: abstractRealScore >= 50
        ? `사주에 수(水)·목(木)의 기운이 두드러져, 눈에 보이지 않는 가능성과 의미를 먼저 떠올리는 사고방식이에요. 아이디어와 큰 그림을 그리는 데 강하고, 추상적인 개념을 다루는 일에서 빛이 나요.`
        : `사주에 토(土)·금(金)의 기운이 두드러져, 눈에 보이고 손에 잡히는 사실과 데이터를 먼저 신뢰하는 사고방식이에요. 현실적인 절차와 검증을 중시하고, 구체적인 결과물을 만드는 일에서 강점을 보여요.`
    },
    {
      key: "tf_like", left: "과정지향", right: "결과지향", score: resultProcessScore, color: "#fbbf24",
      desc: resultProcessScore >= 50
        ? `금(金)·화(火)의 추진력이 강해, 목표를 정하면 가장 빠르고 확실한 길로 밀어붙여 결과부터 만들어내는 스타일이에요. 완성된 성과로 스스로를 증명하고 싶어 해요.`
        : `목(木)·수(水)의 흐름이 강해, 결과보다 그 과정에서 무엇을 배우고 어떻게 성장했는지를 더 중요하게 여기는 스타일이에요. 차근차근 쌓아가는 여정 자체에서 의미를 찾아요.`
    },
    {
      key: "jp_like", left: "자유형(판단에 얽매이지 않음)", right: "통제형(계획·관리)", score: controlFreeScore, color: "#a78bfa",
      desc: controlFreeScore >= 50
        ? `사주에 관성(정관·편관)의 기운이 식상보다 강해, 규칙과 체계 안에서 안정감을 느끼고 계획한 대로 차근차근 관리해 나가는 통제형이에요. 정해진 틀이 있을 때 오히려 능률이 올라가요.`
        : `사주에 식상(식신·상관)의 기운이 관성보다 강해, 정해진 틀보다 그때그때의 흐름과 영감을 따라 움직이는 자유형이에요. 계획에 얽매이기보다 상황에 맞춰 유연하게 대응할 때 빛을 발해요.`
    },
    {
      key: "lead_careful", left: "신중형", right: "자기주도형", score: leadCarefulScore, color: "#4ade80",
      desc: leadCarefulScore >= 50
        ? `사주에 비겁(비견·겁재)의 기운이 인성보다 강해, 남의 의견에 기대기보다 스스로 판단하고 밀고 나가는 자기주도형이에요. 직접 부딪히며 배우는 것을 선호하고 주체성이 강해요.`
        : `사주에 인성(편인·정인)의 기운이 비겁보다 강해, 충분히 따져보고 주변의 조언을 들은 뒤에 움직이는 신중형이에요. 성급한 결정보다 숙고를 거친 선택이 후회를 줄여줘요.`
    },
  ];
}

function SajuAxisChart({ axes }: { axes: SajuAxis[] }) {
  return (
    <div className="space-y-4">
      {axes.map(a => (
        <div key={a.key}>
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className={a.score < 50 ? "font-black" : ""} style={{ color: a.score < 50 ? a.color : "rgba(255,255,255,0.35)" }}>{a.left}</span>
            <span className={a.score >= 50 ? "font-black" : ""} style={{ color: a.score >= 50 ? a.color : "rgba(255,255,255,0.35)" }}>{a.right}</span>
          </div>
          <div className="h-2 rounded-full relative overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
            <div className="absolute left-1/2 top-0 bottom-0 w-px z-10" style={{ background: "rgba(255,255,255,0.2)" }} />
            <div className="absolute top-0 bottom-0 rounded-full" style={{
              left: a.score < 50 ? `${a.score}%` : "50%",
              right: a.score < 50 ? "50%" : `${100 - a.score}%`,
              background: a.color,
            }} />
          </div>
          <p className="text-xs text-gray-400 leading-relaxed mt-2">{a.desc}</p>
        </div>
      ))}
      <p className="text-[9px] text-right" style={{ color: "rgba(255,255,255,0.25)" }}>※ 50을 기준으로 어느 쪽 기운이 더 강한지 보여주는 상대 지수예요</p>
    </div>
  );
}

// ── 나와 잘 맞는 사주 (상생 관계 기준) ───────────────────────────────────────────
const EL_GENERATES: Record<Element, Element> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
const EL_GENERATED_BY: Record<Element, Element> = { 화: "목", 토: "화", 금: "토", 수: "금", 목: "수" };
const ELEMENT_HANJA: Record<Element, string> = { 목: "木", 화: "火", 토: "土", 금: "金", 수: "水" };

function getCompatibleSaju(ilganEl: Element, gender: "male" | "female") {
  // 여자: 나를 생(生)하는 남자의 오행 / 남자: 내가 생(生)하는 여자의 오행
  const targetEl = gender === "female" ? EL_GENERATED_BY[ilganEl] : EL_GENERATES[ilganEl];
  const ganList = Object.entries(CHEONGAN_ELEMENT).filter(([, el]) => el === targetEl).map(([gan]) => gan);
  const reason = gender === "female"
    ? `여성의 사주에서는 나를 생(生)해주는 기운, 즉 인성(印星)에 해당하는 오행을 가진 남성과 만났을 때 보살핌과 지지를 받는 흐름이 형성돼요. 내 오행 ${ilganEl}(${ELEMENT_HANJA[ilganEl]})을 생(生)하는 ${targetEl}(${ELEMENT_HANJA[targetEl]}) 기운의 일간을 가진 남성이라면, 나를 키워주고 받쳐주는 인연이 되기 쉬워요.`
    : `남성의 사주에서는 내가 생(生)해주는 기운, 즉 식상(食傷)에 해당하는 오행을 가진 여성과 만났을 때 자연스럽게 챙겨주고 베푸는 관계가 형성돼요. 내 오행 ${ilganEl}(${ELEMENT_HANJA[ilganEl]})이 생(生)하는 ${targetEl}(${ELEMENT_HANJA[targetEl]}) 기운의 일간을 가진 여성이라면, 내가 자연스럽게 생을 내려주는 좋은 흐름이 만들어져요.`;
  return { targetEl, ganList, reason };
}

export default function MbtiPage() {
  const router = useRouter();
  const [counter] = useState(() => Math.floor(Math.random() * 400) + 1600);
  const [mbti, setMbti] = useState<MBTI | "">("");
  const [sajuResult, setSajuResult] = useState<SajuResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const pendingResultRef = useRef<null | {
    ilgan: string; dominant: Element;
    mbtiEl: { primary: Element; secondary: Element; desc: string };
    synergy: string; careers: string[];
    compat: { best: MBTI[]; good: MBTI[]; caution: MBTI[] };
    elMatch: "완벽" | "좋음" | "보통" | "주의";
    elMatchColor: string; elMatchDesc: string;
  }>(null);
  const [result, setResult] = useState<null | {
    ilgan: string;
    dominant: Element;
    mbtiEl: { primary: Element; secondary: Element; desc: string };
    synergy: string;
    careers: string[];
    compat: { best: MBTI[]; good: MBTI[]; caution: MBTI[] };
    elMatch: "완벽" | "좋음" | "보통" | "주의";
    elMatchColor: string;
    elMatchDesc: string;
  }>(null);

  // 생년월일 입력 폼 상태
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"female" | "male">("female");
  const [birthYear, setBirthYear] = useState("1995");
  const [birthMonth, setBirthMonth] = useState("6");
  const [birthDay, setBirthDay] = useState("2");
  const [birthTime, setBirthTime] = useState<BirthTimeValue>({ hour: null, minute: null, unknown: true, useJajasi: false });
  const [calendarType, setCalendarType] = useState<"solar" | "lunar">("solar");
  const [isLeapMonth, setIsLeapMonth] = useState(false);

  useEffect(() => {
    // pre-fill form from localStorage (don't auto-analyze)
    try {
      const saved = loadSajuData();
      if (!saved) return;
      // 이름은 placeholder로 표시 — 직접 입력하게
      if (saved.gender) setGender(saved.gender as "female" | "male");
      if (saved.birthYear) setBirthYear(String(saved.birthYear));
      if (saved.birthMonth) setBirthMonth(String(saved.birthMonth));
      if (saved.birthDay) setBirthDay(String(saved.birthDay));
      if (saved.birthHour != null && !saved.birthHourUnknown) {
        setBirthTime({ hour: saved.birthHour, minute: (saved as any).birthMinute ?? 30, unknown: false, useJajasi: (saved as any).useJajasi || false });
      }
    } catch {}
  }, []);

  async function handleConfirmSaju() {
    const y = parseInt(birthYear), mo = parseInt(birthMonth), d = parseInt(birthDay);
    if (!name.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    if (isNaN(y) || isNaN(mo) || isNaN(d)) {
      alert("생년월일을 모두 선택해주세요.");
      return;
    }
    let sy = y, smo = mo, sd = d;
    if (calendarType === "lunar") {
      try {
        // @ts-ignore
        const KLC = (await import("korean-lunar-calendar")).default;
        const cal = new KLC();
        cal.setLunarDate(y, mo, d, isLeapMonth);
        const s = cal.getSolarCalendar();
        if (!s?.year) throw new Error();
        sy = s.year; smo = s.month; sd = s.day;
      } catch {
        alert("음력 날짜를 양력으로 변환할 수 없습니다. 날짜를 다시 확인해주세요.");
        return;
      }
    }
    const h = birthTime.unknown ? null : birthTime.hour;
    const min = birthTime.unknown ? null : birthTime.minute;
    saveSajuData({ name, gender, birthYear: sy, birthMonth: smo, birthDay: sd, birthHour: h, birthMinute: min, birthHourUnknown: h == null, birthPlace: "서울", style: "auto", useJajasi: birthTime.useJajasi });
    try {
      const r = analyzeSaju({
        birthYear: sy, birthMonth: smo, birthDay: sd, birthHour: h,
        birthMinute: min, name: name || "분석", gender, birthPlace: "서울",
        style: "auto", productType: "mobile", useJajasi: birthTime.useJajasi,
      });
      setSajuResult(r);
    } catch {
      alert("사주 정보를 다시 확인해주세요.");
    }
  }

  function analyze() {
    if (!mbti || !sajuResult) return;
    const ilgan = sajuResult.pillarsDetail.day.cg;
    const dominant = (sajuResult.dominant[0] || "토") as Element;
    const mbtiEl = MBTI_ELEMENT[mbti];
    const synergies = ILGAN_MBTI_SYNERGY[ilgan];
    const synergy = synergies?.[mbti] || `${ilgan}일간 + ${mbti}의 조합은 독창적인 에너지를 만듭니다. 사주의 ${dominant} 기운이 ${mbti}의 특성을 뒷받침하며 독자적인 길을 개척합니다.`;
    const careers = MBTI_CAREER[mbti] || [];
    const compat = ELEMENT_MBTI_COMPAT[dominant];

    let elMatch: "완벽" | "좋음" | "보통" | "주의";
    let elMatchColor: string;
    let elMatchDesc: string;

    if (compat.best.includes(mbti)) {
      elMatch = "완벽"; elMatchColor = "#4ade80";
      elMatchDesc = `${dominant} 오행과 ${mbti}는 최고의 조합입니다. 사주 에너지와 성격 유형이 완벽히 시너지를 이루어 타고난 잠재력을 100% 발휘할 수 있습니다.`;
    } else if (compat.good.includes(mbti)) {
      elMatch = "좋음"; elMatchColor = "#fbbf24";
      elMatchDesc = `${dominant} 오행과 ${mbti}는 잘 맞습니다. 약간의 노력으로 에너지를 극대화할 수 있으며, 서로의 강점이 보완됩니다.`;
    } else if (compat.caution.includes(mbti)) {
      elMatch = "주의"; elMatchColor = "#f87171";
      elMatchDesc = `${dominant} 오행과 ${mbti}는 에너지 방향이 다소 엇갈립니다. 단점을 의식적으로 보완하면 오히려 강점이 될 수 있습니다.`;
    } else {
      elMatch = "보통"; elMatchColor = "#94a3b8";
      elMatchDesc = `${dominant} 오행과 ${mbti}는 균형 잡힌 조합입니다. 특별한 시너지보다 안정적인 에너지 흐름이 특징입니다.`;
    }

    pendingResultRef.current = { ilgan, dominant, mbtiEl, synergy, careers, compat, elMatch, elMatchColor, elMatchDesc };
    setIsAnalyzing(true);
  }

  if (isAnalyzing) return (
    <AnalysisLoading
      subject={`${name || ""}님의 사주 MBTI`}
      onDone={() => { setResult(pendingResultRef.current); setIsAnalyzing(false); }}
    />
  );

  return (
    <main className="min-h-screen bg-[#06060e] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-violet-950/40 blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-950/40 blur-[140px]" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">
        <button onClick={() => router.push("/")} className="text-xs text-gray-600 hover:text-gray-400 mb-6 inline-flex items-center gap-1 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 홈</button>

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🧬</div>
          <h1 className="text-2xl font-black mb-2">사주 × MBTI 조합 분석</h1>
          <p className="text-sm text-gray-400">타고난 사주 에너지와 MBTI 성격 유형의<br />시너지를 분석합니다</p>
        </div>

        {!sajuResult ? (
          <>
          <ProfilePicker onSelect={p => {
            setName(p.name);
            setGender(p.gender);
            setBirthYear(String(p.birthYear));
            setBirthMonth(String(p.birthMonth));
            setBirthDay(String(p.birthDay));
            if (!p.birthHourUnknown && p.birthHour >= 0) {
              setBirthTime({ hour: p.birthHour, minute: (p as any).birthMinute ?? 30, unknown: false, useJajasi: false });
            } else {
              setBirthTime({ hour: null, minute: null, unknown: true, useJajasi: false });
            }
          }} />
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-6 space-y-4">
            <p className="text-sm font-bold text-gray-300">생년월일 입력</p>

            <div>
              <label className="text-xs text-gray-500 block mb-1">이름 <span className="text-red-400">*</span></label>
              <input value={name} onChange={e => setName(e.target.value)} placeholder="홍길동 (필수)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500 transition" />
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-1">성별</label>
              <div className="flex gap-2">
                {(["female","male"] as const).map(g => (
                  <button key={g} type="button" onClick={() => setGender(g)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition ${gender === g ? "bg-violet-600 text-white" : "bg-white/5 text-gray-400 border border-white/10"}`}>
                    {g === "female" ? "여성" : "남성"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-500">생년월일</label>
                <div className="flex overflow-hidden rounded-lg border border-white/10">
                  {(["solar","lunar"] as const).map(t => (
                    <button key={t} type="button" onClick={() => { setCalendarType(t); setIsLeapMonth(false); setBirthMonth(""); setBirthDay(""); }}
                      className={`px-3 py-1 text-xs font-medium transition ${calendarType === t ? "bg-violet-600 text-white" : "text-gray-400 hover:bg-white/5"}`}>
                      {t === "solar" ? "양력" : "음력"}
                    </button>
                  ))}
                </div>
              </div>
              {calendarType === "lunar" && (
                <label className="flex items-center gap-2 text-xs text-gray-400 mb-2 cursor-pointer select-none">
                  <input type="checkbox" checked={isLeapMonth} onChange={e => setIsLeapMonth(e.target.checked)} className="accent-violet-500" />
                  윤달
                </label>
              )}
              <div className="grid grid-cols-3 gap-2">
                <MbPicker value={birthYear} options={YEARS_MB.map(y => ({ v: String(y), label: String(y) }))}
                  onChange={setBirthYear} placeholder="연도" suffix="년" />
                <MbPicker value={birthMonth} options={MONTHS_MB.map(m => ({ v: String(m), label: String(m) }))}
                  onChange={setBirthMonth} placeholder="월" suffix="월" />
                <MbPicker value={birthDay} options={DAYS_MB.map(d => ({ v: String(d), label: String(d) }))}
                  onChange={setBirthDay} placeholder="일" suffix="일" />
              </div>
            </div>

            <div>
              <label className="text-xs text-gray-500 block mb-2">태어난 시간 <span className="text-gray-700 font-normal">(선택사항)</span></label>
              <BirthTimePicker value={birthTime} onChange={setBirthTime} accent="violet" />
            </div>

            <button onClick={handleConfirmSaju}
              className="w-full py-3 rounded-xl font-black text-sm text-white transition"
              style={{ background: "linear-gradient(135deg, #7c3aed, #4f46e5)" }}>
              사주 분석 시작 →
            </button>
          </div>
          </>
        ) : (
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500 mb-1">분석 사주</p>
              <p className="text-sm text-white font-bold">{sajuResult.fourPillars}</p>
              <p className="text-xs text-gray-400 mt-0.5">일간 {sajuResult.pillarsDetail.day.cg} · 주력 오행 {sajuResult.dominant[0]}</p>
            </div>
            <button onClick={() => { setSajuResult(null); setResult(null); setMbti(""); }}
              className="text-xs text-gray-500 hover:text-gray-300 transition px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 shrink-0">
              다시 입력
            </button>
          </div>
        )}

        {/* MBTI 선택 */}
        <div className="mb-6">
          <label className="block text-sm font-bold text-gray-300 mb-3">내 MBTI를 선택하세요</label>
          <div className="grid grid-cols-4 gap-2">
            {MBTI_TYPES.map(m => {
              const el = MBTI_ELEMENT[m];
              const selected = mbti === m;
              return (
                <button
                  key={m}
                  onClick={() => { setMbti(m); setResult(null); }}
                  className="py-2.5 rounded-xl text-sm font-black transition-all border"
                  style={{
                    background: selected ? `${ELEMENT_COLOR[el.primary]}22` : "rgba(255,255,255,0.04)",
                    borderColor: selected ? `${ELEMENT_COLOR[el.primary]}66` : "rgba(255,255,255,0.08)",
                    color: selected ? ELEMENT_COLOR[el.primary] : "rgba(255,255,255,0.5)",
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>

        {mbti && (
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 mb-4">
            <p className="text-xs text-gray-500 mb-1">선택한 MBTI</p>
            <p className="font-bold text-white">{mbti}</p>
            <p className="text-xs text-gray-400 mt-1">{MBTI_ELEMENT[mbti].desc}</p>
            <div className="flex gap-2 mt-2">
              {[MBTI_ELEMENT[mbti].primary, MBTI_ELEMENT[mbti].secondary].map((el, i) => (
                <span key={i} className="text-xs px-2 py-1 rounded-full font-bold" style={{ background:`${ELEMENT_COLOR[el]}22`, color:ELEMENT_COLOR[el], border:`1px solid ${ELEMENT_COLOR[el]}44` }}>
                  {i===0?"주":"부"}오행 {el}
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={analyze}
          disabled={!mbti || !sajuResult}
          className="w-full py-4 rounded-2xl font-black text-base mb-8 transition-all disabled:opacity-30"
          style={{ background: mbti && sajuResult ? "linear-gradient(135deg, #7c3aed, #4f46e5)" : undefined }}
        >
          {!sajuResult ? "사주 정보 없음" : !mbti ? "MBTI를 선택하세요" : "🧬 조합 분석하기"}
        </button>

        {result && (
          <div className="space-y-4">
            <SaveProfilePrompt
              name={name}
              birthYear={parseInt(birthYear)} birthMonth={parseInt(birthMonth)} birthDay={parseInt(birthDay)}
              birthHour={birthTime.unknown ? null : birthTime.hour}
              birthHourUnknown={birthTime.unknown}
              gender={gender}
            />
            {/* 오행 × MBTI 궁합 */}
            <div className="rounded-3xl border p-6" style={{ borderColor:`${result.elMatchColor}44`, background:`${result.elMatchColor}11` }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold tracking-widest" style={{ color:result.elMatchColor }}>오행 × MBTI 궁합</p>
                <span className="text-lg font-black px-3 py-1 rounded-full" style={{ background:`${result.elMatchColor}22`, color:result.elMatchColor }}>
                  {result.elMatch}
                </span>
              </div>
              <p className="text-sm text-gray-300 leading-relaxed">{result.elMatchDesc}</p>
            </div>

            {/* 일간 × MBTI 시너지 */}
            <div className="bg-gradient-to-br from-violet-600/10 to-indigo-600/10 border border-violet-500/25 rounded-2xl p-5">
              <p className="text-xs font-bold tracking-widest text-violet-300 mb-3">일간({result.ilgan}) × {mbti} 시너지</p>
              <p className="text-sm text-gray-200 leading-relaxed">{result.synergy}</p>
            </div>

            {/* 주력 오행 분석 */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
              <p className="text-xs text-gray-500 font-semibold tracking-widest mb-3">사주 주력 오행 ({result.dominant})</p>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl font-black" style={{ color:ELEMENT_COLOR[result.dominant] }}>{result.dominant}</span>
                <div>
                  <p className="text-sm text-white font-bold">MBTI 주력 오행: {result.mbtiEl.primary}</p>
                  <p className="text-xs text-gray-400">보조 오행: {result.mbtiEl.secondary}</p>
                </div>
              </div>
              {result.dominant === result.mbtiEl.primary ? (
                <div className="bg-green-500/10 border border-green-500/25 rounded-xl p-3">
                  <p className="text-xs text-green-400 font-bold">완벽 일치!</p>
                  <p className="text-xs text-gray-300 mt-1">사주와 MBTI가 같은 오행 에너지를 공유합니다. 내면과 외면이 일치하는 일관된 사람입니다.</p>
                </div>
              ) : result.dominant === result.mbtiEl.secondary ? (
                <div className="bg-yellow-500/10 border border-yellow-500/25 rounded-xl p-3">
                  <p className="text-xs text-yellow-400 font-bold">보조 에너지 일치</p>
                  <p className="text-xs text-gray-300 mt-1">사주의 주력 오행이 MBTI의 보조 에너지와 연결됩니다. 깊이 파고들수록 진가가 드러나는 유형입니다.</p>
                </div>
              ) : (
                <div className="bg-white/5 rounded-xl p-3">
                  <p className="text-xs text-gray-400">사주와 MBTI의 오행이 다릅니다. 이는 내면(사주)과 표현 방식(MBTI)이 다른 다층적인 성격을 의미합니다.</p>
                </div>
              )}
            </div>

            {/* 추천 직업 */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
              <p className="text-xs text-gray-500 font-semibold tracking-widest mb-3">사주 × MBTI 추천 직업</p>
              <div className="flex flex-wrap gap-2">
                {result.careers.map((c, i) => (
                  <span key={i} className="text-sm px-3 py-1.5 rounded-full font-medium" style={{ background:"rgba(139,92,246,0.15)", color:"#c4b5fd", border:"1px solid rgba(139,92,246,0.3)" }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* MBTI 궁합 */}
            <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
              <p className="text-xs text-gray-500 font-semibold tracking-widest mb-4">내 오행과 맞는 MBTI</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-bold text-green-400 mb-1.5">최고 궁합</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.compat.best.map(m => (
                      <span key={m} className="text-xs px-2.5 py-1 rounded-full font-bold bg-green-500/15 text-green-300 border border-green-500/30">{m}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-yellow-400 mb-1.5">좋은 궁합</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.compat.good.map(m => (
                      <span key={m} className="text-xs px-2.5 py-1 rounded-full font-bold bg-yellow-500/15 text-yellow-300 border border-yellow-500/30">{m}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-red-400 mb-1.5">주의 궁합</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.compat.caution.map(m => (
                      <span key={m} className="text-xs px-2.5 py-1 rounded-full font-bold bg-red-500/15 text-red-300 border border-red-500/30">{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 일간 성격 심층 분석 */}
            {(() => {
              const info = ILGAN_PERSONALITY[result.ilgan];
              if (!info) return null;
              return (
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
                  <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-3">일간 성격 심층 분석</p>
                  <p className="text-sm font-bold text-violet-300 mb-2">{info.short}</p>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {info.keyword.split("·").map(k => (
                      <span key={k} className="text-xs px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/30">{k}</span>
                    ))}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{info.detail}</p>
                </div>
              );
            })()}

            {/* 겉모습 vs 속마음 */}
            {(() => {
              const io = ILGAN_INNER_OUTER[result.ilgan];
              if (!io) return null;
              return (
                <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
                  <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-3">겉모습 vs 속마음 — {result.ilgan}일간</p>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-violet-500/10 border border-violet-500/25 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-violet-300 mb-1">타인이 보는 나</p>
                      <p className="text-sm font-bold text-white">{io.outer}</p>
                    </div>
                    <div className="bg-indigo-500/10 border border-indigo-500/25 rounded-xl p-3">
                      <p className="text-[10px] font-bold text-indigo-300 mb-1">내면의 진짜 욕구</p>
                      <p className="text-sm font-bold text-white">{io.inner}</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed">{io.synthesis}</p>
                </div>
              );
            })()}

            {/* 사주로 보는 5가지 성향 축 */}
            {sajuResult && (
              <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5">
                <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-1">사주로 보는 나의 성향 축</p>
                <p className="text-[11px] text-gray-600 mb-4">MBTI 검사 없이도, 사주 안에 새겨진 기질을 5가지 축으로 풀어봤어요</p>
                <SajuAxisChart axes={calcSajuMbtiAxes(sajuResult)} />
              </div>
            )}

            {/* 나와 잘 맞는 사주 */}
            {sajuResult && (() => {
              const ilganEl = CHEONGAN_ELEMENT[result.ilgan];
              const { targetEl, ganList, reason } = getCompatibleSaju(ilganEl, gender);
              return (
                <div className="bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-400/25 rounded-2xl p-5">
                  <p className="text-xs font-bold tracking-widest text-pink-300 mb-1">💗 나와 잘 맞는 사주</p>
                  <p className="text-[11px] text-gray-500 mb-3">
                    {gender === "female" ? "여성 기준 — 나를 생(生)해주는 남자" : "남성 기준 — 내가 생(生)해주는 여자"}
                  </p>
                  <p className="text-sm text-gray-300 leading-relaxed mb-3">{reason}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-3 py-1.5 rounded-full font-black" style={{ background: `${ELEMENT_COLOR[targetEl]}22`, color: ELEMENT_COLOR[targetEl], border: `1px solid ${ELEMENT_COLOR[targetEl]}44` }}>
                      {targetEl}({ELEMENT_HANJA[targetEl]}) 기운의 일간
                    </span>
                    {ganList.map(g => (
                      <span key={g} className="text-xs px-2.5 py-1 rounded-full font-bold bg-pink-500/15 text-pink-300 border border-pink-500/30">{g}일간</span>
                    ))}
                  </div>
                </div>
              );
            })()}

            <div className="text-center pt-2">
              <p className="text-xs text-gray-700">본 분석은 사주·MBTI 이론 기반 오락용 콘텐츠입니다. summerpalace.ai.kr</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

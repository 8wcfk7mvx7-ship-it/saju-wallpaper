"use client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import BackButton from "@/components/BackButton";
import { analyzeSaju, getSipseong, analyzeSipseongPatterns, getSipseongStrength, getJijiRelations, getJohuCareerInsight, getGungseongCareerSummary, CHEONGAN_ELEMENT, type SajuResult, type Element } from "@/lib/saju";
import { SIPSEONG_DESC, detectExcessPatterns, BIGEOB_EXCESS_DESC } from "@/lib/saju2";
import AnalysisLoading from "@/components/AnalysisLoading";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";
import ShareImageButton from "@/components/ShareImageButton";

export const dynamic = "force-dynamic";

const ELEMENT_TO_CG: Record<Element, string> = { 목: "갑", 화: "병", 토: "무", 금: "경", 수: "임" };
const SIPSEONG_OF_GROUP_LABEL: Record<string, string> = {
  비겁: "비겁(비견·겁재)", 식상: "식상(식신·상관)", 재성: "재성(정재·편재)",
  관성: "관성(정관·편관)", 인성: "인성(정인·편인)",
};
const SIPSEONG_GROUP: Record<string, "비겁" | "식상" | "재성" | "관성" | "인성"> = {
  비견: "비겁", 겁재: "비겁", 식신: "식상", 상관: "식상",
  정재: "재성", 편재: "재성", 정관: "관성", 편관: "관성", 정인: "인성", 편인: "인성",
};

const GROUP_CAREER: Record<string, { title: string; field: string; desc: string; warn: string }> = {
  식상: {
    title: "내가 만든 결과물이 곧 가치가 되는 일",
    field: "콘텐츠·기획·요리·교육·1인 사업·프리랜서·창작",
    desc: "용신이 식상(食傷) 계열이라, 누군가 정해놓은 규칙을 따르는 일보다 스스로 아이디어를 내고 결과물을 만들어내는 일에서 능력이 가장 잘 발휘됩니다. 기획·콘텐츠 제작·요리·강의·디자인처럼 '내 손에서 무언가가 새로 만들어지는' 직업군에서 인정받기 쉽습니다.",
    warn: "다만 식상이 강한 만큼 한 가지에 꾸준히 머무르기보다 자극과 변화를 추구하는 성향이 함께 옵니다. 너무 많은 걸 동시에 벌이면 마무리가 약해지는 패턴이 반복될 수 있으니, 한 번에 진행하는 프로젝트 수를 의식적으로 줄이는 것이 좋습니다.",
  },
  재성: {
    title: "직접 운영하고 굴리며 키워가는 일",
    field: "영업·무역·투자·자영업·부동산·유통",
    desc: "용신이 재성(財星) 계열입니다. 조직 안에서 정해진 업무를 반복하기보다, 자신이 직접 거래·협상·운영의 주체가 되는 일에서 에너지가 살아납니다. 영업·무역·자영업처럼 성과가 곧바로 보상으로 연결되는 구조가 잘 맞습니다.",
    warn: "재성이 강하면 일과 사람 관계에서 모두 '득과 실'을 빠르게 계산하는 경향이 생깁니다. 단기 성과에 집중하다 보면 동료·팀과의 관계가 소모적으로 흐를 수 있어, 의도적으로 신뢰 관계에 시간을 투자하는 것이 장기적으로 더 큰 기회를 만듭니다.",
  },
  관성: {
    title: "체계와 책임이 분명한 조직형 일",
    field: "공공기관·대기업·법률·행정·관리직·전문 자격직",
    desc: "용신이 관성(官星) 계열입니다. 명확한 규칙과 위계, 책임 범위가 있는 조직 안에서 안정적으로 능력을 쌓아 올라가는 구조가 잘 맞습니다. 공공기관·대기업·법률·행정처럼 '직급과 자격'이 곧 성과로 인정되는 분야에서 신뢰를 빠르게 얻습니다.",
    warn: "관성이 강하면 규칙을 잘 지키는 만큼, 정해진 틀을 벗어난 자유로운 환경에서는 오히려 방향을 잃기 쉽습니다. 완전한 무소속 프리랜서나 룰이 없는 초기 스타트업보다는, 어느 정도 체계가 잡힌 환경을 선택하는 것이 스트레스를 줄여줍니다.",
  },
  인성: {
    title: "배움과 전문성이 곧 경쟁력이 되는 일",
    field: "연구·교육·상담·의료·기획·전략·문서 기반 전문직",
    desc: "용신이 인성(印星) 계열입니다. 즉흥적인 실행보다 충분한 학습과 자료를 바탕으로 판단하고 조언하는 역할에서 진가가 드러납니다. 연구·교육·상담·기획처럼 '깊이 아는 것'이 곧 신뢰가 되는 분야에서 꾸준히 성장합니다.",
    warn: "인성이 강하면 준비와 검토에 시간을 많이 쓰는 대신, 결정과 실행의 타이밍을 놓치는 경우가 생길 수 있습니다. 완벽하게 준비된 다음에 시작하려 하지 말고, '70% 준비되면 일단 시작'하는 기준을 정해두는 것이 도움이 됩니다.",
  },
  비겁: {
    title: "사람들과 함께, 또는 같은 분야 사람들과 경쟁하며 성장하는 일",
    field: "스포츠·영업조직·동업·커뮤니티 기반 사업·프리랜서 연합",
    desc: "용신이 비겁(比劫) 계열입니다. 혼자 조용히 일하는 환경보다, 동료·경쟁자와 함께 자극을 받으며 성장하는 구조에서 능력이 극대화됩니다. 같은 목표를 가진 사람들과 함께하는 팀, 동업, 혹은 같은 분야 사람들과 경쁘쟁하는 환경에서 성과가 빠르게 올라갑니다.",
    warn: "비겁이 강하면 독립심과 자존심이 강해 '내 방식'을 고집하다 주변과 마찰이 생기기 쉽습니다. 동업이나 협업을 할 때는 처음부터 역할과 지분을 명확히 문서화해 두는 것이 관계도 일도 오래 지키는 방법입니다.",
  },
};

// 격국(분석 패턴) 중 진로/적성과 직결되는 항목만 필터링하기 위한 키 목록
const CAREER_RELEVANT_PATTERNS = ["무비겁", "무관", "무재", "쟁재", "식상생재", "관인상생", "재다신약", "신강관약"];

export default function CareerPage() {
  const router = useRouter();
  const [step, setStep] = useState<"entry" | "form" | "loading" | "result">("entry");
  const [form, setForm] = useState<BirthFormData>(defaultBirthData("female"));
  const resultRef = useRef<SajuResult | null>(null);

  async function handleAnalyze() {
    if (!form.birthYear || !form.birthMonth || !form.birthDay) return;
    let y = Number(form.birthYear), m = Number(form.birthMonth), d = Number(form.birthDay);
    if (form.calendarType === "lunar") {
      try {
        const KLC = (await import("korean-lunar-calendar")).default;
        const klc = new KLC();
        klc.setLunarDate(y, m, d, form.isLeapMonth);
        const sol = klc.getSolarCalendar();
        if (sol?.year) { y = sol.year; m = sol.month; d = sol.day; }
      } catch {}
    }
    resultRef.current = analyzeSaju({
      birthYear: y, birthMonth: m, birthDay: d,
      birthHour: form.birthHour, birthMinute: form.birthMinute ?? 0,
      name: "나", gender: form.gender,
      birthPlace: form.city || "서울", style: "auto", productType: "report", useJajasi: form.useJajasi,
    });
    setStep("loading");
  }

  if (step === "entry") {
    return (
      <main className="min-h-screen bg-[#070a14] text-white flex flex-col">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[650px] h-[650px] rounded-full bg-indigo-950/40 blur-[160px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-sky-950/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-5 py-16 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-indigo-900/50 border border-indigo-700/40 text-indigo-300 text-xs font-bold tracking-wider mb-8">
            ⚠ 적성에 안 맞는 일을 평생 하고 있을 수도 있습니다
          </div>
          <h1 className="text-4xl font-black mb-4 leading-tight tracking-tight">
            내 사주에 맞는<br />
            <span className="text-indigo-400">진짜 적성</span>은 뭘까?
          </h1>
          <p className="text-gray-400 text-base mb-2 leading-relaxed">
            남들 따라 고른 전공, 남들 다 가는 직장.<br />
            <span className="text-gray-300 font-medium">사주는 처음부터 알고 있었습니다.</span>
          </p>
          <p className="text-gray-600 text-sm mb-12">
            지금이라도 방향을 알면 늦지 않았습니다
          </p>

          <div className="w-full space-y-3 mb-10 text-left">
            {[
              ["용신 기반 적성 진단", "사주 전체 구조에서 가장 필요한 기운이 어떤 직업군과 맞는지"],
              ["격국으로 보는 강점·약점", "단순 일주 풀이가 아닌 사주 전체 구조의 균형을 진단"],
              ["성향별 주의할 점", "잘 맞는 분야에서도 반복되는 함정과 대처법"],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-start gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-bold tracking-wider mb-6">
            ✦ 완전 무료
          </div>

          <button onClick={() => setStep("form")}
            className="w-full py-4 rounded-2xl font-black text-lg tracking-tight bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white shadow-lg shadow-indigo-900/50 transition-all active:scale-[0.98]">
            내 적성 확인하기
          </button>
        </div>
      </main>
    );
  }

  if (step === "form") {
    const ready = !!form.birthYear && !!form.birthMonth && !!form.birthDay;
    return (
      <main className="min-h-screen bg-[#070a14] text-white">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[600px] h-[600px] rounded-full bg-indigo-950/40 blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 pb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">생년월일 입력</h2>
            <p className="text-gray-500 text-sm">정확한 분석을 위해 출생 정보를 입력해주세요.</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <BirthInputForm value={form} onChange={setForm} label="나의 정보" accent="#6366f1" />
          </div>
          <button onClick={handleAnalyze} disabled={!ready}
            className={`w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all active:scale-[0.98] ${
              ready
                ? "bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white shadow-lg shadow-indigo-900/50"
                : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
            }`}>
            적성 분석하기
          </button>
        </div>
      </main>
    );
  }

  if (step === "loading") {
    return (
      <AnalysisLoading
        subject="나의 진짜 적성"
        duration={2200}
        onDone={() => setStep("result")}
        messages={[
          "사주 전체의 균형을 살펴보는 중...",
          "어떤 기운이 가장 필요한지 계산하는 중...",
          "맞는 직업군을 찾는 중...",
          "주의해야 할 함정을 찾는 중...",
        ]}
      />
    );
  }

  // ── 결과 ──
  const r = resultRef.current;
  if (!r) return null;
  const ilgan = r.pillarsDetail.day.cg;

  // 십성 그룹 카운트는 천간(원국 본기둥)에만 드러난 십성만 센다. 지장간은 해석 참고용일 뿐 카운트에 포함하지 않는다.
  const sipseongList = [
    r.pillarsDetail.year.sipseongCg,
    r.pillarsDetail.month.sipseongCg,
    r.pillarsDetail.hour?.sipseongCg,
  ].filter(Boolean) as string[];

  const counts: Record<string, number> = {};
  sipseongList.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
  const totalCount = (key: string) => counts[key] || 0;

  const yongshinEl = r.yongshin.yongshin;
  const yongshinSipseong = getSipseong(ilgan, ELEMENT_TO_CG[yongshinEl]);
  const yongshinGroup = SIPSEONG_GROUP[yongshinSipseong] ?? "재성";
  const careerInfo = GROUP_CAREER[yongshinGroup];

  // "사주에서 가장 강한 기운"은 만세력 기준대로 천간뿐 아니라 지지(본기)의 십성까지 모두 합산해 판단한다.
  const topCounts: Record<string, number> = {};
  [
    r.pillarsDetail.year.sipseongCg, r.pillarsDetail.year.sipseongJj,
    r.pillarsDetail.month.sipseongCg, r.pillarsDetail.month.sipseongJj,
    r.pillarsDetail.day.sipseongJj,
    r.pillarsDetail.hour?.sipseongCg, r.pillarsDetail.hour?.sipseongJj,
  ].filter(Boolean).forEach(s => { topCounts[s as string] = (topCounts[s as string] || 0) + 1; });
  const topSipseong = Object.entries(topCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topDesc = topSipseong ? SIPSEONG_DESC[topSipseong] : null;

  // 유기적 십성 세력 분석: 단순 있음/없음이 아니라 통근·충·생극·위치를 종합해 판단
  const sipseongStrength = getSipseongStrength(r);
  const strengthByGroup = Object.fromEntries(sipseongStrength.map(s => [s.group, s])) as Record<string, ReturnType<typeof getSipseongStrength>[number]>;

  let patterns = analyzeSipseongPatterns(r.pillarsDetail).filter(p => CAREER_RELEVANT_PATTERNS.some(k => p.name.includes(k) || p.hanja?.includes(k)));

  // "무관/무재/무인/무비겁" 패턴은 유기적 분석 결과가 "무"가 아니면 제거하고,
  // 약하지만 존재하는 경우엔 그 뉘앙스를 담은 설명으로 대체한다.
  const PATTERN_GROUP: Record<string, "비겁" | "식상" | "재성" | "관성" | "인성"> = {
    "무비겁(無比劫)": "비겁", "무재(無財)": "재성", "무관(無官)": "관성", "무인(無印)": "인성",
  };
  patterns = patterns.flatMap(p => {
    const group = PATTERN_GROUP[p.name];
    if (!group) return [p];
    const info = strengthByGroup[group];
    if (!info || info.status === "무") return [p];
    if (info.status === "약함") {
      return [{
        ...p,
        name: p.name.replace("무", "약(弱)").replace(/\(無.+\)/, `(${group} 약함)`),
        desc: `사주에 ${SIPSEONG_OF_GROUP_LABEL[group]}이 아예 없는 건 아니지만, ${info.reason} 그래도 흐름상 어느 정도의 영향력은 남아있어요.`,
      }];
    }
    // 보통/강함이면 해당 무X 패턴은 제거
    return [];
  });

  const sikSangCount = totalCount("식신") + totalCount("상관");
  const gwanseongCount = totalCount("정관") + totalCount("편관");
  const hasSikSangSaengGwan = sikSangCount >= 1 && gwanseongCount >= 1;

  // 비겁 과다 판단: 비견+겁재 합산 3개 이상이면 과다로 본다
  const bigeobCount = totalCount("비견") + totalCount("겁재");
  const ilganEl2 = (CHEONGAN_ELEMENT[ilgan] || "목") as string;
  const bigeobExcessNote = bigeobCount >= 3 ? BIGEOB_EXCESS_DESC[ilganEl2] : null;

  // 합충 분석: 4지지 간의 관계를 모두 구해 진로에 영향을 줄 만한 합/충을 추려낸다
  const allJj = [r.pillarsDetail.year.jj, r.pillarsDetail.month.jj, r.pillarsDetail.day.jj, r.pillarsDetail.hour?.jj].filter(Boolean) as string[];
  const jijiRelations = getJijiRelations(allJj);
  const POS_LABEL = ["년지", "월지", "일지", "시지"];
  const hapList = jijiRelations.filter(rel => ["육합", "삼합", "반합"].includes(rel.type));
  const chungList = jijiRelations.filter(rel => ["충", "형", "파", "해", "원진"].includes(rel.type));

  // 극(克)하는 관계: 사주에서 가장 강한 오행이 가장 약한(부족한) 오행을 극하는지,
  // 혹은 용신을 극하는 기신 오행이 어떤 십성에 해당하는지 짚어준다
  const ilganEl = CHEONGAN_ELEMENT[ilgan];
  const OHAENG_CONTROLS_LOCAL: Record<string, Element> = { 목: "토", 토: "수", 수: "화", 화: "금", 금: "목" };
  const dominantEl = r.dominant[0];
  const lackingEl = r.lacking[0];
  const dominantControlsLacking = dominantEl && lackingEl && OHAENG_CONTROLS_LOCAL[dominantEl] === lackingEl;
  const gishinEl = r.yongshin.gishin;
  const gishinSipseong = gishinEl ? getSipseong(ilgan, ELEMENT_TO_CG[gishinEl]) : null;
  const gishinGroup = gishinSipseong ? SIPSEONG_GROUP[gishinSipseong] : null;

  // 조후 분석
  const johu = getJohuCareerInsight(ilgan, r.pillarsDetail.month.jj);

  // 궁성 분석
  const gungseongList = getGungseongCareerSummary(r.pillarsDetail);

  // 과다·편중 패턴 분석
  const excessPatterns = detectExcessPatterns(r).filter(p => p.fields.includes('career'));

  return (
    <main className="min-h-screen bg-[#070a14] text-white">
      <BackButton />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-indigo-950/30 blur-[160px]" />
      </div>
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 pb-16" id="career-result">
        <div className="text-center mb-8">
          <p className="text-indigo-400 text-xs font-bold tracking-widest mb-2">MY APTITUDE</p>
          <h1 className="text-2xl font-black leading-snug">
            {ilgan}{r.pillarsDetail.day.jj}일주 {form.name}님의 적성 진단
          </h1>
        </div>

        <div className="bg-gradient-to-br from-indigo-950/60 to-sky-950/40 border border-indigo-700/30 rounded-3xl p-6 mb-5 text-center">
          <p className="text-indigo-300 text-xs font-bold tracking-widest uppercase mb-2">사주 구조 진단</p>
          <p className="text-xl font-black leading-snug mb-1">{r.yongshin.strength} · 용신 {yongshinEl} ({yongshinGroup})</p>
          <p className="text-sm text-gray-300 leading-relaxed">{r.yongshin.desc}</p>
        </div>

        {/* 조후(調候) 분석 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-orange-300 mb-1">조후(調候)로 보는 일하기 좋은 환경 — {johu.climate}</p>
          <p className="text-sm text-gray-300 leading-relaxed mb-2">{johu.desc}</p>
          <p className="text-xs text-emerald-300 leading-relaxed">▶ 추천 분야: {johu.fields}</p>
        </div>

        {/* 궁성(宮星) 분석 */}
        {gungseongList.length > 0 && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-cyan-300 mb-2">궁성(宮星)으로 보는 십성 배치</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              {gungseongList.map((g, i) => (
                <span key={i}>
                  <span className="text-cyan-300/80 font-semibold">{g.palaceLabel}에 {g.sipseong}</span>이 자리하고 있어요. {g.desc}{i < gungseongList.length - 1 ? " " : ""}
                </span>
              ))}
            </p>
          </div>
        )}

        {/* 합충(合沖) 분석 */}
        {(hapList.length > 0 || chungList.length > 0) && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-emerald-300 mb-3">합·충으로 보는 기둥 간 관계</p>
            {hapList.length > 0 && (
              <div className="mb-2">
                {hapList.map((rel, i) => (
                  <p key={i} className="text-xs text-gray-400 leading-relaxed mb-1">
                    <span className="text-emerald-300 font-bold">{POS_LABEL[rel.a]}({rel.jjA})·{POS_LABEL[rel.b]}({rel.jjB}) {rel.type}</span> — 두 영역이 서로 끌어당기며 협력하는 구조라, 해당 기둥이 나타내는 영역(예: {rel.a === 1 || rel.b === 1 ? "직업·사회생활" : "주변 환경"})에서 안정적인 관계나 협업이 잘 풀려요.
                  </p>
                ))}
              </div>
            )}
            {chungList.length > 0 && (
              <div>
                {chungList.map((rel, i) => (
                  <p key={i} className="text-xs text-amber-300/80 leading-relaxed mb-1">
                    <span className="font-bold">{POS_LABEL[rel.a]}({rel.jjA})·{POS_LABEL[rel.b]}({rel.jjB}) {rel.type}</span> — 두 영역 사이에 부딪힘이 있어, {rel.a === 1 || rel.b === 1 ? "직업·진로가 한 번에 정착되기보다 몇 번의 변화를 거치며 자리를 잡는 흐름" : "환경 변화에 따라 마음이 흔들릴 수 있는 구간"}이 있을 수 있어요. 변화를 나쁜 신호로 보지 말고, 그 자체를 다음 단계로 가는 과정으로 받아들이는 게 좋아요.
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 극(克) 관계 분석 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-rose-300 mb-1">오행이 서로 극(克)하는 관계</p>
          {dominantControlsLacking ? (
            <p className="text-sm text-gray-300 leading-relaxed">
              사주에서 가장 강한 기운인 <b>{dominantEl}</b>이 가장 부족한 기운인 <b>{lackingEl}</b>을 극(克)하고 있어요. 강한 기운이 약한 기운을 계속 누르는 구조라, 부족한 쪽에 해당하는 영역(인간관계·체력·꾸준함 등 {lackingEl} 기운이 상징하는 부분)이 쉽게 소모될 수 있어요. 일할 때는 강한 기운을 발산하는 일에만 몰두하기보다, 부족한 기운을 채워주는 활동(휴식·관계 관리)을 의식적으로 배치하는 게 중요해요.
            </p>
          ) : (
            <p className="text-sm text-gray-300 leading-relaxed">
              사주 내 오행들이 한쪽으로 일방적으로 극(克)하기보다 비교적 순환하는 구조야. 특정 영역이 계속 눌리는 일은 적지만, 그만큼 어느 한 분야에 몰입하기보다 여러 역할을 오가며 균형을 맞추는 게 자연스러운 흐름이야.
            </p>
          )}
          {gishinGroup && (
            <p className="text-xs text-gray-500 leading-relaxed mt-2 pt-2 border-t border-white/5">
              참고로 용신을 극하는 기신(忌神)은 <b>{gishinEl}</b> 기운, 십성으로는 <b>{SIPSEONG_OF_GROUP_LABEL[gishinGroup]}</b> 계열이야. 이 영역의 일이나 사람에게 너무 휘둘리면 본인의 강점이 가려질 수 있으니, {SIPSEONG_OF_GROUP_LABEL[gishinGroup]}이 주도하는 환경(예: {gishinGroup === "관성" ? "지나치게 경직된 위계 조직" : gishinGroup === "재성" ? "돈 계산이 모든 걸 좌우하는 환경" : gishinGroup === "인성" ? "이론과 형식만 중시하는 환경" : gishinGroup === "식상" ? "끊임없는 변화와 산만한 멀티태스킹" : "과도한 경쟁과 자존심 싸움"})은 적당히 거리를 두는 게 좋아.
            </p>
          )}
          {bigeobExcessNote && (
            <p className="text-xs text-amber-400/80 leading-relaxed mt-2 pt-2 border-t border-white/5">
              {bigeobExcessNote}
            </p>
          )}
        </div>

        {careerInfo && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-indigo-300 mb-1">가장 잘 맞는 방향 — {careerInfo.title}</p>
            <p className="text-xs text-gray-500 mb-2">추천 분야: {careerInfo.field}</p>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">{careerInfo.desc}</p>
            <p className="text-xs text-rose-300 leading-relaxed">⚠ {careerInfo.warn}</p>
          </div>
        )}

        {hasSikSangSaengGwan && (
          <div className="bg-white/[0.03] border border-emerald-700/20 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-emerald-300 mb-1">식상생관(食傷生官) 구조</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              사주 안에 식상(표현력·기획력)과 관성(체계·책임)이 함께 자리해 있습니다. 즉, 자신만의 아이디어나 콘텐츠를 만들어내는 능력과 그것을 조직·규칙 안에서 인정받는 능력이 동시에 있는 구조입니다. 기획자가 곧 관리자로 성장하거나, 전문 기술자가 조직 내 책임자로 올라가는 흐름이 자연스럽게 만들어집니다.
            </p>
          </div>
        )}

        {patterns.length > 0 && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-sky-300 mb-3">사주 구조(격국)로 보는 강점·약점</p>
            {patterns.slice(0, 2).map((p, i) => (
              <div key={i} className={i > 0 ? "mt-3 pt-3 border-t border-white/5" : ""}>
                <p className="text-sm font-bold text-gray-200 mb-1">{p.name} ({p.hanja})</p>
                <p className="text-xs text-gray-500 mb-1 leading-relaxed">{p.desc}</p>
                <p className="text-xs text-emerald-300 leading-relaxed">▶ {p.advice}</p>
              </div>
            ))}
          </div>
        )}

        {topDesc && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-8">
            <p className="text-sm font-bold text-violet-300 mb-1">사주에서 가장 강한 기운 — {topSipseong} ({topDesc.hanja})</p>
            <p className="text-xs text-gray-500 mb-2">{topDesc.short}</p>
            <p className="text-sm text-gray-300 leading-relaxed">{topDesc.detail}</p>
            <p className="text-sm text-amber-200/80 leading-relaxed mt-3 pt-3 border-t border-white/10">⚠️ {topDesc.shadow}</p>
          </div>
        )}

        {excessPatterns.length > 0 && (
          <div className="bg-rose-950/30 border border-rose-700/30 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-rose-300 mb-3">⚠ 사주 편중 패턴 — 진로에서 주의할 점</p>
            <div className="space-y-4">
              {excessPatterns.map((p, i) => (
                <div key={p.id} className={i > 0 ? "pt-4 border-t border-rose-700/20" : ""}>
                  <p className="text-sm font-bold text-rose-200 mb-0.5">{p.name} ({p.hanja})</p>
                  <p className="text-xs text-gray-400 mb-1">{p.shortDesc}</p>
                  <p className="text-sm text-gray-300 leading-relaxed mb-2">{p.fullDesc}</p>
                  <p className="text-xs text-amber-300 leading-relaxed">▶ {p.advice}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push("/service/wealth")}
            className="py-3.5 rounded-2xl font-bold text-sm bg-white/5 border border-white/10 text-gray-300 active:scale-[0.98] transition-all">
            재물운 보기
          </button>
          <button onClick={() => { setStep("entry"); resultRef.current = null; }}
            className="py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-sky-600 text-white active:scale-[0.98] transition-all">
            다시 분석하기
          </button>
        </div>
        <ShareImageButton targetId="career-result" fileName="진로적성" />
      </div>
    </main>
  );
}

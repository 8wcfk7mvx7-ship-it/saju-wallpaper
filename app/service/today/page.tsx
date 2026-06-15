"use client";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import BackButton from "@/components/BackButton";
import {
  analyzeSaju, calcDaewoon, getYearPillar, getDayPillar, getSipseong, getUunseong,
  getJijiRelations, sortJijiRelationsByStrength, REL_TYPE_COLOR, CHEONGAN_ELEMENT, EL_STYLE, jijiElement, type SajuResult, type Element,
} from "@/lib/saju";
import AnalysisLoading from "@/components/AnalysisLoading";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";
import ShareImageButton from "@/components/ShareImageButton";

export const dynamic = "force-dynamic";

function FadeIn({ children, delay }: { children: React.ReactNode; delay: number }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return <div style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(18px)", transition: `opacity 0.9s ease ${delay}ms, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>{children}</div>;
}

const SIPSEONG_GROUP: Record<string, "비겁" | "식상" | "재성" | "관성" | "인성"> = {
  비견: "비겁", 겁재: "비겁",
  식신: "식상", 상관: "식상",
  정재: "재성", 편재: "재성",
  정관: "관성", 편관: "관성",
  정인: "인성", 편인: "인성",
};

const CG_HAP: [string, string][] = [["갑","기"],["을","경"],["병","신"],["정","임"],["무","계"]];
const CG_CHUNG: [string, string][] = [["갑","경"],["을","신"],["병","임"],["정","계"]];

// 십성 그룹별 — 오늘의 일운(日運)이 사주에 들어왔을 때 각 영역에 미치는 기본 흐름
const GROUP_TODAY: Record<string, { 총운: string; 재물: string; 애정: string; 건강: string; 공부문서: string }> = {
  비겁: {
    총운: "오늘은 '나 자신'의 기운이 강해지는 날이에요. 자신감과 추진력이 평소보다 크게 올라가서, 망설이던 일을 결단력 있게 밀고 나가기 좋은 흐름입니다. 다만 평소보다 자존심이 강해지고 남의 말을 듣기 싫어지는 경향도 함께 따라오니, 중요한 협의나 협상은 한 박자 늦추는 것이 좋아요.",
    재물: "재물 면에서는 '내 것'에 대한 집착이 강해지는 날이라, 새로운 투자나 동업·공동 지출보다는 본인 명의의 자산을 점검하는 데 집중하는 게 유리합니다. 친구·형제·동료와의 돈 거래는 특히 조심하세요.",
    애정: "연애·애정 운에서는 자기주장이 강해지는 시기라, 상대와의 의견 차이가 평소보다 크게 느껴질 수 있어요. 다만 솔직하고 직진하는 매력이 발휘되는 날이기도 해서, 고민하던 마음을 표현하기엔 나쁘지 않은 타이밍입니다.",
    건강: "건강 면에서는 체력과 활동력이 평소보다 높아지는 날이에요. 다만 그만큼 무리하기도 쉬워서, 운동이나 신체 활동은 '평소보다 조금 더'가 아니라 '적당히'로 조절하는 게 좋습니다.",
    공부문서: "공부·시험·문서 운에서는 자기 주관이 강해져 본인의 방식을 밀고 나가려는 경향이 큰 날이에요. 새로운 방법을 시도하기보단, 이미 익숙한 방식으로 밀어붙이는 것이 효율적입니다.",
  },
  식상: {
    총운: "오늘은 표현력과 아이디어가 풍부해지는 날이에요. 평소보다 말이 잘 나오고 분위기를 주도하게 되는데, 새로운 기획·창작·발표와 잘 맞는 흐름입니다. 다만 에너지를 너무 밖으로 쏟아내면 저녁쯔음 급격히 지칠 수 있으니 페이스 조절이 필요해요.",
    재물: "재물 면에서는 '소비 욕구'가 평소보다 커지는 날이에요. 맛있는 것, 예쁜 것에 지갑이 쉽게 열릴 수 있습니다. 다만 식상의 기운이 새로운 수입원의 씨앗이 되기도 해서, 부수입·사이드 프로젝트 아이디어가 떠오른다면 메모해두면 좋아요.",
    애정: "애정 운에서는 매력과 표현력이 풍부해지는 날이라, 호감을 주고받기에 좋은 흐름입니다. 다만 감정 기복도 함께 커질 수 있어서, 가벼운 말이 오해를 살 수 있으니 표현은 풍부하게 하더라도 단어 선택은 한 번 더 생각해보세요.",
    건강: "건강 면에서는 소화기·식습관과 관련된 부분에 신경 쓰는 게 좋은 날이에요. 과식·과음이 평소보다 늘어나기 쉬우니 양을 조절하면 컨디션을 잘 유지할 수 있습니다.",
    공부문서: "공부·문서 운에서는 새로운 아이디어나 기획안이 잘 풀리는 날이에요. 다만 한 가지에 집중하기보다 여러 갈래로 생각이 뻗어나가기 쉬워서, 마감이 있는 작업은 오전 중에 핵심만 먼저 끝내두는 게 좋습니다.",
  },
  재성: {
    총운: "오늘은 현실적인 감각이 좋아지는 날이에요. 숫자·계약·거래와 관련된 일들이 평소보다 매끄럽게 풀릴 수 있습니다. 다만 재성의 기운이 강해지면 일간(나 자신)의 에너지가 분산되기 쉬워, 너무 많은 일을 동시에 벌이지 않는 것이 좋아요.",
    재물: "재물 운으로는 오늘이 한 달 중 비교적 좋은 흐름에 속해요. 미뤄둔 정산·계약·결제처럼 돈과 직접 관련된 일을 처리하기에 적합한 날입니다. 단, 큰돈이 오갈수록 충동적인 결정은 피하고 한 번 더 검토하는 습관이 필요해요.",
    애정: "애정 운에서는 상대에게 잘 챙겨주고 베푸는 마음이 커지는 날이에요. 다만 그 마음이 '내가 이만큼 했으니'라는 계산으로 흐르면 서운함이 쌓일 수 있으니, 베풀 때는 기대 없이 베푸는 마음가짐이 좋습니다.",
    건강: "건강 면에서는 과로·스트레스로 인한 소모에 주의가 필요한 날이에요. 재물·업무에 신경이 집중되는 만큼, 짧은 휴식을 의식적으로 끼워 넣는 것이 좋습니다.",
    공부문서: "공부·문서 운에서는 실용적인 정보 — 자격증, 재무, 계약서류 — 와 관련된 일이 잘 풀리는 날이에요. 다만 추상적이고 이론적인 공부는 오늘은 집중이 덜 될 수 있습니다.",
  },
  관성: {
    총운: "오늘은 책임감과 사회적 감각이 강해지는 날이에요. 평소보다 '바르게, 제대로' 하려는 마음이 커져서 조직·관계 안에서 신뢰를 쌓기에 좋은 흐름입니다. 다만 스스로에게도, 주변에도 기준이 엄격해지기 쉬워 잔소리나 지적이 늘어날 수 있으니 한 번 더 부드럽게 표현해보세요.",
    재물: "재물 면에서는 즉흥적인 지출보다 계획·규칙에 따른 흐름이 잘 맞는 날이에요. 예산을 세우거나 정기적인 지출을 정리하기에 좋습니다. 다만 세금·과태료·공적인 비용이 발생하기 쉬운 날이기도 하니 일정을 한 번 확인해두세요.",
    애정: "애정 운에서는 책임감 있는 모습이 부각되는 날이에요. 다만 통제하려는 마음이 강해질 수 있어, 상대의 자율성을 존중하는 태도가 관계를 더 편안하게 만들어줍니다. 안정적인 관계라면 진지한 이야기를 나누기에 좋은 타이밍이에요.",
    건강: "건강 면에서는 긴장도가 높아지는 날이에요. 어깨·목처럼 스트레스가 잘 쌓이는 부위가 뻐근해지기 쉬우니, 중간중간 스트레칭으로 풀어주는 게 좋습니다.",
    공부문서: "공부·문서 운에서는 시험·자격증·공식 문서와 관련된 일에 좋은 흐름이 따르는 날이에요. 규칙과 절차를 따르는 공부일수록 효율이 높아집니다. 중요한 서류 제출·계약은 오늘 처리해도 좋아요.",
  },
  인성: {
    총운: "오늘은 생각이 차분해지고 한 발 물러서서 상황을 보게 되는 날이에요. 직관과 통찰이 좋아지는 흐름이라, 새로운 결정을 내리기보다는 정리·점검·휴식에 잘 맞는 하루입니다. 다만 생각이 너무 많아져 행동으로 옮기는 게 늦어질 수 있어요.",
    재물: "재물 면에서는 큰 움직임보다 '지키고 정리하는' 흐름이 좋은 날이에요. 보험·저축·자산 점검처럼 안정성을 챙기는 일에 잘 맞습니다. 새로운 투자 결정은 오늘보다 다른 날로 미루는 게 좋아요.",
    애정: "애정 운에서는 정서적인 교감이 중요해지는 날이에요. 깊은 대화를 나누거나, 서로의 생각을 이해하는 시간을 가지면 관계가 한층 단단해질 수 있습니다. 다만 너무 많은 생각으로 혼자 결론을 내려버리지 않도록 주의하세요.",
    건강: "건강 면에서는 휴식과 회복이 핵심인 날이에요. 평소 피로가 쌓여 있었다면 오늘은 무리한 일정보다 충분한 수면과 휴식을 우선하는 것이 장기적으로 도움이 됩니다.",
    공부문서: "공부·문서 운에서는 새로운 내용을 받아들이고 이해하는 능력이 좋아지는 날이에요. 독서, 강의 수강, 자격증 공부처럼 '입력' 중심의 학습에 특히 잘 맞습니다.",
  },
};

export default function TodayFortunePage() {
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
      name: form.name || "나", gender: form.gender,
      birthPlace: form.city || "서울", style: "auto", productType: "report", useJajasi: form.useJajasi,
    });
    setStep("loading");
  }

  if (step === "entry") {
    return (
      <main className="min-h-screen bg-[#06060e] text-white flex flex-col">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[650px] h-[650px] rounded-full bg-slate-800/40 blur-[160px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-zinc-800/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-5 py-16 text-center">
          <FadeIn delay={0}>
          <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-300 text-xs font-bold tracking-wider mb-8">
            🗓️ 오늘의 일운(日運)
          </div>
          </FadeIn>
          <FadeIn delay={80}>
          <h1 className="text-4xl font-black mb-4 leading-tight tracking-tight">
            내 사주 원국 +<br />
            <span className="text-gray-300">대운·세운·오늘</span><br />
            전부 한 장의 차트로
          </h1>
          </FadeIn>
          <FadeIn delay={160}>
          <p className="text-gray-400 text-base mb-2 leading-relaxed">
            만세력처럼, 원국 4기둥부터 현재 대운·올해 세운·오늘 일진까지<br />
            <span className="text-gray-300 font-medium">합·충 관계를 한눈에 분석합니다.</span>
          </p>
          <p className="text-gray-600 text-sm mb-12">
            총운·재물·애정·건강·공부/문서운까지 한 번에
          </p>
          </FadeIn>

          <div className="w-full space-y-3 mb-10 text-left">
            {[
              ["원국 + 대운 + 세운 + 오늘 명식표", "년/월/일/시주부터 현재 대운, 올해 세운, 오늘 일진까지 한 장에"],
              ["합·충·형·파·해 전체 분석", "오늘과 올해의 기운이 원국과 어떻게 부딪히고 맞물리는지"],
              ["총운·재물·애정·건강·공부/문서운", "오늘의 일운을 5가지 영역으로 상세 해설"],
            ].map(([title, desc], i) => (
              <FadeIn key={title} delay={220 + i * 70}>
              <div className="flex items-start gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={490}>
          <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-bold tracking-wider mb-6">
            ✦ 완전 무료
          </div>
          </FadeIn>

          <FadeIn delay={560}>
          <button onClick={() => setStep("form")}
            className="w-full py-4 rounded-2xl font-black text-lg tracking-tight bg-gradient-to-r from-slate-600 to-zinc-600 hover:from-slate-500 hover:to-zinc-500 text-white shadow-lg shadow-black/50 transition-all active:scale-[0.98]">
            오늘의 운세 확인하기
          </button>
          </FadeIn>
        </div>
      </main>
    );
  }

  if (step === "form") {
    const ready = !!form.birthYear && !!form.birthMonth && !!form.birthDay;
    return (
      <main className="min-h-screen bg-[#06060e] text-white">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[600px] h-[600px] rounded-full bg-slate-800/40 blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">생년월일 입력</h2>
            <p className="text-gray-500 text-sm">정확한 분석을 위해 출생 정보를 입력해주세요.</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <BirthInputForm value={form} onChange={setForm} label="나의 정보" accent="#9ca3af" />
          </div>
          <button onClick={handleAnalyze} disabled={!ready}
            className={`w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all active:scale-[0.98] ${
              ready
                ? "bg-gradient-to-r from-slate-600 to-zinc-600 hover:from-slate-500 hover:to-zinc-500 text-white shadow-lg shadow-black/50"
                : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
            }`}>
            오늘의 운세 분석하기
          </button>
        </div>
      </main>
    );
  }

  if (step === "loading") {
    return <AnalysisLoading subject="오늘의 운세" duration={2200} onDone={() => setStep("result")}
      messages={[
        "원국 4기둥을 불러오는 중...",
        "현재 대운과 올해 세운을 계산하는 중...",
        "오늘의 일진과 합충 관계를 분석하는 중...",
        "총운·재물·애정·건강·공부운을 정리하는 중...",
      ]}
    />;
  }

  // ── 결과 ──
  const r = resultRef.current;
  if (!r) return null;
  const ilgan = r.pillarsDetail.day.cg;
  const today = new Date();

  // 대운
  const yy = Number(form.birthYear), mm = Number(form.birthMonth), dd = Number(form.birthDay);
  const daewoon = calcDaewoon(yy, mm, dd, form.gender, ilgan, { cg: r.pillarsDetail.month.cg, jj: r.pillarsDetail.month.jj });
  const currentDaewoon = daewoon.pillars[Math.max(0, daewoon.currentIdx)];

  // 세운 (올해)
  const thisYear = today.getFullYear();
  const yearPillar = getYearPillar(thisYear);
  const sewoonSipseongCg = getSipseong(ilgan, yearPillar.cg);

  // 오늘 일진
  const dayPillar = getDayPillar(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const todaySipseongCg = getSipseong(ilgan, dayPillar.cg);
  const todayGroup = SIPSEONG_GROUP[todaySipseongCg] ?? "비겁";
  const todayUunseong = getUunseong(ilgan, dayPillar.jj);

  // 명식표 컬럼 (시-일-월-년-대운-세운-오늘)
  type Col = { label: string; cg: string; jj: string; sipseongCg: string };
  const cols: Col[] = [
    { label: "시주", cg: r.pillarsDetail.hour?.cg ?? "-", jj: r.pillarsDetail.hour?.jj ?? "-", sipseongCg: r.pillarsDetail.hour?.sipseongCg ?? "-" },
    { label: "일주", cg: r.pillarsDetail.day.cg, jj: r.pillarsDetail.day.jj, sipseongCg: "본인" },
    { label: "월주", cg: r.pillarsDetail.month.cg, jj: r.pillarsDetail.month.jj, sipseongCg: r.pillarsDetail.month.sipseongCg },
    { label: "년주", cg: r.pillarsDetail.year.cg, jj: r.pillarsDetail.year.jj, sipseongCg: r.pillarsDetail.year.sipseongCg },
    { label: `대운 (${currentDaewoon.age}세~)`, cg: currentDaewoon.cg, jj: currentDaewoon.jj, sipseongCg: currentDaewoon.sipseongCg },
    { label: `세운 (${thisYear})`, cg: yearPillar.cg, jj: yearPillar.jj, sipseongCg: sewoonSipseongCg },
    { label: "오늘", cg: dayPillar.cg, jj: dayPillar.jj, sipseongCg: todaySipseongCg },
  ];

  // 합충형파해 분석 — 원국 4지지 + 대운 + 세운 + 오늘 지지 전체
  const allJjLabels = cols.map(c => c.label);
  const allJjs = cols.map(c => c.jj);
  const relations = sortJijiRelationsByStrength(getJijiRelations(allJjs));

  // 천간합·충 — 오늘/세운/대운의 천간이 원국 천간(일간 포함)과 맺는 관계
  const wonguk천간 = [
    { label: "년간", cg: r.pillarsDetail.year.cg },
    { label: "월간", cg: r.pillarsDetail.month.cg },
    { label: "일간", cg: r.pillarsDetail.day.cg },
    ...(r.pillarsDetail.hour ? [{ label: "시간", cg: r.pillarsDetail.hour.cg }] : []),
  ];
  const flowCg = [
    { label: `대운(${currentDaewoon.age}세~)`, cg: currentDaewoon.cg },
    { label: `세운(${thisYear})`, cg: yearPillar.cg },
    { label: "오늘", cg: dayPillar.cg },
  ];
  const cgRelations: { from: string; to: string; a: string; b: string; type: "합" | "충" }[] = [];
  for (const f of flowCg) {
    for (const w of wonguk천간) {
      for (const [x, y] of CG_HAP) {
        if ((f.cg === x && w.cg === y) || (f.cg === y && w.cg === x)) {
          cgRelations.push({ from: f.label, to: w.label, a: f.cg, b: w.cg, type: "합" });
        }
      }
      for (const [x, y] of CG_CHUNG) {
        if ((f.cg === x && w.cg === y) || (f.cg === y && w.cg === x)) {
          cgRelations.push({ from: f.label, to: w.label, a: f.cg, b: w.cg, type: "충" });
        }
      }
    }
  }

  // 오늘 지지가 원국/세운/대운 지지와 맺는 충·합 여부 (영역별 해설 보정용)
  const todayRelations = relations.filter(rel => allJjLabels[rel.a] === "오늘" || allJjLabels[rel.b] === "오늘");
  const hasTodayChung = todayRelations.some(rel => rel.type === "충") || cgRelations.some(c => c.from === "오늘" && c.type === "충");
  const hasTodayHap = todayRelations.some(rel => rel.type === "육합" || rel.type === "삼합" || rel.type === "반합") || cgRelations.some(c => c.from === "오늘" && c.type === "합");

  const groupContent = GROUP_TODAY[todayGroup];

  return (
    <main className="min-h-screen bg-[#06060e] text-white">
      <BackButton />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-slate-800/30 blur-[160px]" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-16" id="today-result">
        <div className="text-center mb-8">
          <p className="text-gray-400 text-xs font-bold tracking-widest mb-2">TODAY&apos;S FORTUNE</p>
          <h1 className="text-2xl font-black leading-snug">
            {ilgan}{r.pillarsDetail.day.jj}일주 {form.name || "나"}님,<br />
            오늘은 {dayPillar.cg}{dayPillar.jj}일 ({todaySipseongCg})
          </h1>
          <p className="text-xs text-gray-500 mt-2">{today.getFullYear()}.{today.getMonth() + 1}.{today.getDate()} · 12운성: {todayUunseong}</p>
        </div>

        {/* 명식표 */}
        <FadeIn delay={0}>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-3 mb-5 overflow-x-auto">
          <p className="text-sm font-bold text-gray-300 mb-3 px-1">원국 · 대운 · 세운 · 오늘 명식표</p>
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(56px, 1fr))` }}>
            {cols.map((c, i) => (
              <div key={i} className="text-center text-[10px] text-gray-500 font-bold pb-1">{c.label}</div>
            ))}
            {cols.map((c, i) => (
              <div key={i} className="rounded-lg p-2 text-center"
                style={{ background: i >= 4 ? "rgba(156,163,175,0.08)" : "rgba(255,255,255,0.02)", border: `1px solid ${i >= 4 ? "rgba(156,163,175,0.25)" : "rgba(255,255,255,0.06)"}` }}>
                <p className="text-base font-black" style={{ color: EL_STYLE[CHEONGAN_ELEMENT[c.cg] || "토"]?.text }}>{c.cg}</p>
                <p className="text-base font-black" style={{ color: EL_STYLE[jijiElement(c.jj)]?.text }}>{c.jj}</p>
              </div>
            ))}
            {cols.map((c, i) => (
              <div key={i} className="text-center text-[10px] text-gray-500 mt-1">{c.sipseongCg}</div>
            ))}
          </div>
        </div>
        </FadeIn>

        {/* 합충형파해 분석 */}
        <FadeIn delay={80}>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-gray-300 mb-3">전체 합·충·형·파·해 분석</p>
          {relations.length === 0 && cgRelations.length === 0 ? (
            <p className="text-sm text-gray-500 leading-relaxed">원국·대운·세운·오늘 사이에 두드러진 합충 관계는 보이지 않아요. 큰 동요 없이 평이하게 흘러가는 흐름입니다.</p>
          ) : (
            <div className="space-y-2">
              {relations.map((rel, i) => (
                <div key={`jj-${i}`} className="flex items-center gap-2 text-sm">
                  <span className="font-bold" style={{ color: REL_TYPE_COLOR[rel.type] }}>{rel.type}</span>
                  <span className="text-gray-300">{allJjLabels[rel.a]}({rel.jjA}) ↔ {allJjLabels[rel.b]}({rel.jjB})</span>
                </div>
              ))}
              {cgRelations.map((rel, i) => (
                <div key={`cg-${i}`} className="flex items-center gap-2 text-sm">
                  <span className="font-bold" style={{ color: rel.type === "합" ? "#4ade80" : "#f87171" }}>천간{rel.type}</span>
                  <span className="text-gray-300">{rel.from}({rel.a}) ↔ {rel.to}({rel.b})</span>
                </div>
              ))}
            </div>
          )}
        </div>
        </FadeIn>

        {/* 총운 */}
        <FadeIn delay={160}>
        <div className="bg-gradient-to-br from-slate-800/40 to-zinc-900/40 border border-white/10 rounded-3xl p-6 mb-5">
          <p className="text-gray-400 text-xs font-bold tracking-widest uppercase mb-2">오늘의 총운 — 일진 {todaySipseongCg} ({todayGroup})</p>
          <p className="text-sm text-gray-200 leading-relaxed">{groupContent.총운}</p>
          {hasTodayHap && (
            <p className="text-sm text-emerald-300 leading-relaxed mt-3">✦ 오늘 원국·세운과 합(合)을 이루는 기운이 있어, 전반적으로 일이 무난하게 풀리고 사람과의 관계도 부드럽게 이어질 가능성이 높은 날입니다.</p>
          )}
          {hasTodayChung && (
            <p className="text-sm text-rose-300 leading-relaxed mt-3">⚠ 오늘 원국·세운과 충(沖)을 이루는 기운이 있어, 예상치 못한 변수나 마음이 흔들리는 일이 생기기 쉬운 날이에요. 중요한 결정은 하루 정도 미뤄보는 것도 방법입니다.</p>
          )}
        </div>
        </FadeIn>

        {/* 재물운 */}
        <FadeIn delay={240}>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-amber-300 mb-1">💰 재물운</p>
          <p className="text-sm text-gray-300 leading-relaxed">{groupContent.재물}</p>
        </div>
        </FadeIn>

        {/* 애정운 */}
        <FadeIn delay={320}>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-pink-300 mb-1">💞 애정·연애운</p>
          <p className="text-sm text-gray-300 leading-relaxed">{groupContent.애정}</p>
        </div>
        </FadeIn>

        {/* 건강운 */}
        <FadeIn delay={400}>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-emerald-300 mb-1">🩺 건강운</p>
          <p className="text-sm text-gray-300 leading-relaxed">{groupContent.건강}</p>
        </div>
        </FadeIn>

        {/* 공부/문서운 */}
        <FadeIn delay={480}>
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-8">
          <p className="text-sm font-bold text-sky-300 mb-1">📄 공부·문서운</p>
          <p className="text-sm text-gray-300 leading-relaxed">{groupContent.공부문서}</p>
        </div>
        </FadeIn>

        <FadeIn delay={560}>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push("/service/daewoon")}
            className="py-3.5 rounded-2xl font-bold text-sm bg-white/5 border border-white/10 text-gray-300 active:scale-[0.98] transition-all">
            대운·세운 80년 보기
          </button>
          <button onClick={() => { setStep("entry"); resultRef.current = null; }}
            className="py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-slate-600 to-zinc-600 text-white active:scale-[0.98] transition-all">
            다시 분석하기
          </button>
        </div>
        <ShareImageButton targetId="today-result" fileName="오늘의_운세" />
        </FadeIn>
      </div>
    </main>
  );
}

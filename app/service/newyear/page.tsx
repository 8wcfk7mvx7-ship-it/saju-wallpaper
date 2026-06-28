"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import BackButton from "@/components/BackButton";
import { analyzeSaju, CHEONGAN_ELEMENT, type SajuResult, type Element } from "@/lib/saju";
import AnalysisLoading from "@/components/AnalysisLoading";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";
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

const CHEONGAN_HAP: Record<string, string> = { 갑: "기", 을: "경", 병: "신", 정: "임", 무: "계", 기: "갑", 경: "을", 신: "병", 임: "정", 계: "무" };
const CHEONGAN_CHUNG: Record<string, string> = { 갑: "경", 을: "신", 병: "임", 정: "계", 경: "갑", 신: "을", 임: "병", 계: "정" };
const JIJI_YUKHAP: [string, string][] = [["자", "축"], ["인", "해"], ["묘", "술"], ["진", "유"], ["사", "신"], ["오", "미"]];
const JIJI_CHUNG: [string, string][] = [["자", "오"], ["축", "미"], ["인", "신"], ["묘", "유"], ["진", "술"], ["사", "해"]];
const GENERATES: Record<Element, Element> = { 목: "화", 화: "토", 토: "금", 금: "수", 수: "목" };
const CONTROLS: Record<Element, Element> = { 목: "토", 토: "수", 수: "화", 화: "금", 금: "목" };

// 음력 월별 절기 오행 (월령) — 1/2월=목, 3/6/9/12월=토, 4/5월=화, 7/8월=금, 10/11월=수
const MONTH_EL: Element[] = ["목", "목", "토", "화", "화", "토", "금", "금", "토", "수", "수", "토"];

interface YearInfo { year: number; cg: string; jj: string; label: string; hanja: string; }
const YEARS: YearInfo[] = [
  { year: 2026, cg: "병", jj: "오", label: "병오년", hanja: "丙午年" },
  { year: 2027, cg: "정", jj: "미", label: "정미년", hanja: "丁未年" },
];

function analyzeYear(r: SajuResult, y: YearInfo) {
  const ilgan = r.pillarsDetail.day.cg;
  const ilji = r.pillarsDetail.day.jj;
  const yongshinEl = r.yongshin.yongshin;
  const heeshinEl = r.yongshin.heeshin;
  const gishinEl = r.yongshin.gishin;
  const yearCgEl = CHEONGAN_ELEMENT[y.cg];

  const lines: { title: string; desc: string; tone: "good" | "neutral" | "warn" }[] = [];

  // 천간 관계
  if (CHEONGAN_HAP[ilgan] === y.cg) {
    lines.push({ title: "일간과 세운 천간 — 합(合)", tone: "good",
      desc: `일간 ${ilgan}과 ${y.year}년의 천간 ${y.cg}이 합을 이룹니다. 새로운 사람·기회와 자연스럽게 연결되는 흐름이 강해지는 해입니다. 다만 합은 '묶이는' 기운이기도 해서, 새로운 인연이나 계약에 휩쓸리듯 끌려가기 전에 한 번 더 점검하는 습관이 필요합니다.` });
  } else if (CHEONGAN_CHUNG[ilgan] === y.cg) {
    lines.push({ title: "일간과 세운 천간 — 충(沖)", tone: "warn",
      desc: `일간 ${ilgan}과 ${y.year}년의 천간 ${y.cg}이 충돌하는 관계입니다. 익숙했던 환경이나 관계에 변화의 자극이 들어오는 해입니다. 변화 자체는 나쁜 것이 아니지만, 중요한 결정을 감정적으로 내리기보다 한 박자 늦춰서 판단하는 것이 도움이 됩니다.` });
  }

  // 일간-세운 오행 상생상극
  const ilganEl = CHEONGAN_ELEMENT[ilgan];
  if (GENERATES[yearCgEl] === ilganEl) {
    lines.push({ title: "세운의 기운이 나를 채워주는 흐름", tone: "good",
      desc: `${y.year}년의 ${y.cg}(${yearCgEl}) 기운이 일간 ${ilgan}(${ilganEl})을 생(生)해줍니다. 외부에서 도움이나 기회가 들어오기 쉬운 흐름으로, 새로운 시도를 했을 때 주변의 지원을 받기 좋은 해입니다.` });
  } else if (GENERATES[ilganEl] === yearCgEl) {
    lines.push({ title: "내가 에너지를 쏟아야 하는 흐름", tone: "neutral",
      desc: `일간 ${ilgan}(${ilganEl})이 ${y.year}년의 기운 ${y.cg}(${yearCgEl})을 생(生)하는 관계입니다. 내가 가진 것을 밖으로 표현하고 베푸는 만큼 결과가 따라오는 해입니다. 과도하게 쏟아붓기만 하면 본인의 에너지가 소모될 수 있으니, 들어오는 것과 나가는 것의 균형을 의식하세요.` });
  } else if (CONTROLS[yearCgEl] === ilganEl) {
    lines.push({ title: "세운의 압박이 들어오는 흐름", tone: "warn",
      desc: `${y.year}년의 기운 ${y.cg}(${yearCgEl})이 일간 ${ilgan}(${ilganEl})을 극(剋)하는 관계입니다. 외부 환경이나 책임으로부터 압박감을 느끼기 쉬운 해입니다. 다만 이 압박을 잘 활용하면 평소 미뤄왔던 일을 마무리하는 동력이 되기도 합니다 — 무리한 확장보다 정리와 마무리에 집중하는 한 해로 삼아보세요.` });
  } else if (CONTROLS[ilganEl] === yearCgEl) {
    lines.push({ title: "내가 주도권을 쥐는 흐름", tone: "good",
      desc: `일간 ${ilgan}(${ilganEl})이 ${y.year}년의 기운 ${y.cg}(${yearCgEl})을 극(剋)하는 관계입니다. 외부 상황을 내가 다루고 통제할 수 있다고 느끼는 해로, 적극적으로 일을 추진하기 좋은 흐름입니다. 다만 통제하려는 마음이 과해지면 주변 사람과의 마찰로 이어질 수 있으니, 협의의 과정을 건너뛰지 않는 것이 좋습니다.` });
  }

  // 지지 관계
  const yukhap = JIJI_YUKHAP.find(([a, b]) => (a === ilji && b === y.jj) || (a === y.jj && b === ilji));
  if (yukhap) {
    lines.push({ title: "일지와 세운 지지 — 육합(六合)", tone: "good",
      desc: `일지 ${ilji}와 ${y.year}년의 지지 ${y.jj}가 육합을 이룹니다. 생활 전반에서 안정감과 화합의 기운이 강해지는 해입니다. 사람과의 관계, 거주 환경 등에서 새로운 결합(이사, 동거, 계약, 결혼 등)이 자연스럽게 따라오기 좋은 흐름입니다.` });
  }
  const chung = JIJI_CHUNG.find(([a, b]) => (a === ilji && b === y.jj) || (a === y.jj && b === ilji));
  if (chung) {
    lines.push({ title: "일지와 세운 지지 — 충(沖)", tone: "warn",
      desc: `일지 ${ilji}와 ${y.year}년의 지지 ${y.jj}가 충하는 관계입니다. 거주지·소속·일상의 패턴에 변화가 생기기 쉬운 해입니다. 이사·이직·관계 변화 등이 강제로 닥치기보다, 스스로 먼저 정리하고 움직이는 쪽이 훨씬 유리합니다.` });
  }

  // 용신/희신/기신 관계
  if (yearCgEl === yongshinEl || yearCgEl === heeshinEl) {
    lines.push({ title: "용신·희신의 해 — 흐름이 나를 돕습니다", tone: "good",
      desc: `${y.year}년의 기운(${yearCgEl})이 이 사주에 필요한 용신 또는 희신과 같은 오행입니다. 평소보다 일이 술술 풀리는 느낌을 받기 쉬운 해입니다. 다만 운이 좋다고 느낄 때일수록 기본을 다지는 작업(건강, 자산 정리, 인간관계 정비)을 함께 해두면 다음 흐름까지 안정적으로 이어집니다.` });
  } else if (yearCgEl === gishinEl) {
    lines.push({ title: "기신의 해 — 평소보다 신중함이 필요합니다", tone: "warn",
      desc: `${y.year}년의 기운(${yearCgEl})이 이 사주에서 꺼리는 기신과 같은 오행입니다. 평소 같으면 무리 없이 넘어갈 일도 한 번 더 발목을 잡는 듯한 느낌을 받을 수 있습니다. 큰 결정(이사, 사업 확장, 큰 투자)은 가급적 다음 해로 미루고, 올해는 내부 정비와 체력 관리에 집중하는 것이 좋습니다.` });
  }

  return lines;
}

function analyzeMonths(r: SajuResult) {
  const yongshinEl = r.yongshin.yongshin;
  const heeshinEl = r.yongshin.heeshin;
  const gishinEl = r.yongshin.gishin;
  return MONTH_EL.map((el, i) => {
    let tone: "good" | "neutral" | "warn" = "neutral";
    if (el === yongshinEl || el === heeshinEl) tone = "good";
    else if (el === gishinEl) tone = "warn";
    return { month: i + 1, el, tone };
  });
}

export default function NewYearPage() {
  const router = useRouter();
  const [step, setStep] = useState<"entry" | "form" | "loading" | "result">("entry");
  const [form, setForm] = useState<BirthFormData>(defaultBirthData("female"));
  const [yearIdx, setYearIdx] = useState(0);
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
      <main className="min-h-screen bg-[#0a0810] text-white flex flex-col page-fade-in">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[650px] h-[650px] rounded-full bg-rose-950/40 blur-[160px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-amber-950/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-5 py-16 text-center">
          <FadeIn delay={0}>
            <div className="inline-block px-3 py-1 rounded-full bg-rose-900/50 border border-rose-700/40 text-rose-300 text-xs font-bold tracking-wider mb-8">
              🐎 2026 병오년 · 🐑 2027 정미년 신년운세
            </div>
            <h1 className="text-3xl font-black mb-4 leading-tight tracking-tight">
              다가올 두 해,<br />
              <span className="text-rose-400">내 사주와 어떻게</span> 부딪힐까?
            </h1>
          </FadeIn>

          <FadeIn delay={100}>
            <p className="text-gray-400 text-base mb-2 leading-relaxed">
              매년 똑같은 운세를 보고 있지 않나요?<br />
              <span className="text-gray-300 font-medium">내 일간·일지·용신 기준으로 본 진짜 흐름입니다.</span>
            </p>
            <p className="text-gray-600 text-sm mb-12">
              2026년과 2027년, 미리 알고 준비하세요
            </p>
          </FadeIn>

          <FadeIn delay={200} className="w-full">
            <div className="w-full space-y-3 mb-10 text-left">
              {[
                ["일간 vs 세운 — 합·충·생·극", "올해의 기운이 나를 돕는지, 압박하는지 정확히 진단"],
                ["일지 vs 세운 지지 — 변화의 신호", "이사·이직·관계 변화가 들어오기 쉬운 해인지 확인"],
                ["용신·희신·기신 — 흐름의 총평", "이 해가 나에게 순풍인지 역풍인지 한 줄로 정리"],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-white">{title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeIn>

          <FadeIn delay={300} className="w-full">
            <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-bold tracking-wider mb-6">
              ✦ 완전 무료 · 2026 + 2027 동시 확인
            </div>

            <button onClick={() => setStep("form")}
              className="w-full py-4 rounded-2xl font-black text-lg tracking-tight bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-lg shadow-rose-900/50 transition-all active:scale-[0.98]">
              내 신년운세 확인하기
            </button>
          </FadeIn>
        </div>
      </main>
    );
  }

  if (step === "form") {
    const ready = !!form.birthYear && !!form.birthMonth && !!form.birthDay;
    return (
      <main className="min-h-screen bg-[#0a0810] text-white">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[600px] h-[600px] rounded-full bg-rose-950/40 blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">생년월일 입력</h2>
            <p className="text-gray-500 text-sm">정확한 분석을 위해 출생 정보를 입력해주세요.</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <BirthInputForm value={form} onChange={setForm} label="나의 정보" accent="#f43f5e" />
          </div>
          <button onClick={handleAnalyze} disabled={!ready}
            className={`w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all active:scale-[0.98] ${
              ready
                ? "bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white shadow-lg shadow-rose-900/50"
                : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
            }`}>
            신년운세 분석하기
          </button>
        </div>
      </main>
    );
  }

  if (step === "loading") {
    return (
      <AnalysisLoading
        subject="2026·2027 신년운세"
        duration={2200}
        onDone={() => setStep("result")}
        messages={[
          "일간과 세운의 합충 관계를 따지는 중...",
          "일지와 세운 지지의 변화 신호를 찾는 중...",
          "용신·희신·기신 기준으로 흐름을 정리하는 중...",
        ]}
      />
    );
  }

  // ── 결과 ──
  const r = resultRef.current;
  if (!r) return null;
  const y = YEARS[yearIdx];
  const lines = analyzeYear(r, y);
  const months = analyzeMonths(r);
  const monthDot = { good: "bg-emerald-400", neutral: "bg-white/20", warn: "bg-rose-400" };
  const toneColor = { good: "text-emerald-300", neutral: "text-sky-300", warn: "text-rose-300" };
  const toneBg = { good: "border-emerald-700/20", neutral: "border-white/10", warn: "border-rose-700/20" };

  return (
    <main className="min-h-screen bg-[#0a0810] text-white">
      <BackButton />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-rose-950/30 blur-[160px]" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-16" id="newyear-result">
        <div className="text-center mb-6">
          <p className="text-rose-400 text-xs font-bold tracking-widest mb-2">NEW YEAR FORTUNE</p>
          <h1 className="text-2xl font-black leading-snug">
            {r.pillarsDetail.day.cg}{r.pillarsDetail.day.jj}일주, 다가올 해의 흐름
          </h1>
        </div>

        {/* 연도 탭 */}
        <div className="flex gap-2 mb-5">
          {YEARS.map((yy, i) => (
            <button key={yy.year} onClick={() => setYearIdx(i)}
              className={`flex-1 py-3 rounded-2xl text-sm font-black transition-all ${
                i === yearIdx
                  ? "bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-lg shadow-rose-900/40"
                  : "bg-white/5 border border-white/10 text-gray-400"
              }`}>
              {yy.year} {yy.label} ({yy.hanja})
            </button>
          ))}
        </div>

        <div className="bg-gradient-to-br from-rose-950/60 to-amber-950/40 border border-rose-700/30 rounded-3xl p-6 mb-5 text-center">
          <p className="text-rose-300 text-xs font-bold tracking-widest uppercase mb-2">{y.year}년 — {y.label}({y.hanja})</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            {y.year}년은 천간 &apos;{y.cg}&apos;, 지지 &apos;{y.jj}&apos;의 기운이 흐르는 해입니다. 아래는 이 기운이 당신의 일간 &apos;{r.pillarsDetail.day.cg}&apos;, 일지 &apos;{r.pillarsDetail.day.jj}&apos;, 그리고 사주 전체의 용신(&apos;{r.yongshin.yongshin}&apos;)과 어떻게 맞부딫히는지를 정리한 결과입니다.
          </p>
        </div>

        {lines.length === 0 ? (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-sm text-gray-300 leading-relaxed">
              {y.year}년의 기운은 당신의 사주와 강한 합·충 없이 무난하게 흘러갑니다. 큰 변화도 큰 압박도 없는, 평소의 페이스를 유지하기 좋은 해입니다. 다만 그만큼 새로운 자극이 적을 수 있으니, 변화가 필요하다면 스스로 계기를 만드는 것이 좋습니다.
            </p>
          </div>
        ) : lines.map((l, i) => (
          <div key={i} className={`bg-white/[0.03] border ${toneBg[l.tone]} rounded-2xl p-5 mb-3`}>
            <p className={`text-sm font-bold mb-1 ${toneColor[l.tone]}`}>{l.title}</p>
            <p className="text-sm text-gray-300 leading-relaxed">{l.desc}</p>
          </div>
        ))}

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-gray-300 mb-1">월별 흐름 한눈에 보기 (음력 기준)</p>
          <p className="text-xs text-gray-500 mb-3">각 달의 기운이 내 용신·희신·기신과 만나는지 표시했습니다. 초록은 순풍, 빨강은 신중 모드.</p>
          <div className="grid grid-cols-6 gap-2">
            {months.map((mo) => (
              <div key={mo.month} className="flex flex-col items-center gap-1 bg-white/[0.02] border border-white/5 rounded-xl py-2.5">
                <span className="text-xs font-bold text-gray-300">{mo.month}월</span>
                <span className={`w-2 h-2 rounded-full ${monthDot[mo.tone]}`} />
                <span className="text-[10px] text-gray-500">{mo.el}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-5">
          <button onClick={() => router.push("/service/daewoon")}
            className="py-3.5 rounded-2xl font-bold text-sm bg-white/5 border border-white/10 text-gray-300 active:scale-[0.98] transition-all">
            대운 흐름 보기
          </button>
          <button onClick={() => { setStep("entry"); resultRef.current = null; }}
            className="py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-rose-600 to-amber-600 text-white active:scale-[0.98] transition-all">
            다시 분석하기
          </button>
        </div>
        <ResultFooterActions targetId="newyear-result" fileName="신년운세" />
      </div>
    </main>
  );
}

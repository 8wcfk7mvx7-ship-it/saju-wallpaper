"use client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import BackButton from "@/components/BackButton";
import { analyzeSaju, analyzeSipseongPatterns, type SajuResult } from "@/lib/saju";
import { SIPSEONG_DESC } from "@/lib/saju2";
import AnalysisLoading from "@/components/AnalysisLoading";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";

export const dynamic = "force-dynamic";

// 자녀운 등급 (자녀 십성 개수 기준)
const CHILD_LEVEL = [
  { min: 3, label: "자녀 인연이 매우 강한 사주", color: "#34d399",
    desc: "자녀와 관련된 기운이 사주 곳곳에 자리하고 있습니다. 아이를 낳았을 때 인생에서 자녀가 차지하는 비중이 매우 크고, 아이로부터 정서적 위로와 활력을 강하게 받는 구조입니다. 노후에도 자녀와의 관계가 인생의 중심축이 될 가능성이 높습니다." },
  { min: 1, label: "자녀 인연이 적당히 있는 사주", color: "#fbbf24",
    desc: "자녀운이 무난하게 자리하고 있습니다. 아이를 키우는 과정에서 부담과 보람이 균형을 이루고, 자녀가 인생의 중요한 한 축이 되지만 인생 전체를 좌우할 정도는 아닙니다. 배우자와의 관계, 본인의 커리어와 균형을 맞춰가는 구조입니다." },
  { min: 0, label: "자녀보다 본인의 영역이 더 중요한 사주", color: "#a78bfa",
    desc: "사주 안에서 자녀를 의미하는 기운이 약합니다. 이는 &apos;아이를 싫어한다&apos;는 뜻이 아니라, 인생의 중심이 자녀보다 본인의 일·성장·관계 쪽에 더 강하게 쏠려 있다는 의미입니다. 아이를 낳더라도 본인만의 영역과 시간을 확보하는 것이 훨씬 중요해지는 구조입니다." },
];

export default function ChildPage() {
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
      <main className="min-h-screen bg-[#070a10] text-white flex flex-col">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[650px] h-[650px] rounded-full bg-cyan-950/40 blur-[160px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-950/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-5 py-16 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-cyan-900/50 border border-cyan-700/40 text-cyan-300 text-xs font-bold tracking-wider mb-8">
            ✦ 완전 무료
          </div>
          <h1 className="text-4xl font-black mb-4 leading-tight tracking-tight">
            내가 아이를<br />
            <span className="text-cyan-400">낳는다면?</span>
          </h1>
          <p className="text-gray-400 text-base mb-2 leading-relaxed">
            낳고 후회하지 않을지, 잘 키울 수 있을지,<br />
            <span className="text-gray-300 font-medium">내 인생에서 아이의 비중은 얼마나 될지.</span>
          </p>
          <p className="text-gray-600 text-sm mb-12">
            남들은 다 아는데 나만 모르고 있던 이야기
          </p>

          <div className="w-full space-y-3 mb-10 text-left">
            {[
              ["자녀 인연의 강도", "내 사주에 자녀운이 강한지 약한지부터 확인"],
              ["아이가 나에게 주는 의미", "위로가 될지, 새로운 부담이 될지"],
              ["배우자 vs 자녀, 인생의 무게중심", "둘 중 무엇이 더 중요해질지"],
              ["성격 차이 가능성과 육아 방향", "내 기질과 충돌하지 않는 육아 팁"],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-start gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setStep("form")}
            className="w-full py-4 rounded-2xl font-black text-lg tracking-tight bg-gradient-to-r from-cyan-700 to-emerald-600 hover:from-cyan-600 hover:to-emerald-500 text-white shadow-lg shadow-cyan-900/50 transition-all active:scale-[0.98]">
            내 자녀운 확인하기
          </button>
        </div>
      </main>
    );
  }

  if (step === "form") {
    const ready = !!form.birthYear && !!form.birthMonth && !!form.birthDay;
    return (
      <main className="min-h-screen bg-[#070a10] text-white">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[600px] h-[600px] rounded-full bg-cyan-950/40 blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">생년월일 입력</h2>
            <p className="text-gray-500 text-sm">정확한 분석을 위해 출생 정보를 입력해주세요. (성별에 따라 자녀운 기준이 달라집니다)</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <BirthInputForm value={form} onChange={setForm} label="나의 정보" accent="#22d3ee" />
          </div>
          <button onClick={handleAnalyze} disabled={!ready}
            className={`w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all active:scale-[0.98] ${
              ready
                ? "bg-gradient-to-r from-cyan-700 to-emerald-600 hover:from-cyan-600 hover:to-emerald-500 text-white shadow-lg shadow-cyan-900/50"
                : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
            }`}>
            자녀운 분석하기
          </button>
        </div>
      </main>
    );
  }

  if (step === "loading") {
    return <AnalysisLoading subject="나와 아이의 인연" duration={2200} onDone={() => setStep("result")} />;
  }

  // ── 결과 ──
  const r = resultRef.current;
  if (!r) return null;
  const ilgan = r.pillarsDetail.day.cg;
  const isFemale = form.gender === "female";

  // 십성 그룹 카운트는 천간(원국 본기둥)에만 드러난 십성만 센다. 지장간은 해석 참고용일 뿐 카운트에 포함하지 않는다.
  const sipseongList = [
    r.pillarsDetail.year.sipseongCg,
    r.pillarsDetail.month.sipseongCg,
    r.pillarsDetail.hour?.sipseongCg,
  ].filter(Boolean) as string[];
  const counts: Record<string, number> = {};
  sipseongList.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
  const totalCount = (key: string) => counts[key] || 0;

  // 여성: 식상(식신·상관) = 자녀, 남성: 관성(정관·편관) = 자녀
  const childKeys = isFemale ? ["식신", "상관"] : ["정관", "편관"];
  const childCount = childKeys.reduce((sum, k) => sum + totalCount(k), 0);
  const level = CHILD_LEVEL.find(l => childCount >= l.min) ?? CHILD_LEVEL[CHILD_LEVEL.length - 1];

  // 격국(십성 구조) — 무비겁/무재/쟁재/무관 등 사주 전체 패턴
  const patterns = analyzeSipseongPatterns(r.pillarsDetail);

  // 월지(月支) 조후 — 자녀운이 계절적으로 어떤 환경에서 자라는지
  const monthJj = r.pillarsDetail.month.jj;
  const SEASON_CHILD: Record<string, string> = {
    인: "봄", 묘: "봄", 진: "봄",
    사: "여름", 오: "여름", 미: "여름",
    신: "가을", 유: "가을", 술: "가을",
    해: "겨울", 자: "겨울", 축: "겨울",
  };
  const season = SEASON_CHILD[monthJj] ?? "환절기";
  const SEASON_CHILD_DESC: Record<string, string> = {
    봄: "월지가 봄(생장의 기운)에 해당해 새로운 것을 키우고 돌보는 에너지가 강한 사주입니다. 아이를 키우는 과정 자체에서 성장과 활력을 느끼기 쉬운 환경입니다.",
    여름: "월지가 여름(확산·발산의 기운)에 해당해 에너지가 외부로 뻗어나가는 사주입니다. 육아처럼 에너지를 한 곳에 집중해야 하는 상황에서는 의식적인 페이스 조절이 필요합니다.",
    가을: "월지가 가을(수확·결실의 기운)에 해당해 결과와 성과를 중시하는 사주입니다. 아이의 성장 과정을 결과보다 과정으로 바라보는 연습이 육아 만족도를 크게 높여줍니다.",
    겨울: "월지가 겨울(응축·휴식의 기운)에 해당해 안으로 에너지를 모으는 사주입니다. 활동적인 육아보다 차분하고 정서적으로 깊은 교감 중심의 육아 스타일이 잘 맞습니다.",
    환절기: "월지가 환절기 기운에 해당해 변화에 유연하게 적응하는 사주입니다. 아이의 성장 단계마다 육아 방식을 유연하게 바꿔나가는 것이 잘 맞습니다.",
  };

  const mainChildKey = childKeys.reduce((a, b) => (counts[b] || 0) > (counts[a] || 0) ? b : a, childKeys[0]);
  const childDesc = SIPSEONG_DESC[mainChildKey];

  // 시주 = 자녀궁
  const hourPillar = r.pillarsDetail.hour;
  const hasHourSinsal = r.sinsalList.some(s => s.pillars.includes("시"));

  // 배우자(재성/관성) vs 자녀(식상/관성) 비중 비교
  const spouseKeys = isFemale ? ["정관", "편관"] : ["정재", "편재"];
  const spouseCount = spouseKeys.reduce((sum, k) => sum + (counts[k] || 0), 0);
  const priorityIsChild = childCount > spouseCount;
  const priorityEqual = childCount === spouseCount;

  return (
    <main className="min-h-screen bg-[#070a10] text-white">
      <BackButton />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-cyan-950/30 blur-[160px]" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-16">
        <div className="text-center mb-8">
          <p className="text-cyan-400 text-xs font-bold tracking-widest mb-2">IF I HAVE A CHILD</p>
          <h1 className="text-2xl font-black leading-snug">
            {ilgan}{r.pillarsDetail.day.jj}일주, 나와 아이의 인연
          </h1>
        </div>

        <div className="rounded-3xl p-6 mb-5 text-center border bg-gradient-to-br from-cyan-950/60 to-emerald-950/40 border-cyan-700/30">
          <p className="text-cyan-300 text-xs font-bold tracking-widest uppercase mb-2">자녀 인연 진단</p>
          <p className="text-xl font-black leading-snug mb-1" style={{ color: level.color }}>{level.label}</p>
          <p className="text-sm text-gray-300 leading-relaxed">{level.desc}</p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-cyan-300 mb-1">월지({monthJj}) 조후 — {season} 기운의 사주</p>
          <p className="text-sm text-gray-300 leading-relaxed">{SEASON_CHILD_DESC[season]}</p>
        </div>

        {patterns.length > 0 && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-fuchsia-300 mb-2">사주 구조(격국)로 보는 육아 변수</p>
            {patterns.slice(0, 2).map(p => (
              <div key={p.name} className="mb-2 last:mb-0">
                <p className="text-xs font-bold text-white mb-0.5">{p.name} ({p.hanja})</p>
                <p className="text-sm text-gray-300 leading-relaxed mb-1">{p.desc}</p>
                <p className="text-xs text-emerald-300">▶ {p.advice}</p>
              </div>
            ))}
          </div>
        )}

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-emerald-300 mb-1">아이가 나에게 주는 의미</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            {childCount >= 2
              ? "아이는 단순히 키워야 할 존재를 넘어, 당신에게 새로운 삶의 동기와 위로를 주는 존재가 될 가능성이 큽니다. 아이를 통해 오히려 본인이 위로받고 성장하는 경험을 하게 될 확률이 높습니다."
              : childCount === 1
              ? "아이는 당신의 인생에 새로운 챕터를 열어주는 존재입니다. 처음에는 부담으로 느껴지더라도, 시간이 지나며 균형 잡힌 관계로 자리 잡을 가능성이 높습니다."
              : "아이는 당신에게 위로보다는 책임과 도전으로 다가올 가능성이 있습니다. 후회하지 않으려면, 본인의 영역을 일정 부분 유지하면서 육아를 병행할 수 있는 환경을 미리 만들어두는 것이 중요합니다."}
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-violet-300 mb-1">
            배우자 vs 자녀, 인생의 무게중심은?
          </p>
          <p className="text-sm text-gray-300 leading-relaxed">
            {priorityEqual
              ? "두 영역의 기운이 비슷하게 자리하고 있어, 배우자와 자녀 어느 한쪽에 치우치지 않고 균형을 맞추려는 성향이 강합니다. 다만 한쪽에 시간을 많이 쓰면 다른 쪽에서 서운함이 쌓이기 쉬우니, 의식적인 균형 분배가 필요합니다."
              : priorityIsChild
              ? "사주 구조상 배우자보다 자녀 쪽으로 인생의 무게중심이 더 쏠리는 경향이 있습니다. 자녀가 생긴 이후 부부 관계의 우선순위가 자연스럽게 뒤로 밀릴 수 있는데, 배우자와의 관계를 의식적으로 챙기지 않으면 갈등의 원인이 될 수 있습니다."
              : "사주 구조상 자녀보다 배우자와의 관계가 인생에서 더 중요한 비중을 차지하는 경향이 있습니다. 아이가 생기더라도 부부 중심의 관계를 유지하려는 성향이 강하게 나타나며, 이는 아이에게도 안정적인 가정 환경을 제공하는 데 도움이 됩니다."}
          </p>
        </div>

        {childDesc && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-amber-300 mb-1">자녀운의 핵심 기운 — {mainChildKey} ({childDesc.hanja})</p>
            <p className="text-xs text-gray-500 mb-2">{childDesc.short}</p>
            <p className="text-sm text-gray-300 leading-relaxed">{childDesc.detail}</p>
          </div>
        )}

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-pink-300 mb-1">성격 차이, 육아 방향</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            시주({hourPillar ? `${hourPillar.cg}${hourPillar.jj}` : "미입력"})는 자녀궁으로, 아이와의 관계와 성향 차이를 보여줍니다.
            {hasHourSinsal
              ? " 시주에 특이한 기운이 자리하고 있어, 아이와의 관계에서 예상치 못한 변수나 강한 개성 차이가 나타날 수 있습니다. 아이의 기질을 있는 그대로 인정해주는 육아 방식이 잘 맞습니다."
              : " 시주가 비교적 안정적이라, 아이와 큰 갈등 없이 무난한 관계를 이어갈 가능성이 높습니다. 다만 본인의 기질을 아이에게 강요하지 않고 대화로 풀어가는 습관을 들이는 것이 좋습니다."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <button onClick={() => router.push("/service/hotcompat")}
            className="py-3.5 rounded-2xl font-bold text-sm bg-white/5 border border-white/10 text-gray-300 active:scale-[0.98] transition-all">
            우리 속궁합 보기
          </button>
          <button onClick={() => { setStep("entry"); resultRef.current = null; }}
            className="py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-cyan-700 to-emerald-600 text-white active:scale-[0.98] transition-all">
            다시 분석하기
          </button>
        </div>
      </div>
    </main>
  );
}

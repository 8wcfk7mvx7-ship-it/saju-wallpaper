"use client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import BackButton from "@/components/BackButton";
import { analyzeSaju, getSipseong, type SajuResult, type Element } from "@/lib/saju";
import { SIPSEONG_DESC, SIPSEONG_MONEY_COMBO, OVERSEAS_WEALTH_ILGAN } from "@/lib/saju2";
import AnalysisLoading from "@/components/AnalysisLoading";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";

export const dynamic = "force-dynamic";

const ELEMENT_BOOST: Record<Element, { item: string; color: string; tip: string }> = {
  목: { item: "초록·청록 계열, 동쪽 방향, 나무·식물", color: "#4ade80", tip: "동쪽 방향에 화분을 두거나 초록색 소품을 활용하면 재물 기운의 흐름이 살아납니다." },
  화: { item: "빨강·주황 계열, 남쪽 방향, 조명", color: "#f97316", tip: "남쪽 자리를 밝게 유지하고 조명을 추가하면 재물운의 활동성이 올라갑니다." },
  토: { item: "노랑·갈색 계열, 중앙, 도자기 소품", color: "#fbbf24", tip: "책상이나 방의 중앙을 정돈하고 도자기·황토색 소품을 두면 재물이 안정적으로 쌓입니다." },
  금: { item: "흰색·금속 계열, 서쪽 방향, 금속 소품", color: "#e5e7eb", tip: "서쪽 자리에 금속 소품(동전, 액자 프레임 등)을 두면 재물이 단단하게 모이는 기운이 강화됩니다." },
  수: { item: "검정·남색 계열, 북쪽 방향, 어항·물 소품", color: "#38bdf8", tip: "북쪽 방향에 어항이나 물 관련 소품을 두면 재물의 흐름이 막히지 않고 순환됩니다." },
};

export default function WealthPage() {
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
      <main className="min-h-screen bg-[#0a0805] text-white flex flex-col">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[650px] h-[650px] rounded-full bg-amber-950/40 blur-[160px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-yellow-950/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-5 py-16 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-amber-900/50 border border-amber-700/40 text-amber-300 text-xs font-bold tracking-wider mb-8">
            ⚠ &quot;무재성&quot;, &quot;재물복 없다&quot;는 말 들어본 사람 필수 확인
          </div>
          <h1 className="text-4xl font-black mb-4 leading-tight tracking-tight">
            내 사주에<br />
            <span className="text-amber-400">재물운</span>이 있을까?
          </h1>
          <p className="text-gray-400 text-base mb-2 leading-relaxed">
            벌어도 안 모이고, 모아도 새는 이유.<br />
            <span className="text-gray-300 font-medium">사주에 답이 있습니다.</span>
          </p>
          <p className="text-gray-600 text-sm mb-12">
            지금 확인 안 하면 평생 모르고 삽니다
          </p>

          <div className="w-full space-y-3 mb-10 text-left">
            {[
              ["재성(財星) 보유 여부", "내 사주에 돈이 들어올 자리가 있는지부터 확인"],
              ["돈이 새는 구조 진단", "상관생재 · 일주극재 등 재물이 빠져나가는 패턴"],
              ["재물운 높이는 구체적 방법", "내 오행에 맞는 색상·방향·습관 처방"],
            ].map(([title, desc]) => (
              <div key={title} className="flex items-start gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
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
            className="w-full py-4 rounded-2xl font-black text-lg tracking-tight bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-900/50 transition-all active:scale-[0.98]">
            내 재물운 확인하기
          </button>
        </div>
      </main>
    );
  }

  if (step === "form") {
    const ready = !!form.birthYear && !!form.birthMonth && !!form.birthDay;
    return (
      <main className="min-h-screen bg-[#0a0805] text-white">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[600px] h-[600px] rounded-full bg-amber-950/40 blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">생년월일 입력</h2>
            <p className="text-gray-500 text-sm">정확한 분석을 위해 출생 정보를 입력해주세요.</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <BirthInputForm value={form} onChange={setForm} label="나의 정보" accent="#f59e0b" />
          </div>
          <button onClick={handleAnalyze} disabled={!ready}
            className={`w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all active:scale-[0.98] ${
              ready
                ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-900/50"
                : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
            }`}>
            재물운 분석하기
          </button>
        </div>
      </main>
    );
  }

  if (step === "loading") {
    return <AnalysisLoading subject="나의 재물운" duration={2200} onDone={() => setStep("result")} />;
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
  const jaeseongCount = totalCount("정재") + totalCount("편재");
  const sikSangCount = totalCount("식신") + totalCount("상관");
  const inseongCount = totalCount("정인") + totalCount("편인");
  const bigeopCount = totalCount("비견") + totalCount("겁재");
  const hasMuJae = jaeseongCount === 0;

  const topSipseong = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topDesc = topSipseong ? SIPSEONG_DESC[topSipseong] : null;

  // 재물 새는 구조 — 상관 多 or 비겁 多 (지장간 포함)
  let moneyCombo: { name: string; hanja: string; desc: string; advice: string } | null = null;
  if (totalCount("상관") >= 2) moneyCombo = SIPSEONG_MONEY_COMBO["상관생재"];
  else if (bigeopCount >= 2) moneyCombo = SIPSEONG_MONEY_COMBO["일주극재"];

  // 식상생재(食傷生財) — 식상이 재성을 생해주는 구조인지
  const hasSikSangSaengJae = sikSangCount >= 1 && jaeseongCount >= 1;
  // 재극인(財剋印) — 재성이 인성을 극하는 구조인지 (재물 욕심이 학습·문서운을 깎아먹는 패턴)
  const hasJaeGeukIn = jaeseongCount >= 2 && inseongCount >= 1;

  // 용신(用神)이 십성 구조상 어떤 그룹에 해당하는지
  const ELEMENT_TO_CG: Record<Element, string> = { 목: "갑", 화: "병", 토: "무", 금: "경", 수: "임" };
  const yongshinEl = r.yongshin.yongshin;
  const yongshinSipseong = getSipseong(ilgan, ELEMENT_TO_CG[yongshinEl]);
  const SIPSEONG_GROUP: Record<string, "비겁" | "식상" | "재성" | "관성" | "인성"> = {
    비견: "비겁", 겁재: "비겁", 식신: "식상", 상관: "식상",
    정재: "재성", 편재: "재성", 정관: "관성", 편관: "관성", 정인: "인성", 편인: "인성",
  };
  const yongshinGroup = SIPSEONG_GROUP[yongshinSipseong] ?? "재성";

  const GROUP_WEALTH_ADVICE: Record<string, { title: string; desc: string }> = {
    식상: {
      title: "식상(食傷)을 살려 재물을 만드는 구조",
      desc: hasSikSangSaengJae
        ? "용신이 식상 계열이면서 사주 안에 재성도 함께 있습니다. 즉 식상생재(食傷生財) 구조가 성립합니다 — 본인의 재능·아이디어·콘텐츠·기술을 직접 돈으로 연결할 때 재물운이 가장 강하게 작동합니다. 남이 만든 시스템에 들어가 월급을 받는 구조보다, 내가 만든 결과물이 곧 수익이 되는 구조(전문직, 콘텐츠, 1인 사업, 프리랜서)에서 재물운이 크게 열립니다."
        : "용신이 식상 계열입니다. 식신·상관의 기운, 즉 표현력·기술·생산력을 적극적으로 쓸 때 재물운이 따라옵니다. 다만 사주 안에 재성이 아직 약하므로, 식상으로 만든 가치를 실제 수익 구조(상품화·계약·플랫폼 입점 등)로 연결하는 단계를 의식적으로 만들어야 재물로 전환됩니다.",
    },
    재성: {
      title: "재성(財星)이 직접 용신인 구조",
      desc: "재물 자체가 용신이라, 적극적으로 돈을 벌고 굴리는 활동(영업, 투자, 사업, 부동산 등)이 사주 흐름과 정확히 맞아떨어집니다. 다만 재성이 용신이라는 건 그만큼 재물에 대한 욕심과 기복도 크다는 뜻이라, 분산투자·자동이체 같은 안전장치를 함께 마련해야 들어온 재물이 오래 유지됩니다.",
    },
    관성: {
      title: "관성(官星)을 통해 재물이 들어오는 구조",
      desc: "용신이 관성 계열이라, 재물이 조직·직책·사회적 신뢰를 통해 안정적으로 들어오는 흐름입니다. 직접 사업·투자로 승부하기보다, 자격·직급·평판을 쌓아 그것이 곧 수입으로 연결되는 구조(승진, 전문직 자격, 공동체 내 신뢰)가 재물운을 가장 안정적으로 키워줍니다.",
    },
    인성: {
      title: "인성(印星)을 통해 재물의 기반을 다지는 구조",
      desc: hasJaeGeukIn
        ? "용신은 인성 계열인데 재성이 강해 재극인(財剋印) 구조가 함께 나타납니다 — 돈 욕심이 앞서면 오히려 공부·자격·후원 같은 인성의 기운을 깎아먹어 장기적인 재물 기반이 약해질 수 있습니다. 단기적인 돈벌이보다 자격·학위·전문성 같은 '나의 가치'를 먼저 쌓는 쪽에 우선순위를 둘 때 재물이 훨씬 오래 따라옵니다."
        : "용신이 인성 계열입니다. 공부·자격·문서·후원 같은 인성의 기운을 먼저 채워야 재물의 그릇이 커집니다. 당장의 수익보다 전문성과 신용을 쌓는 투자(교육, 자격증, 학습)가 장기적으로 훨씬 큰 재물로 돌아옵니다.",
    },
    비겁: {
      title: "비겁(比劫)의 협력을 통해 재물을 키우는 구조",
      desc: bigeopCount >= 2 && jaeseongCount >= 1
        ? "용신이 비겁 계열인데 재성과 비겁이 함께 자리하고 있어, 혼자보다 동업·협업·공동 투자 형태에서 재물이 커지는 구조입니다. 다만 비겁이 강하면 재물을 나눠야 하는 상황도 함께 따라오니, 동업 시 지분·역할을 명확히 문서화하는 것이 중요합니다."
        : "용신이 비겁 계열입니다. 혼자 끌어안고 키우기보다, 믿을 만한 동료·파트너와 함께 일을 벌릴 때 재물의 그릇이 커지는 구조입니다. 사람과의 신뢰 관계 자체가 재물운의 핵심 자산이 됩니다.",
    },
  };
  const wealthAdvice = GROUP_WEALTH_ADVICE[yongshinGroup];


  return (
    <main className="min-h-screen bg-[#0a0805] text-white">
      <BackButton />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-amber-950/30 blur-[160px]" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-16">
        <div className="text-center mb-8">
          <p className="text-amber-400 text-xs font-bold tracking-widest mb-2">MY WEALTH FORTUNE</p>
          <h1 className="text-2xl font-black leading-snug">
            {ilgan}{r.pillarsDetail.day.jj}일주, 당신의 재물운 진단
          </h1>
        </div>

        <div className={`rounded-3xl p-6 mb-5 text-center border ${hasMuJae ? "bg-gradient-to-br from-rose-950/60 to-amber-950/40 border-rose-700/30" : "bg-gradient-to-br from-amber-950/60 to-yellow-950/40 border-amber-700/30"}`}>
          <p className="text-amber-300 text-xs font-bold tracking-widest uppercase mb-2">재성(財星) 진단</p>
          {hasMuJae ? (
            <>
              <p className="text-xl font-black leading-snug mb-1">무재성(無財星) 사주</p>
              <p className="text-sm text-gray-300 leading-relaxed">사주 원국에 정재·편재가 보이지 않습니다. 흔히 &quot;재물복이 없다&quot;고 오해하는 구조지만, 정확히는 <span className="text-amber-300 font-bold">&apos;돈을 버는 방식이 다른 사람과 다르다&apos;</span>는 뜻입니다. 직접 돈을 좇기보다, 재능·전문성으로 돈이 따라오게 만드는 구조가 훨씬 유리합니다.</p>
            </>
          ) : (
            <>
              <p className="text-xl font-black leading-snug mb-1">재성 {jaeseongCount}개 보유</p>
              <p className="text-sm text-gray-300 leading-relaxed">사주 안에 재물을 의미하는 정재·편재 기운이 자리하고 있습니다. 다만 재성이 있다고 끝이 아니라, 그 재물을 <span className="text-amber-300 font-bold">지키고 굴리는 구조</span>가 더 중요합니다. 아래 진단을 확인하세요.</p>
            </>
          )}
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-amber-300 mb-1">
            사주 구조 진단 — {r.yongshin.strength} · 용신 &apos;{yongshinEl}&apos; ({yongshinSipseong})
          </p>
          <p className="text-xs text-gray-500 mb-2">{r.yongshin.desc}</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            월주·연주를 포함한 사주 전체의 조후(調候)와 신강·신약을 따져보면, 이 사주가 가장 필요로 하는 기운(용신)은 &apos;{yongshinEl}&apos; — 십성으로는 {yongshinSipseong} 계열입니다. 재물운은 단순히 재성(財星)의 유무가 아니라, <span className="text-amber-300 font-bold">이 용신이 어떤 십성으로 작동하는지</span>에 따라 돈이 들어오는 &apos;루트&apos;가 완전히 달라집니다.
          </p>
        </div>

        {moneyCombo && (
          <div className="bg-white/[0.03] border border-rose-700/20 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-rose-300 mb-1">⚠ 돈이 새는 구조 — {moneyCombo.name} ({moneyCombo.hanja})</p>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">{moneyCombo.desc}</p>
            <p className="text-xs text-emerald-300 font-bold">▶ 처방: {moneyCombo.advice}</p>
          </div>
        )}

        {OVERSEAS_WEALTH_ILGAN[ilgan] && (
          <div className="bg-gradient-to-br from-sky-950/50 to-indigo-950/30 border border-sky-700/30 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-sky-300 mb-1">타지에서 돈 크게 버는 사주 TOP {OVERSEAS_WEALTH_ILGAN[ilgan].rank} — {OVERSEAS_WEALTH_ILGAN[ilgan].title}</p>
            <p className="text-sm text-gray-300 leading-relaxed">{OVERSEAS_WEALTH_ILGAN[ilgan].desc}</p>
          </div>
        )}

        {wealthAdvice && (
          <div className="bg-gradient-to-br from-amber-950/50 to-orange-950/30 border border-amber-700/30 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-amber-300 mb-1">재물운 높이는 법 — {wealthAdvice.title}</p>
            <p className="text-sm text-gray-300 leading-relaxed">{wealthAdvice.desc}</p>
          </div>
        )}

        {topDesc && (
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-violet-300 mb-1">사주에서 가장 강한 기운 — {topSipseong} ({topDesc.hanja})</p>
            <p className="text-xs text-gray-500 mb-2">{topDesc.short}</p>
            <p className="text-sm text-gray-300 leading-relaxed">{topDesc.detail}</p>
            <p className="text-sm text-amber-200/80 leading-relaxed mt-3 pt-3 border-t border-white/10">⚠️ {topDesc.shadow}</p>
          </div>
        )}

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-8">
          <p className="text-sm font-bold mb-1" style={{ color: ELEMENT_BOOST[yongshinEl].color }}>보조 처방 — 용신 오행 &apos;{yongshinEl}&apos; 보강 아이템</p>
          <p className="text-xs text-gray-500 mb-2">추천 아이템: {ELEMENT_BOOST[yongshinEl].item}</p>
          <p className="text-sm text-gray-300 leading-relaxed">{ELEMENT_BOOST[yongshinEl].tip}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push("/service/overcome")}
            className="py-3.5 rounded-2xl font-bold text-sm bg-white/5 border border-white/10 text-gray-300 active:scale-[0.98] transition-all">
            쓰레기 사주 극복법
          </button>
          <button onClick={() => { setStep("entry"); resultRef.current = null; }}
            className="py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-amber-600 to-orange-600 text-white active:scale-[0.98] transition-all">
            다시 분석하기
          </button>
        </div>
      </div>
    </main>
  );
}

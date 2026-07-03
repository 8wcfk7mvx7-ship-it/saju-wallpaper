"use client";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import BackButton from "@/components/BackButton";
import { analyzeSaju, getSipseong, calcDaewoon, type SajuResult, type Element, type DaewoonResult } from "@/lib/saju";
import { SIPSEONG_DESC, SIPSEONG_MONEY_COMBO, OVERSEAS_WEALTH_ILGAN, SPEND_TO_EARN_ILGAN, detectExcessPatterns } from "@/lib/saju2";
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

const ELEMENT_BOOST: Record<Element, { item: string; color: string; tip: string }> = {
  목: { item: "초록·청록 계열, 동쪽 방향, 나무·식물", color: "#4ade80", tip: "동쪽 방향에 화분을 두거나 초록색 소품을 활용하면 재물 기운의 흐름이 살아납니다. 죽어 있는 화분이나 시든 식물은 오히려 역효과이므로, 살아 생동하는 식물을 유지하는 것이 핵심입니다. 책상 왼쪽이 동쪽이라면 그곳에 작은 화분을 놓는 것만으로도 충분히 기운을 보강할 수 있습니다." },
  화: { item: "빨강·주황 계열, 남쪽 방향, 조명", color: "#f97316", tip: "남쪽 자리를 밝게 유지하고 조명을 추가하면 재물운의 활동성이 올라갑니다. 거실이나 서재의 남쪽 벽에 따뜻한 계열의 조명이나 밝은 계열의 그림을 배치하는 것이 효과적입니다. 빨강·주황 계열 소품을 지갑이나 명함 지갑으로 쓰면 재물을 불러오는 행동 습관과도 연결됩니다." },
  토: { item: "노랑·갈색 계열, 중앙, 도자기 소품", color: "#fbbf24", tip: "책상이나 방의 중앙을 정돈하고 도자기·황토색 소품을 두면 재물이 안정적으로 쌓입니다. 주방 가스레인지 주변에 황토색 냄비나 도자기 그릇을 두는 것도 같은 맥락에서 기운을 보강합니다. 중앙이 어수선하면 재물이 흩어지는 기운이 강해지므로, 수납 정리를 꾸준히 유지하는 것이 중요합니다." },
  금: { item: "흰색·금속 계열, 서쪽 방향, 금속 소품", color: "#e5e7eb", tip: "서쪽 자리에 금속 소품(동전, 액자 프레임 등)을 두면 재물이 단단하게 모이는 기운이 강화됩니다. 지갑을 흰색 또는 실버·골드 계열로 바꾸고, 카드·현금을 정돈해서 보관하는 것도 금 기운을 일상에 끌어오는 방법입니다. 서쪽이 혼잡하면 재물이 흩어지므로 서쪽 공간을 깔끔하게 유지하세요." },
  수: { item: "검정·남색 계열, 북쪽 방향, 어항·물 소품", color: "#38bdf8", tip: "북쪽 방향에 어항이나 물 관련 소품을 두면 재물의 흐름이 막히지 않고 순환됩니다. 다만 어항은 꾸준히 관리되는 상태여야 효과가 있고, 방치된 물이나 물이 넘치는 환경은 오히려 역효과입니다. 검정 또는 남색 지갑은 수 기운을 직접 가지고 다니는 효과가 있어, 재물을 모으는 습관과 함께 연결됩니다." },
};

export default function WealthPage() {
  const router = useRouter();
  const [step, setStep] = useState<"entry" | "form" | "loading" | "result">("entry");
  const [form, setForm] = useState<BirthFormData>(defaultBirthData("female"));
  const resultRef = useRef<SajuResult | null>(null);
  const daewoonRef = useRef<DaewoonResult | null>(null);
  const nameRef = useRef<string>("");

  async function handleAnalyze() {
    if (!form.birthYear || !form.birthMonth || !form.birthDay) return;
    nameRef.current = form.name?.trim() || "당신";
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
    const saju = analyzeSaju({
      birthYear: y, birthMonth: m, birthDay: d,
      birthHour: form.birthHour, birthMinute: form.birthMinute ?? 0,
      name: "나", gender: form.gender,
      birthPlace: form.city || "서울", style: "auto", productType: "report", useJajasi: form.useJajasi,
    });
    resultRef.current = saju;
    daewoonRef.current = calcDaewoon(y, m, d, form.gender, saju.pillarsDetail.day.cg, saju.pillarsDetail.month);
    setStep("loading");
  }

  if (step === "entry") {
    return (
      <main className="min-h-screen bg-[#0a0805] text-white flex flex-col page-fade-in">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[650px] h-[650px] rounded-full bg-amber-950/40 blur-[160px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-yellow-950/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-5 py-16 text-center">
          <FadeIn delay={0}>
          <div className="inline-block px-3 py-1 rounded-full bg-amber-900/50 border border-amber-700/40 text-amber-300 text-xs font-bold tracking-wider mb-8">
            ⚠ &quot;사주에 돈 들어올 자리가 없다&quot;, &quot;재물복 없다&quot;는 말 들어본 사람 필수 확인
          </div>
          </FadeIn>
          <FadeIn delay={80}>
          <h1 className="text-3xl font-black mb-4 leading-tight tracking-tight">
            내 사주에<br />
            <span className="text-amber-400">재물운</span>이 있을까?
          </h1>
          </FadeIn>
          <FadeIn delay={160}>
          <p className="text-gray-400 text-base mb-2 leading-relaxed">
            벌어도 안 모이고, 모아도 새는 이유.<br />
            <span className="text-gray-300 font-medium">사주에 답이 있습니다.</span>
          </p>
          <p className="text-gray-600 text-sm mb-12">
            지금 확인 안 하면 평생 모르고 삽니다
          </p>
          </FadeIn>

          <div className="w-full space-y-3 mb-10 text-left">
            {[
              ["재물 기운 보유 여부", "내 사주에 돈이 들어올 자리가 있는지부터 확인"],
              ["돈이 새는 구조 진단", "재능을 돈으로 못 바꾸는 패턴 · 내가 직접 재물을 깎아먹는 패턴 등 재물이 빠져나가는 흐름"],
              ["재물운 높이는 구체적 방법", "내 오행에 맞는 색상·방향·습관 처방"],
            ].map(([title, desc], i) => (
              <FadeIn key={title} delay={220 + i * 70}>
              <div className="flex items-start gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
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
            className="w-full px-6 py-4 rounded-2xl font-black text-base tracking-tight bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-900/50 transition-all active:scale-[0.98]">
            내 재물운 확인하기
          </button>
          </FadeIn>
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
  const dw = daewoonRef.current;
  if (!r || !dw) return null;
  const ilgan = r.pillarsDetail.day.cg;
  const userName = nameRef.current;
  const N = userName === "당신" ? "당신" : `${userName}님`;

  // 대운별 재물운 등급
  function daewoonWealthGrade(sipseongCg: string, sipseongJj: string): { grade: "좋음" | "보통" | "주의"; color: string; label: string; reason: string } {
    const jaeSeong = ["정재", "편재"];
    const sikSang = ["식신", "상관"];
    const guan = ["정관", "편관"];
    const bigeop = ["비견", "겁재"];
    const inseong = ["정인", "편인"];
    const dominant = [sipseongCg, sipseongJj];
    const hasJae = dominant.some(s => jaeSeong.includes(s));
    const hasSik = dominant.some(s => sikSang.includes(s));
    const hasGuan = dominant.some(s => guan.includes(s));
    const hasBigeop = dominant.some(s => bigeop.includes(s));
    if (hasJae && hasSik) return { grade: "좋음", color: "#f59e0b", label: "재물 전성기", reason: "재물 기운과 생산 기운이 동시에 들어와 수입이 늘어나는 시기입니다." };
    if (hasJae) return { grade: "좋음", color: "#fbbf24", label: "재물 활성화", reason: "재물 기운이 직접 들어오는 시기로 수입·투자 기회가 열립니다." };
    if (hasSik && !hasBigeop) return { grade: "좋음", color: "#a3e635", label: "수익 창출 활성화", reason: "창의력·생산력이 수익으로 연결되는 시기입니다." };
    if (hasGuan) return { grade: "보통", color: "#38bdf8", label: "직업·안정 수입", reason: "재물보다 직업·직위를 통한 안정적 수입이 중심인 시기입니다." };
    if (hasBigeop && hasJae) return { grade: "보통", color: "#94a3b8", label: "경쟁 속 재물", reason: "재물 기운이 있지만 경쟁·지출도 함께 늘어나는 시기입니다." };
    if (hasBigeop) return { grade: "주의", color: "#f87171", label: "재물 분산 주의", reason: "동료·경쟁 기운이 강해 재물이 흩어지거나 지출이 늘어나기 쉽습니다." };
    if (dominant.some(s => inseong.includes(s))) return { grade: "보통", color: "#a78bfa", label: "준비·내실의 시기", reason: "직접적 재물보다 실력·자격을 쌓아두는 것이 유리한 시기입니다." };
    return { grade: "보통", color: "#94a3b8", label: "일반 흐름", reason: "특별히 두드러진 재물운 변화는 없는 평이한 시기입니다." };
  }

  const currentYear = new Date().getFullYear();
  const daewoonWithGrade = dw.pillars.map((p, idx) => ({
    ...p,
    idx,
    isCurrent: idx === dw.currentIdx,
    grade: daewoonWealthGrade(p.sipseongCg, p.sipseongJj),
  }));

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
  const guanseongCount = totalCount("정관") + totalCount("편관");
  const sikSinCount = totalCount("식신");
  const hasMuJae = jaeseongCount === 0;

  // "부자들의 사주" 3가지 패턴 — 해당 조건을 만족할 때만 노출
  const richPatterns: { title: string; desc: string }[] = [];
  if (r.yongshin.strength === "신강" && jaeseongCount >= 2) {
    richPatterns.push({
      title: "스스로의 기운이 단단해 큰 재물을 감당하는 구조",
      desc: "일간의 기운 자체가 튼튼하고, 재물을 의미하는 글자도 뿌리 깊게 자리하고 있습니다. 재물은 그릇이 큰 사람에게 모이는 법인데, 이 사주는 그 그릇 자체가 단단해서 큰돈이 들어와도 흔들리지 않고 감당할 수 있는 구조예요. 작은 수입에 머물기보다 사업 확장이나 투자처럼 그릇을 키우는 선택을 할 때 타고난 흐름을 제대로 쓸 수 있습니다.",
    });
  }
  if (sikSinCount >= 1 && jaeseongCount >= 1) {
    richPatterns.push({
      title: "끊임없이 재물을 만들어내는 샘을 가진 구조",
      desc: "내 안의 창의력과 활동력이 재물로 곧장 이어지는 흐름을 갖고 있습니다. 한 번 벌고 끝나는 게 아니라, 아이디어와 손길이 닿는 일마다 새로운 수익이 계속 생겨나는 마르지 않는 샘 같은 구조예요. 가만히 있기보다 끊임없이 무언가를 만들고 시도할 때 재물이 자연스럽게 따라옵니다.",
    });
  }
  if (jaeseongCount >= 1 && guanseongCount >= 1) {
    richPatterns.push({
      title: "재물과 명예가 나란히 따라오는 구조",
      desc: "돈을 의미하는 기운과 사회적 지위를 의미하는 기운이 사주 안에 함께 자리하고 있습니다. 부를 얻으면 그에 걸맞은 직책이나 평판이 따라오고, 그 지위가 다시 재물을 지켜주는 식으로 서로를 밀어주는 구조예요. 돈만 좇기보다 신뢰와 책임을 함께 쌓아갈 때 두 가지가 동시에 커지는 흐름을 타게 됩니다.",
    });
  }

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
  const SIPSEONG_OF_GROUP_LABEL: Record<string, string> = {
    비겁: "동료·경쟁 기운", 식상: "표현·창작 기운", 재성: "재물 기운",
    관성: "조직·책임 기운", 인성: "학습·전문성 기운",
  };
  const yongshinGroup = SIPSEONG_GROUP[yongshinSipseong] ?? "재성";

  const GROUP_WEALTH_ADVICE: Record<string, { title: string; desc: string }> = {
    식상: {
      title: "표현력·창작력을 살려 재물을 만드는 구조",
      desc: hasSikSangSaengJae
        ? "가장 필요한 기운이 표현력·창작력 계열이면서 사주 안에 재물 기운도 함께 있습니다. 즉 표현력이 재물을 낳는 구조가 성립합니다 — 본인의 재능·아이디어·콘텐츠·기술을 직접 돈으로 연결할 때 재물운이 가장 강하게 작동합니다. 남이 만든 시스템에 들어가 월급을 받는 구조보다, 내가 만든 결과물이 곧 수익이 되는 구조(전문직, 콘텐츠, 1인 사업, 프리랜서)에서 재물운이 크게 열립니다."
        : "가장 필요한 기운이 표현력·창작력 계열입니다. 표현력·기술·생산력을 적극적으로 쓸 때 재물운이 따라옵니다. 다만 사주 안에 재물 기운이 아직 약하므로, 그렇게 만든 가치를 실제 수익 구조(상품화·계약·플랫폼 입점 등)로 연결하는 단계를 의식적으로 만들어야 재물로 전환됩니다.",
    },
    재성: {
      title: "재물 기운이 직접 가장 필요한 구조",
      desc: "재물 자체가 가장 필요한 기운이라, 적극적으로 돈을 벌고 굴리는 활동(영업, 투자, 사업, 부동산 등)이 사주 흐름과 정확히 맞아떨어집니다. 다만 이 기운이 그만큼 강하다는 건 재물에 대한 욕심과 기복도 크다는 뜻이라, 분산투자·자동이체 같은 안전장치를 함께 마련해야 들어온 재물이 오래 유지됩니다.",
    },
    관성: {
      title: "조직·책임의 기운을 통해 재물이 들어오는 구조",
      desc: "가장 필요한 기운이 조직·책임 계열이라, 재물이 조직·직책·사회적 신뢰를 통해 안정적으로 들어오는 흐름입니다. 직접 사업·투자로 승부하기보다, 자격·직급·평판을 쌓아 그것이 곧 수입으로 연결되는 구조(승진, 전문직 자격, 공동체 내 신뢰)가 재물운을 가장 안정적으로 키워줍니다.",
    },
    인성: {
      title: "학습·전문성의 기운을 통해 재물의 기반을 다지는 구조",
      desc: hasJaeGeukIn
        ? "가장 필요한 기운은 학습·전문성 계열인데 재물 기운이 강해, 돈 욕심이 학습·전문성 기운을 깎아먹는 구조가 함께 나타납니다 — 돈 욕심이 앞서면 오히려 공부·자격·후원 같은 기운을 깎아먹어 장기적인 재물 기반이 약해질 수 있습니다. 단기적인 돈벌이보다 자격·학위·전문성 같은 '나의 가치'를 먼저 쌓는 쪽에 우선순위를 둘 때 재물이 훨씬 오래 따라옵니다."
        : "가장 필요한 기운이 학습·전문성 계열입니다. 공부·자격·문서·후원 같은 기운을 먼저 채워야 재물의 그릇이 커집니다. 당장의 수익보다 전문성과 신용을 쌓는 투자(교육, 자격증, 학습)가 장기적으로 훨씬 큰 재물로 돌아옵니다.",
    },
    비겁: {
      title: "동료와의 협력을 통해 재물을 키우는 구조",
      desc: bigeopCount >= 2 && jaeseongCount >= 1
        ? "가장 필요한 기운이 동료·경쟁 계열인데 재물 기운과 함께 자리하고 있어, 혼자보다 동업·협업·공동 투자 형태에서 재물이 커지는 구조입니다. 다만 이 기운이 강하면 재물을 나눠야 하는 상황도 함께 따라오니, 동업 시 지분·역할을 명확히 문서화하는 것이 중요합니다."
        : "가장 필요한 기운이 동료·경쟁 계열입니다. 혼자 끌어안고 키우기보다, 믿을 만한 동료·파트너와 함께 일을 벌릴 때 재물의 그릇이 커지는 구조입니다. 사람과의 신뢰 관계 자체가 재물운의 핵심 자산이 됩니다.",
    },
  };
  const wealthAdvice = GROUP_WEALTH_ADVICE[yongshinGroup];

  // 과다·편중 패턴 분석 (재물 페이지 관련)
  const excessPatterns = detectExcessPatterns(r).filter(p => p.fields.includes('wealth'));

  return (
    <main className="min-h-screen bg-[#0a0805] text-white">
      <BackButton />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-amber-950/30 blur-[160px]" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-16" id="wealth-result">
        <div className="text-center mb-8">
          <p className="text-amber-400 text-xs font-bold tracking-widest mb-2">MY WEALTH FORTUNE</p>
          <h1 className="text-2xl font-black leading-snug">
            {ilgan}{r.pillarsDetail.day.jj}일주, {N}의 재물운 진단
          </h1>
        </div>

        <div className={`rounded-3xl p-6 mb-5 text-center border ${hasMuJae ? "bg-gradient-to-br from-rose-950/60 to-amber-950/40 border-rose-700/30" : "bg-gradient-to-br from-amber-950/60 to-yellow-950/40 border-amber-700/30"}`}>
          <p className="text-amber-300 text-xs font-bold tracking-widest uppercase mb-2">{N}의 재물 기운 진단</p>
          {hasMuJae ? (
            <>
              <p className="text-xl font-black leading-snug mb-1">재물 기운이 보이지 않는 사주</p>
              <p className="text-sm text-gray-300 leading-relaxed">사주 원국에 재물을 뜻하는 기운이 보이지 않습니다. 흔히 &quot;재물복이 없다&quot;고 오해하는 구조지만, 정확히는 <span className="text-amber-300 font-bold">&apos;돈을 버는 방식이 다른 사람과 다르다&apos;</span>는 뜻입니다. 직접 돈을 좇기보다, 재능·전문성으로 돈이 따라오게 만드는 구조가 훨씬 유리합니다. 재물 기운이 없는 사주에서 재물이 들어오려면, 대운이나 세운에서 재물 관련 기운이 들어오는 시기를 잘 활용하는 것이 핵심입니다. 그 시기에 무리하게 투자하기보다는, 평소에 전문성과 신용을 쌓아두어 기회가 왔을 때 바로 활용할 수 있는 준비를 갖춰두는 것이 장기적으로 훨씬 유리합니다.</p>
            </>
          ) : (
            <>
              <p className="text-xl font-black leading-snug mb-1">재물 기운 {jaeseongCount}개 보유</p>
              <p className="text-sm text-gray-300 leading-relaxed">사주 안에 재물을 의미하는 기운이 자리하고 있습니다. 다만 이 기운이 있다고 끝이 아니라, 그 재물을 <span className="text-amber-300 font-bold">지키고 굴리는 구조</span>가 더 중요합니다. 재물 기운이 사주 안에 있어도, 그것을 눌러버리거나 흩어버리는 기운이 함께 있으면 실제로 재물이 모이지 않는 경우가 많습니다. 아래 진단에서 내 재물이 어떤 루트로 들어오고, 어떤 방식으로 새는지를 확인하세요.</p>
            </>
          )}
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-amber-300 mb-1">
            사주 구조 진단 — 가장 필요한 기운 &apos;{yongshinEl}&apos; ({SIPSEONG_OF_GROUP_LABEL[yongshinGroup]})
          </p>
          <p className="text-xs text-gray-500 mb-2">{r.yongshin.desc}</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            사주 전체의 기운이 균형을 이루려면 무엇이 더 필요한지를 따져보면, 이 사주가 가장 필요로 하는 기운은 &apos;{yongshinEl}&apos; — 구체적으로는 {SIPSEONG_OF_GROUP_LABEL[yongshinGroup]} 계열입니다. 재물운은 단순히 재물 기운의 유무가 아니라, <span className="text-amber-300 font-bold">이 필요한 기운이 어떤 형태로 작동하는지</span>에 따라 돈이 들어오는 &apos;루트&apos;가 완전히 달라집니다.{ilgan === "경" && " 경금은 누군가 도와주는 기운을 크게 받기보다, 비슷한 기운이 곁에서 함께 받쳐줄 때 더 단단해지는 구조예요. 도와주는 기운이 너무 많으면 오히려 장점이 죽고, 적당히 적게 있는 정도가 가장 잘 맞습니다. 책임감을 다스리는 기운을 유독 잘 다루는 일간이라, 재물이 책임감 기운으로 흘러가는 루트를 가장 능숙하게 쓸 줄 알고, 재물을 다루는 솜씨도 좋은 편인데 단순한 사업가형보다는 판을 짜고 이끄는 통치자형에 가깝습니다."}{SPEND_TO_EARN_ILGAN[ilgan] && ` ${SPEND_TO_EARN_ILGAN[ilgan].desc} 쓰면 좋은 곳은 ${SPEND_TO_EARN_ILGAN[ilgan].where}`}
          </p>
        </div>

        {richPatterns.length > 0 && (
          <div className="bg-gradient-to-br from-yellow-950/50 to-amber-950/30 border border-yellow-700/30 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-yellow-300 mb-3">✨ 큰 재물을 모으는 사람들과 닮은 구조</p>
            <div className="space-y-4">
              {richPatterns.map((p, i) => (
                <div key={i} className={i > 0 ? "pt-4 border-t border-yellow-700/20" : ""}>
                  <p className="text-sm font-bold text-yellow-200 mb-1">{p.title}</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {moneyCombo && (
          <div className="bg-white/[0.03] border border-rose-700/20 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-rose-300 mb-1">⚠ 돈이 새는 구조</p>
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
            <p className="text-sm font-bold text-violet-300 mb-1">사주에서 가장 강한 기운 — {SIPSEONG_OF_GROUP_LABEL[SIPSEONG_GROUP[topSipseong as string]] ?? topSipseong}</p>
            <p className="text-xs text-gray-500 mb-2">{topDesc.short}</p>
            <p className="text-sm text-gray-300 leading-relaxed">{topDesc.detail}</p>
            <p className="text-sm text-amber-200/80 leading-relaxed mt-3 pt-3 border-t border-white/10">⚠️ {topDesc.shadow}</p>
          </div>
        )}

        {excessPatterns.length > 0 && (
          <div className="bg-rose-950/30 border border-rose-700/30 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-rose-300 mb-3">⚠ 사주 편중 패턴 — 재물운에서 주의할 점</p>
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

        {/* ── 대운별 재물운 타임라인 ── */}
        <div className="bg-white/[0.03] border border-amber-700/20 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-amber-300 mb-1">{N}의 대운 흐름으로 본 재물운 타임라인</p>
          <p className="text-xs text-gray-500 mb-4">{dw.direction} · 첫 대운 시작 {dw.startAge}세</p>
          <div className="space-y-2.5">
            {daewoonWithGrade.map((p) => (
              <div key={p.idx}
                className={`flex items-start gap-3 rounded-xl px-3.5 py-3 border transition-all ${p.isCurrent ? "border-amber-500/50 bg-amber-950/40" : "border-white/[0.06] bg-white/[0.02]"}`}>
                <div className="shrink-0 text-center min-w-[48px]">
                  <p className="text-[11px] font-black" style={{ color: p.isCurrent ? "#fbbf24" : "rgba(255,255,255,0.4)" }}>
                    {p.age}세
                  </p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {p.yearStart}~
                  </p>
                </div>
                <div className="shrink-0 text-center">
                  <p className="text-base font-black" style={{ color: p.isCurrent ? "#fbbf24" : "rgba(255,255,255,0.7)" }}>
                    {p.cg}{p.jj}
                  </p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {p.sipseongCg}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${p.grade.color}22`, color: p.grade.color, border: `1px solid ${p.grade.color}44` }}>
                      {p.grade.label}
                    </span>
                    {p.isCurrent && (
                      <span className="text-[10px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">현재</span>
                    )}
                  </div>
                  <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {p.grade.reason}
                  </p>
                </div>
              </div>
            ))}
          </div>
          {dw.currentIdx >= 0 && (
            <p className="text-[11px] text-gray-600 mt-3 text-center">
              * 대운은 10년 단위로 흐르는 큰 흐름입니다. 매년 세운(歲運)과 함께 봐야 정확합니다.
            </p>
          )}
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-8">
          <p className="text-sm font-bold mb-1" style={{ color: ELEMENT_BOOST[yongshinEl].color }}>보조 처방 — 내 사주 핵심 오행 &apos;{yongshinEl}&apos; 보강 아이템</p>
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
        <ResultFooterActions targetId="wealth-result" fileName="재물운" />
      </div>
    </main>
  );
}

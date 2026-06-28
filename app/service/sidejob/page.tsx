"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import BackButton from "@/components/BackButton";
import { analyzeSaju, getSipseong, getSipseongStrength, getJijiRelations, CHEONGAN_ELEMENT, getJikjangSiseonNarrative, type SajuResult, type Element } from "@/lib/saju";
import { SIPSEONG_DESC } from "@/lib/saju2";
import AnalysisLoading from "@/components/AnalysisLoading";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";
import ShareImageButton from "@/components/ShareImageButton";

export const dynamic = "force-dynamic";

const ELEMENT_TO_CG: Record<Element, string> = { 목: "갑", 화: "병", 토: "무", 금: "경", 수: "임" };

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={className} style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(18px)", transition: `opacity 0.8s ease ${delay}ms, transform 0.8s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

export default function SidejobPage() {
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
      name: form.name?.trim() || "회원", gender: form.gender,
      birthPlace: form.city || "서울", style: "auto", productType: "report", useJajasi: form.useJajasi,
    });
    setStep("loading");
  }

  if (step === "entry") {
    return (
      <main className="min-h-screen bg-[#0a0e14] text-white flex flex-col page-fade-in">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[650px] h-[650px] rounded-full bg-emerald-950/40 blur-[160px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-teal-950/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-5 py-16 text-center">
          <FadeIn delay={0}>
            <div className="inline-block px-3 py-1 rounded-full bg-emerald-900/50 border border-emerald-700/40 text-emerald-300 text-xs font-bold tracking-wider mb-8">
              🔥 월급만으로 안 되는 시대, 본업 외 수입 가능할까?
            </div>
            <h1 className="text-3xl font-black mb-4 leading-tight tracking-tight">
              나도 투잡,<br />
              <span className="text-emerald-400">가능한 사주</span>일까?
            </h1>
          </FadeIn>

          <FadeIn delay={100}>
            <p className="text-gray-400 text-base mb-2 leading-relaxed">
              누구는 부업으로 월급보다 더 벌고,<br />
              <span className="text-gray-300 font-medium">누구는 본업도 흔들립니다.</span>
            </p>
            <p className="text-gray-600 text-sm mb-12">
              욕심내면 오히려 둘 다 망하는 사주도 있습니다
            </p>
          </FadeIn>

          <FadeIn delay={200} className="w-full">
            <div className="w-full space-y-3 mb-10 text-left">
              {[
                ["여러 수입원 동시 운영 가능성", "여러 수입원을 동시에 굴릴 수 있는 구조인지 진단"],
                ["욕심내면 위험한 구조", "투잡이 오히려 본업을 망치는 패턴 체크"],
                ["나에게 맞는 부업 방향", "사주 기운에 맞는 구체적인 부업 유형 추천"],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
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
              ✦ 완전 무료
            </div>

            <button onClick={() => setStep("form")}
              className="w-full py-4 rounded-2xl font-black text-lg tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/50 transition-all active:scale-[0.98]">
              내 투잡 가능성 확인하기
            </button>
          </FadeIn>
        </div>
      </main>
    );
  }

  if (step === "form") {
    const ready = !!form.birthYear && !!form.birthMonth && !!form.birthDay;
    return (
      <main className="min-h-screen bg-[#0a0e14] text-white">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[600px] h-[600px] rounded-full bg-emerald-950/40 blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 pb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">생년월일 입력</h2>
            <p className="text-gray-500 text-sm">정확한 분석을 위해 출생 정보를 입력해주세요.</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <BirthInputForm value={form} onChange={setForm} label="나의 정보" accent="#10b981" />
          </div>
          <button onClick={handleAnalyze} disabled={!ready}
            className={`w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all active:scale-[0.98] ${
              ready
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/50"
                : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
            }`}>
            투잡 가능성 분석하기
          </button>
        </div>
      </main>
    );
  }

  if (step === "loading") {
    return (
      <AnalysisLoading
        subject="나의 투잡 가능성"
        duration={2200}
        onDone={() => setStep("result")}
        messages={[
          "새로운 수입원을 만드는 힘을 계산하는 중...",
          "여러 일을 동시에 감당할 그릇인지 확인하는 중...",
          "욕심내면 위험한 구조인지 체크하는 중...",
          "나에게 맞는 부업 유형을 찾는 중...",
        ]}
      />
    );
  }

  // ── 결과 ──
  const r = resultRef.current;
  if (!r) return null;
  const ilgan = r.pillarsDetail.day.cg;
  const ilju = `${ilgan}${r.pillarsDetail.day.jj}`;
  const userName = form.name?.trim() || "회원";

  // 십성 그룹 카운트는 천간(사주 본기둥)에만 드러난 십성만 센다. 지장간(지지 속 숨은 십성)은 해석 참고용일 뿐 카운트에 포함하지 않는다.
  const sipseongList = [
    r.pillarsDetail.year.sipseongCg,
    r.pillarsDetail.month.sipseongCg,
    r.pillarsDetail.hour?.sipseongCg,
  ].filter(Boolean) as string[];

  const counts: Record<string, number> = {};
  sipseongList.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
  const totalCount = (key: string) => counts[key] || 0;

  const sikSinCount = totalCount("식신");
  const sangGwanCount = totalCount("상관");
  const sikSangCount = sikSinCount + sangGwanCount;
  const bigeopCount = totalCount("비견") + totalCount("겁재");
  const jaeseongCount = totalCount("정재") + totalCount("편재");
  const inseongCount = totalCount("정인") + totalCount("편인");
  const strength = r.yongshin.strength;

  // 투잡 가능성 점수 (1~10)
  let score = 5 + sikSangCount * 0.9 + (jaeseongCount >= 1 ? 0.6 : 0);
  if (strength === "신약") score -= sikSangCount * 0.4; // 신약인데 식상 많으면 에너지 분산이 더 부담
  if (inseongCount >= 2 && sikSangCount === 0) score -= 1; // 인성 多 식상 無 — 한 우물형
  score = Math.max(1, Math.min(9.5, score));
  const scoreRounded = Math.round(score * 2) / 2;

  const yongshinEl = r.yongshin.yongshin;
  const yongshinSipseong = getSipseong(ilgan, ELEMENT_TO_CG[yongshinEl]);

  // 위험 신호: 식상이 매우 강한데 신약 + 비겁 약함 → 벌이기만 하고 못 감당
  const isOverextendRisk = sikSangCount >= 3 && strength === "신약";
  // 위험 신호2: 비겁이 너무 많아 경쟁/분산이 심함
  const isScatterRisk = bigeopCount >= 3;

  const SIDEJOB_TYPE: { title: string; desc: string }[] = [];
  if (sangGwanCount >= sikSinCount && sangGwanCount >= 1) {
    SIDEJOB_TYPE.push({
      title: "콘텐츠·플랫폼형 부업",
      desc: `${userName}님은 표현력과 기획력이 두드러지는 기운을 가지고 있어요. 글쓰기, 영상, SNS, 강의 콘텐츠처럼 한 번 만들어두면 시간이 지나도 꾸준히 수익이 따라오는 '레버리지형' 부업이 잘 맞습니다. 처음엔 반응이 느려도 꾸준히 쌓아가면 본업 수입을 넘어서는 경우가 많은 흐름이에요. 다만 이 기운은 변화와 자극을 좋아해서, 한 가지 채널에 완전히 정착하기 전에 다음 아이디어로 넘어가고 싶은 마음이 자주 들 수 있습니다. 콘텐츠 하나를 적어도 3개월은 끌고 가 본 다음 다음 주제로 넘어가는 식으로, 스스로 마감을 정해두는 습관이 수익화의 속도를 결정짓습니다.`,
    });
  }
  if (sikSinCount >= 1) {
    SIDEJOB_TYPE.push({
      title: "꾸준한 생산·서비스형 부업",
      desc: `${userName}님에게는 손으로 직접 만들고 제공하는 일에서 안정적인 수익을 만드는 기운이 흐릅니다. 공방, 베이킹, 외주 작업, 정기 클래스처럼 매달 일정한 패턴으로 운영되는 부업에서 꾸준히 결과가 쌓이는 편이에요. 이 기운은 화려한 마케팅보다 결과물의 품질로 입소문이 나는 쪽에 더 강하게 반응합니다. 처음 손님 10명, 처음 구매자 10명을 진심으로 만족시키는 데 집중하면, 그 다음부터는 소개와 재구매로 자연스럽게 규모가 커지는 흐름을 탈 수 있어요.`,
    });
  }
  if (jaeseongCount >= 1 && SIDEJOB_TYPE.length < 2) {
    SIDEJOB_TYPE.push({
      title: "거래·중개형 부업",
      desc: `${userName}님은 물건이나 정보를 사고 팔거나 중개하는 감각이 있는 기운을 갖고 있어요. 중고거래, 구매대행, 소규모 셀러처럼 시세와 타이밍을 읽어내는 부업에서 다른 사람보다 수익을 만들어내는 속도가 빠른 편입니다. 다만 이 기운은 돈의 흐름에 예민한 만큼, 한 번 잘 풀리면 욕심이 커지기 쉬운 구조이기도 해요. 처음 정했던 투자 한도와 시간을 지키는 것이 장기적으로 손해를 막는 가장 확실한 방법입니다.`,
    });
  }
  if (SIDEJOB_TYPE.length === 0) {
    SIDEJOB_TYPE.push({
      title: "지식·자격 기반 부업",
      desc: `${userName}님의 사주에서는 즉흥적인 사업형 기운보다는, 이미 갖고 있는 지식이나 자격을 활용하는 쪽이 더 또렷하게 드러납니다. 강의, 자문, 첨삭, 컨설팅처럼 '이미 가진 것을 나눠주는' 형태의 부업이 안정적으로 맞는 구조예요. 새로운 아이템을 발굴하는 데 시간을 쓰기보다, 지금까지 쌓아온 경력이나 경험을 그대로 콘텐츠로 옮기는 쪽이 훨씬 빠르고 안전한 시작점이 됩니다.`,
    });
  }

  return (
    <main className="min-h-screen bg-[#0a0e14] text-white">
      <BackButton />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-emerald-950/30 blur-[160px]" />
      </div>
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 pb-16" id="sidejob-result">
        <div className="text-center mb-8">
          <p className="text-emerald-400 text-xs font-bold tracking-widest mb-2">SIDE HUSTLE POTENTIAL</p>
          <h1 className="text-2xl font-black leading-snug">
            {userName}님, {ilju}일주의 투잡 가능성
          </h1>
        </div>

        {/* 점수 바 */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <div className="flex justify-between items-end mb-2">
            <span className="text-sm font-bold text-gray-300">투잡 가능성</span>
            <span className="text-2xl font-black text-emerald-400">{scoreRounded.toFixed(1)} <span className="text-sm text-gray-500">/ 10</span></span>
          </div>
          <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400" style={{ width: `${scoreRounded * 10}%` }} />
          </div>
          <p className="text-xs text-gray-400 mt-3 leading-relaxed">
            새로운 수입원을 만드는 힘 {sikSangCount}개 · 그 결과를 돈으로 연결하는 힘 {jaeseongCount}개 · 동료·경쟁 기운 {bigeopCount}개를 종합한 결과예요. {userName}님은 아이디어를 떠올리는 힘과, 그것을 실제 돈으로 바꾸는 힘이 각각 다르게 작용하는데, 두 힘이 함께 강할수록 투잡 점수가 높게 나옵니다.
          </p>
        </div>

        {(isOverextendRisk || isScatterRisk) && (
          <div className="bg-gradient-to-br from-rose-950/60 to-orange-950/30 border border-rose-700/30 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-rose-300 mb-1">⚠ 욕심내면 위험한 구조</p>
            {isOverextendRisk && (
              <p className="text-sm text-gray-300 leading-relaxed mb-2">
                {userName}님은 아이디어를 떠올리고 실행하는 힘은 강한데, 사주 전체의 기운이 그것을 받쳐줄 만큼 단단하지는 않은 편이에요. 벌이는 일은 많은데 그걸 다 감당할 체력·에너지가 부족한 구조라는 뜻입니다. 동시에 여러 부업을 시작하면 몸이 먼저 무너지고, 결국 본업도 흔들릴 수 있어요. <span className="text-rose-200 font-bold">한 번에 하나씩, 충분히 쉬면서</span> 진행하는 것이 {userName}님에게는 핵심입니다.
              </p>
            )}
            {isScatterRisk && (
              <p className="text-sm text-gray-300 leading-relaxed">
                {userName}님은 동료·경쟁 기운이 강해 동시에 여러 가지를 벌이고 싶은 마음이 자주 듭니다. 하지만 이 기운은 가진 자원을 이곳저곳으로 흩어 놓는 힘이기도 해서, 여러 부업을 동시에 시작하면 어느 것도 끝까지 마무리하지 못하고 흩어질 수 있어요. 새 일을 벌이기 전에 지금 하는 일을 먼저 끝내는 습관이 {userName}님에게는 특히 중요합니다.
              </p>
            )}
          </div>
        )}

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-emerald-300 mb-3">나에게 맞는 부업 방향</p>
          {SIDEJOB_TYPE.map((t, i) => (
            <div key={i} className={i > 0 ? "mt-3 pt-3 border-t border-white/5" : ""}>
              <p className="text-sm font-bold text-gray-200 mb-1">{t.title}</p>
              <p className="text-xs text-gray-400 leading-relaxed">{t.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-sky-300 mb-1">{userName}님에게 필요한 기운 — &apos;{yongshinEl}&apos;</p>
          <p className="text-sm text-gray-300 leading-relaxed">{r.yongshin.desc} 부업을 고를 때도 이 기운과 맞는 분야를 우선 고려하면, {userName}님은 본업과 부업 사이의 에너지 소모를 줄일 수 있어요. {getJikjangSiseonNarrative(r)}</p>
        </div>

        {/* 재성·식상 세력 심화 분석 */}
        {(() => {
          const sipseongStrength = getSipseongStrength(r);
          const sik = sipseongStrength.find(s => s.group === "식상");
          const jae = sipseongStrength.find(s => s.group === "재성");
          const bige = sipseongStrength.find(s => s.group === "비겁");
          const GROUP_LABEL: Record<string, string> = { 식상: "수입원을 만드는 힘", 재성: "돈으로 연결하는 힘", 비겁: "동료·경쟁 기운" };
          return (
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
              <p className="text-sm font-bold text-emerald-300 mb-3">{userName}님의 투잡 체력 진단</p>
              <div className="space-y-2">
                {[sik, jae, bige].filter(Boolean).map(s => s && (
                  <div key={s.group} className="flex items-start gap-2">
                    <span className={`shrink-0 px-2 py-0.5 rounded-md text-xs font-bold ${
                      s.status === "강함" ? "bg-emerald-900/50 text-emerald-300" :
                      s.status === "보통" ? "bg-sky-900/50 text-sky-300" :
                      s.status === "약함" ? "bg-amber-900/50 text-amber-300" :
                      "bg-white/5 text-gray-500"
                    }`}>{GROUP_LABEL[s.group] ?? s.group} · {s.status}</span>
                    <p className="text-xs text-gray-300 leading-relaxed">{s.reason}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-white/5 leading-relaxed">
                {sik?.status === "강함" && jae?.status === "강함"
                  ? `${userName}님은 수입원을 만드는 힘과 그것을 돈으로 연결하는 힘이 모두 강해서, 아이디어를 수익으로 연결하는 흐름이 사주 안에 이미 갖춰진 구조예요. 투잡 가능성이 높은 만큼, 너무 여러 가지를 한꺼번에 시도하기보다 어떤 부업에 집중할지 선택하는 게 중요해요.`
                  : sik?.status === "강함"
                  ? `${userName}님은 창작·실행력은 있지만, 그것을 돈으로 연결하는 힘이 상대적으로 약한 편이라 만든 것을 수익으로 마무리 짓는 과정에서 느슨해질 수 있어요. 수익화 루트(어디서, 어떻게 돈을 받을지)를 미리 정해두는 게 ${userName}님에게는 핵심이에요.`
                  : jae?.status === "강함"
                  ? `${userName}님은 돈에 대한 감각은 예리하지만, 새로운 수입원을 직접 만들어내는 힘이 약한 편이라 아이디어 자체를 떠올리고 실행하는 데는 시간이 걸릴 수 있어요. 새로 시작하기보다 이미 가진 전문성을 그대로 활용하는 부업이 ${userName}님에게 잘 맞아요.`
                  : `${userName}님은 두 힘 모두 두드러지지 않아서, 무리해서 새로운 수입원을 개척하기보다 안정적으로 본업을 키우는 쪽이 더 잘 맞는 구조일 수 있어요. 다만 이건 '투잡이 불가능하다'는 뜻이 아니라, 천천히 검증하면서 키워가는 방식이 더 잘 맞는다는 의미예요.`}
              </p>
            </div>
          );
        })()}

        {/* 합충 분석 */}
        {(() => {
          const allJj = [r.pillarsDetail.year.jj, r.pillarsDetail.month.jj, r.pillarsDetail.day.jj, r.pillarsDetail.hour?.jj].filter(Boolean) as string[];
          const jijiRelations = getJijiRelations(allJj);
          const hapList = jijiRelations.filter(rel => ["육합","삼합","반합"].includes(rel.type));
          const chungList = jijiRelations.filter(rel => ["충","형"].includes(rel.type));
          if (hapList.length === 0 && chungList.length === 0) return null;
          const POS_LABEL = ["년지","월지","일지","시지"];
          return (
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
              <p className="text-sm font-bold text-teal-300 mb-3">{userName}님의 투잡 에너지 흐름</p>
              {hapList.map((rel, i) => (
                <p key={i} className="text-xs text-gray-300 leading-relaxed mb-1.5">
                  <span className="text-teal-300 font-bold">{POS_LABEL[rel.a]}({rel.jjA})·{POS_LABEL[rel.b]}({rel.jjB})</span> 자리의 기운이 서로 잘 어우러지는 구조예요. {userName}님은 부업을 시작해도 흐름이 크게 흔들리지 않고 꾸준히 굴러가는 편이에요.
                </p>
              ))}
              {chungList.map((rel, i) => (
                <p key={i} className="text-xs text-amber-300/80 leading-relaxed mb-1.5">
                  <span className="font-bold">{POS_LABEL[rel.a]}({rel.jjA})·{POS_LABEL[rel.b]}({rel.jjB})</span> 자리의 기운이 서로 부딪혀 에너지가 분산될 수 있어요. {userName}님이 동시에 여러 일을 벌이면 어느 것도 제대로 마무리하지 못하는 패턴이 나타날 수 있으니, 집중력을 유지하는 게 중요해요.
                </p>
              ))}
            </div>
          );
        })()}

        {/* 극(克) 분석 */}
        {(() => {
          const OHAENG_CONTROLS_LOCAL: Record<string, Element> = { 목: "토", 토: "수", 수: "화", 화: "금", 금: "목" };
          const dominantEl = r.dominant[0];
          const lackingEl = r.lacking[0];
          const gishinEl = r.yongshin.gishin;
          const dominantControlsLacking = dominantEl && lackingEl && OHAENG_CONTROLS_LOCAL[dominantEl] === lackingEl;
          return (
            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-8">
              <p className="text-sm font-bold text-rose-300 mb-1">{userName}님의 에너지 균형</p>
              {dominantControlsLacking ? (
                <p className="text-sm text-gray-300 leading-relaxed">
                  {userName}님의 사주에서 가장 강한 <b>{dominantEl}</b> 기운이 가장 부족한 <b>{lackingEl}</b> 기운을 계속 누르고 있어요. 강한 쪽은 더 강해지고 약한 쪽은 더 고갈되는 구조라, 투잡을 할 때도 강한 기운 쪽 일(아이디어 실행·영업 등)에 몰두하다 보면 체력이나 꾸준함을 담당하는 약한 기운이 빠르게 소진돼요. {userName}님은 쉬는 날을 미리 정해서 강제로 만들어두는 게 핵심이에요.
                </p>
              ) : (
                <p className="text-sm text-gray-300 leading-relaxed">
                  {userName}님은 오행 기운이 비교적 순환하는 구조예요. 한쪽으로만 에너지가 집중되지 않아서 투잡을 해도 체력·감정·재물 사이에서 균형을 어느 정도 유지할 수 있는 편이에요.
                </p>
              )}
              {gishinEl && (
                <p className="text-xs text-gray-400 leading-relaxed mt-2 pt-2 border-t border-white/5">
                  <b>{gishinEl}</b> 기운이 강해지는 환경(예: 경쟁이 심한 분야, 과도한 관리 업무)에서 부업을 하면 {userName}님에게 필요한 기운이 눌려 오히려 본업까지 흔들릴 수 있어요. 그런 분야는 가급적 피하는 것이 {userName}님에게는 장기적으로 유리해요.
                </p>
              )}
            </div>
          );
        })()}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push("/service/career")}
            className="py-3.5 rounded-2xl font-bold text-sm bg-white/5 border border-white/10 text-gray-300 active:scale-[0.98] transition-all">
            적성·진로 보기
          </button>
          <button onClick={() => { setStep("entry"); resultRef.current = null; }}
            className="py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 text-white active:scale-[0.98] transition-all">
            다시 분석하기
          </button>
        </div>
        <ShareImageButton targetId="sidejob-result" fileName="투잡운" />
      </div>
    </main>
  );
}

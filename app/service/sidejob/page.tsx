"use client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import BackButton from "@/components/BackButton";
import { analyzeSaju, getSipseong, type SajuResult, type Element } from "@/lib/saju";
import { SIPSEONG_DESC } from "@/lib/saju2";
import AnalysisLoading from "@/components/AnalysisLoading";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";

export const dynamic = "force-dynamic";

const ELEMENT_TO_CG: Record<Element, string> = { 목: "갑", 화: "병", 토: "무", 금: "경", 수: "임" };

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
      name: "나", gender: form.gender,
      birthPlace: form.city || "서울", style: "auto", productType: "report", useJajasi: form.useJajasi,
    });
    setStep("loading");
  }

  if (step === "entry") {
    return (
      <main className="min-h-screen bg-[#0a0e14] text-white flex flex-col">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[650px] h-[650px] rounded-full bg-emerald-950/40 blur-[160px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-teal-950/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-5 py-16 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-900/50 border border-emerald-700/40 text-emerald-300 text-xs font-bold tracking-wider mb-8">
            🔥 월급만으로 안 되는 시대, 본업 외 수입 가능할까?
          </div>
          <h1 className="text-4xl font-black mb-4 leading-tight tracking-tight">
            나도 투잡,<br />
            <span className="text-emerald-400">가능한 사주</span>일까?
          </h1>
          <p className="text-gray-400 text-base mb-2 leading-relaxed">
            누구는 부업으로 월급보다 더 벌고,<br />
            <span className="text-gray-300 font-medium">누구는 본업도 흔들립니다.</span>
          </p>
          <p className="text-gray-600 text-sm mb-12">
            욕심내면 오히려 둘 다 망하는 사주도 있습니다
          </p>

          <div className="w-full space-y-3 mb-10 text-left">
            {[
              ["식상(食傷) 다중 활용 가능성", "여러 수입원을 동시에 굴릴 수 있는 구조인지 진단"],
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

          <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-bold tracking-wider mb-6">
            ✦ 완전 무료
          </div>

          <button onClick={() => setStep("form")}
            className="w-full py-4 rounded-2xl font-black text-lg tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-900/50 transition-all active:scale-[0.98]">
            내 투잡 가능성 확인하기
          </button>
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
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">
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
          "식상의 힘을 계산하는 중...",
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
      desc: "상관(傷官)의 표현력과 기획력이 강합니다. 글쓰기, 영상, SNS, 강의 콘텐츠처럼 한 번 만들어두면 꾸준히 수익이 따라오는 '레버리지형' 부업이 잘 맞습니다. 처음엔 반응이 느려도 꾸준히 쌓아가면 본업 수입을 넘어서는 경우가 많습니다.",
    });
  }
  if (sikSinCount >= 1) {
    SIDEJOB_TYPE.push({
      title: "꾸준한 생산·서비스형 부업",
      desc: "식신(食神)의 기운은 손으로 만들고 제공하는 일에서 안정적인 수익을 만듭니다. 공방, 베이킹, 외주 작업, 정기 클래스처럼 매달 일정한 패턴으로 운영되는 부업에서 꾸준히 결과가 쌓입니다.",
    });
  }
  if (jaeseongCount >= 1 && SIDEJOB_TYPE.length < 2) {
    SIDEJOB_TYPE.push({
      title: "거래·중개형 부업",
      desc: "재성(財星)의 기운이 있어, 물건이나 정보를 사고 팔거나 중개하는 형태(중고거래, 구매대행, 소규모 셀러)에서 감각적으로 수익을 만들어낼 수 있습니다.",
    });
  }
  if (SIDEJOB_TYPE.length === 0) {
    SIDEJOB_TYPE.push({
      title: "지식·자격 기반 부업",
      desc: "사주 안에 식상·재성의 기운이 두드러지지 않아, 즉흥적인 사업형 부업보다는 자신이 가진 지식이나 자격을 활용한 강의, 자문, 첨삭처럼 '이미 가진 것을 나눠주는' 형태의 부업이 안정적입니다.",
    });
  }

  return (
    <main className="min-h-screen bg-[#0a0e14] text-white">
      <BackButton />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-emerald-950/30 blur-[160px]" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-16">
        <div className="text-center mb-8">
          <p className="text-emerald-400 text-xs font-bold tracking-widest mb-2">SIDE HUSTLE POTENTIAL</p>
          <h1 className="text-2xl font-black leading-snug">
            {ilgan}{r.pillarsDetail.day.jj}일주, 당신의 투잡 가능성
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
          <p className="text-xs text-gray-500 mt-3 leading-relaxed">
            식상(食傷) {sikSangCount}개 · 재성(財星) {jaeseongCount}개 · 비겁(比劫) {bigeopCount}개 · {strength}을 종합한 결과입니다. 식상은 새로운 수입원을 만들어내는 힘, 재성은 그 결과물을 실제 돈으로 연결하는 힘을 의미합니다.
          </p>
        </div>

        {(isOverextendRisk || isScatterRisk) && (
          <div className="bg-gradient-to-br from-rose-950/60 to-orange-950/30 border border-rose-700/30 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-rose-300 mb-1">⚠ 욕심내면 위험한 구조</p>
            {isOverextendRisk && (
              <p className="text-sm text-gray-300 leading-relaxed mb-2">
                식상(아이디어·실행력)은 강한데 사주 전체가 신약(身弱)합니다. 벌이는 일은 많은데 그걸 다 감당할 체력·에너지가 부족한 구조입니다. 동시에 여러 부업을 시작하면 몸이 먼저 무너지고, 결국 본업도 흔들릴 수 있습니다. <span className="text-rose-200 font-bold">한 번에 하나씩, 충분히 쉬면서</span> 진행하는 것이 핵심입니다.
              </p>
            )}
            {isScatterRisk && (
              <p className="text-sm text-gray-300 leading-relaxed">
                비겁(比劫)이 강해 동시에 여러 가지를 벌이고 싶은 마음이 자주 듭니다. 하지만 이 기운은 자원을 분산시키는 힘이기도 해서, 여러 부업을 동시에 시작하면 어느 것도 끝까지 마무리하지 못하고 흩어질 수 있습니다. 새 일을 벌이기 전에 지금 하는 일을 먼저 끝내는 습관이 중요합니다.
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

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-8">
          <p className="text-sm font-bold text-sky-300 mb-1">용신 기준 — &apos;{yongshinEl}&apos; ({yongshinSipseong})</p>
          <p className="text-sm text-gray-300 leading-relaxed">{r.yongshin.desc} 부업을 고를 때도 이 기운과 맞는 분야를 우선 고려하면, 본업과 부업 사이의 에너지 소모가 줄어듭니다.</p>
        </div>

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
      </div>
    </main>
  );
}

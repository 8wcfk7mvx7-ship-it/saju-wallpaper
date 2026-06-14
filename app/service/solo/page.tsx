"use client";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import BackButton from "@/components/BackButton";
import { analyzeSaju, analyzeSipseongPatterns, isGanyeoJidong, GANYEO_JIDONG_LOVE, type SajuResult } from "@/lib/saju";
import AnalysisLoading from "@/components/AnalysisLoading";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";

export const dynamic = "force-dynamic";

function FadeIn({ children, delay }: { children: React.ReactNode; delay: number }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return <div style={{ opacity: v ? 1 : 0, transform: v ? "none" : "translateY(18px)", transition: `opacity 0.9s ease ${delay}ms, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>{children}</div>;
}

const HOBBY_BANK = [
  "혼자 떠나는 해외 장기 여행 — 동행 일정에 맞출 필요 없이 원하는 도시에서 원하는 만큼 머무르기",
  "야간 대학원·자격증 공부 — 가정에 쓸 시간을 온전히 자기계발에 투자하기",
  "반려동물과의 깊은 동거 — 책임을 나눠질 필요 없이 나만의 방식으로 케어하기",
  "주말 취미 모임·동호회 — 비슷한 라이프스타일을 가진 새로운 인간관계 넓히기",
  "사이드 프로젝트·소규모 창업 — 퇴근 후 시간을 전부 나의 일에 쏟기",
  "1인 가구 맞춤 인테리어·요리 — 누구의 취향도 고려하지 않고 온전히 나를 위한 공간 만들기",
];

export default function SoloPage() {
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
      <main className="min-h-screen bg-[#0a0612] text-white flex flex-col">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[650px] h-[650px] rounded-full bg-indigo-950/40 blur-[160px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-950/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-5 py-16 text-center">
          <FadeIn delay={0}>
          <div className="inline-block px-3 py-1 rounded-full bg-indigo-900/50 border border-indigo-700/40 text-indigo-300 text-xs font-bold tracking-wider mb-8">
            ✦ 완전 무료
          </div>
          </FadeIn>
          <FadeIn delay={80}>
          <h1 className="text-4xl font-black mb-4 leading-tight tracking-tight">
            나는<br />
            <span className="text-indigo-400">비혼으로 잘 사는</span><br />
            사주일까?
          </h1>
          </FadeIn>
          <FadeIn delay={160}>
          <p className="text-gray-400 text-base mb-2 leading-relaxed">
            결혼한 친구들이 부러울지, 혼자인 내가 더 편할지.<br />
            <span className="text-gray-300 font-medium">사주에 답이 이미 정해져 있습니다.</span>
          </p>
          <p className="text-gray-600 text-sm mb-12">
            결혼 적합도 vs 비혼 적합도, 숫자로 확인하세요
          </p>
          </FadeIn>

          <div className="w-full space-y-3 mb-10 text-left">
            {[
              ["결혼 적합도 vs 비혼 적합도", "사주 구조로 보는 두 선택지의 진짜 점수 차이"],
              ["비혼일 때 더 성공할까?", "혼자일 때 커리어·재물운이 더 커지는 사주인지"],
              ["배우자에게 기 빨리는 사주인지", "결혼이 오히려 나를 갉아먹는 구조는 아닌지"],
              ["비혼 시 신경 써야 할 부분", "재물·직업·인간관계에서 미리 챙겨야 할 것들"],
            ].map(([title, desc], i) => (
              <FadeIn key={title} delay={220 + i * 70}>
              <div className="flex items-start gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                </div>
              </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn delay={560}>
          <button onClick={() => setStep("form")}
            className="w-full py-4 rounded-2xl font-black text-lg tracking-tight bg-gradient-to-r from-indigo-700 to-violet-600 hover:from-indigo-600 hover:to-violet-500 text-white shadow-lg shadow-indigo-900/50 transition-all active:scale-[0.98]">
            내 결혼·비혼 적합도 확인하기
          </button>
          </FadeIn>
        </div>
      </main>
    );
  }

  if (step === "form") {
    const ready = !!form.birthYear && !!form.birthMonth && !!form.birthDay;
    return (
      <main className="min-h-screen bg-[#0a0612] text-white">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[600px] h-[600px] rounded-full bg-indigo-950/40 blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">생년월일 입력</h2>
            <p className="text-gray-500 text-sm">정확한 분석을 위해 출생 정보를 입력해주세요.</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <BirthInputForm value={form} onChange={setForm} label="나의 정보" accent="#818cf8" />
          </div>
          <button onClick={handleAnalyze} disabled={!ready}
            className={`w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all active:scale-[0.98] ${
              ready
                ? "bg-gradient-to-r from-indigo-700 to-violet-600 hover:from-indigo-600 hover:to-violet-500 text-white shadow-lg shadow-indigo-900/50"
                : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
            }`}>
            결혼·비혼 적합도 분석하기
          </button>
        </div>
      </main>
    );
  }

  if (step === "loading") {
    return <AnalysisLoading subject="나의 결혼·비혼 적합도" duration={2200} onDone={() => setStep("result")}
      messages={[
        "배우자 자리의 기운을 살펴보는 중...",
        "혼자일 때와 함께일 때를 비교하는 중...",
        "재물·커리어 흐름을 대조하는 중...",
        "결과를 정리하는 중...",
      ]}
    />;
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

  // 배우자 자리: 여성은 관성(정관·편관), 남성은 재성(정재·편재)
  const spouseKeys = isFemale ? ["정관", "편관"] : ["정재", "편재"];
  const spouseCount = spouseKeys.reduce((sum, k) => sum + totalCount(k), 0);
  const bigeopCount = totalCount("비견") + totalCount("겁재");
  const sikSangCount = totalCount("식신") + totalCount("상관");
  const strength = r.yongshin.strength;

  // 역마살/지살 — 이동·자유 기운
  const sinsalNames = r.sinsalList.map(s => s.name);
  const yeokmaCount = sinsalNames.filter(n => n === "역마살").length;
  const jisalCount = sinsalNames.filter(n => n === "지살").length;
  const moveCount = yeokmaCount + jisalCount;

  // 재다여성: 여성인데 재성(정재+편재)이 많은 경우 — 재성이 많으면 관성을 생하여 오히려 남자가 끌리거나, 일간이 재성에 치여 신약해지기 쉬움
  const jaeCount = totalCount("정재") + totalCount("편재");
  const isJaeDaYeoseong = isFemale && jaeCount >= 2;

  // 격국 패턴
  const patterns = analyzeSipseongPatterns(r.pillarsDetail);
  const hasMuGwan = patterns.some(p => p.name.includes("무관"));
  const hasMuBigeop = patterns.some(p => p.name.includes("무비겁"));

  // 완전 독립형: 무관(배우자/통제 기운 자체가 없음) + 비겁 강함 → 누군가의 통제·도움 없이도 스스로 다 해결하는 구조
  const isFullyIndependent = hasMuGwan && bigeopCount >= 2;

  // 식상 과다 + 신약 → 양육 스트레스에 특히 취약(자기 에너지를 끊임없이 쏟아내는 식상이 신약한 일간을 더 소진시킴)
  const isChildStressRisk = sikSangCount >= 3 && strength === "신약";

  // 결혼/비혼 적합도 (10점 만점, 합 10)
  let marriageScore = 5 + spouseCount * 0.9 - bigeopCount * 0.5 - sikSangCount * 0.4;
  if (strength === "신약" && spouseCount >= 2) marriageScore -= 0.8; // 신약+배우자성 과다 → 기빨림 경향
  if (moveCount >= 2) marriageScore -= 0.7; // 역마살+지살 多 → 한곳에 정착하기보다 자유로운 이동·연애 선호
  else if (moveCount >= 1) marriageScore -= 0.3;
  if (isFullyIndependent) marriageScore -= 0.8; // 완전 독립형 → 결혼 필요성 자체가 낮음
  if (isJaeDaYeoseong) marriageScore -= 0.5; // 재다여성 → 스스로 경제력을 갖춘 독립적 구조
  if (isChildStressRisk) marriageScore -= 0.6; // 양육 스트레스 리스크 → 비혼 시 정서적 안정에 유리
  marriageScore = Math.max(1, Math.min(9, Math.round(marriageScore * 2) / 2));
  const soloScore = 10 - marriageScore;

  // 배우자에게 기 빨리는 사주? — 신약한데 배우자 자리(관성/재성)가 많아 일간을 계속 소모시키는 구조
  const isDrained = strength === "신약" && spouseCount >= 2;

  // 비혼 시 신경 써야 할 부분
  const hasMuJae = totalCount("정재") + totalCount("편재") === 0;

  // 일간별 '베풀고 나누는' 기질 순위 (1위에 가까울수록 잘 퍼주는 편)
  const GIVING_RANK = ["병","갑","경","정","무","을","신","기","임","계"];
  const GIVING_DESC: Record<string, string> = {
    병: "내 것이 곧 모두의 것이라는 마음이 기본값이에요. 분위기를 띄우고 베푸는 데 망설임이 없는 편입니다.",
    갑: "한번 마음을 준 사람에게는 손해를 따지지 않고 먼저 내어주는 경향이 있어요. 통이 크다는 평을 자주 듣습니다.",
    경: "의리를 중요하게 여겨서, 내 사람이라고 생각되면 아낌없이 챙겨주는 편이에요.",
    정: "조용히, 그러나 꾸준히 나누는 타입이에요. 생색내지 않고 챙겨주는 게 특징입니다.",
    무: "넓은 마음으로 다 받아주고 베푸는 편이라, 주변에 의지하는 사람이 많아질 수 있어요.",
    을: "섬세하게 상대의 필요를 먼저 알아채고 채워주는 스타일이에요.",
    신: "깐깐해 보여도 마음을 연 사람에게는 의외로 세심하게 잘 챙겨줍니다.",
    기: "현실적인 선 안에서 필요한 만큼 잘 나누는, 균형 잡힌 베풂이에요.",
    임: "필요할 때 통 크게 쏘는 스타일이지만, 평소엔 계산이 빠른 쪽이에요.",
    계: "신중하게 따져보고 나누는 편이라, 베풂의 빈도 자체는 낮은 쪽입니다.",
  };
  const givingRankIdx = GIVING_RANK.indexOf(ilgan);
  const givingRank = givingRankIdx >= 0 ? givingRankIdx + 1 : 10;

  // 취미 추천 — 비견/겁재, 식상 강도에 따라 2개 선택
  const hobbyIdx = (bigeopCount + sikSangCount) % HOBBY_BANK.length;
  const recommendedHobbies = [HOBBY_BANK[hobbyIdx], HOBBY_BANK[(hobbyIdx + 3) % HOBBY_BANK.length]];

  return (
    <main className="min-h-screen bg-[#0a0612] text-white">
      <BackButton />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-indigo-950/30 blur-[160px]" />
      </div>
      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-16">
        <div className="text-center mb-8">
          <p className="text-indigo-400 text-xs font-bold tracking-widest mb-2">MARRIAGE OR SOLO</p>
          <h1 className="text-2xl font-black leading-snug">
            {ilgan}{r.pillarsDetail.day.jj}일주 {form.name || "나"}님의<br />결혼 vs 비혼 적합도
          </h1>
        </div>

        <div className="rounded-3xl p-6 mb-5 bg-gradient-to-br from-indigo-950/60 to-violet-950/40 border border-indigo-700/30">
          <p className="text-indigo-300 text-xs font-bold tracking-widest uppercase mb-4">결혼 적합도 vs 비혼 적합도 (10점 만점)</p>
          <div className="flex justify-between mb-1.5">
            <span className="text-sm font-bold text-rose-300">결혼 {marriageScore}점</span>
            <span className="text-sm font-bold text-indigo-300">비혼 {soloScore}점</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-4 overflow-hidden flex">
            <div className="h-full flex items-center justify-start pl-2"
              style={{ width: `${(marriageScore / 10) * 100}%`, background: "linear-gradient(90deg, #f43f5e, #fb7185)" }} />
            <div className="h-full flex items-center justify-end pr-2"
              style={{ width: `${(soloScore / 10) * 100}%`, background: "linear-gradient(90deg, #6366f1, #818cf8)" }} />
          </div>
          <p className="text-sm text-gray-300 leading-relaxed mt-4">
            {marriageScore > soloScore
              ? "결혼 쪽으로 무게가 더 실리는 구조입니다. 다만 점수 차이가 크지 않다면, 결혼 자체보다 '어떤 사람과' 결혼하느냐가 행복도를 좌우하는 핵심 변수가 됩니다."
              : marriageScore < soloScore
              ? "비혼 쪽으로 무게가 더 실리는 구조입니다. 이는 결혼을 못 한다는 뜻이 아니라, 혼자만의 시간과 자율성이 확보될 때 삶의 만족도가 훨씬 크게 올라가는 기질이라는 뜻입니다."
              : "결혼과 비혼, 어느 쪽으로도 크게 기울지 않는 균형형입니다. 결국 선택은 사주가 아니라 '지금 어떤 삶을 더 원하는가'에 달려 있는 구조입니다."}
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-emerald-300 mb-1">비혼일 때 더 성공할까?</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            {bigeopCount >= 2 || hasMuGwan
              ? "사주 구조상 독립성과 자기 주도성이 강한 편입니다. 누군가에게 맞춰야 하는 환경보다, 본인의 결정으로 시간과 자원을 온전히 운용할 수 있는 환경에서 성과가 훨씬 크게 나타나는 타입입니다. 결혼 후 가정에 들어가는 에너지가 줄어들수록, 그 에너지가 일·자기계발 쪽으로 옮겨가며 성공 가능성이 오히려 높아질 수 있습니다."
              : sikSangCount >= 2
              ? "표현력과 생산성을 의미하는 식상 기운이 강합니다. 이 기운은 가정보다 일·창작·콘텐츠 쪽에서 발휘될 때 더 큰 결과로 이어지는 경향이 있어, 비혼 상태에서 자기 일에 몰입할 때 성취도가 높아지는 구조입니다."
              : "독립성을 강하게 자극하는 기운은 두드러지지 않습니다. 비혼이 곧 더 큰 성공을 보장하는 구조는 아니며, 오히려 안정적인 관계 속에서 정서적 기반이 확보될 때 더 좋은 성과를 내는 편에 가깝습니다. 다만 그렇다고 비혼이 불리한 것도 아니므로, 본인의 라이프스타일 선호가 더 중요한 변수입니다."}
          </p>
        </div>

        {moveCount >= 1 && (
          <div className="bg-white/[0.03] border border-sky-700/20 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-sky-300 mb-1">역마살·지살 — 이동과 자유를 부르는 기운</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              {moveCount >= 2
                ? "역마살과 지살이 함께 자리하고 있어, 한 곳·한 사람에게 묶이기보다 끊임없이 새로운 환경·관계로 이동하려는 기운이 강합니다. 이런 구조에서는 정해진 틀 안에서의 결혼생활보다, 자유롭게 만나고 헤어지고 또 새로운 인연을 만나는 '자유로운 연애'가 훨씬 더 본인의 기질에 맞습니다. 비혼이 오히려 이 기운을 가장 건강하게 쓰는 방법일 수 있어요."
                : "이동·변화의 기운이 어느 정도 자리하고 있어, 한 사람·한 장소에 완전히 정착하기보다 적당한 거리와 자유를 유지하는 관계 방식이 더 잘 맞는 편입니다. 결혼을 하더라도 너무 밀착된 형태보다는, 각자의 영역을 존중하는 방식이 잘 어울립니다."}
            </p>
          </div>
        )}

        {isFullyIndependent && (
          <div className="bg-white/[0.03] border border-violet-700/20 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-violet-300 mb-1">남자(배우자)가 필요 없는, 완전 독립형 사주</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              사주 안에 배우자·통제를 의미하는 관성 기운이 거의 없고, 반면 자기 자신의 힘인 비겁 기운은 강하게 자리하고 있습니다. 이런 구조는 누군가에게 의지하거나 누군가의 보호·통제를 받을 필요 자체가 적은, 스스로 모든 걸 결정하고 만들어가는 타입입니다. 결혼이 '결핍을 채우는 선택'이 되기보다, 오히려 자유를 줄이는 선택이 될 가능성이 큽니다. 비혼으로 살아도 전혀 외롭거나 부족하지 않은, 본인 스스로가 이미 완결된 구조라고 볼 수 있어요.
            </p>
          </div>
        )}

        {isJaeDaYeoseong && (
          <div className="bg-white/[0.03] border border-amber-700/20 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-amber-300 mb-1">재다여성(財多女性) — 스스로 돈을 버는 구조</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              여성 사주에서 재성(財星)이 여러 개 자리한 '재다여성' 구조입니다. 재성은 본래 여성에게 '내가 직접 다루는 재물·일'을 의미하는데, 이게 과하면 배우자에게 경제적으로 의존하기보다 스스로 벌고 쓰고 관리하는 쪽으로 무게가 실립니다. 경제적 독립이 이미 기본값인 구조이기 때문에, 결혼이 주는 '경제적 안정'이라는 메리트가 상대적으로 약하게 느껴질 수 있어요. 비혼으로 살아도 재정적으로 흔들릴 일이 적은, 안정적인 구조에 가깝습니다.
            </p>
          </div>
        )}

        {isChildStressRisk && (
          <div className="bg-white/[0.03] border border-rose-700/20 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-rose-300 mb-1">육아·양육 스트레스에 취약할 수 있는 구조</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              일간이 신약한 가운데 식상(食傷) 기운이 매우 강한 구조입니다. 식상은 '내 에너지를 밖으로 쏟아내는' 기운인데, 이게 신약한 일간에서 과하게 작용하면 일상적인 소진감이 큰 편입니다. 특히 육아처럼 24시간 끊임없이 에너지를 내어줘야 하는 환경에서는 이 소진이 누적되어 정서적으로 크게 흔들릴 수 있습니다. 아이를 낳고 키우는 것이 잘 맞지 않을 수 있는 구조이므로, 비혼이나 무자녀의 삶이 정신적 안정 측면에서 훨씬 유리할 수 있습니다.
            </p>
          </div>
        )}

        {isDrained && (
          <div className="bg-white/[0.03] border border-rose-700/20 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-rose-300 mb-1">⚠ 배우자에게 기(氣)가 빨리는 구조일 수 있어요</p>
            <p className="text-sm text-gray-300 leading-relaxed">
              사주 전체의 신강·신약을 보면 일간이 신약한 편인데, 배우자 자리에 해당하는 기운이 사주 곳곳에 여러 개 자리하고 있습니다. 이런 구조에서는 관계 속에서 본인의 에너지가 상대에게 계속 흘러가기 쉬워, 결혼 후 체력적·정서적으로 쉽게 소진되는 경향이 나타날 수 있습니다. 만약 결혼을 선택한다면, 의식적으로 '나만의 회복 시간'을 확보하는 구조를 미리 만들어두는 것이 중요합니다.
            </p>
          </div>
        )}

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-pink-300 mb-1">연애 관계에서 — 나누고 베푸는 기질 ({givingRank}/10위)</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            {GIVING_DESC[ilgan]}
            {givingRank <= 3
              ? " 다만 좋아하는 사람 앞에서는 손해를 따지지 않고 다 내어주는 편이라, 상대를 가릴 때는 '받는 것에도 익숙한 사람'인지 함께 보는 게 좋습니다."
              : ""}
          </p>
        </div>

        {isGanyeoJidong(ilgan, r.pillarsDetail.day.jj) && (
          <div className="bg-white/[0.03] border border-rose-700/20 rounded-2xl p-5 mb-5">
            <p className="text-sm font-bold text-rose-300 mb-1">{isFemale ? "남자복" : "여자복"}이 없는 걸까? — 간여지동(干與支同)</p>
            <div className="space-y-2 text-sm text-gray-300 leading-relaxed">
              <p>{GANYEO_JIDONG_LOVE.disclaimer}</p>
              <p>{GANYEO_JIDONG_LOVE.charm}</p>
              <p>{GANYEO_JIDONG_LOVE.hapTrigger}</p>
              {bigeopCount >= 2 && <p>{GANYEO_JIDONG_LOVE.bigeopMany}</p>}
              <p>{GANYEO_JIDONG_LOVE.notRequired}</p>
              <p className="text-rose-300 font-bold">{GANYEO_JIDONG_LOVE.coupleGanyeo}</p>
            </div>
          </div>
        )}

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-amber-300 mb-1">비혼으로 살 때 특히 신경 써야 할 부분</p>
          <p className="text-sm text-gray-300 leading-relaxed">
            {hasMuJae
              ? "재성이 약한 구조라, 혼자 경제를 책임져야 하는 비혼 생활에서는 재물 관리가 가장 중요한 변수가 됩니다. 고정 수입을 자동으로 분리·저축하는 시스템을 일찍 만들어두는 것이 노후 안정성에 큰 차이를 만듭니다."
              : hasMuBigeop
              ? "비겁이 약해 혼자 모든 걸 결정하고 책임져야 하는 상황에서 외로움을 크게 느낄 수 있는 구조입니다. 가족 형태의 관계가 아니더라도, 정기적으로 의지할 수 있는 친구·커뮤니티 관계를 의식적으로 만들어두는 것이 정서적 안정에 중요합니다."
              : "전반적으로 큰 약점이 두드러지지는 않지만, 비혼 생활은 모든 의사결정과 리스크를 혼자 감당해야 한다는 특성이 있습니다. 재물·건강·인간관계 세 영역을 정기적으로 점검하는 습관을 만들어두면 장기적으로 훨씬 안정적인 비혼 생활이 가능합니다."}
          </p>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-8">
          <p className="text-sm font-bold text-violet-300 mb-2">결혼하지 않고 추가로 시도하면 좋을 것들</p>
          <ul className="space-y-2">
            {recommendedHobbies.map(h => (
              <li key={h} className="text-sm text-gray-300 leading-relaxed flex items-start gap-2">
                <span className="text-violet-400 mt-0.5">✦</span>
                <span>{h}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push("/service/wealth")}
            className="py-3.5 rounded-2xl font-bold text-sm bg-white/5 border border-white/10 text-gray-300 active:scale-[0.98] transition-all">
            내 재물운 보기
          </button>
          <button onClick={() => { setStep("entry"); resultRef.current = null; }}
            className="py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-indigo-700 to-violet-600 text-white active:scale-[0.98] transition-all">
            다시 분석하기
          </button>
        </div>
      </div>
    </main>
  );
}

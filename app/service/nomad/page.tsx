"use client";
import { useRouter } from "next/navigation";
import { useState, useRef } from "react";
import BackButton from "@/components/BackButton";
import { analyzeSaju, analyzeSipseongPatterns, getSipseongStrength, type SajuResult } from "@/lib/saju";
import AnalysisLoading from "@/components/AnalysisLoading";
import BirthInputForm, { type BirthFormData, defaultBirthData } from "@/components/BirthInputForm";
import ShareImageButton from "@/components/ShareImageButton";

export const dynamic = "force-dynamic";

const TYPES: { id: string; title: string; emoji: string; cond: (c: Record<string, number>, strength: string) => boolean; desc: string; warn: string; jobs: string[]; action: string; envTitle: string; env: string }[] = [
  {
    id: "사업가형",
    emoji: "🏢",
    title: "조직보다 내가 대표여야 하는 사주",
    cond: (c) => (c["식상"] >= 2 && c["재성"] >= 1) && c["관성"] === 0,
    desc: "조직·규율에 묶이는 기운이 거의 없고, 표현력·창의성과 돈을 굴리는 감각이 함께 강합니다. 위에서 시키는 일을 처리하는 자리에서는 답답함을 느끼기 쉽고, 스스로 기획하고 책임지는 위치에서 비로소 능력이 폭발합니다. 작게라도 '내 이름으로 운영되는' 사업·브랜드·채널을 만들었을 때 만족도와 성과가 모두 올라갑니다.",
    warn: "다만 조직·규율의 기운이 없다는 건 외부의 견제와 규칙이 약하다는 뜻이기도 합니다. 세금·계약·법적 절차처럼 '하기 싫지만 반드시 해야 하는 행정'을 미루지 않는 시스템(세무사, 자동화 툴)을 처음부터 만들어두는 것이 사업의 수명을 좌우합니다.",
    jobs: ["자영업·창업 (요식업, 리테일, 서비스업)", "1인 브랜드·온라인 셀러", "에이전시·대행업 (마케팅, 광고, 컨설팅)", "프랜차이즈 가맹점 운영"],
    envTitle: "잘 맞는 근무 환경",
    env: "출퇴근 시간과 의사결정 권한이 100% 본인에게 있는 구조가 가장 잘 맞습니다. 직원을 두고 위임하는 경험을 빨리 쌓을수록 사업이 커질 때 본인이 병목이 되는 것을 막을 수 있습니다.",
    action: "지금 당장 사업을 키우기보다, 퇴근 후 시간을 활용해 작은 단위(스마트스토어 1개, 인스타 계정 1개)로 '내가 대표인 구조'를 미리 경험해보세요. 행정·세무는 처음부터 외주화하는 습관을 들이는 것이 핵심입니다.",
  },
  {
    id: "디지털노마드형",
    emoji: "🧳",
    title: "장소에 묶이지 않을 때 능력이 살아나는 사주",
    cond: (c) => c["식상"] >= 2 && c["인성"] >= 1,
    desc: "표현력·창의성과 학습 능력을 뜻하는 기운이 함께 강합니다. 정해진 사무실, 정해진 시간에 갇혀 있을 때 에너지가 가장 빠르게 소모되고, 환경을 스스로 바꿔가며 일할 때 오히려 집중력과 창의성이 올라가는 구조입니다. 온라인 기반 콘텐츠·번역·디자인·개발처럼 장소에 구애받지 않는 일에서 강점이 극대화됩니다.",
    warn: "자유로운 환경일수록 스스로 만든 루틴이 없으면 쉽게 무너집니다. '어디서든 일한다'와 '아무 때나 일한다'는 다릅니다. 시간대를 고정한 최소한의 루틴을 만들어야 자유가 오히려 생산성으로 이어집니다.",
    jobs: ["콘텐츠 크리에이터·1인 미디어", "프리랜서 개발자·디자이너·번역가", "온라인 강의·전자책 제작", "리모트 근무가 가능한 IT·마케팅 직군"],
    envTitle: "잘 맞는 근무 환경",
    env: "재택·리모트, 프리랜서, 또는 워케이션처럼 '장소를 스스로 선택할 수 있는' 형태가 가장 잘 맞습니다. 다만 완전한 무소속보다는, 최소한의 고정 수입(클라이언트 1~2곳)을 확보한 채 자유도를 넓혀가는 방식이 안정적입니다.",
    action: "하루 중 '반드시 일하는 3시간'을 정해 캘린더에 고정하세요. 장소는 매일 바뀌어도 되지만, 그 시간만큼은 알림을 끄고 한 가지 작업에만 집중하는 연습이 필요합니다.",
  },
  {
    id: "투자가형",
    emoji: "📈",
    title: "굴리고 불리는 감각이 발달한 사주",
    cond: (c, strength) => c["재성"] >= 2 && strength !== "신약",
    desc: "돈과 자산을 굴리는 기운이 두드러지고, 타고난 기운 자체도 단단한 사주입니다. 돈을 '버는 것'보다 '굴리는 것'에 대한 감각과 담대함이 있어, 투자·자산 운용에서 또래보다 빠르게 감을 잡는 경우가 많습니다. 본업 외에 자산을 분산해서 운용하는 흐름이 자연스럽게 잘 맞습니다.",
    warn: "돈을 굴리는 기운이 강한 만큼 욕심도 함께 커질 수 있습니다. 특히 기운이 단단한 상태에서 거기에만 몰두하면 한 곳에 자산을 몰아넣는 '몰빵' 성향이 나오기 쉬우니, 투자 비중을 미리 정해두고 그 기준을 지키는 것이 핵심입니다.",
    jobs: ["금융·자산운용·부동산 관련 직군", "본업 + 주식·부동산·코인 등 자산 포트폴리오 운용", "재테크 콘텐츠·정보성 부업", "유통·도매처럼 현금 흐름을 직접 굴리는 업종"],
    envTitle: "잘 맞는 근무 환경",
    env: "안정적인 본업(또는 사업) 수입을 기반으로 별도의 '운용 계좌'를 가져가는 구조가 잘 맞습니다. 숫자와 데이터를 매일 들여다볼 수 있는 환경일수록 감각이 더 날카로워집니다.",
    action: "투자에 쓸 자산의 상한선(예: 전체 자산의 20~30%)을 먼저 정하고, 그 범위 안에서만 움직이는 규칙을 글로 적어두세요. 감이 좋을수록 '규칙 없는 베팅'의 유혹이 커진다는 점을 기억해야 합니다.",
  },
  {
    id: "안정추구형",
    emoji: "🏛️",
    title: "조직 안에서 더 크게 성장하는 사주",
    cond: (c) => c["관성"] >= 2 || c["인성"] >= 2,
    desc: "조직·규율을 따르는 기운 또는 학습·전문성을 쌓는 기운이 강하게 자리하고 있습니다. 정해진 체계와 평판이 쌓이는 환경에서 신뢰와 전문성이 빠르게 축적되는 구조입니다. 사업·투자보다는 조직 내에서 자격·경력·직급을 쌓아가는 쪽이 훨씬 안정적이고 큰 성과로 이어집니다.",
    warn: "그렇다고 부업·투자가 안 맞는다는 뜻은 아닙니다. 다만 본업의 안정성을 깨뜨릴 정도의 모험은 피하는 것이 좋고, 사업·투자는 '본업을 지킨 채로' 천천히 비중을 늘려가는 방식이 이 사주에는 훨씬 잘 맞습니다.",
    jobs: ["대기업·공공기관·전문직 (의료, 법률, 교육)", "자격증·라이센스 기반 전문 직군", "조직 내 관리자·팀장 트랙", "안정적인 장기 근속이 가능한 기업"],
    envTitle: "잘 맞는 근무 환경",
    env: "출퇴근, 평가, 승진 체계가 명확한 조직일수록 안정감과 동시에 동기부여를 함께 얻습니다. 이름과 직급이 명함에 분명히 새겨지는 자리일수록 이 사주의 잠재력이 잘 드러납니다.",
    action: "투자·부업은 '본업 시간의 10% 이내'로 제한하고, 자격증·전문성처럼 시간이 갈수록 가치가 누적되는 영역에 우선 투자하세요. 조급하게 큰 변화를 시도하기보다 꾸준한 누적이 이 사주의 진짜 무기입니다.",
  },
];

const DEFAULT_TYPE = TYPES[3];

// 내부 그룹 키 → 화면에 보여줄 평이한 한국어 라벨
const GROUP_LABEL: Record<string, string> = {
  비겁: "추진력",
  식상: "표현력",
  재성: "재물감각",
  관성: "조직력",
  인성: "학습력",
};

export default function NomadPage() {
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
      <main className="min-h-screen bg-[#0a0a14] text-white flex flex-col page-fade-in">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[650px] h-[650px] rounded-full bg-cyan-950/40 blur-[160px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-950/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-2xl mx-auto w-full px-5 py-16 text-center">
          <div className="inline-block px-3 py-1 rounded-full bg-cyan-900/50 border border-cyan-700/40 text-cyan-300 text-xs font-bold tracking-wider mb-8">
            🌴 회사 다니는 게 유난히 답답하게 느껴진다면
          </div>
          <h1 className="text-4xl font-black mb-4 leading-tight tracking-tight">
            나는 조직형?<br />
            <span className="text-cyan-400">사업가·노마드형</span>?
          </h1>
          <p className="text-gray-400 text-base mb-2 leading-relaxed">
            같은 월급을 받아도 누군가는 답답하고,<br />
            <span className="text-gray-300 font-medium">누군가는 그 안정이 더없이 편안합니다.</span>
          </p>
          <p className="text-gray-600 text-sm mb-12">
            내 사주가 원하는 방향과 반대로 살고 있을 수도 있습니다
          </p>

          <div className="w-full space-y-3 mb-10 text-left">
            {[
              ["나의 일 유형 진단", "사업가형 / 디지털노마드형 / 투자가형 / 안정추구형 중 어디에 가까운지"],
              ["강점이 발휘되는 환경", "내 기운이 가장 잘 작동하는 일하는 방식"],
              ["주의해야 할 함정", "그 유형에서 가장 흔하게 무너지는 패턴과 대처법"],
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

          <div className="inline-block px-3 py-1 rounded-full bg-white/5 border border-white/10 text-gray-400 text-xs font-bold tracking-wider mb-6">
            ✦ 완전 무료
          </div>

          <button onClick={() => setStep("form")}
            className="w-full py-4 rounded-2xl font-black text-lg tracking-tight bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/50 transition-all active:scale-[0.98]">
            내 일 유형 확인하기
          </button>
        </div>
      </main>
    );
  }

  if (step === "form") {
    const ready = !!form.birthYear && !!form.birthMonth && !!form.birthDay;
    return (
      <main className="min-h-screen bg-[#0a0a14] text-white">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[600px] h-[600px] rounded-full bg-cyan-950/40 blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 pb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">생년월일 입력</h2>
            <p className="text-gray-500 text-sm">정확한 분석을 위해 출생 정보를 입력해주세요.</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <BirthInputForm value={form} onChange={setForm} label="나의 정보" accent="#22d3ee" />
          </div>
          <button onClick={handleAnalyze} disabled={!ready}
            className={`w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all active:scale-[0.98] ${
              ready
                ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/50"
                : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
            }`}>
            분석하기
          </button>
        </div>
      </main>
    );
  }

  if (step === "loading") {
    return (
      <AnalysisLoading
        subject="나의 일 유형"
        duration={2200}
        onDone={() => setStep("result")}
        messages={[
          "조직과 자유, 어느 쪽이 잘 맞는지 계산하는 중...",
          "사업가·투자가·노마드 기운을 비교하는 중...",
          "이 유형에서 흔히 무너지는 패턴을 찾는 중...",
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

  const SIPSEONG_GROUP: Record<string, "비겁" | "식상" | "재성" | "관성" | "인성"> = {
    비견: "비겁", 겁재: "비겁", 식신: "식상", 상관: "식상",
    정재: "재성", 편재: "재성", 정관: "관성", 편관: "관성", 정인: "인성", 편인: "인성",
  };
  const groupCounts: Record<string, number> = { 비겁: 0, 식상: 0, 재성: 0, 관성: 0, 인성: 0 };
  sipseongList.forEach(s => {
    const g = SIPSEONG_GROUP[s];
    if (g) groupCounts[g] += 1;
  });

  const strength = r.yongshin.strength;
  const matched = TYPES.find(t => t.cond(groupCounts, strength)) || DEFAULT_TYPE;
  const patterns = analyzeSipseongPatterns(r.pillarsDetail);
  const strengthInfo = getSipseongStrength(r);
  const strengthMap = Object.fromEntries(strengthInfo.map(s => [s.group, s])) as Record<"비겁" | "식상" | "재성" | "관성" | "인성", typeof strengthInfo[number]>;

  return (
    <main className="min-h-screen bg-[#0a0a14] text-white">
      <BackButton />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[600px] h-[600px] rounded-full bg-cyan-950/30 blur-[160px]" />
      </div>
      <div className="relative z-10 max-w-2xl mx-auto px-4 pt-6 pb-16" id="nomad-result">
        <div className="text-center mb-8">
          <p className="text-cyan-400 text-xs font-bold tracking-widest mb-2">WORK STYLE</p>
          <h1 className="text-2xl font-black leading-snug">
            {ilgan}{r.pillarsDetail.day.jj}일주, 당신의 일 유형
          </h1>
        </div>

        <div className="bg-gradient-to-br from-cyan-950/60 to-blue-950/40 border border-cyan-700/30 rounded-3xl p-6 mb-5 text-center">
          <div className="text-4xl mb-2">{matched.emoji}</div>
          <p className="text-cyan-300 text-xs font-bold tracking-widest uppercase mb-2">{matched.id}</p>
          <p className="text-xl font-black leading-snug mb-4">{matched.title}</p>
          <div className="text-sm text-gray-300 leading-relaxed text-left space-y-3">
            <p>{matched.desc} {matched.env}</p>
            <p>구체적으로는 {matched.jobs.join(", ")} 같은 분야에서 이 기운이 잘 풀려요.</p>
            <p>{matched.warn}</p>
            <p className="text-cyan-200">{matched.action}</p>
          </div>
        </div>

        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-8">
          <p className="text-sm font-bold text-sky-300 mb-3">다섯 기운으로 보는 나의 균형</p>
          <div className="space-y-2 mb-4">
            {Object.entries(groupCounts).map(([g, n]) => (
              <div key={g} className="flex items-center gap-2">
                <span className="text-xs text-gray-400 w-10">{GROUP_LABEL[g] ?? g}</span>
                <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                  <div className="h-full rounded-full bg-cyan-400" style={{ width: `${Math.min(100, n * 25)}%` }} />
                </div>
                <span className="text-xs text-gray-500 w-4 text-right">{n}</span>
              </div>
            ))}
          </div>
          <div className="text-sm text-gray-300 leading-relaxed space-y-2">
            <p>
              새로운 것을 만드는 힘, 그것을 돈으로 바꾸는 힘, 체계와 규칙을 지키는 힘, 학습과 전문성을 쌓는 힘, 추진력과 경쟁심을 의미하는 힘. 이 다섯 기운의 균형이 곧 일하는 방식의 취향을 결정하는데, 단순히 글자 개수만이 아니라 그 글자가 어느 자리에 있고 주변 기운과 어떤 관계를 맺는지까지 함께 봐야 진짜 세력이 보여요.
            </p>
            {(["비겁", "식상", "재성", "관성", "인성"] as const).map(g => (
              <p key={g}><span className="font-bold text-gray-200">{GROUP_LABEL[g]}</span>은 {strengthMap[g].status} — {strengthMap[g].reason}</p>
            ))}
            {patterns.length > 0 && (
              <p>
                {patterns.slice(0, 2).map(p => `${p.desc} ${p.advice}`).join(" ")}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => router.push("/service/sidejob")}
            className="py-3.5 rounded-2xl font-bold text-sm bg-white/5 border border-white/10 text-gray-300 active:scale-[0.98] transition-all">
            투잡 가능성 보기
          </button>
          <button onClick={() => { setStep("entry"); resultRef.current = null; }}
            className="py-3.5 rounded-2xl font-bold text-sm bg-gradient-to-r from-cyan-600 to-blue-600 text-white active:scale-[0.98] transition-all">
            다시 분석하기
          </button>
        </div>
        <ShareImageButton targetId="nomad-result" fileName="디지털노마드" />
      </div>
    </main>
  );
}

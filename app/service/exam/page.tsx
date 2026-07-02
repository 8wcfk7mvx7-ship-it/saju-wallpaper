"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import BackButton from "@/components/BackButton";
import {
  analyzeSaju, getSipseong, CHEONGAN_ELEMENT, CHEONUL_JJ,
  type SajuResult, type Element,
} from "@/lib/saju";
import { SIPSEONG_DESC } from "@/lib/saju2";
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

// 오행 → 집중력 학습 유형
const ELEMENT_STUDY_TYPE: Record<Element, { label: string; strength: string; weakness: string; method: string; timing: string }> = {
  목: {
    label: "성장형 집중",
    strength: "새로운 분야를 처음 접할 때 가장 강한 집중력이 발휘됩니다. 탐구심과 성장 욕구가 강해 자기주도학습에 특히 잘 맞습니다.",
    weakness: "루틴화된 반복 학습에서는 집중력이 빠르게 흩어집니다. 같은 문제를 수십 번 반복하는 단순 훈련보다 이해→응용 흐름이 훨씬 효과적입니다.",
    method: "마인드맵, 개념도 그리기, '왜?'를 쫓는 질문식 학습. 교재를 처음부터 끝까지 읽기보다 목차를 먼저 파악한 뒤 큰 그림에서 세부로 들어가는 방식이 유리합니다.",
    timing: "오전 8시~12시 목의 기운이 오르는 새벽~오전 구간에 신개념 인풋에 집중하고, 오후는 복습과 문제풀이로 활용하세요.",
  },
  화: {
    label: "몰입 폭발형 집중",
    strength: "흥미와 감정이 붙으면 몇 시간이고 한 자리에 앉아 끝장을 내는 '불꽃 집중'이 가능합니다. 이해하는 순간의 쾌감을 엔진 삼아 공부합니다.",
    weakness: "흥미가 식거나 지루해지는 순간 에너지가 급격히 떨어집니다. 장기 루틴 유지보다 단기 고강도 집중이 맞습니다.",
    method: "타이머 활용 뽀모도로(25분 집중+5분 휴식)보다는 흥미 기반 테마 학습. 스터디 그룹에서 설명하는 역할을 맡으면 이해도가 급격히 높아집니다.",
    timing: "오전 9시~오후 1시, 오후 7시~10시가 에너지 피크입니다. 오후 2시~5시 에너지 저점엔 가벼운 복습이나 휴식을 넣으세요.",
  },
  토: {
    label: "꾸준 누적형 집중",
    strength: "한 번에 대량 이해보다 조금씩 반복 누적하는 방식에서 폭발적인 성과가 나옵니다. 일관성과 성실함이 가장 큰 무기입니다.",
    weakness: "처음 낯선 개념을 접할 때 진입 장벽을 느낍니다. '전체 그림'보다 '현재 범위'에 집중하는 성향상, 핵심 흐름을 파악하는 데 시간이 더 걸릴 수 있습니다.",
    method: "매일 같은 시간 같은 장소에서 학습하는 루틴 고정. 노트 필기를 정돈하는 시간을 아까워하지 마세요 — 정리 자체가 복습이 됩니다.",
    timing: "저녁 8시~11시 규칙적 시간대가 가장 잘 맞습니다. 주말 집중 학습보다 평일 1~2시간씩 누적하는 방식이 장기적으로 유리합니다.",
  },
  금: {
    label: "정밀 분석형 집중",
    strength: "문제를 끝까지 파고드는 집중력이 탁월합니다. 오답의 원인을 끝까지 추적하고, 개념의 정확성을 챙기는 성향이 수학·논술·법학 등 정밀한 분야에서 강점이 됩니다.",
    weakness: "완벽주의 성향이 진도를 늦출 수 있습니다. '100% 이해하고 넘어가야 한다'는 압박이 전체 학습 속도를 저하시킵니다.",
    method: "오답 노트 중심 학습이 최강입니다. 틀린 문제의 원인을 3단계로 분석(개념 오류/계산 실수/시간 부족)하고 유형화하면 단기간에 실력이 도약합니다.",
    timing: "오전 6시~9시 금의 냉철함이 극대화되는 이른 아침이 정밀 학습 골든타임입니다. 늦은 밤은 집중이 잘 되는 편이나 수면 부족이 쌓이면 역효과가 납니다.",
  },
  수: {
    label: "연결 직관형 집중",
    strength: "개념과 개념 사이 연결고리를 빠르게 포착합니다. 전혀 다른 분야의 지식을 연결해 창의적 풀이를 만드는 능력이 뛰어납니다.",
    weakness: "생각이 넓게 퍼지는 만큼 한 주제에 오래 머물기가 어렵습니다. 응용문제보다 기초 개념 반복 암기에서 지루함이 빨리 옵니다.",
    method: "스토리텔링 학습과 연상 암기법이 효과적입니다. 단어·공식보다 맥락과 흐름으로 기억하세요. 백지 복습(배운 내용을 아무것도 보지 않고 써내려가기)이 기억 정착에 탁월합니다.",
    timing: "밤 10시~새벽 1시 수의 기운이 깊어지는 야간이 집중 피크입니다. 단, 수면 시간을 확보한 상태에서만 효과가 있습니다.",
  },
};

// 십성 기반 시험 합격 전략
const SIPSEONG_EXAM: Record<string, { title: string; desc: string; tip: string }> = {
  비견: {
    title: "경쟁 자극 활용",
    desc: "혼자 공부할 때보다 경쟁 상대가 있을 때 집중력이 극대화됩니다. 스터디 그룹에서 같은 목표를 가진 사람들과 함께하면 자연스럽게 긴장감이 유지됩니다.",
    tip: "모의고사 점수나 진도를 공개하는 환경을 만들고, 비교 가능한 기준을 통해 스스로를 점검하세요.",
  },
  겁재: {
    title: "승부 본능 활용",
    desc: "시험을 '싸움'으로 인식할 때 에너지가 살아납니다. 공부보다 '이 시험에서 이기겠다'는 의지 세팅이 먼저 필요한 유형입니다.",
    tip: "시험일을 목표로 역산해 주차별 마일스톤을 설정하고, 각 단계를 '작은 승리'로 인식하세요.",
  },
  식신: {
    title: "흥미 기반 학습",
    desc: "재미없는 과목은 몸이 거부반응을 일으킵니다. '왜 이게 중요한지'를 연결하면 학습 속도가 달라집니다. 흥미로운 사례와 연결하는 능력이 탁월합니다.",
    tip: "유튜브 강의, 팟캐스트, 관련 영화 등 다양한 미디어로 배경 지식을 먼저 쌓고 교재로 들어가세요.",
  },
  상관: {
    title: "비판적 이해 활용",
    desc: "단순 암기보다 '왜 이 공식인가', '다른 방법은 없는가'를 따지는 비판적 사고 방식이 강점입니다. 논술·면접·서술형 시험에서 특히 두드러집니다.",
    tip: "출제자의 의도를 역추적하는 연습을 하세요. 기출문제를 '왜 이 문제를 냈을까'의 관점으로 분석하면 시험 패턴이 보입니다.",
  },
  정재: {
    title: "계획 관리 활용",
    desc: "체계적인 계획이 있을 때 가장 효율적으로 움직입니다. 즉흥 학습보다 주간/일간 계획을 세우고 지키는 능력이 탁월합니다.",
    tip: "플래너를 활용하되, 목표 달성률보다 '학습 시간 누적'을 기록하세요. 숫자로 확인할 수 있는 진척감이 동기를 유지시킵니다.",
  },
  편재: {
    title: "유연 전략 활용",
    desc: "한 방향보다 여러 방법을 시험해보고 자신에게 맞는 방식을 찾는 능력이 강점입니다. 고정된 루틴보다 상황에 맞게 유연하게 조정할 때 성과가 납니다.",
    tip: "완벽한 계획보다 '오늘 할 수 있는 것 먼저' 접근이 효과적입니다. 막히는 부분은 넘기고 풀 수 있는 것부터 쌓아가세요.",
  },
  정관: {
    title: "책임감 기반 학습",
    desc: "규칙과 원칙을 지키는 것에 강한 동기가 있습니다. '이 시험에 합격해야 한다'는 사회적 책임감이 공부의 엔진이 되는 유형입니다.",
    tip: "학원, 스터디, 책임감을 지게 되는 공식 그룹에 속하는 것이 독학보다 훨씬 효과적입니다.",
  },
  편관: {
    title: "도전 압박 활용",
    desc: "압박이 있어야 움직입니다. 여유 있는 환경보다 마감이 촉박하거나 위기감이 있을 때 오히려 집중력이 높아집니다.",
    tip: "데드라인을 실제보다 앞당겨 설정하세요. '시험 3주 전 기준'으로 미리 실전 모의고사를 치르고 결과를 직시하면 각성 효과가 있습니다.",
  },
  정인: {
    title: "깊은 이해 기반 학습",
    desc: "겉핥기식 진도보다 깊게 이해하고 넘어가는 방식이 훨씬 잘 맞습니다. 한 번 이해한 내용은 오래가고, 응용력이 탁월합니다.",
    tip: "요약 정리를 남에게 설명하듯 작성하는 '파인만 기법'이 효과적입니다. 이해 못 한 부분을 그냥 넘기지 말고 원리부터 다시 잡으세요.",
  },
  편인: {
    title: "직관 + 통찰 활용",
    desc: "단계별 암기보다 전체 구조를 한 번에 파악하는 방식이 잘 맞습니다. 다양한 관점에서 접근하면서 자신만의 이해 경로를 찾는 능력이 있습니다.",
    tip: "여러 교재나 강의를 비교하며 다양한 설명 방식을 접하세요. 자신만의 언어로 재구성하는 것이 가장 깊은 이해로 이어집니다.",
  },
};

// 신강/신약 기반 합격 전략
function getStrengthExamAdvice(strengthLevel: string): { label: string; advice: string } {
  const isStrong = ["신강", "태강", "극왕", "중화신강"].includes(strengthLevel);
  if (isStrong) {
    return {
      label: "에너지 분산 주의형",
      advice: "타고난 기운이 강해 어떤 환경에서도 버티는 체력이 있습니다. 그러나 강한 기운은 자신감 과잉으로 이어지기 쉽고, 방심이 가장 큰 적입니다. 시험 직전까지 긴장의 끈을 유지하는 습관을 의식적으로 만드세요. 체력이 있는 만큼 장시간 학습이 가능하지만, 집중도 없이 시간만 채우는 '양적 함정'에 빠지지 않도록 1시간 단위로 성취 목표를 설정하는 것이 좋습니다.",
    };
  }
  return {
    label: "에너지 관리 집중형",
    advice: "타고난 기운이 상대적으로 약한 편이라, 무리한 장시간 학습보다 짧은 시간 고품질 집중이 더 효과적입니다. 수면과 식사 루틴을 반드시 지키세요 — 몸 상태가 무너지면 학습 효율이 일반인보다 훨씬 빠르게 떨어집니다. 대신 이해력과 감각이 예민해 같은 시간을 공부해도 흡수하는 질이 남다를 수 있습니다. 복습 주기를 짧게 가져가고, 기억이 신선할 때 여러 번 훑는 방식이 장기 기억으로 이어집니다.",
  };
}

// 신살 중 학습 관련 길살/흉살
function getStudySinsalInsight(sinsalNames: string[]): { good: string[]; bad: string[] } {
  const good: string[] = [];
  const bad: string[] = [];
  if (sinsalNames.includes("학당귀인")) good.push("학당귀인이 있어요. 공부 사주 3대 길신 중 하나로, 학업에서 꾸준히 윗사람의 인정을 받고 지지를 얻는 기운이 있습니다. 시험을 준비할 때 혼자보다 선생님·멘토·선배의 도움을 받는 구조를 만드는 것이 특히 효과적입니다.");
  if (sinsalNames.includes("문창귀인")) good.push("문창귀인이 있어요. 영리하고 총명한 기운으로, 글쓰기·논술·언어 계통 시험에서 강점이 나타납니다. 읽고 쓰는 방식의 공부법이 다른 방식보다 훨씬 잘 맞습니다.");
  if (sinsalNames.includes("문곡귀인")) good.push("문곡귀인이 있어요. 학문·문서 분야에서 탁월한 재능이 있고, 특히 꼼꼼하게 논리를 쌓아가는 분야에서 두각을 드러냅니다. 법학·행정·학술 계통의 자격시험에 적성이 맞을 수 있습니다.");
  if (sinsalNames.includes("천을귀인")) good.push("천을귀인이 있어요. 어려운 상황에서도 귀인이 나타나 도움을 주는 기운입니다. 시험 준비 중 좋은 강사나 멘토를 만날 확률이 높고, 막힐 때 주변에 도움을 요청하는 것이 돌파구가 됩니다.");
  if (sinsalNames.includes("역마살")) bad.push("역마살이 있어요. 한 곳에 오래 앉아 집중하는 것이 다른 사람보다 더 힘겨울 수 있습니다. 공부 장소를 자주 바꾸거나 걸으면서 암기하는 방법을 활용하면 집중력 유지에 도움이 됩니다.");
  if (sinsalNames.includes("귀문관살")) bad.push("예민한 감각이 있어 외부 소음이나 환경 변화에 민감하게 반응할 수 있습니다. 조용하고 안정된 학습 공간을 확보하는 것이 무엇보다 중요하며, 소음 차단 이어플러그나 백색소음을 활용하는 것도 방법입니다.");
  return { good, bad };
}

export default function ExamPage() {
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
      <main className="min-h-screen bg-[#070a14] text-white flex flex-col page-fade-in">
        <BackButton />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-15%] w-[650px] h-[650px] rounded-full bg-violet-950/40 blur-[160px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-950/30 blur-[120px]" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-5 py-16 text-center">
          <FadeIn delay={0}>
            <div className="inline-block px-3 py-1 rounded-full bg-violet-900/50 border border-violet-700/40 text-violet-300 text-xs font-bold tracking-wider mb-8">
              📚 내 사주로 보는 합격 전략
            </div>
            <h1 className="text-3xl font-black mb-4 leading-tight tracking-tight">
              시험운·합격운과<br />
              <span className="text-violet-400">나만의 맞춤 공부법</span>
            </h1>
          </FadeIn>
          <FadeIn delay={100}>
            <p className="text-gray-400 text-base mb-2 leading-relaxed">
              누군가는 밤새워 공부해도 안 되고,<br />
              누군가는 짧게 집중해도 합격합니다.<br />
              <span className="text-gray-300 font-medium">그 차이, 사주에서 읽을 수 있습니다.</span>
            </p>
            <p className="text-gray-600 text-sm mb-12">
              내 오행과 기운에 맞는 공부법을 찾으세요
            </p>
          </FadeIn>
          <FadeIn delay={200} className="w-full">
            <div className="w-full space-y-3 mb-10 text-left">
              {[
                ["오행별 집중력 유형 진단", "내 타고난 기운이 어떤 방식으로 집중력을 발휘하는지 분석"],
                ["사주 구조로 보는 합격 전략", "강점 기운을 시험 준비에 연결하는 맞춤 전략"],
                ["나만의 공부 골든타임", "에너지 피크·저점 시간대와 최적 학습 리듬"],
                ["학습 길신·흉살 분석", "사주에서 공부와 합격을 돕거나 방해하는 기운"],
              ].map(([title, desc]) => (
                <div key={title} className="flex items-start gap-3 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500 mt-1.5 shrink-0" />
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
              className="w-full py-4 rounded-2xl font-black text-lg tracking-tight bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-900/50 transition-all active:scale-[0.98]">
              내 합격 전략 확인하기
            </button>
          </FadeIn>
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
          <div className="absolute top-[-20%] left-[-15%] w-[600px] h-[600px] rounded-full bg-violet-950/40 blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black mb-2">생년월일 입력</h2>
            <p className="text-gray-500 text-sm">정확한 분석을 위해 출생 정보를 입력해주세요.</p>
          </div>
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
            <BirthInputForm value={form} onChange={setForm} label="나의 정보" accent="#7c3aed" />
          </div>
          <button onClick={handleAnalyze} disabled={!ready}
            className={`w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all active:scale-[0.98] ${
              ready
                ? "bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white shadow-lg shadow-violet-900/50"
                : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
            }`}>
            합격 전략 분석하기
          </button>
        </div>
      </main>
    );
  }

  if (step === "loading") {
    return (
      <AnalysisLoading
        subject="나만의 합격 전략"
        duration={2200}
        onDone={() => setStep("result")}
        messages={[
          "오행 에너지 패턴을 분석하는 중...",
          "집중력 유형을 파악하는 중...",
          "맞춤 공부법을 찾는 중...",
          "학습 길신·흉살을 확인하는 중...",
        ]}
      />
    );
  }

  // ── 결과 ──
  const r = resultRef.current;
  if (!r) return null;

  const ilgan = r.pillarsDetail.day.cg;
  const ilganEl: Element = CHEONGAN_ELEMENT[ilgan] as Element;
  const studyType = ELEMENT_STUDY_TYPE[ilganEl];
  const strengthAdvice = getStrengthExamAdvice(r.yongshin.strength);

  // 가장 강한 십성 찾기 (천간 기준)
  const sipseongList = [
    r.pillarsDetail.year.sipseongCg,
    r.pillarsDetail.month.sipseongCg,
    r.pillarsDetail.hour?.sipseongCg,
  ].filter(Boolean) as string[];
  const sipseongCounts: Record<string, number> = {};
  sipseongList.forEach(s => { sipseongCounts[s] = (sipseongCounts[s] || 0) + 1; });
  const topSipseong = Object.entries(sipseongCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "정인";

  const examStrategy = SIPSEONG_EXAM[topSipseong] ?? SIPSEONG_EXAM["정인"];

  // 신살 분석
  const sinsalNames = r.sinsalList.map((s: { name: string }) => s.name);
  const studySinsal = getStudySinsalInsight(sinsalNames);

  // 천을귀인 여부
  const hasCheonul = (CHEONUL_JJ[ilgan] || []).some(jj =>
    [r.pillarsDetail.year.jj, r.pillarsDetail.month.jj, r.pillarsDetail.hour?.jj].includes(jj)
  );

  // 오행 요약 뱃지
  const elColors: Record<Element, string> = { 목: "#22c55e", 화: "#ef4444", 토: "#eab308", 금: "#a3a3a3", 수: "#3b82f6" };
  const elBadge = elColors[ilganEl] ?? "#a78bfa";

  return (
    <main className="min-h-screen bg-[#070a14] text-white pb-32">
      <BackButton />
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-15%] w-[650px] h-[650px] rounded-full bg-violet-950/30 blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-950/20 blur-[120px]" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6">

        {/* 헤더 */}
        <FadeIn delay={0} className="text-center mb-8">
          <div className="inline-block px-3 py-1 rounded-full bg-violet-900/50 border border-violet-700/40 text-violet-300 text-xs font-bold tracking-wider mb-4">
            📚 시험운·합격운 분석
          </div>
          <h1 className="text-2xl font-black mb-2 leading-tight">
            {ilgan}일간의<br />
            <span className="text-violet-400">나만의 합격 전략</span>
          </h1>
          <p className="text-gray-500 text-sm">오행과 기운 구조로 분석한 맞춤 공부법</p>
        </FadeIn>

        {/* 오행 집중력 유형 */}
        <FadeIn delay={80} className="mb-5">
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full" style={{ background: elBadge }} />
              <p className="text-xs font-bold text-gray-400 tracking-wider uppercase">집중력 유형</p>
            </div>
            <p className="text-lg font-black text-white mb-3" style={{ color: elBadge }}>{studyType.label}</p>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">{studyType.strength}</p>
            <p className="text-sm text-gray-400 leading-relaxed mb-3">{studyType.weakness}</p>
            <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-xs font-bold text-violet-400 mb-1.5">추천 학습법</p>
              <p className="text-sm text-gray-300 leading-relaxed">{studyType.method}</p>
            </div>
          </div>
        </FadeIn>

        {/* 골든타임 */}
        <FadeIn delay={160} className="mb-5">
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <p className="text-xs font-bold text-gray-400 tracking-wider uppercase">공부 골든타임</p>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">{studyType.timing}</p>
          </div>
        </FadeIn>

        {/* 사주 구조 기반 시험 전략 */}
        <FadeIn delay={240} className="mb-5">
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <p className="text-xs font-bold text-gray-400 tracking-wider uppercase">사주 구조별 합격 전략</p>
            </div>
            <p className="text-base font-bold text-blue-300 mb-2">{examStrategy.title}</p>
            <p className="text-sm text-gray-300 leading-relaxed mb-3">{examStrategy.desc}</p>
            <div className="bg-white/[0.04] rounded-xl p-4 border border-white/[0.06]">
              <p className="text-xs font-bold text-blue-400 mb-1.5">실전 팁</p>
              <p className="text-sm text-gray-300 leading-relaxed">{examStrategy.tip}</p>
            </div>
          </div>
        </FadeIn>

        {/* 에너지 강약 관리 */}
        <FadeIn delay={320} className="mb-5">
          <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <p className="text-xs font-bold text-gray-400 tracking-wider uppercase">에너지 관리 전략</p>
            </div>
            <p className="text-base font-bold text-emerald-300 mb-2">{strengthAdvice.label}</p>
            <p className="text-sm text-gray-300 leading-relaxed">{strengthAdvice.advice}</p>
          </div>
        </FadeIn>

        {/* 학습 길신·흉살 */}
        {(studySinsal.good.length > 0 || studySinsal.bad.length > 0) && (
          <FadeIn delay={400} className="mb-5">
            <div className="rounded-2xl bg-white/[0.04] border border-white/10 p-5">
              <div className="flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <p className="text-xs font-bold text-gray-400 tracking-wider uppercase">학습 길신·주의 기운</p>
              </div>
              {studySinsal.good.map((g, i) => (
                <div key={i} className="flex items-start gap-3 mb-3">
                  <span className="text-yellow-400 text-lg shrink-0">✦</span>
                  <p className="text-sm text-gray-300 leading-relaxed">{g}</p>
                </div>
              ))}
              {studySinsal.bad.map((b, i) => (
                <div key={i} className="flex items-start gap-3 mb-3">
                  <span className="text-orange-400 text-lg shrink-0">⚠</span>
                  <p className="text-sm text-gray-400 leading-relaxed">{b}</p>
                </div>
              ))}
              {hasCheonul && (
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-yellow-400 text-lg shrink-0">✦</span>
                  <p className="text-sm text-gray-300 leading-relaxed">천을귀인이 있어요. 막막하고 어려울 때 귀인이 나타나는 기운입니다. 독학보다는 좋은 스승이나 멘토와 함께할 때 실력이 극적으로 상승하는 구조를 가지고 있습니다.</p>
                </div>
              )}
            </div>
          </FadeIn>
        )}

        {/* 합격 마인드셋 총정리 */}
        <FadeIn delay={480} className="mb-5">
          <div className="rounded-2xl bg-gradient-to-br from-violet-900/30 to-blue-900/20 border border-violet-700/30 p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-violet-400" />
              <p className="text-xs font-bold text-violet-300 tracking-wider uppercase">합격 마인드셋</p>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed">
              사주는 타고난 기운의 지도입니다. 어떤 공부법이 세상에서 좋다고 해도, 내 기운에 맞지 않으면 반쪽짜리 효율입니다.
              남들이 새벽 4시에 일어나서 공부한다고 따라 할 필요 없습니다 — 내 피크 시간이 따로 있으니까요.
              지금까지 '열심히 해도 안 된다'는 감각이 있었다면, 방법이 틀린 게 아니라 내 기운에 맞는 방식을 아직 찾지 못한 것일 수 있습니다.
              <span className="text-violet-300 font-medium"> 오행이 알려주는 나만의 리듬으로, 다음 시험은 달라질 수 있습니다.</span>
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={560} className="mt-8">
          <ResultFooterActions targetId="exam-result" fileName="시험운합격운" />
        </FadeIn>
      </div>
    </main>
  );
}

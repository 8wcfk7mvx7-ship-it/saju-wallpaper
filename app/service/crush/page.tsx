"use client";
import { useState, useEffect } from "react";
import SipseongInsight from "@/components/SipseongInsight";

function ShareButton({ title = "내 사주 분석 결과", text = "Summer Palace에서 내 사주를 분석했어요" }: { title?: string; text?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      className="w-full py-3.5 rounded-2xl font-bold text-sm border transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}
    >
      {copied ? "✓ 링크 복사됨" : "↗ 결과 공유하기"}
    </button>
  );
}
import { useRouter } from "next/navigation";
import AdBanner from "@/components/AdBanner";
import BackButton from "@/components/BackButton";
import {
  analyzeSaju, ILGAN_PERSONALITY, getDisplaySinsalList, type SajuResult,
  getJipchaknamNarrative, getHwabuJokNarrative, getMuinseongNarrative, getYangpaltongNarrative,
  getHwasuMultiHongyeomNarrative, getBigeopMultiNarrative, getPporonamNarrative, getJaengjaenamNarrative,
  getJaeseongHonjapNarrative, getGwandanyeoNarrative, getSanggwanGyeongwanNarrative,
  getGwanseongGoripNarrative, getGwanbiAmhapNarrative, getDohwaPositionNarrative,
  getGwanseongSiksangYeonaeNarrative,
} from "@/lib/saju";
import HapchungDiagram from "@/components/HapchungDiagram";

// 일간별 짝사랑 성공 비결
const CRUSH_SUCCESS: Record<string, {
  hook: string;        // 첫 마음을 여는 핵심
  timing: string;      // 타이밍 전략
  doThis: string[];    // 반드시 해야 할 것 3가지
  neverDo: string;     // 절대 금물
  phrase: string;      // 심장 흔드는 한 마디
}> = {
  갑: {
    hook: "실력·성과를 인정받고 싶어하는 사람입니다. 갑목 일간에게는 '당신이 대단하다'는 말보다 '당신 덕분에 나도 자랐다'는 표현이 훨씬 더 깊이 박힙니다.",
    timing: "갑목은 새 프로젝트 시작 직후, 성과가 나올 때 에너지가 폭발합니다. 이 사람이 뭔가를 달성하거나 새로운 목표를 세운 직후 옆에 있으세요.",
    doThis: ["함께 뭔가를 '도전'하거나 '성취'하는 경험을 만드세요", "리더로 빛날 수 있는 상황을 만들어 주세요", "존경을 표현하되, 의존하지 마세요 — 동등한 파트너 이미지"],
    neverDo: "갑목에게 약점을 드러내거나 끌려다니는 모습을 보이면 매력이 급감합니다. 주도권 싸움도 절대 금물.",
    phrase: "\"당신 옆에 있으면 나도 뭔가 해낼 수 있을 것 같아요.\"",
  },
  을: {
    hook: "을목은 겉으론 유연하지만 속은 예민합니다. '나만 알아줬으면 하는 감성'이 있어요. 군중 속에서 이 사람만 보고 있다는 섬세한 신호를 꾸준히 보내세요.",
    timing: "을목은 분위기와 날씨에 감정이 흔들립니다. 봄비 내리는 날, 카페 창가, 조용한 전시회 — 분위기가 자연스럽게 무드를 만들어주는 순간을 노리세요.",
    doThis: ["상대가 한 말을 기억했다가 나중에 꺼내세요 — 이 사람은 '기억력'에 감동 받습니다", "예쁜 것, 맛있는 것, 감각적인 것을 함께 즐기는 루틴을 만드세요", "불안할 때 옆에 있어주되 절대 강요하지 마세요"],
    neverDo: "을목에게 갑자기 '우리 어떻게 생각해요?'라며 답을 요구하면 도망갑니다. 천천히, 자연스럽게.",
    phrase: "\"당신이 말한 거 아직도 기억해요. 그때 너무 예뻤어요.\"",
  },
  병: {
    hook: "병화는 태양입니다. 주목받고 싶고, 자신의 열정을 알아줬으면 합니다. 이 사람의 빛을 가리지 말고 오히려 더 빛나게 만들어 주세요.",
    timing: "병화는 에너지가 높은 낮 시간대, 활기찬 장소에서 감정이 열립니다. 조용한 밤보다 활기 있는 낮이나 저녁 초반에 승부하세요.",
    doThis: ["공개적으로 칭찬하세요 — 다른 사람들 앞에서 이 사람을 추켜세우면 효과 2배", "같이 신나는 걸 하세요 — 스포츠, 콘서트, 여행", "밝고 긍정적인 자신을 보여주세요 — 어둡거나 힘든 이야기는 나중에"],
    neverDo: "병화에게 소극적이거나 말수가 적으면 매력이 사라집니다. 에너지로 맞서야 합니다.",
    phrase: "\"당신이 있는 자리는 항상 밝아지는 것 같아요.\"",
  },
  정: {
    hook: "정화는 촛불입니다. 특정 사람에게 깊이 집중하는 스타일. 이 사람에게 '나는 당신만 보고 있다'는 신호가 쌓이면 마음이 열립니다.",
    timing: "정화는 저녁 이후, 조용하고 아늑한 공간에서 감정이 열립니다. 둘만 있는 공간, 따뜻한 분위기가 핵심입니다.",
    doThis: ["깊은 대화를 유도하세요 — 취향, 꿈, 가치관을 물어보세요", "감성적인 선물이나 메시지로 '나는 당신을 특별히 생각한다'를 표현하세요", "이 사람의 관심사를 미리 공부해서 대화에 활용하세요"],
    neverDo: "정화에게 관심을 뜨겁게 줬다가 갑자기 식으면 신뢰를 잃습니다. 꾸준함이 생명.",
    phrase: "\"당신 이야기를 하다 보면 시간 가는 줄 모르겠어요.\"",
  },
  무: {
    hook: "무토는 산입니다. 넓고 포용력 있지만 신뢰를 쌓는 데 시간이 걸립니다. 처음부터 감정을 들이밀지 말고, 믿을 수 있는 사람이라는 인상을 먼저 쌓으세요.",
    timing: "무토는 급변하는 상황보다 일상에서 꾸준히 쌓인 신뢰를 통해 마음이 열립니다. 비일상적인 이벤트보다 반복되는 일상 속 접점을 늘리세요.",
    doThis: ["약속은 반드시 지키세요 — 작은 약속 하나라도 어기면 신뢰가 무너집니다", "든든하고 책임감 있는 모습을 보여주세요", "이 사람이 힘들 때 묵묵히 옆에 있어주세요 — 말보다 행동"],
    neverDo: "무토에게 성급하게 관계를 정의하거나 결론을 요구하지 마세요. 기다리는 것 자체가 전략입니다.",
    phrase: "\"어떤 상황이어도 당신 편이에요. 그건 변하지 않아요.\"",
  },
  기: {
    hook: "기토는 밭입니다. 세심하고 현실적인 것에 감동받습니다. 거창한 로맨스보다 일상의 작은 배려와 실용적인 관심이 이 사람의 마음을 녹입니다.",
    timing: "기토는 일상의 반복 속에서 감정이 쌓입니다. 특별한 날보다 평범한 날에 반복적으로 챙기는 것이 훨씬 효과적입니다.",
    doThis: ["밥 먹었어요? 오늘 날씨 쌀쌀하던데 — 사소한 일상 챙기기가 최강 무기", "이 사람이 힘들다고 하면 바로 실질적인 도움을 주세요", "깔끔하고 신뢰감 있는 외모와 행동을 유지하세요"],
    neverDo: "기토에게 감정 기복을 보이거나 불안정한 모습을 자주 드러내면 거리를 두기 시작합니다.",
    phrase: "\"오늘 뭐 먹었어요? 요즘 좀 힘들어 보이던데 잘 챙겨 드세요.\"",
  },
  경: {
    hook: "경금은 칼입니다. 솔직하고 직설적인 것을 좋아합니다. 돌려 말하거나 뜸 들이는 것을 싫어해요. 당신의 진심을 명확하게 전달하는 것이 오히려 매력 포인트가 됩니다.",
    timing: "경금은 활동적이고 승부하는 상황에서 매력을 느낍니다. 같이 운동하거나 경쟁적인 게임, 도전적인 활동에서 함께하면 빠르게 가까워집니다.",
    doThis: ["당당하고 자신감 있는 모습을 보여주세요 — 경금은 강한 사람에게 매력을 느낍니다", "직접적으로 만남을 요청하세요 — 간접적인 힌트는 효과가 없습니다", "체력과 건강에 신경 쓰는 모습을 보여주세요"],
    neverDo: "경금에게 우유부단하거나 결정을 못 내리는 모습은 매력을 잃게 합니다. 확실하게 행동하세요.",
    phrase: "\"솔직히 말할게요. 당신이 자꾸 마음에 걸려요.\"",
  },
  신: {
    hook: "신금은 보석입니다. 아름다운 것, 세련된 것에 민감하게 반응합니다. 외적인 완성도와 품격이 첫 번째 관문입니다. 그다음은 내면의 깊이.",
    timing: "신금은 완벽한 세팅에서 감정이 열립니다. 분위기 좋은 레스토랑, 잘 차려입은 모습, 준비된 만남 — 임프로비제이션보다 계획된 것이 훨씬 좋습니다.",
    doThis: ["자신의 외모와 스타일에 공들이세요 — 첫인상이 전부일 수 있습니다", "이 사람의 미적 감각을 존중하고 공유하세요", "섬세하고 완성도 높은 선물이나 경험을 선사하세요"],
    neverDo: "신금에게 준비 안 된 모습, 대충대충, 지저분한 것은 절대 금물입니다.",
    phrase: "\"당신 취향이 너무 좋아요. 어떻게 이런 걸 발견했어요?\"",
  },
  임: {
    hook: "임수는 바다입니다. 자유를 사랑하고 틀에 박힌 것을 싫어합니다. 평범한 데이트보다 의외성과 새로움이 이 사람의 심장을 움직입니다.",
    timing: "임수는 새로운 자극이 있을 때 감정이 활성화됩니다. 가보지 않은 곳, 해보지 않은 것, 예상치 못한 순간에 승부하세요.",
    doThis: ["예상을 깨는 만남을 만들어 보세요 — '이런 것도 해봤어요?' 방식", "지적 대화를 나눌 수 있는 자신의 깊이를 보여주세요", "자유를 존중해 주세요 — 구속하거나 집착하면 즉시 멀어집니다"],
    neverDo: "임수에게 루틴하고 예측 가능한 패턴은 지루함의 신호입니다. 늘 새로워야 합니다.",
    phrase: "\"이런 거 해본 적 있어요? 같이 가봐요.\"",
  },
  계: {
    hook: "계수는 이슬입니다. 섬세하고 감수성이 풍부해요. 직접적인 접근보다 서서히 스며드는 방식이 효과적입니다. 감성적 교감을 쌓아가는 것이 핵심.",
    timing: "계수는 감성이 고조되는 저녁, 비 오는 날, 음악이 있는 공간에서 마음이 열립니다. 감각을 자극하는 환경을 만드세요.",
    doThis: ["이 사람의 감수성을 인정하고 공감해 주세요 — '나도 그 느낌 알아요'가 최고의 연결", "음악·영화·글 등 감성적인 것을 함께 나누세요", "조급하지 않게, 천천히 감정의 파도에 올라타세요"],
    neverDo: "계수에게 감정을 분석하거나 논리적으로 설득하려 하면 오히려 차가워집니다.",
    phrase: "\"이 음악 들으면 왜 당신 생각이 나는지 모르겠어요.\"",
  },
};
import BirthTimePicker, { type BirthTimeValue } from "@/components/BirthTimePicker";
import ProfileSaveModal from "@/components/ProfileSaveModal";
import BirthInputForm, { BirthFormData, defaultBirthData } from "@/components/BirthInputForm";
import ShareImageButton from "@/components/ShareImageButton";
export const dynamic = "force-dynamic";

type Step = "splash" | "input" | "loading" | "result";

interface CrushResult {
  idealType: string;
  approach: string;
  psychology: string;
  warning: string;
  moneyStyle: string;
  compatibility: string;
  score: number;
  grade: string;
}

async function analyzeCrush(targetData: {
  birthYear: number; birthMonth: number; birthDay: number;
  birthTime: BirthTimeValue; calType: "solar" | "lunar"; isLeapMonth: boolean;
  gender: "male" | "female"; birthPlace: string;
}, myData?: {
  birthYear: number; birthMonth: number; birthDay: number;
  birthHour: number | null; birthMinute: number | null;
  gender: "male" | "female"; birthPlace: string;
  calType: "solar" | "lunar"; useJajasi: boolean;
}): Promise<CrushResult> {
  const r = analyzeSaju({
    birthYear: targetData.birthYear,
    birthMonth: targetData.birthMonth,
    birthDay: targetData.birthDay,
    birthHour: targetData.birthTime.unknown ? null : targetData.birthTime.hour,
    birthMinute: targetData.birthTime.unknown ? null : targetData.birthTime.minute,
    name: "상대방", gender: targetData.gender, birthPlace: targetData.birthPlace || "서울",
    style: "auto", productType: "report",
    useJajasi: targetData.birthTime.useJajasi,
  });

  const res = await fetch("/api/crush/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sajuResult: r, gender: targetData.gender, myBirth: myData }),
  });
  if (!res.ok) throw new Error("분석 실패");
  const data = await res.json();
  return data.result;
}

export default function CrushPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("splash");
  const [showBtn, setShowBtn] = useState(false);

  // 상대방 정보
  const [targetForm, setTargetForm] = useState<BirthFormData>(defaultBirthData("male"));

  // 내 정보 (선택)
  const [myForm, setMyForm] = useState<BirthFormData>(defaultBirthData("female"));

  const [formError, setFormError] = useState("");
  const [result, setResult] = useState<CrushResult | null>(null);
  const [targetSaju, setTargetSaju] = useState<SajuResult | null>(null);
  const [mySaju, setMySaju] = useState<SajuResult | null>(null);

  useEffect(() => { const t = setTimeout(() => setShowBtn(true), 2000); return () => clearTimeout(t); }, []);

  async function handleAnalyze() {
    const targetYear = typeof targetForm.birthYear === "number" ? targetForm.birthYear : 0;
    const targetMonth = typeof targetForm.birthMonth === "number" ? targetForm.birthMonth : 0;
    const targetDay = typeof targetForm.birthDay === "number" ? targetForm.birthDay : 0;
    if (!targetYear || !targetMonth || !targetDay) {
      setFormError("상대방의 생년월일을 모두 입력해주세요."); return;
    }
    setFormError("");
    setStep("loading");

    let fy = targetYear, fm = targetMonth, fd = targetDay;
    if (targetForm.calendarType === "lunar") {
      try {
        // @ts-ignore
        const KLC = (await import("korean-lunar-calendar")).default;
        const cal = new KLC();
        cal.setLunarDate(fy, fm, fd, targetForm.isLeapMonth);
        const sol = cal.getSolarCalendar();
        if (sol?.year) { fy = sol.year; fm = sol.month; fd = sol.day; }
      } catch {}
    }

    const targetBirthPlace = targetForm.city || "서울";
    const targetBirthTime: BirthTimeValue = {
      hour: targetForm.birthHour,
      minute: targetForm.birthMinute,
      unknown: targetForm.birthHour === null,
      useJajasi: targetForm.useJajasi,
    };

    try {
      const sajuR = analyzeSaju({
        birthYear: fy, birthMonth: fm, birthDay: fd,
        birthHour: targetForm.birthHour, birthMinute: targetForm.birthMinute ?? 0,
        name: "상대방", gender: targetForm.gender, birthPlace: targetBirthPlace,
        style: "auto", productType: "report", useJajasi: targetForm.useJajasi,
      });
      setTargetSaju(sajuR);

      let myData: {
        birthYear: number; birthMonth: number; birthDay: number;
        birthHour: number | null; birthMinute: number | null;
        gender: "male" | "female"; birthPlace: string;
        calType: "solar" | "lunar"; useJajasi: boolean;
      } | undefined;

      if (myForm.birthYear && myForm.birthMonth && myForm.birthDay) {
        let my = myForm.birthYear as number, mm = myForm.birthMonth as number, md = myForm.birthDay as number;
        if (myForm.calendarType === "lunar") {
          try {
            // @ts-ignore
            const KLC = (await import("korean-lunar-calendar")).default;
            const cal = new KLC();
            cal.setLunarDate(my, mm, md, myForm.isLeapMonth);
            const sol = cal.getSolarCalendar();
            if (sol?.year) { my = sol.year; mm = sol.month; md = sol.day; }
          } catch {}
        }
        myData = {
          birthYear: my, birthMonth: mm, birthDay: md,
          birthHour: myForm.birthHour, birthMinute: myForm.birthMinute,
          gender: myForm.gender, birthPlace: myForm.city || "서울",
          calType: myForm.calendarType, useJajasi: myForm.useJajasi,
        };
        const mySajuR = analyzeSaju({
          birthYear: my, birthMonth: mm, birthDay: md,
          birthHour: myForm.birthHour, birthMinute: myForm.birthMinute ?? 0,
          name: "나", gender: myForm.gender, birthPlace: myForm.city || "서울",
          style: "auto", productType: "report", useJajasi: myForm.useJajasi,
        });
        setMySaju(mySajuR);
      } else {
        setMySaju(null);
      }

      const res = await analyzeCrush(
        { birthYear: fy, birthMonth: fm, birthDay: fd, birthTime: targetBirthTime, calType: targetForm.calendarType, isLeapMonth: targetForm.isLeapMonth, gender: targetForm.gender, birthPlace: targetBirthPlace },
        myData,
      );

      const jipchaknamNarrative = getJipchaknamNarrative(sajuR, targetForm.gender);
      const psychologyExtra = [
        jipchaknamNarrative,
        getYangpaltongNarrative(sajuR, targetForm.gender),
        getMuinseongNarrative(sajuR),
        getDohwaPositionNarrative(sajuR),
        getSanggwanGyeongwanNarrative(sajuR, targetForm.gender),
        getGwanseongGoripNarrative(sajuR, targetForm.gender),
        getGwanbiAmhapNarrative(sajuR, targetForm.gender),
        getGwanseongSiksangYeonaeNarrative(sajuR, targetForm.gender),
        getHwasuMultiHongyeomNarrative(sajuR),
        !jipchaknamNarrative ? getHwabuJokNarrative(sajuR) : null,
      ].filter((s): s is string => !!s).join(" ");
      const moneyStyleExtra = [
        getJaengjaenamNarrative(sajuR, targetForm.gender),
        getJaeseongHonjapNarrative(sajuR, targetForm.gender),
        getGwandanyeoNarrative(sajuR, targetForm.gender),
        getBigeopMultiNarrative(sajuR, targetForm.gender),
        getPporonamNarrative(sajuR, targetForm.gender),
      ].filter((s): s is string => !!s).join(" ");

      setResult({
        ...res,
        psychology: psychologyExtra ? `${res.psychology} ${psychologyExtra}` : res.psychology,
        moneyStyle: moneyStyleExtra ? `${res.moneyStyle} ${moneyStyleExtra}` : res.moneyStyle,
      });
      setStep("result");
    } catch {
      setFormError("분석 중 오류가 발생했습니다. 다시 시도해주세요.");
      setStep("input");
    }
  }

  // ── SPLASH ───────────────────────────────────────────────────────────────────
  if (step === "splash") return (
    <main className="min-h-screen bg-[#06060e] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden page-fade-in">
      <BackButton />
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[150px]" style={{ background: "rgba(244,63,94,0.08)" }} />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[130px]" style={{ background: "rgba(251,113,133,0.06)" }} />
      </div>

      <button onClick={() => router.push("/")} className="fixed top-5 left-5 z-20 text-xs text-gray-700 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 홈</button>

      <div className="relative z-10 max-w-2xl w-full text-center">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-4" style={{ background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.3)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: "#fb7185" }}>짝사랑 사주 공략법</span>
          </div>
          <div className="text-6xl mb-4 drop-shadow-[0_0_40px_rgba(244,63,94,0.4)]">💘</div>
        </div>

        <div className="space-y-4 mb-12">
          {[
            { text: "그 사람, 어떤 사람인가요?", big: false, delay: 0 },
            { text: "사주가 다 알고 있습니다.", big: true, delay: 500 },
            { text: "이상형·심리·공략 포인트", big: false, delay: 1000 },
            { text: "사주로 완전 분석합니다.", big: true, delay: 1500 },
          ].map((line, i) => (
            <div key={i} style={{ opacity: 1, transition: `opacity 0.8s ease ${line.delay}ms` }}>
              <p className={`leading-snug ${line.big
                ? "text-3xl font-black"
                : "text-xl font-medium"}`}
                style={line.big ? {
                  background: "linear-gradient(135deg, #fb7185, #f43f5e)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent"
                } : { color: "rgba(255,255,255,0.5)" }}>
                {line.text}
              </p>
            </div>
          ))}
        </div>

        <div className="mb-6 mx-auto max-w-xs text-left rounded-2xl p-4 space-y-2"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
          {[
            "💡 이 사람의 이상형 유형",
            "💡 어떻게 접근해야 마음이 열릴까",
            "💡 연애에 얼마나 진지하게 임하는 사람인지",
            "💡 연애할 때 조심해야 할 포인트",
            "💡 나와의 궁합 점수 (내 생일 입력 시)",
          ].map((t, i) => (
            <p key={i} className="text-sm" style={{ color: "rgba(255,255,255,0.55)" }}>{t}</p>
          ))}
        </div>

        <div style={{ opacity: showBtn ? 1 : 0, transform: showBtn ? "none" : "translateY(16px)", transition: "opacity 0.7s, transform 0.7s" }}>
          <button onClick={() => setStep("input")}
            className="w-full max-w-xs mx-auto block font-bold py-5 px-10 rounded-2xl text-lg shadow-2xl transition-all active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #f43f5e 0%, #fb7185 100%)", color: "#fff", boxShadow: "0 8px 32px -4px rgba(244,63,94,0.45)" }}>
            그 사람 사주 분석하기 →
          </button>
          <p className="text-xs mt-3" style={{ color: "rgba(255,255,255,0.25)" }}>무료 · 생년월일만 있으면 됩니다</p>
        </div>
      </div>
    </main>
  );

  // ── INPUT ─────────────────────────────────────────────────────────────────────
  if (step === "input") return (
    <main className="min-h-screen bg-[#06060e] text-white pb-20">
      <BackButton />
      <div className="max-w-2xl mx-auto px-5 pt-8">

        <div className="mb-8">
          <h2 className="text-2xl font-black text-white mb-1">그 사람 정보 입력</h2>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>생년월일시만 알면 됩니다</p>
        </div>

        <div className="space-y-5">
          {/* 상대방 정보 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>
                그 사람 정보 <span style={{ color: "#f43f5e" }}>*</span>
              </label>
              <ProfileSaveModal
                onSelect={(prof) => {
                  setTargetForm({
                    name: prof.name || "",
                    gender: prof.gender,
                    birthYear: parseInt(prof.birthYear) || "",
                    birthMonth: parseInt(prof.birthMonth) || "",
                    birthDay: parseInt(prof.birthDay) || "",
                    birthHour: prof.birthHour ? parseInt(prof.birthHour) : null,
                    birthMinute: prof.birthMinute ? parseInt(prof.birthMinute) : null,
                    city: prof.birthPlace || "서울",
                    calendarType: prof.calType || "solar",
                    isLeapMonth: prof.isLeapMonth || false,
                    useJajasi: prof.useJajasi || false,
                  });
                }}
                currentData={{
                  gender: targetForm.gender,
                  birthYear: String(targetForm.birthYear || ""),
                  birthMonth: String(targetForm.birthMonth || ""),
                  birthDay: String(targetForm.birthDay || ""),
                  birthHour: targetForm.birthHour != null ? String(targetForm.birthHour) : "",
                  birthMinute: targetForm.birthMinute != null ? String(targetForm.birthMinute) : "",
                  birthPlace: targetForm.city || "서울",
                  calType: targetForm.calendarType,
                  isLeapMonth: targetForm.isLeapMonth,
                  useJajasi: targetForm.useJajasi,
                }}
              />
            </div>
            <BirthInputForm value={targetForm} onChange={setTargetForm} accent="#f59e0b" />
          </div>

          {/* 구분선 */}
          <div className="flex items-center gap-3 py-2">
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>내 정보 (선택 — 궁합 점수 계산)</span>
            <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
          </div>

          {/* 내 생년월일 (선택) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>
              내 정보 <span className="text-[10px] font-normal normal-case" style={{ color: "rgba(255,255,255,0.25)" }}>(입력 시 궁합 점수 제공)</span>
            </label>
            <BirthInputForm value={myForm} onChange={setMyForm} accent="#fb7185" label="내 정보" showGender={true} />
          </div>

          {formError && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2">{formError}</p>}

          <button onClick={handleAnalyze}
            className="w-full py-5 rounded-2xl font-black text-lg text-white transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #f43f5e, #fb7185)", boxShadow: "0 8px 32px rgba(244,63,94,0.4)" }}>
            그 사람 사주 분석하기 →
          </button>
        </div>
      </div>
    </main>
  );

  // ── LOADING ───────────────────────────────────────────────────────────────────
  if (step === "loading") return (
    <main className="min-h-screen bg-[#06060e] text-white flex flex-col items-center justify-center gap-6 px-6">
      <BackButton />
      <div className="text-5xl animate-pulse">💘</div>
      <div className="text-center">
        <p className="text-lg font-bold text-white mb-2">그 사람 사주 분석 중...</p>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>이상형·심리·공략 포인트를 파악하고 있습니다</p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className="w-2 h-2 rounded-full bg-rose-400"
            style={{ animation: `bounce 1.2s ease ${i * 0.2}s infinite`, animationName: "pulse" }} />
        ))}
      </div>
      <AdBanner className="max-w-sm" />
    </main>
  );

  // ── RESULT ────────────────────────────────────────────────────────────────────
  if (!result) return null;

  const gradeColors: Record<string, string> = {
    S: "#fbbf24", A: "#34d399", B: "#60a5fa", C: "#a78bfa", D: "#f87171",
  };
  const gradeColor = gradeColors[result.grade] || "#e8c97a";

  return (
    <main className="min-h-screen bg-[#06060e] text-white pb-24">
      <BackButton />
      <div className="max-w-2xl mx-auto px-4 pt-8" id="crush-result">

        {/* 헤더 */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">💘</div>
          <h1 className="text-2xl font-black text-white mb-1">그 사람 사주 완전 분석</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            {targetForm.gender === "male" ? "남성" : "여성"} · {targetForm.birthYear}년 {targetForm.birthMonth}월 {targetForm.birthDay}일생
          </p>
        </div>

        {/* 나와의 합충(合沖) 분석 — 원국 다이어그램 */}
        {targetSaju && mySaju && (
          <HapchungDiagram mySaju={mySaju} targetSaju={targetSaju} />
        )}

        {/* 궁합 점수 (내 생일 입력했을 때만) */}
        {myForm.birthYear !== "" && (
          <div className="mb-6 rounded-2xl p-5 text-center"
            style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)" }}>
            <p className="text-xs font-semibold mb-2" style={{ color: "rgba(255,255,255,0.4)" }}>나와의 궁합 점수</p>
            <div className="flex items-baseline justify-center gap-3 mb-2">
              <span className="text-5xl font-black" style={{ color: gradeColor }}>{result.grade}</span>
              <span className="text-3xl font-black text-white">{result.score}점</span>
            </div>
            <div className="w-full h-2 rounded-full mb-2" style={{ background: "rgba(255,255,255,0.07)" }}>
              <div className="h-2 rounded-full transition-all" style={{ width: `${result.score}%`, background: `linear-gradient(90deg, ${gradeColor}, ${gradeColor}88)` }} />
            </div>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>{result.compatibility}</p>
          </div>
        )}

        {/* 분석 카드들 */}
        {[
          { icon: "💭", title: "이 사람의 이상형", content: result.idealType, accent: "#f43f5e" },
          { icon: "🎯", title: "공략 포인트 · 이렇게 접근하세요", content: result.approach, accent: "#fb7185" },
          { icon: "🧠", title: "심리 패턴 · 연애할 때 이런 사람", content: result.psychology, accent: "#a78bfa" },
          { icon: "💰", title: "돈·재물 스타일", content: result.moneyStyle, accent: "#fbbf24" },
          { icon: "⚠️", title: "주의할 점 · 이건 피하세요", content: result.warning, accent: "#f97316" },
        ].map((card, i) => (
          <div key={i} className="mb-4 rounded-2xl p-5"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">{card.icon}</span>
              <h3 className="text-sm font-black" style={{ color: card.accent }}>{card.title}</h3>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>
              {card.content}
            </p>
          </div>
        ))}

        {/* 상대방 사주 원국 */}
        {targetSaju && (() => {
          const p = targetSaju.pillarsDetail;
          const pillars = [
            { label: "연주", cg: p.year.cg, jj: p.year.jj, ssCg: p.year.sipseongCg, ssJj: p.year.sipseongJj },
            { label: "월주", cg: p.month.cg, jj: p.month.jj, ssCg: p.month.sipseongCg, ssJj: p.month.sipseongJj },
            { label: "일주", cg: p.day.cg, jj: p.day.jj, ssCg: "일간", ssJj: p.day.sipseongJj },
            ...(p.hour ? [{ label: "시주", cg: p.hour.cg, jj: p.hour.jj, ssCg: p.hour.sipseongCg, ssJj: p.hour.sipseongJj }] : []),
          ];
          return (
            <div className="mb-4 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs font-bold tracking-widest uppercase mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>그 사람의 사주 원국</p>
              <div className={`grid gap-2 ${pillars.length === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
                {pillars.map((pl, i) => (
                  <div key={i} className="rounded-xl p-3 text-center border" style={{ borderColor: pl.label === "일주" ? "rgba(244,63,94,0.4)" : "rgba(255,255,255,0.08)", background: pl.label === "일주" ? "rgba(244,63,94,0.1)" : "rgba(255,255,255,0.03)" }}>
                    <p className="text-[10px] mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>{pl.label}</p>
                    <p className="text-[10px] mb-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{pl.ssCg || "–"}</p>
                    <p className="text-lg font-black text-white">{pl.cg}</p>
                    <div className="h-px my-1" style={{ background: "rgba(255,255,255,0.1)" }} />
                    <p className="text-lg font-black text-white">{pl.jj}</p>
                    <p className="text-[10px] mt-0.5" style={{ color: pl.label === "일주" ? "#fb7185" : "rgba(255,255,255,0.35)" }}>{pl.ssJj || "–"}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs mt-3 text-center" style={{ color: "rgba(255,255,255,0.25)" }}>{targetSaju.fourPillars}</p>
            </div>
          );
        })()}

        {/* 일간 성격 — 그 사람 */}
        {targetSaju && (() => {
          const ilgan = targetSaju.pillarsDetail.day.cg;
          const info = ILGAN_PERSONALITY[ilgan];
          if (!info) return null;
          return (
            <div className="mb-4 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🔮</span>
                <h3 className="text-sm font-black" style={{ color: "#f43f5e" }}>그 사람의 일간 — {info.short}</h3>
              </div>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {info.keyword.split("·").map(k => (
                  <span key={k} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(244,63,94,0.12)", color: "#fb7185", border: "1px solid rgba(244,63,94,0.25)" }}>{k}</span>
                ))}
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>{info.detail}</p>
            </div>
          );
        })()}

        {/* 짝사랑 성공 비결 */}
        {targetSaju && (() => {
          const ilgan = targetSaju.pillarsDetail.day.cg;
          const tip = CRUSH_SUCCESS[ilgan];
          if (!tip) return null;
          return (
            <div className="mb-4 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(244,63,94,0.35)", background: "rgba(244,63,94,0.06)" }}>
              <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: "rgba(244,63,94,0.2)" }}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  <h3 className="text-sm font-black" style={{ color: "#fb7185" }}>짝사랑 성공 비결 — {ilgan}일간 맞춤 전략</h3>
                </div>
              </div>
              <div className="p-5 space-y-4">
                {/* 핵심 훅 */}
                <div className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#fb7185" }}>🎯 마음을 여는 핵심</p>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{tip.hook}</p>
                </div>
                {/* 타이밍 */}
                <div className="rounded-xl p-4" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.2)" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#fbbf24" }}>⏰ 타이밍 전략</p>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>{tip.timing}</p>
                </div>
                {/* 반드시 할 것 */}
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#34d399" }}>✅ 반드시 해야 할 것</p>
                  <div className="space-y-2">
                    {tip.doThis.map((d, i) => (
                      <div key={i} className="flex items-start gap-2 rounded-xl px-3 py-2.5" style={{ background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)" }}>
                        <span className="text-xs font-black mt-0.5 shrink-0" style={{ color: "#34d399" }}>0{i + 1}</span>
                        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>{d}</p>
                      </div>
                    ))}
                  </div>
                </div>
                {/* 절대 금물 */}
                <div className="rounded-xl p-4" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#f87171" }}>🚫 절대 금물</p>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.7)" }}>{tip.neverDo}</p>
                </div>
                {/* 심장 흔드는 한 마디 */}
                <div className="rounded-xl p-4 text-center" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.25)" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#fb7185" }}>💬 심장 흔드는 한 마디</p>
                  <p className="text-sm font-bold italic" style={{ color: "#fff" }}>{tip.phrase}</p>
                </div>
              </div>
            </div>
          );
        })()}

        {/* 공유 + CTA */}
        <div className="mt-6 rounded-2xl p-5 text-center"
          style={{ background: "rgba(244,63,94,0.06)", border: "1px solid rgba(244,63,94,0.2)" }}>
          <p className="text-sm font-bold text-white mb-1">더 깊은 분석이 필요하다면?</p>
          <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>두 사람의 사주 궁합을 더 자세히 알아보세요</p>
          <button onClick={() => router.push("/service/gunghap")}
            className="px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
            style={{ background: "linear-gradient(135deg, #f43f5e, #fb7185)", color: "#fff" }}>
            사주 궁합 전체 분석 →
          </button>
        </div>

        {targetSaju && <SipseongInsight result={targetSaju} title="이 사람의 핵심 기운" />}

        <ShareButton />
        <button onClick={() => setStep("input")} className="w-full mt-3 py-3 rounded-xl text-sm font-semibold transition"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
          다시 분석하기
        </button>
        <ShareImageButton targetId="crush-result" fileName="짝사랑" />
      </div>
    </main>
  );
}

"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdBanner from "@/components/AdBanner";

const LOADING_MESSAGES_KO = [
  "사주팔자를 계산하고 있어요...",
  "천간과 지지를 분석하고 있어요...",
  "오행의 균형을 살펴보고 있어요...",
  "부족한 기운을 찾고 있어요...",
  "용신을 찾고 있어요...",
  "배경화면 테마를 결정하고 있어요...",
  "거의 다 됐어요!",
];

const LOADING_MESSAGES_EN = [
  "Calculating your Four Pillars...",
  "Analyzing Heavenly Stems and Earthly Branches...",
  "Examining the balance of Five Elements...",
  "Finding your lacking energy...",
  "Determining your Yong-sin...",
  "Deciding your wallpaper theme...",
  "Almost done!",
];

const TIPS_KO = [
  "💡 오행 중 '수(水)'가 부족하면 지혜와 유연성이 약해질 수 있어요",
  "💡 '목(木)'이 강한 사람은 창의적이고 성장 지향적인 성향이에요",
  "💡 '화(火)'가 부족하면 열정과 표현력을 보강해주는 배경이 도움돼요",
  "💡 '토(土)'는 중심과 안정을 상징해요. 부족하면 흔들리기 쉬워요",
  "💡 '금(金)'이 강한 사람은 결단력과 원칙을 중시해요",
  "💡 조후(調候)란 태어난 계절의 기후를 보정하는 개념이에요",
  "💡 용신(用神)은 사주의 균형을 맞춰주는 핵심 오행이에요",
];

const TIPS_EN = [
  "💡 Lacking Water element may weaken wisdom and flexibility",
  "💡 Strong Wood element means creative and growth-oriented personality",
  "💡 Lacking Fire element benefits from passion-boosting wallpapers",
  "💡 Earth element symbolizes stability — lacking it may cause instability",
  "💡 Strong Metal element means decisive and principled personality",
  "💡 Johu (調候) corrects for the climate of your birth season",
  "💡 Yong-sin (用神) is the key element that balances your Saju",
];

export default function LoadingPage() {
  const router = useRouter();
  const [messageIndex, setMessageIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [lang, setLang] = useState<"ko" | "en" | "id">("ko");

  useEffect(() => {
    const formData = sessionStorage.getItem("sajuForm");
    if (!formData) { router.push("/form"); return; }
    const parsed = JSON.parse(formData);
    setLang(parsed.lang || "ko");
    setTipIndex(Math.floor(Math.random() * TIPS_KO.length));
  }, [router]);

  const messages = lang === "ko" ? LOADING_MESSAGES_KO : LOADING_MESSAGES_EN;

  const tips = lang === "ko" ? TIPS_KO : TIPS_EN;

  // 메시지 순환
  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((prev) => Math.min(prev + 1, messages.length - 1));
    }, 2200);
    return () => clearInterval(timer);
  }, [messages.length]);

  // 팁 순환
  useEffect(() => {
    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [tips.length]);

  // 프로그레스바
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return prev;
        return prev + Math.random() * 3;
      });
    }, 300);
    return () => clearInterval(timer);
  }, []);

  // 실제 API 호출 — 최소 5초 보장 (광고 노출 시간 확보)
  useEffect(() => {
    const analyze = async () => {
      const formData = sessionStorage.getItem("sajuForm");
      if (!formData) return;
      const form = JSON.parse(formData);

      try {
        // API 응답과 최소 5초 대기를 병렬로 실행
        const [res] = await Promise.all([
          fetch("/api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(form),
          }),
          new Promise<void>(resolve => setTimeout(resolve, 5000)),
        ]);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        sessionStorage.setItem("sajuResult", JSON.stringify(data));
        setProgress(100);
        setTimeout(() => router.push("/result"), 600);
      } catch (err) {
        alert(err instanceof Error ? err.message : "오류가 발생했습니다");
        router.push("/form");
      }
    };

    analyze();
  }, [router]);

  return (
    <main className="min-h-screen bg-[#0A0A0F] text-white flex flex-col items-center justify-center px-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-900/20 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center space-y-10">

        {/* 메인 아이콘 */}
        <div className="relative inline-block">
          <div className="text-8xl animate-pulse">🔮</div>
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-2xl animate-ping" />
        </div>

        {/* 로딩 메시지 */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white min-h-[2rem] transition-all">
            {messages[messageIndex]}
          </h2>
        </div>

        {/* 프로그레스바 */}
        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        <AdBanner />

        {/* 사주 팁 */}
        <div className="bg-indigo-900/30 border border-indigo-500/20 rounded-2xl p-5">
          <p className="text-indigo-200 text-sm leading-relaxed transition-all">
            {tips[tipIndex]}
          </p>
        </div>

        <p className="text-gray-600 text-xs">
          {lang === "ko" ? "사주 분석에 10~20초 정도 소요됩니다" : "Analysis takes about 10-20 seconds"}
        </p>
      </div>
    </main>
  );
}
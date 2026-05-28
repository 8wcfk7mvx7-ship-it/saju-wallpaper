"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

function useFadeIn(delay = 0) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return { ref, visible };
}

function FadeInLine({ children, delay = 0, className = "" }: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const { visible } = useFadeIn(delay);
  return (
    <div
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 0.9s ease ${delay}ms, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

const VIRAL_LINES = [
  { text: "당신의 사주엔", delay: 200 },
  { text: "부족한 기운이 있습니다.", delay: 700 },
  { text: "그 기운을 매일 눈에 담으면", delay: 1400 },
  { text: "운명이 조금씩 달라집니다.", delay: 2100 },
];

export default function LandingPage() {
  const router = useRouter();
  const [showButton, setShowButton] = useState(false);
  const [counter] = useState(() => Math.floor(Math.random() * 200) + 160);
  const [totalCount] = useState(() => Math.floor(Math.random() * 20000) + 43000);

  useEffect(() => {
    const timer = setTimeout(() => setShowButton(true), 3200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <main className="min-h-screen bg-[#06060e] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* 뒤로가기 */}
      <div className="fixed top-5 left-5 z-20">
        <button onClick={() => router.push("/")}
          className="text-xs text-gray-700 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          ← 홈
        </button>
      </div>
      {/* 배경 글로우 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-900/30 blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-purple-900/25 blur-[130px]" />
        <div className="absolute top-[40%] left-[55%] w-[250px] h-[250px] rounded-full bg-violet-700/10 blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-md w-full text-center space-y-0">
        {/* 상단 아이콘 */}
        <FadeInLine delay={0} className="mb-8">
          <div className="text-5xl drop-shadow-[0_0_40px_rgba(99,102,241,0.5)]">🔮</div>
        </FadeInLine>

        {/* 카운터 뱃지 */}
        <FadeInLine delay={100} className="mb-10">
          <div className="flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/25 rounded-full px-4 py-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-indigo-200 text-sm font-semibold">
                지금 이 순간 <strong className="text-white">{counter.toLocaleString()}명</strong>이 확인 중
              </span>
            </div>
            <span className="text-xs text-gray-700">
              누적 <strong className="text-gray-500">{totalCount.toLocaleString()}명</strong> 분석 완료
            </span>
          </div>
        </FadeInLine>

        {/* 바이럴 문구 — 한 줄씩 */}
        <div className="space-y-4 mb-16">
          {VIRAL_LINES.map((line, i) => (
            <FadeInLine key={i} delay={line.delay}>
              <p
                className={`leading-snug font-medium ${
                  i === 1 || i === 3
                    ? "text-3xl font-black bg-gradient-to-r from-indigo-300 via-purple-200 to-pink-300 bg-clip-text text-transparent"
                    : "text-xl text-gray-400"
                }`}
              >
                {line.text}
              </p>
            </FadeInLine>
          ))}
        </div>

        {/* 부제 */}
        <FadeInLine delay={2900} className="mb-10">
          <p className="text-sm text-gray-600 leading-relaxed">
            사주팔자로 분석한 오행 보정 배경화면
          </p>
        </FadeInLine>

        {/* 시작하기 버튼 */}
        <div
          style={{
            opacity: showButton ? 1 : 0,
            transform: showButton ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
            transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1)",
          }}
        >
          <button
            onClick={() => router.push("/form")}
            className="w-full max-w-xs mx-auto block bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-5 px-10 rounded-2xl text-lg shadow-2xl shadow-indigo-900/50 transition-all active:scale-[0.97]"
          >
            나의 부족한 기운 확인하기
          </button>
          <p className="text-xs text-gray-700 mt-4">
            무료 분석 · 1분 완성
          </p>
        </div>
      </div>
    </main>
  );
}

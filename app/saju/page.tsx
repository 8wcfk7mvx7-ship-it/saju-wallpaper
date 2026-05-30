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
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const { visible } = useFadeIn(delay);
  return (
    <div className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(18px)",
      transition: `opacity 0.9s ease ${delay}ms, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}

const BG_HANJA = [
  { char: "木", x: "7%",  y: "10%", size: 160, opacity: 0.06, delay: 0,    dur: 18 },
  { char: "水", x: "40%", y: "85%", size: 120, opacity: 0.05, delay: 4500, dur: 21 },
];

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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

      {/* 한자 배경 */}
      {mounted && BG_HANJA.map((h, i) => (
        <div key={i} className="fixed pointer-events-none select-none" style={{
          left: h.x, top: h.y,
          fontSize: h.size,
          color: "#c9a84c",
          opacity: h.opacity,
          fontWeight: 900,
          lineHeight: 1,
          animation: `floatBg${i % 3} ${h.dur}s ease-in-out ${h.delay}ms infinite`,
        }}>
          {h.char}
        </div>
      ))}

      {/* CSS 애니메이션 */}
      <style>{`
        @keyframes floatBg0 { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-18px) rotate(3deg)} }
        @keyframes floatBg1 { 0%,100%{transform:translateY(0) rotate(4deg)} 50%{transform:translateY(22px) rotate(-2deg)} }
        @keyframes floatBg2 { 0%,100%{transform:translateY(0) rotate(-1deg)} 50%{transform:translateY(-14px) rotate(5deg)} }
      `}</style>

      {/* 배경 글로우 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-indigo-900/30 blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#c9a84c]/8 blur-[130px]" />
        <div className="absolute top-[40%] left-[55%] w-[250px] h-[250px] rounded-full bg-violet-700/10 blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-md w-full text-center space-y-0">

        {/* 배지 + 아이콘 */}
        <FadeInLine delay={0} className="mb-6">
          <div className="flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-2 bg-[#c9a84c]/10 border border-[#c9a84c]/30 rounded-full px-4 py-1.5">
              <span className="text-[#c9a84c] text-xs font-bold tracking-widest uppercase">Summer Palace</span>
            </div>
            <div className="text-5xl drop-shadow-[0_0_40px_rgba(99,102,241,0.5)]">🔮</div>
          </div>
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

        {/* 바이럴 문구 */}
        <div className="space-y-4 mb-12">
          {VIRAL_LINES.map((line, i) => (
            <FadeInLine key={i} delay={line.delay}>
              <p className={`leading-snug font-medium ${
                i === 1 || i === 3
                  ? "text-3xl font-black bg-gradient-to-r from-[#c9a84c] via-amber-200 to-[#c9a84c] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(201,168,76,0.3)]"
                  : "text-xl text-gray-400"
              }`}>
                {line.text}
              </p>
            </FadeInLine>
          ))}
        </div>

        {/* 오행 힌트 카드 */}
        <FadeInLine delay={2500} className="mb-10">
          <div className="grid grid-cols-5 gap-1.5 max-w-xs mx-auto">
            {[
              { el: "木", color: "#52b788", desc: "성장" },
              { el: "火", color: "#ff7043", desc: "열정" },
              { el: "土", color: "#d4a373", desc: "안정" },
              { el: "金", color: "#c9a84c", desc: "결실" },
              { el: "水", color: "#48cae4", desc: "지혜" },
            ].map((item) => (
              <div key={item.el} className="flex flex-col items-center gap-1 bg-white/5 rounded-xl py-2.5 border border-white/8">
                <span className="text-lg font-bold" style={{ color: item.color }}>{item.el}</span>
                <span className="text-[10px] text-gray-600">{item.desc}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-700 mt-3">당신에게 부족한 오행을 찾아드립니다</p>
        </FadeInLine>

        {/* 시작하기 버튼 */}
        <div style={{
          opacity: showButton ? 1 : 0,
          transform: showButton ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
          transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1)",
        }}>
          <button
            onClick={() => router.push("/form")}
            className="w-full max-w-xs mx-auto block font-bold py-5 px-10 rounded-2xl text-lg shadow-2xl transition-all active:scale-[0.97] relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #c9a84c 0%, #e8c97a 40%, #c9a84c 100%)",
              color: "#1a0f00",
              boxShadow: "0 8px 32px -4px rgba(201,168,76,0.4)",
            }}
          >
            <span className="relative z-10">나의 부족한 기운 확인하기</span>
          </button>
          <p className="text-xs text-gray-700 mt-4">AI 생성 · 유료 서비스</p>
        </div>

      </div>
    </main>
  );
}

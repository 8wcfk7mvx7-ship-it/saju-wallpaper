"use client";
import { useEffect, useRef, useState } from "react";

const SAJU_TIPS = [
  "일간(日干)은 사주에서 나 자신을 상징합니다",
  "오행(五行)은 木·火·土·金·水 다섯 에너지의 균형입니다",
  "용신(用神)은 내 사주에서 가장 필요로 하는 기운입니다",
  "일주(日柱)는 타고난 성격과 현재의 나를 나타냅니다",
  "대운(大運)은 10년 단위로 바뀌는 큰 흐름입니다",
  "충(沖)은 나쁜 것만이 아닙니다 — 강한 자극과 케미의 원천이기도 합니다",
];

function AdSenseBlock() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => {
      try {
        // @ts-expect-error adsbygoogle
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {}
    }, 100);
    return () => clearTimeout(t);
  }, []);
  if (!mounted) return <div className="h-14 w-full" />;
  return (
    <div className="w-full max-w-xs mx-auto my-3">
      <ins
        className="adsbygoogle"
        style={{ display: "block", textAlign: "center" }}
        data-ad-layout="in-article"
        data-ad-format="fluid"
        data-ad-client="ca-pub-여기에입력"
        data-ad-slot="여기에입력"
      />
    </div>
  );
}

const ROTATING_MSGS = [
  "오행 에너지를 계산하는 중...",
  "일간·일주 데이터를 정밀 해석하는 중...",
  "AI 분석 엔진 처리 중...",
  "결과를 정리하는 중...",
];

interface Props {
  /** "홍길동님의 매력" 또는 "두 사람의 궁합" 형태로 전달 */
  subject: string;
  duration?: number;
  onDone: () => void;
}

export default function AnalysisLoading({ subject, duration = 2800, onDone }: Props) {
  const [started, setStarted] = useState(false);
  const [pct, setPct] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  // rAF 기반 진행률
  useEffect(() => {
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const p = Math.min(100, ((now - start) / duration) * 100);
      setPct(p);
      if (p < 100) {
        raf = requestAnimationFrame(tick);
      } else {
        setTimeout(() => onDoneRef.current(), 250);
      }
    };
    raf = requestAnimationFrame(tick);
    setStarted(true);
    return () => cancelAnimationFrame(raf);
  }, [duration]);

  // 메시지 순환
  useEffect(() => {
    const t = setInterval(() => setMsgIdx(i => (i + 1) % ROTATING_MSGS.length), 950);
    return () => clearInterval(t);
  }, []);

  // 팁 순환
  useEffect(() => {
    const t = setInterval(() => setTipIdx(i => (i + 1) % SAJU_TIPS.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: "#06060e" }}>

      {/* 배경 글로우 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-25%] left-[10%] w-[500px] h-[500px] rounded-full blur-[200px]"
          style={{ background: "rgba(201,168,76,0.06)" }} />
        <div className="absolute bottom-[-20%] right-[5%] w-[400px] h-[400px] rounded-full blur-[160px]"
          style={{ background: "rgba(139,92,246,0.05)" }} />
      </div>

      <div className="relative z-10 w-full max-w-sm">

        {/* 스피너 + 주 메시지 */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-5 relative">
            <div className="absolute inset-0 rounded-full border-2 animate-spin"
              style={{ borderColor: "rgba(201,168,76,0.15)", borderTopColor: "rgba(201,168,76,0.8)" }} />
            <div className="absolute inset-[5px] rounded-full border animate-spin"
              style={{ borderColor: "rgba(139,92,246,0.1)", borderBottomColor: "rgba(139,92,246,0.6)", animationDirection: "reverse", animationDuration: "1.4s" }} />
            <div className="absolute inset-0 flex items-center justify-center text-xl select-none">☯</div>
          </div>

          <p className="text-base font-bold mb-1" style={{ color: "rgba(255,255,255,0.9)" }}>
            {subject}을 열심히 분석 중입니다...
          </p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            {ROTATING_MSGS[msgIdx]}
          </p>
        </div>

        {/* 프로그레스 바 */}
        <div className="mb-7">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: "rgba(255,255,255,0.3)" }}>
            <span>분석 진행률</span>
            <span>{Math.round(pct)}%</span>
          </div>
          <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.07)" }}>
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #c9a84c 0%, #a78bfa 100%)",
                transition: "width 0.1s linear",
              }}
            />
          </div>
        </div>

        {/* AdSense */}
        <AdSenseBlock />

        {/* 사주 팁 */}
        <div className="mt-3 px-4 py-3 rounded-2xl text-center"
          style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.055)" }}>
          <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.28)" }}>
            💡 {SAJU_TIPS[tipIdx]}
          </p>
        </div>
      </div>
    </div>
  );
}

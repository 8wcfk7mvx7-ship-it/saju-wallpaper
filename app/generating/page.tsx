"use client";
import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// ─────────────────────────────────────────────
// 타입
// ─────────────────────────────────────────────
interface Step {
  id: string;
  label: string;
  detail: string;
  icon: string;
  status: "waiting" | "running" | "done" | "error";
  duration?: number; // 예상 ms
}

// ─────────────────────────────────────────────
// AdSense 컴포넌트 — 클라이언트에서만 렌더링
// ─────────────────────────────────────────────
function AdSenseBlock() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 마운트 후 adsbygoogle 초기화
    const timer = setTimeout(() => {
      try {
        // @ts-expect-error adsbygoogle
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {}
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // SSR 단계에서는 플레이스홀더만 렌더링 (hydration 충돌 방지)
  if (!mounted) {
    return <div className="w-full max-w-sm mx-auto my-4 h-16" />;
  }

  return (
    <div className="w-full max-w-sm mx-auto my-4">
      {/* ▼ AdSense 승인 후 아래 값을 실제 코드로 교체 */}
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

// ─────────────────────────────────────────────
// 재미있는 로딩 메시지
// ─────────────────────────────────────────────
const LOADING_MESSAGES: Record<string, string[]> = {
  wallpaper: [
    "🔮 오행의 기운을 읽고 있어요...",
    "🎨 AI가 색채 에너지를 계산 중이에요...",
    "✨ 낮 배경화면 구성 중...",
    "🌙 밤 배경화면 구성 중...",
    "🌀 조화의 기운을 담고 있어요...",
    "🖼 마지막 픽셀을 채우는 중...",
  ],
  report: [
    "📖 사주팔자를 정밀 분석 중...",
    "🔭 오행의 균형을 파악하는 중...",
    "💡 용신과 희신을 계산 중...",
    "✍️ 직업·재물 운세를 작성 중...",
    "❤️ 인간관계 분석 중...",
    "🌟 특별한 메시지를 준비 중...",
  ],
  bundle: [
    "⚡ 사주팔자를 심층 분석 중...",
    "🎨 오행 배경화면 생성 중...",
    "📝 AI 보고서 작성 중...",
    "🌅 낮 버전 배경화면 완성 중...",
    "🌙 밤 버전 배경화면 완성 중...",
    "📄 보고서 마무리 중...",
    "✨ 최종 검수 중...",
  ],
};

function GeneratingContent() {
  const router = useRouter();
  const params = useSearchParams();
  const productType = params.get("productType") || "mobile";

  const [steps, setSteps] = useState<Step[]>([]);
  const [msgIdx, setMsgIdx] = useState(0);
  const [currentMsg, setCurrentMsg] = useState("");
  const [totalProgress, setTotalProgress] = useState(0);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const startedRef = useRef(false);

  const isWallpaper = productType === "mobile" || productType === "bundle";
  const isReport = productType === "report" || productType === "bundle";

  // 스텝 초기화
  useEffect(() => {
    const initial: Step[] = [];
    if (isWallpaper) {
      initial.push(
        { id: "wp-analyze", label: "오행 분석", detail: "부족한 기운 파악 중", icon: "🔮", status: "waiting", duration: 2000 },
        { id: "wp-day", label: "낮 배경화면 생성", detail: "태양 에너지 담는 중", icon: "☀️", status: "waiting", duration: 30000 },
        { id: "wp-night", label: "밤 배경화면 생성", detail: "달빛 에너지 담는 중", icon: "🌙", status: "waiting", duration: 30000 },
        { id: "wp-abstract", label: "조화 배경화면 생성", detail: "두 기운의 균형 담는 중", icon: "✨", status: "waiting", duration: 30000 }
      );
    }
    if (isReport) {
      initial.push(
        { id: "rp-analyze", label: "사주 심층 분석", detail: "AI가 운명을 해석 중", icon: "📖", status: "waiting", duration: 3000 },
        { id: "rp-write", label: "보고서 작성", detail: "Claude AI가 분석 중", icon: "✍️", status: "waiting", duration: 40000 },
        { id: "rp-done", label: "보고서 완성", detail: "PDF 준비 중", icon: "📄", status: "waiting", duration: 1000 }
      );
    }
    setSteps(initial);
  }, [isWallpaper, isReport]);

  // 로딩 메시지 순환
  useEffect(() => {
    const msgs = LOADING_MESSAGES[productType] || LOADING_MESSAGES.bundle;
    setCurrentMsg(msgs[0]);
    const interval = setInterval(() => {
      setMsgIdx(prev => {
        const next = (prev + 1) % msgs.length;
        setCurrentMsg(msgs[next]);
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [productType]);

  // 실제 생성 실행
  useEffect(() => {
    if (startedRef.current || steps.length === 0) return;
    startedRef.current = true;

    async function generate() {
      const sajuResultRaw = sessionStorage.getItem("sajuResult");
      const sajuFormRaw = sessionStorage.getItem("sajuForm");

      if (!sajuResultRaw || !sajuFormRaw) {
        setError("사주 데이터를 찾을 수 없습니다. 처음부터 다시 시도해주세요.");
        return;
      }

      const sajuResult = JSON.parse(sajuResultRaw);
      const sajuForm = JSON.parse(sajuFormRaw);

      function updateStep(id: string, status: Step["status"]) {
        setSteps(prev => prev.map(s => s.id === id ? { ...s, status } : s));
      }

      function updateProgress(pct: number) {
        setTotalProgress(pct);
      }

      try {
        // ── 배경화면 생성 ──────────────────────────────
        if (isWallpaper) {
          updateStep("wp-analyze", "running");
          await new Promise(r => setTimeout(r, 1500));
          updateStep("wp-analyze", "done");
          updateProgress(5);

          updateStep("wp-day", "running");
          updateStep("wp-night", "running");
          updateStep("wp-abstract", "running");

          const wpRes = await fetch("/api/generate/wallpaper", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sajuResult, sajuForm }),
          });

          if (!wpRes.ok) {
            const err = await wpRes.json();
            throw new Error(err.error || "배경화면 생성 실패");
          }

          const wpData = await wpRes.json();
          sessionStorage.setItem("generatedWallpapers", JSON.stringify(wpData.wallpapers || []));

          updateStep("wp-day", "done");
          updateStep("wp-night", "done");
          updateStep("wp-abstract", "done");
          updateProgress(isReport ? 50 : 90);
        }

        // ── 보고서 생성 ──────────────────────────────
        if (isReport) {
          updateStep("rp-analyze", "running");
          await new Promise(r => setTimeout(r, 2000));
          updateStep("rp-analyze", "done");
          updateProgress(isWallpaper ? 60 : 15);

          updateStep("rp-write", "running");

          const rpRes = await fetch("/api/generate/report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sajuResult, sajuForm }),
          });

          if (!rpRes.ok) {
            const err = await rpRes.json();
            throw new Error(err.error || "보고서 생성 실패");
          }

          const rpData = await rpRes.json();
          sessionStorage.setItem("aiReportContent", JSON.stringify(rpData.reportContent || {}));

          updateStep("rp-write", "done");
          updateProgress(95);

          updateStep("rp-done", "running");
          await new Promise(r => setTimeout(r, 800));
          updateStep("rp-done", "done");
          updateProgress(100);
        } else {
          updateProgress(100);
        }

        setDone(true);
        // 완료 후 이동
        setTimeout(() => {
          if (isReport) {
            router.replace("/report");
          } else {
            router.replace("/result");
          }
        }, 1500);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "생성 중 오류 발생";
        setError(msg);
        // 실패한 스텝 표시
        setSteps(prev => prev.map(s =>
          s.status === "running" ? { ...s, status: "error" } : s
        ));
      }
    }

    generate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [steps.length]);

  const productLabel = {
    mobile: "배경화면",
    report: "보고서",
    bundle: "배경화면 + 보고서",
  }[productType] || "콘텐츠";

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white flex flex-col items-center px-4 py-10">
      {/* 타이틀 */}
      <div className="mb-8 text-center">
        <p className="text-xs text-indigo-400 tracking-widest uppercase mb-2">AI 생성 중</p>
        <h1 className="text-2xl font-black text-white">
          {done ? "✅ 완성!" : `✨ ${productLabel} 제작 중...`}
        </h1>
      </div>

      {/* 프로그레스 바 */}
      <div className="w-full max-w-sm mb-6">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>진행률</span>
          <span>{totalProgress}%</span>
        </div>
        <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </div>

      {/* 스텝 리스트 */}
      <div className="w-full max-w-sm space-y-2 mb-6">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-300 ${
              step.status === "running"
                ? "bg-indigo-500/15 border-indigo-500/40"
                : step.status === "done"
                ? "bg-green-500/10 border-green-500/30"
                : step.status === "error"
                ? "bg-red-500/10 border-red-500/30"
                : "bg-white/3 border-white/8 opacity-50"
            }`}
          >
            {/* 아이콘 / 상태 */}
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
              {step.status === "running" ? (
                <div className="w-5 h-5 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
              ) : step.status === "done" ? (
                <span className="text-green-400 text-lg">✓</span>
              ) : step.status === "error" ? (
                <span className="text-red-400 text-lg">✕</span>
              ) : (
                <span className="text-gray-600 text-lg">{step.icon}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-medium ${
                step.status === "done" ? "text-green-400" :
                step.status === "running" ? "text-white" :
                step.status === "error" ? "text-red-400" :
                "text-gray-500"
              }`}>{step.label}</p>
              <p className="text-xs text-gray-500 truncate">{step.detail}</p>
            </div>
            {step.status === "running" && (
              <span className="text-xs text-indigo-400 animate-pulse">처리중</span>
            )}
            {step.status === "done" && (
              <span className="text-xs text-green-500">완료</span>
            )}
          </div>
        ))}
      </div>

      {/* 로딩 메시지 */}
      {!done && !error && (
        <div className="text-center mb-6 min-h-[2rem]">
          <p className="text-sm text-gray-400 animate-pulse">{currentMsg}</p>
        </div>
      )}

      {/* 완료 메시지 */}
      {done && (
        <div className="text-center mb-6 animate-bounce">
          <p className="text-indigo-300 font-bold">🎉 {productLabel} 준비 완료! 잠시 후 이동합니다...</p>
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div className="w-full max-w-sm mb-6 bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
          <p className="text-red-400 text-sm mb-3">{error}</p>
          <button
            onClick={() => router.push("/result")}
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm transition-colors"
          >
            결과 페이지로 돌아가기
          </button>
        </div>
      )}

      {/* ── AdSense 광고 ── */}
      {!done && !error && (
        <div className="w-full max-w-sm">
          <p className="text-xs text-gray-600 text-center mb-2">AI 생성에는 약 1-2분이 소요됩니다 ☕</p>
          {/* 광고 1: 배너 */}
          <AdSenseBlock />

          {/* 사주 팁 카드 (광고 사이 컨텐츠) */}
          <div className="bg-white/3 border border-white/8 rounded-xl p-4 my-4 text-center">
            <p className="text-xs text-gray-400 leading-relaxed">
              💡 <span className="text-indigo-300 font-medium">알고 계셨나요?</span><br />
              사주팔자에서 일주(日柱)는 현재의 나를, 월주(月柱)는 환경과 부모를, 연주(年柱)는 조상과 초년 운을 나타냅니다.
            </p>
          </div>

          {/* 광고 2 */}
          <AdSenseBlock />
        </div>
      )}
    </div>
  );
}

export default function GeneratingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
      </div>
    }>
      <GeneratingContent />
    </Suspense>
  );
}

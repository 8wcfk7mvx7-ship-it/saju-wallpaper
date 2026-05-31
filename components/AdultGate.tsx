"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AdultGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "verified" | "gate">("loading");

  useEffect(() => {
    try {
      const ok = sessionStorage.getItem("saju_adult_ok") === "1";
      setStatus(ok ? "verified" : "gate");
    } catch {
      setStatus("gate");
    }
  }, []);

  function confirm() {
    try { sessionStorage.setItem("saju_adult_ok", "1"); } catch {}
    setStatus("verified");
  }

  if (status === "loading") return null;

  if (status === "gate") {
    return (
      <main className="min-h-screen bg-[#0a0101] text-white flex items-center justify-center px-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-red-950/40 blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-xs w-full text-center">
          <div className="text-6xl mb-6">🔞</div>
          <h1 className="text-2xl font-black mb-2">성인 전용 콘텐츠</h1>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            이 페이지는 만 19세 이상만<br />이용할 수 있습니다.
          </p>
          <div className="space-y-3">
            <button
              onClick={confirm}
              className="w-full py-4 rounded-2xl font-black text-base bg-gradient-to-r from-red-700 to-rose-600 hover:from-red-600 hover:to-rose-500 text-white transition-all active:scale-[0.98]"
            >
              만 19세 이상 — 입장하기
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 rounded-2xl font-semibold text-sm text-gray-500 hover:text-gray-300 border border-white/10 transition"
            >
              미성년자 — 홈으로 돌아가기
            </button>
          </div>
          <p className="text-xs text-gray-700 mt-6">
            본인 확인 후 세션이 유지됩니다.
          </p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

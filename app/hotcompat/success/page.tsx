"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

function HotCompatSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    localStorage.setItem("sp_hotcompat_paid", "true");
    const t = setTimeout(() => router.replace("/hotcompat"), 1800);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <main className="min-h-screen bg-[#08010f] text-white flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="text-6xl mb-5">✅</div>
        <h1 className="text-2xl font-black text-white mb-2">결제 완료!</h1>
        <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>
          {params.get("method") === "blueberry" ? "🫐 블루베리로 결제되었습니다" : "19금 사주 궁합이 잠금 해제됩니다"}
        </p>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>잠시 후 자동으로 이동합니다...</p>
      </div>
    </main>
  );
}

export default function HotCompatSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08010f] flex items-center justify-center text-white">처리 중...</div>}>
      <HotCompatSuccessContent />
    </Suspense>
  );
}

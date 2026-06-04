"use client";
import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export const dynamic = "force-dynamic";

function ReunionSuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId") || "";

  useEffect(() => {
    if (!orderId) { router.replace("/reunion"); return; }
    localStorage.setItem("sp_reunion_paid", "true");
    const t = setTimeout(() => router.replace("/reunion"), 1800);
    return () => clearTimeout(t);
  }, [orderId, router]);

  return (
    <main className="min-h-screen bg-[#06060e] text-white flex flex-col items-center justify-center px-6">
      <div className="text-center">
        <div className="text-6xl mb-5">✅</div>
        <h1 className="text-2xl font-black text-white mb-2">결제 완료!</h1>
        <p className="text-sm mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>
          재회운 완전 분석이 잠금 해제됩니다
        </p>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>잠시 후 자동으로 이동합니다...</p>
      </div>
    </main>
  );
}

export default function ReunionSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#06060e] flex items-center justify-center text-white">처리 중...</div>}>
      <ReunionSuccessContent />
    </Suspense>
  );
}

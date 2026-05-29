"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function SuccessContent() {
  const router = useRouter();
  const params = useSearchParams();
  const paymentKey = params.get("paymentKey") || "";
  const orderId = params.get("orderId") || "";
  const amount = Number(params.get("amount") || 0);
  const productType = params.get("productType") || "mobile";

  const [status, setStatus] = useState<"confirming" | "done" | "error">("confirming");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setErrorMsg("결제 정보가 올바르지 않습니다.");
      setStatus("error");
      return;
    }

    async function confirm() {
      try {
        const receiptEmail = sessionStorage.getItem("receiptEmail") || undefined;
        const sajuRaw = sessionStorage.getItem("sajuForm");
        const sajuName = sajuRaw ? (JSON.parse(sajuRaw).name || "고객") : "고객";
        const res = await fetch("/api/payment/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentKey, orderId, amount,
            customerEmail: receiptEmail,
            customerName: sajuName,
            productName: "사주 운세 분석",
          }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "결제 승인 실패");
        }

        // 결제 완료 상태 저장
        sessionStorage.setItem("paymentDone", "true");
        sessionStorage.setItem("paymentProductType", productType);

        setStatus("done");
        // 잠시 후 생성 페이지로 이동
        setTimeout(() => {
          router.replace(`/generating?productType=${productType}`);
        }, 1000);
      } catch (e: unknown) {
        setErrorMsg(e instanceof Error ? e.message : "결제 확인 중 오류가 발생했습니다.");
        setStatus("error");
      }
    }

    confirm();
  }, [paymentKey, orderId, amount, productType, router]);

  if (status === "confirming") {
    return (
      <div className="min-h-screen bg-[#0d0d1a] text-white flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
        <p className="text-gray-300">결제 승인 중...</p>
      </div>
    );
  }

  if (status === "done") {
    return (
      <div className="min-h-screen bg-[#0d0d1a] text-white flex flex-col items-center justify-center gap-4">
        <div className="text-5xl animate-bounce">✨</div>
        <p className="text-xl font-bold text-indigo-300">결제 완료!</p>
        <p className="text-gray-400 text-sm">AI 생성을 시작합니다...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white flex flex-col items-center justify-center gap-4 px-6">
      <div className="text-5xl">⚠️</div>
      <p className="text-lg font-bold text-red-400">결제 확인 실패</p>
      <p className="text-sm text-gray-400 text-center">{errorMsg}</p>
      <button
        onClick={() => router.push("/result")}
        className="mt-4 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium text-sm transition-colors"
      >
        결과 페이지로 돌아가기
      </button>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}

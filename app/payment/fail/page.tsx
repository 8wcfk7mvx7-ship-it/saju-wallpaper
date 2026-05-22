"use client";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function FailContent() {
  const router = useRouter();
  const params = useSearchParams();
  const code = params.get("code") || "";
  const message = params.get("message") || "결제가 실패하였습니다.";

  const friendlyMessage: Record<string, string> = {
    PAY_PROCESS_CANCELED: "결제가 취소되었습니다.",
    PAY_PROCESS_ABORTED: "결제가 중단되었습니다.",
    REJECT_CARD_COMPANY: "카드사에서 결제를 거절했습니다.",
    INVALID_STOPPED_CARD: "정지된 카드입니다.",
    EXCEED_MAX_DAILY_PAYMENT_COUNT: "일일 결제 한도를 초과했습니다.",
    NOT_SUPPORTED_INSTALLMENT_PLAN_CARD_OR_MERCHANT: "할부가 지원되지 않는 카드입니다.",
    INVALID_CARD_EXPIRATION: "카드 유효기간이 올바르지 않습니다.",
  };

  const displayMessage = friendlyMessage[code] || message;

  return (
    <div className="min-h-screen bg-[#0d0d1a] text-white flex flex-col items-center justify-center px-6 gap-5">
      <div className="text-6xl">😔</div>
      <h1 className="text-xl font-bold text-red-400">결제에 실패했어요</h1>
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 max-w-sm w-full text-center">
        <p className="text-sm text-gray-300">{displayMessage}</p>
        {code && <p className="text-xs text-gray-500 mt-2">오류 코드: {code}</p>}
      </div>
      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={() => router.back()}
          className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-medium transition-colors"
        >
          다시 시도하기
        </button>
        <button
          onClick={() => router.push("/result")}
          className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-medium text-sm transition-colors"
        >
          결과 페이지로 돌아가기
        </button>
      </div>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    }>
      <FailContent />
    </Suspense>
  );
}

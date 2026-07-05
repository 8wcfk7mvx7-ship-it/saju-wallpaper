"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackButton from "@/components/BackButton";
import PaymentMethodSelector, { type PaymentMethod } from "@/components/PaymentMethodSelector";
import { getBalanceServer, deductBalanceServer } from "@/lib/blueberry";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";

export const dynamic = "force-dynamic";

function ErosPayContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId") || "";
  const amount = Number(params.get("amount") || 4900);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [starBalance, setStarBalance] = useState(0);

  useEffect(() => {
    getBalanceServer().then(setStarBalance);
    if (params.get("error") === "true") setError("결제가 취소되었거나 실패하였습니다.");
  }, [params]);

  async function handlePayment() {
    if (!agreed) { setError("이용약관에 동의해주세요."); return; }
    if (!orderId) { setError("주문 정보가 없습니다. 다시 시도해주세요."); return; }
    setLoading(true); setError("");

    if (method === "starpiece") {
      if (!await deductBalanceServer(amount)) { setError("별조각이 부족합니다."); setLoading(false); return; }
      router.push(`/service/eros/success?orderId=${orderId}&amount=${amount}&paymentKey=STARPIECE`);
      return;
    }

    try {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const commonParams = {
        amount: { currency: "KRW" as const, value: amount },
        orderId,
        orderName: "나의 성적 매력 분석 프리미엄 보고서",
        successUrl: `${base}/service/eros/success?orderId=${orderId}&amount=${amount}`,
        failUrl: `${base}/service/eros/pay?orderId=${orderId}&amount=${amount}&error=true`,
        customerName: "고객",
      };
      if (method === "easypay") {
        await payment.requestPayment({ method: "CARD", card: { flowMode: "DIRECT", easyPay: "TOSSPAY" }, ...commonParams });
      } else {
        await payment.requestPayment({ method: "CARD", ...commonParams });
      }
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err?.code === "PAY_PROCESS_CANCELED") setError("결제가 취소되었습니다.");
      else setError(err?.message || "결제 중 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#06060e] text-white flex flex-col items-center px-4 py-10">
      <BackButton />

      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔥</div>
          <h1 className="text-2xl font-black text-white mb-1">성적 매력 프리미엄 보고서</h1>
          <p className="text-gray-400 text-sm mt-1">타고난 매력 신호 전체 분석 · 요망력 · 꼬시는 법</p>
        </div>

        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-5">
          <p className="text-sm font-bold text-white mb-3">포함 내용</p>
          <div className="space-y-2">
            {[
              "성적 매력 등급 (S~D) + 점수 구성",
              "요망력 지수 (끌림력·색기력·밀당력·신체매력)",
              "일간별 성적 에너지 + 낮져밤이 분석",
              "암합·지지합·충 에너지 분석",
              "함지살·도화살 계열 매력 신호",
              "이성을 꼬시는 맞춤 전략",
              "배우자궁 + 조후 분석",
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-rose-400">✓</span>
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-white">결제 금액</p>
            <p className="text-2xl font-black text-rose-400">{amount.toLocaleString()}원</p>
          </div>
          <PaymentMethodSelector
            method={method}
            onChange={setMethod}
            starBalance={starBalance}
            amount={amount}
          />
        </div>

        <div className="mb-5">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 accent-rose-500"
            />
            <span className="text-xs text-gray-400 leading-relaxed">
              이용약관 및 개인정보 처리방침에 동의합니다. 결제 후 즉시 결과를 확인할 수 있으며 디지털 콘텐츠 특성상 환불이 불가합니다.
            </span>
          </label>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700/40 rounded-xl px-4 py-3 mb-4 text-sm text-red-300">
            {error}
          </div>
        )}

        <button
          onClick={handlePayment}
          disabled={loading || !agreed}
          className={`w-full py-4 rounded-2xl font-black text-lg transition-all active:scale-[0.98] ${
            !agreed ? "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
            : loading ? "bg-rose-800 text-white/60 cursor-wait"
            : "bg-gradient-to-r from-rose-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white shadow-lg shadow-rose-900/50"
          }`}
        >
          {loading ? "처리 중..." : `${amount.toLocaleString()}원 결제하기`}
        </button>
      </div>
    </main>
  );
}

export default function ErosPayPage() {
  return (
    <Suspense>
      <ErosPayContent />
    </Suspense>
  );
}

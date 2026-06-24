"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackButton from "@/components/BackButton";
import PaymentMethodSelector, { type PaymentMethod } from "@/components/PaymentMethodSelector";
import { getBalance, deductBalance } from "@/lib/blueberry";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";

export const dynamic = "force-dynamic";

const PRICE = 4900;

function HotCompatPayContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [starBalance, setStarBalance] = useState(0);

  useEffect(() => {
    setStarBalance(getBalance());
    if (params.get("error") === "true") setError("결제가 취소되었거나 실패하였습니다.");
  }, [params]);

  async function handlePayment() {
    if (!agreed) { setError("이용약관에 동의해주세요."); return; }
    if (!orderId) { setError("주문 정보가 없습니다."); return; }
    setLoading(true); setError("");

    if (method === "starpiece") {
      if (!deductBalance(PRICE)) { setError("별조각이 부족합니다."); setLoading(false); return; }
      router.push(`/service/hotcompat/success?orderId=${orderId}&paymentKey=STARPIECE`);
      return;
    }

    try {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });
      const base = window.location.origin;
      const commonParams = {
        amount: { currency: "KRW" as const, value: PRICE },
        orderId,
        orderName: "19금 사주 궁합 완전 분석",
        successUrl: `${base}/service/hotcompat/success?orderId=${orderId}`,
        failUrl: `${base}/service/hotcompat/pay?orderId=${orderId}&error=true`,
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
          <h1 className="text-2xl font-black text-white mb-1">19금 사주 궁합</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            두 사람의 성적 케미 완전 공개
          </p>
        </div>

        <div className="rounded-2xl p-5 mb-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-white">19금 사주 궁합 완전 분석</span>
            <span className="text-sm font-black" style={{ color: "#f43f5e" }}>₩{PRICE.toLocaleString()}</span>
          </div>
          <ul className="space-y-1.5 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            <li>✓ 성적 케미 등급 + 점수</li>
            <li>✓ 합충파해 상세 분석</li>
            <li>✓ 도화살·홍염살 진단</li>
            <li>✓ 일주별 성적 특성 완전 분석</li>
          </ul>
        </div>

        <div className="mb-5">
          <button
            onClick={() => setAgreed(v => !v)}
            className="w-full flex items-start gap-2.5 px-4 py-3 rounded-xl border text-sm text-left transition"
            style={{
              borderColor: agreed ? "rgba(244,63,94,0.4)" : "rgba(255,255,255,0.1)",
              background: agreed ? "rgba(244,63,94,0.08)" : "rgba(255,255,255,0.03)",
              color: agreed ? "#f43f5e" : "rgba(255,255,255,0.5)",
            }}
          >
            <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${agreed ? "border-rose-400" : "border-gray-600"}`}>
              {agreed && <span className="text-[10px] font-black">✓</span>}
            </span>
            <span>이용약관 및 환불규정에 동의합니다. AI 분석 결과물 특성상 결제 완료 후 환불이 어렵습니다.</span>
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 mb-4">
            {error}
          </p>
        )}

        <PaymentMethodSelector
          amount={PRICE}
          selected={method}
          onSelect={setMethod}
          starBalance={starBalance}
          disabled={!agreed}
          loading={loading}
          onConfirm={handlePayment}
        />

        <p className="text-center text-[11px] mt-4" style={{ color: "rgba(255,255,255,0.2)" }}>
          결제는 토스페이먼츠(주)를 통해 안전하게 처리됩니다
        </p>
      </div>
    </main>
  );
}

export default function HotCompatPayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#06060e] flex items-center justify-center text-white">로딩 중...</div>}>
      <HotCompatPayContent />
    </Suspense>
  );
}

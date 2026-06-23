"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackButton from "@/components/BackButton";
import PaymentMethodSelector, { type PaymentMethod } from "@/components/PaymentMethodSelector";
import { getBalance, deductBalance } from "@/lib/blueberry";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";

export const dynamic = "force-dynamic";

function CharmPayContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId") || "";
  const amount = Number(params.get("amount") || 4900);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [starBalance, setStarBalance] = useState(0);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("charmData");
      if (raw) {
        const { form } = JSON.parse(raw);
        setName(form.name || "");
      }
    } catch {}
    setStarBalance(getBalance());
    if (params.get("error") === "true") setError("결제가 취소되었거나 실패하였습니다.");
  }, [params]);

  async function handlePayment() {
    if (!agreed) { setError("이용약관에 동의해주세요."); return; }
    if (!orderId) { setError("주문 정보가 없습니다. 다시 시도해주세요."); return; }
    setLoading(true); setError("");

    if (method === "starpiece") {
      if (!deductBalance(amount)) { setError("별조각이 부족합니다."); setLoading(false); return; }
      router.push(`/service/charm/success?orderId=${orderId}&amount=${amount}&paymentKey=STARPIECE`);
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
        orderName: "사주 매력 분석 프리미엄 보고서",
        successUrl: `${base}/service/charm/success?orderId=${orderId}&amount=${amount}`,
        failUrl: `${base}/service/charm/pay?orderId=${orderId}&amount=${amount}&error=true`,
        customerName: name || "고객",
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

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">✨</div>
          <h1 className="text-2xl font-black text-white mb-1">매력 프리미엄 보고서</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            {name ? `${name}님의 ` : ""}사주에서 드러나는 매력을 완전 분석합니다
          </p>
        </div>

        <div className="rounded-2xl p-5 mb-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold text-white">매력 프리미엄 보고서</span>
            <span className="text-sm font-black" style={{ color: "#f472b6" }}>₩{amount.toLocaleString()}</span>
          </div>
          <ul className="space-y-1.5 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            <li>✓ 오행별 개운법 완전판 (방향·시간·음식·향기·액세서리·인테리어)</li>
            <li>✓ AI 매력 인사이트 맞춤 분석</li>
            <li>✓ 연애 전술 3가지 (이성 공략법)</li>
            <li>✓ 극관계 심층 분석 (나를 좋아할 이성)</li>
            <li>✓ 지지 매력 타입 완전 해설</li>
            <li>✓ PDF 5장 저장 (카카오톡 전송 가능)</li>
          </ul>
        </div>

        <div className="mb-5">
          <button
            onClick={() => setAgreed(v => !v)}
            className="w-full flex items-start gap-2.5 px-4 py-3 rounded-xl border text-sm text-left transition"
            style={{
              borderColor: agreed ? "rgba(244,114,182,0.4)" : "rgba(255,255,255,0.1)",
              background: agreed ? "rgba(219,39,119,0.08)" : "rgba(255,255,255,0.03)",
              color: agreed ? "#f472b6" : "rgba(255,255,255,0.5)",
            }}
          >
            <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${agreed ? "border-pink-400" : "border-gray-600"}`}>
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
          amount={amount}
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

export default function CharmPayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#06060e] flex items-center justify-center text-white">로딩 중...</div>}>
      <CharmPayContent />
    </Suspense>
  );
}

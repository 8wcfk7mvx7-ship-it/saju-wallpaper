"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("charmData");
      if (raw) {
        const { form } = JSON.parse(raw);
        setName(form.name || "");
      }
    } catch {}
  }, []);

  async function handlePayment(payMethod: string) {
    if (!agreed) {
      setError("이용약관에 동의해주세요.");
      return;
    }
    if (!orderId) {
      setError("주문 정보가 없습니다. 다시 시도해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });
      const base = typeof window !== "undefined" ? window.location.origin : "";

      const commonParams = {
        amount: { currency: "KRW" as const, value: amount },
        orderId,
        orderName: `사주 매력 분석 프리미엄 보고서`,
        successUrl: `${base}/charm/success?orderId=${orderId}&amount=${amount}`,
        failUrl: `${base}/charm/pay?orderId=${orderId}&amount=${amount}&error=true`,
        customerName: name || "고객",
      };

      if (payMethod === "TOSSPAY") {
        await payment.requestPayment({
          method: "CARD",
          card: { flowMode: "DIRECT", easyPay: "TOSSPAY" },
          ...commonParams,
        });
      } else {
        await payment.requestPayment({ method: "CARD", ...commonParams });
      }
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err?.code === "PAY_PROCESS_CANCELED") {
        setError("결제가 취소되었습니다.");
      } else {
        setError(err?.message || "결제 중 오류가 발생했습니다.");
      }
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#0d0d1a] text-white flex flex-col items-center px-4 py-10">
      {/* 헤더 */}
      <div className="w-full max-w-sm mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition text-sm">
          ← 뒤로
        </button>
      </div>

      {/* 상품 카드 */}
      <div className="w-full max-w-sm bg-gradient-to-br from-pink-600/10 to-violet-600/10 border border-pink-500/25 rounded-3xl p-6 mb-6">
        <div className="text-5xl mb-3 text-center">✨</div>
        <h1 className="text-xl font-black text-center text-white mb-1">매력 프리미엄 보고서</h1>
        <p className="text-sm text-gray-400 text-center mb-5">
          {name ? `${name}님의 ` : ""}사주에서 드러나는 매력을 완전 분석합니다.
        </p>

        <ul className="space-y-2.5 mb-6">
          {[
            "오행별 개운법 완전판 (방향·시간·음식·향기·액세서리·인테리어)",
            "AI 매력 인사이트 맞춤 분석",
            "연애 전술 3가지 (이성 공략법)",
            "극관계 심층 분석 (나를 좋아할 이성)",
            "지지 매력 타입 완전 해설",
            "PDF 5장 저장 (카카오톡 전송 가능)",
          ].map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="text-pink-400 shrink-0 mt-0.5">✓</span>
              {d}
            </li>
          ))}
        </ul>

        <div className="border-t border-white/10 pt-4 flex items-center justify-between">
          <span className="text-gray-400 text-sm">결제 금액</span>
          <span className="text-2xl font-black text-pink-300">₩{amount.toLocaleString()}</span>
        </div>
      </div>

      {/* 에러 */}
      {error && (
        <div className="w-full max-w-sm mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* 약관 동의 */}
      <div className="w-full max-w-sm mb-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <div
            onClick={() => setAgreed(!agreed)}
            className={`w-5 h-5 shrink-0 mt-0.5 rounded border-2 flex items-center justify-center transition ${agreed ? "bg-pink-600 border-pink-600" : "border-white/20"}`}
          >
            {agreed && <span className="text-white text-xs">✓</span>}
          </div>
          <span className="text-xs text-gray-400 leading-relaxed">
            <button onClick={() => router.push("/terms")} className="text-pink-400 underline">이용약관</button>과{" "}
            <button onClick={() => router.push("/privacy")} className="text-pink-400 underline">개인정보처리방침</button>에 동의합니다.
            본 서비스는 사주 이론 기반의 오락용 콘텐츠이며, 결제 후 환불은{" "}
            <button onClick={() => router.push("/refund")} className="text-pink-400 underline">환불규정</button>에 따릅니다.
          </span>
        </label>
      </div>

      {/* 결제 버튼 */}
      <div className="w-full max-w-sm space-y-3">
        <button
          disabled={loading}
          onClick={() => handlePayment("TOSSPAY")}
          className="w-full py-4 rounded-2xl font-bold text-base bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-500 hover:to-violet-500 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-2xl shadow-pink-900/40"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              결제 처리 중...
            </>
          ) : (
            `💙 토스페이로 결제 ₩${amount.toLocaleString()}`
          )}
        </button>
        <button
          disabled={loading}
          onClick={() => handlePayment("CARD")}
          className="w-full py-4 rounded-2xl font-bold text-base bg-white/5 border border-white/15 hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-300"
        >
          💳 카드 / 카카오페이
        </button>
      </div>

      <p className="text-xs text-gray-700 mt-6 text-center">
        안전한 토스 결제 · SSL 암호화 보호
      </p>
    </main>
  );
}

export default function CharmPayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-pink-400/30 border-t-pink-400 rounded-full animate-spin" />
      </div>
    }>
      <CharmPayContent />
    </Suspense>
  );
}

"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";

export const dynamic = "force-dynamic";

function OvercomePayContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId") || "";
  const amount = Number(params.get("amount") || 990);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (!orderId) router.replace("/overcome");
  }, [orderId, router]);

  async function handlePayment(payMethod: string) {
    if (!agreed) { setError("이용약관에 동의해주세요."); return; }
    if (!orderId) { setError("주문 정보가 없습니다. 다시 시도해주세요."); return; }
    setLoading(true);
    setError("");
    try {
      if (email) sessionStorage.setItem("receiptEmail", email);
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });
      const base = typeof window !== "undefined" ? window.location.origin : "";
      const commonParams = {
        amount: { currency: "KRW" as const, value: amount },
        orderId,
        orderName: "사주 극복법 맞춤 분석",
        successUrl: `${base}/overcome/success?orderId=${orderId}&amount=${amount}`,
        failUrl: `${base}/overcome/pay?orderId=${orderId}&amount=${amount}&error=true`,
        customerName: "고객",
      };
      if (payMethod === "TOSSPAY") {
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
      <div className="w-full max-w-sm mb-6 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition text-sm">← 뒤로</button>
      </div>

      <div className="w-full max-w-sm rounded-3xl p-6 mb-6"
        style={{ background: "linear-gradient(135deg, rgba(220,38,38,0.1) 0%, rgba(124,58,237,0.1) 100%)", border: "1px solid rgba(220,38,38,0.25)" }}>
        <div className="text-5xl mb-3 text-center">⚡</div>
        <h1 className="text-xl font-black text-center text-white mb-1">사주 극복법 맞춤 분석</h1>
        <p className="text-sm text-gray-400 text-center mb-5">내 사주의 신살과 오행 불균형만 추출해 극복법을 알려드립니다.</p>

        <ul className="space-y-2.5 mb-6">
          {[
            "내 사주에서 발견된 신살 극복법 (해당 신살만)",
            "과다·부족 오행 맞춤 극복 가이드",
            "내 오행별 개운 색상·방향·음식·물건",
            "건강 취약 부위와 관리법",
          ].map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="text-red-400 shrink-0 mt-0.5">✓</span>{d}
            </li>
          ))}
        </ul>

        <div className="border-t border-white/10 pt-4 flex items-center justify-between">
          <span className="text-gray-400 text-sm">결제 금액</span>
          <span className="text-2xl font-black text-red-300">₩{amount.toLocaleString()}</span>
        </div>
      </div>

      <div className="w-full max-w-sm mb-4">
        <label className="block text-xs text-gray-500 mb-1.5">영수증 받을 이메일 (선택)</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)}
          placeholder="example@email.com"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50" />
      </div>

      {error && (
        <div className="w-full max-w-sm mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">{error}</div>
      )}

      <div className="w-full max-w-sm mb-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <div onClick={() => setAgreed(!agreed)}
            className={`w-5 h-5 shrink-0 mt-0.5 rounded border-2 flex items-center justify-center transition ${agreed ? "bg-red-600 border-red-600" : "border-white/20"}`}>
            {agreed && <span className="text-white text-xs">✓</span>}
          </div>
          <span className="text-xs text-gray-400 leading-relaxed">
            <button onClick={() => router.push("/terms")} className="text-red-400 underline">이용약관</button>과{" "}
            <button onClick={() => router.push("/privacy")} className="text-red-400 underline">개인정보처리방침</button>에 동의합니다.
            결제 후 환불은 <button onClick={() => router.push("/refund")} className="text-red-400 underline">환불규정</button>에 따릅니다.
          </span>
        </label>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <button disabled={loading} onClick={() => handlePayment("TOSSPAY")}
          className="w-full py-4 rounded-2xl font-bold text-base active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-2xl"
          style={{ background: "linear-gradient(135deg, #dc2626 0%, #7c3aed 100%)", boxShadow: "0 8px 30px rgba(220,38,38,0.3)" }}>
          {loading ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />결제 처리 중...</>
          ) : `💙 토스페이로 결제 ₩${amount.toLocaleString()}`}
        </button>
        <button disabled={loading} onClick={() => handlePayment("CARD")}
          className="w-full py-4 rounded-2xl font-bold text-base bg-white/5 border border-white/15 hover:bg-white/10 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-gray-300">
          💳 카드 / 카카오페이
        </button>
      </div>

      <p className="text-xs text-gray-700 mt-6 text-center">안전한 토스 결제 · SSL 암호화 보호</p>
    </main>
  );
}

export default function OvercomePayPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#06060e] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-red-400/30 border-t-red-400 rounded-full animate-spin" />
      </div>
    }>
      <OvercomePayContent />
    </Suspense>
  );
}

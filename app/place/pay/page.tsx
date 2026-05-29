"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";

export const dynamic = "force-dynamic";

function PlacePayContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId") || "";
  const amount = Number(params.get("amount") || 990);
  const el = params.get("el") || "토";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (params.get("error") === "true") setError("결제가 취소되었거나 실패하였습니다.");
  }, [params]);

  async function handlePayment(payMethod: string) {
    if (!agreed) { setError("이용약관에 동의해주세요."); return; }
    if (!orderId) { setError("주문 정보가 없습니다."); return; }
    setLoading(true); setError("");
    try {
      if (email) sessionStorage.setItem("receiptEmail", email);
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });
      const base = window.location.origin;
      const commonParams = {
        amount: { currency: "KRW" as const, value: amount },
        orderId,
        orderName: "사주 도시 추천 완전 분석",
        successUrl: `${base}/place/result?orderId=${orderId}&amount=${amount}&el=${el}`,
        failUrl: `${base}/place/pay?orderId=${orderId}&amount=${amount}&el=${el}&error=true`,
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
      <div className="w-full max-w-sm mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition text-sm">← 뒤로</button>
      </div>

      <div className="w-full max-w-sm bg-gradient-to-br from-violet-950/60 to-indigo-950/60 border border-violet-700/30 rounded-3xl p-6 mb-6">
        <div className="text-5xl mb-3 text-center">🌍</div>
        <h1 className="text-xl font-black text-center text-white mb-1">사주 도시 추천 완전판</h1>
        <p className="text-sm text-gray-400 text-center mb-5">5개 오행 전체 도시 추천 + 방위 분석</p>
        <ul className="space-y-2.5 mb-6">
          {[
            "해외 2·3순위 국가 완전 공개",
            "5개 오행 전체 한국 도시 비교",
            "용신 오행별 주의해야 할 방향",
            "해외 이민·유학·출장 적합도",
          ].map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="text-violet-400 shrink-0 mt-0.5">✓</span>{d}
            </li>
          ))}
        </ul>
        <div className="border-t border-white/10 pt-4 flex items-center justify-between">
          <span className="text-gray-400 text-sm">결제 금액</span>
          <span className="text-2xl font-black text-violet-300">₩{amount.toLocaleString()}</span>
        </div>
      </div>

      {/* 이메일 (선택) */}
      <div className="w-full max-w-sm mb-4">
        <label className="block text-xs text-gray-500 mb-1.5">영수증 받을 이메일 (선택)</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="example@email.com"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-violet-500/50"
        />
      </div>

      {error && (
        <div className="w-full max-w-sm mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">{error}</div>
      )}

      <div className="w-full max-w-sm mb-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <div
            onClick={() => setAgreed(!agreed)}
            className={`w-5 h-5 shrink-0 mt-0.5 rounded border-2 flex items-center justify-center transition ${agreed ? "bg-violet-600 border-violet-600" : "border-white/20"}`}
          >
            {agreed && <span className="text-white text-xs font-bold">✓</span>}
          </div>
          <span className="text-xs text-gray-400 leading-relaxed">
            <a href="/terms" target="_blank" className="text-violet-400 underline">이용약관</a>,{" "}
            <a href="/privacy" target="_blank" className="text-violet-400 underline">개인정보처리방침</a>,{" "}
            <a href="/refund" target="_blank" className="text-violet-400 underline">환불규정</a>에 동의합니다.
          </span>
        </label>
      </div>

      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={() => handlePayment("TOSSPAY")}
          disabled={loading || !agreed}
          className="w-full py-4 rounded-2xl font-black text-base transition-all disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #3182f6, #1971f6)", color: "#fff" }}
        >
          {loading ? "처리 중..." : "토스페이로 결제"}
        </button>
        <button
          onClick={() => handlePayment("CARD")}
          disabled={loading || !agreed}
          className="w-full py-4 rounded-2xl bg-white/10 hover:bg-white/15 font-bold text-sm transition-all disabled:opacity-40"
        >
          {loading ? "처리 중..." : "신용카드로 결제"}
        </button>
      </div>
    </main>
  );
}

export default function PlacePayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#06060e] flex items-center justify-center"><p className="text-gray-500 text-sm">로딩 중...</p></div>}>
      <PlacePayContent />
    </Suspense>
  );
}

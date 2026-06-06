"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";

export const dynamic = "force-dynamic";

function DaewoonPayContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId") || "";
  const amount = Number(params.get("amount") || 15000);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("daewoonData");
      if (raw) setName(JSON.parse(raw).name || "");
    } catch {}
    if (params.get("error") === "true") setError("결제가 취소되었거나 실패하였습니다.");
  }, [params]);

  async function handlePayment(payMethod: string) {
    if (!agreed) { setError("이용약관에 동의해주세요."); return; }
    if (!orderId) { setError("주문 정보가 없습니다. 다시 시도해주세요."); return; }
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
        orderName: "대운·세운 프리미엄 보고서",
        successUrl: `${base}/service/daewoon/success?orderId=${orderId}&amount=${amount}`,
        failUrl: `${base}/service/daewoon/pay?orderId=${orderId}&amount=${amount}&error=true`,
        customerName: name || "고객",
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
    <main className="min-h-screen bg-[#0d0700] text-white flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-sm mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition text-sm">← 뒤로</button>
      </div>

      {/* 상품 카드 */}
      <div className="w-full max-w-sm bg-gradient-to-br from-amber-950/60 to-yellow-950/60 border border-yellow-700/30 rounded-3xl p-6 mb-6">
        <div className="text-5xl mb-3 text-center">⏳</div>
        <h1 className="text-xl font-black text-center text-white mb-1">대운·세운 프리미엄 보고서</h1>
        <p className="text-sm text-gray-400 text-center mb-5">
          {name ? `${name}님의 ` : ""}인생 대운 흐름 완전 분석
        </p>
        <ul className="space-y-2.5 mb-6">
          {[
            "대운 8개 전체 공개 (80년 인생 흐름)",
            "세운 14년치 상세 (현재 ±7년)",
            "교운기 진입 나이 정확 계산",
            "대운별 십성·12운성 완전 해설",
            "AI 대운별 인생 전략 조언",
            "PDF 다운로드 포함",
          ].map((d, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="text-yellow-400 shrink-0 mt-0.5">✓</span>{d}
            </li>
          ))}
        </ul>
        <div className="border-t border-white/10 pt-4 flex items-center justify-between">
          <span className="text-gray-400 text-sm">결제 금액</span>
          <span className="text-2xl font-black text-yellow-400">₩{amount.toLocaleString()}</span>
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
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-yellow-500/50"
        />
      </div>

      {error && (
        <div className="w-full max-w-sm mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">{error}</div>
      )}

      {/* 약관 */}
      <div className="w-full max-w-sm mb-5">
        <label className="flex items-start gap-3 cursor-pointer">
          <div
            onClick={() => setAgreed(!agreed)}
            className={`w-5 h-5 shrink-0 mt-0.5 rounded border-2 flex items-center justify-center transition ${agreed ? "bg-yellow-600 border-yellow-600" : "border-white/20"}`}
          >
            {agreed && <span className="text-white text-xs font-bold">✓</span>}
          </div>
          <span className="text-xs text-gray-400 leading-relaxed">
            <a href="/terms" target="_blank" className="text-yellow-400 underline">이용약관</a>,{" "}
            <a href="/privacy" target="_blank" className="text-yellow-400 underline">개인정보처리방침</a>,{" "}
            <a href="/refund" target="_blank" className="text-yellow-400 underline">환불규정</a>에 동의합니다.
            AI 생성 콘텐츠는 참고용이며 투자·의료 조언이 아닙니다.
          </span>
        </label>
      </div>

      {/* 결제 버튼들 */}
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

      <p className="text-xs text-gray-600 text-center mt-4 leading-relaxed max-w-sm">
        Toss Payments를 통해 안전하게 처리됩니다.
        AI 생성 콘텐츠 특성상 결제 후 생성 시작 시점부터 환불이 제한될 수 있습니다.
      </p>
    </main>
  );
}

export default function DaewoonPayPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#0d0700] flex items-center justify-center"><p className="text-gray-500 text-sm">로딩 중...</p></div>}><DaewoonPayContent /></Suspense>;
}

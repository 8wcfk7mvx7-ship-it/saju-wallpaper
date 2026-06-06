"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";

export const dynamic = "force-dynamic";

const PRICE = 4900;
const BLUEBERRY_PRICE = 4900;

function HotCompatPayContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId") || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [blueberries, setBlueberries] = useState(0);

  useEffect(() => {
    if (params.get("error") === "true") setError("결제가 취소되었거나 실패하였습니다.");
    const bb = parseInt(localStorage.getItem("sp_blueberries") ?? "0", 10);
    setBlueberries(isNaN(bb) ? 0 : bb);
  }, [params]);

  async function handleCardPayment() {
    if (!agreed) { setError("이용약관에 동의해주세요."); return; }
    if (!orderId) { setError("주문 정보가 없습니다."); return; }
    setLoading(true); setError("");
    try {
      const tossPayments = await loadTossPayments(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });
      const base = window.location.origin;
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW" as const, value: PRICE },
        orderId,
        orderName: "19금 사주 궁합 완전 분석",
        successUrl: `${base}/service/hotcompat/success?orderId=${orderId}`,
        failUrl: `${base}/service/hotcompat/pay?orderId=${orderId}&error=true`,
        customerName: "고객",
      });
    } catch (e: unknown) {
      const err = e as { code?: string; message?: string };
      if (err?.code === "PAY_PROCESS_CANCELED") setError("결제가 취소되었습니다.");
      else setError(err?.message || "결제 중 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  function handleBlueberryPayment() {
    if (!agreed) { setError("이용약관에 동의해주세요."); return; }
    if (blueberries < BLUEBERRY_PRICE) {
      setError(`별조각가 부족합니다. 현재 ${blueberries.toLocaleString()}개 / 필요 ${BLUEBERRY_PRICE.toLocaleString()}개`);
      return;
    }
    const newAmount = blueberries - BLUEBERRY_PRICE;
    localStorage.setItem("sp_blueberries", String(newAmount));
    localStorage.setItem("sp_hotcompat_paid", "true");
    router.replace("/service/hotcompat/success?method=blueberry");
  }

  const canAffordBlueberry = blueberries >= BLUEBERRY_PRICE;

  return (
    <main className="min-h-screen bg-[#08010f] text-white flex flex-col items-center px-4 py-10">
      <div className="w-full max-w-sm mb-6">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition text-sm">← 뒤로</button>
      </div>

      <div className="w-full max-w-sm">
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
            <span className="text-sm font-black text-rose-400">₩{PRICE.toLocaleString()}</span>
          </div>
          <ul className="space-y-1.5 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
            <li>✓ 성적 케미 등급 + 점수 전체 공개</li>
            <li>✓ 합충파해 상세 분석 (정임합·자오충 등)</li>
            <li>✓ 도화살·홍염살 진단</li>
            <li>✓ 일주별 성적 특성 완전 분석</li>
          </ul>
        </div>

        {/* 별조각 현황 */}
        <div className="rounded-2xl p-4 mb-5" style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">⭐</span>
              <div>
                <p className="text-xs" style={{ color: "#a78bfa" }}>내 별조각</p>
                <p className="text-base font-black text-white">{blueberries.toLocaleString()}개</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>필요</p>
              <p className="text-base font-black" style={{ color: canAffordBlueberry ? "#a78bfa" : "#f87171" }}>
                {BLUEBERRY_PRICE.toLocaleString()}개
              </p>
            </div>
          </div>
        </div>

        {/* 동의 */}
        <div className="mb-5">
          <button
            onClick={() => setAgreed(v => !v)}
            className="w-full flex items-start gap-2.5 px-4 py-3 rounded-xl border text-sm text-left transition"
            style={{
              borderColor: agreed ? "rgba(244,63,94,0.4)" : "rgba(255,255,255,0.1)",
              background: agreed ? "rgba(244,63,94,0.08)" : "rgba(255,255,255,0.03)",
              color: agreed ? "#fb7185" : "rgba(255,255,255,0.5)",
            }}
          >
            <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 ${agreed ? "border-rose-400" : "border-gray-600"}`}>
              {agreed && <span className="text-[10px] font-black">✓</span>}
            </span>
            <span>이용약관 및 환불규정에 동의합니다. 결제 완료 후 환불이 불가합니다.</span>
          </button>
        </div>

        {error && (
          <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2 mb-4">{error}</p>
        )}

        <div className="space-y-2.5">
          {/* 별조각 결제 */}
          <button
            onClick={handleBlueberryPayment}
            disabled={loading || !agreed || !canAffordBlueberry}
            className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-[0.98] disabled:opacity-40"
            style={{
              background: canAffordBlueberry ? "linear-gradient(135deg, #6366f1, #818cf8)" : "rgba(99,102,241,0.3)",
              color: "#fff",
              boxShadow: canAffordBlueberry ? "0 6px 24px rgba(99,102,241,0.4)" : "none",
            }}
          >
            ⭐ 별조각 {BLUEBERRY_PRICE.toLocaleString()}개로 결제
            {!canAffordBlueberry && <span className="text-xs ml-1 opacity-70">(부족)</span>}
          </button>

          {/* 카드 결제 */}
          <button
            onClick={handleCardPayment}
            disabled={loading || !agreed}
            className="w-full py-3.5 rounded-2xl font-black text-sm transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #be123c, #f43f5e)", color: "#fff", boxShadow: "0 4px 16px rgba(244,63,94,0.3)" }}
          >
            {loading ? "처리 중..." : `카드로 ₩${PRICE.toLocaleString()} 결제`}
          </button>

          {!canAffordBlueberry && (
            <button
              onClick={() => router.push("/charge")}
              className="w-full py-3 rounded-2xl font-bold text-sm transition-all"
              style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)", color: "#a78bfa" }}
            >
              ⭐ 별조각 충전하기
            </button>
          )}
        </div>

        <p className="text-center text-[11px] mt-4" style={{ color: "rgba(255,255,255,0.2)" }}>
          결제는 토스페이먼츠(주)를 통해 안전하게 처리됩니다
        </p>
      </div>
    </main>
  );
}

export default function HotCompatPayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#08010f] flex items-center justify-center text-white">로딩 중...</div>}>
      <HotCompatPayContent />
    </Suspense>
  );
}

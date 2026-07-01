"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import PaymentMethodSelector, { type PaymentMethod } from "@/components/PaymentMethodSelector";
import { getBalanceServer, deductBalanceServer } from "@/lib/blueberry";

const PRODUCT_INFO: Record<string, { name: string; desc: string; icon: string; detail: string[] }> = {
  mobile: {
    name: "사주 오행 배경화면",
    icon: "🖼",
    desc: "AI가 당신의 오행 에너지에 맞춘 맞춤형 배경화면 3장을 생성합니다.",
    detail: ["AI 맞춤 배경화면 3장", "오행 균형 최적화 디자인", "낮/밤/추상 3가지 테마", "고해상도 스마트폰 최적화"],
  },
  report: {
    name: "사주 상세 PDF 보고서",
    icon: "📄",
    desc: "AI가 당신의 사주를 심층 분석한 10페이지 전문 보고서를 생성합니다.",
    detail: ["AI 심층 분석 10페이지 보고서", "오행·용신·신살 상세 분석", "직업·재물·건강·인간관계 운세", "PDF 저장 가능"],
  },
  bundle: {
    name: "배경화면 + 상세 보고서 패키지",
    icon: "✨",
    desc: "AI 맞춤 배경화면 3장과 10페이지 심층 보고서를 함께 받아보세요.",
    detail: ["AI 맞춤 배경화면 3장", "AI 심층 분석 10페이지 보고서", "오행·용신·신살 완전 분석", "PDF 저장 + 고해상도 이미지"],
  },
};

const PRICE_LABELS: Record<string, string> = {
  mobile: "₩2,900",
  report: "₩8,900",
  bundle: "₩9,900",
};

function PaymentContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId") || "";
  const productType = params.get("productType") || "mobile";
  const amount = Number(params.get("amount") || 2900);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [payMethod, setPayMethod] = useState<PaymentMethod>("card");
  const [starBalance, setStarBalance] = useState(0);

  const info = PRODUCT_INFO[productType] || PRODUCT_INFO.mobile;

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("sajuForm");
      if (raw) {
        const f = JSON.parse(raw);
        setName(f.name || "");
      }
    } catch {}
    getBalanceServer().then(setStarBalance);
  }, []);

  async function handlePayment() {
    if (!orderId) {
      setError("주문 정보가 없습니다. 뒤로 가서 다시 시도해주세요.");
      return;
    }
    setLoading(true);
    setError("");

    if (payMethod === "starpiece") {
      if (!await deductBalanceServer(amount)) { setError("별조각이 부족합니다."); setLoading(false); return; }
      router.push(`/payment/success?productType=${productType}&orderId=${orderId}&amount=${amount}&paymentKey=STARPIECE`);
      return;
    }

    try {
      if (email) sessionStorage.setItem("receiptEmail", email);
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;
      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });

      const base = typeof window !== "undefined" ? window.location.origin : "";

      const commonParams = {
        amount: { currency: "KRW" as const, value: amount },
        orderId,
        orderName: `사주팔자 ${info.name}`,
        successUrl: `${base}/payment/success?productType=${productType}`,
        failUrl: `${base}/payment/fail`,
        customerName: name || "고객",
      };

      if (payMethod === "easypay") {
        // 토스페이 직접 호출: card.flowMode=DIRECT + card.easyPay
        await payment.requestPayment({
          method: "CARD",
          card: { flowMode: "DIRECT", easyPay: "TOSSPAY" },
          ...commonParams,
        });
      } else {
        // 일반 카드/간편결제 통합결제창 (카카오페이 등 내부에서 선택 가능)
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
    <div className="min-h-screen bg-[#0d0d1a] text-white flex flex-col items-center justify-center px-4 py-12">
      {/* 헤더 */}
      <div className="w-full max-w-2xl mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1"
        >
          ← 뒤로
        </button>
      </div>

      {/* 상품 카드 */}
      <div className="w-full max-w-2xl bg-white/5 border border-white/10 rounded-2xl p-6 mb-6">
        <div className="text-4xl mb-3 text-center">{info.icon}</div>
        <h1 className="text-xl font-bold text-center text-white mb-1">{info.name}</h1>
        <p className="text-sm text-gray-400 text-center mb-5">{info.desc}</p>

        {/* 포함 내용 */}
        <ul className="space-y-2 mb-6">
          {info.detail.map((d, i) => (
            <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
              <span className="text-indigo-400">✓</span>
              {d}
            </li>
          ))}
        </ul>

        {/* 가격 */}
        <div className="border-t border-white/10 pt-4 flex items-center justify-between">
          <span className="text-gray-400 text-sm">결제 금액</span>
          <span className="text-2xl font-black text-indigo-300">{PRICE_LABELS[productType]}</span>
        </div>
      </div>

      {/* 이메일 (선택) */}
      <div className="w-full max-w-2xl mb-4">
        <label className="block text-xs text-gray-500 mb-1.5">영수증 받을 이메일 (선택)</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="example@email.com"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50"
        />
      </div>

      {/* 에러 */}
      {error && (
        <div className="w-full max-w-2xl mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {/* 결제 버튼들 */}
      <div className="w-full max-w-2xl">
        <PaymentMethodSelector
          amount={amount}
          selected={payMethod}
          onSelect={setPayMethod}
          starBalance={starBalance}
          loading={loading}
          onConfirm={handlePayment}
        />
      </div>

      {/* 안내 */}
      <p className="mt-6 text-xs text-gray-500 text-center max-w-sm leading-relaxed">
        결제는 토스페이먼츠를 통해 안전하게 처리됩니다.<br />
        결제 완료 후 AI 생성이 즉시 시작됩니다.
      </p>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0d0d1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-400/30 border-t-indigo-400 rounded-full animate-spin" />
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}

"use client";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BackButton from "@/components/BackButton";
import PaymentMethodSelector, { type PaymentMethod } from "@/components/PaymentMethodSelector";
import { getBalance, deductBalance } from "@/lib/blueberry";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";

export const dynamic = "force-dynamic";

const STEPS = [
  { n: 1, label: "입력정보 확인" },
  { n: 2, label: "이메일 인증" },
  { n: 3, label: "안전결제" },
];

type OvercomeForm = { name: string; year: number; month: number; day: number; hour: string; gender: string };

function StepBar({ step }: { step: number }) {
  return (
    <div className="w-full max-w-sm flex items-center justify-between mb-6">
      {STEPS.map((s, i) => (
        <div key={s.n} className="flex items-center flex-1">
          <div className="flex flex-col items-center flex-1">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all ${
              step >= s.n ? "text-white" : "text-gray-500"
            }`} style={{ background: step >= s.n ? "linear-gradient(135deg, #dc2626, #7c3aed)" : "rgba(255,255,255,0.06)" }}>
              {s.n}
            </div>
            <span className={`text-[10px] mt-1.5 text-center ${step >= s.n ? "text-white font-bold" : "text-gray-600"}`}>{s.label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="h-0.5 flex-1 -mt-4" style={{ background: step > s.n ? "linear-gradient(90deg, #dc2626, #7c3aed)" : "rgba(255,255,255,0.08)" }} />
          )}
        </div>
      ))}
    </div>
  );
}

function OvercomePayContent() {
  const router = useRouter();
  const params = useSearchParams();
  const orderId = params.get("orderId") || "";
  const amount = Number(params.get("amount") || 990);

  const [step, setStep] = useState(1);
  const [info, setInfo] = useState<OvercomeForm | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [starBalance, setStarBalance] = useState(0);

  useEffect(() => {
    if (!orderId) { router.replace("/service/overcome"); return; }
    try {
      const raw = sessionStorage.getItem("overcomeData");
      if (raw) setInfo(JSON.parse(raw).form ?? null);
    } catch {}
    setStarBalance(getBalance());
  }, [orderId, router]);

  function sendCode() {
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError("올바른 이메일 주소를 입력해주세요."); return; }
    setError("");
    sessionStorage.setItem("receiptEmail", email);
    setCodeSent(true);
  }

  function verifyCode() {
    if (code.trim().length < 4) { setError("이메일로 받은 인증 코드를 입력해주세요."); return; }
    setError("");
    setStep(3);
  }

  async function handlePayment() {
    if (!agreed) { setError("이용약관에 동의해주세요."); return; }
    if (!orderId) { setError("주문 정보가 없습니다. 다시 시도해주세요."); return; }
    setLoading(true);
    setError("");

    if (method === "starpiece") {
      if (!deductBalance(amount)) { setError("별조각이 부족합니다."); setLoading(false); return; }
      router.push(`/service/overcome/success?orderId=${orderId}&amount=${amount}&paymentKey=STARPIECE`);
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
        orderName: "사주 극복법 맞춤 분석",
        successUrl: `${base}/service/overcome/success?orderId=${orderId}&amount=${amount}`,
        failUrl: `${base}/service/overcome/pay?orderId=${orderId}&amount=${amount}&error=true`,
        customerName: info?.name || "고객",
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

  const calendarLabel = info ? `${info.year}년 ${info.month}월 ${info.day}일` : "-";
  const genderLabel = info?.gender === "male" ? "남자" : info?.gender === "female" ? "여자" : "-";

  return (
    <main className="min-h-screen bg-[#06060e] text-white flex flex-col items-center px-4 py-10">
      <BackButton />

      <h1 className="text-2xl font-black text-center mb-1 mt-4">결제 전 확인이에요</h1>
      <p className="text-sm text-gray-500 text-center mb-6">입력하신 정보를 확인한 뒤 이메일 인증 후 안전결제로 이동합니다</p>

      <StepBar step={step} />

      {/* Step 1: 정보 확인 */}
      {step === 1 && (
        <div className="w-full max-w-sm">
          <div className="rounded-3xl p-6 mb-6"
            style={{ background: "linear-gradient(135deg, rgba(220,38,38,0.1) 0%, rgba(124,58,237,0.1) 100%)", border: "1px solid rgba(220,38,38,0.25)" }}>
            <div className="text-5xl mb-3 text-center">⚡</div>
            <h2 className="text-xl font-black text-center text-white mb-1">사주 극복법 맞춤 분석</h2>
            <p className="text-sm text-gray-400 text-center mb-5">내 사주의 신살과 오행 불균형만 추출해 극복법을 알려드립니다.</p>

            <div className="bg-white/5 rounded-2xl p-4 mb-4 space-y-2">
              <p className="text-xs text-gray-500 font-bold mb-1">입력 정보</p>
              <div className="flex justify-between text-sm"><span className="text-gray-400">이름</span><span className="font-bold">{info?.name || "사용자"} / {genderLabel}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-400">생년월일</span><span className="font-bold">{calendarLabel} {info?.hour ? `(${info.hour})` : ""}</span></div>
            </div>

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

          <button onClick={() => setStep(2)}
            className="w-full py-4 rounded-2xl font-black text-base active:scale-95 transition-all shadow-2xl"
            style={{ background: "linear-gradient(135deg, #dc2626 0%, #7c3aed 100%)", boxShadow: "0 8px 30px rgba(220,38,38,0.3)" }}>
            정보 확인 완료, 다음 →
          </button>
          <p className="text-center text-xs text-gray-600 mt-3">정보가 다르면 뒤로 가서 다시 입력해주세요. 결제 후에는 정보 수정이 어렵습니다.</p>
        </div>
      )}

      {/* Step 2: 이메일 인증 */}
      {step === 2 && (
        <div className="w-full max-w-sm">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
            <h2 className="text-lg font-black mb-1">이메일 인증</h2>
            <p className="text-xs text-gray-500 mb-5">결제 확인서와 분석 결과 다시보기에 사용할 이메일입니다.</p>

            <label className="block text-xs text-gray-500 mb-1.5">이메일</label>
            <div className="flex gap-2 mb-2">
              <input type="email" value={email} onChange={e => { setEmail(e.target.value); setCodeSent(false); }}
                placeholder="you@example.com"
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50" />
              <button onClick={sendCode}
                className="shrink-0 px-4 rounded-xl text-xs font-bold border border-red-500/40 text-red-300 hover:bg-red-500/10 transition">
                {codeSent ? "재전송" : "코드 받기"}
              </button>
            </div>

            {codeSent && (
              <>
                <p className="text-xs text-emerald-400 mb-3">인증 코드를 이메일로 보냈어요. 받은 코드를 입력해주세요.</p>
                <label className="block text-xs text-gray-500 mb-1.5">인증 코드</label>
                <input value={code} onChange={e => setCode(e.target.value)}
                  placeholder="인증 코드 입력"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-red-500/50 mb-1" />
              </>
            )}
          </div>

          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">{error}</div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(1)}
              className="flex-1 py-4 rounded-2xl font-bold text-sm bg-white/5 border border-white/15 text-gray-300 active:scale-95 transition-all">
              ← 이전
            </button>
            <button onClick={verifyCode} disabled={!codeSent}
              className="flex-1 py-4 rounded-2xl font-black text-sm active:scale-95 transition-all disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #dc2626 0%, #7c3aed 100%)" }}>
              인증 완료, 다음 →
            </button>
          </div>
        </div>
      )}

      {/* Step 3: 안전결제 */}
      {step === 3 && (
        <div className="w-full max-w-sm">
          <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-400 text-sm">결제 금액</span>
              <span className="text-2xl font-black text-red-300">₩{amount.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-600">사주 극복법 맞춤 분석 · {info?.name || "사용자"}님</p>
          </div>

          {error && (
            <div className="w-full mb-4 bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm text-center">{error}</div>
          )}

          <div className="w-full mb-5">
            <label className="flex items-start gap-3 cursor-pointer">
              <div onClick={() => setAgreed(!agreed)}
                className={`w-5 h-5 shrink-0 mt-0.5 rounded border-2 flex items-center justify-center transition ${agreed ? "bg-red-600 border-red-600" : "border-white/20"}`}>
                {agreed && <span className="text-white text-xs">✓</span>}
              </div>
              <span className="text-xs text-gray-400 leading-relaxed">
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-red-400 underline">이용약관</a>과{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-red-400 underline">개인정보처리방침</a>에 동의합니다.
                결제 후 환불은 <a href="/refund" target="_blank" rel="noopener noreferrer" className="text-red-400 underline">환불규정</a>에 따릅니다.
              </span>
            </label>
          </div>

          <div className="w-full space-y-3">
            <PaymentMethodSelector
              amount={amount}
              selected={method}
              onSelect={setMethod}
              starBalance={starBalance}
              disabled={!agreed}
              loading={loading}
              onConfirm={handlePayment}
            />
            <button onClick={() => setStep(2)} disabled={loading}
              className="w-full py-3 rounded-2xl font-bold text-xs text-gray-500 hover:text-gray-300 transition disabled:opacity-50">
              ← 이전 단계로
            </button>
          </div>

          <p className="text-xs text-gray-700 mt-6 text-center">안전한 토스 결제 · SSL 암호화 보호</p>
        </div>
      )}
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

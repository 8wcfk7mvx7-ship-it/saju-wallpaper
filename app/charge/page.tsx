"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBalance, addBalance } from "@/lib/blueberry";

const TIERS = [
  { won: 1000,  base: 1000,  bonus: 100,  total: 1100 },
  { won: 3000,  base: 3000,  bonus: 300,  total: 3300 },
  { won: 5000,  base: 5000,  bonus: 500,  total: 5500,  popular: true },
  { won: 10000, base: 10000, bonus: 1000, total: 11000 },
  { won: 30000, base: 30000, bonus: 3000, total: 33000 },
  { won: 50000, base: 50000, bonus: 5000, total: 55000 },
];

export default function ChargePage() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [justCharged, setJustCharged] = useState<number | null>(null);

  useEffect(() => {
    setBalance(getBalance());
  }, []);

  async function handleCharge() {
    if (selected === null) return;
    const tier = TIERS[selected];

    // 개발/데모 모드: Toss 결제 없이 바로 충전 (TODO: 실 결제 연동)
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const next = addBalance(tier.total);
    setBalance(next);
    setJustCharged(tier.total);
    setSelected(null);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#06060e] text-white flex flex-col">
      {/* 배경 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full bg-indigo-950/60 blur-[220px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-violet-950/40 blur-[180px]" />
      </div>

      {/* 헤더 */}
      <div className="relative z-10 flex items-center gap-3 px-5 pt-5">
        <button onClick={() => router.back()}
          className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          ← 뒤로
        </button>
      </div>

      <div className="relative z-10 max-w-md mx-auto w-full px-5 pt-10 pb-24">

        {/* 헤더 */}
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🫐</div>
          <h1 className="text-2xl font-black mb-1">블루베리 충전</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            충전 시 <span style={{ color: "#a78bfa" }}>+10% 보너스</span> 블루베리 추가 지급
          </p>
        </div>

        {/* 현재 잔액 */}
        <div className="rounded-2xl p-5 mb-8 text-center"
          style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)" }}>
          <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>현재 잔액</p>
          <p className="text-3xl font-black" style={{ color: "#a78bfa" }}>
            🫐 {balance.toLocaleString()}
          </p>
          <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>블루베리</p>
        </div>

        {/* 충전 성공 메시지 */}
        {justCharged !== null && (
          <div className="rounded-2xl p-4 mb-6 text-center"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <p className="text-sm font-bold" style={{ color: "#6ee7b7" }}>
              ✓ {justCharged.toLocaleString()} 블루베리 충전 완료!
            </p>
          </div>
        )}

        {/* 충전 티어 */}
        <div className="space-y-3 mb-8">
          {TIERS.map((tier, i) => (
            <button
              key={i}
              onClick={() => setSelected(i === selected ? null : i)}
              className="w-full rounded-2xl p-4 text-left transition-all relative"
              style={{
                background: selected === i
                  ? "rgba(99,102,241,0.18)"
                  : "rgba(255,255,255,0.04)",
                border: selected === i
                  ? "1.5px solid rgba(99,102,241,0.5)"
                  : "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {tier.popular && (
                <div className="absolute -top-2.5 left-4">
                  <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full"
                    style={{ background: "rgba(201,168,76,0.9)", color: "#1a0f00" }}>
                    인기
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-black text-base text-white">
                    {tier.won.toLocaleString()}원
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                    🫐 {tier.base.toLocaleString()} + 보너스 {tier.bonus.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-lg" style={{ color: "#a78bfa" }}>
                    {tier.total.toLocaleString()}
                  </p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>블루베리</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* 결제 방식 안내 */}
        <div className="rounded-xl p-4 mb-6"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-xs font-bold mb-2 text-white">결제 방식</p>
          <div className="space-y-1.5">
            {["신용·체크카드", "카카오페이", "네이버페이", "토스페이"].map(m => (
              <div key={m} className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full" style={{ background: "rgba(201,168,76,0.5)" }} />
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{m}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 충전 버튼 */}
        <button
          onClick={handleCharge}
          disabled={selected === null || loading}
          className="w-full py-4 rounded-2xl font-black text-base transition-all"
          style={{
            background: selected !== null
              ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
              : "rgba(255,255,255,0.07)",
            color: selected !== null ? "#fff" : "rgba(255,255,255,0.25)",
            boxShadow: selected !== null ? "0 8px 28px rgba(99,102,241,0.4)" : "none",
            cursor: selected !== null ? "pointer" : "not-allowed",
          }}
        >
          {loading
            ? "처리 중..."
            : selected !== null
              ? `${TIERS[selected].won.toLocaleString()}원 결제하기`
              : "금액을 선택하세요"}
        </button>

        <p className="text-center text-xs mt-4" style={{ color: "rgba(255,255,255,0.25)" }}>
          블루베리는 Summer Palace 서비스 내에서만 사용 가능합니다.<br />
          유효기간: 충전일로부터 1년 · 환불 불가
        </p>

        {/* 블루베리 사용처 */}
        <div className="mt-10">
          <p className="text-xs font-bold mb-3" style={{ color: "rgba(255,255,255,0.5)" }}>블루베리로 이용 가능한 서비스</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { emoji: "🔮", name: "오행 배경화면", price: "AI 유료" },
              { emoji: "✨", name: "매력 분석", price: "₩1,900" },
              { emoji: "⏳", name: "대운·세운", price: "₩15,000" },
              { emoji: "🌍", name: "도시·나라 추천", price: "₩990" },
            ].map(svc => (
              <div key={svc.name} className="rounded-xl p-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="text-xl mb-1">{svc.emoji}</div>
                <p className="text-xs font-bold text-white leading-tight">{svc.name}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "#a78bfa" }}>{svc.price}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

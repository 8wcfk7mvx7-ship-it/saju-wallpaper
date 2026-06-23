"use client";

export type PaymentMethod = "card" | "easypay" | "starpiece";

const METHOD_INFO: Record<PaymentMethod, { label: string; icon: string }> = {
  card: { label: "신용카드", icon: "💳" },
  easypay: { label: "페이", icon: "⚡" },
  starpiece: { label: "별조각", icon: "✨" },
};

interface Props {
  amount: number;
  methods?: PaymentMethod[];
  selected: PaymentMethod;
  onSelect: (m: PaymentMethod) => void;
  starBalance?: number;
  disabled?: boolean;
  loading?: boolean;
  onConfirm: () => void;
}

export default function PaymentMethodSelector({
  amount,
  methods = ["card", "easypay", "starpiece"],
  selected,
  onSelect,
  starBalance = 0,
  disabled,
  loading,
  onConfirm,
}: Props) {
  const insufficientStar = selected === "starpiece" && starBalance < amount;

  return (
    <div>
      <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: `repeat(${methods.length}, minmax(0, 1fr))` }}>
        {methods.map((m) => {
          const active = selected === m;
          return (
            <button
              key={m}
              type="button"
              onClick={() => onSelect(m)}
              className="flex flex-col items-center justify-center gap-1 py-3.5 rounded-2xl border text-xs font-bold transition-all active:scale-[0.97]"
              style={{
                borderColor: active ? "rgba(244,114,182,0.5)" : "rgba(255,255,255,0.1)",
                background: active ? "rgba(219,39,119,0.12)" : "rgba(255,255,255,0.03)",
                color: active ? "#f472b6" : "rgba(255,255,255,0.6)",
              }}
            >
              <span className="text-lg">{METHOD_INFO[m].icon}</span>
              <span>{METHOD_INFO[m].label}</span>
              {m === "starpiece" && (
                <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {starBalance.toLocaleString()}개 보유
                </span>
              )}
            </button>
          );
        })}
      </div>

      {insufficientStar && (
        <p className="text-amber-400 text-xs bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2 mb-4">
          별조각이 부족합니다. {amount.toLocaleString()}개 필요 (보유 {starBalance.toLocaleString()}개)
        </p>
      )}

      <button
        onClick={onConfirm}
        disabled={disabled || loading || insufficientStar}
        className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-[0.98] disabled:opacity-40"
        style={{ background: "linear-gradient(135deg, #be185d, #ec4899)", color: "#fff", boxShadow: "0 6px 24px rgba(190,24,93,0.4)" }}
      >
        {loading ? "처리 중..." : `${amount.toLocaleString()}${selected === "starpiece" ? "개" : "원"}으로 확인하기`}
      </button>
    </div>
  );
}

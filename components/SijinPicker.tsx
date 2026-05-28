"use client";

// 십이시진 (十二時辰) — 한 시진 = 2시간
export const SIJIN = [
  { name: "자시", hanja: "子", range: "23:00~01:00", hour: 0,  minute: 0 },
  { name: "축시", hanja: "丑", range: "01:00~03:00", hour: 2,  minute: 0 },
  { name: "인시", hanja: "寅", range: "03:00~05:00", hour: 4,  minute: 0 },
  { name: "묘시", hanja: "卯", range: "05:00~07:00", hour: 6,  minute: 0 },
  { name: "진시", hanja: "辰", range: "07:00~09:00", hour: 8,  minute: 0 },
  { name: "사시", hanja: "巳", range: "09:00~11:00", hour: 10, minute: 0 },
  { name: "오시", hanja: "午", range: "11:00~13:00", hour: 12, minute: 0 },
  { name: "미시", hanja: "未", range: "13:00~15:00", hour: 14, minute: 0 },
  { name: "신시", hanja: "申", range: "15:00~17:00", hour: 16, minute: 0 },
  { name: "유시", hanja: "酉", range: "17:00~19:00", hour: 18, minute: 0 },
  { name: "술시", hanja: "戌", range: "19:00~21:00", hour: 20, minute: 0 },
  { name: "해시", hanja: "亥", range: "21:00~23:00", hour: 22, minute: 0 },
] as const;

export type SijinIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | -1;

/** birthHour(0~23)로부터 가장 가까운 시진 인덱스 반환 */
export function hourToSijinIndex(hour: number | null): SijinIndex {
  if (hour == null) return -1;
  // 자시는 23시 포함
  if (hour === 23) return 0;
  for (let i = 0; i < SIJIN.length; i++) {
    const s = SIJIN[i];
    if (hour >= s.hour - 1 && hour < s.hour + 1) return i as SijinIndex;
  }
  // fallback: 가장 가까운 시진
  let best = 0, bestDist = 99;
  SIJIN.forEach((s, i) => {
    const d = Math.abs(hour - s.hour);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best as SijinIndex;
}

interface Props {
  value: SijinIndex;       // 선택된 시진 인덱스 (-1 = 모름)
  onChange: (idx: SijinIndex) => void;
  accentColor?: string;    // 선택 색상 (기본 indigo)
}

export default function SijinPicker({ value, onChange, accentColor = "indigo" }: Props) {
  const accent = accentColor === "emerald"
    ? { bg: "bg-emerald-600", border: "border-emerald-500", ring: "ring-emerald-500/40" }
    : { bg: "bg-indigo-600", border: "border-indigo-500", ring: "ring-indigo-500/40" };

  return (
    <div>
      <div className="grid grid-cols-4 gap-2 mb-2">
        {SIJIN.map((s, i) => {
          const selected = value === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i as SijinIndex)}
              className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border transition-all text-center ${
                selected
                  ? `${accent.bg} ${accent.border} ring-1 ${accent.ring} text-white`
                  : "bg-white/5 border-white/10 text-gray-400 hover:border-white/25 hover:text-gray-300"
              }`}
            >
              <span className="text-xs font-bold leading-tight">{s.name}</span>
              <span className={`text-base leading-tight font-bold ${selected ? "text-white" : "text-gray-500"}`}>{s.hanja}</span>
              <span className={`text-[10px] leading-tight mt-0.5 ${selected ? "text-white/70" : "text-gray-600"}`}>{s.range}</span>
            </button>
          );
        })}
      </div>
      {/* 모름 버튼 */}
      <button
        type="button"
        onClick={() => onChange(-1)}
        className={`w-full py-2.5 rounded-xl border transition text-sm font-medium ${
          value === -1
            ? `${accent.bg} ${accent.border} text-white`
            : "bg-white/5 border-white/10 text-gray-500 hover:border-white/25"
        }`}
      >
        시간 모름
      </button>
    </div>
  );
}

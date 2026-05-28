"use client";
import { useState, useCallback } from "react";

// ─── 십이시진 — 반시(半時)법 적용 기준 (:30 시작) ───────────────────────────
// 예: 사시(巳時) 09:30~11:30 (앱 표준)
export const SIJIN_LIST = [
  { name: "자시", hanja: "子", range: "23:30~01:30", hour: 0,  minute: 30, yajasiHour: 23 },
  { name: "축시", hanja: "丑", range: "01:30~03:30", hour: 2,  minute: 30, yajasiHour: null },
  { name: "인시", hanja: "寅", range: "03:30~05:30", hour: 4,  minute: 30, yajasiHour: null },
  { name: "묘시", hanja: "卯", range: "05:30~07:30", hour: 6,  minute: 30, yajasiHour: null },
  { name: "진시", hanja: "辰", range: "07:30~09:30", hour: 8,  minute: 30, yajasiHour: null },
  { name: "사시", hanja: "巳", range: "09:30~11:30", hour: 10, minute: 30, yajasiHour: null },
  { name: "오시", hanja: "午", range: "11:30~13:30", hour: 12, minute: 30, yajasiHour: null },
  { name: "미시", hanja: "未", range: "13:30~15:30", hour: 14, minute: 30, yajasiHour: null },
  { name: "신시", hanja: "申", range: "15:30~17:30", hour: 16, minute: 30, yajasiHour: null },
  { name: "유시", hanja: "酉", range: "17:30~19:30", hour: 18, minute: 30, yajasiHour: null },
  { name: "술시", hanja: "戌", range: "19:30~21:30", hour: 20, minute: 30, yajasiHour: null },
  { name: "해시", hanja: "亥", range: "21:30~23:30", hour: 22, minute: 30, yajasiHour: null },
] as const;

export interface BirthTimeValue {
  hour: number | null;
  minute: number | null;
  unknown: boolean;
  useJajasi: boolean;
}

/** birthHour(0~23) → 시진 인덱스 (0~11), 없으면 -1 */
export function hourToSijinIdx(hour: number | null): number {
  if (hour === null) return -1;
  if (hour === 23 || hour === 0 || hour === 1) return 0; // 자시
  // 반시법: 각 시진은 홀수:30부터 시작 → 짝수 hour가 중간
  const found = SIJIN_LIST.findIndex((s, i) => {
    const start = i === 0 ? 23.5 : s.hour - 1 + 0.5;
    const end   = s.hour + 1 + 0.5;
    return hour >= (s.hour - 1 + 0.5) && hour < (s.hour + 1 + 0.5);
  });
  // simpler: 2-hour block centered on even
  if (found >= 0) return found;
  const idx = SIJIN_LIST.findIndex(s => Math.abs(s.hour - hour) <= 1);
  return idx >= 0 ? idx : 0;
}

function isJajaRange(h: number | null) {
  return h === 23 || h === 0 || h === 1;
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  value: BirthTimeValue;
  onChange: (v: BirthTimeValue) => void;
  accent?: "indigo" | "emerald" | "violet";
}

// ─── 메인 컴포넌트 ───────────────────────────────────────────────────────────
export default function BirthTimePicker({ value, onChange, accent = "indigo" }: Props) {
  const [directH, setDirectH] = useState(
    value.hour !== null ? String(value.hour).padStart(2, "0") : ""
  );
  const [directM, setDirectM] = useState(
    value.minute !== null ? String(value.minute).padStart(2, "0") : "30"
  );

  const sel = {
    indigo:  { btn: "bg-indigo-600 border-indigo-500 ring-1 ring-indigo-500/40 text-white",  check: "bg-indigo-500/15 border-indigo-400/40 text-indigo-300" },
    emerald: { btn: "bg-emerald-600 border-emerald-500 ring-1 ring-emerald-500/40 text-white", check: "bg-emerald-500/15 border-emerald-400/40 text-emerald-300" },
    violet:  { btn: "bg-violet-600 border-violet-500 ring-1 ring-violet-500/40 text-white",  check: "bg-violet-500/15 border-violet-400/40 text-violet-300" },
  }[accent];

  const selectedIdx = value.unknown ? -1 : hourToSijinIdx(value.hour);

  const pickSijin = useCallback((i: number) => {
    const s = SIJIN_LIST[i];
    setDirectH(String(s.hour).padStart(2, "0"));
    setDirectM("30");
    onChange({ ...value, hour: s.hour, minute: 30, unknown: false });
  }, [value, onChange]);

  const handleHour = (v: string) => {
    setDirectH(v);
    const n = parseInt(v);
    if (!isNaN(n) && n >= 0 && n <= 23) {
      onChange({ ...value, hour: n, minute: parseInt(directM) || 0, unknown: false });
    }
  };
  const handleMin = (v: string) => {
    setDirectM(v);
    const n = parseInt(v);
    if (!isNaN(n) && n >= 0 && n <= 59) {
      onChange({ ...value, minute: n });
    }
  };

  if (value.unknown) {
    return (
      <div>
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 text-center mb-3">
          <p className="text-gray-500 text-sm">태어난 시간을 입력하지 않아도 분석 가능합니다.</p>
          <p className="text-gray-600 text-xs mt-1">시간 입력 시 시주(時柱)까지 분석하여 더 정확합니다.</p>
        </div>
        <button type="button" onClick={() => {
          setDirectH("10"); setDirectM("30");
          onChange({ ...value, unknown: false, hour: 10, minute: 30 });
        }} className="w-full py-2.5 rounded-xl border border-white/15 text-gray-400 hover:text-gray-200 text-sm transition bg-white/[0.03]">
          시간 직접 입력하기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── 십이시진 그리드 ── */}
      <div className="grid grid-cols-4 gap-1.5">
        {SIJIN_LIST.map((s, i) => {
          const active = selectedIdx === i;
          return (
            <button
              key={i}
              type="button"
              onClick={() => pickSijin(i)}
              className={`flex flex-col items-center justify-center py-2 px-0.5 rounded-xl border transition-all ${
                active
                  ? sel.btn
                  : "bg-white/5 border-white/10 text-gray-400 hover:border-white/25 hover:text-gray-300"
              }`}
            >
              <span className="text-[11px] font-bold leading-tight">{s.name}</span>
              <span className={`text-sm font-black leading-tight ${active ? "text-white" : "text-gray-500"}`}>{s.hanja}</span>
              <span className={`text-[9px] leading-tight mt-0.5 ${active ? "text-white/60" : "text-gray-700"}`}>{s.range}</span>
            </button>
          );
        })}
      </div>

      {/* ── 직접 입력 (싱크) ── */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-600 shrink-0 w-14">직접 입력</span>
        <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 flex-1">
          <input
            type="number" min={0} max={23} value={directH}
            onChange={e => handleHour(e.target.value)}
            className="w-8 bg-transparent text-white text-sm text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="HH"
          />
          <span className="text-gray-500 font-bold text-sm">:</span>
          <input
            type="number" min={0} max={59} value={directM}
            onChange={e => handleMin(e.target.value)}
            className="w-8 bg-transparent text-white text-sm text-center outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
            placeholder="MM"
          />
          <span className="text-gray-600 text-xs ml-1">시:분</span>
        </div>
        {selectedIdx >= 0 && (
          <span className="text-xs text-gray-600 shrink-0">
            {SIJIN_LIST[selectedIdx].name} {SIJIN_LIST[selectedIdx].hanja}
          </span>
        )}
      </div>

      {/* ── 야자시/조자시 ── */}
      {isJajaRange(value.hour) && (
        <button
          type="button"
          onClick={() => onChange({ ...value, useJajasi: !value.useJajasi })}
          className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition ${
            value.useJajasi
              ? sel.check + " font-medium"
              : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300"
          }`}
        >
          <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
            value.useJajasi ? "border-current" : "border-gray-600"
          }`}>
            {value.useJajasi && <span className="text-[10px] font-black">✓</span>}
          </span>
          <span>
            야자시/조자시 적용
            <span className="text-gray-600 font-normal ml-1">(23:30~01:30 출생)</span>
          </span>
        </button>
      )}

      {/* ── 시간 모름 ── */}
      <button
        type="button"
        onClick={() => onChange({ hour: null, minute: null, unknown: true, useJajasi: false })}
        className="w-full py-2.5 rounded-xl border border-white/10 text-gray-600 hover:text-gray-400 text-sm transition bg-white/[0.02]"
      >
        태어난 시간 모름
      </button>
    </div>
  );
}

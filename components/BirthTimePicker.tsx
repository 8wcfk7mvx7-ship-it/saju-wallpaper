"use client";
import { useState, useCallback, useRef, useEffect } from "react";

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

export function hourToSijinIdx(hour: number | null): number {
  if (hour === null) return -1;
  if (hour === 23 || hour === 0 || hour === 1) return 0;
  const found = SIJIN_LIST.findIndex((s, i) => {
    const start = i === 0 ? 23.5 : s.hour - 1 + 0.5;
    const end   = s.hour + 1 + 0.5;
    return hour >= (s.hour - 1 + 0.5) && hour < (s.hour + 1 + 0.5);
  });
  if (found >= 0) return found;
  const idx = SIJIN_LIST.findIndex(s => Math.abs(s.hour - hour) <= 1);
  return idx >= 0 ? idx : 0;
}

function isJajaRange(h: number | null) {
  return h === 23 || h === 0 || h === 1;
}

// ─── 스크롤 드롭다운 피커 ─────────────────────────────────────────────────────
function ScrollPicker({
  value, options, onChange, placeholder, accentBorder,
}: {
  value: string;
  options: Array<{ v: string; label: string }>;
  onChange: (v: string) => void;
  placeholder: string;
  accentBorder: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (open && listRef.current && value) {
      const el = listRef.current.querySelector(`[data-v="${value}"]`);
      if (el) (el as HTMLElement).scrollIntoView({ block: "center" });
    }
  }, [open, value]);

  const display = options.find(o => o.v === value)?.label ?? "";

  return (
    <div ref={ref} className="relative w-full">
      <div
        onClick={() => setOpen(!open)}
        className={`flex items-center justify-between bg-white/5 border rounded-xl px-4 py-3 cursor-pointer transition select-none hover:border-white/25 ${
          open ? `${accentBorder}` : "border-white/10"
        }`}
      >
        <span className={display ? "text-white text-base" : "text-gray-600 text-base"}>
          {display || placeholder}
        </span>
        <span className={`text-gray-500 text-xs transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </div>

      {open && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 bg-[#12121e] border border-white/20 rounded-xl overflow-y-auto shadow-2xl shadow-black/60"
          style={{ maxHeight: "220px" }}
        >
          {options.map(opt => (
            <div
              key={opt.v}
              data-v={opt.v}
              onClick={() => { onChange(opt.v); setOpen(false); }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                value === opt.v
                  ? "text-indigo-300 bg-indigo-900/50 font-semibold"
                  : "text-gray-300 hover:bg-white/8"
              }`}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface Props {
  value: BirthTimeValue;
  onChange: (v: BirthTimeValue) => void;
  accent?: "indigo" | "emerald" | "violet";
}

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const sijinIdx = hourToSijinIdx(i);
  const sijin = SIJIN_LIST[sijinIdx];
  return { v: String(i), label: `${i}시  (${sijin.name} ${sijin.hanja})` };
});

const MINUTE_OPTIONS = Array.from({ length: 60 }, (_, i) => ({
  v: String(i),
  label: `${i}분`,
}));

const ACCENT_BORDER: Record<string, string> = {
  indigo: "border-indigo-500",
  emerald: "border-emerald-500",
  violet: "border-violet-500",
};
const ACCENT_CHECK: Record<string, string> = {
  indigo: "bg-indigo-500/15 border-indigo-400/40 text-indigo-300",
  emerald: "bg-emerald-500/15 border-emerald-400/40 text-emerald-300",
  violet: "bg-violet-500/15 border-violet-400/40 text-violet-300",
};

export default function BirthTimePicker({ value, onChange, accent = "indigo" }: Props) {
  const accentBorder = ACCENT_BORDER[accent];
  const accentCheck = ACCENT_CHECK[accent];

  const sijinIdx = value.hour !== null ? hourToSijinIdx(value.hour) : -1;
  const sijin = sijinIdx >= 0 ? SIJIN_LIST[sijinIdx] : null;

  if (value.unknown) {
    return (
      <div>
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 text-center mb-3">
          <p className="text-gray-500 text-sm">태어난 시간을 입력하지 않아도 분석 가능합니다.</p>
          <p className="text-gray-600 text-xs mt-1">시간 입력 시 시주(時柱)까지 분석하여 더 정확합니다.</p>
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...value, unknown: false, hour: 10, minute: 30 })}
          className="w-full py-2.5 rounded-xl border border-white/15 text-gray-400 hover:text-gray-200 text-sm transition bg-white/[0.03]"
        >
          시간 직접 입력하기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 시 / 분 스크롤 선택 */}
      <div className="grid grid-cols-2 gap-3">
        <ScrollPicker
          value={value.hour !== null ? String(value.hour) : ""}
          options={HOUR_OPTIONS}
          onChange={v => onChange({ ...value, hour: Number(v), unknown: false })}
          placeholder="시 선택"
          accentBorder={accentBorder}
        />
        <ScrollPicker
          value={value.minute !== null ? String(value.minute) : ""}
          options={MINUTE_OPTIONS}
          onChange={v => onChange({ ...value, minute: Number(v) })}
          placeholder="분 선택"
          accentBorder={accentBorder}
        />
      </div>

      {/* 선택된 시진 힌트 */}
      {sijin && (
        <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
          {sijin.name}({sijin.hanja}) · {sijin.range}
        </p>
      )}

      {/* 야자시/조자시 */}
      {isJajaRange(value.hour) && (
        <button
          type="button"
          onClick={() => onChange({ ...value, useJajasi: !value.useJajasi })}
          className={`w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition ${
            value.useJajasi ? accentCheck + " font-medium" : "bg-white/5 border-white/10 text-gray-500 hover:text-gray-300"
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

      {/* 시간 모름 */}
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

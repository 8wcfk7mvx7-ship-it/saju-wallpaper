"use client";
import { useState, useRef, useEffect } from "react";
import ProfileLoadSheet from "@/components/ProfileLoadSheet";

export interface BirthFormData {
  birthYear: number | "";
  birthMonth: number | "";
  birthDay: number | "";
  birthHour: number | null;
  birthMinute: number | null;
  gender: "male" | "female";
  city: string;
  calendarType: "solar" | "lunar";
  useJajasi: boolean;
  isLeapMonth: boolean;
}

export function defaultBirthData(gender: "male" | "female" = "female"): BirthFormData {
  return {
    birthYear: "", birthMonth: "", birthDay: "",
    birthHour: null, birthMinute: null,
    gender, city: "", calendarType: "solar",
    useJajasi: false, isLeapMonth: false,
  };
}

// ── 스크롤 드롭다운 ────────────────────────────────────────────────────────────
function Picker({
  value, options, onChange, placeholder, accent = "#7c3aed", disabled = false,
}: {
  value: string;
  options: { v: string; label: string }[];
  onChange: (v: string) => void;
  placeholder: string;
  accent?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const display = options.find(o => o.v === value)?.label ?? "";

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (open && listRef.current && value) {
      const el = listRef.current.querySelector(`[data-v="${value}"]`);
      if (el) (el as HTMLElement).scrollIntoView({ block: "center" });
    }
  }, [open, value]);

  return (
    <div ref={ref} className="relative w-full">
      <div
        onClick={() => { if (!disabled) setOpen(v => !v); }}
        className="flex items-center justify-between px-4 py-3 rounded-xl border transition select-none"
        style={{
          background: "rgba(255,255,255,0.05)",
          borderColor: open ? accent : "rgba(255,255,255,0.1)",
          cursor: disabled ? "default" : "pointer",
          opacity: disabled ? 0.4 : 1,
        }}
      >
        <span style={{ color: display ? "#fff" : "rgba(255,255,255,0.3)", fontSize: 15 }}>
          {display || placeholder}
        </span>
        {!disabled && (
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, transform: open ? "rotate(180deg)" : "none", transition: "0.2s" }}>▼</span>
        )}
      </div>
      {open && !disabled && (
        <div ref={listRef} className="absolute z-50 w-full mt-1 rounded-xl overflow-y-auto shadow-2xl"
          style={{ background: "#12121e", border: "1px solid rgba(255,255,255,0.15)", maxHeight: 220 }}>
          {options.map(opt => (
            <div key={opt.v} data-v={opt.v}
              onClick={() => { onChange(opt.v); setOpen(false); }}
              className="px-4 py-2.5 text-sm cursor-pointer transition-colors"
              style={{
                color: value === opt.v ? accent : "rgba(255,255,255,0.7)",
                background: value === opt.v ? `${accent}22` : "transparent",
                fontWeight: value === opt.v ? 600 : 400,
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const YEARS = Array.from({ length: 100 }, (_, i) => {
  const y = 2005 - i;
  return { v: String(y), label: String(y) };
});
const MONTHS = Array.from({ length: 12 }, (_, i) => ({ v: String(i + 1), label: `${i + 1}` }));
const DAYS = Array.from({ length: 31 }, (_, i) => ({ v: String(i + 1), label: `${i + 1}` }));
const HOURS = [
  { v: "unknown", label: "시간 모름" },
  ...Array.from({ length: 24 }, (_, i) => ({ v: String(i), label: `${i}시` })),
];
const MINUTES = Array.from({ length: 60 }, (_, i) => ({ v: String(i), label: `${i}분` }));

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  value: BirthFormData;
  onChange: (v: BirthFormData) => void;
  label?: string;          // "나" | "상대방" — 두 사람 구분용
  accent?: string;         // 테마 컬러
  showGender?: boolean;    // 성별 표시 여부 (기본 true)
}

export default function BirthInputForm({
  value, onChange, label, accent = "#7c3aed", showGender = true,
}: Props) {
  const set = (patch: Partial<BirthFormData>) => onChange({ ...value, ...patch });

  // 첫 번째 BirthInputForm(label 없거나 "나")에만 바텀시트 표시
  const showSheet = !label || label === "나";

  const isJajasiRange = value.birthHour !== null && (value.birthHour === 23 || value.birthHour === 0 || value.birthHour === 1);

  return (
    <>
      {showSheet && (
        <ProfileLoadSheet onLoad={(data) => onChange({ ...value, ...data })} />
      )}
    <div className="space-y-4">
      {label && (
        <p className="text-xs font-bold uppercase tracking-widest" style={{ color: accent }}>
          {label}
        </p>
      )}

      {/* 양음력 토글 */}
      <div>
        <label className="text-xs font-medium block mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>양력 / 음력</label>
        <div className="grid grid-cols-2 gap-2">
          {(["solar", "lunar"] as const).map(t => (
            <button key={t} type="button"
              onClick={() => set({ calendarType: t })}
              className="py-2.5 rounded-xl text-sm font-bold transition"
              style={{
                background: value.calendarType === t ? accent : "rgba(255,255,255,0.05)",
                color: value.calendarType === t ? "#fff" : "rgba(255,255,255,0.4)",
                border: `1px solid ${value.calendarType === t ? accent : "rgba(255,255,255,0.1)"}`,
              }}
            >
              {t === "solar" ? "양력" : "음력"}
            </button>
          ))}
        </div>
        {value.calendarType === "lunar" && (
          <label className="flex items-center gap-2 text-xs mt-2 cursor-pointer select-none"
            style={{ color: "rgba(255,255,255,0.4)" }}>
            <input type="checkbox" checked={value.isLeapMonth}
              onChange={e => set({ isLeapMonth: e.target.checked })}
              style={{ accentColor: accent }} />
            윤달
          </label>
        )}
      </div>

      {/* 연월일 */}
      <div>
        <label className="text-xs font-medium block mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>생년월일</label>
        <div className="grid grid-cols-3 gap-2">
          <Picker value={value.birthYear === "" ? "" : String(value.birthYear)} options={YEARS}
            onChange={v => set({ birthYear: Number(v) })} placeholder="연도" accent={accent} />
          <Picker value={value.birthMonth === "" ? "" : String(value.birthMonth)} options={MONTHS}
            onChange={v => set({ birthMonth: Number(v) })} placeholder="월" accent={accent} />
          <Picker value={value.birthDay === "" ? "" : String(value.birthDay)} options={DAYS}
            onChange={v => set({ birthDay: Number(v) })} placeholder="일" accent={accent} />
        </div>
      </div>

      {/* 시분 */}
      <div>
        <label className="text-xs font-medium block mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>출생시간 (선택)</label>
        <div className="grid grid-cols-2 gap-2">
          <Picker
            value={value.birthHour === null ? "unknown" : String(value.birthHour)}
            options={HOURS}
            onChange={v => set({ birthHour: v === "unknown" ? null : Number(v), birthMinute: v === "unknown" ? null : (value.birthMinute ?? 0), useJajasi: false })}
            placeholder="시 선택" accent={accent}
          />
          <Picker
            value={value.birthMinute !== null ? String(value.birthMinute) : ""}
            options={MINUTES}
            onChange={v => set({ birthMinute: Number(v) })}
            placeholder="분 선택" accent={accent}
            disabled={value.birthHour === null}
          />
        </div>
      </div>

      {/* 야자시 */}
      {value.birthHour !== null && isJajasiRange && (
        <button type="button"
          onClick={() => set({ useJajasi: !value.useJajasi })}
          className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition"
          style={{
            background: value.useJajasi ? `${accent}22` : "rgba(255,255,255,0.04)",
            borderColor: value.useJajasi ? accent : "rgba(255,255,255,0.1)",
            color: value.useJajasi ? accent : "rgba(255,255,255,0.4)",
          }}
        >
          <span className="w-4 h-4 rounded border flex items-center justify-center shrink-0"
            style={{ borderColor: value.useJajasi ? accent : "rgba(255,255,255,0.2)" }}>
            {value.useJajasi && <span className="text-[10px] font-black">✓</span>}
          </span>
          야자시·조자시 적용 (23시~01시생)
        </button>
      )}

      {/* 태어난 도시 */}
      <div>
        <label className="text-xs font-medium block mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>태어난 도시 (경도 보정)</label>
        <input
          type="text"
          value={value.city}
          onChange={e => set({ city: e.target.value })}
          placeholder="서울 / 부산 / 대구 등"
          className="w-full px-4 py-3 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none transition"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: `1px solid rgba(255,255,255,0.1)`,
          }}
          onFocus={e => (e.currentTarget.style.borderColor = accent)}
          onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
        />
      </div>

      {/* 성별 */}
      {showGender && (
        <div>
          <label className="text-xs font-medium block mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>성별</label>
          <div className="grid grid-cols-2 gap-2">
            {(["female", "male"] as const).map(g => (
              <button key={g} type="button"
                onClick={() => set({ gender: g })}
                className="py-2.5 rounded-xl text-sm font-bold transition"
                style={{
                  background: value.gender === g ? accent : "rgba(255,255,255,0.05)",
                  color: value.gender === g ? "#fff" : "rgba(255,255,255,0.4)",
                  border: `1px solid ${value.gender === g ? accent : "rgba(255,255,255,0.1)"}`,
                }}
              >
                {g === "female" ? "여성" : "남성"}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
    </>
  );
}

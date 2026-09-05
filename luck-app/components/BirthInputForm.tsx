"use client";
import type { SajuProfile } from "@/lib/storage";

export function defaultProfile(): SajuProfile {
  return {
    name: "", birthYear: 1994, birthMonth: 1, birthDay: 1,
    birthHour: null, calendarType: "solar", isLeapMonth: false, gender: "female",
  };
}

const HOURS = [
  { v: "unknown", label: "시간 모름" },
  ...Array.from({ length: 24 }, (_, i) => ({ v: String(i), label: `${i}시` })),
];

export default function BirthInputForm({
  value, onChange,
}: {
  value: SajuProfile;
  onChange: (v: SajuProfile) => void;
}) {
  const set = (patch: Partial<SajuProfile>) => onChange({ ...value, ...patch });
  const dateStr = `${String(value.birthYear).padStart(4, "0")}-${String(value.birthMonth).padStart(2, "0")}-${String(value.birthDay).padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-bold block mb-1.5" style={{ color: "var(--ink-soft)" }}>별명 (선택)</label>
        <input
          type="text" value={value.name} onChange={(e) => set({ name: e.target.value })}
          placeholder="예: 나, 민지" maxLength={20}
          className="w-full px-4 py-3 rounded text-sm focus:outline-none"
          style={{ background: "var(--card)", border: "2px solid var(--card-border)", color: "var(--ink)" }}
        />
      </div>

      <div>
        <label className="text-xs font-bold block mb-1.5" style={{ color: "var(--ink-soft)" }}>양력 / 음력</label>
        <div className="grid grid-cols-2 gap-2">
          {(["solar", "lunar"] as const).map((t) => (
            <button key={t} type="button" onClick={() => set({ calendarType: t })}
              className="retro-btn py-2.5 text-sm font-bold"
              style={{
                background: value.calendarType === t ? "var(--clover)" : "var(--card)",
                color: value.calendarType === t ? "#fff" : "var(--ink-soft)",
              }}>
              {t === "solar" ? "양력" : "음력"}
            </button>
          ))}
        </div>
        {value.calendarType === "lunar" && (
          <label className="flex items-center gap-2 text-xs mt-2 cursor-pointer select-none" style={{ color: "var(--ink-soft)" }}>
            <input type="checkbox" checked={value.isLeapMonth} onChange={(e) => set({ isLeapMonth: e.target.checked })}
              style={{ accentColor: "var(--clover)" }} />
            윤달
          </label>
        )}
      </div>

      <div>
        <label className="text-xs font-bold block mb-1.5" style={{ color: "var(--ink-soft)" }}>생년월일</label>
        <input
          type="date" value={dateStr} min="1930-01-01" max="2020-12-31"
          onChange={(e) => {
            const [y, m, d] = e.target.value.split("-").map(Number);
            if (y && m && d) set({ birthYear: y, birthMonth: m, birthDay: d });
          }}
          className="w-full px-4 py-3 rounded text-sm focus:outline-none"
          style={{ background: "var(--card)", border: "2px solid var(--card-border)", color: "var(--ink)" }}
        />
      </div>

      <div>
        <label className="text-xs font-bold block mb-1.5" style={{ color: "var(--ink-soft)" }}>출생시간 (선택)</label>
        <select
          value={value.birthHour === null ? "unknown" : String(value.birthHour)}
          onChange={(e) => set({ birthHour: e.target.value === "unknown" ? null : Number(e.target.value) })}
          className="w-full px-4 py-3 rounded text-sm focus:outline-none"
          style={{ background: "var(--card)", border: "2px solid var(--card-border)", color: "var(--ink)" }}
        >
          {HOURS.map((h) => <option key={h.v} value={h.v}>{h.label}</option>)}
        </select>
      </div>

      <div>
        <label className="text-xs font-bold block mb-1.5" style={{ color: "var(--ink-soft)" }}>성별</label>
        <div className="grid grid-cols-2 gap-2">
          {(["female", "male"] as const).map((g) => (
            <button key={g} type="button" onClick={() => set({ gender: g })}
              className="retro-btn py-2.5 text-sm font-bold"
              style={{
                background: value.gender === g ? "var(--clover)" : "var(--card)",
                color: value.gender === g ? "#fff" : "var(--ink-soft)",
              }}>
              {g === "female" ? "여성" : "남성"}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

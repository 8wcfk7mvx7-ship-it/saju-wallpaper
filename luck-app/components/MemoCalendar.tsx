"use client";
import { useMemo, useState } from "react";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function ymd(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

// 달력 그리드에 쓸, 1일이 무슨 요일인지·그 달이 며칠까지인지 계산
function monthMeta(year: number, month: number): { firstWeekday: number; daysInMonth: number } {
  return {
    firstWeekday: new Date(year, month - 1, 1).getDay(),
    daysInMonth: new Date(year, month, 0).getDate(),
  };
}

// 메모 탭 전용 — "지난 메모를 날짜로 찾아보기"를 목록 스크롤 대신 달력으로 보여준다.
// 메모가 있는 날엔 점이 찍히고, 날짜를 누르면 그날 쓴 내용이 바로 아래 펼쳐진다.
export default function MemoCalendar({
  memos, todayKey,
}: {
  memos: { date: string; content: string }[];
  todayKey: string; // "YYYY-MM-DD", KST 기준 오늘
}) {
  const [todayY, todayM] = todayKey.split("-").map(Number);
  const [viewYear, setViewYear] = useState(todayY);
  const [viewMonth, setViewMonth] = useState(todayM); // 1~12
  const [selected, setSelected] = useState<string>(todayKey);

  const memoMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const entry of memos) m.set(entry.date, entry.content);
    return m;
  }, [memos]);

  const { firstWeekday, daysInMonth } = monthMeta(viewYear, viewMonth);
  const cells: (string | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => ymd(viewYear, viewMonth, i + 1)),
  ];

  function goMonth(delta: number) {
    let y = viewYear, m = viewMonth + delta;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    setViewYear(y);
    setViewMonth(m);
  }

  const selectedContent = memoMap.get(selected);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => goMonth(-1)} className="px-2 py-1 text-sm font-bold" style={{ color: "var(--ink-soft)" }} aria-label="이전 달">
          ‹
        </button>
        <p className="font-display text-sm" style={{ color: "var(--ink)" }}>{viewYear}년 {viewMonth}월</p>
        <button onClick={() => goMonth(1)} className="px-2 py-1 text-sm font-bold" style={{ color: "var(--ink-soft)" }} aria-label="다음 달">
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[0.625rem] font-bold py-1" style={{ color: "var(--ink-soft)", opacity: 0.7 }}>
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`blank-${i}`} />;
          const day = Number(date.slice(8));
          const hasMemo = memoMap.has(date);
          const isToday = date === todayKey;
          const isSelected = date === selected;
          return (
            <button
              key={date}
              onClick={() => setSelected(date)}
              className="aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative"
              style={{
                background: isSelected ? "var(--clover)" : "var(--bg-soft)",
                color: isSelected ? "#fff" : "var(--ink)",
                border: isToday && !isSelected ? "2px solid var(--clover)" : "2px solid transparent",
              }}
            >
              {day}
              {hasMemo && (
                <span
                  className="absolute bottom-1 w-1 h-1 rounded-full"
                  style={{ background: isSelected ? "#fff" : "var(--clover)" }}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 pt-3" style={{ borderTop: "2px dashed var(--card-border)", borderTopColor: "rgba(45,46,47,0.35)" }}>
        <p className="text-[0.6875rem] font-bold mb-1.5" style={{ color: "var(--clover)" }}>
          {Number(selected.slice(5, 7))}월 {Number(selected.slice(8))}일{selected === todayKey ? " (오늘)" : ""}
        </p>
        {selectedContent ? (
          <p className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--ink)" }}>{selectedContent}</p>
        ) : (
          <p className="text-sm" style={{ color: "var(--ink-soft)" }}>이 날은 메모가 없어요.</p>
        )}
      </div>
    </div>
  );
}

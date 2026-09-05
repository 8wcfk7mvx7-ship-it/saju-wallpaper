"use client";
import { useState } from "react";

// 일기/메모 앱들(데이원, 5년 일기 등)의 흔한 패턴을 따름:
// 700일치가 쌓여도 한 번에 다 그리지 않고, 월별로 묶고 "더 보기"로 필요한 만큼만 불러온다.
function monthLabel(dateKey: string): string {
  const [y, m] = dateKey.split("-");
  return `${y}년 ${Number(m)}월`;
}

export default function HistoryList<T>({
  items, getDate, renderItem, pageSize = 10, emptyText,
}: {
  items: T[]; // 최신순으로 이미 정렬되어 있어야 함
  getDate: (item: T) => string; // "YYYY-MM-DD"
  renderItem: (item: T) => React.ReactNode;
  pageSize?: number;
  emptyText: string;
}) {
  const [visible, setVisible] = useState(pageSize);

  if (items.length === 0) {
    return <p className="text-sm" style={{ color: "var(--ink-soft)" }}>{emptyText}</p>;
  }

  const shown = items.slice(0, visible);

  // 월 구분 헤더를 어디에 넣을지 렌더링 전에 미리 계산 (렌더 콜백 안에서 변수를 바꾸지 않도록)
  const rows: { item: T; date: string; month: string; showMonthHeader: boolean }[] = [];
  {
    let lastMonth = "";
    for (const item of shown) {
      const date = getDate(item);
      const month = monthLabel(date);
      rows.push({ item, date, month, showMonthHeader: month !== lastMonth });
      lastMonth = month;
    }
  }

  return (
    <div>
      <div className="space-y-3">
        {rows.map((row, i) => (
          <div key={row.date}>
            {row.showMonthHeader && (
              <p className="text-[10px] font-bold mb-2" style={{ color: "var(--ink-soft)", opacity: 0.65 }}>{row.month}</p>
            )}
            {renderItem(row.item)}
            {i < rows.length - 1 && <div className="mt-3" style={{ borderTop: "2px dashed var(--card-border)", opacity: 0.35 }} />}
          </div>
        ))}
      </div>
      {visible < items.length && (
        <button
          onClick={() => setVisible((v) => v + pageSize)}
          className="retro-btn w-full py-2.5 text-xs font-bold mt-4"
          style={{ background: "var(--bg-soft)", color: "var(--ink-soft)" }}
        >
          더 보기 ({items.length - visible}개 더)
        </button>
      )}
    </div>
  );
}

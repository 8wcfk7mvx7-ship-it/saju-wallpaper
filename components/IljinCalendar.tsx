"use client";
import { useState } from "react";
import { getDayPillar } from "@/lib/saju";

const CG_HANJA = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const JJ_HANJA = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const CG_KR    = ["갑","을","병","정","무","기","경","신","임","계"];
const JJ_KR    = ["자","축","인","묘","진","사","오","미","신","유","술","해"];

function getKST() {
  const d = new Date(Date.now() + 9 * 3600 * 1000);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

export default function IljinCalendar() {
  const today = getKST();
  const [year, setYear] = useState(today.year);
  const [month, setMonth] = useState(today.month);

  function prevMonth() {
    if (year === 1975 && month === 1) return;
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (year === 2030 && month === 12) return;
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  const startDow = new Date(year, month - 1, 1).getDay();
  const cells: (number | null)[] = Array(startDow).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <div className="max-w-lg mx-auto px-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-sm font-black" style={{ color: "rgba(255,255,255,0.65)" }}>
            일진달력 <span className="text-[11px] font-normal" style={{ color: "rgba(255,255,255,0.2)" }}>日辰曆</span>
          </h2>
          <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>매일의 하늘과 땅의 기운 · 1975~2030</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth}
            disabled={year === 1975 && month === 1}
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm transition disabled:opacity-20"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>‹</button>
          <span className="text-sm font-bold min-w-[76px] text-center" style={{ color: "rgba(255,255,255,0.75)" }}>
            {year}년 {month}월
          </span>
          <button onClick={nextMonth}
            disabled={year === 2030 && month === 12}
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm transition disabled:opacity-20"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>›</button>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {["일","월","화","수","목","금","토"].map((d, i) => (
          <div key={d} className="text-center text-[10px] font-bold py-1"
            style={{ color: i === 0 ? "#f87171" : i === 6 ? "#60a5fa" : "rgba(255,255,255,0.28)" }}>
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px">
        {cells.map((day, idx) => {
          if (!day) return <div key={idx} className="py-2" />;
          const col = idx % 7;
          const isToday = year === today.year && month === today.month && day === today.day;
          const { cg, jj } = getDayPillar(year, month, day);
          const cgH = CG_HANJA[CG_KR.indexOf(cg)];
          const jjH = JJ_HANJA[JJ_KR.indexOf(jj)];
          return (
            <div key={idx} className="text-center py-1.5 rounded-md"
              style={{
                background: isToday ? "rgba(201,168,76,0.18)" : "transparent",
                border: isToday ? "1px solid rgba(201,168,76,0.4)" : "1px solid transparent",
              }}>
              <p className="text-xs font-bold leading-none mb-0.5"
                style={{ color: col === 0 ? "#f87171" : col === 6 ? "#60a5fa" : isToday ? "#c9a84c" : "rgba(255,255,255,0.7)" }}>
                {day}
              </p>
              <p className="text-[9px] leading-tight" style={{ color: "rgba(255,255,255,0.38)" }}>{cgH}{jjH}</p>
              <p className="text-[8px] leading-none mt-0.5" style={{ color: "rgba(255,255,255,0.18)" }}>{cg}{jj}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

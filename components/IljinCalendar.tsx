"use client";
import { useState } from "react";
import { getDayPillar, getYearPillar, getMonthPillar } from "@/lib/saju";

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

  // 오늘 연주·월주·일주
  const todayYearPillar  = getYearPillar(today.year);
  const todayMonthPillar = getMonthPillar(today.year, today.month, today.day);
  const todayDayPillar   = getDayPillar(today.year, today.month, today.day);
  const todayPillarLine = `${todayYearPillar.cg}${todayYearPillar.jj}년 ${todayMonthPillar.cg}${todayMonthPillar.jj}월 ${todayDayPillar.cg}${todayDayPillar.jj}일`;

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

  // 이번 달의 월주(月柱) — 1일 기준, 그리고 절입(월이 바뀌는 시점) 탐색
  const firstDayMonthPillar = getMonthPillar(year, month, 1);
  let monthChange: { day: number; cg: string; jj: string } | null = null;
  for (let d = 2; d <= daysInMonth; d++) {
    const mp = getMonthPillar(year, month, d);
    if (mp.cg !== firstDayMonthPillar.cg || mp.jj !== firstDayMonthPillar.jj) {
      monthChange = { day: d, cg: mp.cg, jj: mp.jj };
      break;
    }
  }

  const YEAR_OPTIONS = Array.from({ length: 2030 - 1975 + 1 }, (_, i) => 1975 + i);

  return (
    <div className="w-full">

      {/* 타이틀 + 월 네비 */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-black tracking-tight" style={{ color: "rgba(255,255,255,0.9)" }}>
            일진달력
          </h2>
          <p className="text-[13px] mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>日辰曆 · 매일의 하늘과 땅의 기운</p>
          <p className="text-[13px] mt-1 font-medium tracking-wide" style={{ color: "rgba(255,215,100,0.75)" }}>
            오늘 · {todayPillarLine}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} disabled={year === 1975 && month === 1}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition disabled:opacity-20 hover:bg-white/10"
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }}>‹</button>
          <div className="flex items-center gap-1">
            <select value={year} onChange={e => setYear(Number(e.target.value))}
              className="text-lg font-black text-center rounded-lg px-1 py-0.5"
              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {YEAR_OPTIONS.map(y => <option key={y} value={y} style={{ color: "#000" }}>{y}</option>)}
            </select>
            <select value={month} onChange={e => setMonth(Number(e.target.value))}
              className="text-lg font-black text-center rounded-lg px-1 py-0.5"
              style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m} style={{ color: "#000" }}>{String(m).padStart(2, "0")}</option>)}
            </select>
          </div>
          <button onClick={nextMonth} disabled={year === 2030 && month === 12}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition disabled:opacity-20 hover:bg-white/10"
            style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)" }}>›</button>
        </div>
      </div>

      {/* 이번 달 월주 정보 */}
      <div className="mb-4 px-3 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <p className="text-[13px]" style={{ color: "rgba(255,255,255,0.8)" }}>
          {year}년 {month}월 1일 기준 월주: <span className="font-bold" style={{ color: "rgba(255,215,100,0.85)" }}>{firstDayMonthPillar.cg}{firstDayMonthPillar.jj}월</span>
        </p>
        {monthChange && (
          <p className="text-[14px] mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
            → {monthChange.day}일부터 <span className="font-bold" style={{ color: "rgba(255,215,100,0.85)" }}>{monthChange.cg}{monthChange.jj}월</span>로 바뀝니다 (절입)
          </p>
        )}
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        {["일","월","화","수","목","금","토"].map((d, i) => (
          <div key={d} className="text-center text-sm font-bold pb-2"
            style={{ color: i === 0 ? "#f87171" : i === 6 ? "#93c5fd" : "rgba(255,255,255,0.45)" }}>
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7">
        {cells.map((day, idx) => {
          if (!day) return (
            <div key={idx} className="border-b border-r" style={{ borderColor: "rgba(255,255,255,0.05)", aspectRatio: "1/1.3" }} />
          );
          const col = idx % 7;
          const isToday = year === today.year && month === today.month && day === today.day;
          const { cg, jj } = getDayPillar(year, month, day);
          const cgH = CG_HANJA[CG_KR.indexOf(cg)];
          const jjH = JJ_HANJA[JJ_KR.indexOf(jj)];

          const numColor = col === 0 ? "#f87171" : col === 6 ? "#93c5fd" : isToday ? "#f0cc6e" : "rgba(255,255,255,0.88)";

          return (
            <div key={idx}
              className="flex flex-col items-center justify-start pt-2 pb-1.5 border-b border-r relative"
              style={{
                aspectRatio: "1/1.3",
                borderColor: "rgba(255,255,255,0.06)",
                background: isToday ? "rgba(201,168,76,0.12)" : "transparent",
              }}>
              {/* 날짜 숫자 */}
              <span className="text-2xl font-black leading-none mb-1" style={{ color: numColor,
                fontVariantNumeric: "tabular-nums",
                textShadow: isToday ? "0 0 12px rgba(201,168,76,0.5)" : "none",
              }}>
                {day}
              </span>
              {/* 한자 일진 */}
              <span className="text-[13px] font-bold leading-none" style={{ color: "rgba(255,255,255,0.6)" }}>
                {cgH}{jjH}
              </span>
              {/* 한글 */}
              <span className="text-[11px] leading-none mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                {cg}{jj}
              </span>
              {/* 오늘 표시 */}
              {isToday && (
                <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full" style={{ background: "#f0cc6e" }} />
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
}

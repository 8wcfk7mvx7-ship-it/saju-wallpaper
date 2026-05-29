"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  getDayPillar, getMonthPillar, getYearPillar,
  CHEONGAN_ELEMENT, JIJI_BONGI, SOLAR_TERM_DAYS,
  getSipseong, getUunseong,
} from "@/lib/saju";
import { loadSajuData } from "@/lib/savedSaju";
import { analyzeSaju } from "@/lib/saju";

export const dynamic = "force-dynamic";

// ── 상수 ──────────────────────────────────────────────────────────────────────
const ELEMENT_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  목: { bg: "#14532d", text: "#4ade80", border: "#166534" },
  화: { bg: "#7f1d1d", text: "#f87171", border: "#991b1b" },
  토: { bg: "#78350f", text: "#fbbf24", border: "#92400e" },
  금: { bg: "#1e1b4b", text: "#a5b4fc", border: "#312e81" },
  수: { bg: "#0c2a4a", text: "#60a5fa", border: "#1e3a5f" },
};

const ELEMENT_DOT: Record<string, string> = {
  목: "#4ade80", 화: "#f87171", 토: "#fbbf24", 금: "#a5b4fc", 수: "#60a5fa",
};

const UUNSEONG_LABEL: Record<string, string> = {
  장생:"장생", 목욕:"목욕", 관대:"관대", 건록:"건록", 제왕:"제왕",
  쇠:"쇠", 병:"병", 사:"사", 묘:"묘", 절:"절", 태:"태", 양:"양",
};

const UUNSEONG_COLOR: Record<string, string> = {
  장생:"#4ade80", 목욕:"#34d399", 관대:"#60a5fa", 건록:"#818cf8", 제왕:"#c084fc",
  쇠:"#94a3b8", 병:"#f87171", 사:"#ef4444", 묘:"#dc2626", 절:"#9333ea",
  태:"#fb923c", 양:"#fbbf24",
};

const SOLAR_TERM_NAME: Record<number, string> = {
  1:"소한", 2:"입춘", 3:"경칩", 4:"청명", 5:"입하",
  6:"망종", 7:"소서", 8:"입추", 9:"백로", 10:"한로",
  11:"입동", 12:"대설",
};

const MONTH_NAMES = ["", "1월", "2월", "3월", "4월", "5월", "6월",
  "7월", "8월", "9월", "10월", "11월", "12월"];

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

// ── 유틸 ──────────────────────────────────────────────────────────────────────
function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function firstDayOfWeek(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay(); // 0=일
}

interface DayInfo {
  day: number;
  ilju: { cg: string; jj: string };
  wolju: { cg: string; jj: string };
  cgEl: string; jjEl: string;
  isSolarTerm: boolean;
}

export default function CalendarPage() {
  const router = useRouter();
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<DayInfo | null>(null);
  const [userIlgan, setUserIlgan] = useState<string | null>(null);
  const [userName, setUserName] = useState("나");

  useEffect(() => {
    const saved = loadSajuData();
    if (saved) {
      setUserName(saved.name || "나");
      try {
        const r = analyzeSaju({
          birthYear: saved.birthYear, birthMonth: saved.birthMonth, birthDay: saved.birthDay,
          birthHour: saved.birthHour ?? null, birthMinute: saved.birthMinute ?? null,
          name: saved.name || "", gender: saved.gender || "female",
          birthPlace: saved.birthPlace || "서울",
          style: "auto", productType: "report", useJajasi: false,
        });
        setUserIlgan(r.pillarsDetail.day.cg);
      } catch {}
    }
  }, []);

  const yearPillar = useMemo(() => getYearPillar(year), [year]);

  const days = useMemo<DayInfo[]>(() => {
    const total = daysInMonth(year, month);
    return Array.from({ length: total }, (_, i) => {
      const d = i + 1;
      const ilju = getDayPillar(year, month, d);
      const wolju = getMonthPillar(year, month, d);
      const cgEl = CHEONGAN_ELEMENT[ilju.cg];
      const jjEl = CHEONGAN_ELEMENT[JIJI_BONGI[ilju.jj]] ?? "토";
      return {
        day: d, ilju, wolju, cgEl, jjEl,
        isSolarTerm: d === SOLAR_TERM_DAYS[month],
      };
    });
  }, [year, month]);

  const firstDow = firstDayOfWeek(year, month);

  function prevMonth() {
    if (month === 1) { if (year > 1975) { setYear(y => y - 1); setMonth(12); } }
    else setMonth(m => m - 1);
    setSelectedDay(null);
  }
  function nextMonth() {
    if (month === 12) { if (year < 2030) { setYear(y => y + 1); setMonth(1); } }
    else setMonth(m => m + 1);
    setSelectedDay(null);
  }

  const prevMonthWolju = useMemo(() => getMonthPillar(year, month, 1), [year, month]);
  const postTermWolju = useMemo(() => {
    const termDay = SOLAR_TERM_DAYS[month];
    if (termDay > 0 && termDay <= daysInMonth(year, month)) {
      return getMonthPillar(year, month, termDay);
    }
    return null;
  }, [year, month]);

  const isWoljuChange = postTermWolju &&
    (postTermWolju.cg !== prevMonthWolju.cg || postTermWolju.jj !== prevMonthWolju.jj);

  return (
    <main className="min-h-screen bg-[#06060e] text-white pb-24">
      <div className="max-w-lg mx-auto px-4 pt-8">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-gray-600 hover:text-gray-400 transition text-sm">← 뒤로</button>
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1 mb-1">
              <span className="text-[10px] text-gray-500 uppercase tracking-widest">Summer Palace</span>
            </div>
            <h1 className="text-xl font-black text-white">일진 달력</h1>
            <p className="text-xs text-gray-600 mt-0.5">매일의 일주·오행·12운성</p>
          </div>
        </div>

        {/* 연도 선택 + 월 네비게이션 */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={prevMonth}
            disabled={year === 1975 && month === 1}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 transition"
          >‹</button>

          <div className="text-center">
            <div className="flex items-center gap-2 justify-center">
              <select
                value={year}
                onChange={e => { setYear(Number(e.target.value)); setSelectedDay(null); }}
                className="bg-transparent text-white font-bold text-lg focus:outline-none cursor-pointer"
              >
                {Array.from({ length: 56 }, (_, i) => 1975 + i).map(y => (
                  <option key={y} value={y} className="bg-[#0d0d1a]">{y}년</option>
                ))}
              </select>
              <span className="text-white font-bold text-lg">{MONTH_NAMES[month]}</span>
            </div>
            {/* 연주·월주 */}
            <div className="flex items-center justify-center gap-3 mt-1">
              <span className="text-xs text-gray-500">
                연주 <span className="text-white font-semibold">{yearPillar.cg}{yearPillar.jj}</span>
              </span>
              <span className="text-xs text-gray-500">
                월주{" "}
                {isWoljuChange ? (
                  <span>
                    <span className="text-white font-semibold">{prevMonthWolju.cg}{prevMonthWolju.jj}</span>
                    <span className="text-gray-600 mx-1">→</span>
                    <span className="text-violet-300 font-semibold">{postTermWolju!.cg}{postTermWolju!.jj}</span>
                    <span className="text-gray-600 ml-1 text-[10px]">({SOLAR_TERM_DAYS[month]}일 {SOLAR_TERM_NAME[month]})</span>
                  </span>
                ) : (
                  <span className="text-white font-semibold">{prevMonthWolju.cg}{prevMonthWolju.jj}</span>
                )}
              </span>
            </div>
          </div>

          <button
            onClick={nextMonth}
            disabled={year === 2030 && month === 12}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center disabled:opacity-30 transition"
          >›</button>
        </div>

        {/* 사용자 맞춤 안내 */}
        {userIlgan && (
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-3 py-2 mb-4 flex items-center gap-2">
            <span className="text-lg">✨</span>
            <p className="text-xs text-violet-300 leading-relaxed">
              <strong>{userName}님</strong> 일간 <strong>{userIlgan}</strong> 기준 — 각 일주와의 12운성이 표시됩니다.
              <span className="text-violet-400/60 ml-1">진초록=왕성 / 진빨강=흉일</span>
            </p>
          </div>
        )}

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 mb-2">
          {DAY_NAMES.map((d, i) => (
            <div key={d} className={`text-center text-xs font-semibold py-1 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-500"}`}>
              {d}
            </div>
          ))}
        </div>

        {/* 달력 그리드 */}
        <div className="grid grid-cols-7 gap-0.5">
          {/* 앞 빈 셀 */}
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`empty-${i}`} className="h-[70px]" />
          ))}

          {/* 날짜 셀 */}
          {days.map(info => {
            const dow = (firstDow + info.day - 1) % 7;
            const isToday = year === today.getFullYear() && month === today.getMonth() + 1 && info.day === today.getDate();
            const cgEl = info.cgEl as keyof typeof ELEMENT_COLOR;
            const elStyle = ELEMENT_COLOR[cgEl] || ELEMENT_COLOR["토"];
            const uuns = userIlgan ? getUunseong(userIlgan, info.ilju.jj) : null;
            const uunsColor = uuns ? UUNSEONG_COLOR[uuns] : null;
            const isSelected = selectedDay?.day === info.day;

            // 길일 (제왕·건록·장생) / 흉일 (사·묘·절) 하이라이트 border
            const isLucky = uuns && ["제왕","건록","장생"].includes(uuns);
            const isUnlucky = uuns && ["사","묘","절"].includes(uuns);

            return (
              <div
                key={info.day}
                onClick={() => setSelectedDay(isSelected ? null : info)}
                className={`h-[70px] rounded-lg cursor-pointer transition-all relative overflow-hidden
                  ${isSelected ? "ring-2 ring-violet-400" : ""}
                  ${isToday ? "ring-2 ring-yellow-400/60" : ""}
                  ${isLucky ? "ring-1 ring-green-500/50" : ""}
                  ${isUnlucky ? "ring-1 ring-red-500/30" : ""}
                  hover:ring-1 hover:ring-white/20
                `}
                style={{ background: `${elStyle.bg}33` }}
              >
                {/* 절기 표시 */}
                {info.isSolarTerm && (
                  <div className="absolute top-0 right-0 bg-violet-500/60 text-[8px] text-white px-1 rounded-bl-md leading-4">
                    {SOLAR_TERM_NAME[month]}
                  </div>
                )}

                <div className="p-1 flex flex-col items-center justify-center h-full gap-0.5">
                  {/* 날짜 */}
                  <span className={`text-[11px] font-bold ${
                    dow === 0 ? "text-red-400" : dow === 6 ? "text-blue-400" : "text-gray-400"
                  } ${isToday ? "bg-yellow-400/20 rounded-full w-5 h-5 flex items-center justify-center" : ""}`}>
                    {info.day}
                  </span>

                  {/* 일주 */}
                  <span
                    className="text-sm font-black leading-none"
                    style={{ color: elStyle.text }}
                  >
                    {info.ilju.cg}{info.ilju.jj}
                  </span>

                  {/* 오행 점 */}
                  <div className="flex gap-0.5 mt-0.5">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: ELEMENT_DOT[info.cgEl] }} />
                    <div className="w-1.5 h-1.5 rounded-full" style={{ background: ELEMENT_DOT[info.jjEl] }} />
                  </div>

                  {/* 12운성 (사주 있을 때만) */}
                  {uuns && (
                    <span className="text-[9px] font-semibold" style={{ color: uunsColor || "#94a3b8" }}>
                      {uuns}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 선택된 날 상세 패널 */}
        {selectedDay && (
          <DetailPanel
            info={selectedDay}
            year={year}
            month={month}
            userIlgan={userIlgan}
            userName={userName}
          />
        )}

        {/* 범례 */}
        <div className="mt-6 bg-white/[0.03] border border-white/10 rounded-xl p-4">
          <p className="text-xs text-gray-500 font-semibold mb-3">오행 범례</p>
          <div className="flex flex-wrap gap-2">
            {(["목","화","토","금","수"] as const).map(el => (
              <div key={el} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: ELEMENT_DOT[el] }} />
                <span className="text-xs text-gray-400">{el}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-600 mt-3 leading-relaxed">
            왼쪽 점 = 일간(天干) 오행 · 오른쪽 점 = 일지(地支) 오행<br />
            {SOLAR_TERM_NAME[month] && (
              <>
                <span className="text-violet-400">{SOLAR_TERM_NAME[month]}({SOLAR_TERM_DAYS[month]}일)</span> 이후 월주가 바뀝니다
              </>
            )}
          </p>
        </div>

        {/* 오늘로 이동 버튼 */}
        {(year !== today.getFullYear() || month !== today.getMonth() + 1) && (
          <button
            onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1); setSelectedDay(null); }}
            className="mt-4 w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 text-sm text-gray-400 transition"
          >
            오늘로 돌아가기
          </button>
        )}
      </div>
    </main>
  );
}

// ── 상세 패널 ──────────────────────────────────────────────────────────────────
function DetailPanel({
  info, year, month, userIlgan, userName,
}: {
  info: DayInfo; year: number; month: number; userIlgan: string | null; userName: string;
}) {
  const uuns = userIlgan ? getUunseong(userIlgan, info.ilju.jj) : null;
  const sipseongCg = userIlgan ? getSipseong(userIlgan, info.ilju.cg) : null;
  const sipseongJj = userIlgan ? getSipseong(userIlgan, JIJI_BONGI[info.ilju.jj] || "") : null;
  const cgEl = info.cgEl as keyof typeof ELEMENT_COLOR;
  const elStyle = ELEMENT_COLOR[cgEl] || ELEMENT_COLOR["토"];

  const UUNSEONG_DESC: Record<string, string> = {
    장생: "새로운 시작, 생기 있는 날. 뭔가를 시작하기 좋은 에너지.",
    목욕: "유혹과 풍류의 기운. 감각적이지만 판단력이 흐려질 수 있어요.",
    관대: "배움과 성장의 날. 새로운 기술이나 인맥을 쌓기에 좋아요.",
    건록: "가장 안정적이고 건실한 날. 중요한 계약·결정에 좋습니다.",
    제왕: "에너지가 최고조. 리더십과 추진력이 빛나는 날입니다.",
    쇠: "기운이 조금 꺾이는 날. 무리하지 말고 내실을 다지세요.",
    병: "몸과 마음이 지치기 쉬운 날. 건강에 신경 쓰세요.",
    사: "에너지가 소진되는 날. 새 일 시작보다 마무리·정리를 하세요.",
    묘: "정체와 답답함이 있는 날. 참고 기다리는 것이 유리합니다.",
    절: "단절과 전환의 기운. 끝내야 할 것을 끝내는 날.",
    태: "새로운 씨앗이 잉태되는 날. 계획과 구상에 좋습니다.",
    양: "서서히 자라나는 기운. 꾸준한 노력이 결실을 맺는 날.",
  };

  return (
    <div
      className="mt-4 rounded-2xl border p-5"
      style={{ background: `${elStyle.bg}55`, borderColor: `${elStyle.border}80` }}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-gray-500 mb-1">{year}년 {month}월 {info.day}일</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black" style={{ color: elStyle.text }}>
              {info.ilju.cg}{info.ilju.jj}
            </span>
            <span className="text-sm text-gray-500">일주</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">월주</p>
          <p className="text-sm font-bold text-white">{info.wolju.cg}{info.wolju.jj}</p>
        </div>
      </div>

      {/* 오행 */}
      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-600 mb-1">일간 오행</p>
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: ELEMENT_DOT[info.cgEl] }} />
            <span className="text-sm font-bold" style={{ color: ELEMENT_DOT[info.cgEl] }}>{info.cgEl}({info.ilju.cg})</span>
          </div>
        </div>
        <div className="flex-1 bg-white/5 rounded-xl p-3 text-center">
          <p className="text-xs text-gray-600 mb-1">일지 오행</p>
          <div className="flex items-center justify-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: ELEMENT_DOT[info.jjEl] }} />
            <span className="text-sm font-bold" style={{ color: ELEMENT_DOT[info.jjEl] }}>{info.jjEl}({info.ilju.jj})</span>
          </div>
        </div>
      </div>

      {/* 사용자 맞춤 분석 */}
      {userIlgan && (
        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <p className="text-xs text-gray-400 font-semibold">{userName}님({userIlgan}일간) 기준 오늘 에너지</p>

          {sipseongCg && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">일간 관계</span>
              <span className="text-sm font-bold text-white">{sipseongCg}</span>
            </div>
          )}
          {sipseongJj && sipseongJj !== sipseongCg && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">일지 관계</span>
              <span className="text-sm font-bold text-white">{sipseongJj}</span>
            </div>
          )}
          {uuns && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">12운성</span>
                <span className="text-sm font-bold" style={{ color: UUNSEONG_COLOR[uuns] || "#94a3b8" }}>
                  {UUNSEONG_LABEL[uuns] || uuns}
                </span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed border-t border-white/10 pt-3">
                {UUNSEONG_DESC[uuns] || ""}
              </p>
            </>
          )}
        </div>
      )}

      {/* 절기 안내 */}
      {info.isSolarTerm && (
        <div className="mt-3 bg-violet-500/15 border border-violet-500/25 rounded-xl px-3 py-2">
          <p className="text-xs text-violet-300">
            🌿 오늘은 <strong>{SOLAR_TERM_NAME[month]}</strong> — 월주가 바뀌는 절기일입니다.
            이날부터 {info.wolju.cg}{info.wolju.jj}월이 시작됩니다.
          </p>
        </div>
      )}
    </div>
  );
}

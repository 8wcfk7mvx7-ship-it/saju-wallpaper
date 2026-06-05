"use client";
import { useState, useRef, useEffect } from "react";
import BirthTimePicker, { type BirthTimeValue } from "@/components/BirthTimePicker";

type CalendarType = "solar" | "lunar";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS  = Array.from({ length: CURRENT_YEAR - 1919 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS   = Array.from({ length: 31 }, (_, i) => i + 1);

// ─── 드롭다운 피커 ─────────────────────────────────────────────────────────────
function DropdownPicker({
  value, options, onChange, placeholder, suffix, disabled,
}: {
  value: string;
  options: Array<{ v: string; label: string }>;
  onChange: (v: string) => void;
  placeholder: string;
  suffix?: string;
  disabled?: boolean;
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
      const el = listRef.current.querySelector(`[data-value="${value}"]`);
      if (el) (el as HTMLElement).scrollIntoView({ block: "center" });
    }
  }, [open, value]);

  const display = options.find(o => o.v === value)?.label ?? "";

  return (
    <div ref={ref} className="relative w-full">
      <div
        onClick={() => !disabled && setOpen(!open)}
        className={`flex items-center justify-between rounded-xl px-4 py-3 cursor-pointer transition select-none ${
          disabled ? "opacity-30 cursor-not-allowed" : ""
        } ${open ? "border-blue-500" : "border-white/10"}`}
        style={{
          background: "rgba(255,255,255,0.05)",
          border: open ? "1px solid rgba(59,130,246,0.6)" : "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <span className={display ? "text-white text-sm" : "text-sm"} style={{ color: display ? "#fff" : "rgba(255,255,255,0.3)" }}>
          {display ? `${display}${suffix ? " " + suffix : ""}` : placeholder}
        </span>
        <span className={`text-xs transition-transform ${open ? "rotate-180" : ""}`} style={{ color: "rgba(255,255,255,0.3)" }}>▼</span>
      </div>

      {open && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-1 rounded-xl overflow-y-auto shadow-2xl"
          style={{ maxHeight: "220px", background: "#0d1b2e", border: "1px solid rgba(59,130,246,0.2)" }}
        >
          {options.map(opt => (
            <div
              key={opt.v}
              data-value={opt.v}
              onClick={() => { onChange(opt.v); setOpen(false); }}
              className="px-4 py-2.5 text-sm cursor-pointer transition-colors"
              style={{
                color: value === opt.v ? "#60a5fa" : "rgba(255,255,255,0.7)",
                background: value === opt.v ? "rgba(59,130,246,0.12)" : "transparent",
                fontWeight: value === opt.v ? 600 : 400,
              }}
            >
              {opt.label}{suffix ? ` ${suffix}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 사주 계산 ──────────────────────────────────────────────────────────────────
const CHEONGAN = ["甲","乙","丙","丁","戊","己","庚","辛","壬","癸"];
const JIJI     = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];
const CHEONGAN_KO = ["갑","을","병","정","무","기","경","신","임","계"];
const JIJI_KO    = ["자","축","인","묘","진","사","오","미","신","유","술","해"];
const JIJI_ANIMAL = ["쥐","소","호랑이","토끼","용","뱀","말","양","원숭이","닭","개","돼지"];
const OHAENG_CHEONGAN = ["木","木","火","火","土","土","金","金","水","水"];
const OHAENG_JIJI     = ["水","土","木","木","土","火","火","土","金","金","土","水"];

function getGanjiYear(year: number) {
  const g = ((year - 4) % 10 + 10) % 10;
  const j = ((year - 4) % 12 + 12) % 12;
  return { gan: g, ji: j, hanja: CHEONGAN[g] + JIJI[j], ko: CHEONGAN_KO[g] + JIJI_KO[j] };
}

// 월주 계산 (절기 기반 간략 버전 — 양력 월 기준)
function getGanjiMonth(year: number, month: number) {
  const monthJi = (month + 1) % 12; // 인월=1월→index 2
  const yearGanIdx = ((year - 4) % 10 + 10) % 10;
  // 연간 기준 월간표: 갑기년=갑인월 시작(index 2,3,4...)
  const monthGanBase = [2, 4, 6, 8, 0][yearGanIdx % 5];
  const monthGanIdx = (monthGanBase + month - 1) % 10;
  const jiIdx = ((month + 1) % 12);
  return { gan: monthGanIdx, ji: jiIdx, hanja: CHEONGAN[monthGanIdx] + JIJI[jiIdx], ko: CHEONGAN_KO[monthGanIdx] + JIJI_KO[jiIdx] };
}

function getGanjiDay(year: number, month: number, day: number) {
  // 율리우스 일수 기반 일주 계산
  const a = Math.floor((14 - month) / 12);
  const y = year - a;
  const m = month + 12 * a - 2;
  const jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  const g = ((jd - 11) % 10 + 10) % 10;
  const j = ((jd - 11) % 12 + 12) % 12;
  return { gan: g, ji: j, hanja: CHEONGAN[g] + JIJI[j], ko: CHEONGAN_KO[g] + JIJI_KO[j] };
}

function getGanjiHour(hour: number, dayGanIdx: number) {
  const ji = Math.floor(((hour + 1) % 24) / 2);
  const base = [0, 2, 4, 6, 8][dayGanIdx % 5];
  const gan = (base + ji) % 10;
  return { gan, ji, hanja: CHEONGAN[gan] + JIJI[ji], ko: CHEONGAN_KO[gan] + JIJI_KO[ji] };
}

function calcOhaeng(pillars: Array<{ gan: number; ji: number }>) {
  const score = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  for (const p of pillars) {
    const g = OHAENG_CHEONGAN[p.gan] as keyof typeof score;
    const j = OHAENG_JIJI[p.ji] as keyof typeof score;
    score[g] += 1;
    score[j] += 1;
  }
  return score;
}

interface SajuResult {
  year: { gan: number; ji: number; hanja: string; ko: string };
  month: { gan: number; ji: number; hanja: string; ko: string };
  day: { gan: number; ji: number; hanja: string; ko: string };
  hour: { gan: number; ji: number; hanja: string; ko: string } | null;
  ohaeng: Record<string, number>;
  animal: string;
}

function calcSaju(year: number, month: number, day: number, hour: number | null): SajuResult {
  const yp = getGanjiYear(year);
  const mp = getGanjiMonth(year, month);
  const dp = getGanjiDay(year, month, day);
  const hp = hour !== null ? getGanjiHour(hour, dp.gan) : null;

  const pillars = hp ? [yp, mp, dp, hp] : [yp, mp, dp];
  const ohaeng = calcOhaeng(pillars);

  return {
    year: yp,
    month: mp,
    day: dp,
    hour: hp,
    ohaeng,
    animal: JIJI_ANIMAL[yp.ji],
  };
}

// ─── 오행 색상 ─────────────────────────────────────────────────────────────────
const OHAENG_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  木: { bg: "rgba(34,197,94,0.12)",  text: "#4ade80",  border: "rgba(34,197,94,0.3)" },
  火: { bg: "rgba(239,68,68,0.12)",  text: "#f87171",  border: "rgba(239,68,68,0.3)" },
  土: { bg: "rgba(245,197,24,0.12)", text: "#fbbf24",  border: "rgba(245,197,24,0.3)" },
  金: { bg: "rgba(255,255,255,0.08)",text: "#e5e7eb",  border: "rgba(255,255,255,0.2)" },
  水: { bg: "rgba(59,130,246,0.12)", text: "#60a5fa",  border: "rgba(59,130,246,0.3)" },
};

// ─── 메인 컴포넌트 ──────────────────────────────────────────────────────────────
export default function ManseryeokPage() {
  const [form, setForm] = useState({ name: "", gender: "female", birthYear: "", birthMonth: "", birthDay: "", birthPlace: "" });
  const [calendarType, setCalendarType] = useState<CalendarType>("solar");
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [birthTime, setBirthTime] = useState<BirthTimeValue>({ hour: 12, minute: 30, unknown: false, useJajasi: false });
  const [result, setResult] = useState<SajuResult | null>(null);
  const [loading, setLoading] = useState(false);

  const yearOptions  = YEARS.map(y  => ({ v: String(y),  label: String(y) }));
  const monthOptions = MONTHS.map(m => ({ v: String(m),  label: String(m) }));
  const dayOptions   = DAYS.map(d   => ({ v: String(d),  label: String(d) }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.birthYear || !form.birthMonth || !form.birthDay) {
      alert("생년월일을 모두 선택해주세요.");
      return;
    }
    setLoading(true);

    await new Promise(r => setTimeout(r, 1200));

    let year  = parseInt(form.birthYear);
    let month = parseInt(form.birthMonth);
    let day   = parseInt(form.birthDay);

    if (calendarType === "lunar") {
      try {
        // @ts-ignore
        const KoreanLunarCalendar = (await import("korean-lunar-calendar")).default;
        const cal = new KoreanLunarCalendar();
        cal.setLunarDate(year, month, day, isLeapMonth);
        const solar = cal.getSolarCalendar();
        if (!solar?.year) throw new Error();
        year = solar.year; month = solar.month; day = solar.day;
      } catch {
        alert("음력 변환 실패. 날짜를 다시 확인해주세요.");
        setLoading(false);
        return;
      }
    }

    const hour = birthTime.unknown ? null : birthTime.hour;
    const r = calcSaju(year, month, day, hour);
    setResult(r);
    setLoading(false);
  };

  const reset = () => { setResult(null); setLoading(false); };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full animate-spin" style={{ border: "2px solid rgba(59,130,246,0.15)", borderTopColor: "#3b82f6" }} />
          <div className="absolute inset-3 rounded-full animate-spin" style={{ border: "2px solid rgba(6,182,212,0.15)", borderTopColor: "#06b6d4", animationDirection: "reverse", animationDuration: "0.8s" }} />
          <div className="absolute inset-0 flex items-center justify-center text-2xl">☯</div>
        </div>
        <div className="text-center">
          <p className="text-white font-bold mb-1">사주 분석 중...</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>천간지지 계산 중</p>
        </div>
      </div>
    );
  }

  if (result) {
    const PILLARS = [
      { label: "년주", pillar: result.year },
      { label: "월주", pillar: result.month },
      { label: "일주", pillar: result.day },
      ...(result.hour ? [{ label: "시주", pillar: result.hour }] : []),
    ];
    const total = Object.values(result.ohaeng).reduce((a, b) => a + b, 0);

    return (
      <div className="space-y-6">
        {/* 헤더 */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold mb-1 tracking-widest uppercase" style={{ color: "#60a5fa" }}>만세력 결과</p>
            <h1 className="text-2xl font-black text-white">{form.name || "사주"} 사주팔자</h1>
          </div>
          <button onClick={reset} className="text-xs px-4 py-2 rounded-xl transition" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)" }}>
            다시 입력
          </button>
        </div>

        {/* 사주 4주 */}
        <div className="grid grid-cols-4 gap-2.5">
          {PILLARS.map(({ label, pillar }) => {
            const ganColor = OHAENG_COLOR[OHAENG_CHEONGAN[pillar.gan]];
            const jiColor  = OHAENG_COLOR[OHAENG_JIJI[pillar.ji]];
            return (
              <div key={label} className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="py-1.5 text-center text-xs font-bold" style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)" }}>
                  {label}
                </div>
                {/* 천간 */}
                <div className="py-4 flex flex-col items-center gap-1 border-b" style={{ background: ganColor.bg, borderColor: "rgba(255,255,255,0.06)" }}>
                  <span className="text-2xl font-black" style={{ color: ganColor.text }}>{pillar.hanja[0]}</span>
                  <span className="text-xs font-bold" style={{ color: ganColor.text }}>{pillar.ko[0]}</span>
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{OHAENG_CHEONGAN[pillar.gan]}</span>
                </div>
                {/* 지지 */}
                <div className="py-4 flex flex-col items-center gap-1" style={{ background: jiColor.bg }}>
                  <span className="text-2xl font-black" style={{ color: jiColor.text }}>{pillar.hanja[1]}</span>
                  <span className="text-xs font-bold" style={{ color: jiColor.text }}>{pillar.ko[1]}</span>
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{OHAENG_JIJI[pillar.ji]}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* 기본 정보 */}
        <div className="rounded-2xl p-4 space-y-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>띠</span>
            <span className="text-sm font-bold text-white">{result.animal}띠 ({result.year.ko}년)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>일간</span>
            <span className="text-sm font-bold" style={{ color: OHAENG_COLOR[OHAENG_CHEONGAN[result.day.gan]].text }}>
              {CHEONGAN_KO[result.day.gan]}({CHEONGAN[result.day.gan]}) · {OHAENG_CHEONGAN[result.day.gan]}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>성별</span>
            <span className="text-sm font-bold text-white">{form.gender === "female" ? "여성" : "남성"}</span>
          </div>
          {birthTime.useJajasi && (
            <div className="flex justify-between items-center">
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>야자시 적용</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: "rgba(59,130,246,0.12)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.25)" }}>적용됨</span>
            </div>
          )}
        </div>

        {/* 오행 분포 */}
        <div className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-xs font-bold mb-3" style={{ color: "rgba(255,255,255,0.4)" }}>오행 분포</p>
          <div className="space-y-2.5">
            {(["木","火","土","金","水"] as const).map(el => {
              const cnt = result.ohaeng[el] || 0;
              const pct = total > 0 ? Math.round((cnt / total) * 100) : 0;
              const c = OHAENG_COLOR[el];
              return (
                <div key={el} className="flex items-center gap-3">
                  <span className="text-sm font-black w-5 shrink-0" style={{ color: c.text }}>{el}</span>
                  <div className="flex-1 rounded-full h-2" style={{ background: "rgba(255,255,255,0.06)" }}>
                    <div className="h-2 rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: c.text, boxShadow: `0 0 8px ${c.text}60` }} />
                  </div>
                  <span className="text-xs w-8 text-right font-bold" style={{ color: c.text }}>{cnt}개</span>
                </div>
              );
            })}
          </div>
          {total > 0 && (
            <p className="mt-3 text-xs text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
              {(() => {
                const max = Math.max(...Object.values(result.ohaeng));
                const min = Math.min(...Object.values(result.ohaeng));
                const maxEl = Object.entries(result.ohaeng).find(([, v]) => v === max)?.[0] || "";
                const minEl = Object.entries(result.ohaeng).find(([, v]) => v === min)?.[0] || "";
                return `${maxEl} 과다 · ${minEl} 부족`;
              })()}
            </p>
          )}
        </div>

        {/* 안내 */}
        <div className="rounded-2xl p-4" style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)" }}>
          <p className="text-xs font-bold mb-1" style={{ color: "#60a5fa" }}>심화 분석이 필요하신가요?</p>
          <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>격국 분석, 대운·세운, 신살 등 상세 사주 풀이를 확인해보세요.</p>
          <a href="/guide" className="text-xs font-bold" style={{ color: "#60a5fa" }}>명리학 가이드 보기 →</a>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <p className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: "#60a5fa" }}>Summer Palace · 만세력</p>
        <h1 className="text-3xl font-black text-white mb-2">사주 만세력</h1>
        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
          생년월일시를 입력하면 사주팔자(연·월·일·시주)와 오행 분포를 계산합니다.
        </p>
      </div>

      {/* 폼 */}
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* 이름 */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-white">이름</label>
          <input
            type="text"
            placeholder="홍길동 (선택)"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-xl px-4 py-3 text-white text-sm transition placeholder:text-white/20 focus:outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* 성별 */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-white">성별</label>
          <div className="flex gap-3">
            {[{ v: "female", l: "여성" }, { v: "male", l: "남성" }].map(g => (
              <button
                key={g.v}
                type="button"
                onClick={() => setForm({ ...form, gender: g.v })}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition"
                style={{
                  background: form.gender === g.v ? "rgba(59,130,246,0.18)" : "rgba(255,255,255,0.04)",
                  border: form.gender === g.v ? "1.5px solid rgba(59,130,246,0.5)" : "1px solid rgba(255,255,255,0.09)",
                  color: form.gender === g.v ? "#60a5fa" : "rgba(255,255,255,0.45)",
                }}
              >
                {g.l}
              </button>
            ))}
          </div>
        </div>

        {/* 생년월일 */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-semibold text-white">생년월일</label>
            <div className="flex rounded-lg overflow-hidden" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {(["solar","lunar"] as CalendarType[]).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => { setCalendarType(type); setIsLeapMonth(false); setForm(f => ({ ...f, birthMonth: "", birthDay: "" })); }}
                  className="px-4 py-1.5 text-xs font-bold transition"
                  style={{
                    background: calendarType === type ? "rgba(59,130,246,0.25)" : "transparent",
                    color: calendarType === type ? "#60a5fa" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {type === "solar" ? "양력" : "음력"}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3">
            <DropdownPicker value={form.birthYear} options={yearOptions} onChange={v => setForm({ ...form, birthYear: v })} placeholder="연도 선택" suffix="년" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <DropdownPicker value={form.birthMonth} options={monthOptions} onChange={v => setForm({ ...form, birthMonth: v })} placeholder="월 선택" suffix="월" />
            <DropdownPicker value={form.birthDay}   options={dayOptions}   onChange={v => setForm({ ...form, birthDay: v })}   placeholder="일 선택" suffix="일" />
          </div>

          {calendarType === "lunar" && (
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input type="checkbox" checked={isLeapMonth} onChange={e => setIsLeapMonth(e.target.checked)} className="w-4 h-4 rounded accent-blue-500" />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>윤달에 태어난 경우 체크</span>
            </label>
          )}
        </div>

        {/* 태어난 시간 */}
        <div>
          <label className="block text-sm font-semibold mb-3 text-white">태어난 시간</label>
          <BirthTimePicker value={birthTime} onChange={setBirthTime} accent="indigo" />
        </div>

        {/* 태어난 도시 */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-white">태어난 도시 <span className="text-xs font-normal" style={{ color: "rgba(255,255,255,0.3)" }}>(선택)</span></label>
          <input
            type="text"
            placeholder="서울 / 부산 / 대구 등"
            value={form.birthPlace}
            onChange={e => setForm({ ...form, birthPlace: e.target.value })}
            className="w-full rounded-xl px-4 py-3 text-white text-sm transition placeholder:text-white/20 focus:outline-none"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* 제출 */}
        <button
          type="submit"
          className="w-full py-4 rounded-xl font-black text-base transition-all active:scale-[0.98]"
          style={{
            background: "linear-gradient(135deg, #1d4ed8, #0369a1)",
            color: "#fff",
            boxShadow: "0 0 24px rgba(59,130,246,0.3)",
          }}
        >
          사주팔자 계산하기
        </button>
      </form>
    </div>
  );
}

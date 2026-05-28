"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import BirthTimePicker, { type BirthTimeValue } from "@/components/BirthTimePicker";

type Lang = "ko" | "en" | "id";
type CalendarType = "solar" | "lunar";

const T: Record<Lang, Record<string, string>> = {
  ko: {
    title: "사주 오행 배경화면",
    subtitle: "당신의 사주에 부족한 기운을 채워줄\n세상에 하나뿐인 배경화면을 만나보세요",
    name: "이름", namePlaceholder: "홍길동",
    gender: "성별", female: "여성", male: "남성",
    birthDate: "생년월일",
    solar: "양력", lunar: "음력", leapMonth: "윤달에 태어난 경우 체크",
    year: "년도", month: "월", day: "일",
    birthTime: "태어난 시간", unknown: "모름",
    hour: "시", minute: "분",
    birthPlace: "태어난 도시", birthPlaceholder: "서울 / 거제 / 부산 / 자카르타 등",
    jajaTime: "야자시/조자시 적용 (23시~01시생)",
    style: "배경화면 스타일",
    submit: "🔮 내 사주에 부족한 오행 배경화면 받기",
    loading: "분석 중...",
    sampleTitle: "이런 배경화면이 만들어져요",
    lunarConvertError: "음력 날짜를 양력으로 변환할 수 없습니다. 날짜를 다시 확인해주세요.",
    selectYear: "연도 선택",
    selectMonth: "월 선택",
    selectDay: "일 선택",
    selectHour: "시 선택",
    selectMinute: "분 선택",
  },
  en: {
    title: "Four Pillars Wallpaper",
    subtitle: "A one-of-a-kind wallpaper crafted\nto balance your elemental energy",
    name: "Name", namePlaceholder: "John Doe",
    gender: "Gender", female: "Female", male: "Male",
    birthDate: "Date of Birth",
    solar: "Solar", lunar: "Lunar", leapMonth: "Check if born in leap month",
    year: "Year", month: "Month", day: "Day",
    birthTime: "Birth Time", unknown: "Unknown",
    hour: "Hour", minute: "Min",
    birthPlace: "City of Birth", birthPlaceholder: "Seoul / Jakarta / New York etc.",
    jajaTime: "Apply Jaja/Joja time (born 23:00~01:00)",
    style: "Wallpaper Style",
    submit: "🔮 Get My Elemental Wallpaper",
    loading: "Analyzing...",
    sampleTitle: "Here's what your wallpaper could look like",
    lunarConvertError: "Could not convert lunar date. Please check the date.",
    selectYear: "Select Year",
    selectMonth: "Select Month",
    selectDay: "Select Day",
    selectHour: "Select Hour",
    selectMinute: "Select Minute",
  },
  id: {
    title: "Wallpaper Elemen Saju",
    subtitle: "Wallpaper unik yang dirancang\nuntuk menyeimbangkan energi elemen Anda",
    name: "Nama", namePlaceholder: "Budi Santoso",
    gender: "Jenis Kelamin", female: "Perempuan", male: "Laki-laki",
    birthDate: "Tanggal Lahir",
    solar: "Masehi", lunar: "Lunar", leapMonth: "Centang jika lahir di bulan kabisat",
    year: "Tahun", month: "Bulan", day: "Tanggal",
    birthTime: "Waktu Lahir", unknown: "Tidak Tahu",
    hour: "Jam", minute: "Menit",
    birthPlace: "Kota Kelahiran", birthPlaceholder: "Jakarta / Surabaya / Bali / Seoul dll.",
    jajaTime: "Terapkan waktu Jaja/Joja (lahir 23:00~01:00)",
    style: "Gaya Wallpaper",
    submit: "🔮 Dapatkan Wallpaper Elemen Saya",
    loading: "Menganalisis...",
    sampleTitle: "Begini tampilan wallpaper Anda",
    lunarConvertError: "Tidak dapat mengkonversi tanggal lunar. Silakan cek kembali.",
    selectYear: "Pilih Tahun",
    selectMonth: "Pilih Bulan",
    selectDay: "Pilih Tanggal",
    selectHour: "Pilih Jam",
    selectMinute: "Pilih Menit",
  },
};

const STYLES = [
  { v: "pixel",        ko: "🕹 픽셀아트",       en: "🕹 Pixel Art",           id: "🕹 Seni Piksel" },
  { v: "illustration", ko: "✏️ 동화 일러스트",  en: "✏️ Story Illustration",  id: "✏️ Ilustrasi" },
  { v: "watercolor",   ko: "🎨 수채화",          en: "🎨 Watercolor",           id: "🎨 Cat Air" },
  { v: "auto",         ko: "✨ AI 자동추천",     en: "✨ AI Auto-Recommend",    id: "✨ Rekomendasi AI" },
];

const SAMPLES = [
  "/samples/sample3.png",
  "/samples/sample4.png",
  "/samples/sample5.png",
  "/samples/sample14.png",
  "/samples/sample6.jpeg",
  "/samples/sample7.jpeg",
  "/samples/sample8.jpeg",
  "/samples/sample9.jpeg",
  "/samples/sample10.jpeg",
  "/samples/sample11.jpeg",
  "/samples/sample12.jpeg",
  "/samples/sample13.jpeg",
];

// 카드 1장 너비(px) + 간격 — 2장 + 양쪽 peek 구조
const CARD_W = 130;   // 9:16 → 높이 231px
const CARD_H = 231;
const CARD_GAP = 10;
const CARD_STEP = CARD_W + CARD_GAP; // 슬라이드 1칸 이동 거리
const PEEK = 28;      // 양쪽 피킹 너비

const CURRENT_YEAR = new Date().getFullYear();
const YEARS  = Array.from({ length: CURRENT_YEAR - 1919 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS   = Array.from({ length: 31 }, (_, i) => i + 1);

// ─── 드롭다운 피커 ────────────────────────────────────────────────────────────
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

  // 외부 클릭 시 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // 열릴 때 현재 선택 항목으로 스크롤
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
        className={`flex items-center justify-between bg-white/5 border rounded-xl px-4 py-3 cursor-pointer transition select-none ${
          disabled ? "opacity-30 cursor-not-allowed" : "hover:border-indigo-500/60"
        } ${open ? "border-indigo-500" : "border-white/10"}`}
      >
        <span className={display ? "text-white text-base" : "text-gray-600 text-base"}>
          {display ? `${display}${suffix ? " " + suffix : ""}` : placeholder}
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
              data-value={opt.v}
              onClick={() => { onChange(opt.v); setOpen(false); }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                value === opt.v
                  ? "text-indigo-300 bg-indigo-900/50 font-semibold"
                  : "text-gray-300 hover:bg-white/8"
              }`}
            >
              {opt.label}{suffix ? ` ${suffix}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function FormPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("ko");
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [calendarType, setCalendarType] = useState<CalendarType>("solar");
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  // PC 마우스 드래그
  const mouseStartX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);
  const autoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const t = T[lang];

  const [form, setForm] = useState({
    birthYear: "", birthMonth: "", birthDay: "",
    name: "", gender: "female", birthPlace: "",
    style: "pixel",
  });
  const [birthTime, setBirthTime] = useState<BirthTimeValue>({
    hour: 12, minute: 30, unknown: false, useJajasi: false,
  });

  // 슬라이드쇼 자동 전환 (1.5초 — 속도감 + 감상 균형)
  const resetTimer = () => {
    if (autoTimer.current) clearInterval(autoTimer.current);
    autoTimer.current = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % SAMPLES.length);
    }, 1500);
  };

  useEffect(() => {
    resetTimer();
    return () => { if (autoTimer.current) clearInterval(autoTimer.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goTo = (idx: number) => {
    setCurrentSlide((idx + SAMPLES.length) % SAMPLES.length);
    resetTimer(); // 수동 전환 시 타이머 리셋
  };

  // 모바일 터치
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 40) {
      goTo(currentSlide + (diff > 0 ? 1 : -1));
    }
  };

  // PC 마우스 드래그
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    mouseStartX.current = e.clientX;
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = mouseStartX.current - e.clientX;
    if (Math.abs(diff) > 40) {
      goTo(currentSlide + (diff > 0 ? 1 : -1));
    }
  };
  const handleMouseLeave = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const diff = mouseStartX.current - e.clientX;
    if (Math.abs(diff) > 40) {
      goTo(currentSlide + (diff > 0 ? 1 : -1));
    }
  };

  const handleCalendarToggle = (type: CalendarType) => {
    setCalendarType(type);
    setIsLeapMonth(false);
    setForm(f => ({ ...f, birthMonth: "", birthDay: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalYear  = parseInt(form.birthYear);
      let finalMonth = parseInt(form.birthMonth);
      let finalDay   = parseInt(form.birthDay);

      if (isNaN(finalYear) || finalYear < 1920 || finalYear > CURRENT_YEAR) {
        alert(lang === "ko"
          ? `년도는 1920~${CURRENT_YEAR} 사이로 입력해주세요.`
          : `Please enter a year between 1920 and ${CURRENT_YEAR}.`);
        setLoading(false);
        return;
      }

      if (calendarType === "lunar") {
        try {
          // @ts-ignore
          const KoreanLunarCalendar = (await import("korean-lunar-calendar")).default;
          const calendar = new KoreanLunarCalendar();
          calendar.setLunarDate(finalYear, finalMonth, finalDay, isLeapMonth);
          const solar = calendar.getSolarCalendar();
          if (!solar || !solar.year) throw new Error("변환 실패");
          finalYear = solar.year;
          finalMonth = solar.month;
          finalDay = solar.day;
        } catch {
          alert(t.lunarConvertError);
          setLoading(false);
          return;
        }
      }

      sessionStorage.setItem("sajuForm", JSON.stringify({
        ...form,
        birthYear: finalYear,
        birthMonth: finalMonth,
        birthDay: finalDay,
        birthHour: birthTime.unknown ? null : birthTime.hour,
        birthMinute: birthTime.unknown ? null : birthTime.minute,
        birthHourUnknown: birthTime.unknown,
        useJajasi: birthTime.useJajasi,
        lang,
      }));
      router.push("/loading");
    } catch {
      alert("오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  };

  // 옵션 데이터
  const yearOptions  = YEARS.map(y => ({ v: String(y), label: String(y) }));
  const monthOptions = MONTHS.map(m => ({ v: String(m), label: String(m) }));
  const dayOptions   = DAYS.map(d => ({ v: String(d), label: String(d) }));

  return (
    <main className="min-h-screen bg-[#080810] text-white">
      {/* 배경 글로우 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-15%] left-[-15%] w-[700px] h-[700px] rounded-full bg-indigo-900/25 blur-[140px]" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[600px] h-[600px] rounded-full bg-purple-900/25 blur-[120px]" />
      </div>

      {/* 언어 전환 */}
      <div className="relative z-10 flex justify-end px-6 pt-6 gap-2">
        {(["ko", "en", "id"] as Lang[]).map(l => (
          <button key={l} onClick={() => setLang(l)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition border ${
              lang === l
                ? "bg-indigo-600 border-indigo-500 text-white"
                : "bg-white/10 border-white/15 text-gray-300 hover:bg-white/15"
            }`}>
            {l === "ko" ? "🇰🇷 한국어" : l === "en" ? "🇺🇸 English" : "🇮🇩 Indonesia"}
          </button>
        ))}
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 pb-16">
        {/* 헤더 */}
        <div className="text-center mb-10 pt-2">
          <div className="relative inline-block mb-4">
            <div className="text-6xl drop-shadow-[0_0_30px_rgba(99,102,241,0.6)]">🔮</div>
          </div>
          <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-indigo-300 via-purple-200 to-pink-300 bg-clip-text text-transparent leading-tight pb-1">
            {t.title}
          </h1>
          <p className="text-gray-400 text-base leading-relaxed whitespace-pre-line max-w-sm mx-auto">{t.subtitle}</p>
          {lang === "ko" && (
            <div className="mt-4 inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/25 rounded-full px-4 py-1.5">
              <span className="text-xs text-indigo-300">내 오행 에너지가 불균형하면 매일 손해 보고 있습니다</span>
            </div>
          )}
        </div>

        {/* 샘플 슬라이드쇼 — 2장 동시 + peek */}
        <div className="mb-10">
          <p className="text-center text-sm text-gray-400 mb-3">{t.sampleTitle}</p>

          {/* 바깥 컨테이너: 양쪽 peek + 2장 완전 표시 */}
          <div
            className="relative select-none mx-auto"
            style={{ width: CARD_W * 2 + CARD_GAP + PEEK * 2, overflow: "hidden" }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
          >
            {/* 슬라이드 트랙 */}
            <div
              className="flex"
              style={{
                gap: CARD_GAP,
                transform: `translateX(${PEEK - currentSlide * CARD_STEP}px)`,
                transition: "transform 0.38s cubic-bezier(0.33,1,0.68,1)",
                willChange: "transform",
              }}
            >
              {SAMPLES.map((src, i) => {
                const isActive = i === currentSlide || i === currentSlide + 1;
                return (
                  <div
                    key={i}
                    className="flex-shrink-0 rounded-2xl overflow-hidden border border-white/10 shadow-xl"
                    style={{
                      width: CARD_W,
                      height: CARD_H,
                      opacity: isActive ? 1 : 0.45,
                      transform: isActive ? "scale(1)" : "scale(0.96)",
                      transition: "opacity 0.38s, transform 0.38s",
                    }}
                    onClick={() => goTo(i)}
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={src}
                        alt={`sample ${i + 1}`}
                        fill
                        className="object-cover pointer-events-none"
                        priority={i < 4}
                        draggable={false}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 좌우 페이드 마스크 */}
            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#080810] to-transparent pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#080810] to-transparent pointer-events-none" />
          </div>

          {/* 인디케이터 도트 */}
          <div className="flex justify-center gap-1.5 mt-3">
            {SAMPLES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className="h-1 rounded-full transition-all duration-300"
                style={{
                  width: i === currentSlide ? 16 : 5,
                  backgroundColor: i === currentSlide
                    ? "rgba(165,180,252,0.95)"   // indigo-300
                    : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="bg-white/[0.04] backdrop-blur-xl border border-white/10 rounded-3xl p-7 space-y-6 shadow-2xl shadow-black/40">

          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t.name}</label>
            <input type="text" placeholder={t.namePlaceholder} required
              value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition" />
          </div>

          {/* 성별 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t.gender}</label>
            <div className="flex gap-3">
              {[{ v: "female", l: t.female }, { v: "male", l: t.male }].map(g => (
                <button key={g.v} type="button" onClick={() => setForm({ ...form, gender: g.v })}
                  className={`flex-1 py-3 rounded-xl border transition font-medium ${
                    form.gender === g.v ? "bg-indigo-600 border-indigo-500" : "bg-white/5 border-white/10 text-gray-400"
                  }`}>
                  {g.l}
                </button>
              ))}
            </div>
          </div>

          {/* 생년월일 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-300">{t.birthDate}</label>
              <div className="flex bg-white/5 border border-white/10 rounded-lg overflow-hidden">
                {(["solar", "lunar"] as CalendarType[]).map(type => (
                  <button key={type} type="button" onClick={() => handleCalendarToggle(type)}
                    className={`px-4 py-1.5 text-sm font-medium transition ${
                      calendarType === type ? "bg-indigo-600 text-white" : "text-gray-400 hover:text-gray-200"
                    }`}>
                    {type === "solar" ? t.solar : t.lunar}
                  </button>
                ))}
              </div>
            </div>

            {/* 연도 */}
            <div className="mb-3">
              <DropdownPicker
                value={form.birthYear}
                options={yearOptions}
                onChange={v => setForm({ ...form, birthYear: v })}
                placeholder={t.selectYear}
                suffix={lang === "ko" ? "년" : ""}
              />
            </div>

            {/* 월 / 일 */}
            <div className="grid grid-cols-2 gap-3">
              <DropdownPicker
                value={form.birthMonth}
                options={monthOptions}
                onChange={v => setForm({ ...form, birthMonth: v })}
                placeholder={t.selectMonth}
                suffix={lang === "ko" ? "월" : ""}
              />
              <DropdownPicker
                value={form.birthDay}
                options={dayOptions}
                onChange={v => setForm({ ...form, birthDay: v })}
                placeholder={t.selectDay}
                suffix={lang === "ko" ? "일" : ""}
              />
            </div>

            {calendarType === "lunar" && (
              <label className="flex items-center gap-2 mt-3 cursor-pointer">
                <input type="checkbox" checked={isLeapMonth}
                  onChange={e => setIsLeapMonth(e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-500" />
                <span className="text-xs text-gray-400">{t.leapMonth}</span>
              </label>
            )}
          </div>

          {/* 태어난 시간 — 십이시진 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">{t.birthTime}</label>
            <BirthTimePicker
              value={birthTime}
              onChange={setBirthTime}
              accent="indigo"
            />
          </div>

          {/* 태어난 도시 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t.birthPlace}</label>
            <input type="text" placeholder={t.birthPlaceholder} required
              value={form.birthPlace} onChange={e => setForm({ ...form, birthPlace: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition" />
          </div>

          {/* 스타일 */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">{t.style}</label>
            <div className="grid grid-cols-2 gap-3">
              {STYLES.map(s => (
                <button key={s.v} type="button" onClick={() => setForm({ ...form, style: s.v })}
                  className={`py-3 rounded-xl border transition font-medium text-sm ${
                    s.v === "auto"
                      ? form.style === "auto"
                        ? "bg-gradient-to-r from-indigo-600 to-purple-600 border-indigo-500 text-white"
                        : "bg-indigo-950/50 border-indigo-500/40 text-indigo-300"
                      : form.style === s.v
                      ? "bg-indigo-600 border-indigo-500 text-white"
                      : "bg-white/5 border-white/10 text-gray-400"
                  }`}>
                  {s[lang]}
                  {s.v === "auto" && (
                    <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full ml-1">+2</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* 제출 */}
          <button type="submit" disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98] text-lg shadow-lg shadow-indigo-900/40">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t.loading}
              </span>
            ) : t.submit}
          </button>
        </form>
      </div>
    </main>
  );
}

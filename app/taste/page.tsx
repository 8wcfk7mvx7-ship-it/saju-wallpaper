"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { analyzeSaju } from "@/lib/saju";
import { loadSajuData } from "@/lib/savedSaju";
import BirthTimePicker, { type BirthTimeValue } from "@/components/BirthTimePicker";

export const dynamic = "force-dynamic";

const CURRENT_YEAR = new Date().getFullYear();
const YEARS  = Array.from({ length: CURRENT_YEAR - 1919 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS   = Array.from({ length: 31 }, (_, i) => i + 1);

// ── 드롭다운 (amber 테마) ──────────────────────────────────────────────────────
function DropPick({ value, opts, onChange, placeholder, suffix }: {
  value: string; opts: { v: string; label: string }[];
  onChange: (v: string) => void; placeholder: string; suffix?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref  = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const fn = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);
  useEffect(() => {
    if (open && list.current && value) {
      const el = list.current.querySelector(`[data-v="${value}"]`);
      if (el) (el as HTMLElement).scrollIntoView({ block: "center" });
    }
  }, [open, value]);
  const display = opts.find(o => o.v === value)?.label ?? "";
  return (
    <div ref={ref} className="relative w-full">
      <div onClick={() => setOpen(o => !o)}
        className={`flex items-center justify-between px-4 py-3 rounded-xl border cursor-pointer select-none transition text-sm ${
          open ? "border-amber-500 bg-amber-950/30" : "border-white/15 bg-white/5 hover:border-amber-500/50"
        }`}>
        <span className={display ? "text-white" : "text-gray-500"}>{display ? `${display}${suffix ? " " + suffix : ""}` : placeholder}</span>
        <span className={`text-gray-500 text-xs transition-transform ${open ? "rotate-180" : ""}`}>▼</span>
      </div>
      {open && (
        <div ref={list} className="absolute z-50 w-full mt-1 bg-[#1a1000] border border-amber-900/40 rounded-xl overflow-y-auto shadow-2xl" style={{ maxHeight: 220 }}>
          {opts.map(o => (
            <div key={o.v} data-v={o.v} onClick={() => { onChange(o.v); setOpen(false); }}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                value === o.v ? "text-amber-300 bg-amber-900/40 font-semibold" : "text-gray-300 hover:bg-white/8"
              }`}>
              {o.label}{suffix ? ` ${suffix}` : ""}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 오행별 취향 DB ────────────────────────────────────────────────────────────
interface TasteItem { title: string; why: string; genre: string; }
interface ElementTaste {
  color: string;
  emoji: string;
  personality: string;
  movies: TasteItem[];
  books: TasteItem[];
  music: string[];
  travel: string[];
}

const ELEMENT_TASTE: Record<string, ElementTaste> = {
  목: {
    color: "#16a34a",
    emoji: "🌿",
    personality: "성장·도전·직선형",
    movies: [
      { title: "인터스텔라", why: "끝없는 탐구와 성장 본능이 공명함. 한계를 넘으려는 주인공에 깊이 감정이입.", genre: "SF·드라마" },
      { title: "킹스맨", why: "노력으로 신분을 극복하는 성장 서사. 직선적 행동력과 목표 지향성이 맞음.", genre: "액션" },
      { title: "기생충", why: "구조와 계층에 대한 날카로운 통찰. 직선적 관점으로 사회를 읽어냄.", genre: "드라마·스릴러" },
      { title: "보헤미안 랩소디", why: "자기 자신을 증명하려는 끝없는 열망. 리더십의 고독함에 공감.", genre: "전기" },
    ],
    books: [
      { title: "아직도 가야 할 길 (M. 스캇 펙)", why: "성장은 고통이라는 진리. 목형의 끝없는 자기계발 욕구와 정확히 맞음.", genre: "자기계발·심리" },
      { title: "미움받을 용기", why: "타인의 시선을 넘어서 자신의 길을 가라는 메시지. 목형의 독립정신과 공명.", genre: "심리·철학" },
      { title: "린 스타트업 (에릭 리스)", why: "실행하고 배우고 성장하라. 목형의 도전 본능과 완벽한 매칭.", genre: "경영·창업" },
      { title: "1984 (조지 오웰)", why: "권력과 개인의 자유에 대한 치열한 탐구. 목형의 정의감이 자극됨.", genre: "소설·고전" },
    ],
    music: ["록/인디", "얼터너티브", "힙합(파이팅 계열)", "영화 OST"],
    travel: ["트레킹·산악", "배낭여행", "신도시 탐방", "동남아 자유여행"],
  },
  화: {
    color: "#dc2626",
    emoji: "🔥",
    personality: "감성·표현·열정형",
    movies: [
      { title: "라라랜드", why: "꿈과 현실 사이에서 타오르는 열정. 아름다운 감정의 롤러코스터.", genre: "뮤지컬·드라마" },
      { title: "위대한 쇼맨", why: "화려한 볼거리와 감동적인 스토리. 존재감을 드러내고 싶은 화형과 찰떡.", genre: "뮤지컬" },
      { title: "올드보이", why: "강렬한 감정과 충격적 서사. 화형의 폭발적 감수성을 자극.", genre: "스릴러" },
      { title: "비긴 어게인", why: "음악과 감성이 넘치는 힐링 무비. 화형의 예술적 감각과 공명.", genre: "음악·드라마" },
    ],
    books: [
      { title: "어린 왕자", why: "순수한 감수성으로 세상을 보는 시선. 화형의 낭만적 본성과 딱 맞음.", genre: "소설·우화" },
      { title: "노르웨이의 숲 (무라카미 하루키)", why: "감정과 기억의 결. 화형이 가장 깊이 빠져드는 분위기의 소설.", genre: "소설" },
      { title: "감정은 습관이다", why: "감정 폭발이 많은 화형을 위한 감정 관리의 지혜.", genre: "자기계발·심리" },
      { title: "지구 끝의 온실 (김초엽)", why: "감성적 세계관과 아름다운 문장. 화형의 감수성을 극대화.", genre: "SF·소설" },
    ],
    music: ["팝·발라드", "R&B", "케이팝", "재즈 팝"],
    travel: ["유럽 감성 여행", "예술도시(파리·피렌체)", "국내 소도시", "축제·공연 관광"],
  },
  토: {
    color: "#92400e",
    emoji: "🏔️",
    personality: "안정·포용·깊이형",
    movies: [
      { title: "어바웃 타임", why: "가족과 일상의 소중함에 대한 따뜻한 시선. 토형의 포용적 가치관과 공명.", genre: "드라마·로맨스" },
      { title: "벌새", why: "평범한 일상 속 감정의 깊이. 토형의 세심함이 공감.", genre: "성장·드라마" },
      { title: "리틀 포레스트", why: "자연과 음식, 일상의 풍요로움. 토형의 안정 추구 성향과 완벽히 맞음.", genre: "힐링·일상" },
      { title: "포레스트 검프", why: "묵묵히 자신의 길을 걷는 삶. 토형의 뚝심 있는 여정.", genre: "드라마" },
    ],
    books: [
      { title: "채식주의자 (한강)", why: "인간 내면의 깊은 심연. 토형의 묵직한 감수성을 자극.", genre: "소설" },
      { title: "아몬드 (손원평)", why: "감정을 이해하는 여정. 토형의 포용력과 인내심이 주인공에게서 보임.", genre: "소설" },
      { title: "생각에 관한 생각 (대니얼 카너먼)", why: "깊이 있는 사고방식 탐구. 토형의 신중한 사고를 자극.", genre: "심리·경제" },
      { title: "완두 (김하나)", why: "일상의 소소한 아름다움. 토형의 편안한 감성에 딱 맞음.", genre: "에세이" },
    ],
    music: ["어쿠스틱 팝", "힐링 음악", "포크", "잔잔한 OST"],
    travel: ["시골·농촌 체험", "국내 온천·힐링 숙박", "제주도", "일본 소도시"],
  },
  금: {
    color: "#7c3aed",
    emoji: "⚔️",
    personality: "분석·완벽·미적형",
    movies: [
      { title: "나이브스 아웃", why: "날카로운 추리와 반전. 금형의 분석적 사고력을 자극.", genre: "추리·스릴러" },
      { title: "퍼펙트 블루", why: "정체성과 완벽에 대한 집착. 금형의 완벽주의 심리와 공명.", genre: "애니·스릴러" },
      { title: "그랜드 부다페스트 호텔", why: "완벽한 미장센과 정교한 구성미. 금형의 심미안을 만족.", genre: "코미디·드라마" },
      { title: "쇼생크 탈출", why: "체계적 계획과 인내로 이룬 자유. 금형의 의지력과 정확성.", genre: "드라마" },
    ],
    books: [
      { title: "총균쇠 (재레드 다이아몬드)", why: "방대하고 정교한 분석. 금형의 탐구욕을 충족시키는 지식의 향연.", genre: "역사·사회과학" },
      { title: "코스모스 (칼 세이건)", why: "우주의 질서와 아름다움. 금형의 체계적 사고와 미적 감각을 동시에 자극.", genre: "과학" },
      { title: "82년생 김지영", why: "날카로운 사회 분석과 구조적 문제 제기. 금형의 비판적 시각과 맞음.", genre: "소설" },
      { title: "우아하게 거절하는 법", why: "자신의 경계를 정확히 긋는 기술. 금형에게 필요한 실용 지혜.", genre: "자기계발" },
    ],
    music: ["클래식", "재즈", "인디 팝", "일렉트로닉(미니멀)"],
    travel: ["도시 호텔링", "미술관·박물관 투어", "유럽 건축 탐방", "일본 도쿄·교토"],
  },
  수: {
    color: "#0369a1",
    emoji: "🌊",
    personality: "감성·직관·신비형",
    movies: [
      { title: "이터널 선샤인", why: "기억과 감정의 파장. 수형의 깊은 감성과 신비로운 내면에 공명.", genre: "로맨스·SF" },
      { title: "마녀 배달부 키키", why: "자유롭게 흘러가는 삶의 여정. 수형의 감성적 자유로움.", genre: "애니·힐링" },
      { title: "콜 미 바이 유어 네임", why: "여름과 감정의 결. 수형이 가장 깊이 느끼는 감성의 결.", genre: "드라마·로맨스" },
      { title: "밀양", why: "인간 내면의 심연과 신비. 수형의 깊은 존재론적 감성을 자극.", genre: "드라마" },
    ],
    books: [
      { title: "파친코 (이민진)", why: "시간과 기억의 흐름. 수형의 넓은 포용력으로 깊이 공감하는 서사.", genre: "소설" },
      { title: "달에게 들려주고 싶은 이야기 (베르나르 베르베르)", why: "신비롭고 상상력 넘치는 세계관. 수형의 직관과 공명.", genre: "SF·판타지" },
      { title: "죽음이란 무엇인가 (셸리 케이건)", why: "존재와 소멸에 대한 철학적 탐구. 수형의 깊은 내면과 맞음.", genre: "철학" },
      { title: "내가 죽이고 싶은 아이 (황선미)", why: "인간 심리의 깊은 곳을 건드리는 이야기. 수형의 직관적 공감 능력.", genre: "소설" },
    ],
    music: ["인디 팝·로파이", "재즈 발라드", "앰비언트", "케이팝 감성 발라드"],
    travel: ["바다·해안가 여행", "온천·스파 힐링", "섬 여행(발리·하와이)", "비오는 날 여행"],
  },
};

const ILGAN_TASTE: Record<string, { movie: string; book: string; tag: string }> = {
  갑: { movie: "킹 오브 씨프", book: "리더십 파이프라인", tag: "리더십형 콘텐츠" },
  을: { movie: "브리짓 존스의 일기", book: "오늘도 나는 나를 사랑한다", tag: "공감·감성형 콘텐츠" },
  병: { movie: "독전", book: "그릿(앤절라 더크워스)", tag: "에너지·동기부여형" },
  정: { movie: "님아, 그 강을 건너지 마오", book: "채식주의자", tag: "따뜻한 감성형" },
  무: { movie: "밀정", book: "사피엔스", tag: "역사·구조적 사고형" },
  기: { movie: "기묘한 이야기(드라마)", book: "사소한 것들의 과학", tag: "세심·일상형" },
  경: { movie: "엑스 마키나", book: "생각하는 기계", tag: "논리·기술형" },
  신: { movie: "블랙 스완", book: "위험한 비전", tag: "완벽·예술형" },
  임: { movie: "그래비티", book: "아직도 가야 할 길", tag: "자유·탐험형" },
  계: { movie: "소공녀", book: "혼자서도 잘 자요", tag: "청순·감성형" },
};

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div className={className} style={{ opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(18px)", transition: `opacity 0.9s ease ${delay}ms, transform 0.9s cubic-bezier(0.22,1,0.36,1) ${delay}ms` }}>
      {children}
    </div>
  );
}

export default function TastePage() {
  const router = useRouter();
  const [step, setStep] = useState<"splash" | "input" | "main">("splash");
  const [showBtn, setShowBtn] = useState(false);
  const [counter] = useState(() => Math.floor(Math.random() * 500) + 2800);

  // 입력 폼 상태
  const [formName, setFormName] = useState("");
  const [gender, setGender] = useState<"female" | "male">("female");
  const [calType, setCalType] = useState<"solar" | "lunar">("solar");
  const [isLeapMonth, setIsLeapMonth] = useState(false);
  const [birthYear, setBirthYear] = useState("");
  const [birthMonth, setBirthMonth] = useState("");
  const [birthDay, setBirthDay] = useState("");
  const [birthTime, setBirthTime] = useState<BirthTimeValue>({ hour: null, minute: null, unknown: true, useJajasi: false });

  // 결과 상태
  const [element, setElement] = useState<string>("수");
  const [ilgan, setIlgan] = useState<string>("임");
  const [name, setName] = useState("나");
  const [activeTab, setActiveTab] = useState<"movies" | "books" | "music" | "travel">("movies");

  useEffect(() => {
    const t = setTimeout(() => setShowBtn(true), 2500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const saved = loadSajuData();
    if (saved) {
      setFormName(saved.name || "");
      if (saved.gender) setGender(saved.gender as "female" | "male");
      if (saved.birthYear) setBirthYear(String(saved.birthYear));
      if (saved.birthMonth) setBirthMonth(String(saved.birthMonth));
      if (saved.birthDay) setBirthDay(String(saved.birthDay));
    }
  }, []);

  async function handleAnalyze() {
    if (!formName.trim()) {
      alert("이름을 입력해주세요.");
      return;
    }
    if (!birthYear || !birthMonth || !birthDay) {
      alert("생년월일을 모두 선택해주세요.");
      return;
    }
    let y = parseInt(birthYear), m = parseInt(birthMonth), d = parseInt(birthDay);
    if (calType === "lunar") {
      try {
        // @ts-ignore
        const KLC = (await import("korean-lunar-calendar")).default;
        const cal = new KLC();
        cal.setLunarDate(y, m, d, isLeapMonth);
        const s = cal.getSolarCalendar();
        if (!s?.year) throw new Error();
        y = s.year; m = s.month; d = s.day;
      } catch {
        alert("음력 날짜를 양력으로 변환할 수 없습니다.");
        return;
      }
    }
    const h = birthTime.unknown ? null : birthTime.hour;
    const min = birthTime.unknown ? null : birthTime.minute;
    try {
      const r = analyzeSaju({
        birthYear: y, birthMonth: m, birthDay: d,
        birthHour: h, birthMinute: min,
        name: formName || "나", gender,
        birthPlace: "서울", style: "auto", productType: "report",
        useJajasi: birthTime.useJajasi,
      });
      setElement(r.dominant[0] || "수");
      setIlgan(r.pillarsDetail.day.cg || "임");
      setName(formName || "나");
      setActiveTab("movies");
      setStep("main");
    } catch {
      alert("생년월일을 다시 확인해주세요.");
    }
  }

  const taste = ELEMENT_TASTE[element] || ELEMENT_TASTE["수"];
  const ilganTaste = ILGAN_TASTE[ilgan];

  const yearOpts  = YEARS.map(y => ({ v: String(y), label: String(y) }));
  const monthOpts = MONTHS.map(m => ({ v: String(m), label: String(m) }));
  const dayOpts   = DAYS.map(d => ({ v: String(d), label: String(d) }));

  // ── 스플래시 ──────────────────────────────────────────────────────────────
  if (step === "splash") return (
    <main className="min-h-screen bg-[#06060e] text-white flex flex-col items-center justify-center px-6 relative overflow-hidden">
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}.pulse{animation:pulse 2s ease-in-out infinite}`}</style>
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-amber-900/15 blur-[160px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-orange-900/10 blur-[130px]" />
      </div>
      <button onClick={() => router.push("/")} className="fixed top-5 left-5 z-20 text-xs text-gray-700 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 홈</button>

      <div className="relative z-10 max-w-md w-full text-center space-y-0">
        <FadeIn delay={0} className="mb-6">
          <div className="flex flex-col items-center gap-4">
            <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5">
              <span className="pulse w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
              <span className="text-xs font-bold text-amber-300 tracking-widest uppercase">Summer Palace · 취향 분석</span>
            </div>
            <div className="text-5xl drop-shadow-[0_0_40px_rgba(251,191,36,0.4)]">🎬</div>
          </div>
        </FadeIn>

        <FadeIn delay={100} className="mb-10">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/25 rounded-full px-4 py-2">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 pulse" />
            <span className="text-amber-200 text-sm font-semibold">
              지금 <strong className="text-white">{counter.toLocaleString()}명</strong>이 취향 분석 중
            </span>
          </div>
        </FadeIn>

        <div className="space-y-4 mb-12">
          {[
            { text: "당신이 좋아하는 영화·음악·여행.", big: false, delay: 200 },
            { text: "사주에 이미 답 있습니다.", big: true, delay: 700 },
            { text: "오행이 다르면", big: false, delay: 1200 },
            { text: "취향도 다릅니다.", big: true, delay: 1700 },
          ].map((line, i) => (
            <FadeIn key={i} delay={line.delay}>
              <p className={`leading-snug ${line.big
                ? "text-3xl font-black bg-gradient-to-r from-amber-300 via-orange-200 to-amber-300 bg-clip-text text-transparent"
                : "text-xl text-gray-400 font-medium"
              }`}>{line.text}</p>
            </FadeIn>
          ))}
        </div>

        <FadeIn delay={2100} className="mb-10">
          <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
            {[
              { icon: "🎬", title: "영화 추천", desc: "오행별 4편 큐레이션" },
              { icon: "📚", title: "책 추천", desc: "내 일간에 맞는 책" },
              { icon: "🎵", title: "음악 장르", desc: "오행별 음악 성향" },
              { icon: "✈️", title: "여행 스타일", desc: "내 에너지와 맞는 곳" },
            ].map((f, i) => (
              <div key={i} className="rounded-xl p-3 text-left" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-xl">{f.icon}</span>
                <p className="text-xs font-bold text-white mt-1">{f.title}</p>
                <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        <div style={{
          opacity: showBtn ? 1 : 0,
          transform: showBtn ? "translateY(0) scale(1)" : "translateY(20px) scale(0.96)",
          transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1)",
        }}>
          <button onClick={() => setStep("input")}
            className="w-full max-w-xs mx-auto block font-bold py-5 px-10 rounded-2xl text-lg shadow-2xl transition-all active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)", color: "#1a0f00", boxShadow: "0 8px 32px -4px rgba(217,119,6,0.4)" }}>
            내 취향 분석하기 →
          </button>
          <p className="text-xs text-gray-700 mt-4">무료 · 생년월일 입력 후 바로 확인</p>
        </div>
      </div>
    </main>
  );

  // ── 입력 폼 ───────────────────────────────────────────────────────────────
  if (step === "input") {
    const ready = !!birthYear && !!birthMonth && !!birthDay;
    return (
      <main className="min-h-screen bg-[#06060e] text-white">
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-amber-900/15 blur-[160px]" />
          <div className="absolute bottom-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full bg-orange-900/10 blur-[130px]" />
        </div>
        <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-24">
          <div className="flex items-center justify-between mb-8">
            <button onClick={() => setStep("splash")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 뒤로</button>
            <button onClick={() => router.push("/")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">홈으로</button>
          </div>

          <div className="text-center mb-8">
            <div className="text-4xl mb-3">🎬</div>
            <h2 className="text-2xl font-black mb-2">생년월일 입력</h2>
            <p className="text-gray-500 text-sm">사주로 취향을 분석합니다</p>
          </div>

          <div className="space-y-5">
            {/* 이름 */}
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">이름 <span className="text-amber-400">*</span></label>
              <input
                value={formName}
                onChange={e => setFormName(e.target.value)}
                placeholder="홍길동 (필수)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            {/* 성별 */}
            <div>
              <label className="text-xs text-gray-500 block mb-1.5">성별</label>
              <div className="flex gap-2">
                {(["female", "male"] as const).map(g => (
                  <button key={g} type="button" onClick={() => setGender(g)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition ${gender === g ? "text-white" : "bg-white/5 text-gray-400 border border-white/10"}`}
                    style={gender === g ? { background: "linear-gradient(135deg, #d97706, #f59e0b)", color: "#1a0f00" } : {}}>
                    {g === "female" ? "여성" : "남성"}
                  </button>
                ))}
              </div>
            </div>

            {/* 양력/음력 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-500">생년월일</label>
                <div className="flex overflow-hidden rounded-lg border border-white/10">
                  {(["solar", "lunar"] as const).map(t => (
                    <button key={t} type="button" onClick={() => { setCalType(t); setIsLeapMonth(false); setBirthMonth(""); setBirthDay(""); }}
                      className={`px-3 py-1 text-xs font-medium transition ${calType === t ? "bg-amber-600 text-white" : "text-gray-400 hover:bg-white/5"}`}>
                      {t === "solar" ? "양력" : "음력"}
                    </button>
                  ))}
                </div>
              </div>
              {calType === "lunar" && (
                <label className="flex items-center gap-2 text-xs text-gray-400 mb-2 cursor-pointer select-none">
                  <input type="checkbox" checked={isLeapMonth} onChange={e => setIsLeapMonth(e.target.checked)} className="accent-amber-500" />
                  윤달
                </label>
              )}
              <DropPick value={birthYear} opts={yearOpts} onChange={setBirthYear} placeholder="연도 선택" suffix="년" />
              <div className="grid grid-cols-2 gap-3 mt-3">
                <DropPick value={birthMonth} opts={monthOpts} onChange={setBirthMonth} placeholder="월" suffix="월" />
                <DropPick value={birthDay}   opts={dayOpts}   onChange={setBirthDay}   placeholder="일" suffix="일" />
              </div>
            </div>

            {/* 시간 */}
            <div>
              <label className="text-xs text-gray-500 block mb-2">태어난 시간 <span className="text-gray-700">(선택사항)</span></label>
              <BirthTimePicker value={birthTime} onChange={setBirthTime} accent="indigo" />
            </div>

            <button onClick={handleAnalyze} disabled={!ready}
              className={`w-full py-4 rounded-2xl font-black text-lg tracking-tight transition-all active:scale-[0.98] ${
                ready ? "text-[#1a0f00] shadow-lg" : "bg-white/5 border border-white/10 text-gray-600 cursor-not-allowed"
              }`}
              style={ready ? { background: "linear-gradient(135deg, #d97706 0%, #f59e0b 100%)", boxShadow: "0 8px 32px -4px rgba(217,119,6,0.4)" } : {}}>
              취향 분석하기 →
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── 결과 ─────────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#06060e] text-white" style={{ animation: "fadeIn 0.45s ease-out" }}>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full blur-[120px]" style={{ backgroundColor: `${taste.color}30` }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-violet-900/15 blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-4 pt-6 pb-16">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setStep("input")} className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">← 뒤로</button>
          <span className="text-xs text-green-400/60 bg-green-500/10 border border-green-500/15 px-2 py-1 rounded-full">무료</span>
        </div>

        {/* 타이틀 */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">{taste.emoji}</div>
          <h1 className="text-2xl font-black mb-1 bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">
            {name}의 취향 분석
          </h1>
          <p className="text-gray-400 text-sm">
            {element}({["목","화","토","금","수"].find(e=>e===element) || element}) 오행 · {ilgan}일간 — {taste.personality}
          </p>
        </div>

        {/* 일간 보너스 추천 */}
        {ilganTaste && (
          <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-4 mb-5">
            <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-2">{ilgan}일간 맞춤 추천</p>
            <p className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-400 inline-block mb-2">#{ilganTaste.tag}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/[0.03] rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">🎬 영화</p>
                <p className="text-sm font-bold text-white">{ilganTaste.movie}</p>
              </div>
              <div className="bg-white/[0.03] rounded-xl p-3">
                <p className="text-xs text-gray-500 mb-1">📚 책</p>
                <p className="text-sm font-bold text-white">{ilganTaste.book}</p>
              </div>
            </div>
          </div>
        )}

        {/* 탭 */}
        <div className="flex gap-2 mb-5">
          {[
            { key: "movies" as const, label: "🎬 영화" },
            { key: "books" as const, label: "📚 책" },
            { key: "music" as const, label: "🎵 음악" },
            { key: "travel" as const, label: "✈️ 여행" },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold transition border ${activeTab === tab.key ? "text-white border-white/20 bg-white/10" : "text-gray-500 border-white/5 bg-white/[0.02] hover:bg-white/5"}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* 영화 탭 */}
        {activeTab === "movies" && (
          <div className="space-y-3">
            {taste.movies.map((m, i) => (
              <div key={i} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0" style={{ backgroundColor: `${taste.color}33`, color: taste.color }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-white">{m.title}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-500">{m.genre}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{m.why}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 책 탭 */}
        {activeTab === "books" && (
          <div className="space-y-3">
            {taste.books.map((b, i) => (
              <div key={i} className="bg-white/[0.04] border border-white/10 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black shrink-0" style={{ backgroundColor: `${taste.color}33`, color: taste.color }}>
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-white">{b.title}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-gray-500">{b.genre}</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{b.why}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 음악 탭 */}
        {activeTab === "music" && (
          <div>
            <p className="text-xs text-gray-500 mb-4">{element} 오행에게 잘 맞는 음악 장르</p>
            <div className="grid grid-cols-2 gap-3">
              {taste.music.map((m, i) => (
                <div key={i} className="bg-white/[0.04] border border-white/10 rounded-xl p-4 text-center">
                  <p className="text-2xl mb-2">{["🎸","🎵","🎷","🎹"][i % 4]}</p>
                  <p className="text-sm font-bold text-white">{m}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 여행 탭 */}
        {activeTab === "travel" && (
          <div>
            <p className="text-xs text-gray-500 mb-4">{element} 오행에게 잘 맞는 여행 스타일</p>
            <div className="space-y-3">
              {taste.travel.map((t, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/[0.04] border border-white/10 rounded-xl p-4">
                  <span className="text-xl">{["🏃","🗺️","✈️","🌴"][i]}</span>
                  <span className="text-sm text-gray-200">{t}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 매력 분석 CTA */}
        <div className="mt-8 bg-gradient-to-br from-pink-600/10 to-violet-600/10 border border-pink-500/20 rounded-2xl p-5 text-center">
          <p className="text-sm font-bold text-white mb-1">내 사주에 숨겨진 매력도 궁금하지 않으세요?</p>
          <p className="text-xs text-gray-400 mb-4">도화살 · 홍염살 · 일간 매력 · 나한테 끌리는 이성 타입 분석</p>
          <button onClick={() => router.push("/charm")} className="bg-gradient-to-r from-pink-600 to-violet-600 text-white font-bold px-6 py-3 rounded-xl text-sm transition hover:from-pink-500 hover:to-violet-500 active:scale-[0.97]">
            ✨ 나의 매력 분석하기 (무료)
          </button>
        </div>

        <p className="text-center text-xs text-gray-700 mt-6">본 추천은 사주 오행 이론 기반 오락 콘텐츠입니다.</p>
      </div>
    </main>
  );
}

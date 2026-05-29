"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Lang = "ko" | "en" | "id";

function useFadeIn(delay = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return visible;
}

// ── 번역 ──────────────────────────────────────────────────────────────────────
const T = {
  ko: {
    brand: "Summer Palace",
    tagline: "AI 사주 분석",
    title: "당신의 사주,\n지금 이 순간도\n말하고 있습니다",
    sub: "남들은 이미 확인했습니다\n당신만 아직 모르고 있었어요",
    start: "시작하기",
    more: "더 많은 AI 서비스가 준비 중입니다",
    stat1: "4가지 AI 서비스", stat2: "완전 무료", stat3: "3분 완성",
    footer: "© 2026 Summer Palace",
    privacy: "개인정보처리방침", terms: "이용약관",
  },
  en: {
    brand: "Summer Palace",
    tagline: "AI Saju Analysis",
    title: "Your Saju\nis speaking\nright now",
    sub: "Everyone else already checked.\nYou're the only one left.",
    start: "Start",
    more: "More AI services coming soon",
    stat1: "4 AI Services", stat2: "100% Free", stat3: "3 Min",
    footer: "© 2026 Summer Palace",
    privacy: "Privacy Policy", terms: "Terms of Use",
  },
  id: {
    brand: "Summer Palace",
    tagline: "Analisis AI Saju",
    title: "Saju-mu\nsedang berbicara\nsaat ini",
    sub: "Orang lain sudah memeriksa.\nHanya kamu yang belum tahu.",
    start: "Mulai",
    more: "Lebih banyak layanan AI segera hadir",
    stat1: "4 Layanan AI", stat2: "Gratis 100%", stat3: "3 Menit",
    footer: "© 2026 Summer Palace",
    privacy: "Kebijakan Privasi", terms: "Ketentuan Layanan",
  },
};

// ── 서비스 목록 ───────────────────────────────────────────────────────────────
const SERVICES_KO = [
  {
    id: "saju", emoji: "🔮",
    title: "사주 오행 배경화면",
    desc: "내 사주에 부족한 오행이 있습니다\n그걸 채워주는 배경화면이 따로 있어요\n지금 확인 안 하면 계속 에너지가 새고 있는 겁니다",
    tags: ["배경화면", "오행 보정", "AI 생성"],
    href: "/saju", badge: "LIVE",
    gradient: "from-indigo-950/80 to-violet-950/80",
    border: "rgba(139,92,246,0.25)", glow: "rgba(99,102,241,0.22)",
    accent: "#a78bfa", badgeBg: "rgba(99,102,241,0.9)",
    hanja: "木火土金水",
  },
  {
    id: "gunghap", emoji: "💑",
    title: "사주 궁합 분석",
    desc: "원진살 커플은 노력해도 결국 깨집니다\n지금 사귀는 사람, 내 에너지를 갉아먹는 사주인지\n3분 안에 확인하세요",
    tags: ["궁합", "바람기 분석", "원진살"],
    href: "/gunghap", badge: "LIVE",
    gradient: "from-violet-950/80 to-pink-950/80",
    border: "rgba(236,72,153,0.22)", glow: "rgba(139,92,246,0.22)",
    accent: "#f9a8d4", badgeBg: "rgba(139,92,246,0.9)",
    hanja: "合沖害破",
  },
  {
    id: "stock", emoji: "📈",
    title: "사주로 보는\n내 주식투자 스타일",
    desc: "말아먹는 사주가 따로 있습니다\n내 친구는 왜 나보다 주식으로 잘 버는 걸까요?\nETF·레버리지·코인 적합도 지금 확인",
    tags: ["주식", "코인", "ETF·레버리지"],
    href: "/stock", badge: "LIVE",
    gradient: "from-emerald-950/80 to-teal-950/80",
    border: "rgba(16,185,129,0.22)", glow: "rgba(16,185,129,0.18)",
    accent: "#6ee7b7", badgeBg: "rgba(5,150,105,0.9)",
    hanja: "財官印食",
  },
  {
    id: "charm", emoji: "✨",
    title: "사주 매력 분석",
    desc: "저 사람은 왜 저렇게 이성에게 잘 보이는 걸까\n도화살·홍염살·내 일간의 숨은 매력\n본인만 모르고 있었던 비밀",
    tags: ["매력", "이성운", "도화살"],
    href: "/charm", badge: "LIVE",
    gradient: "from-rose-950/80 to-pink-950/80",
    border: "rgba(244,63,94,0.22)", glow: "rgba(236,72,153,0.22)",
    accent: "#fda4af", badgeBg: "rgba(225,29,72,0.9)",
    hanja: "桃花紅艶",
  },
  {
    id: "taste", emoji: "🎬",
    title: "사주로 보는\n내 영화·책 취향",
    desc: "목오행은 성장 드라마에 빠집니다\n수오행은 감성 영화에 눈물 흘립니다\n내 오행이 좋아할 콘텐츠 지금 확인",
    tags: ["영화", "책", "취향 분석"],
    href: "/taste", badge: "FREE",
    gradient: "from-amber-950/80 to-orange-950/80",
    border: "rgba(245,158,11,0.22)", glow: "rgba(234,88,12,0.18)",
    accent: "#fcd34d", badgeBg: "rgba(180,83,9,0.9)",
    hanja: "木火土金水",
  },
];

const SERVICES_EN = [
  { id:"saju", emoji:"🔮", title:"Five Elements Wallpaper", desc:"Your Saju lacks a certain element.\nThere's a specific wallpaper that fills it.\nNot checking means your energy keeps leaking.", tags:["Wallpaper","Element Fix","AI Generated"], href:"/saju", badge:"LIVE", gradient:"from-indigo-950/80 to-violet-950/80", border:"rgba(139,92,246,0.25)", glow:"rgba(99,102,241,0.22)", accent:"#a78bfa", badgeBg:"rgba(99,102,241,0.9)", hanja:"木火土金水" },
  { id:"gunghap", emoji:"💑", title:"Compatibility Analysis", desc:"Wonjin couples always break up no matter what.\nIs the person you're dating draining your energy?\nFind out in 3 minutes.", tags:["Compatibility","Attraction","Wonjin"], href:"/gunghap", badge:"LIVE", gradient:"from-violet-950/80 to-pink-950/80", border:"rgba(236,72,153,0.22)", glow:"rgba(139,92,246,0.22)", accent:"#f9a8d4", badgeBg:"rgba(139,92,246,0.9)", hanja:"合沖害破" },
  { id:"stock", emoji:"📈", title:"Saju Investment\nStyle", desc:"Some people are born to lose money in stocks.\nWhy does your friend earn more than you?\nCheck ETF · Leverage · Crypto compatibility.", tags:["Stocks","Crypto","ETF·Leverage"], href:"/stock", badge:"LIVE", gradient:"from-emerald-950/80 to-teal-950/80", border:"rgba(16,185,129,0.22)", glow:"rgba(16,185,129,0.18)", accent:"#6ee7b7", badgeBg:"rgba(5,150,105,0.9)", hanja:"財官印食" },
  { id:"charm", emoji:"✨", title:"Charm Analysis", desc:"Why does that person attract others so easily?\nDohwa · Hongyeom · hidden charm of your day pillar.\nA secret only you didn't know.", tags:["Charm","Attraction","Dohwa"], href:"/charm", badge:"LIVE", gradient:"from-rose-950/80 to-pink-950/80", border:"rgba(244,63,94,0.22)", glow:"rgba(236,72,153,0.22)", accent:"#fda4af", badgeBg:"rgba(225,29,72,0.9)", hanja:"桃花紅艶" },
];

const SERVICES_ID = [
  { id:"saju", emoji:"🔮", title:"Wallpaper Lima Elemen", desc:"Saju-mu kekurangan elemen tertentu.\nAda wallpaper khusus yang mengisinya.\nTidak memeriksa berarti energimu terus bocor.", tags:["Wallpaper","Koreksi Elemen","AI"], href:"/saju", badge:"LIVE", gradient:"from-indigo-950/80 to-violet-950/80", border:"rgba(139,92,246,0.25)", glow:"rgba(99,102,241,0.22)", accent:"#a78bfa", badgeBg:"rgba(99,102,241,0.9)", hanja:"木火土金水" },
  { id:"gunghap", emoji:"💑", title:"Analisis Kecocokan", desc:"Pasangan Wonjin selalu berpisah meski berusaha.\nApakah orang yang kamu pacari menguras energimu?\nCek dalam 3 menit.", tags:["Kecocokan","Daya Tarik","Wonjin"], href:"/gunghap", badge:"LIVE", gradient:"from-violet-950/80 to-pink-950/80", border:"rgba(236,72,153,0.22)", glow:"rgba(139,92,246,0.22)", accent:"#f9a8d4", badgeBg:"rgba(139,92,246,0.9)", hanja:"合沖害破" },
  { id:"stock", emoji:"📈", title:"Gaya Investasi\nMenurut Saju", desc:"Ada orang yang saju-nya rugi di saham.\nKenapa temanmu lebih sukses investasi?\nCek ETF · Leverage · Kripto sekarang.", tags:["Saham","Kripto","ETF·Leverage"], href:"/stock", badge:"LIVE", gradient:"from-emerald-950/80 to-teal-950/80", border:"rgba(16,185,129,0.22)", glow:"rgba(16,185,129,0.18)", accent:"#6ee7b7", badgeBg:"rgba(5,150,105,0.9)", hanja:"財官印食" },
  { id:"charm", emoji:"✨", title:"Analisis Daya Pikat", desc:"Kenapa orang itu begitu menarik?\nDohwa · Hongyeom · daya pikat tersembunyi.\nRahasia yang hanya kamu tidak tahu.", tags:["Daya Pikat","Asmara","Dohwa"], href:"/charm", badge:"LIVE", gradient:"from-rose-950/80 to-pink-950/80", border:"rgba(244,63,94,0.22)", glow:"rgba(236,72,153,0.22)", accent:"#fda4af", badgeBg:"rgba(225,29,72,0.9)", hanja:"桃花紅艶" },
];

const SERVICES_BY_LANG: Record<Lang, typeof SERVICES_KO> = { ko: SERVICES_KO, en: SERVICES_EN, id: SERVICES_ID };

// ── 서비스 카드 ──────────────────────────────────────────────────────────────
function ServiceCard({ svc, index, startLabel }: { svc: typeof SERVICES_KO[0]; index: number; startLabel: string }) {
  const router = useRouter();
  const visible = useFadeIn(400 + index * 130);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => router.push(svc.href)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(32px)",
        transition: `opacity 0.85s ease ${400 + index * 130}ms, transform 0.85s cubic-bezier(0.22,1,0.36,1) ${400 + index * 130}ms`,
        borderColor: hovered ? svc.border : "rgba(255,255,255,0.07)",
        boxShadow: hovered ? `0 12px 60px ${svc.glow}, inset 0 1px 0 rgba(255,255,255,0.06)` : "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
      className={`relative bg-gradient-to-br ${svc.gradient} border rounded-3xl p-6 cursor-pointer transition-all duration-500 flex flex-col min-h-[260px] overflow-hidden`}
    >
      {/* 배경 한자 장식 */}
      <span
        className="absolute right-4 bottom-3 font-black select-none pointer-events-none"
        style={{
          fontSize: 64,
          color: svc.accent,
          opacity: hovered ? 0.12 : 0.06,
          letterSpacing: "0.1em",
          lineHeight: 1,
          transition: "opacity 0.5s ease",
          fontFamily: "'Noto Serif KR', serif",
        }}
      >
        {svc.hanja}
      </span>

      {/* LIVE 뱃지 */}
      <span
        className="absolute top-4 right-4 text-xs font-black px-2.5 py-1 rounded-full text-white tracking-wider"
        style={{ background: svc.badgeBg }}
      >
        {svc.badge}
      </span>

      {/* 이모지 */}
      <div
        className="text-4xl mb-4 w-14 h-14 flex items-center justify-center rounded-2xl"
        style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${svc.border}` }}
      >
        {svc.emoji}
      </div>

      {/* 제목 */}
      <h3 className="text-lg font-black text-white mb-2 leading-tight whitespace-pre-line">{svc.title}</h3>

      {/* 설명 */}
      <p className="text-sm leading-relaxed whitespace-pre-line mb-4 flex-1" style={{ color: "rgba(255,255,255,0.45)" }}>
        {svc.desc}
      </p>

      {/* 태그 */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {svc.tags.map(tag => (
          <span
            key={tag}
            className="text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {tag}
          </span>
        ))}
      </div>

      {/* CTA */}
      <div
        className="flex items-center gap-1.5 text-sm font-bold"
        style={{ color: svc.accent }}
      >
        <span>{startLabel}</span>
        <span
          style={{
            transform: hovered ? "translateX(6px)" : "translateX(0)",
            transition: "transform 0.25s cubic-bezier(0.22,1,0.36,1)",
            display: "inline-block",
          }}
        >
          →
        </span>
      </div>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
export default function MainPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("ko");
  const [counter] = useState(() => Math.floor(Math.random() * 300) + 180);

  const titleVisible = useFadeIn(80);
  const subVisible   = useFadeIn(240);
  const statsVisible = useFadeIn(360);
  const footerVisible = useFadeIn(900);

  const t = T[lang];
  const services = SERVICES_BY_LANG[lang];

  // 배경 한자 floating elements
  const BG_HANJA = [
    { char: "木", color: "#52b788", x: "8%",  y: "12%", size: 180, delay: 0,    dur: 18 },
    { char: "火", color: "#ff7043", x: "82%", y: "8%",  size: 160, delay: 3000, dur: 22 },
    { char: "土", color: "#d4a373", x: "5%",  y: "55%", size: 140, delay: 1500, dur: 20 },
    { char: "金", color: "#c0c0c0", x: "78%", y: "52%", size: 170, delay: 2500, dur: 16 },
    { char: "水", color: "#48cae4", x: "45%", y: "88%", size: 150, delay: 800,  dur: 24 },
    { char: "☯",  color: "#c9a84c", x: "48%", y: "3%",  size: 120, delay: 4000, dur: 30 },
  ];

  return (
    <main className="min-h-screen bg-[#06060e] text-white relative overflow-hidden">

      {/* ── 배경 글로우 ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[800px] h-[800px] rounded-full bg-indigo-950/60 blur-[200px]" />
        <div className="absolute bottom-[-15%] right-[-5%] w-[700px] h-[700px] rounded-full bg-violet-950/50 blur-[180px]" />
        <div className="absolute top-[35%] right-[30%] w-[400px] h-[400px] rounded-full blur-[150px]" style={{ background: "rgba(201,168,76,0.04)" }} />
      </div>

      {/* ── 배경 한자 ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {BG_HANJA.map((h, i) => (
          <div
            key={i}
            className="absolute select-none"
            style={{
              left: h.x, top: h.y,
              fontSize: h.size,
              color: h.color,
              opacity: 0.045,
              fontWeight: 900,
              fontFamily: "'Noto Serif KR', 'Apple SD Gothic Neo', serif",
              lineHeight: 1,
              animation: `floatHanja${i % 3} ${h.dur}s ease-in-out infinite`,
              animationDelay: `${h.delay}ms`,
              filter: "blur(0.5px)",
              userSelect: "none",
            }}
          >
            {h.char}
          </div>
        ))}
      </div>

      {/* ── 언어 선택 ── */}
      <div className="fixed top-4 right-4 z-20 flex gap-1.5">
        {(["ko", "en", "id"] as Lang[]).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className="text-xs font-bold px-3 py-1.5 rounded-full border transition-all duration-300"
            style={{
              background: lang === l ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.04)",
              borderColor: lang === l ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.1)",
              color: lang === l ? "#e8c97a" : "rgba(255,255,255,0.35)",
            }}
          >
            {l === "ko" ? "한국어" : l === "en" ? "EN" : "ID"}
          </button>
        ))}
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-5 pb-28">

        {/* ── 헤더 ── */}
        <div className="pt-16 pb-12 text-center">
          <div
            style={{
              opacity: titleVisible ? 1 : 0,
              transform: titleVisible ? "translateY(0)" : "translateY(-14px)",
              transition: "opacity 0.9s ease 80ms, transform 0.9s cubic-bezier(0.22,1,0.36,1) 80ms",
            }}
          >
            {/* 브랜드 뱃지 */}
            <div className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 mb-10" style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.25)" }}>
              <span style={{ color: "#c9a84c", fontSize: 14 }}>☯</span>
              <span className="text-xs tracking-[0.22em] uppercase font-semibold" style={{ color: "#c9a84c" }}>{t.brand}</span>
              <span className="text-xs" style={{ color: "rgba(201,168,76,0.5)" }}>·</span>
              <span className="text-xs tracking-wider" style={{ color: "rgba(201,168,76,0.7)" }}>{t.tagline}</span>
            </div>

            {/* 메인 타이틀 */}
            <h1
              className="text-5xl font-black mb-4 leading-tight whitespace-pre-line"
              style={{
                background: "linear-gradient(160deg, #ffffff 0%, rgba(255,255,255,0.85) 50%, rgba(201,168,76,0.7) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                letterSpacing: "-0.03em",
              }}
            >
              {t.title}
            </h1>
          </div>

          {/* 서브카피 */}
          <div style={{ opacity: subVisible ? 1 : 0, transition: "opacity 0.9s ease 240ms" }}>
            <p className="text-sm leading-relaxed max-w-xs mx-auto whitespace-pre-line" style={{ color: "rgba(255,255,255,0.38)" }}>
              {t.sub}
            </p>
          </div>

          {/* 통계 바 */}
          <div
            style={{
              opacity: statsVisible ? 1 : 0,
              transform: statsVisible ? "translateY(0)" : "translateY(12px)",
              transition: "opacity 0.9s ease 360ms, transform 0.9s cubic-bezier(0.22,1,0.36,1) 360ms",
            }}
            className="mt-10 flex items-center justify-center gap-0"
          >
            {[t.stat1, t.stat2, t.stat3].map((s, i) => (
              <div key={i} className="flex items-center">
                <div className="text-center px-5">
                  <p className="text-base font-black" style={{ color: "#e8c97a" }}>{s}</p>
                </div>
                {i < 2 && <div className="w-px h-6" style={{ background: "rgba(201,168,76,0.2)" }} />}
              </div>
            ))}
          </div>

          {/* 실시간 뱃지 */}
          <div
            style={{
              opacity: statsVisible ? 1 : 0,
              transition: "opacity 0.9s ease 500ms",
            }}
            className="mt-5 flex justify-center"
          >
            <div
              className="inline-flex items-center gap-2 rounded-full px-4 py-1.5"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                지금 <strong style={{ color: "rgba(255,255,255,0.7)" }}>{counter.toLocaleString()}명</strong>이 분석 중
              </span>
            </div>
          </div>
        </div>

        {/* ── 서비스 카드 ── */}
        <div className="space-y-4">
          {services.map((svc, i) => (
            <ServiceCard key={svc.id} svc={svc} index={i} startLabel={t.start} />
          ))}
        </div>

        {/* ── 하단 점 장식 ── */}
        <div
          style={{ opacity: footerVisible ? 1 : 0, transition: "opacity 1.2s ease 900ms" }}
          className="mt-14 text-center"
        >
          <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.18)" }}>{t.more}</p>
          <div className="flex justify-center gap-2 mb-10">
            {[0,1,2].map(i => (
              <span key={i} className="w-1 h-1 rounded-full" style={{ background: "rgba(201,168,76,0.3)" }} />
            ))}
          </div>
        </div>
      </div>

      {/* ── 푸터 ── */}
      <footer
        style={{ opacity: footerVisible ? 1 : 0, transition: "opacity 1.2s ease 1100ms", background: "linear-gradient(to top, rgba(6,6,14,0.95) 60%, transparent)" }}
        className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-4"
      >
        <div className="w-full text-center" style={{ background: "linear-gradient(to top, rgba(6,6,14,0.97), transparent)", paddingTop: 16 }}>
          <div className="flex items-center justify-center gap-3 text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>
            <span>{t.footer}</span>
            <span style={{ color: "rgba(201,168,76,0.3)" }}>·</span>
            <button onClick={() => router.push("/privacy")} className="hover:text-amber-400/70 transition-colors" style={{ color: "rgba(255,255,255,0.2)" }}>
              {t.privacy}
            </button>
            <span style={{ color: "rgba(201,168,76,0.3)" }}>·</span>
            <button onClick={() => router.push("/terms")} className="hover:text-amber-400/70 transition-colors" style={{ color: "rgba(255,255,255,0.2)" }}>
              {t.terms}
            </button>
            <span style={{ color: "rgba(201,168,76,0.3)" }}>·</span>
            <a href="http://pf.kakao.com/_cuksX" target="_blank" rel="noopener noreferrer" className="hover:text-yellow-400/70 transition-colors" style={{ color: "rgba(255,255,255,0.2)" }}>
              💬 문의
            </a>
            <span style={{ color: "rgba(201,168,76,0.3)" }}>·</span>
            <button onClick={() => router.push("/refund")} className="hover:text-amber-400/70 transition-colors" style={{ color: "rgba(255,255,255,0.2)" }}>
              환불규정
            </button>
          </div>
        </div>
      </footer>

      {/* ── 애니메이션 keyframes ── */}
      <style>{`
        @keyframes floatHanja0 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-18px) rotate(2deg); }
          66% { transform: translateY(10px) rotate(-1deg); }
        }
        @keyframes floatHanja1 {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-22px) rotate(-3deg); }
        }
        @keyframes floatHanja2 {
          0%, 100% { transform: translateY(0px); }
          40% { transform: translateY(16px); }
          80% { transform: translateY(-8px); }
        }
      `}</style>
    </main>
  );
}

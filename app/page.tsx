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

// ── 번역 데이터 ────────────────────────────────────────────────────────────
const T = {
  ko: {
    brand: "Summer Palace · AI 사주",
    title: "당신의 사주,\n지금 이 순간도\n말하고 있습니다",
    sub: "남들은 이미 확인했습니다\n당신만 아직 모르고 있었어요",
    start: "시작하기",
    more: "더 많은 AI 서비스가 준비 중입니다",
  },
  en: {
    brand: "Summer Palace · AI Saju",
    title: "Your Saju\nis speaking\nright now",
    sub: "Everyone else already checked.\nYou're the only one left.",
    start: "Start",
    more: "More AI services coming soon",
  },
  id: {
    brand: "Summer Palace · AI Saju",
    title: "Saju-mu\nsedang berbicara\nsaat ini",
    sub: "Orang lain sudah memeriksa.\nHanya kamu yang belum tahu.",
    start: "Mulai",
    more: "Lebih banyak layanan AI segera hadir",
  },
};

// ── 서비스 목록 ────────────────────────────────────────────────────────────
const SERVICES_KO = [
  {
    id: "saju",
    emoji: "🔮",
    title: "사주 오행 배경화면",
    desc: "내 사주에 부족한 오행이 있습니다\n그걸 채워주는 배경화면이 따로 있어요\n지금 확인 안 하면 계속 에너지가 새고 있는 겁니다",
    tags: ["배경화면", "오행 보정", "AI 생성"],
    href: "/saju",
    color: "from-indigo-600/20 to-purple-600/20",
    border: "border-indigo-500/30",
    glow: "rgba(99,102,241,0.18)",
    badge: "LIVE",
    badgeColor: "bg-indigo-500",
    accentColor: "text-indigo-300",
  },
  {
    id: "gunghap",
    emoji: "💑",
    title: "사주 궁합 분석",
    desc: "원진살 커플은 노력해도 결국 깨집니다\n지금 사귀는 사람, 내 에너지를 갉아먹는 사주인지\n3분 안에 확인하세요",
    tags: ["궁합", "바람기 분석", "원진살"],
    href: "/gunghap",
    color: "from-violet-600/20 to-pink-600/20",
    border: "border-violet-500/30",
    glow: "rgba(139,92,246,0.18)",
    badge: "LIVE",
    badgeColor: "bg-violet-500",
    accentColor: "text-violet-300",
  },
  {
    id: "stock",
    emoji: "📈",
    title: "사주 주식 투자 분석",
    desc: "말아먹는 사주가 따로 있습니다\n내 친구는 왜 나보다 주식으로 잘 버는 걸까요?\nETF·레버리지·코인 적합도 지금 확인",
    tags: ["주식", "코인", "ETF·레버리지"],
    href: "/stock",
    color: "from-emerald-600/20 to-teal-600/20",
    border: "border-emerald-500/30",
    glow: "rgba(16,185,129,0.18)",
    badge: "LIVE",
    badgeColor: "bg-emerald-600",
    accentColor: "text-emerald-300",
  },
  {
    id: "charm",
    emoji: "✨",
    title: "사주 매력 분석",
    desc: "저 사람은 왜 저렇게 이성에게 잘 보이는 걸까\n도화살·홍염살·내 일간의 숨은 매력\n본인만 모르고 있었던 비밀",
    tags: ["매력", "이성운", "도화살"],
    href: "/charm",
    color: "from-pink-600/20 to-violet-600/20",
    border: "border-pink-500/30",
    glow: "rgba(236,72,153,0.18)",
    badge: "LIVE",
    badgeColor: "bg-pink-600",
    accentColor: "text-pink-300",
  },
];

const SERVICES_EN = [
  {
    id: "saju",
    emoji: "🔮",
    title: "Saju Five Elements Wallpaper",
    desc: "Your Saju has a lacking element.\nThere's a specific wallpaper that fills it.\nNot checking means your energy keeps leaking.",
    tags: ["Wallpaper", "Element Fix", "AI Generated"],
    href: "/saju",
    color: "from-indigo-600/20 to-purple-600/20",
    border: "border-indigo-500/30",
    glow: "rgba(99,102,241,0.18)",
    badge: "LIVE",
    badgeColor: "bg-indigo-500",
    accentColor: "text-indigo-300",
  },
  {
    id: "gunghap",
    emoji: "💑",
    title: "Saju Compatibility Analysis",
    desc: "Wonjin couples always break up no matter what.\nIs the person you're dating draining your energy?\nFind out in 3 minutes.",
    tags: ["Compatibility", "Attraction", "Wonjin"],
    href: "/gunghap",
    color: "from-violet-600/20 to-pink-600/20",
    border: "border-violet-500/30",
    glow: "rgba(139,92,246,0.18)",
    badge: "LIVE",
    badgeColor: "bg-violet-500",
    accentColor: "text-violet-300",
  },
  {
    id: "stock",
    emoji: "📈",
    title: "Saju Investment Analysis",
    desc: "Some people are born to lose money in stocks.\nWhy does your friend earn more than you?\nCheck ETF · Leverage · Crypto compatibility now.",
    tags: ["Stocks", "Crypto", "ETF · Leverage"],
    href: "/stock",
    color: "from-emerald-600/20 to-teal-600/20",
    border: "border-emerald-500/30",
    glow: "rgba(16,185,129,0.18)",
    badge: "LIVE",
    badgeColor: "bg-emerald-600",
    accentColor: "text-emerald-300",
  },
  {
    id: "charm",
    emoji: "✨",
    title: "Saju Charm Analysis",
    desc: "Why does that person attract others so easily?\nDohwa · Hongyeom · hidden charm of your day pillar.\nA secret only you didn't know.",
    tags: ["Charm", "Attraction", "Dohwa"],
    href: "/charm",
    color: "from-pink-600/20 to-violet-600/20",
    border: "border-pink-500/30",
    glow: "rgba(236,72,153,0.18)",
    badge: "LIVE",
    badgeColor: "bg-pink-600",
    accentColor: "text-pink-300",
  },
];

const SERVICES_ID = [
  {
    id: "saju",
    emoji: "🔮",
    title: "Wallpaper Lima Elemen Saju",
    desc: "Saju-mu kekurangan elemen tertentu.\nAda wallpaper khusus yang mengisinya.\nTidak memeriksa berarti energimu terus bocor.",
    tags: ["Wallpaper", "Koreksi Elemen", "AI"],
    href: "/saju",
    color: "from-indigo-600/20 to-purple-600/20",
    border: "border-indigo-500/30",
    glow: "rgba(99,102,241,0.18)",
    badge: "LIVE",
    badgeColor: "bg-indigo-500",
    accentColor: "text-indigo-300",
  },
  {
    id: "gunghap",
    emoji: "💑",
    title: "Analisis Kecocokan Saju",
    desc: "Pasangan Wonjin selalu berpisah meski berusaha.\nApakah orang yang kamu pacari menguras energimu?\nCek dalam 3 menit.",
    tags: ["Kecocokan", "Daya Tarik", "Wonjin"],
    href: "/gunghap",
    color: "from-violet-600/20 to-pink-600/20",
    border: "border-violet-500/30",
    glow: "rgba(139,92,246,0.18)",
    badge: "LIVE",
    badgeColor: "bg-violet-500",
    accentColor: "text-violet-300",
  },
  {
    id: "stock",
    emoji: "📈",
    title: "Analisis Investasi Saju",
    desc: "Ada orang yang saju-nya rugi di saham.\nKenapa temanmu lebih sukses investasi dari kamu?\nCek kompatibilitas ETF · Leverage · Kripto sekarang.",
    tags: ["Saham", "Kripto", "ETF · Leverage"],
    href: "/stock",
    color: "from-emerald-600/20 to-teal-600/20",
    border: "border-emerald-500/30",
    glow: "rgba(16,185,129,0.18)",
    badge: "LIVE",
    badgeColor: "bg-emerald-600",
    accentColor: "text-emerald-300",
  },
  {
    id: "charm",
    emoji: "✨",
    title: "Analisis Daya Pikat Saju",
    desc: "Kenapa orang itu begitu menarik di mata lawan jenis?\nDohwa · Hongyeom · daya pikat tersembunyi hari-mu.\nRahasia yang hanya kamu tidak tahu.",
    tags: ["Daya Pikat", "Asmara", "Dohwa"],
    href: "/charm",
    color: "from-pink-600/20 to-violet-600/20",
    border: "border-pink-500/30",
    glow: "rgba(236,72,153,0.18)",
    badge: "LIVE",
    badgeColor: "bg-pink-600",
    accentColor: "text-pink-300",
  },
];

const SERVICES_BY_LANG: Record<Lang, typeof SERVICES_KO> = {
  ko: SERVICES_KO,
  en: SERVICES_EN,
  id: SERVICES_ID,
};

// ── 서비스 카드 ─────────────────────────────────────────────────────────────
function ServiceCard({ svc, index, startLabel }: { svc: typeof SERVICES_KO[0]; index: number; startLabel: string }) {
  const router = useRouter();
  const visible = useFadeIn(300 + index * 120);
  const [hovered, setHovered] = useState(false);
  const isLive = svc.badge === "LIVE";

  return (
    <div
      onClick={() => isLive && router.push(svc.href)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.7s ease ${300 + index * 120}ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) ${300 + index * 120}ms`,
        boxShadow: hovered && isLive ? `0 8px 48px ${svc.glow}` : "none",
      }}
      className={`relative bg-gradient-to-br ${svc.color} border ${svc.border} rounded-3xl p-6 transition-all duration-300 flex flex-col min-h-[220px] ${
        isLive ? "cursor-pointer hover:scale-[1.02] active:scale-[0.99]" : "opacity-50 cursor-default"
      }`}
    >
      <span className={`absolute top-4 right-4 text-xs font-bold px-2.5 py-1 rounded-full text-white ${svc.badgeColor}`}>
        {svc.badge}
      </span>
      <div className="text-4xl mb-4">{svc.emoji}</div>
      <h3 className="text-lg font-black text-white mb-2">{svc.title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed whitespace-pre-line mb-4 flex-1">{svc.desc}</p>
      <div className="flex flex-wrap gap-1.5">
        {svc.tags.map(tag => (
          <span key={tag} className="text-xs text-gray-400 bg-white/[0.07] border border-white/10 px-2.5 py-1 rounded-full">
            {tag}
          </span>
        ))}
      </div>
      {isLive && (
        <div className={`mt-5 flex items-center gap-1.5 text-sm font-semibold ${svc.accentColor}`}>
          <span>{startLabel}</span>
          <span
            style={{
              transform: hovered ? "translateX(5px)" : "translateX(0)",
              transition: "transform 0.2s ease",
              display: "inline-block",
            }}
          >→</span>
        </div>
      )}
    </div>
  );
}

// ── 메인 허브 페이지 ────────────────────────────────────────────────────────
export default function MainPage() {
  const [lang, setLang] = useState<Lang>("ko");
  const titleVisible = useFadeIn(60);
  const subVisible   = useFadeIn(200);
  const footerVisible = useFadeIn(700);

  const t = T[lang];
  const services = SERVICES_BY_LANG[lang];

  return (
    <main className="min-h-screen bg-[#06060e] text-white relative overflow-hidden">
      {/* 배경 글로우 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-15%] left-[-10%] w-[700px] h-[700px] rounded-full bg-indigo-900/20 blur-[180px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-900/15 blur-[160px]" />
        <div className="absolute top-[45%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-violet-800/8 blur-[100px]" />
      </div>

      {/* 언어 선택 */}
      <div className="fixed top-4 right-4 z-20 flex gap-1.5">
        {(["ko", "en", "id"] as Lang[]).map(l => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
              lang === l
                ? "bg-white/15 border-white/30 text-white"
                : "bg-white/5 border-white/10 text-gray-600 hover:text-gray-400"
            }`}
          >
            {l === "ko" ? "한국어" : l === "en" ? "EN" : "ID"}
          </button>
        ))}
      </div>

      <div className="relative z-10 max-w-lg mx-auto px-5 pb-24">
        {/* 헤더 */}
        <div className="pt-16 pb-12 text-center">
          <div
            style={{
              opacity: titleVisible ? 1 : 0,
              transform: titleVisible ? "translateY(0)" : "translateY(-10px)",
              transition: "opacity 0.7s ease 60ms, transform 0.7s cubic-bezier(0.22,1,0.36,1) 60ms",
            }}
          >
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
              <span className="text-xs text-gray-400 tracking-widest uppercase font-medium">{t.brand}</span>
            </div>

            <h1 className="text-4xl font-black mb-3 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent leading-tight pb-1 whitespace-pre-line">
              {t.title}
            </h1>
          </div>

          <div
            style={{
              opacity: subVisible ? 1 : 0,
              transition: "opacity 0.8s ease 200ms",
            }}
          >
            <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto whitespace-pre-line">
              {t.sub}
            </p>
          </div>
        </div>

        {/* 서비스 카드 */}
        <div className="space-y-4">
          {services.map((svc, i) => (
            <ServiceCard key={svc.id} svc={svc} index={i} startLabel={t.start} />
          ))}
        </div>

        {/* 하단 */}
        <div
          style={{ opacity: footerVisible ? 1 : 0, transition: "opacity 1s ease 700ms" }}
          className="mt-16 text-center"
        >
          <p className="text-xs text-gray-700">{t.more}</p>
          <div className="flex justify-center gap-1.5 mt-3">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-1 h-1 rounded-full bg-gray-700" />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

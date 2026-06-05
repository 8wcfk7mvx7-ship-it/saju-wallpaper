import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { template: "%s | 사주 가이드 — Summer Palace", default: "사주 가이드 — Summer Palace" },
  description: "사주팔자·오행·천간지지·신살·대운 등 명리학 기초를 알기 쉽게 설명합니다.",
};

const GUIDE_NAV = [
  { href: "/guide/saju-basics", label: "사주 기초" },
  { href: "/guide/ohaeng", label: "오행" },
  { href: "/guide/cheongan-jiji", label: "천간·지지" },
  { href: "/guide/sinsal", label: "신살" },
  { href: "/guide/daewoon", label: "대운·세운" },
];

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen" style={{ background: "#06060e", color: "#e8e8f0" }}>
      <header
        className="sticky top-0 z-50 border-b"
        style={{ background: "rgba(6,6,14,0.95)", borderColor: "rgba(255,255,255,0.08)", backdropFilter: "blur(16px)" }}
      >
        <div className="max-w-3xl mx-auto px-4 h-13 flex items-center gap-3 py-3">
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <span style={{ color: "#c9a84c", fontSize: 18 }}>☯</span>
            <span className="font-black text-sm text-white">Summer Palace</span>
          </Link>
          <span style={{ color: "rgba(255,255,255,0.2)" }}>›</span>
          <Link href="/guide" className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>가이드</Link>
        </div>
        <div
          className="max-w-3xl mx-auto px-4 pb-2 flex gap-3 overflow-x-auto"
          style={{ scrollbarWidth: "none" }}
        >
          {GUIDE_NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="shrink-0 text-xs font-semibold px-3 py-1 rounded-full transition-colors"
              style={{ color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              {label}
            </Link>
          ))}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-10">
        {children}
      </main>

      <footer className="border-t mt-16 py-10 text-center" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
        <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
          사주 분석을 직접 해보고 싶으신가요?
        </p>
        <Link
          href="/saju"
          className="inline-flex items-center gap-2 text-sm font-bold px-6 py-3 rounded-xl"
          style={{
            background: "rgba(201,168,76,0.12)",
            color: "#c9a84c",
            border: "1px solid rgba(201,168,76,0.3)",
          }}
        >
          내 사주 분석 시작하기 →
        </Link>
        <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          <Link href="/">홈</Link>
          <Link href="/guide">가이드 목록</Link>
          <Link href="/blog">블로그</Link>
          <Link href="/terms">이용약관</Link>
          <Link href="/privacy">개인정보처리방침</Link>
        </div>
        <p className="text-xs mt-4" style={{ color: "rgba(255,255,255,0.15)" }}>
          © 2026 Summer Palace · 본 콘텐츠는 오락·교육 목적의 참고 자료입니다
        </p>
      </footer>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: { template: "%s | Summer Palace 블로그", default: "Summer Palace 블로그" },
  description: "연도별 운세 흐름, 일간별 특성, 명리학 심화 분석 등 사주 관련 콘텐츠를 다룹니다.",
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
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
          <Link href="/blog" className="text-sm font-semibold" style={{ color: "rgba(255,255,255,0.5)" }}>블로그</Link>
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
          <Link href="/guide">가이드</Link>
          <Link href="/blog">블로그 목록</Link>
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

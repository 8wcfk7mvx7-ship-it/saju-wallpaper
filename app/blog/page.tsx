import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Summer Palace 블로그 — 사주 심화 콘텐츠",
  description: "2026 병오년 운세, 일간별 특성 분석, 명리학 심화 주제를 다루는 Summer Palace 블로그입니다.",
};

const POSTS = [
  {
    href: "/blog/2026-byeongoh-year",
    emoji: "🐴",
    badge: "2026 시즌",
    badgeColor: "#f97316",
    title: "2026 병오년(丙午年) 운세 흐름 완전 분석",
    desc: "불과 불이 겹치는 강렬한 해, 2026 병오년. 일간별 기회와 주의 사항, 올해의 핵심 흐름을 명리학으로 분석합니다.",
    date: "2026.06.01",
    readTime: "약 7분",
  },
];

export default function BlogPage() {
  return (
    <div>
      <div className="mb-10">
        <p className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: "#c9a84c" }}>
          Summer Palace · 블로그
        </p>
        <h1 className="text-3xl font-black text-white mb-3">사주 심화 콘텐츠</h1>
        <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
          연도별 운세, 일간별 특성, 명리학 심화 주제를 다룹니다.
        </p>
      </div>

      <div className="space-y-3">
        {POSTS.map(({ href, emoji, badge, badgeColor, title, desc, date, readTime }) => (
          <Link
            key={href}
            href={href}
            className="block rounded-2xl p-5 transition-all"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex items-start gap-4">
              <span className="text-2xl shrink-0 mt-0.5">{emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: `${badgeColor}22`, color: badgeColor, border: `1px solid ${badgeColor}44` }}>
                    {badge}
                  </span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{date}</span>
                </div>
                <h2 className="text-base font-bold text-white mb-1">{title}</h2>
                <p className="text-sm leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>{desc}</p>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>읽는 시간: {readTime}</span>
              </div>
              <span className="text-sm shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>›</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-2xl p-5" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}>
        <p className="text-sm font-semibold mb-1" style={{ color: "#c9a84c" }}>사주 기초부터 배우고 싶다면</p>
        <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>오행·천간지지·신살·대운을 기초부터 설명하는 가이드 페이지를 확인해보세요.</p>
        <Link href="/guide" className="text-xs font-bold" style={{ color: "#c9a84c" }}>가이드 바로가기 →</Link>
      </div>
    </div>
  );
}

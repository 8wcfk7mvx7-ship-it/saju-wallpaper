"use client";
import { usePathname, useRouter } from "next/navigation";

const TABS = [
  { href: "/", label: "홈", icon: "🏠", match: (p: string) => p === "/" },
  { href: "/service/manseryeok", label: "만세력", icon: "📜", match: (p: string) => p.startsWith("/service/manseryeok") },
  { href: "/service/chat", label: "AI채팅", icon: "💬", match: (p: string) => p.startsWith("/service/chat") },
  { href: "/charge", label: "별조각", icon: "✦", match: (p: string) => p.startsWith("/charge") },
  { href: "/mypage", label: "마이", icon: "👤", match: (p: string) => p.startsWith("/mypage") },
];

// 자체 풀스크린 플로우(결제/로딩/생성 등)에서는 하단 탭바를 숨김
const SUPPRESS_PREFIXES = ["/loading", "/generating", "/pay", "/success", "/epub"];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  if (SUPPRESS_PREFIXES.some(p => pathname.startsWith(p)) || pathname.includes("/pay") || pathname.includes("/success")) {
    return null;
  }

  return (
    <nav
      className="sm:hidden fixed bottom-0 left-0 right-0 z-50 flex items-stretch"
      style={{
        background: "rgba(8,8,18,0.92)",
        backdropFilter: "blur(20px)",
        borderTop: "1px solid rgba(255,255,255,0.08)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {TABS.map(tab => {
        const active = tab.match(pathname);
        return (
          <button
            key={tab.href}
            onClick={() => router.push(tab.href)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2"
            style={{ color: active ? "#a78bfa" : "rgba(255,255,255,0.4)" }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.icon}</span>
            <span style={{ fontSize: 10, fontWeight: active ? 800 : 600 }}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

"use client";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

// 하단 탭바가 없는 풀스크린 화면(MobileBottomNav의 SUPPRESS_PREFIXES와 동일)에서는
// 탭바 자리만큼의 하단 패딩도 함께 없애야 실제 화면 높이와 어긋나지 않는다.
const SUPPRESS_PREFIXES = ["/loading", "/generating", "/pay", "/success", "/epub"];

export default function PageContentFrame({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const suppressed = SUPPRESS_PREFIXES.some(p => pathname.startsWith(p)) || pathname.includes("/pay") || pathname.includes("/success");

  if (suppressed) {
    return <>{children}</>;
  }

  return (
    <div style={{ paddingBottom: "calc(56px + env(safe-area-inset-bottom))" }} className="sm:pb-0">
      {children}
    </div>
  );
}

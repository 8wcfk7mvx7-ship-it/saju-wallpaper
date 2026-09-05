"use client";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import LoginOptions from "./LoginOptions";

function parseUser() {
  try {
    const match = document.cookie.split(";").find(c => c.trim().startsWith("sp_user="));
    if (!match) return null;
    const encoded = match.trim().split("=")[1];
    return JSON.parse(atob(encoded));
  } catch { return null; }
}

// 자체 헤더가 있어서 글로벌 헤더가 필요 없는 경로
const SUPPRESS_PATHS = ["/"];

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ nickname: string; profileImage?: string } | null>(null);
  const [stars, setStars] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);

  function handleLoginClick() {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      router.push(`/login-select?returnTo=${encodeURIComponent(pathname)}`);
    } else {
      setShowLoginModal(true);
    }
  }

  useEffect(() => {
    function refresh() {
      const u = parseUser();
      setUser(u);
      if (u) {
        let s = parseInt(localStorage.getItem("sp_blueberries") ?? "", 10);
        if (isNaN(s)) {
          s = 864000;
          localStorage.setItem("sp_blueberries", String(s));
        }
        setStars(s);
      } else {
        setStars(0);
      }
    }
    refresh();
    window.addEventListener("sp-auth-changed", refresh);
    return () => window.removeEventListener("sp-auth-changed", refresh);
  }, [pathname]);

  if (SUPPRESS_PATHS.includes(pathname) || pathname.startsWith("/epub")) return null;

  return (
    <header
      className="sticky top-0 z-50 border-b"
      style={{
        background: "rgba(6,6,14,0.92)",
        backdropFilter: "blur(16px)",
        borderColor: "rgba(255,255,255,0.07)",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* 로고 */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 shrink-0"
          aria-label="홈으로"
        >
          <svg width="22" height="22" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="14" fill="#1a1a2e" stroke="rgba(201,168,76,0.3)" strokeWidth="1"/>
            <path d="M16 7 L17.8 12.5 L23.5 12.5 L19 15.8 L20.8 21.3 L16 18 L11.2 21.3 L13 15.8 L8.5 12.5 L14.2 12.5 Z" fill="#c9a84c"/>
          </svg>
          <span className="font-black text-sm tracking-tight text-white">Summer Palace</span>
          <span
            className="hidden sm:block text-[10px] px-2 py-0.5 rounded-full font-black"
            style={{ background: "rgba(59,130,246,0.15)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.25)" }}
          >
            AI 사주
          </span>
        </button>

        {/* 우측 */}
        <div className="flex items-center gap-2">
          {/* 별조각 */}
          {user && (
            <button
              onClick={() => router.push("/charge")}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold"
              style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", color: "#a78bfa" }}
            >
              ✦ {stars.toLocaleString()}
            </button>
          )}

          {/* 보관함 */}
          <button
            onClick={() => router.push("/mypage")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
          >
            <span className="hidden sm:inline">보관함</span>
          </button>

          {/* 로그인/로그아웃 */}
          {user ? (
            <button
              onClick={() => { document.cookie = "sp_user=; max-age=0; path=/"; location.reload(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}
            >
              로그아웃
            </button>
          ) : (
            <button
              onClick={handleLoginClick}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)", color: "#a78bfa" }}
            >
              로그인하기
            </button>
          )}
        </div>
      </div>

      {/* 데스크톱 로그인 선택 팝업 */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center overflow-y-auto py-8"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="w-full max-w-sm mx-4 rounded-2xl p-6 max-h-full overflow-y-auto"
            style={{ background: "#0c0c18", border: "1px solid rgba(255,255,255,0.1)" }}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-lg font-black text-center mb-1 text-white">로그인</h2>
            <p className="text-sm text-gray-500 text-center mb-6">간편하게 로그인하고 별조각을 안전하게 보관하세요.</p>
            <LoginOptions onClose={() => setShowLoginModal(false)} returnTo={pathname} />
          </div>
        </div>
      )}
    </header>
  );
}

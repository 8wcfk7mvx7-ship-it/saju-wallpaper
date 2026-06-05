"use client";
import { useEffect, useState } from "react";

interface NaverUser {
  naverId: string;
  nickname: string;
  profileImage: string | null;
  email: string | null;
}

function parseUser(): NaverUser | null {
  try {
    const match = document.cookie.split(";").find(c => c.trim().startsWith("sp_user="));
    if (!match) return null;
    const encoded = match.trim().split("=")[1];
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}

const NaverIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" fill="#fff"/>
  </svg>
);

interface KakaoLoginButtonProps {
  redirectTo?: string;
  floating?: boolean;
}

export default function KakaoLoginButton({ redirectTo = "/", floating = false }: KakaoLoginButtonProps) {
  const [user, setUser] = useState<NaverUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setUser(parseUser());
  }, []);

  if (!mounted) return null;

  function logout() {
    document.cookie = "sp_user=; max-age=0; path=/";
    setUser(null);
  }

  // ── 플로팅 모바일 CTA ────────────────────────────────────────────────────
  if (floating) {
    if (user) return null;
    return (
      <a
        href={`/api/auth/naver?redirect=${encodeURIComponent(redirectTo)}`}
        className="flex items-center justify-center gap-2.5 w-full py-3 rounded-2xl font-black text-white transition-all active:scale-[0.99] whitespace-nowrap overflow-hidden"
        style={{ background: "#03C75A", boxShadow: "0 4px 20px rgba(3,199,90,0.3)" }}
      >
        <NaverIcon size={20} />
        <span className="text-[14px]">네이버로 시작하기</span>
      </a>
    );
  }

  // ── 기본 네비게이션 버튼 ──────────────────────────────────────────────────
  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.profileImage && (
          <img src={user.profileImage} alt="" className="w-7 h-7 rounded-full object-cover" />
        )}
        <span className="hidden sm:block text-sm text-gray-300">{user.nickname}</span>
        <button onClick={logout} className="text-xs text-gray-600 hover:text-gray-400 transition">
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <a
      href={`/api/auth/naver?redirect=${encodeURIComponent(redirectTo)}`}
      className="inline-flex items-center gap-1.5 text-white font-black text-xs px-3 py-2 rounded-xl transition-all whitespace-nowrap"
      style={{ background: "#03C75A" }}
    >
      <NaverIcon size={16} />
      <span>네이버로 시작하기</span>
    </a>
  );
}

export function useKakaoUser(): NaverUser | null {
  const [user, setUser] = useState<NaverUser | null>(null);
  useEffect(() => { setUser(parseUser()); }, []);
  return user;
}

"use client";
import { useEffect, useState } from "react";

interface KakaoUser {
  kakaoId: string;
  nickname: string;
  profileImage: string | null;
  email: string | null;
}

function parseUser(): KakaoUser | null {
  try {
    const match = document.cookie.split(";").find(c => c.trim().startsWith("sp_user="));
    if (!match) return null;
    const encoded = match.trim().split("=")[1];
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}

const KakaoIcon = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
    <path d="M9 1.5C4.858 1.5 1.5 4.134 1.5 7.375c0 2.1 1.377 3.94 3.45 5.017l-.879 3.243a.281.281 0 00.432.3l3.87-2.565A8.9 8.9 0 009 13.25c4.142 0 7.5-2.634 7.5-5.875S13.142 1.5 9 1.5z" fill="#1A1A1A"/>
  </svg>
);

interface KakaoLoginButtonProps {
  redirectTo?: string;
  floating?: boolean;
}

export default function KakaoLoginButton({ redirectTo = "/", floating = false }: KakaoLoginButtonProps) {
  const [user, setUser] = useState<KakaoUser | null>(null);
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
        href={`/api/auth/kakao?redirect=${encodeURIComponent(redirectTo)}`}
        className="flex items-center justify-center gap-2.5 w-full py-3 rounded-2xl font-black text-[#1A1A1A] transition-all active:scale-[0.99]"
        style={{ background: "#FEE500", boxShadow: "0 4px 20px rgba(254,229,0,0.3)" }}
      >
        <KakaoIcon size={20} />
        <span className="text-[14px]">카카오톡으로 시작하기</span>
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
      href={`/api/auth/kakao?redirect=${encodeURIComponent(redirectTo)}`}
      className="inline-flex items-center gap-1.5 bg-[#FEE500] hover:bg-[#F5DC00] text-[#1A1A1A] font-black text-xs px-3 py-2 rounded-xl transition-all whitespace-nowrap"
    >
      <KakaoIcon size={16} />
      <span>카카오톡으로 시작하기</span>
    </a>
  );
}

export function useKakaoUser(): KakaoUser | null {
  const [user, setUser] = useState<KakaoUser | null>(null);
  useEffect(() => { setUser(parseUser()); }, []);
  return user;
}

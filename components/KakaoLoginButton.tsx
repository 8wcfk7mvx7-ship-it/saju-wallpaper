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

export default function KakaoLoginButton({ redirectTo = "/" }: { redirectTo?: string }) {
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

  if (user) {
    return (
      <div className="flex items-center gap-2">
        {user.profileImage && (
          <img src={user.profileImage} alt="" className="w-7 h-7 rounded-full object-cover" />
        )}
        <span className="text-sm text-gray-300">{user.nickname}</span>
        <button onClick={logout} className="text-xs text-gray-600 hover:text-gray-400 transition">
          로그아웃
        </button>
      </div>
    );
  }

  return (
    <a
      href={`/api/auth/kakao?redirect=${encodeURIComponent(redirectTo)}`}
      className="inline-flex items-center gap-2 bg-[#FEE500] hover:bg-[#F5DC00] text-[#1A1A1A] font-bold text-sm px-4 py-2.5 rounded-xl transition-all"
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M9 1.5C4.858 1.5 1.5 4.134 1.5 7.375c0 2.1 1.377 3.94 3.45 5.017l-.879 3.243a.281.281 0 00.432.3l3.87-2.565A8.9 8.9 0 009 13.25c4.142 0 7.5-2.634 7.5-5.875S13.142 1.5 9 1.5z" fill="#1A1A1A"/>
      </svg>
      카카오로 시작하기
    </a>
  );
}

export function useKakaoUser(): KakaoUser | null {
  const [user, setUser] = useState<KakaoUser | null>(null);
  useEffect(() => { setUser(parseUser()); }, []);
  return user;
}

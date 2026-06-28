"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface NaverUser {
  naverId: string;
  nickname: string;
  profileImage: string | null;
  email: string | null;
  isNewUser?: boolean;
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

interface KakaoLoginButtonProps {
  redirectTo?: string;
  floating?: boolean;
}

export default function KakaoLoginButton({ redirectTo = "/", floating = false }: KakaoLoginButtonProps) {
  const router = useRouter();
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
    if (user) {
      return (
        <div className="flex items-center justify-between w-full py-2.5 px-4 rounded-2xl"
          style={{ background: "rgba(3,199,90,0.1)", border: "1px solid rgba(3,199,90,0.25)" }}>
          <div className="flex items-center gap-2">
            {user.profileImage && (
              <img src={user.profileImage} alt="" className="w-7 h-7 rounded-full object-cover" />
            )}
            <span className="text-sm font-bold text-white">
              안녕하세요, {user.nickname || user.naverId}님!
            </span>
          </div>
          <button onClick={logout} className="text-xs px-2.5 py-1 rounded-lg transition-colors"
            style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)" }}>
            로그아웃
          </button>
        </div>
      );
    }
    return (
      <button
        onClick={() => router.push(`/login-select?redirect=${encodeURIComponent(redirectTo)}`)}
        className="flex items-center justify-center gap-2.5 w-full py-3 rounded-2xl font-black text-white transition-all active:scale-[0.99] whitespace-nowrap overflow-hidden"
        style={{ background: "#6366f1", boxShadow: "0 4px 20px rgba(99,102,241,0.3)" }}
      >
        <span className="text-[14px]">로그인하기</span>
      </button>
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
    <button
      onClick={() => router.push(`/login-select?redirect=${encodeURIComponent(redirectTo)}`)}
      className="inline-flex items-center gap-1.5 text-white font-black text-xs px-3 py-2 rounded-xl transition-all whitespace-nowrap"
      style={{ background: "#6366f1" }}
    >
      <span>로그인하기</span>
    </button>
  );
}

export function useKakaoUser(): NaverUser | null {
  const [user, setUser] = useState<NaverUser | null>(null);
  useEffect(() => { setUser(parseUser()); }, []);
  return user;
}

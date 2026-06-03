"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function parseUser() {
  try {
    const match = document.cookie.split(";").find(c => c.trim().startsWith("sp_user="));
    if (!match) return null;
    return JSON.parse(atob(match.trim().split("=")[1]));
  } catch {
    return null;
  }
}

export default function AdultGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "gate">("loading");
  const [redirect, setRedirect] = useState("/");

  useEffect(() => {
    setRedirect(window.location.pathname);
    setStatus(parseUser() ? "ok" : "gate");
  }, []);

  if (status === "loading") return null;

  if (status === "gate") {
    return (
      <main className="min-h-screen bg-[#0a0101] text-white flex items-center justify-center px-4">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-red-950/40 blur-[140px]" />
        </div>
        <div className="relative z-10 max-w-xs w-full text-center">
          <div className="text-6xl mb-6">🔞</div>
          <h1 className="text-xl font-black mb-2">로그인이 필요합니다</h1>
          <p className="text-gray-400 text-sm mb-8 leading-relaxed">
            19금 콘텐츠는 카카오 로그인 후<br />이용할 수 있습니다.
          </p>
          <div className="space-y-3">
            <a
              href={`/api/auth/kakao?redirect=${encodeURIComponent(redirect)}`}
              className="w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              style={{ background: "#FEE500", color: "#1A1A1A" }}
            >
              <svg width="20" height="20" viewBox="0 0 18 18" fill="none">
                <path d="M9 1.5C4.858 1.5 1.5 4.134 1.5 7.375c0 2.1 1.377 3.94 3.45 5.017l-.879 3.243a.281.281 0 00.432.3l3.87-2.565A8.9 8.9 0 009 13.25c4.142 0 7.5-2.634 7.5-5.875S13.142 1.5 9 1.5z" fill="#1A1A1A"/>
              </svg>
              카카오로 로그인하기
            </a>
            <button
              onClick={() => router.push("/")}
              className="w-full py-3 rounded-2xl font-semibold text-sm text-gray-500 hover:text-gray-300 border border-white/10 transition"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}

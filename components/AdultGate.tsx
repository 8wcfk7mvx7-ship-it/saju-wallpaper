"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "sp_adult_ok";

function isLoggedIn() {
  try {
    return !!document.cookie.split(";").find(c => c.trim().startsWith("sp_user="));
  } catch {
    return false;
  }
}

export default function AdultGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "ok" | "gate">("loading");
  const [redirect, setRedirect] = useState("/");

  useEffect(() => {
    setRedirect(window.location.pathname);
    if (isLoggedIn() || localStorage.getItem(STORAGE_KEY) === "1") {
      setStatus("ok");
    } else {
      setStatus("gate");
    }
  }, []);

  function confirm19() {
    localStorage.setItem(STORAGE_KEY, "1");
    setStatus("ok");
  }

  if (status === "loading") return null;
  if (status === "ok") return <>{children}</>;

  return (
    <main className="min-h-screen text-white flex items-center justify-center px-4"
      style={{ background: "#0a0101" }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[140px]"
          style={{ background: "rgba(127,0,0,0.35)" }} />
      </div>

      <div className="relative z-10 max-w-xs w-full text-center">
        <div className="text-6xl mb-5">🔞</div>
        <h1 className="text-xl font-black mb-2">성인 전용 콘텐츠</h1>
        <p className="text-sm mb-8 leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
          이 페이지는 만 19세 이상을 위한 콘텐츠입니다.<br />
          본인이 만 19세 이상임을 확인해 주세요.
        </p>

        <div className="space-y-3">
          <button
            onClick={confirm19}
            className="w-full py-4 rounded-2xl font-black text-base transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #7c3aed, #dc2626)", color: "#fff" }}
          >
            만 19세 이상입니다 — 입장
          </button>

          <a
            href={`/api/auth/naver?redirect=${encodeURIComponent(redirect)}`}
            className="w-full py-3.5 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            style={{ background: "#03C75A", color: "#fff" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" fill="#fff"/>
            </svg>
            네이버 로그인하면 자동 확인
          </a>

          <button
            onClick={() => router.push("/")}
            className="w-full py-2.5 text-sm transition-colors"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            돌아가기
          </button>
        </div>

        <p className="text-xs mt-6" style={{ color: "rgba(255,255,255,0.18)" }}>
          허위 확인 시 책임은 이용자에게 있습니다
        </p>
      </div>
    </main>
  );
}

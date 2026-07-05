"use client";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const GOOGLE_CLIENT_ID = "890801754093-edh505ocbhojnbr2fmfkj4rum2p3recr.apps.googleusercontent.com";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (cfg: object) => void;
          renderButton: (el: HTMLElement, cfg: object) => void;
          prompt: () => void;
        };
      };
    };
  }
}

export default function LoginOptions({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function init() {
      if (!window.google?.accounts?.id || !btnRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (resp: { credential: string }) => {
          const res = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: resp.credential, redirect: pathname || "/" }),
          });
          const data = await res.json();
          if (data.ok) router.push(data.redirect || "/");
        },
      });
      window.google.accounts.id.renderButton(btnRef.current, {
        theme: "outline",
        size: "large",
        width: btnRef.current.offsetWidth || 320,
        text: "signin_with",
        locale: "ko",
      });
    }

    if (window.google?.accounts?.id) {
      init();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) { clearInterval(interval); init(); }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [pathname, router]);

  return (
    <div className="w-full space-y-3">
      {/* Google 로그인 */}
      <div ref={btnRef} className="w-full overflow-hidden rounded-2xl" style={{ minHeight: 44 }} />

      {/* Apple 로그인 */}
      <a
        href={`/api/auth/apple?redirect=${encodeURIComponent(pathname || "/")}`}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
        style={{ background: "#000", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}
      >
        <svg width="16" height="16" viewBox="0 0 384 512" fill="#fff">
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1-2 49.9-15.2 69.5-34.3z"/>
        </svg>
        Apple로 로그인
      </a>

      {onClose && (
        <button onClick={onClose}
          className="w-full py-3 rounded-2xl font-bold text-sm text-gray-400 hover:text-gray-200 transition-all">
          닫기
        </button>
      )}
    </div>
  );
}

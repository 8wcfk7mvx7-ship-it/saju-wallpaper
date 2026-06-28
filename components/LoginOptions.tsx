"use client";
import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

const GOOGLE_CLIENT_ID = "890801754093-edh505ocbhojnbr2fmfkj4rum2p3recr.apps.googleusercontent.com";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (resp: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function LoginOptions({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const redirect = pathname || "/";
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function handleCredential(resp: { credential: string }) {
      try {
        const res = await fetch("/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: resp.credential, redirect }),
        });
        const data = await res.json();
        if (data.ok) {
          onClose?.();
          router.push(data.redirect || "/");
          router.refresh();
        }
      } catch {}
    }

    function init() {
      if (!window.google || !googleBtnRef.current) return;
      window.google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredential });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        width: 320,
        text: "continue_with",
        locale: "ko",
      });
    }

    if (window.google) {
      init();
    } else {
      const timer = setInterval(() => {
        if (window.google) {
          clearInterval(timer);
          init();
        }
      }, 200);
      return () => clearInterval(timer);
    }
  }, [redirect, router, onClose]);

  return (
    <div className="w-full space-y-3">
      <div ref={googleBtnRef} className="w-full flex justify-center" />
      <a
        href={`/api/auth/kakao?redirect=${encodeURIComponent(redirect)}`}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
        style={{ background: "#FEE500", color: "#191919" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 3C6.477 3 2 6.477 2 10.74c0 2.73 1.84 5.13 4.6 6.5l-1.04 3.8a.6.6 0 0 0 .9.66l4.34-2.87c.39.04.79.06 1.2.06 5.523 0 10-3.477 10-7.65C22 6.477 17.523 3 12 3z" fill="#191919"/>
        </svg>
        카카오로 로그인
      </a>
      <a
        href={`/api/auth/naver?redirect=${encodeURIComponent(redirect)}`}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
        style={{ background: "#03C75A", color: "#fff" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" fill="#fff"/>
        </svg>
        네이버로 로그인
      </a>
      <a
        href={`/api/auth/apple?redirect=${encodeURIComponent(redirect)}`}
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

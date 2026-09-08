"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";

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

/** Capacitor로 감싼 앱(iOS/안드로이드) 안에서 실행 중인가. */
function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
  return Boolean(cap?.isNativePlatform?.());
}

interface Props {
  /** 로그인(또는 게스트 진입)이 끝나면 호출된다. */
  onDone: (mode: "account" | "guest") => void;
  /** 아이패드에서는 카드 폭을 조금 더 넓게 잡는다. */
  wide?: boolean;
}

/**
 * 이펍공장 앱 로그인 화면.
 * 구글/애플/이메일/게스트 네 가지 진입 방법을 제공한다.
 * 게스트는 계정 없이 이 기기에만 저장되는 모드다.
 */
export default function AppLogin({ onDone, wide = false }: Props) {
  const googleHostRef = useRef<HTMLDivElement>(null);
  const [mode, setMode] = useState<"choose" | "email">("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // 구글 로그인: 우리 디자인의 버튼을 쓰기 위해 구글이 그려주는 버튼은 숨겨두고 클릭만 전달한다.
  // 단, 앱(WebView) 안에서는 구글 팝업이 뜨지 않으므로 리다이렉트 방식으로 넘긴다.
  useEffect(() => {
    if (isNativeApp()) return;

    function init() {
      if (!window.google?.accounts?.id || !googleHostRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async (resp: { credential: string }) => {
          const res = await fetch("/api/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: resp.credential, redirect: "/epub-app" }),
          });
          const data = await res.json();
          if (data.ok) {
            window.dispatchEvent(new Event("sp-auth-changed"));
            onDone("account");
          } else {
            setError("구글 로그인에 실패했어요. 다시 시도해 주세요.");
          }
        },
      });
      window.google.accounts.id.renderButton(googleHostRef.current, {
        theme: "outline",
        size: "large",
        width: 320,
        text: "signin_with",
        locale: "ko",
      });
    }

    if (window.google?.accounts?.id) {
      init();
      return;
    }
    const timer = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(timer);
        init();
      }
    }, 200);
    return () => clearInterval(timer);
  }, [onDone]);

  function handleGoogleClick() {
    setError("");

    // 앱 안에서는 구글 JS 팝업이 동작하지 않는다(구글도 WebView 내 팝업 로그인을 막는다).
    // 애플 로그인과 동일하게 화면 전체를 넘겼다가 되돌아오는 방식을 쓴다.
    if (isNativeApp()) {
      window.location.href = "/api/auth/google/start?redirect=/epub-app";
      return;
    }

    // 구글이 렌더한 실제 버튼을 대신 눌러준다(디자인은 우리 것, 동작은 구글 것).
    const realButton = googleHostRef.current?.querySelector<HTMLElement>('div[role="button"]');
    if (realButton) {
      realButton.click();
      return;
    }
    window.google?.accounts?.id?.prompt();
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    if (!supabaseBrowser) {
      setError("로그인 설정이 아직 준비되지 않았어요.");
      return;
    }
    setBusy(true);
    const { error: signErr } = await supabaseBrowser.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (signErr) {
      setError("이메일 또는 비밀번호가 올바르지 않아요.");
      return;
    }
    onDone("account");
  }

  const cardWidth = wide ? 460 : 340;

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center px-6"
      style={{ background: "#f0efec" }}
    >
      <div className="w-full flex flex-col items-center" style={{ maxWidth: cardWidth }}>
        {/* 앱 이름 */}
        <div className="mb-10 text-center">
          <div
            className="font-black tracking-tight"
            style={{ fontSize: wide ? 34 : 28, color: "#2a2417" }}
          >
            이펍공장
          </div>
          <div className="mt-2 text-sm font-medium" style={{ color: "#8a8577" }}>
            전자책을 만드는 가장 쉬운 방법
          </div>
        </div>

        {mode === "choose" ? (
          <div className="w-full space-y-3.5">
            <PillButton onClick={handleGoogleClick} label="Google 계정으로 시작" icon={<GoogleIcon />} />
            <PillButton
              onClick={() => { window.location.href = "/api/auth/apple?redirect=/epub-app"; }}
              label="Apple 계정으로 시작"
              icon={<AppleIcon />}
            />
            <PillButton onClick={() => { setError(""); setMode("email"); }} label="이메일로 시작" icon={<MailIcon />} />
            <PillButton onClick={() => onDone("guest")} label="게스트로 시작" />
          </div>
        ) : (
          <form onSubmit={handleEmailSubmit} className="w-full space-y-3">
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="이메일"
              autoComplete="email"
              className="w-full rounded-2xl px-5 py-4 text-[15px] outline-none"
              style={{ background: "#fff", color: "#2a2417", border: "1px solid rgba(0,0,0,0.08)" }}
            />
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="비밀번호"
              autoComplete="current-password"
              className="w-full rounded-2xl px-5 py-4 text-[15px] outline-none"
              style={{ background: "#fff", color: "#2a2417", border: "1px solid rgba(0,0,0,0.08)" }}
            />
            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-full py-4 font-bold text-[15px] transition-transform active:scale-[0.99] disabled:opacity-60"
              style={{ background: "#2a2417", color: "#fff" }}
            >
              {busy ? "로그인 중…" : "로그인"}
            </button>
            <button
              type="button"
              onClick={() => { setError(""); setMode("choose"); }}
              className="w-full py-3 text-sm font-semibold"
              style={{ color: "#8a8577" }}
            >
              다른 방법으로 시작
            </button>
          </form>
        )}

        {error && (
          <p className="mt-4 text-sm font-semibold text-center" style={{ color: "#b91c1c" }}>{error}</p>
        )}

        <p className="mt-8 text-xs text-center leading-relaxed" style={{ color: "#a5a094" }}>
          게스트로 시작하면 계정 없이 바로 쓸 수 있고,
          <br />
          원고는 이 기기에만 저장됩니다.
        </p>
      </div>

      {/* 구글이 실제로 렌더하는 버튼(화면에는 보이지 않지만 클릭 대상은 살아있어야 한다) */}
      <div
        ref={googleHostRef}
        aria-hidden
        style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 320, height: 44, overflow: "hidden" }}
      />
    </div>
  );
}

function PillButton({ onClick, label, icon }: { onClick: () => void; label: string; icon?: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-full flex items-center justify-center gap-2.5 font-bold transition-transform active:scale-[0.98]"
      style={{
        background: "#fff",
        color: "#1c1c1e",
        fontSize: 16,
        paddingTop: 17,
        paddingBottom: 17,
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 384 512" fill="#000" aria-hidden>
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1-2 49.9-15.2 69.5-34.3z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="#1c1c1e" aria-hidden>
      <path d="M2 5.5A1.5 1.5 0 0 1 3.5 4h17A1.5 1.5 0 0 1 22 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-17A1.5 1.5 0 0 1 2 18.5v-13Zm2.6.5 7.4 5.55L19.4 6H4.6Z" />
    </svg>
  );
}

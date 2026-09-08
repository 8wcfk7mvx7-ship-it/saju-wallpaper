"use client";
import { useState } from "react";
import { CloverStamp } from "@/components/LuckArt";
import { signInWithApple, signInWithGoogle, signUpWithEmail, signInWithEmail, isCloudSyncConfigured } from "@/lib/auth";

// 아이폰 표준 로그인 시트(구글/애플/이메일/게스트가 같은 모양 알약 버튼으로 나란히)를
// 참고해서, 화면을 두 단계로 나눴다 — 처음엔 4개 버튼만 보여주고("이메일로 계속하기"를
// 누른 사람만) 이메일·비밀번호 입력 폼으로 넘어간다. 항상 폼까지 다 펼쳐 보여주던 이전
// 버전보다 훨씬 단순해 보인다.
export default function AuthScreen({ onBack, onAuthed }: { onBack: () => void; onAuthed: () => void }) {
  const [view, setView] = useState<"options" | "email">("options");
  const configured = isCloudSyncConfigured();

  return (
    <main className="min-h-screen page-fade-in" style={{ background: "var(--bg)" }}>
      <div className="max-w-lg mx-auto px-6 pt-10 pb-16">
        <button onClick={view === "email" ? () => setView("options") : onBack} className="text-sm font-bold mb-4" style={{ color: "var(--ink-soft)" }}>
          ← 뒤로
        </button>

        <div className="text-center mb-8">
          <CloverStamp size={56} className="mx-auto mb-3 float-leaf" />
          <h1 className="font-display text-2xl" style={{ color: "var(--ink)" }}>로그인</h1>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            로그인하면 여러 기기에서<br />데이터를 백업·동기화할 수 있어요.
          </p>
        </div>

        {view === "options" ? (
          <OptionsView configured={configured} onEmail={() => setView("email")} onGuest={onBack} />
        ) : (
          <EmailView configured={configured} onAuthed={onAuthed} />
        )}

        {!configured && (
          <p className="text-center text-xs mt-6 leading-relaxed" style={{ color: "var(--ink-soft)" }}>
            아직 로그인 기능이 서버에 연결되지 않았어요.
          </p>
        )}
      </div>
    </main>
  );
}

function PillButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="retro-btn w-full py-3.5 text-sm font-bold flex items-center justify-center gap-2.5"
      style={{ background: "var(--card)", color: "var(--ink)", border: "1px solid rgba(107,68,35,0.14)", opacity: disabled ? 0.5 : 1 }}>
      {children}
    </button>
  );
}

function OptionsView({ configured, onEmail, onGuest }: { configured: boolean; onEmail: () => void; onGuest: () => void }) {
  const [error, setError] = useState<string | null>(null);

  async function handleOAuth(fn: () => Promise<{ error: string | null }>) {
    setError(null);
    // 성공 시 OAuth 제공자 화면으로 리다이렉트되므로, 실패했을 때만 이 화면에 남아 에러를 보여준다.
    const { error } = await fn();
    if (error) setError(error);
  }
  return (
    <div className="space-y-2.5">
      <PillButton disabled={!configured} onClick={() => handleOAuth(signInWithGoogle)}>
        <GoogleGlyph /> Google 계정으로 시작
      </PillButton>
      <PillButton disabled={!configured} onClick={() => handleOAuth(signInWithApple)}>
        <AppleGlyph /> Apple 계정으로 시작
      </PillButton>
      <PillButton disabled={!configured} onClick={onEmail}>
        <MailGlyph /> 이메일로 시작
      </PillButton>
      <PillButton onClick={onGuest}>
        게스트로 시작
      </PillButton>
      {error && <p className="text-xs text-center leading-relaxed" style={{ color: "#b23a2e" }}>{error}</p>}
    </div>
  );
}

function EmailView({ configured, onAuthed }: { configured: boolean; onAuthed: () => void }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email.trim() || !password) { setError("이메일과 비밀번호를 입력해주세요."); return; }
    if (password.length < 6) { setError("비밀번호는 6자 이상이어야 해요."); return; }
    setLoading(true);
    setError(null);
    setInfo(null);
    const { error } = mode === "signup"
      ? await signUpWithEmail(email.trim(), password)
      : await signInWithEmail(email.trim(), password);
    setLoading(false);
    if (error) { setError(error); return; }
    if (mode === "signup") {
      setInfo("가입 확인 이메일을 보냈어요. 메일함을 확인한 뒤 다시 로그인해주세요.");
      setMode("signin");
    } else {
      onAuthed();
    }
  }

  return (
    <div>
      <div className="space-y-2.5 mb-4">
        <input
          type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="이메일" autoComplete="email" autoFocus
          className="w-full px-4 py-3 rounded text-sm focus:outline-none"
          style={{ background: "var(--card)", border: "2px solid var(--card-border)", color: "var(--ink)" }}
        />
        <input
          type="password" value={password} onChange={(e) => setPassword(e.target.value)}
          placeholder="비밀번호 (6자 이상)" autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className="w-full px-4 py-3 rounded text-sm focus:outline-none"
          style={{ background: "var(--card)", border: "2px solid var(--card-border)", color: "var(--ink)" }}
        />
      </div>

      {error && <p className="text-xs mb-3 leading-relaxed" style={{ color: "#b23a2e" }}>{error}</p>}
      {info && <p className="text-xs mb-3 leading-relaxed" style={{ color: "var(--clover)" }}>{info}</p>}

      <button
        onClick={handleSubmit}
        disabled={!configured || loading}
        className="retro-btn font-display w-full py-3.5 text-base"
        style={{ background: "var(--clover)", color: "#fff", opacity: configured ? 1 : 0.5 }}>
        {loading ? "처리 중..." : mode === "signup" ? "이메일로 회원가입" : "이메일로 로그인"}
      </button>

      <button
        onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(null); setInfo(null); }}
        className="w-full text-center text-xs py-3 mt-1 underline underline-offset-4" style={{ color: "var(--ink-soft)" }}>
        {mode === "signup" ? "이미 계정이 있으신가요? 로그인" : "계정이 없으신가요? 회원가입"}
      </button>
    </div>
  );
}

function AppleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.365 1.43c0 1.14-.42 2.07-1.26 2.86-.9.86-1.98 1.36-3.06 1.28-.06-1.12.42-2.26 1.2-3.02.84-.82 2.16-1.36 3.12-1.4v.28zM20.6 17.14c-.42.98-.66 1.42-1.24 2.28-.8 1.2-1.94 2.7-3.34 2.72-1.24.02-1.56-.8-3.24-.8-1.68 0-2.04.78-3.24.82-1.36.04-2.4-1.3-3.2-2.5-2.22-3.3-2.46-7.18-1.08-9.24.98-1.48 2.52-2.34 3.96-2.34 1.48 0 2.4.82 3.62.82 1.18 0 1.9-.82 3.62-.82 1.28 0 2.64.7 3.6 1.9-3.16 1.74-2.66 6.24.54 7.16z" />
    </svg>
  );
}

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

function MailGlyph() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="m3.5 6 8.5 7 8.5-7" />
    </svg>
  );
}

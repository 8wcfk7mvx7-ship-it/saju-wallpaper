"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseClient";

interface Props {
  onBack: () => void;
  /** 로그아웃(또는 게스트 모드 해제) 후 로그인 화면으로 돌아간다. */
  onSignedOut: () => void;
  isGuest: boolean;
}

const APP_VERSION = "1.0.0";

/** 앱 설정 화면: 계정 상태, 로그아웃, 앱 정보. */
export default function AppSettings({ onBack, onSignedOut, isGuest }: Props) {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (isGuest || !supabaseBrowser) return;
    supabaseBrowser.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, [isGuest]);

  async function handleSignOut() {
    const message = isGuest
      ? "게스트 모드를 끝낼까요? 이 기기에 저장된 원고는 그대로 남아 있어요."
      : "로그아웃할까요?";
    if (!confirm(message)) return;
    if (!isGuest && supabaseBrowser) await supabaseBrowser.auth.signOut();
    onSignedOut();
  }

  return (
    <div className="h-full flex flex-col" style={{ background: "#f7f1e3", color: "#2a2417" }}>
      <header
        className="shrink-0 flex items-center gap-2 px-4"
        style={{ height: 56, borderBottom: "1px solid rgba(0,0,0,0.07)" }}
      >
        <button onClick={onBack} className="text-[15px] font-bold px-1" style={{ color: "#4338ca" }}>
          ‹ 책장
        </button>
        <h1 className="text-[16px] font-black">설정</h1>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-5 py-5 space-y-6">
        <section className="space-y-2">
          <SectionLabel>계정</SectionLabel>
          <div className="rounded-2xl px-4 py-4" style={cardStyle}>
            {isGuest ? (
              <>
                <p className="text-[15px] font-bold mb-1">게스트로 사용 중</p>
                <p className="text-[12px] leading-relaxed" style={{ color: "rgba(42,36,23,0.5)" }}>
                  계정 없이 쓰는 중이라 원고가 이 기기에만 저장돼요.
                  기기를 바꾸거나 앱을 지우면 원고도 사라집니다.
                </p>
              </>
            ) : (
              <>
                <p className="text-[15px] font-bold mb-1">{email || "로그인됨"}</p>
                <p className="text-[12px]" style={{ color: "rgba(42,36,23,0.5)" }}>
                  계정으로 로그인되어 있어요.
                </p>
              </>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full rounded-2xl py-3.5 text-[14px] font-bold"
            style={{ ...cardStyle, color: "#b91c1c" }}
          >
            {isGuest ? "게스트 모드 끝내기" : "로그아웃"}
          </button>
        </section>

        <section className="space-y-2">
          <SectionLabel>원고 보관</SectionLabel>
          <div className="rounded-2xl px-4 py-4 space-y-1" style={cardStyle}>
            <p className="text-[13px] font-bold">이 기기에 저장됩니다</p>
            <p className="text-[12px] leading-relaxed" style={{ color: "rgba(42,36,23,0.5)" }}>
              쓰는 동안 자동으로 저장되고, 인터넷이 끊겨도 계속 쓸 수 있어요.
              완성한 책은 편집기에서 EPUB 파일로 내보내 보관하세요.
            </p>
          </div>
        </section>

        <section className="space-y-2">
          <SectionLabel>앱 정보</SectionLabel>
          <div className="rounded-2xl overflow-hidden" style={cardStyle}>
            <InfoRow label="버전" value={APP_VERSION} />
            <InfoRow label="만든 곳" value="Summer Palace" />
          </div>
          <div className="rounded-2xl overflow-hidden" style={cardStyle}>
            <LinkRow label="이용약관" href="/terms" />
            <LinkRow label="개인정보 처리방침" href="/privacy" />
          </div>
        </section>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#fffdf7",
  border: "1px solid rgba(0,0,0,0.09)",
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-black px-1" style={{ color: "rgba(42,36,23,0.45)" }}>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3.5"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
    >
      <span className="text-[14px] font-semibold">{label}</span>
      <span className="text-[13px]" style={{ color: "rgba(42,36,23,0.5)" }}>{value}</span>
    </div>
  );
}

function LinkRow({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-between px-4 py-3.5"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
    >
      <span className="text-[14px] font-semibold">{label}</span>
      <span style={{ color: "rgba(42,36,23,0.3)" }}>›</span>
    </a>
  );
}

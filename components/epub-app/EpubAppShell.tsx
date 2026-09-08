"use client";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";
import EpubWorkspace, { type WorkspaceLayout } from "@/components/epub/EpubWorkspace";
import AppLogin from "./AppLogin";
import AppLibrary from "./AppLibrary";
import AppSettings from "./AppSettings";

const GUEST_KEY = "epub-app-guest";
/** 이 폭보다 넓으면 아이패드(분할 화면), 좁으면 아이폰(탭 화면)으로 본다. */
const TABLET_MIN_WIDTH = 700;

type Gate = "checking" | "login" | "ready";
type Screen = "library" | "editor" | "settings";

/**
 * 앱(아이폰/아이패드) 전체 흐름.
 * 로그인 → 책장 → 편집기/설정 순서로 오간다.
 */
export default function EpubAppShell() {
  const searchParams = useSearchParams();
  const [gate, setGate] = useState<Gate>("checking");
  const [device, setDevice] = useState<WorkspaceLayout>("phone");
  const [screen, setScreen] = useState<Screen>("library");
  const [isGuest, setIsGuest] = useState(false);
  // 편집기를 어떤 책으로 열지: 책장에서 고른 책 id, 또는 새 책.
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [startNew, setStartNew] = useState(false);
  /** 편집기를 새로 마운트해 원고를 다시 읽게 하는 값. */
  const [editorKey, setEditorKey] = useState(0);

  // ?device=phone|tablet 으로 강제할 수 있다(미리보기/스크린샷용).
  const forcedDevice = searchParams.get("device");
  // ?screen=login|library|editor|settings 로 특정 화면을 바로 열 수 있다(미리보기용).
  const forcedScreen = searchParams.get("screen");

  useEffect(() => {
    function pickDevice() {
      if (forcedDevice === "phone" || forcedDevice === "tablet") {
        setDevice(forcedDevice);
        return;
      }
      setDevice(window.innerWidth >= TABLET_MIN_WIDTH ? "tablet" : "phone");
    }
    pickDevice();
    window.addEventListener("resize", pickDevice);
    return () => window.removeEventListener("resize", pickDevice);
  }, [forcedDevice]);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      if (forcedScreen === "login") {
        setGate("login");
        return;
      }
      if (forcedScreen === "editor" || forcedScreen === "settings" || forcedScreen === "library") {
        setScreen(forcedScreen);
      }

      // 게스트로 시작한 적이 있으면 로그인 없이 바로 들어간다.
      try {
        if (localStorage.getItem(GUEST_KEY) === "1") {
          if (!cancelled) {
            setIsGuest(true);
            setGate("ready");
          }
          return;
        }
      } catch {
        // 저장소를 못 쓰는 환경이면 로그인 화면부터 보여준다.
      }

      if (!supabaseBrowser) {
        if (!cancelled) setGate("login");
        return;
      }
      const { data } = await supabaseBrowser.auth.getSession();
      if (!cancelled) setGate(data.session ? "ready" : "login");
    }

    checkSession();
    return () => { cancelled = true; };
  }, [forcedScreen]);

  const handleLoginDone = useCallback((mode: "account" | "guest") => {
    if (mode === "guest") {
      try { localStorage.setItem(GUEST_KEY, "1"); } catch { /* 저장 실패는 무시 */ }
      setIsGuest(true);
    }
    setScreen("library");
    setGate("ready");
  }, []);

  const handleSignedOut = useCallback(() => {
    try { localStorage.removeItem(GUEST_KEY); } catch { /* 무시 */ }
    setIsGuest(false);
    setScreen("library");
    setGate("login");
  }, []);

  /** 책장에서 편집기로 들어갈 때마다 편집기를 새로 마운트해 해당 원고를 읽게 한다. */
  function openEditor(projectId: string | null, fresh: boolean) {
    setOpenProjectId(projectId);
    setStartNew(fresh);
    setEditorKey(k => k + 1);
    setScreen("editor");
  }

  if (gate === "checking") {
    return (
      <div
        className="flex items-center justify-center"
        style={{ height: "100dvh", background: "#f0efec", color: "#8a8577" }}
      >
        <span className="text-sm font-bold">불러오는 중…</span>
      </div>
    );
  }

  if (gate === "login") {
    return (
      <div style={{ height: "100dvh" }}>
        <AppLogin onDone={handleLoginDone} wide={device === "tablet"} />
      </div>
    );
  }

  if (screen === "editor") {
    return (
      <EpubWorkspace
        key={editorKey}
        layout={device}
        openProjectId={openProjectId}
        startNew={startNew}
        onExit={() => setScreen("library")}
      />
    );
  }

  if (screen === "settings") {
    return (
      <div style={{ height: "100dvh", paddingTop: "env(safe-area-inset-top)" }}>
        <AppSettings isGuest={isGuest} onBack={() => setScreen("library")} onSignedOut={handleSignedOut} />
      </div>
    );
  }

  return (
    <div style={{ height: "100dvh", paddingTop: "env(safe-area-inset-top)" }}>
      <AppLibrary
        wide={device === "tablet"}
        onOpenProject={id => openEditor(id, false)}
        onContinueDraft={() => openEditor(null, false)}
        onNewBook={() => openEditor(null, true)}
        onOpenSettings={() => setScreen("settings")}
      />
    </div>
  );
}

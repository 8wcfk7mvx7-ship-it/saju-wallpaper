"use client";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";
import EpubWorkspace, { type WorkspaceLayout } from "@/components/epub/EpubWorkspace";
import AppLogin from "./AppLogin";

const GUEST_KEY = "epub-app-guest";
/** 이 폭보다 넓으면 아이패드(분할 화면), 좁으면 아이폰(탭 화면)으로 본다. */
const TABLET_MIN_WIDTH = 700;

type Gate = "checking" | "login" | "ready";

/**
 * 앱(아이폰/아이패드) 진입 화면.
 * 로그인 여부를 먼저 확인하고, 기기 크기에 맞는 편집기 레이아웃을 고른다.
 */
export default function EpubAppShell() {
  const searchParams = useSearchParams();
  const [gate, setGate] = useState<Gate>("checking");
  const [device, setDevice] = useState<WorkspaceLayout>("phone");

  // ?device=phone|tablet 으로 강제할 수 있다(미리보기/스크린샷용).
  const forcedDevice = searchParams.get("device");
  // ?screen=login 이면 로그인 화면을 그대로 보여준다(미리보기용).
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
      // 게스트로 시작한 적이 있으면 로그인 없이 바로 들어간다.
      try {
        if (localStorage.getItem(GUEST_KEY) === "1") {
          if (!cancelled) setGate("ready");
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

  function handleLoginDone(mode: "account" | "guest") {
    if (mode === "guest") {
      try { localStorage.setItem(GUEST_KEY, "1"); } catch { /* 저장 실패는 무시 */ }
    }
    setGate("ready");
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

  return <EpubWorkspace layout={device} />;
}

"use client";
import { useEffect } from "react";

const ACTIVITY_KEY = "sp_last_active";
const MAX_IDLE_MS = 4 * 60 * 60 * 1000; // 4시간

function stamp() {
  try { localStorage.setItem(ACTIVITY_KEY, String(Date.now())); } catch {}
}

function logout() {
  document.cookie = "sp_user=; max-age=0; path=/";
  try { localStorage.removeItem(ACTIVITY_KEY); } catch {}
}

export default function AutoLogout() {
  useEffect(() => {
    // 쿠키에 로그인 정보가 없으면 아무것도 하지 않음
    function isLoggedIn() {
      try {
        const match = document.cookie.split(";").find(c => c.trim().startsWith("sp_user="));
        return !!match;
      } catch { return false; }
    }

    if (!isLoggedIn()) return;

    // 마지막 활동 시간 확인
    const last = parseInt(localStorage.getItem(ACTIVITY_KEY) ?? "0", 10);
    if (last && Date.now() - last > MAX_IDLE_MS) {
      logout();
      return;
    }

    // 현재 시각 기록
    stamp();

    // 사용자 활동 감지 — 이벤트마다 타임스탬프 갱신
    const events = ["click", "keydown", "scroll", "touchstart", "mousemove"];
    const handle = () => stamp();
    events.forEach(e => document.addEventListener(e, handle, { passive: true }));

    // 페이지 숨김 시 타임스탬프 기록 (이탈 감지)
    const handleVisibility = () => {
      if (document.hidden) stamp();
      else {
        if (!isLoggedIn()) return;
        const t = parseInt(localStorage.getItem(ACTIVITY_KEY) ?? "0", 10);
        if (t && Date.now() - t > MAX_IDLE_MS) logout();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    // 1시간마다 체크
    const interval = setInterval(() => {
      if (!isLoggedIn()) return;
      const t = parseInt(localStorage.getItem(ACTIVITY_KEY) ?? "0", 10);
      if (t && Date.now() - t > MAX_IDLE_MS) logout();
    }, 60 * 60 * 1000);

    return () => {
      events.forEach(e => document.removeEventListener(e, handle));
      document.removeEventListener("visibilitychange", handleVisibility);
      clearInterval(interval);
    };
  }, []);

  return null;
}

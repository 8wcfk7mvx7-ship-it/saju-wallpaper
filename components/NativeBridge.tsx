"use client";
import { useEffect } from "react";

// Capacitor 네이티브 앱(iOS/Android)에서 실행 중일 때만 동작.
// 웹 브라우저에서는 Capacitor 전역이 없으므로 아무 것도 하지 않음.
export default function NativeBridge() {
  useEffect(() => {
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor;
    if (!cap?.isNativePlatform?.()) return;

    document.documentElement.classList.add("native-app");

    import("@capacitor/status-bar")
      .then(({ StatusBar, Style }) => {
        StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
        StatusBar.setBackgroundColor({ color: "#06060e" }).catch(() => {});
      })
      .catch(() => {});

    import("@capacitor/splash-screen")
      .then(({ SplashScreen }) => SplashScreen.hide().catch(() => {}))
      .catch(() => {});
  }, []);

  return null;
}

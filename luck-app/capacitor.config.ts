import type { CapacitorConfig } from "@capacitor/cli";

// 웹앱을 그대로 네이티브 웹뷰로 감싸는 설정.
// server.url을 실제 배포 도메인으로 바꾸면, 웹을 배포할 때마다 앱스토어 재심사 없이
// iOS/Android 앱에도 즉시 동일한 화면이 반영됩니다. (배포 전에는 이 값을 실제 도메인으로 교체하세요)
const config: CapacitorConfig = {
  appId: "kr.ai.luckyapp.app",
  appName: "행운의 어플",
  webDir: "public",
  server: {
    url: "https://luckyapp.example.com", // TODO: 실제 배포 도메인으로 교체
    cleartext: false,
    androidScheme: "https",
  },
  ios: {
    contentInset: "always",
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 700,
      backgroundColor: "#fdf6ec",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#fdf6ec",
      overlaysWebView: false,
    },
  },
};

export default config;

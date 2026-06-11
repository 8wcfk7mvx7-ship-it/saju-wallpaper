import type { CapacitorConfig } from "@capacitor/cli";

// 웹앱(Vercel)을 그대로 네이티브 WebView로 감싸는 설정.
// server.url을 라이브 도메인으로 지정하면, 웹을 배포할 때마다
// 앱스토어 재심사 없이 iOS/Android 앱에도 즉시 동일한 화면이 반영됩니다.
const config: CapacitorConfig = {
  appId: "kr.ai.summerpalace.app",
  appName: "Summer Palace",
  webDir: "public",
  server: {
    url: "https://summerpalace.ai.kr",
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
      launchShowDuration: 800,
      backgroundColor: "#06060e",
      androidSplashResourceName: "splash",
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#06060e",
      overlaysWebView: false,
    },
  },
};

export default config;

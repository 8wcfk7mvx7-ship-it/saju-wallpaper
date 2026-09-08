import type { CapacitorConfig } from "@capacitor/cli";

// 이펍공장 전용 앱 설정.
// 메인 사이트 앱(capacitor.config.ts)과 별개의 앱으로 앱스토어에 올리기 위한 것이며,
// 앱을 켜면 곧바로 이펍공장 화면(/epub-app)이 열린다.
//
// 사용법(맥):
//   npx cap add ios --config capacitor.epub.config.ts
//   npx cap sync ios --config capacitor.epub.config.ts
const config: CapacitorConfig = {
  appId: "kr.ai.summerpalace.epub",
  appName: "이펍공장",
  webDir: "public",
  server: {
    url: "https://summerpalace.ai.kr/epub-app",
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
      // 이펍공장은 아이보리 종이 느낌이라 스플래시도 같은 색으로 맞춘다.
      backgroundColor: "#f7f1e3",
      showSpinner: false,
    },
    StatusBar: {
      style: "LIGHT",
      backgroundColor: "#f7f1e3",
      overlaysWebView: false,
    },
  },
};

export default config;

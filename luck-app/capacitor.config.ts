import type { CapacitorConfig } from "@capacitor/cli";

// 서버 기능이 전혀 없는 앱(사주 계산도 전부 브라우저에서 처리, localStorage만 사용)이라
// 웹 호스팅 없이 정적 빌드 결과물(out/)을 앱 안에 통째로 번들링한다.
// (npm run build → next.config.ts의 output: "export"가 out/ 폴더를 생성 → npx cap sync)
// 단점: 콘텐츠를 고치면 웹 배포처럼 즉시 반영되지 않고, 앱스토어에 새 버전을 다시 올려야 함.
const config: CapacitorConfig = {
  appId: "kr.ai.luckyapp.app",
  appName: "행운의 앱",
  webDir: "out",
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

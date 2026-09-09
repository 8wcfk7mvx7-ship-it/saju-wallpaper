import type { CapacitorConfig } from "@capacitor/cli";

// ── 훈녀생정 네이티브 앱 설정 ────────────────────────────────────────────
// server.url 을 두지 않는다. `next build` 가 만든 out/ 폴더를 통째로 앱에
// 담기 때문에 인터넷이 끊겨도 228개 항목이 전부 열린다.
// (웹사이트를 불러오기만 하는 앱은 앱스토어 가이드라인 4.2 로 반려되기 쉽다)
const config: CapacitorConfig = {
  appId: "kr.ai.hunnyeo.app",
  appName: "훈녀생정",
  webDir: "out",

  ios: {
    contentInset: "never",
    backgroundColor: "#ffd6e8",
    // 링크를 눌렀을 때 앱 안이 아니라 사파리로 열리게 한다(외부 링크가 생길 경우 대비)
    limitsNavigationsToAppBoundDomains: false,
  },

  android: {
    backgroundColor: "#ffd6e8",
    allowMixedContent: false,
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 900,
      backgroundColor: "#ffd6e8",
      showSpinner: false,
      androidSplashResourceName: "splash",
      splashFullScreen: true,
      splashImmersive: false,
    },
    StatusBar: {
      style: "LIGHT", // 밝은 배경 위의 어두운 글씨
      backgroundColor: "#ffd6e8",
      overlaysWebView: false,
    },
  },
};

export default config;

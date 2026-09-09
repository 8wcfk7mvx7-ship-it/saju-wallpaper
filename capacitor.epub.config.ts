import type { CapacitorConfig } from "@capacitor/cli";

// 이펍공장 앱 설정. 메인 사이트(Summer Palace)와는 별개의 앱이다.
//
// 화면을 앱 안에 넣어서 배포한다(server.url을 쓰지 않는다).
// 그래서 이 앱은 summerpalace.ai.kr이 살아 있든 말든, 인터넷이 되든 말든 혼자 동작한다.
// 넣는 내용은 epub-standalone이 만든 단일 파일이며, 맥·윈도우 데스크톱 앱과 같은 것이다.
//
// 사용법(맥):
//   npm run cap:epub -- sync ios      # epub-standalone 빌드 후 실행할 것
//   npm run cap:epub -- open ios
const config: CapacitorConfig = {
  appId: "kr.ai.summerpalace.epub",
  appName: "이펍공장",
  // 앱에 담을 화면. epub-standalone에서 `npm run build`로 만든다.
  webDir: "epub-standalone/dist",
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

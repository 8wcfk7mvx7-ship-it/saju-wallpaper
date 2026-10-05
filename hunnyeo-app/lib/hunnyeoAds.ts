// ── 광고 (AdMob) ──────────────────────────────────────────────────────────
// 네이티브 앱(iOS·안드로이드)에서만 동작한다. 웹 미리보기(브라우저)에서는
// import 자체를 하지 않으므로 아무 일도 일어나지 않는다.
//
// iOS 는 실제 AdMob 콘솔에서 발급받은 값으로 채워져 있다.
// 안드로이드는 아직 AdMob에 앱을 안 만들어서 구글 공식 "테스트" ID 그대로 둔다
// (나중에 안드로이드용 앱을 만들면 여기만 바꾸면 된다).
// https://developers.google.com/admob/ios/test-ads
//
// ⚠️ isTesting 은 아직 true 로 켜 둔다 — 이게 true 인 동안은 실제 ID를 넣어도
// 항상 "Test Ad"만 뜨고 진짜 광고는 안 나간다. 앱스토어 제출 직전에
// showBannerAd() 안의 isTesting 을 false 로 바꿔야 그때부터 진짜 광고가 뜬다.
const ADMOB_APP_ID = {
  ios: "ca-app-pub-3174617933560150~7714124390",
  android: "ca-app-pub-3940256099942544~3347511713", // 테스트 ID (안드로이드 앱 만들면 교체)
} as const;

const BANNER_AD_UNIT_ID = {
  ios: "ca-app-pub-3174617933560150/9765572660",
  android: "ca-app-pub-3940256099942544/6300978111", // 테스트 ID (안드로이드 앱 만들면 교체)
} as const;

type NativePlatform = "ios" | "android";

async function nativePlatform(): Promise<NativePlatform | null> {
  const cap = await import("@capacitor/core");
  if (!cap.Capacitor.isNativePlatform()) return null;
  const platform = cap.Capacitor.getPlatform();
  return platform === "ios" || platform === "android" ? platform : null;
}

let readyPromise: Promise<void> | null = null;

// 초기화 + 동의(UMP) + 추적 권한(ATT) 요청까지 한 번만 처리한다.
// 순서가 중요하다: initialize → consent → tracking → (호출한 쪽에서) showBanner
async function ensureReady(): Promise<void> {
  if (!readyPromise) {
    readyPromise = (async () => {
      const { AdMob } = await import("@capacitor-community/admob");
      await AdMob.initialize();

      // 유럽 사용자 등에게 필요한 개인정보 동의창 (필요 없는 지역에선 자동으로 스킵됨)
      const consentInfo = await AdMob.requestConsentInfo();
      if (consentInfo.isConsentFormAvailable && consentInfo.status === "REQUIRED") {
        await AdMob.showConsentForm().catch(() => {});
      }

      // iOS 14+ 추적 권한 — 거절해도 광고 자체는 (비맞춤형으로) 계속 나온다
      const tracking = await AdMob.trackingAuthorizationStatus();
      if (tracking.status === "notDetermined") {
        await AdMob.requestTrackingAuthorization().catch(() => {});
      }
    })();
  }
  return readyPromise;
}

export async function showBannerAd(): Promise<void> {
  const platform = await nativePlatform();
  if (!platform) return;
  await ensureReady();
  const { AdMob, BannerAdSize, BannerAdPosition } = await import("@capacitor-community/admob");
  await AdMob.showBanner({
    adId: BANNER_AD_UNIT_ID[platform],
    adSize: BannerAdSize.ADAPTIVE_BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    isTesting: true, // ⚠️ 실제 출시 직전에 false 로 바꿀 것 (안 바꾸면 테스트 광고만 나와서 수익 0원)
  }).catch(() => {
    // 광고 네트워크가 응답 없을 때도 앱이 멈추면 안 된다 — 조용히 넘어간다.
  });
}

export async function hideBannerAd(): Promise<void> {
  const platform = await nativePlatform();
  if (!platform) return;
  const { AdMob } = await import("@capacitor-community/admob");
  await AdMob.hideBanner().catch(() => {});
}

// Apple/AdMob 콘솔 등록 시 참고용으로 앱 ID도 내보내 둔다.
export { ADMOB_APP_ID, BANNER_AD_UNIT_ID };

// ── 광고 (AdMob) ──────────────────────────────────────────────────────────
// 네이티브 앱(iOS·안드로이드)에서만 동작한다. 웹 미리보기(브라우저)에서는
// import 자체를 하지 않으므로 아무 일도 일어나지 않는다.
//
// ⚠️ 아래 ID 네 개는 전부 구글이 공식으로 제공하는 "테스트" ID다.
// https://developers.google.com/admob/ios/test-ads
// AdMob 콘솔에서 본인 앱과 배너 광고 단위를 만든 뒤, 이 값들과
// isTesting 플래그를 실제 값으로 바꿔야 광고 수익이 발생한다.
// 바꾸기 전까지는 "Test Ad" 라고 적힌 가짜 광고만 나온다 (정상 동작).
const ADMOB_APP_ID = {
  ios: "ca-app-pub-3940256099942544~1458002511",
  android: "ca-app-pub-3940256099942544~3347511713",
} as const;

const BANNER_AD_UNIT_ID = {
  ios: "ca-app-pub-3940256099942544/2934735716",
  android: "ca-app-pub-3940256099942544/6300978111",
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

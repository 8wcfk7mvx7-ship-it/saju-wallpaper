"use client";
// lib/ads.ts — Google AdMob 배너 광고.
// 아직 실제 AdMob 계정이 없어서 구글이 공식 제공하는 "테스트" 광고 ID를 쓴다 — 테스트 ID는
// 항상 더미 광고만 보여주고 수익은 발생하지 않는다(심사 통과 전까지 안전하게 켜둘 수 있음).
// 실제 수익을 받으려면 https://admob.google.com 에서 계정을 만들고 이 앱을 등록한 뒤,
// 1) 아래 PRODUCTION_BANNER_ID를 발급받은 진짜 광고 단위 ID로 바꾸고
// 2) USE_TEST_ADS를 false로 내리고
// 3) android/app/src/main/AndroidManifest.xml과 ios/App/App/Info.plist의
//    테스트용 App ID(com.google.android.gms.ads.APPLICATION_ID / GADApplicationIdentifier)를
//    AdMob이 발급한 진짜 App ID로 바꿔야 한다.
import { Capacitor } from "@capacitor/core";
import { AdMob, BannerAdPosition, BannerAdSize } from "@capacitor-community/admob";
import { getAdsRemovedCached } from "@/lib/purchases";

// 구글 공식 테스트 광고 단위 ID (https://developers.google.com/admob/android/test-ads)
const TEST_BANNER_ID = {
  ios: "ca-app-pub-3940256099942544/2934735716",
  android: "ca-app-pub-3940256099942544/6300978111",
};

// TODO: AdMob 계정 생성 후 여기에 실제 배너 광고 단위 ID를 채워넣고 USE_TEST_ADS를 false로.
const PRODUCTION_BANNER_ID = {
  ios: "",
  android: "",
};

const USE_TEST_ADS = true;

function bannerAdId(): string {
  const ids = USE_TEST_ADS ? TEST_BANNER_ID : PRODUCTION_BANNER_ID;
  return Capacitor.getPlatform() === "ios" ? ids.ios : ids.android;
}

let initialized = false;

// 하단 탭바(BottomTabs)를 가리지 않도록 그 위에 배너를 띄운다.
// "광고 제거" 구매자에게는 아예 띄우지 않는다 (lib/purchases.ts의 remove_ads 엔타이틀먼트).
export async function initBannerAd(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return; // 웹 프리뷰에는 광고를 띄우지 않음
  if (getAdsRemovedCached()) return;
  const adId = bannerAdId();
  if (!adId) return; // 실광고 전환 후 ID를 아직 안 채운 경우 — 조용히 건너뜀
  try {
    if (!initialized) {
      await AdMob.initialize({ initializeForTesting: USE_TEST_ADS });
      initialized = true;
    }
    await AdMob.showBanner({
      adId,
      isTesting: USE_TEST_ADS,
      adSize: BannerAdSize.ADAPTIVE_BANNER,
      position: BannerAdPosition.BOTTOM_CENTER,
      margin: 70,
    });
  } catch {
    // Play 서비스 미탑재, 네트워크 없음 등 — 광고 없이도 앱은 정상 동작해야 하므로 조용히 무시
  }
}

// 구매 완료 직후, 앱을 재시작하지 않고도 바로 배너를 치워준다.
export async function hideBannerAd(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try { await AdMob.removeBanner(); } catch { /* 띄운 적 없으면 조용히 무시 */ }
}

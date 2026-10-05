"use client";
// lib/purchases.ts — "광고 제거" 인앱결제 (RevenueCat 사용)
//
// RevenueCat을 고른 이유: 애플/구글 영수증 검증을 직접 구현하지 않아도 되고(가장 실수하기
// 쉬운 부분), 두 플랫폼 API를 하나로 통일해주고, 무료 티어로 충분하고, 대시보드가 비교적
// 친절해서 "결제를 전혀 모르는" 사람이 직접 상품을 등록하기에도 상대적으로 수월하다.
//
// 이 코드가 실제로 동작하려면 사람이 해야 하는 일이 있다 (docs/IAP_SETUP.md 참고):
//   1. revenuecat.com 가입 → 프로젝트 생성 → iOS/Android 앱 등록 → API 키 발급받아 아래
//      REVENUECAT_API_KEY에 채워넣기
//   2. App Store Connect / Google Play Console에 "remove_ads" 비소모성(Non-Consumable)
//      상품을 가격 990원으로 각각 등록
//   3. RevenueCat 대시보드에서 Entitlement "remove_ads"를 만들고, 위 상품을 연결한 뒤
//      Offering(default)에 Lifetime 타입 패키지로 추가
// 위 설정이 안 되어 있어도 앱은 깨지지 않는다 — 구매 관련 함수들이 전부 조용히 "설정 안 됨"
// 상태로 동작하고, 광고는 평소처럼 계속 보여진다.
import { Capacitor } from "@capacitor/core";
import { Purchases } from "@revenuecat/purchases-capacitor";

// TODO: RevenueCat 대시보드 > Project settings > API keys에서 발급받은 값으로 교체
const REVENUECAT_API_KEY = {
  ios: "",
  android: "",
};

// RevenueCat 대시보드에서 반드시 이 식별자로 만들어야 한다 (코드와 이름이 맞아야 연결됨)
const ENTITLEMENT_ID = "remove_ads";
const CACHE_KEY = "luck_ads_removed";

let configured = false;

function apiKey(): string {
  return Capacitor.getPlatform() === "ios" ? REVENUECAT_API_KEY.ios : REVENUECAT_API_KEY.android;
}

// 네트워크 없이도 즉시 UI에 반영할 수 있도록 마지막으로 확인된 구매 상태를 기기에 캐시해둔다.
export function getAdsRemovedCached(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CACHE_KEY) === "1";
}

function cacheAdsRemoved(removed: boolean): void {
  if (typeof window === "undefined") return;
  if (removed) localStorage.setItem(CACHE_KEY, "1");
  else localStorage.removeItem(CACHE_KEY);
}

async function ensureConfigured(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false; // 웹 프리뷰에서는 결제 기능 자체를 띄우지 않음
  const key = apiKey();
  if (!key) return false; // API 키를 아직 안 채워넣은 상태 — 조용히 비활성화
  if (!configured) {
    try {
      await Purchases.configure({ apiKey: key });
      configured = true;
    } catch {
      return false;
    }
  }
  return true;
}

// 앱 시작 시 한 번 호출 — 서버 기준으로 실제 구매 상태를 다시 확인해 캐시를 최신화한다.
export async function refreshAdsRemoved(): Promise<boolean> {
  const ok = await ensureConfigured();
  if (!ok) return getAdsRemovedCached();
  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    const removed = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    cacheAdsRemoved(removed);
    return removed;
  } catch {
    return getAdsRemovedCached();
  }
}

// 설정 화면에 보여줄 실제 현지화 가격 문자열(예: "₩990"). 아직 설정이 안 됐거나 불러오기
// 실패하면 null — 호출하는 쪽에서 고정 문구("₩990")로 대체해서 보여준다.
export async function getRemoveAdsPriceString(): Promise<string | null> {
  const ok = await ensureConfigured();
  if (!ok) return null;
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.lifetime ?? offerings.current?.availablePackages[0];
    return pkg?.product.priceString ?? null;
  } catch {
    return null;
  }
}

export async function purchaseRemoveAds(): Promise<{ ok: true } | { ok: false; cancelled: boolean; error?: string }> {
  const ok = await ensureConfigured();
  if (!ok) return { ok: false, cancelled: false, error: "구매 기능이 아직 준비되지 않았어요." };
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.lifetime ?? offerings.current?.availablePackages[0];
    if (!pkg) return { ok: false, cancelled: false, error: "상품 정보를 불러오지 못했어요." };
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    const removed = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    cacheAdsRemoved(removed);
    return removed
      ? { ok: true }
      : { ok: false, cancelled: false, error: "구매는 완료됐지만 아직 반영되지 않았어요. 잠시 후 다시 확인해주세요." };
  } catch (e) {
    const err = e as { userCancelled?: boolean; message?: string };
    return { ok: false, cancelled: !!err.userCancelled, error: err.userCancelled ? undefined : (err.message ?? "구매 중 문제가 발생했어요.") };
  }
}

// 비소모성 상품은 애플 심사 요건상 "구매 복원" 버튼이 반드시 있어야 한다(기기를 바꾸거나
// 앱을 다시 설치한 사람이 이미 산 걸 다시 돈 내지 않고 되찾는 기능).
export async function restorePurchases(): Promise<{ ok: true; removed: boolean } | { ok: false; error: string }> {
  const ok = await ensureConfigured();
  if (!ok) return { ok: false, error: "구매 기능이 아직 준비되지 않았어요." };
  try {
    const { customerInfo } = await Purchases.restorePurchases();
    const removed = !!customerInfo.entitlements.active[ENTITLEMENT_ID];
    cacheAdsRemoved(removed);
    return { ok: true, removed };
  } catch (e) {
    const err = e as { message?: string };
    return { ok: false, error: err.message ?? "복원 중 문제가 발생했어요." };
  }
}

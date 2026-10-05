// ── 광고 제거 인앱결제 ──────────────────────────────────────────────────
// 네이티브 앱에서만 동작한다 (iOS StoreKit 2 / 안드로이드 Google Play Billing).
// 서버 영수증 검증 없이, 기기가 알려주는 소유 여부를 그대로 믿는
// 비소모성(non-consumable) 상품 하나뿐이라 이 방식으로 충분하다.
//
// ⚠️ 이 상품 ID("remove_ads")는 App Store Connect / Play Console에서
// 실제로 "인앱 구입 상품"을 만들 때 상품 ID도 정확히 remove_ads 로 맞춰야
// 작동한다. 가격은 990원을 목표로 하되, 애플/구글 가격 등급표에 정확히
// 990원이 없으면 가장 가까운 등급(보통 1,200원 안팎)을 고르면 된다.

const PRODUCT_ID = "remove_ads";
const OWNED_KEY = "hunnyeo_ads_removed_v1";

type NativePlatform = "ios" | "android";

async function nativePlatform(): Promise<NativePlatform | null> {
  const cap = await import("@capacitor/core");
  if (!cap.Capacitor.isNativePlatform()) return null;
  const platform = cap.Capacitor.getPlatform();
  return platform === "ios" || platform === "android" ? platform : null;
}

function readOwnedLocal(): boolean {
  try {
    return localStorage.getItem(OWNED_KEY) === "1";
  } catch {
    return false;
  }
}

function writeOwnedLocal(owned: boolean): void {
  try {
    localStorage.setItem(OWNED_KEY, owned ? "1" : "0");
  } catch {
    // 저장이 안 돼도 이번 세션에서 광고를 숨기는 동작 자체는 그대로 진행된다.
  }
}

let readyPromise: Promise<void> | null = null;

async function ensureStore(): Promise<void> {
  if (!readyPromise) {
    readyPromise = (async () => {
      const platform = await nativePlatform();
      if (!platform) return;
      const { store, ProductType, Platform } = await import("capacitor-plugin-cdv-purchase");
      store.register([
        {
          id: PRODUCT_ID,
          type: ProductType.NON_CONSUMABLE,
          platform: platform === "ios" ? Platform.APPLE_APPSTORE : Platform.GOOGLE_PLAY,
        },
      ]);
      // 서버 검증 없이, 기기가 승인한 거래를 그대로 완료 처리한다.
      store.when().approved(transaction => transaction.finish());
      store.when().receiptUpdated(() => {
        if (store.owned(PRODUCT_ID)) writeOwnedLocal(true);
      });
      await store.initialize();
    })();
  }
  return readyPromise;
}

export async function purchasesAvailable(): Promise<boolean> {
  return (await nativePlatform()) !== null;
}

/** 광고가 제거된 상태인지. 기기에 저장해 둔 값을 우선 믿고, 네이티브 쪽도 한 번 더 확인한다. */
export async function isAdsRemoved(): Promise<boolean> {
  if (readOwnedLocal()) return true;
  const platform = await nativePlatform();
  if (!platform) return false;
  await ensureStore();
  const { store } = await import("capacitor-plugin-cdv-purchase");
  const owned = store.owned(PRODUCT_ID);
  if (owned) writeOwnedLocal(true);
  return owned;
}

export async function purchaseRemoveAds(): Promise<"owned" | "failed" | "unavailable"> {
  const platform = await nativePlatform();
  if (!platform) return "unavailable";
  await ensureStore();
  const { store } = await import("capacitor-plugin-cdv-purchase");
  const offer = store.get(PRODUCT_ID)?.getOffer();
  if (!offer) return "failed";
  const err = await offer.order();
  if (err) return "failed";
  writeOwnedLocal(true);
  return "owned";
}

/** 애플 심사 가이드라인상 비소모성 상품은 "구매 복원" 수단이 꼭 있어야 한다. */
export async function restorePurchases(): Promise<boolean> {
  const platform = await nativePlatform();
  if (!platform) return false;
  await ensureStore();
  const { store } = await import("capacitor-plugin-cdv-purchase");
  await store.restorePurchases();
  const owned = store.owned(PRODUCT_ID);
  if (owned) writeOwnedLocal(true);
  return owned;
}

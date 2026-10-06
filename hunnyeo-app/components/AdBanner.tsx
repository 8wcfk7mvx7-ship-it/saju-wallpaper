"use client";

import { useEffect } from "react";
import { showBannerAd, hideBannerAd } from "@/lib/hunnyeoAds";
import { isAdsRemoved } from "@/lib/hunnyeoPurchase";

// 화면 맨 아래 광고 배너. 네이티브 레이어가 그려서 실제 DOM에는 아무것도 안 남는다.
// 웹 미리보기(브라우저)에서는 showBannerAd 가 그냥 조용히 아무것도 안 한다.
// "광고 제거"를 구매한 기기에서는 애초에 배너를 띄우지 않는다.
export default function AdBanner() {
  useEffect(() => {
    let cancelled = false;
    isAdsRemoved().then(removed => {
      if (!cancelled && !removed) showBannerAd();
    });
    return () => {
      cancelled = true;
      hideBannerAd();
    };
  }, []);

  return null;
}

"use client";
import { useEffect, useRef, useState } from "react";

// ─── 카카오 애드핏 (AdFit) ────────────────────────────────────────────────────
// 광고단위 ID는 카카오 애드핏 콘솔에서 발급받아 아래 AD_UNIT 값을 교체하세요.
// 배너 사이즈에 맞는 광고단위를 추가로 만들었다면 unit/width/height를 바꿔서 재사용하면 됩니다.
declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdFitBanner({
  unit = "DAN-여기에입력",
  width = 320,
  height = 100,
}: {
  unit?: string;
  width?: number;
  height?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!ref.current) return;
    if (ref.current.querySelector("ins")) return;

    const ins = document.createElement("ins");
    ins.className = "kakao_ad_area";
    ins.style.display = "none";
    ins.setAttribute("data-ad-unit", unit);
    ins.setAttribute("data-ad-width", String(width));
    ins.setAttribute("data-ad-height", String(height));
    ref.current.appendChild(ins);

    const scriptId = "kakao-adfit-sdk";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src = "//t1.daumcdn.net/kas/static/ba.min.js";
      document.body.appendChild(script);
    } else {
      // SDK가 이미 로드된 경우 새 영역도 렌더링되도록 트리거
      // @ts-expect-error adfit global
      if (window.kakaoAdFit?.render) window.kakaoAdFit.render();
    }
  }, [unit, width, height]);

  if (!mounted) return <div style={{ width, height }} className="mx-auto" />;
  return <div ref={ref} className="flex justify-center" style={{ minHeight: height }} />;
}

// ─── 구글 애드센스 (AdSense) ──────────────────────────────────────────────────
// data-ad-client / data-ad-slot 값은 애드센스 콘솔에서 발급받은 실제 값으로 교체하세요.
export function AdSenseBanner({
  slot = "여기에입력",
  client = "ca-pub-6039288229459228",
}: {
  slot?: string;
  client?: string;
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const t = setTimeout(() => {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {}
    }, 100);
    return () => clearTimeout(t);
  }, []);

  if (!mounted) return <div className="h-14 w-full" />;
  return (
    <div className="w-full max-w-xs mx-auto my-3">
      <ins
        className="adsbygoogle"
        style={{ display: "block", textAlign: "center" }}
        data-ad-layout="in-article"
        data-ad-format="fluid"
        data-ad-client={client}
        data-ad-slot={slot}
      />
    </div>
  );
}

// ─── 통합 광고 배너 ───────────────────────────────────────────────────────────
// 애드핏(고단가 배너/게임광고)을 우선 노출하고, 그 아래 애드센스를 함께 노출합니다.
export default function AdBanner({ className = "" }: { className?: string }) {
  return (
    <div className={`w-full flex flex-col items-center gap-2 ${className}`}>
      <AdFitBanner />
      <AdSenseBanner />
    </div>
  );
}

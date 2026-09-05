import type { Metadata, Viewport } from "next";
import "./globals.css";

// 폰트: Galmuri(갈무리) — 닌텐도 DS 폰트를 기반으로 한 한글 지원 비트맵 폰트.
// 로컬 파일(public/fonts)로 자체 호스팅해서 외부 CDN 의존 없이 어디서나 동일하게 렌더링된다.
// (globals.css의 @font-face에서 로드)

export const metadata: Metadata = {
  title: "행운의 어플",
  description: "24절기 개운법과 나만의 용신 기운으로 매일 하나씩 알려주는 오늘의 행운, 그리고 나만의 행운 다이어리.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/icon-512.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#fdf3e0",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}

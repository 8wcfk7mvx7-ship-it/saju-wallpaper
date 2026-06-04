import type { Metadata } from "next";
import { Nanum_Myeongjo } from "next/font/google";
import "./globals.css";

const nanumMyeongjo = Nanum_Myeongjo({
  weight: ["400", "700", "800"],
  subsets: ["latin"],
  variable: "--font-myeongjo",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "여름궁전 사주 명리 분석",
  description: "사주팔자 명리학 기반 AI 분석 서비스. 타고난 오행 에너지를 이해하고 삶의 방향을 찾아드립니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${nanumMyeongjo.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

/*
 * ── Google AdSense 연동 방법 ──────────────────────────────────────────
 * AdSense 승인 후 아래 방법으로 스크립트를 추가하세요.
 *
 * 1. app/components/AdSense.tsx 클라이언트 컴포넌트 생성:
 *    "use client";
 *    import Script from "next/script";
 *    export default function AdSense() {
 *      return (
 *        <Script
 *          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-여기에입력"
 *          strategy="afterInteractive"
 *          crossOrigin="anonymous"
 *        />
 *      );
 *    }
 *
 * 2. 이 파일 body 안에 <AdSense /> 삽입
 * ─────────────────────────────────────────────────────────────────────
 */

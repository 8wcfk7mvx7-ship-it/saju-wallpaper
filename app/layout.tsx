import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "사주팔자 오행 배경화면 | AI 맞춤 분석",
  description: "AI가 당신의 사주팔자를 분석하여 오행 에너지에 맞는 맞춤형 배경화면과 상세 보고서를 제공합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
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

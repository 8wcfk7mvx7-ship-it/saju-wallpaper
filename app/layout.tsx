import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const chosun = localFont({
  src: "../public/fonts/ChosunilboMyungjo.woff",
  variable: "--font-chosun",
  display: "swap",
  preload: true,
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
    <html lang="ko" className={`h-full antialiased ${chosun.variable}`} suppressHydrationWarning>
      <body className={`min-h-full flex flex-col ${chosun.className}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

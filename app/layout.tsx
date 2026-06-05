import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="ko" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

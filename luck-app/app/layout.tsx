import type { Metadata, Viewport } from "next";
import "./globals.css";

// 레트로한 한국 간판·활판인쇄 느낌 — 제목은 굵은 포스터체(Black Han Sans), 본문은 명조체(Nanum Myeongjo)로
// "AI가 뽑아낸 UI"가 아니라 손으로 짠 듯한 인상을 준다.
// next/font/google은 이 두 폰트의 한글 서브셋을 제공하지 않아(subsets: ["latin"]만 지원) 한글이 깨지므로,
// 구글 폰트 CSS를 직접 링크해서 전체 유니코드 레인지(한글 포함)를 받아온다.

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
  themeColor: "#fdf6ec",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Black+Han+Sans&family=Nanum+Myeongjo:wght@400;700;800&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}

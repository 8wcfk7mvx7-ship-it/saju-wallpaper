import type { Metadata, Viewport } from "next";
import { Jua, Gaegu } from "next/font/google";
import "./globals.css";
import HunnyeoIntroPopup from "@/components/HunnyeoIntroPopup";

// 훈녀생정 전용 큐티 서체 (빌드 때 파일로 내려받아 앱에 함께 담긴다)
const jua = Jua({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-hn-title",
  display: "swap",
});

const gaegu = Gaegu({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-hn-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "훈녀생정 — 90년대생 추억 뷰티 노트",
  description:
    "밀가루팩, 봉숭아물 들이기, 글자스킬까지. 2000년대 '훈훈한 여자 생활정보'를 모은 추억 콘텐츠입니다.",
};

export const viewport: Viewport = {
  themeColor: "#ffd6e8",
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${jua.variable} ${gaegu.variable}`}>
      <body>
        {/* 앱을 처음 열었을 때 한 번만 뜨는 안내 팝업 */}
        <HunnyeoIntroPopup />
        {children}
      </body>
    </html>
  );
}

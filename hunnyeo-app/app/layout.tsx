import type { Metadata, Viewport } from "next";
import { Jua, Gaegu, Hi_Melody, Nanum_Pen_Script, Gamja_Flower, Dongle } from "next/font/google";
import "./globals.css";
import HunnyeoIntroPopup from "@/components/HunnyeoIntroPopup";
import AdBanner from "@/components/AdBanner";

// 훈녀생정 전용 큐티 서체 (빌드 때 파일로 내려받아 앱에 함께 담긴다)
const jua = Jua({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-hn-title",
  display: "swap",
});

// 본문 서체 — 내 정보 화면에서 무료 폰트 중 하나로 바꿔 쓸 수 있다.
// 실제로 적용되는 건 --font-hn-body 하나뿐이고, 어떤 폰트를 가리킬지는
// globals.css 의 html[data-hn-font="..."] 규칙이 고른다.
const gaegu = Gaegu({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-hn-gaegu",
  display: "swap",
});
const himelody = Hi_Melody({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-hn-himelody",
  display: "swap",
});
const pen = Nanum_Pen_Script({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-hn-pen",
  display: "swap",
});
const gamja = Gamja_Flower({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-hn-gamja",
  display: "swap",
});
const dongle = Dongle({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-hn-dongle",
  display: "swap",
});

export const metadata: Metadata = {
  title: "훈녀생정 — 90년대생 추억 뷰티 노트",
  description:
    "밀가루팩, 봉숭아물 들이기, 빌리의 부트캠프까지. 2000년대 '훈훈한 여자 생활정보'를 모은 추억 콘텐츠예요.",
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
    <html
      lang="ko"
      className={`${jua.variable} ${gaegu.variable} ${himelody.variable} ${pen.variable} ${gamja.variable} ${dongle.variable}`}
    >
      <body>
        {/* 앱을 처음 열었을 때 한 번만 뜨는 안내 팝업 */}
        <HunnyeoIntroPopup />
        {children}
        {/* 화면 맨 아래 광고 배너 (네이티브 앱에서만 보임) */}
        <AdBanner />
      </body>
    </html>
  );
}

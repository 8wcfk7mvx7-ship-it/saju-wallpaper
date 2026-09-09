import type { Metadata } from "next";
import { Jua, Gaegu } from "next/font/google";
import HunnyeoIntroPopup from "@/components/HunnyeoIntroPopup";

// 훈녀생정 전용 큐티 서체
// - Jua: 동글동글한 제목용 고딕
// - Gaegu: 손글씨 느낌의 본문용 서체 (그 시절 다이어리 감성)
const jua = Jua({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-hn-title",
  display: "swap",
  preload: false,
});

const gaegu = Gaegu({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-hn-body",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "훈녀생정 — 90년대생 추억 뷰티 노트",
  description:
    "밀가루팩, 봉숭아물 들이기, 덴마크 다이어트까지. 2000년대 '훈훈한 여자 생활정보'를 모은 추억 콘텐츠입니다.",
};

export default function HunnyeoLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${jua.variable} ${gaegu.variable}`}>
      {/* 앱을 처음 열었을 때 한 번만 뜨는 안내 팝업 */}
      <HunnyeoIntroPopup />
      {children}
    </div>
  );
}

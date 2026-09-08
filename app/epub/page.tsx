import type { Metadata } from "next";
import EpubWorkspace from "@/components/epub/EpubWorkspace";

export const metadata: Metadata = {
  title: "EPUB 만들기",
  description: "실시간 미리보기로 전자책(EPUB)을 만드는 편집기. 챕터 나누기, 텍스트 박스, 이미지 삽입을 코딩 없이 할 수 있습니다.",
};

export default function EpubPage() {
  return <EpubWorkspace />;
}

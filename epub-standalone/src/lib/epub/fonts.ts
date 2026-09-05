// 독립 실행형 버전: 폰트 파일을 Vite 에셋으로 import해서 data: URL(base64)로 빌드 시점에 인라인한다.
// file:// 로 열어도 fetch()가 막히지 않도록(별도 파일에 대한 fetch는 브라우저가 차단할 수 있음) 하기 위함이다.
import chosunUrl from "@/assets/fonts/chosunilbo-myungjo.woff";
import nanumMyeongjoUrl from "@/assets/fonts/nanum-myeongjo.woff2";
import nanumGothicUrl from "@/assets/fonts/nanum-gothic.woff2";

export type EpubFontId = "chosunilbo" | "nanum-myeongjo" | "nanum-gothic" | "system-serif" | "system-sans";

export interface EpubFontOption {
  id: EpubFontId;
  label: string;
  /** 미리보기(웹)에서 쓰는 font-family 값. next/font 변수 등을 쓸 수 있다. */
  previewFontFamily: string;
  /** 실제 .epub 파일 CSS 안에서 쓰는 font-family 값(내장 @font-face 이름 또는 제네릭). */
  epubFontFamily: string;
  /** 있으면 EPUB 파일 안에 실제로 폰트를 내장한다(모든 리더에서 동일하게 보이도록). */
  embed?: {
    /** /public 기준 정적 파일 경로. */
    publicPath: string;
    fileName: string;
    mimeType: string;
    format: "woff" | "woff2";
    /** EPUB css 안에서 쓸 @font-face font-family 이름. */
    fontFamilyName: string;
  };
}

// 명조체/나눔고딕/나눔명조는 모두 무료 오픈폰트(OFL)이며 EPUB 파일에 실제로 내장된다.
export const EPUB_FONTS: EpubFontOption[] = [
  {
    id: "chosunilbo",
    label: "명조체 (기본)",
    previewFontFamily: "'EpubChosunMyungjo', serif",
    epubFontFamily: "'EpubChosunMyungjo', serif",
    embed: {
      publicPath: chosunUrl,
      fileName: "chosunilbo-myungjo.woff",
      mimeType: "font/woff",
      format: "woff",
      fontFamilyName: "EpubChosunMyungjo",
    },
  },
  {
    id: "nanum-myeongjo",
    label: "나눔명조 (부드러운 명조)",
    previewFontFamily: "'EpubNanumMyeongjo', serif",
    epubFontFamily: "'EpubNanumMyeongjo', serif",
    embed: {
      publicPath: nanumMyeongjoUrl,
      fileName: "nanum-myeongjo.woff2",
      mimeType: "font/woff2",
      format: "woff2",
      fontFamilyName: "EpubNanumMyeongjo",
    },
  },
  {
    id: "nanum-gothic",
    label: "나눔고딕 (고딕체)",
    previewFontFamily: "'EpubNanumGothic', sans-serif",
    epubFontFamily: "'EpubNanumGothic', sans-serif",
    embed: {
      publicPath: nanumGothicUrl,
      fileName: "nanum-gothic.woff2",
      mimeType: "font/woff2",
      format: "woff2",
      fontFamilyName: "EpubNanumGothic",
    },
  },
  {
    id: "system-serif",
    label: "리더 기본(명조 계열)",
    previewFontFamily: "serif",
    epubFontFamily: "serif",
  },
  {
    id: "system-sans",
    label: "리더 기본(고딕 계열)",
    previewFontFamily: "sans-serif",
    epubFontFamily: "sans-serif",
  },
];

export function getEpubFont(id: EpubFontId): EpubFontOption {
  return EPUB_FONTS.find(f => f.id === id) ?? EPUB_FONTS[0];
}

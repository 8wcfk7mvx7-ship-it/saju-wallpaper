// 폰트 목록은 원본(lib/epub/fonts.ts)을 그대로 쓰되, 파일을 가져오는 방법만 바꾼다.
//
// 원본은 웹 서버 기준 경로(/fonts/epub/...)를 fetch하는데, 데스크톱 앱은 file:// 로 열리기
// 때문에 그 방식이 브라우저에 막힌다. 그래서 빌드할 때 폰트를 base64로 파일 안에 박아 넣고,
// 그 data: URL을 대신 넘긴다(data: URL은 어디서든 fetch할 수 있다).
import { EPUB_FONTS as ORIGINAL_FONTS, type EpubFontOption } from "../../../lib/epub/fonts";
import chosunUrl from "../assets/fonts/chosunilbo-myungjo.woff";
import nanumMyeongjoUrl from "../assets/fonts/nanum-myeongjo.woff2";
import nanumGothicUrl from "../assets/fonts/nanum-gothic.woff2";

export type { EpubFontId, EpubFontOption } from "../../../lib/epub/fonts";

const EMBEDDED_BY_FILE: Record<string, string> = {
  "chosunilbo-myungjo.woff": chosunUrl,
  "nanum-myeongjo.woff2": nanumMyeongjoUrl,
  "nanum-gothic.woff2": nanumGothicUrl,
};

export const EPUB_FONTS: EpubFontOption[] = ORIGINAL_FONTS.map(font => {
  if (!font.embed) return font;
  const inlined = EMBEDDED_BY_FILE[font.embed.fileName];
  if (!inlined) return font;
  return { ...font, embed: { ...font.embed, publicPath: inlined } };
});

export function getEpubFont(id: string): EpubFontOption {
  return EPUB_FONTS.find(f => f.id === id) ?? EPUB_FONTS[0];
}

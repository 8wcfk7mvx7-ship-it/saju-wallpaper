// 굵게/기울임 등 인라인 서식을 위한 아주 가벼운 마크업.
// HTML을 몰라도 "드래그 후 우클릭"만으로 적용되며, 편집 화면에는 이 기호가
// 그대로 보이지만(마크다운과 비슷) 미리보기/EPUB 출력에서는 실제 서식으로 바뀐다.

export type InlineStyle = "bold" | "italic" | "underline" | "strike" | "highlight" | "sup" | "sub" | "red" | "blue" | "green";

// 2글자 토큰을 먼저 검사해야 "*"(기울임)가 "**"(굵게)를 잘못 가로채지 않는다.
const DELIMS: { style: InlineStyle; token: string }[] = [
  { style: "bold", token: "**" },
  { style: "underline", token: "++" },
  { style: "strike", token: "~~" },
  { style: "highlight", token: "==" },
  { style: "sup", token: "^^" },
  { style: "sub", token: "%%" },
  { style: "red", token: "##" },
  { style: "blue", token: "@@" },
  { style: "green", token: "$$" },
  { style: "italic", token: "*" },
];

export const STYLE_TOKENS: Record<InlineStyle, string> = Object.fromEntries(
  DELIMS.map(d => [d.style, d.token])
) as Record<InlineStyle, string>;

export type RichNode = { type: "text"; value: string } | { type: "styled"; style: InlineStyle; children: RichNode[] };

/** 한 줄(개행 없는) 텍스트를 굵게/기울임 등이 중첩된 트리로 파싱한다. */
export function parseRichText(input: string): RichNode[] {
  const nodes: RichNode[] = [];
  let i = 0;
  let buffer = "";

  function flushBuffer() {
    if (buffer) {
      nodes.push({ type: "text", value: buffer });
      buffer = "";
    }
  }

  while (i < input.length) {
    let matched = false;
    for (const { style, token } of DELIMS) {
      if (!input.startsWith(token, i)) continue;
      const closeIdx = input.indexOf(token, i + token.length);
      if (closeIdx === -1) continue;
      flushBuffer();
      const inner = input.slice(i + token.length, closeIdx);
      nodes.push({ type: "styled", style, children: parseRichText(inner) });
      i = closeIdx + token.length;
      matched = true;
      break;
    }
    if (!matched) {
      buffer += input[i];
      i += 1;
    }
  }
  flushBuffer();
  return nodes;
}

/** 드래그 선택 영역을 지정한 서식 기호로 감싼다(우클릭 메뉴에서 사용). */
export function wrapRangeWithStyle(text: string, start: number, end: number, style: InlineStyle): string {
  const token = STYLE_TOKENS[style];
  return text.slice(0, start) + token + text.slice(start, end) + token + text.slice(end);
}

/** 선택 영역 바로 앞뒤가 이미 같은 서식 기호면 벗기고, 아니면 새로 감싼다. */
export function toggleRangeWithStyle(text: string, start: number, end: number, style: InlineStyle): string {
  const token = STYLE_TOKENS[style];
  const before = text.slice(Math.max(0, start - token.length), start);
  const after = text.slice(end, end + token.length);
  if (before === token && after === token) {
    return text.slice(0, start - token.length) + text.slice(start, end) + text.slice(end + token.length);
  }
  return wrapRangeWithStyle(text, start, end, style);
}

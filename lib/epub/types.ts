// EPUB 편집기의 데이터 모델. 이 타입들이 그대로 저장(autosave)되고,
// generator.ts가 그대로 읽어서 .epub 파일로 변환한다.

export type BlockType = "paragraph" | "textbox" | "image";

export interface ParagraphBlock {
  id: string;
  type: "paragraph";
  text: string;
}

export interface TextBoxBlock {
  id: string;
  type: "textbox";
  label: string;
  text: string;
}

export interface ImageBlock {
  id: string;
  type: "image";
  /** data: URL (base64) */
  src: string;
  alt: string;
  caption: string;
}

export type Block = ParagraphBlock | TextBoxBlock | ImageBlock;

export interface Chapter {
  id: string;
  title: string;
  blocks: Block[];
}

export interface Book {
  /** dc:identifier에 쓰이는 고정 UUID. 재수출해도 바뀌지 않는다. */
  id: string;
  title: string;
  author: string;
  language: string;
  /** data: URL (base64), 선택 사항 */
  coverImage: string | null;
  chapters: Chapter[];
  /** 미리보기 전용 설정값. epub 파일에는 반영되지 않는다(리더 앱이 자체 조절). */
  previewFontSize: number;
}

let counter = 0;

export function makeId(prefix: string): string {
  counter += 1;
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${counter}`;
}

export function createParagraphBlock(text = ""): ParagraphBlock {
  return { id: makeId("p"), type: "paragraph", text };
}

export function createTextBoxBlock(text = ""): TextBoxBlock {
  return { id: makeId("box"), type: "textbox", label: "메모", text };
}

export function createImageBlock(src: string, alt = ""): ImageBlock {
  return { id: makeId("img"), type: "image", src, alt, caption: "" };
}

export function createChapter(title = "새 챕터"): Chapter {
  return { id: makeId("ch"), title, blocks: [createParagraphBlock("")] };
}

function makeUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function createBook(): Book {
  return {
    id: makeUuid(),
    title: "제목 없는 책",
    author: "",
    language: "ko",
    coverImage: null,
    chapters: [createChapter("1장")],
    previewFontSize: 18,
  };
}

// EPUB 편집기의 데이터 모델. 이 타입들이 그대로 저장(autosave)되고,
// generator.ts가 그대로 읽어서 .epub 파일로 변환한다.
import type { EpubFontId } from "./fonts";

export type BlockType = "paragraph" | "textbox" | "image" | "copyright";

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

/** 판권(Copyright) 페이지. 책 어디든(도입부/마지막 등) 원하는 위치에 넣을 수 있는 블록이다. */
export interface CopyrightBlock {
  id: string;
  type: "copyright";
  title: string;
  author: string;
  publisher: string;
  date: string;
  /** 저작권 문구 등 자유 텍스트. 사용자가 직접 입력. */
  body: string;
  showCover: boolean;
  showPublisherLogo: boolean;
}

export type Block = ParagraphBlock | TextBoxBlock | ImageBlock | CopyrightBlock;

/** 각주(footnote, 본문 근처 팝업)와 미주(endnote, 챕터 끝에 모아서). */
export type NoteKind = "footnote" | "endnote";

export interface Note {
  id: string;
  kind: NoteKind;
  text: string;
}

export interface Chapter {
  id: string;
  title: string;
  blocks: Block[];
  notes: Note[];
}

export interface Book {
  /** dc:identifier에 쓰이는 고정 UUID. 재수출해도 바뀌지 않는다. */
  id: string;
  title: string;
  /** 선택 사항. 우클릭 메뉴에서 "부제로 설정"으로 지정. */
  subtitle: string;
  author: string;
  language: string;
  /** 발행일 등 자유 텍스트(형식 자유). */
  date: string;
  /** data: URL (base64), 선택 사항 */
  coverImage: string | null;
  /** data: URL (base64), 선택 사항 */
  publisherLogo: string | null;
  chapters: Chapter[];
  /** 미리보기 전용 설정값. epub 파일에는 반영되지 않는다(리더 앱이 자체 조절). */
  previewFontSize: number;
  /** 본문에 쓰일 폰트. EPUB 파일에 실제로 내장된다. */
  fontId: EpubFontId;
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

/** book의 현재 제목/저자/발행일을 기본값으로 채우되, 이 블록 안에서 자유롭게 고쳐 쓸 수 있다. */
export function createCopyrightBlock(book: Pick<Book, "title" | "author" | "date">): CopyrightBlock {
  return {
    id: makeId("cr"),
    type: "copyright",
    title: book.title,
    author: book.author,
    publisher: "",
    date: book.date,
    body: "",
    showCover: true,
    showPublisherLogo: false,
  };
}

export function createChapter(title = "새 챕터"): Chapter {
  return { id: makeId("ch"), title, blocks: [createParagraphBlock("")], notes: [] };
}

export function createNote(kind: NoteKind): Note {
  return { id: makeId("note"), kind, text: "" };
}

function makeUuid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function createBook(): Book {
  return {
    id: makeUuid(),
    title: "제목 없는 책",
    subtitle: "",
    author: "",
    language: "ko",
    date: todayString(),
    coverImage: null,
    publisherLogo: null,
    chapters: [createChapter("1장")],
    previewFontSize: 18,
    fontId: "chosunilbo",
  };
}

/** 이전 버전에 저장된 초안에는 새로 추가된 필드들이 없을 수 있다. 불러올 때 채워준다. */
export function normalizeBook(book: Book): Book {
  return {
    ...book,
    subtitle: book.subtitle ?? "",
    date: book.date ?? todayString(),
    publisherLogo: book.publisherLogo ?? null,
    fontId: book.fontId ?? "chosunilbo",
    chapters: book.chapters.map(c => ({ ...c, notes: c.notes ?? [] })),
  };
}

// EPUB 편집기의 데이터 모델. 이 타입들이 그대로 저장(autosave)되고,
// generator.ts가 그대로 읽어서 .epub 파일로 변환한다.
import type { EpubFontId } from "./fonts";

// ============================================================
// 공통 타입
// ============================================================

export type Align = "left" | "center" | "right" | "justify";

export type BlockType =
  | "paragraph"
  | "textbox"
  | "image"
  | "copyright"
  | "quote"
  | "scenebreak"
  | "poem"
  | "heading"
  | "pagebreak"
  | "list"
  | "table"
  | "frontmatter";

/** 뷰어 폰트 크기와 무관하게 페이지 안에서 고정된 세로 위치에 놓고 싶을 때 쓴다.
 *  null이면 평소처럼 자연스럽게 흐른다. 0~100 값이면 그 지점(위에서부터 %)에 고정하고,
 *  앞뒤로 강제 페이지 나눔이 걸려 이 블록만 독립된 한 페이지를 차지한다. */
export type PagePosition = number | null;

// ============================================================
// 블록 타입 정의 — 챕터 본문을 구성하는 11가지 블록
// ============================================================

export interface ParagraphBlock {
  id: string;
  type: "paragraph";
  text: string;
  align: Align;
  pagePosition: PagePosition;
}

export interface TextBoxBlock {
  id: string;
  type: "textbox";
  label: string;
  text: string;
  align: Align;
  pagePosition: PagePosition;
}

export interface ImageBlock {
  id: string;
  type: "image";
  /** data: URL (base64) */
  src: string;
  alt: string;
  caption: string;
  align: "left" | "center" | "right";
  /** 원본 대비 표시 크기(%). 1~100. */
  widthPercent: number;
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

/** 인용구. 출처(citation)는 선택 사항. */
export interface QuoteBlock {
  id: string;
  type: "quote";
  text: string;
  citation: string;
  align: Align;
  pagePosition: PagePosition;
}

/** 장면 전환을 나타내는 구분선(예: * * *). 내용이 없는 순수 구조용 블록. */
export interface SceneBreakBlock {
  id: string;
  type: "scenebreak";
}

/** 시/운문. 줄바꿈을 그대로 보존해서 보여준다(문단처럼 다시 흐르지 않음). */
export interface PoemBlock {
  id: string;
  type: "poem";
  text: string;
  align: Align;
  pagePosition: PagePosition;
}

/** 챕터 안의 소제목(h2/h3). */
export interface HeadingBlock {
  id: string;
  type: "heading";
  text: string;
  level: 2 | 3;
  align: Align;
  pagePosition: PagePosition;
}

/** 리더에 따라 다르지만 대부분 여기서 강제로 다음 페이지로 넘어간다. */
export interface PageBreakBlock {
  id: string;
  type: "pagebreak";
}

export interface ListBlock {
  id: string;
  type: "list";
  ordered: boolean;
  items: string[];
}

/** 간단한 표. 각 셀은 굵게/기울임 등 인라인 서식은 지원하지만 각주 참조는 지원하지 않는다. */
export interface TableBlock {
  id: string;
  type: "table";
  rows: string[][];
  /** 첫 행을 <thead> 제목 행으로 렌더링할지 여부. */
  hasHeader: boolean;
}

// ============================================================
// 특수 페이지(헌사/서문/프롤로그 등) — epub:type 구조 시맨틱스와 1:1 대응
// ============================================================

export type FrontMatterKind =
  | "dedication"
  | "epigraph"
  | "foreword"
  | "preface"
  | "prologue"
  | "afterword"
  | "epilogue"
  | "acknowledgments"
  | "appendix"
  | "glossary";

const FRONT_MATTER_LABELS: Record<FrontMatterKind, string> = {
  dedication: "헌사",
  epigraph: "제사(에피그래프)",
  foreword: "서문",
  preface: "들어가는 글",
  prologue: "프롤로그",
  afterword: "후기",
  epilogue: "에필로그",
  acknowledgments: "감사의 글",
  appendix: "부록",
  glossary: "용어 해설",
};

export function frontMatterLabel(kind: FrontMatterKind): string {
  return FRONT_MATTER_LABELS[kind];
}

/** 드롭다운 등에 나열할 특수 페이지 종류(고정 순서). Ribbon/BlockView가 공유해서 쓴다. */
export const FRONT_MATTER_KINDS: FrontMatterKind[] = [
  "dedication",
  "epigraph",
  "foreword",
  "preface",
  "prologue",
  "afterword",
  "epilogue",
  "acknowledgments",
  "appendix",
  "glossary",
];

/** 짧은 문구(헌사/제사)는 가운데 정렬하고, 장문 산문(서문/프롤로그 등)은 왼쪽 정렬 + 들여쓰기로 다룬다. */
export const PROSE_FRONT_MATTER_KINDS: ReadonlySet<FrontMatterKind> = new Set([
  "foreword",
  "preface",
  "prologue",
  "afterword",
  "epilogue",
  "acknowledgments",
  "appendix",
  "glossary",
]);

/** 헌사/제사/서문/후기처럼 책의 구조적인 특수 페이지. epub:type 시맨틱으로 표시된다. */
export interface FrontMatterBlock {
  id: string;
  type: "frontmatter";
  kind: FrontMatterKind;
  title: string;
  body: string;
  /** 제사(에피그래프)에서 주로 쓰는 출처 표시. */
  citation: string;
}

// ============================================================
// Block 유니온 + 타입 가드
// ============================================================

export type Block =
  | ParagraphBlock
  | TextBoxBlock
  | ImageBlock
  | CopyrightBlock
  | QuoteBlock
  | SceneBreakBlock
  | PoemBlock
  | HeadingBlock
  | PageBreakBlock
  | ListBlock
  | TableBlock
  | FrontMatterBlock;

/** 우클릭 메뉴(굵게/기울임/각주 등)를 적용할 수 있는, 줄글을 담은 블록들. */
export type TextBearingBlock = ParagraphBlock | TextBoxBlock | QuoteBlock | PoemBlock | HeadingBlock;

export function hasText(block: Block): block is TextBearingBlock {
  return (
    block.type === "paragraph" ||
    block.type === "textbox" ||
    block.type === "quote" ||
    block.type === "poem" ||
    block.type === "heading"
  );
}

// ============================================================
// Note / Chapter / Book — 책 전체 데이터 모델
// ============================================================

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
  /** 챕터 첫 글자를 크게 보여주는 전통적인 드롭캡 서식. */
  dropCap: boolean;
}

export interface Book {
  /** dc:identifier에 쓰이는 고정 UUID. 재수출해도 바뀌지 않는다. */
  id: string;
  title: string;
  /** 선택 사항. 우클릭 메뉴에서 "부제로 설정"으로 지정. */
  subtitle: string;
  author: string;
  /** 출판사명. EPUB 메타데이터(dc:publisher)로 그대로 내보내진다. */
  publisher: string;
  /** ISBN 등 식별자(선택). 있으면 dc:identifier로 추가된다. */
  isbn: string;
  /** 책 소개(선택). EPUB 메타데이터(dc:description)로 내보내진다. */
  description: string;
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

// ============================================================
// ID 생성 + 블록/챕터/책 생성 팩토리 함수
// ============================================================

let counter = 0;

export function makeId(prefix: string): string {
  counter += 1;
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${counter}`;
}

export function createParagraphBlock(text = ""): ParagraphBlock {
  return { id: makeId("p"), type: "paragraph", text, align: "left", pagePosition: null };
}

export function createTextBoxBlock(text = ""): TextBoxBlock {
  return { id: makeId("box"), type: "textbox", label: "메모", text, align: "left", pagePosition: null };
}

export function createImageBlock(src: string, alt = ""): ImageBlock {
  return { id: makeId("img"), type: "image", src, alt, caption: "", align: "center", widthPercent: 100 };
}

/** book의 현재 제목/저자/발행일/출판사를 기본값으로 채우되, 이 블록 안에서 자유롭게 고쳐 쓸 수 있다. */
export function createCopyrightBlock(book: Pick<Book, "title" | "author" | "date" | "publisher">): CopyrightBlock {
  return {
    id: makeId("cr"),
    type: "copyright",
    title: book.title,
    author: book.author,
    publisher: book.publisher,
    date: book.date,
    body: "",
    showCover: true,
    showPublisherLogo: false,
  };
}

export function createQuoteBlock(text = ""): QuoteBlock {
  return { id: makeId("q"), type: "quote", text, citation: "", align: "left", pagePosition: null };
}

export function createSceneBreakBlock(): SceneBreakBlock {
  return { id: makeId("sb"), type: "scenebreak" };
}

export function createPoemBlock(text = ""): PoemBlock {
  return { id: makeId("poem"), type: "poem", text, align: "left", pagePosition: null };
}

export function createHeadingBlock(text = "", level: 2 | 3 = 2): HeadingBlock {
  return { id: makeId("h"), type: "heading", text, level, align: "left", pagePosition: null };
}

export function createPageBreakBlock(): PageBreakBlock {
  return { id: makeId("pb"), type: "pagebreak" };
}

export function createListBlock(ordered = false): ListBlock {
  return { id: makeId("list"), type: "list", ordered, items: [""] };
}

export function createTableBlock(): TableBlock {
  return {
    id: makeId("tbl"),
    type: "table",
    rows: [
      ["", ""],
      ["", ""],
    ],
    hasHeader: true,
  };
}

export function createFrontMatterBlock(kind: FrontMatterKind): FrontMatterBlock {
  return { id: makeId("fm"), type: "frontmatter", kind, title: frontMatterLabel(kind), body: "", citation: "" };
}

export function createChapter(title = "새 챕터"): Chapter {
  return { id: makeId("ch"), title, blocks: [createParagraphBlock("")], notes: [], dropCap: false };
}

export function createNote(kind: NoteKind): Note {
  return { id: makeId("note"), kind, text: "" };
}

export function makeUuid(): string {
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
    publisher: "",
    isbn: "",
    description: "",
    language: "ko",
    date: todayString(),
    coverImage: null,
    publisherLogo: null,
    chapters: [createChapter("1장")],
    previewFontSize: 18,
    fontId: "chosunilbo",
  };
}

// ============================================================
// 정규화 — 이전 버전에 저장된 초안과의 하위 호환
// ============================================================

/** 이전 버전에 저장된 초안에는 새로 추가된 필드들이 없을 수 있다. 불러올 때 채워준다.
 *  저장 파일이 일부 손상돼 있어도(챕터/블록 배열 누락 등) 앱이 죽지 않도록 방어적으로 채운다 —
 *  최소한 챕터가 하나도 없는 책은 절대 만들지 않는다(그 이후 화면 전체가 이 가정에 기대고 있다). */
export function normalizeBook(book: Book): Book {
  const chapters = (Array.isArray(book.chapters) ? book.chapters : []).map(c => ({
    ...c,
    notes: Array.isArray(c.notes) ? c.notes : [],
    dropCap: c.dropCap ?? false,
    blocks: (Array.isArray(c.blocks) ? c.blocks : []).map(b => normalizeBlock(b)),
  }));
  return {
    ...book,
    subtitle: book.subtitle ?? "",
    publisher: book.publisher ?? "",
    isbn: book.isbn ?? "",
    description: book.description ?? "",
    date: book.date ?? todayString(),
    publisherLogo: book.publisherLogo ?? null,
    fontId: book.fontId ?? "chosunilbo",
    chapters: chapters.length > 0 ? chapters : [createChapter("1장")],
  };
}

function normalizeBlock(b: Block): Block {
  if (b.type === "paragraph" || b.type === "textbox" || b.type === "quote" || b.type === "poem") {
    return { ...b, align: b.align ?? "left", pagePosition: b.pagePosition ?? null };
  }
  if (b.type === "heading") {
    return { ...b, align: b.align ?? "left", pagePosition: b.pagePosition ?? null };
  }
  if (b.type === "image") {
    return { ...b, align: b.align ?? "center", widthPercent: b.widthPercent ?? 100 };
  }
  return b;
}

// ============================================================
// 복제 헬퍼 — "복제" 버튼에서 사용(id 재발급 + 각주/미주 참조 리매핑)
// ============================================================

const BLOCK_ID_PREFIX: Record<BlockType, string> = {
  paragraph: "p",
  textbox: "box",
  image: "img",
  copyright: "cr",
  quote: "q",
  scenebreak: "sb",
  poem: "poem",
  heading: "h",
  pagebreak: "pb",
  list: "list",
  table: "tbl",
  frontmatter: "fm",
};

/** 블록을 통째로 복제하되 id는 새로 발급한다("복제" 버튼에서 사용). */
export function cloneBlock(block: Block): Block {
  return { ...block, id: makeId(BLOCK_ID_PREFIX[block.type]) };
}

/** 챕터를 통째로 복제한다. 블록/노트 id를 전부 새로 발급하고, 본문에 남은 각주·미주 참조 토큰도
 *  복제된 노트의 새 id를 가리키도록 맞춰준다("챕터 복제" 버튼에서 사용). */
export function cloneChapter(chapter: Chapter): Chapter {
  const noteIdMap = new Map(chapter.notes.map(n => [n.id, makeId("note")]));
  const notes = chapter.notes.map(n => ({ ...n, id: noteIdMap.get(n.id)! }));
  const blocks = chapter.blocks.map(b => {
    const cloned = cloneBlock(b);
    if (!hasText(cloned)) return cloned;
    let text = cloned.text;
    for (const [oldId, newId] of noteIdMap) {
      text = text.split(`[^${oldId}]`).join(`[^${newId}]`);
    }
    return { ...cloned, text };
  });
  return { ...chapter, id: makeId("ch"), title: `${chapter.title} (복사본)`, blocks, notes };
}

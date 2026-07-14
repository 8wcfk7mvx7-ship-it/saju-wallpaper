import JSZip from "jszip";
import type { Block, Book, Chapter, Note } from "./types";
import { computeNoteNumbers, referencedNoteIds, splitTextByNoteRefs } from "./notes";
import { getEpubFont, type EpubFontOption } from "./fonts";

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** 줄글 텍스트 -> 문단 태그들 (각주/미주 본문처럼 참조 토큰이 없는 일반 텍스트용). */
function plainParagraphs(text: string): string {
  const paragraphs = text.split(/\n{2,}/);
  return paragraphs
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p>${escapeXml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
}

interface NoteRenderContext {
  noteById: Map<string, Note>;
  noteNumbers: Map<string, number>;
  /** 이미 <aside>를 출력한 각주 id(같은 챕터에서 같은 각주가 두 번 참조돼도 본문 하나만 낸다). */
  renderedFootnotes: Set<string>;
}

/** 본문 한 줄을 렌더링하며 각주/미주 참조를 <sup><a epub:type="noteref"> 마커로 바꾼다. */
function renderNoteAwareLine(line: string, ctx: NoteRenderContext, footnoteIdsInBlock: string[]): string {
  return splitTextByNoteRefs(line)
    .map(seg => {
      if (seg.type === "text") return escapeXml(seg.value);
      const noteId = seg.noteId!;
      const note = ctx.noteById.get(noteId);
      const num = ctx.noteNumbers.get(noteId);
      if (!note || num === undefined) return ""; // 노트가 삭제된 뒤 남은 토큰 등은 무시
      if (note.kind === "footnote" && !footnoteIdsInBlock.includes(noteId)) {
        footnoteIdsInBlock.push(noteId);
      }
      return `<sup class="noteref"><a epub:type="noteref" href="#${noteId}" id="ref-${noteId}">${num}</a></sup>`;
    })
    .join("");
}

/** 각주/미주 참조가 들어갈 수 있는 본문(문단, 텍스트 박스)을 렌더링한다. */
function renderNoteAwareParagraphs(text: string, ctx: NoteRenderContext): { html: string; footnoteAsides: string } {
  const footnoteIdsInBlock: string[] = [];
  const paragraphs = text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p>${p.split("\n").map(line => renderNoteAwareLine(line, ctx, footnoteIdsInBlock)).join("<br/>")}</p>`);

  const footnoteAsides = footnoteIdsInBlock
    .filter(id => !ctx.renderedFootnotes.has(id))
    .map(id => {
      ctx.renderedFootnotes.add(id);
      const note = ctx.noteById.get(id)!;
      const num = ctx.noteNumbers.get(id)!;
      return `<aside epub:type="footnote" id="${id}" class="footnote"><p class="note-number"><a epub:type="noteref-back" href="#ref-${id}">${num}.</a></p>${plainParagraphs(note.text) || "<p></p>"}</aside>`;
    });

  return { html: paragraphs.join("\n"), footnoteAsides: footnoteAsides.join("\n") };
}

const MIME_EXT: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

interface ResolvedImage {
  block: Extract<Block, { type: "image" }>;
  fileName: string;
  mediaType: string;
  bytes: ArrayBuffer;
}

function mimeFromDataUrl(dataUrl: string): string {
  return /^data:([^;]+);/.exec(dataUrl)?.[1] ?? "image/png";
}

async function dataUrlToBytes(dataUrl: string): Promise<{ bytes: ArrayBuffer; mediaType: string }> {
  const mediaType = mimeFromDataUrl(dataUrl);
  const res = await fetch(dataUrl);
  const bytes = await res.arrayBuffer();
  return { bytes, mediaType };
}

/** 표지/출판사 로고처럼 책 전체에서 한 장씩만 쓰는 이미지. OEBPS 기준 상대경로("images/xxx")를 돌려준다. */
interface BookAssets {
  coverPath: string | null;
  publisherLogoPath: string | null;
}

async function collectImages(book: Book): Promise<ResolvedImage[]> {
  const images: ResolvedImage[] = [];
  let n = 0;
  for (const chapter of book.chapters) {
    for (const block of chapter.blocks) {
      if (block.type !== "image") continue;
      n += 1;
      const { bytes, mediaType } = await dataUrlToBytes(block.src);
      const ext = MIME_EXT[mediaType] ?? "png";
      images.push({ block, fileName: `image-${n}.${ext}`, mediaType, bytes });
    }
  }
  return images;
}

function blockToXhtml(
  block: Block,
  imageByBlockId: Map<string, ResolvedImage>,
  ctx: NoteRenderContext,
  assets: BookAssets
): string {
  switch (block.type) {
    case "paragraph": {
      const { html, footnoteAsides } = renderNoteAwareParagraphs(block.text, ctx);
      return footnoteAsides ? `${html}\n${footnoteAsides}` : html;
    }
    case "textbox": {
      const label = block.label.trim();
      const labelHtml = label ? `<p class="textbox-label">${escapeXml(label)}</p>` : "";
      const { html, footnoteAsides } = renderNoteAwareParagraphs(block.text, ctx);
      const aside = `<aside class="textbox">${labelHtml}${html}</aside>`;
      return footnoteAsides ? `${aside}\n${footnoteAsides}` : aside;
    }
    case "image": {
      const resolved = imageByBlockId.get(block.id);
      if (!resolved) return "";
      const caption = block.caption.trim();
      const figcaption = caption ? `<figcaption>${escapeXml(caption)}</figcaption>` : "";
      return `<figure class="epub-image"><img src="../images/${resolved.fileName}" alt="${escapeXml(block.alt)}"/>${figcaption}</figure>`;
    }
    case "copyright": {
      const parts: string[] = [];
      if (block.showCover && assets.coverPath) {
        parts.push(`<div class="cr-cover"><img src="../${assets.coverPath}" alt="표지"/></div>`);
      }
      parts.push(`<h2 class="cr-title">${escapeXml(block.title)}</h2>`);
      if (block.author.trim()) parts.push(`<p class="cr-line">${escapeXml(block.author)}</p>`);
      if (block.publisher.trim()) parts.push(`<p class="cr-line">${escapeXml(block.publisher)}</p>`);
      if (block.date.trim()) parts.push(`<p class="cr-line cr-date">${escapeXml(block.date)}</p>`);
      if (block.showPublisherLogo && assets.publisherLogoPath) {
        parts.push(`<div class="cr-logo"><img src="../${assets.publisherLogoPath}" alt="출판사 로고"/></div>`);
      }
      const body = plainParagraphs(block.body);
      if (body) parts.push(`<div class="cr-body">${body}</div>`);
      return `<section class="copyright-page" epub:type="colophon">\n${parts.join("\n")}\n</section>`;
    }
  }
}

/** 챕터 끝에 모아 두는 미주(rearnote) 섹션. */
function endnotesSection(chapter: Chapter, ctx: NoteRenderContext): string {
  const referenced = referencedNoteIds(chapter);
  const endnotes = chapter.notes
    .filter(n => n.kind === "endnote" && referenced.has(n.id))
    .sort((a, b) => (ctx.noteNumbers.get(a.id) ?? 0) - (ctx.noteNumbers.get(b.id) ?? 0));
  if (endnotes.length === 0) return "";

  const items = endnotes
    .map(n => {
      const num = ctx.noteNumbers.get(n.id)!;
      return `<aside epub:type="rearnote" id="${n.id}" class="endnote"><p class="note-number"><a epub:type="noteref-back" href="#ref-${n.id}">${num}.</a></p>${plainParagraphs(n.text) || "<p></p>"}</aside>`;
    })
    .join("\n");

  return `<section epub:type="endnotes" class="endnotes"><h2>미주</h2>\n${items}\n</section>`;
}

function chapterToXhtml(
  chapter: Chapter,
  book: Book,
  imageByBlockId: Map<string, ResolvedImage>,
  assets: BookAssets
): string {
  const ctx: NoteRenderContext = {
    noteById: new Map(chapter.notes.map(n => [n.id, n])),
    noteNumbers: computeNoteNumbers(chapter),
    renderedFootnotes: new Set(),
  };
  const body = chapter.blocks.map(b => blockToXhtml(b, imageByBlockId, ctx, assets)).join("\n");
  const endnotes = endnotesSection(chapter, ctx);
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${book.language}" xml:lang="${book.language}">
<head>
<title>${escapeXml(chapter.title)}</title>
<meta charset="utf-8"/>
<link rel="stylesheet" type="text/css" href="../css/style.css"/>
</head>
<body>
<section epub:type="chapter">
<h1>${escapeXml(chapter.title)}</h1>
${body}
</section>
${endnotes}
</body>
</html>`;
}

function navXhtml(book: Book): string {
  const items = book.chapters
    .map((c, i) => `<li><a href="text/chapter-${i + 1}.xhtml">${escapeXml(c.title)}</a></li>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${book.language}" xml:lang="${book.language}">
<head>
<title>목차</title>
<meta charset="utf-8"/>
<link rel="stylesheet" type="text/css" href="css/style.css"/>
</head>
<body>
<nav epub:type="toc" id="toc">
<h1>목차</h1>
<ol>
${items}
</ol>
</nav>
</body>
</html>`;
}

function tocNcx(book: Book): string {
  const navPoints = book.chapters
    .map(
      (c, i) => `<navPoint id="navpoint-${i + 1}" playOrder="${i + 1}">
<navLabel><text>${escapeXml(c.title)}</text></navLabel>
<content src="text/chapter-${i + 1}.xhtml"/>
</navPoint>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
<head>
<meta name="dtb:uid" content="urn:uuid:${book.id}"/>
<meta name="dtb:depth" content="1"/>
<meta name="dtb:totalPageCount" content="0"/>
<meta name="dtb:maxPageNumber" content="0"/>
</head>
<docTitle><text>${escapeXml(book.title)}</text></docTitle>
<navMap>
${navPoints}
</navMap>
</ncx>`;
}

function contentOpf(book: Book, images: ResolvedImage[], assets: BookAssets, font: EpubFontOption): string {
  const modified = new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const manifestChapters = book.chapters
    .map((c, i) => `<item id="chap${i + 1}" href="text/chapter-${i + 1}.xhtml" media-type="application/xhtml+xml"/>`)
    .join("\n");
  const spineChapters = book.chapters.map((c, i) => `<itemref idref="chap${i + 1}"/>`).join("\n");
  const manifestImages = images
    .map((img, i) => `<item id="img${i + 1}" href="images/${img.fileName}" media-type="${img.mediaType}"/>`)
    .join("\n");

  let coverManifest = "";
  let coverMeta = "";
  if (assets.coverPath && book.coverImage) {
    coverManifest = `<item id="cover-image" href="${assets.coverPath}" media-type="${mimeFromDataUrl(book.coverImage)}" properties="cover-image"/>`;
    coverMeta = `<meta name="cover" content="cover-image"/>`;
  }

  const logoManifest =
    assets.publisherLogoPath && book.publisherLogo
      ? `<item id="publisher-logo" href="${assets.publisherLogoPath}" media-type="${mimeFromDataUrl(book.publisherLogo)}"/>`
      : "";

  const fontManifest = font.embed
    ? `<item id="epub-font" href="fonts/${font.embed.fileName}" media-type="${font.embed.mimeType}"/>`
    : "";

  // 부제가 있으면 EPUB3 title-type 확장으로 주제목/부제를 구분해서 넣는다.
  const titleMeta = book.subtitle.trim()
    ? `<dc:title id="main-title">${escapeXml(book.title)}</dc:title>
<meta refines="#main-title" property="title-type">main</meta>
<dc:title id="subtitle">${escapeXml(book.subtitle.trim())}</dc:title>
<meta refines="#subtitle" property="title-type">subtitle</meta>`
    : `<dc:title>${escapeXml(book.title)}</dc:title>`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="${book.language}">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="book-id">urn:uuid:${book.id}</dc:identifier>
${titleMeta}
<dc:language>${book.language}</dc:language>
${book.author ? `<dc:creator>${escapeXml(book.author)}</dc:creator>` : ""}
${book.date.trim() ? `<dc:date>${escapeXml(book.date.trim())}</dc:date>` : ""}
<meta property="dcterms:modified">${modified}</meta>
${coverMeta}
</metadata>
<manifest>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
<item id="css" href="css/style.css" media-type="text/css"/>
${fontManifest}
${coverManifest}
${logoManifest}
${manifestChapters}
${manifestImages}
</manifest>
<spine toc="ncx">
${spineChapters}
</spine>
</package>`;
}

function buildStyleCss(font: EpubFontOption): string {
  const fontFace = font.embed
    ? `@font-face {
  font-family: '${font.embed.fontFamilyName}';
  src: url('fonts/${font.embed.fileName}') format('${font.embed.format}');
  font-weight: 400;
  font-style: normal;
}`
    : "";

  return `
${fontFace}
html, body {
  margin: 0;
  padding: 0;
}
body {
  font-family: ${font.epubFontFamily};
  line-height: 1.8;
  padding: 1.2em;
}
h1 {
  font-size: 1.4em;
  margin: 0 0 1em;
  page-break-before: always;
}
p {
  margin: 0 0 1em;
  text-indent: 1em;
}
.textbox {
  display: block;
  margin: 1.5em 0;
  padding: 1em 1.2em;
  border: 1px solid #999;
  border-radius: 4px;
  background: #f5f5f5;
}
.textbox p {
  text-indent: 0;
}
.textbox-label {
  font-weight: bold;
  margin-bottom: 0.5em;
}
.epub-image {
  margin: 1.5em 0;
  text-align: center;
}
.epub-image img {
  max-width: 100%;
}
.epub-image figcaption {
  font-size: 0.85em;
  color: #555;
  margin-top: 0.5em;
}
.noteref a {
  text-decoration: none;
  color: inherit;
}
aside.footnote, aside.endnote {
  font-size: 0.85em;
  line-height: 1.6;
  margin: 0.6em 0 1.2em;
  padding: 0.6em 1em;
  border-top: 1px solid #ccc;
  background: #f5f5f5;
  color: #333;
}
aside.footnote p, aside.endnote p {
  text-indent: 0;
  margin: 0;
}
.note-number {
  font-weight: bold;
  margin-bottom: 0.3em !important;
}
.endnotes {
  margin-top: 3em;
  padding-top: 1em;
  border-top: 2px solid #999;
}
.endnotes h2 {
  font-size: 1.1em;
  margin: 0 0 1em;
}
.copyright-page {
  page-break-before: always;
  text-align: center;
  padding-top: 3em;
}
.copyright-page .cr-cover img {
  max-width: 55%;
  margin: 0 auto 2em;
  box-shadow: 0 4px 16px rgba(0,0,0,0.25);
}
.copyright-page .cr-title {
  font-size: 1.3em;
  margin: 0 0 0.8em;
  page-break-before: avoid;
}
.copyright-page .cr-line {
  margin: 0 0 0.3em;
  text-indent: 0;
  font-size: 0.9em;
  color: #444;
}
.copyright-page .cr-logo img {
  max-width: 30%;
  margin: 1.5em auto 0;
}
.copyright-page .cr-body {
  margin-top: 2em;
  text-align: left;
  font-size: 0.85em;
  color: #555;
}
.copyright-page .cr-body p {
  text-indent: 0;
}
`;
}

/** 브라우저에서 Book 데이터를 실제 .epub(zip) 파일로 빌드한다. */
export async function buildEpub(book: Book): Promise<Blob> {
  const zip = new JSZip();
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  const meta = zip.folder("META-INF")!;
  meta.file(
    "container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles>
<rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
</rootfiles>
</container>`
  );

  const oebps = zip.folder("OEBPS")!;
  const images = await collectImages(book);
  const imageByBlockId = new Map(images.map(img => [img.block.id, img]));
  const font = getEpubFont(book.fontId);

  const imagesFolder = oebps.folder("images")!;
  for (const img of images) {
    imagesFolder.file(img.fileName, img.bytes);
  }

  const assets: BookAssets = { coverPath: null, publisherLogoPath: null };

  if (book.coverImage) {
    const { bytes, mediaType } = await dataUrlToBytes(book.coverImage);
    const ext = MIME_EXT[mediaType] ?? "png";
    assets.coverPath = `images/cover.${ext}`;
    imagesFolder.file(`cover.${ext}`, bytes);
  }

  if (book.publisherLogo) {
    const { bytes, mediaType } = await dataUrlToBytes(book.publisherLogo);
    const ext = MIME_EXT[mediaType] ?? "png";
    assets.publisherLogoPath = `images/publisher-logo.${ext}`;
    imagesFolder.file(`publisher-logo.${ext}`, bytes);
  }

  if (font.embed) {
    const res = await fetch(font.embed.publicPath);
    const bytes = await res.arrayBuffer();
    oebps.folder("fonts")!.file(font.embed.fileName, bytes);
  }

  oebps.file("content.opf", contentOpf(book, images, assets, font));
  oebps.file("nav.xhtml", navXhtml(book));
  oebps.file("toc.ncx", tocNcx(book));
  oebps.folder("css")!.file("style.css", buildStyleCss(font));

  const textFolder = oebps.folder("text")!;
  book.chapters.forEach((chapter, i) => {
    textFolder.file(`chapter-${i + 1}.xhtml`, chapterToXhtml(chapter, book, imageByBlockId, assets));
  });

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/epub+zip",
    compression: "DEFLATE",
  });
}

export function suggestFileName(book: Book): string {
  const cleaned = book.title.trim().replace(/[\\/:*?"<>|]/g, "").slice(0, 60);
  return `${cleaned || "untitled"}.epub`;
}

import JSZip from "jszip";
import type { Align, Block, Book, Chapter, Note } from "./types";
import { computeNoteNumbers, referencedNoteIds, splitTextByNoteRefs } from "./notes";
import { getEpubFont, type EpubFontOption } from "./fonts";
import { parseRichText, type RichNode } from "./richtext";

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** 굵게/기울임 등 인라인 서식 트리를 실제 XHTML 태그로 바꾼다. */
function richNodesToXhtml(nodes: RichNode[]): string {
  return nodes
    .map(node => {
      if (node.type === "text") return escapeXml(node.value);
      const inner = richNodesToXhtml(node.children);
      switch (node.style) {
        case "bold":
          return `<strong>${inner}</strong>`;
        case "italic":
          return `<em>${inner}</em>`;
        case "underline":
          return `<span class="u">${inner}</span>`;
        case "strike":
          return `<s>${inner}</s>`;
        case "highlight":
          return `<mark>${inner}</mark>`;
        case "sup":
          return `<sup>${inner}</sup>`;
        case "sub":
          return `<sub>${inner}</sub>`;
        case "red":
          return `<span class="text-red">${inner}</span>`;
        case "blue":
          return `<span class="text-blue">${inner}</span>`;
        case "green":
          return `<span class="text-green">${inner}</span>`;
      }
    })
    .join("");
}

/** 정렬/들여쓰기가 반영된 <p> 여는 태그. */
function paragraphOpenTag(align?: Align, indent = true): string {
  const styles: string[] = [];
  if (align && align !== "left") styles.push(`text-align:${align}`);
  if (!indent || (align && align !== "left" && align !== "justify")) styles.push("text-indent:0");
  return styles.length ? `<p style="${styles.join(";")}">` : "<p>";
}

/** 줄글 텍스트 -> 문단 태그들 (각주/미주 본문처럼 참조 토큰이 없는 일반 텍스트용). 인라인 서식은 지원된다. */
function plainParagraphs(text: string, align?: Align, indent = true): string {
  const openTag = paragraphOpenTag(align, indent);
  const paragraphs = text.split(/\n{2,}/);
  return paragraphs
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `${openTag}${p.split("\n").map(line => richNodesToXhtml(parseRichText(line))).join("<br/>")}</p>`)
    .join("\n");
}

interface NoteRenderContext {
  noteById: Map<string, Note>;
  noteNumbers: Map<string, number>;
  /** 이미 <aside>를 출력한 각주 id(같은 챕터에서 같은 각주가 두 번 참조돼도 본문 하나만 낸다). */
  renderedFootnotes: Set<string>;
}

/** 본문 한 줄을 렌더링하며 각주/미주 참조는 <sup><a epub:type="noteref">로, 굵게/기울임 등은 실제 태그로 바꾼다. */
function renderNoteAwareLine(line: string, ctx: NoteRenderContext, footnoteIdsInBlock: string[]): string {
  return splitTextByNoteRefs(line)
    .map(seg => {
      if (seg.type === "text") return richNodesToXhtml(parseRichText(seg.value));
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

/** 이미 등장한 각주 id를 걸러내고 <aside epub:type="footnote"> 목록을 만든다. */
function buildFootnoteAsides(footnoteIdsInBlock: string[], ctx: NoteRenderContext): string {
  return footnoteIdsInBlock
    .filter(id => !ctx.renderedFootnotes.has(id))
    .map(id => {
      ctx.renderedFootnotes.add(id);
      const note = ctx.noteById.get(id)!;
      const num = ctx.noteNumbers.get(id)!;
      return `<aside epub:type="footnote" id="${id}" class="footnote"><p class="note-number"><a epub:type="noteref-back" href="#ref-${id}">${num}.</a></p>${plainParagraphs(note.text) || "<p></p>"}</aside>`;
    })
    .join("\n");
}

/** 각주/미주 참조가 들어갈 수 있는 본문(문단, 텍스트 박스, 인용구, 시 등)을 렌더링한다. */
function renderNoteAwareParagraphs(
  text: string,
  ctx: NoteRenderContext,
  opts: { align?: Align; indent?: boolean } = {}
): { html: string; footnoteAsides: string } {
  const footnoteIdsInBlock: string[] = [];
  const openTag = paragraphOpenTag(opts.align, opts.indent ?? true);
  const paragraphs = text
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `${openTag}${p.split("\n").map(line => renderNoteAwareLine(line, ctx, footnoteIdsInBlock)).join("<br/>")}</p>`);

  return { html: paragraphs.join("\n"), footnoteAsides: buildFootnoteAsides(footnoteIdsInBlock, ctx) };
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

const FRONT_MATTER_EPUB_TYPE: Record<string, string> = {
  dedication: "dedication",
  epigraph: "epigraph",
  foreword: "foreword",
  afterword: "afterword",
};

function blockToXhtml(
  block: Block,
  imageByBlockId: Map<string, ResolvedImage>,
  ctx: NoteRenderContext,
  assets: BookAssets
): string {
  switch (block.type) {
    case "paragraph": {
      const { html, footnoteAsides } = renderNoteAwareParagraphs(block.text, ctx, { align: block.align });
      return footnoteAsides ? `${html}\n${footnoteAsides}` : html;
    }
    case "textbox": {
      const label = block.label.trim();
      const labelHtml = label ? `<p class="textbox-label">${escapeXml(label)}</p>` : "";
      const { html, footnoteAsides } = renderNoteAwareParagraphs(block.text, ctx, { align: block.align });
      const aside = `<aside class="textbox">${labelHtml}${html}</aside>`;
      return footnoteAsides ? `${aside}\n${footnoteAsides}` : aside;
    }
    case "quote": {
      const { html, footnoteAsides } = renderNoteAwareParagraphs(block.text, ctx, { align: block.align, indent: false });
      const citation = block.citation.trim() ? `<footer>— <cite>${escapeXml(block.citation)}</cite></footer>` : "";
      const bq = `<blockquote class="quote">${html}${citation}</blockquote>`;
      return footnoteAsides ? `${bq}\n${footnoteAsides}` : bq;
    }
    case "poem": {
      const { html, footnoteAsides } = renderNoteAwareParagraphs(block.text, ctx, { align: block.align, indent: false });
      const poem = `<div class="poem" epub:type="z3998:poem">${html}</div>`;
      return footnoteAsides ? `${poem}\n${footnoteAsides}` : poem;
    }
    case "heading": {
      const footnoteIdsInBlock: string[] = [];
      const inner = renderNoteAwareLine(block.text, ctx, footnoteIdsInBlock);
      const tag = block.level === 2 ? "h2" : "h3";
      const heading = `<${tag} id="${block.id}">${inner}</${tag}>`;
      const footnoteAsides = buildFootnoteAsides(footnoteIdsInBlock, ctx);
      return footnoteAsides ? `${heading}\n${footnoteAsides}` : heading;
    }
    case "scenebreak":
      return `<p class="scenebreak" role="separator" aria-label="장면 전환">⁂</p>`;
    case "pagebreak":
      return `<div class="pagebreak-marker"></div>`;
    case "list": {
      const footnoteIdsInBlock: string[] = [];
      const tag = block.ordered ? "ol" : "ul";
      const items = block.items
        .filter(item => item.trim())
        .map(item => `<li>${renderNoteAwareLine(item, ctx, footnoteIdsInBlock)}</li>`)
        .join("\n");
      const listHtml = `<${tag}>\n${items}\n</${tag}>`;
      const footnoteAsides = buildFootnoteAsides(footnoteIdsInBlock, ctx);
      return footnoteAsides ? `${listHtml}\n${footnoteAsides}` : listHtml;
    }
    case "frontmatter": {
      const isProse = block.kind === "foreword" || block.kind === "afterword";
      const parts: string[] = [];
      if (block.title.trim()) parts.push(`<h2 class="fm-title">${escapeXml(block.title)}</h2>`);
      const { html: bodyHtml, footnoteAsides } = renderNoteAwareParagraphs(block.body, ctx, { indent: isProse, align: isProse ? undefined : "center" });
      if (bodyHtml) parts.push(`<div class="fm-body fm-${block.kind}">${bodyHtml}</div>`);
      if (block.kind === "epigraph" && block.citation.trim()) {
        parts.push(`<p class="fm-citation">${escapeXml(block.citation)}</p>`);
      }
      const section = `<section class="frontmatter fm-${block.kind}" epub:type="${FRONT_MATTER_EPUB_TYPE[block.kind]}">\n${parts.join("\n")}\n</section>`;
      return footnoteAsides ? `${section}\n${footnoteAsides}` : section;
    }
    case "image": {
      const resolved = imageByBlockId.get(block.id);
      if (!resolved) return "";
      const caption = block.caption.trim();
      const figcaption = caption ? `<figcaption>${escapeXml(caption)}</figcaption>` : "";
      return `<figure class="epub-image epub-image-${block.align}"><img src="../images/${resolved.fileName}" alt="${escapeXml(block.alt)}" style="width:${block.widthPercent}%"/>${figcaption}</figure>`;
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
  const sectionClass = chapter.dropCap ? ` class="dropcap"` : "";
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="${book.language}" xml:lang="${book.language}">
<head>
<title>${escapeXml(chapter.title)}</title>
<meta charset="utf-8"/>
<link rel="stylesheet" type="text/css" href="../css/style.css"/>
</head>
<body>
<section epub:type="chapter"${sectionClass}>
<h1>${escapeXml(chapter.title)}</h1>
${body}
</section>
${endnotes}
</body>
</html>`;
}

function chapterHeadings(chapter: Chapter): Extract<Block, { type: "heading" }>[] {
  return chapter.blocks.filter((b): b is Extract<Block, { type: "heading" }> => b.type === "heading" && b.text.trim().length > 0);
}

function navXhtml(book: Book): string {
  const items = book.chapters
    .map((c, i) => {
      const headings = chapterHeadings(c);
      const sub =
        headings.length > 0
          ? `<ol>\n${headings.map(h => `<li><a href="text/chapter-${i + 1}.xhtml#${h.id}">${escapeXml(h.text)}</a></li>`).join("\n")}\n</ol>`
          : "";
      return `<li><a href="text/chapter-${i + 1}.xhtml">${escapeXml(c.title)}</a>${sub}</li>`;
    })
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
  let playOrder = 0;
  const navPoints = book.chapters
    .map((c, i) => {
      playOrder += 1;
      const chapterPlayOrder = playOrder;
      const headings = chapterHeadings(c);
      const children = headings
        .map(h => {
          playOrder += 1;
          return `<navPoint id="navpoint-${h.id}" playOrder="${playOrder}">
<navLabel><text>${escapeXml(h.text)}</text></navLabel>
<content src="text/chapter-${i + 1}.xhtml#${h.id}"/>
</navPoint>`;
        })
        .join("\n");
      return `<navPoint id="navpoint-${i + 1}" playOrder="${chapterPlayOrder}">
<navLabel><text>${escapeXml(c.title)}</text></navLabel>
<content src="text/chapter-${i + 1}.xhtml"/>
${children}
</navPoint>`;
    })
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
:root {
  color-scheme: light dark;
}
html, body {
  margin: 0;
  padding: 0;
}
body {
  font-family: ${font.epubFontFamily};
  line-height: 1.8;
  padding: 1.2em;
  background: #ffffff;
  color: #1c1a14;
  -webkit-hyphens: auto;
  -moz-hyphens: auto;
  -ms-hyphens: auto;
  -epub-hyphens: auto;
  hyphens: auto;
}
h1 {
  font-size: 1.4em;
  margin: 0 0 1em;
  page-break-before: always;
}
h2 {
  font-size: 1.15em;
  margin: 1.4em 0 0.6em;
}
h3 {
  font-size: 1.05em;
  margin: 1.2em 0 0.5em;
}
p {
  margin: 0 0 1em;
  text-indent: 1em;
}
/* 소제목 바로 다음 문단은 들여쓰지 않는 것이 일반적인 조판 관행이다 */
h1 + p, h2 + p, h3 + p {
  text-indent: 0;
}
section.dropcap > p:first-of-type::first-letter {
  font-size: 3em;
  font-weight: 800;
  float: left;
  line-height: 0.8;
  margin: 0.05em 0.08em 0 0;
}
mark {
  background: #fde68a;
  color: #1c1a14;
  padding: 0 2px;
  border-radius: 2px;
}
.u {
  text-decoration: underline;
}
.text-red {
  color: #c0392b;
}
.text-blue {
  color: #2563eb;
}
.text-green {
  color: #16a34a;
}
.textbox {
  display: block;
  margin: 1.5em 0;
  padding: 1em 1.2em;
  border: 1px solid #999;
  border-radius: 4px;
  background: rgba(0,0,0,0.04);
}
.textbox p {
  text-indent: 0;
}
.textbox-label {
  font-weight: bold;
  margin-bottom: 0.5em;
}
blockquote.quote {
  margin: 1.2em 1.5em;
  padding-left: 1em;
  border-left: 3px solid #999;
  font-style: italic;
}
blockquote.quote p {
  text-indent: 0;
}
blockquote.quote footer {
  font-style: normal;
  font-size: 0.85em;
  opacity: 0.7;
  margin-top: 0.5em;
}
.poem {
  margin: 1.5em 0;
}
.poem p {
  text-indent: 0;
}
p.scenebreak {
  text-align: center;
  margin: 2em 0;
  letter-spacing: 0.4em;
  text-indent: 0;
  opacity: 0.6;
}
.pagebreak-marker {
  page-break-before: always;
}
ul, ol {
  margin: 0 0 1em;
  padding-left: 1.6em;
}
li {
  margin: 0 0 0.4em;
}
.epub-image {
  margin: 1.5em 0;
}
.epub-image img {
  max-width: 100%;
  display: block;
}
.epub-image-center {
  text-align: center;
}
.epub-image-center img {
  margin: 0 auto;
}
.epub-image-left {
  text-align: left;
}
.epub-image-right img {
  margin-left: auto;
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
  background: rgba(0,0,0,0.04);
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
.copyright-page, .frontmatter {
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
.frontmatter .fm-title {
  font-size: 1.1em;
  margin: 0 0 1em;
}
.frontmatter .fm-foreword, .frontmatter .fm-afterword {
  text-align: left;
  margin-top: 1em;
}
.frontmatter .fm-citation {
  font-size: 0.85em;
  opacity: 0.7;
  margin-top: 0.8em;
  text-indent: 0;
}

/* 리더가 다크 모드일 때 배경/글자색을 함께 바꾼다 (Apple Books 등에서 지원) */
@media (prefers-color-scheme: dark) {
  body {
    background: #1a1816;
    color: #e8e3d8;
  }
  mark {
    background: #7a6a1f;
    color: #fff3d0;
  }
  .textbox, aside.footnote, aside.endnote {
    background: rgba(255,255,255,0.06);
    border-color: #555;
    color: #d8d3c8;
  }
  blockquote.quote {
    border-left-color: #777;
  }
  .copyright-page .cr-line, .copyright-page .cr-body, .epub-image figcaption {
    color: #c9c3b6;
  }
  .endnotes, p.scenebreak {
    border-color: #555;
  }
  .text-red {
    color: #f87171;
  }
  .text-blue {
    color: #60a5fa;
  }
  .text-green {
    color: #4ade80;
  }
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

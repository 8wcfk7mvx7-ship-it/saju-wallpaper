import JSZip from "jszip";
import type { Block, Book, Chapter } from "./types";

function escapeXml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** 줄글 텍스트 -> 문단 태그들. 빈 줄 두 번은 문단 구분, 한 번은 줄바꿈. */
function textToParagraphs(text: string): string {
  const paragraphs = text.split(/\n{2,}/);
  return paragraphs
    .map(p => p.trim())
    .filter(p => p.length > 0)
    .map(p => `<p>${escapeXml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("\n");
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

async function dataUrlToBytes(dataUrl: string): Promise<{ bytes: ArrayBuffer; mediaType: string }> {
  const match = /^data:([^;]+);base64,/.exec(dataUrl);
  const mediaType = match?.[1] ?? "image/png";
  const res = await fetch(dataUrl);
  const bytes = await res.arrayBuffer();
  return { bytes, mediaType };
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

function blockToXhtml(block: Block, imageByBlockId: Map<string, ResolvedImage>): string {
  switch (block.type) {
    case "paragraph":
      return textToParagraphs(block.text);
    case "textbox": {
      const label = block.label.trim();
      const labelHtml = label ? `<p class="textbox-label">${escapeXml(label)}</p>` : "";
      return `<aside class="textbox">${labelHtml}${textToParagraphs(block.text)}</aside>`;
    }
    case "image": {
      const resolved = imageByBlockId.get(block.id);
      if (!resolved) return "";
      const caption = block.caption.trim();
      const figcaption = caption ? `<figcaption>${escapeXml(caption)}</figcaption>` : "";
      return `<figure class="epub-image"><img src="../images/${resolved.fileName}" alt="${escapeXml(block.alt)}"/>${figcaption}</figure>`;
    }
  }
}

function chapterToXhtml(chapter: Chapter, book: Book, imageByBlockId: Map<string, ResolvedImage>): string {
  const body = chapter.blocks.map(b => blockToXhtml(b, imageByBlockId)).join("\n");
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

function contentOpf(book: Book, images: ResolvedImage[]): string {
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
  if (book.coverImage) {
    coverManifest = `<item id="cover-image" href="images/cover.${MIME_EXT[/^data:([^;]+);/.exec(book.coverImage)?.[1] ?? "image/png"] ?? "png"}" media-type="${/^data:([^;]+);/.exec(book.coverImage)?.[1] ?? "image/png"}" properties="cover-image"/>`;
    coverMeta = `<meta name="cover" content="cover-image"/>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id" xml:lang="${book.language}">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="book-id">urn:uuid:${book.id}</dc:identifier>
<dc:title>${escapeXml(book.title)}</dc:title>
<dc:language>${book.language}</dc:language>
${book.author ? `<dc:creator>${escapeXml(book.author)}</dc:creator>` : ""}
<meta property="dcterms:modified">${modified}</meta>
${coverMeta}
</metadata>
<manifest>
<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
<item id="css" href="css/style.css" media-type="text/css"/>
${coverManifest}
${manifestChapters}
${manifestImages}
</manifest>
<spine toc="ncx">
${spineChapters}
</spine>
</package>`;
}

const STYLE_CSS = `
html, body {
  margin: 0;
  padding: 0;
}
body {
  font-family: serif;
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
`;

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

  oebps.file("content.opf", contentOpf(book, images));
  oebps.file("nav.xhtml", navXhtml(book));
  oebps.file("toc.ncx", tocNcx(book));
  oebps.folder("css")!.file("style.css", STYLE_CSS);

  const textFolder = oebps.folder("text")!;
  book.chapters.forEach((chapter, i) => {
    textFolder.file(`chapter-${i + 1}.xhtml`, chapterToXhtml(chapter, book, imageByBlockId));
  });

  const imagesFolder = oebps.folder("images")!;
  for (const img of images) {
    imagesFolder.file(img.fileName, img.bytes);
  }

  if (book.coverImage) {
    const { bytes, mediaType } = await dataUrlToBytes(book.coverImage);
    const ext = MIME_EXT[mediaType] ?? "png";
    imagesFolder.file(`cover.${ext}`, bytes);
  }

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

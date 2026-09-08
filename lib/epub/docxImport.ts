// Word(.docx) 파일 가져오기. 애플 Pages도 "Word로 내보내기"를 지원하므로,
// Pages에서 쓴 원고를 이 경로로 이펍공장에 들여올 수 있다.
// .docx는 zip 안에 word/document.xml(본문 XML)을 담은 포맷이라 JSZip + DOMParser로 직접 읽는다.
// 표/이미지/각주 등은 다루지 않는다 — 문단·소제목·굵게/기울임/밑줄 정도만 옮겨온다.
import JSZip from "jszip";
import { createChapter, createHeadingBlock, createParagraphBlock, type Chapter } from "./types";

interface DocxRun {
  text: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
}

interface DocxParagraph {
  runs: DocxRun[];
  /** 0 = 챕터 제목(Heading 1), 1 = 소제목(큰), 2 이상 = 소제목(작은). null이면 그냥 본문. */
  outlineLevel: number | null;
}

const HEADING1_STYLES = /^(heading ?1|title|제목?1)$/i;
const HEADING2_STYLES = /^(heading ?2|제목?2)$/i;

function styleOutlineLevel(styleVal: string | null): number | null {
  if (!styleVal) return null;
  if (HEADING1_STYLES.test(styleVal)) return 0;
  if (HEADING2_STYLES.test(styleVal)) return 1;
  if (/^heading ?[3-9]$/i.test(styleVal)) return 2;
  return null;
}

function parseParagraph(p: Element): DocxParagraph {
  const pPr = p.getElementsByTagName("w:pPr")[0];
  const outlineLvlEl = pPr?.getElementsByTagName("w:outlineLvl")[0];
  const outlineLvlAttr = outlineLvlEl?.getAttribute("w:val");
  const styleEl = pPr?.getElementsByTagName("w:pStyle")[0];
  const styleAttr = styleEl?.getAttribute("w:val") ?? null;

  const outlineLevel = outlineLvlAttr !== undefined && outlineLvlAttr !== null
    ? Number(outlineLvlAttr)
    : styleOutlineLevel(styleAttr);

  const runs: DocxRun[] = [];
  for (const r of Array.from(p.getElementsByTagName("w:r"))) {
    const rPr = r.getElementsByTagName("w:rPr")[0];
    const bold = !!rPr && rPr.getElementsByTagName("w:b").length > 0 && rPr.getElementsByTagName("w:b")[0].getAttribute("w:val") !== "false" && rPr.getElementsByTagName("w:b")[0].getAttribute("w:val") !== "0";
    const italic = !!rPr && rPr.getElementsByTagName("w:i").length > 0 && rPr.getElementsByTagName("w:i")[0].getAttribute("w:val") !== "false" && rPr.getElementsByTagName("w:i")[0].getAttribute("w:val") !== "0";
    const underline = !!rPr && rPr.getElementsByTagName("w:u").length > 0 && rPr.getElementsByTagName("w:u")[0].getAttribute("w:val") !== "none";
    const textParts = Array.from(r.getElementsByTagName("w:t")).map(t => t.textContent ?? "");
    const hasLineBreak = r.getElementsByTagName("w:br").length > 0;
    const text = textParts.join("") + (hasLineBreak ? "\n" : "");
    if (text) runs.push({ text, bold, italic, underline });
  }
  return { runs, outlineLevel: outlineLevel === null || Number.isNaN(outlineLevel) ? null : outlineLevel };
}

/** 인접한 런을 서식이 같으면 합치고, 굵게/기울임/밑줄 토큰으로 감싼 뒤 이어붙인다. */
function runsToRichText(runs: DocxRun[]): string {
  const merged: DocxRun[] = [];
  for (const run of runs) {
    const last = merged[merged.length - 1];
    if (last && last.bold === run.bold && last.italic === run.italic && last.underline === run.underline) {
      last.text += run.text;
    } else {
      merged.push({ ...run });
    }
  }
  return merged
    .map(r => {
      let t = r.text;
      if (r.bold) t = `**${t}**`;
      if (r.italic) t = `*${t}*`;
      if (r.underline) t = `++${t}++`;
      return t;
    })
    .join("");
}

/** .docx 파일을 파싱해서 챕터 목록으로 바꾼다. Heading 1(또는 제목1)이 나올 때마다 새 챕터로 나눈다. */
export async function docxToChapters(file: File): Promise<Chapter[]> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const xmlFile = zip.file("word/document.xml");
  if (!xmlFile) throw new Error("올바른 Word(.docx) 파일이 아니에요.");
  const xmlText = await xmlFile.async("text");
  const doc = new DOMParser().parseFromString(xmlText, "application/xml");
  if (doc.getElementsByTagName("parsererror").length > 0) {
    throw new Error("문서를 읽는 중 문제가 생겼어요.");
  }

  const paragraphs = Array.from(doc.getElementsByTagName("w:p")).map(parseParagraph);

  const chapters: Chapter[] = [];
  let current: Chapter = createChapter("가져온 글");
  current.blocks = [];
  let startedFirstChapter = false;

  for (const para of paragraphs) {
    const text = runsToRichText(para.runs).trim();
    if (para.outlineLevel === 0) {
      if (startedFirstChapter || current.blocks.length > 0) chapters.push(current);
      current = createChapter(text || `${chapters.length + 1}장`);
      current.blocks = [];
      startedFirstChapter = true;
      continue;
    }
    if (!text) continue;
    if (para.outlineLevel === 1) {
      current.blocks.push(createHeadingBlock(text, 2));
    } else if (para.outlineLevel !== null && para.outlineLevel >= 2) {
      current.blocks.push(createHeadingBlock(text, 3));
    } else {
      current.blocks.push(createParagraphBlock(text));
    }
  }
  if (current.blocks.length > 0 || chapters.length === 0) chapters.push(current);

  return chapters;
}

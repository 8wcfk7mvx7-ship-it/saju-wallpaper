import { hasText, type Block, type Chapter, type NoteKind } from "./types";

/** 본문 텍스트 안에서 각주/미주를 표시하는 인라인 토큰. 마크다운 각주 문법을 본떴다. */
const NOTE_REF_RE = /\[\^([\w-]+)\]/g;

function blockText(block: Block): string {
  return hasText(block) ? block.text : "";
}

export function extractNoteRefIds(text: string): string[] {
  return Array.from(text.matchAll(NOTE_REF_RE)).map(m => m[1]);
}

/** 챕터의 블록을 순서대로 훑어 각주/미주가 처음 등장하는 순서대로 번호를 매긴다(각주·미주 별도 채번). */
export function computeNoteNumbers(chapter: Chapter): Map<string, number> {
  const numbers = new Map<string, number>();
  const counters: Record<NoteKind, number> = { footnote: 0, endnote: 0 };
  const noteById = new Map(chapter.notes.map(n => [n.id, n]));
  for (const block of chapter.blocks) {
    for (const id of extractNoteRefIds(blockText(block))) {
      if (numbers.has(id)) continue;
      const note = noteById.get(id);
      if (!note) continue;
      counters[note.kind] += 1;
      numbers.set(id, counters[note.kind]);
    }
  }
  return numbers;
}

/** 블록 목록 어딘가에서 실제로 참조되고 있는 노트 id 집합. */
export function referencedNoteIdsInBlocks(blocks: Block[]): Set<string> {
  const ids = new Set<string>();
  for (const block of blocks) {
    for (const id of extractNoteRefIds(blockText(block))) ids.add(id);
  }
  return ids;
}

/** 본문 어딘가에서 실제로 참조되고 있는 노트 id 집합. */
export function referencedNoteIds(chapter: Chapter): Set<string> {
  return referencedNoteIdsInBlocks(chapter.blocks);
}

export function insertNoteToken(text: string, cursor: number, noteId: string): { text: string; cursor: number } {
  const token = `[^${noteId}]`;
  const safeCursor = Math.max(0, Math.min(cursor, text.length));
  const next = text.slice(0, safeCursor) + token + text.slice(safeCursor);
  return { text: next, cursor: safeCursor + token.length };
}

/** 노트가 삭제되었을 때 본문에 남은 참조 토큰을 제거한다. */
export function stripNoteToken(text: string, noteId: string): string {
  return text.replace(new RegExp(`\\[\\^${noteId}\\]`, "g"), "");
}

/** 우클릭 메뉴로 선택 영역을 각주/미주로 바꿀 때: 선택된 글자를 참조 토큰으로 치환한다. */
export function replaceRangeWithNoteToken(text: string, start: number, end: number, noteId: string): string {
  return text.slice(0, start) + `[^${noteId}]` + text.slice(end);
}

export interface TextSegment {
  type: "text" | "noteref";
  value: string;
  noteId?: string;
}

/** 한 줄(개행 제외) 안에서 일반 텍스트와 각주/미주 참조 토큰을 분리한다. */
export function splitTextByNoteRefs(line: string): TextSegment[] {
  const segments: TextSegment[] = [];
  let lastIndex = 0;
  for (const m of line.matchAll(NOTE_REF_RE)) {
    const idx = m.index ?? 0;
    if (idx > lastIndex) segments.push({ type: "text", value: line.slice(lastIndex, idx) });
    segments.push({ type: "noteref", value: m[0], noteId: m[1] });
    lastIndex = idx + m[0].length;
  }
  if (lastIndex < line.length) segments.push({ type: "text", value: line.slice(lastIndex) });
  return segments;
}

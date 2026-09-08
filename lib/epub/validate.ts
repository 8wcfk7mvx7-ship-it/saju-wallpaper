// 내보내기 전에 흔한 실수를 미리 알려주는 가벼운 점검. 막지는 않고 경고만 한다 —
// 이 도구는 "완벽해야 내보낼 수 있다"가 아니라 "실수를 알아채게 돕는다"를 목표로 한다.
import { hasText, type Book } from "./types";
import { referencedNoteIds } from "./notes";

function chapterHasContent(chapter: Book["chapters"][number]): boolean {
  return chapter.blocks.some(block => {
    if (hasText(block)) return block.text.trim().length > 0;
    if (block.type === "image") return true;
    if (block.type === "table") return block.rows.some(row => row.some(cell => cell.trim().length > 0));
    if (block.type === "list") return block.items.some(item => item.trim().length > 0);
    if (block.type === "frontmatter" || block.type === "copyright") return block.body.trim().length > 0;
    return false;
  });
}

export function validateBook(book: Book): string[] {
  const warnings: string[] = [];

  if (!book.title.trim() || book.title === "제목 없는 책") {
    warnings.push("책 제목이 비어 있어요.");
  }

  for (const chapter of book.chapters) {
    if (!chapterHasContent(chapter)) {
      warnings.push(`'${chapter.title}' 챕터에 내용이 없어요.`);
    }

    const referenced = referencedNoteIds(chapter);
    const noteIds = new Set(chapter.notes.map(n => n.id));
    const broken = [...referenced].filter(id => !noteIds.has(id));
    if (broken.length > 0) {
      warnings.push(`'${chapter.title}' 챕터에 연결이 끊긴 각주/미주 참조가 있어요.`);
    }
    const orphaned = chapter.notes.filter(n => !referenced.has(n.id));
    if (orphaned.length > 0) {
      warnings.push(`'${chapter.title}' 챕터에 본문에서 쓰이지 않는 각주/미주가 ${orphaned.length}개 있어요.`);
    }

    for (const block of chapter.blocks) {
      if (block.type === "image" && !block.alt.trim()) {
        warnings.push(`'${chapter.title}' 챕터에 대체 텍스트(alt)가 없는 이미지가 있어요.`);
        break;
      }
    }
  }

  return warnings;
}

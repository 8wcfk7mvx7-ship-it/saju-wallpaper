// 책 전체(모든 챕터의 모든 블록)를 대상으로 하는 찾아 바꾸기. 정규식은 지원하지 않는다 —
// HTML/정규식을 몰라도 되는 도구라는 이 프로그램의 취지에 맞춰 순수 문자열 치환만 제공한다.
import { hasText, type Block, type Book } from "./types";

function replaceInText(text: string, find: string, replaceWith: string): { text: string; count: number } {
  if (!find) return { text, count: 0 };
  const count = text.split(find).length - 1;
  if (count === 0) return { text, count: 0 };
  return { text: text.split(find).join(replaceWith), count };
}

function replaceInBlock(block: Block, find: string, replaceWith: string): { block: Block; count: number } {
  if (hasText(block)) {
    const r = replaceInText(block.text, find, replaceWith);
    return { block: r.count ? { ...block, text: r.text } : block, count: r.count };
  }
  switch (block.type) {
    case "list": {
      let count = 0;
      const items = block.items.map(item => {
        const r = replaceInText(item, find, replaceWith);
        count += r.count;
        return r.text;
      });
      return { block: count ? { ...block, items } : block, count };
    }
    case "table": {
      let count = 0;
      const rows = block.rows.map(row =>
        row.map(cell => {
          const r = replaceInText(cell, find, replaceWith);
          count += r.count;
          return r.text;
        })
      );
      return { block: count ? { ...block, rows } : block, count };
    }
    case "frontmatter": {
      const title = replaceInText(block.title, find, replaceWith);
      const body = replaceInText(block.body, find, replaceWith);
      const citation = replaceInText(block.citation, find, replaceWith);
      const count = title.count + body.count + citation.count;
      return { block: count ? { ...block, title: title.text, body: body.text, citation: citation.text } : block, count };
    }
    case "copyright": {
      const author = replaceInText(block.author, find, replaceWith);
      const publisher = replaceInText(block.publisher, find, replaceWith);
      const body = replaceInText(block.body, find, replaceWith);
      const count = author.count + publisher.count + body.count;
      return { block: count ? { ...block, author: author.text, publisher: publisher.text, body: body.text } : block, count };
    }
    case "image": {
      const alt = replaceInText(block.alt, find, replaceWith);
      const caption = replaceInText(block.caption, find, replaceWith);
      const count = alt.count + caption.count;
      return { block: count ? { ...block, alt: alt.text, caption: caption.text } : block, count };
    }
    default:
      return { block, count: 0 };
  }
}

export function replaceAllInBook(book: Book, find: string, replaceWith: string): { book: Book; count: number } {
  if (!find) return { book, count: 0 };
  let total = 0;
  const chapters = book.chapters.map(chapter => {
    let chapterCount = 0;
    const blocks = chapter.blocks.map(b => {
      const { block, count } = replaceInBlock(b, find, replaceWith);
      chapterCount += count;
      return block;
    });
    total += chapterCount;
    return chapterCount > 0 ? { ...chapter, blocks } : chapter;
  });
  return { book: total > 0 ? { ...book, chapters } : book, count: total };
}

/** 실제로 바꾸지 않고 몇 곳이 일치하는지만 센다(찾기 입력 중 실시간 미리보기용). */
export function countMatches(book: Book, find: string): number {
  return replaceAllInBook(book, find, find).count;
}

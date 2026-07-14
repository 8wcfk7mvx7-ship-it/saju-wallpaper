"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  cloneBlock, cloneChapter, createBook, createChapter, createCopyrightBlock, createFrontMatterBlock, createHeadingBlock,
  createListBlock, createNote, createPageBreakBlock, createParagraphBlock, createPoemBlock, createQuoteBlock,
  createSceneBreakBlock, createTextBoxBlock, hasText, normalizeBook,
  type Block, type Book, type FrontMatterKind, type Note, type NoteKind, type TextBearingBlock,
} from "@/lib/epub/types";
import type { EpubFontId } from "@/lib/epub/fonts";
import { imageBlocksFromFiles } from "@/lib/epub/blocks";
import { referencedNoteIdsInBlocks, replaceRangeWithNoteToken, stripNoteToken } from "@/lib/epub/notes";
import { toggleRangeWithStyle, type InlineStyle } from "@/lib/epub/richtext";
import { buildEpub, suggestFileName } from "@/lib/epub/generator";
import { loadDraft, saveDraft } from "@/lib/epub/storage";
import { saveEpubFile } from "@/lib/epub/download";
import BookMetaBar from "./BookMetaBar";
import EditorPane from "./EditorPane";
import PreviewPane from "./PreviewPane";

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** 줄글이 있는 블록(문단/텍스트박스/인용구/시/소제목) 목록에서 특정 블록의 text만 계산해서 바꿔치기한다. */
function updateBlockText(blocks: Block[], blockId: string, compute: (text: string) => string): Block[] {
  return blocks.map(b => {
    if (b.id !== blockId || !hasText(b)) return b;
    return { ...b, text: compute(b.text) };
  });
}

/** 같은 타입의 새 블록을 만들되 내용은 지정한 텍스트로 채운다. id는 새로 발급된다. */
function cloneTextBlockWithText(block: TextBearingBlock, text: string): TextBearingBlock {
  switch (block.type) {
    case "textbox":
      return { ...createTextBoxBlock(text), label: block.label, align: block.align };
    case "quote":
      return { ...createQuoteBlock(text), citation: block.citation, align: block.align };
    case "poem":
      return { ...createPoemBlock(text), align: block.align };
    case "heading":
      return createHeadingBlock(text, block.level);
    case "paragraph":
      return { ...createParagraphBlock(text), align: block.align };
  }
}

export default function EpubWorkspace() {
  const [book, setBook] = useState<Book>(() => createBook());
  const [activeChapterId, setActiveChapterId] = useState(book.chapters[0].id);
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");
  const [exporting, setExporting] = useState(false);
  const [ready, setReady] = useState(false);
  const [history, setHistory] = useState<Book[]>([]);
  const [future, setFuture] = useState<Book[]>([]);
  const lastSnapshotAt = useRef(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** book을 바꾸는 유일한 통로. 실행 취소를 위해 바뀌기 전 상태를 스냅샷으로 남긴다.
   *  타이핑처럼 짧은 시간 안에 몰아치는 변경은 하나의 되돌리기 단계로 묶는다. */
  function mutate(updater: (prev: Book) => Book) {
    const now = Date.now();
    if (now - lastSnapshotAt.current > 800) {
      setHistory(h => [...h.slice(-49), book]);
      setFuture([]);
    }
    lastSnapshotAt.current = now;
    setBook(updater);
  }

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setFuture(f => [...f, book]);
    setHistory(h => h.slice(0, -1));
    setBook(prev);
    lastSnapshotAt.current = 0;
  }, [history, book]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[future.length - 1];
    setHistory(h => [...h, book]);
    setFuture(f => f.slice(0, -1));
    setBook(next);
    lastSnapshotAt.current = 0;
  }, [future, book]);

  useEffect(() => {
    loadDraft().then(draft => {
      if (draft && draft.chapters.length > 0) {
        const normalized = normalizeBook(draft);
        setBook(normalized);
        setActiveChapterId(normalized.chapters[0].id);
      }
      setReady(true);
    });
  }, []);

  // 텍스트 입력 중 브라우저 기본 되돌리기(글자 단위)를 방해하지 않도록,
  // 텍스트 입력 필드에 포커스가 없을 때만 Ctrl/Cmd+Z로 책 전체를 되돌린다.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (document.activeElement as HTMLElement | null)?.tagName;
      if (tag === "TEXTAREA" || tag === "INPUT") return;
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "z") return;
      e.preventDefault();
      if (e.shiftKey) handleRedo();
      else handleUndo();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [history, future, book, handleUndo, handleRedo]);

  useEffect(() => {
    if (!ready) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveDraft(book), 600);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [book, ready]);

  const activeChapter = book.chapters.find(c => c.id === activeChapterId) ?? book.chapters[0];
  const activeChapterIndex = book.chapters.findIndex(c => c.id === activeChapter.id);

  function updateChapter(chapterId: string, updater: (chapter: Book["chapters"][number]) => Book["chapters"][number]) {
    mutate(prev => ({
      ...prev,
      chapters: prev.chapters.map(c => (c.id === chapterId ? updater(c) : c)),
    }));
  }

  function handleAddChapter() {
    const chapter = createChapter(`${book.chapters.length + 1}장`);
    mutate(prev => ({ ...prev, chapters: [...prev.chapters, chapter] }));
    setActiveChapterId(chapter.id);
  }

  function handleRenameChapter(id: string, title: string) {
    updateChapter(id, c => ({ ...c, title }));
  }

  function handleDeleteChapter(id: string) {
    mutate(prev => {
      const chapters = prev.chapters.filter(c => c.id !== id);
      if (chapters.length === 0) return prev;
      if (id === activeChapterId) setActiveChapterId(chapters[0].id);
      return { ...prev, chapters };
    });
  }

  function handleMoveChapter(id: string, direction: -1 | 1) {
    mutate(prev => {
      const idx = prev.chapters.findIndex(c => c.id === id);
      const target = idx + direction;
      if (target < 0 || target >= prev.chapters.length) return prev;
      const chapters = [...prev.chapters];
      [chapters[idx], chapters[target]] = [chapters[target], chapters[idx]];
      return { ...prev, chapters };
    });
  }

  function handleDuplicateChapter(id: string) {
    const copy = cloneChapter(book.chapters.find(c => c.id === id)!);
    mutate(prev => {
      const idx = prev.chapters.findIndex(c => c.id === id);
      if (idx < 0) return prev;
      const chapters = [...prev.chapters];
      chapters.splice(idx + 1, 0, copy);
      return { ...prev, chapters };
    });
    setActiveChapterId(copy.id);
  }

  function handleChangeBlock(blockId: string, block: Block) {
    updateChapter(activeChapter.id, c => ({
      ...c,
      blocks: c.blocks.map(b => (b.id === blockId ? block : b)),
    }));
  }

  function handleDeleteBlock(blockId: string) {
    updateChapter(activeChapter.id, c => {
      const blocks = c.blocks.filter(b => b.id !== blockId);
      return { ...c, blocks: blocks.length > 0 ? blocks : [createParagraphBlock("")] };
    });
  }

  function handleMoveBlock(blockId: string, direction: -1 | 1) {
    updateChapter(activeChapter.id, c => {
      const idx = c.blocks.findIndex(b => b.id === blockId);
      const target = idx + direction;
      if (target < 0 || target >= c.blocks.length) return c;
      const blocks = [...c.blocks];
      [blocks[idx], blocks[target]] = [blocks[target], blocks[idx]];
      return { ...c, blocks };
    });
  }

  function handleDuplicateBlock(blockId: string) {
    updateChapter(activeChapter.id, c => {
      const idx = c.blocks.findIndex(b => b.id === blockId);
      if (idx < 0) return c;
      const copy = cloneBlock(c.blocks[idx]);
      const blocks = [...c.blocks];
      blocks.splice(idx + 1, 0, copy);
      return { ...c, blocks };
    });
  }

  /** 블록을 드래그해서 targetId 블록 바로 앞으로 옮긴다. */
  function handleReorderBlock(draggedId: string, targetId: string) {
    updateChapter(activeChapter.id, c => {
      const fromIdx = c.blocks.findIndex(b => b.id === draggedId);
      if (fromIdx < 0) return c;
      const blocks = [...c.blocks];
      const [dragged] = blocks.splice(fromIdx, 1);
      const toIdx = blocks.findIndex(b => b.id === targetId);
      if (toIdx < 0) {
        blocks.splice(fromIdx, 0, dragged);
        return c;
      }
      blocks.splice(toIdx, 0, dragged);
      return { ...c, blocks };
    });
  }

  function handleAddParagraph() {
    updateChapter(activeChapter.id, c => ({ ...c, blocks: [...c.blocks, createParagraphBlock("")] }));
  }

  function handleAddTextBox() {
    updateChapter(activeChapter.id, c => ({ ...c, blocks: [...c.blocks, createTextBoxBlock("")] }));
  }

  function handleAddCopyright() {
    const block = createCopyrightBlock(book);
    updateChapter(activeChapter.id, c => ({ ...c, blocks: [...c.blocks, block] }));
  }

  function handleAddQuote() {
    updateChapter(activeChapter.id, c => ({ ...c, blocks: [...c.blocks, createQuoteBlock("")] }));
  }

  function handleAddSceneBreak() {
    updateChapter(activeChapter.id, c => ({ ...c, blocks: [...c.blocks, createSceneBreakBlock()] }));
  }

  function handleAddPoem() {
    updateChapter(activeChapter.id, c => ({ ...c, blocks: [...c.blocks, createPoemBlock("")] }));
  }

  function handleAddHeading() {
    updateChapter(activeChapter.id, c => ({ ...c, blocks: [...c.blocks, createHeadingBlock("")] }));
  }

  function handleAddPageBreak() {
    updateChapter(activeChapter.id, c => ({ ...c, blocks: [...c.blocks, createPageBreakBlock()] }));
  }

  function handleAddList(ordered: boolean) {
    updateChapter(activeChapter.id, c => ({ ...c, blocks: [...c.blocks, createListBlock(ordered)] }));
  }

  function handleAddFrontMatter(kind: FrontMatterKind) {
    updateChapter(activeChapter.id, c => ({ ...c, blocks: [...c.blocks, createFrontMatterBlock(kind)] }));
  }

  function handleToggleDropCap() {
    updateChapter(activeChapter.id, c => ({ ...c, dropCap: !c.dropCap }));
  }

  async function handleAddImages(files: FileList | File[]) {
    const blocks = await imageBlocksFromFiles(files);
    if (blocks.length === 0) return;
    updateChapter(activeChapter.id, c => ({ ...c, blocks: [...c.blocks, ...blocks] }));
  }

  function handleSplitAt(blockId: string) {
    mutate(prev => {
      const chapterIdx = prev.chapters.findIndex(c => c.id === activeChapter.id);
      const chapter = prev.chapters[chapterIdx];
      const blockIdx = chapter.blocks.findIndex(b => b.id === blockId);
      if (blockIdx < 0 || blockIdx >= chapter.blocks.length - 1) return prev;

      const keep = chapter.blocks.slice(0, blockIdx + 1);
      const moved = chapter.blocks.slice(blockIdx + 1);

      // 각주/미주는 실제로 참조되는 쪽 챕터를 따라간다. 양쪽에서 참조되면(드묾) 둘 다에 남긴다.
      const keepIds = referencedNoteIdsInBlocks(keep);
      const movedIds = referencedNoteIdsInBlocks(moved);
      const keepNotes = chapter.notes.filter(n => keepIds.has(n.id) || !movedIds.has(n.id));
      const movedNotes = chapter.notes.filter(n => movedIds.has(n.id));

      const newChapter = { ...createChapter(`${chapter.title} (계속)`), blocks: moved, notes: movedNotes };

      const chapters = [...prev.chapters];
      chapters[chapterIdx] = { ...chapter, blocks: keep, notes: keepNotes };
      chapters.splice(chapterIdx + 1, 0, newChapter);
      return { ...prev, chapters };
    });
  }

  /** 우클릭 메뉴: 드래그로 고른 글자를 뽑아 책 제목으로 쓰고, 본문에서는 지운다. */
  function handleSetBookTitle(blockId: string, start: number, end: number) {
    const block = activeChapter.blocks.find(b => b.id === blockId);
    if (!block || !hasText(block)) return;
    const selected = block.text.slice(start, end).trim();
    if (!selected) return;
    updateChapter(activeChapter.id, c => ({ ...c, blocks: updateBlockText(c.blocks, blockId, t => t.slice(0, start) + t.slice(end)) }));
    mutate(prev => ({ ...prev, title: selected }));
  }

  /** 우클릭 메뉴: 드래그로 고른 글자를 뽑아 책 부제로 쓰고, 본문에서는 지운다. */
  function handleSetBookSubtitle(blockId: string, start: number, end: number) {
    const block = activeChapter.blocks.find(b => b.id === blockId);
    if (!block || !hasText(block)) return;
    const selected = block.text.slice(start, end).trim();
    if (!selected) return;
    updateChapter(activeChapter.id, c => ({ ...c, blocks: updateBlockText(c.blocks, blockId, t => t.slice(0, start) + t.slice(end)) }));
    mutate(prev => ({ ...prev, subtitle: selected }));
  }

  /** 우클릭 메뉴: 드래그로 고른 글자를 새 챕터의 제목으로 삼아, 그 지점에서 챕터를 나눈다. */
  function handleSplitAsChapter(blockId: string, start: number, end: number) {
    const targetBlock = activeChapter.blocks.find(b => b.id === blockId);
    if (!targetBlock || !hasText(targetBlock)) return;
    const newTitle = targetBlock.text.slice(start, end).trim();
    if (!newTitle) return;
    const newChapterTemplate = createChapter(newTitle);

    mutate(prev => {
      const chapterIdx = prev.chapters.findIndex(c => c.id === activeChapter.id);
      const chapter = prev.chapters[chapterIdx];
      const idx = chapter.blocks.findIndex(b => b.id === blockId);
      const block = chapter.blocks[idx];
      if (idx < 0 || !block || !hasText(block)) return prev;

      const beforeText = block.text.slice(0, start);
      const afterText = block.text.slice(end);
      const blocksBefore = chapter.blocks.slice(0, idx);
      const blocksAfter = chapter.blocks.slice(idx + 1);
      const keptBlock = { ...block, text: beforeText };
      const newFirstBlock = cloneTextBlockWithText(block, afterText);
      const keepBlocks = [...blocksBefore, keptBlock];
      const movedBlocks = [newFirstBlock, ...blocksAfter];

      const keepIds = referencedNoteIdsInBlocks(keepBlocks);
      const movedIds = referencedNoteIdsInBlocks(movedBlocks);
      const keepNotes = chapter.notes.filter(n => keepIds.has(n.id) || !movedIds.has(n.id));
      const movedNotes = chapter.notes.filter(n => movedIds.has(n.id));

      const newChapter = { ...newChapterTemplate, blocks: movedBlocks, notes: movedNotes };
      const chapters = [...prev.chapters];
      chapters[chapterIdx] = { ...chapter, blocks: keepBlocks, notes: keepNotes };
      chapters.splice(chapterIdx + 1, 0, newChapter);
      return { ...prev, chapters };
    });
    setActiveChapterId(newChapterTemplate.id);
  }

  /** 우클릭 메뉴: 드래그로 고른 글자를 각주/미주 내용으로 옮기고, 본문 자리에는 참조 표시만 남긴다. */
  function handleConvertSelectionToNote(blockId: string, start: number, end: number, kind: NoteKind) {
    const block = activeChapter.blocks.find(b => b.id === blockId);
    if (!block || !hasText(block)) return;
    const selected = block.text.slice(start, end).trim();
    if (!selected) return;
    const note: Note = { ...createNote(kind), text: selected };
    updateChapter(activeChapter.id, c => ({
      ...c,
      notes: [...c.notes, note],
      blocks: updateBlockText(c.blocks, blockId, t => replaceRangeWithNoteToken(t, start, end, note.id)),
    }));
  }

  /** 우클릭 메뉴: 굵게/기울임/밑줄/취소선/형광펜/위첨자/아래첨자 등 인라인 서식을 선택 영역에 적용한다. */
  function handleApplyInlineStyle(blockId: string, start: number, end: number, style: InlineStyle) {
    updateChapter(activeChapter.id, c => ({ ...c, blocks: updateBlockText(c.blocks, blockId, t => toggleRangeWithStyle(t, start, end, style)) }));
  }

  function handleAddNote(note: Note) {
    updateChapter(activeChapter.id, c => ({ ...c, notes: [...c.notes, note] }));
  }

  function handleChangeNote(noteId: string, text: string) {
    updateChapter(activeChapter.id, c => ({
      ...c,
      notes: c.notes.map(n => (n.id === noteId ? { ...n, text } : n)),
    }));
  }

  function handleDeleteNote(noteId: string) {
    updateChapter(activeChapter.id, c => ({
      ...c,
      notes: c.notes.filter(n => n.id !== noteId),
      blocks: c.blocks.map(b => (hasText(b) ? { ...b, text: stripNoteToken(b.text, noteId) } : b)),
    }));
  }

  async function handleChangeCover(file: File | null) {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    mutate(prev => ({ ...prev, coverImage: dataUrl }));
  }

  async function handleChangePublisherLogo(file: File | null) {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    mutate(prev => ({ ...prev, publisherLogo: dataUrl }));
  }

  function handleChangeFont(fontId: EpubFontId) {
    mutate(prev => ({ ...prev, fontId }));
  }

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await buildEpub(book);
      await saveEpubFile(blob, suggestFileName(book));
    } catch (err) {
      console.error("EPUB export failed", err);
      alert("EPUB 파일을 만드는 중 문제가 발생했어요. 다시 시도해 주세요.");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="flex flex-col" style={{ height: "100dvh", background: "#f7f1e3", color: "#2a2417" }}>
      <BookMetaBar
        title={book.title}
        subtitle={book.subtitle}
        author={book.author}
        date={book.date}
        coverImage={book.coverImage}
        publisherLogo={book.publisherLogo}
        fontId={book.fontId}
        exporting={exporting}
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onChangeTitle={t => mutate(prev => ({ ...prev, title: t }))}
        onChangeSubtitle={s => mutate(prev => ({ ...prev, subtitle: s }))}
        onChangeAuthor={a => mutate(prev => ({ ...prev, author: a }))}
        onChangeDate={d => mutate(prev => ({ ...prev, date: d }))}
        onChangeCover={handleChangeCover}
        onChangePublisherLogo={handleChangePublisherLogo}
        onChangeFont={handleChangeFont}
        onExport={handleExport}
        view={mobileView}
        onChangeView={setMobileView}
      />

      <div className="flex-1 min-h-0 flex">
        <div className={`min-h-0 flex-1 sm:flex sm:w-1/2 ${mobileView === "editor" ? "flex" : "hidden"}`}>
          <EditorPane
            chapters={book.chapters}
            activeChapter={activeChapter}
            onSelectChapter={setActiveChapterId}
            onAddChapter={handleAddChapter}
            onRenameChapter={handleRenameChapter}
            onDeleteChapter={handleDeleteChapter}
            onMoveChapter={handleMoveChapter}
            onDuplicateChapter={handleDuplicateChapter}
            onChangeBlock={handleChangeBlock}
            onDeleteBlock={handleDeleteBlock}
            onMoveBlock={handleMoveBlock}
            onReorderBlock={handleReorderBlock}
            onDuplicateBlock={handleDuplicateBlock}
            onSplitAt={handleSplitAt}
            onAddParagraph={handleAddParagraph}
            onAddTextBox={handleAddTextBox}
            onAddImages={handleAddImages}
            onAddCopyright={handleAddCopyright}
            onAddQuote={handleAddQuote}
            onAddSceneBreak={handleAddSceneBreak}
            onAddPoem={handleAddPoem}
            onAddHeading={handleAddHeading}
            onAddPageBreak={handleAddPageBreak}
            onAddList={handleAddList}
            onAddFrontMatter={handleAddFrontMatter}
            onToggleDropCap={handleToggleDropCap}
            onAddNote={handleAddNote}
            onChangeNote={handleChangeNote}
            onDeleteNote={handleDeleteNote}
            onSetBookTitle={handleSetBookTitle}
            onSetBookSubtitle={handleSetBookSubtitle}
            onSplitAsChapter={handleSplitAsChapter}
            onConvertSelectionToNote={handleConvertSelectionToNote}
            onApplyInlineStyle={handleApplyInlineStyle}
          />
        </div>

        <div
          className={`min-h-0 flex-1 sm:flex sm:w-1/2 border-l ${mobileView === "preview" ? "flex" : "hidden"}`}
          style={{ borderColor: "rgba(0,0,0,0.08)" }}
        >
          <PreviewPane
            chapter={activeChapter}
            chapterIndex={activeChapterIndex}
            chapterCount={book.chapters.length}
            fontSize={book.previewFontSize}
            fontId={book.fontId}
            assets={{ coverImage: book.coverImage, publisherLogo: book.publisherLogo }}
            onFontSizeChange={size => mutate(prev => ({ ...prev, previewFontSize: size }))}
            onPrevChapter={() => {
              const target = book.chapters[activeChapterIndex - 1];
              if (target) setActiveChapterId(target.id);
            }}
            onNextChapter={() => {
              const target = book.chapters[activeChapterIndex + 1];
              if (target) setActiveChapterId(target.id);
            }}
          />
        </div>
      </div>
    </div>
  );
}

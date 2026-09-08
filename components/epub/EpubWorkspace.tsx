"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  cloneBlock, cloneChapter, createBook, createChapter, createCopyrightBlock, createFrontMatterBlock, createHeadingBlock,
  createListBlock, createNote, createPageBreakBlock, createParagraphBlock, createPoemBlock, createQuoteBlock, createTableBlock,
  createSceneBreakBlock, createTextBoxBlock, hasText, makeUuid, normalizeBook,
  type Block, type Book, type FrontMatterKind, type Note, type NoteKind, type TextBearingBlock,
} from "@/lib/epub/types";
import { EPUB_FONTS, type EpubFontId } from "@/lib/epub/fonts";
import { imageBlocksFromFiles } from "@/lib/epub/blocks";
import { referencedNoteIdsInBlocks, replaceRangeWithNoteToken, stripNoteToken } from "@/lib/epub/notes";
import { toggleRangeWithStyle, type InlineStyle } from "@/lib/epub/richtext";
import { buildEpub, suggestFileName } from "@/lib/epub/generator";
import { loadDraft, listProjects, loadProject, saveDraft, saveProject, type ProjectMeta } from "@/lib/epub/storage";
import { saveEpubFile } from "@/lib/epub/download";
import { countMatches, replaceAllInBook } from "@/lib/epub/findReplace";
import { validateBook } from "@/lib/epub/validate";
import { docxToChapters } from "@/lib/epub/docxImport";
import BookMetaBar from "./BookMetaBar";
import ChapterRail from "./ChapterRail";
import EditorPane from "./EditorPane";
import PreviewPane from "./PreviewPane";
import FindReplacePanel from "./FindReplacePanel";

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
      return { ...createHeadingBlock(text, block.level), align: block.align };
    case "paragraph":
      return { ...createParagraphBlock(text), align: block.align };
  }
}

/**
 * 편집기 화면 구성 방식.
 * - web:    데스크톱 브라우저(좌우 분할 + 전체 메뉴 바)
 * - phone:  아이폰 앱(한 번에 한 화면 + 하단 탭 바)
 * - tablet: 아이패드 앱(좌우 분할 + 큼직한 터치 영역)
 */
export type WorkspaceLayout = "web" | "phone" | "tablet";

interface WorkspaceProps {
  layout?: WorkspaceLayout;
  /** 앱에서 책장 화면으로 돌아가는 버튼을 띄운다. 없으면 버튼도 없다. */
  onExit?: () => void;
  /** 앱의 책장에서 특정 책을 골라 들어온 경우 그 책을 연다. */
  openProjectId?: string | null;
  /** 책장에서 "새 책 만들기"로 들어온 경우 저장된 초안 대신 빈 책으로 시작한다. */
  startNew?: boolean;
}

export default function EpubWorkspace({
  layout = "web",
  onExit,
  openProjectId = null,
  startNew = false,
}: WorkspaceProps = {}) {
  const isPhone = layout === "phone";
  const isTablet = layout === "tablet";
  // ── 상태 ──
  const [book, setBook] = useState<Book>(() => createBook());
  const [activeChapterId, setActiveChapterId] = useState(book.chapters[0].id);
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");
  // 아이폰 앱에서 하단 탭으로 오가는 화면
  const [phoneTab, setPhoneTab] = useState<"chapters" | "editor" | "preview" | "book">("editor");
  // 아이패드 앱의 왼쪽 챕터 사이드바(가로 화면에서는 기본으로 펼침)
  const [railOpen, setRailOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  // 앱에서 파일을 저장한 뒤 어디에 저장됐는지 잠깐 알려주는 안내
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [history, setHistory] = useState<Book[]>([]);
  const [future, setFuture] = useState<Book[]>([]);
  const [focusMode, setFocusMode] = useState(false);
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [findQuery, setFindQuery] = useState("");
  const lastSnapshotAt = useRef(0);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── book 변경 통로 + 실행취소/다시실행 ──
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

  // 아이패드: 가로 화면이면 챕터 사이드바를 처음부터 펼쳐둔다.
  useEffect(() => {
    if (layout !== "tablet") return;
    setRailOpen(window.innerWidth >= 1000);
  }, [layout]);

  useEffect(() => {
    // 앱 책장에서 "새 책"으로 들어왔으면 저장된 초안을 불러오지 않는다.
    if (startNew) {
      setReady(true);
      return;
    }

    // 책장에서 고른 책이 있으면 그 책을, 없으면 마지막 초안을 연다.
    const load = openProjectId ? loadProject(openProjectId) : loadDraft();
    load
      .then(saved => {
        if (saved) {
          const normalized = normalizeBook(saved);
          setBook(normalized);
          setActiveChapterId(normalized.chapters[0].id);
          if (openProjectId) setCurrentProjectId(openProjectId);
        }
      })
      .catch(err => {
        // 저장된 초안이 손상되어 있어도 새 책으로 계속 작업할 수 있어야 한다.
        console.error("저장된 원고를 불러오지 못했어요", err);
      })
      .finally(() => setReady(true));
  }, [openProjectId, startNew]);

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

  // 탭을 배경으로 보내거나 닫을 때는 600ms 디바운스를 기다리지 않고 즉시 저장한다.
  // (모바일 브라우저는 백그라운드 탭의 setTimeout을 보장하지 않으므로 이게 실제 안전망이다.)
  useEffect(() => {
    if (!ready) return;
    function flush() {
      if (document.visibilityState === "hidden") saveDraft(book);
    }
    document.addEventListener("visibilitychange", flush);
    window.addEventListener("pagehide", flush);
    return () => {
      document.removeEventListener("visibilitychange", flush);
      window.removeEventListener("pagehide", flush);
    };
  }, [book, ready]);

  const activeChapter = book.chapters.find(c => c.id === activeChapterId) ?? book.chapters[0];
  const activeChapterIndex = book.chapters.findIndex(c => c.id === activeChapter.id);

  // ── 챕터 핸들러 ──
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

  /** 다음 챕터의 블록/각주·미주를 이 챕터 끝에 이어 붙이고, 다음 챕터는 없앤다("챕터 나누기"의 반대). */
  function handleMergeChapterWithNext(id: string) {
    mutate(prev => {
      const idx = prev.chapters.findIndex(c => c.id === id);
      const next = prev.chapters[idx + 1];
      if (idx < 0 || !next) return prev;
      const current = prev.chapters[idx];
      const merged = { ...current, blocks: [...current.blocks, ...next.blocks], notes: [...current.notes, ...next.notes] };
      const chapters = [...prev.chapters];
      chapters.splice(idx, 2, merged);
      if (next.id === activeChapterId) setActiveChapterId(merged.id);
      return { ...prev, chapters };
    });
  }

  // ── 블록 핸들러(수정/삭제/이동/복제/순서 바꾸기) ──
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

  // ── 블록 추가 핸들러(리본바 버튼들) ──
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

  function handleAddTable() {
    updateChapter(activeChapter.id, c => ({ ...c, blocks: [...c.blocks, createTableBlock()] }));
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

  // ── 우클릭(드래그 선택) 메뉴 핸들러 ──
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

  // ── 각주/미주 핸들러 ──
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

  // ── 책 메타데이터(표지/로고/폰트) 핸들러 ──
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

  // ── 창 컨트롤(집중 모드/전체 화면) 핸들러 ──
  function handleToggleFocusMode() {
    setFocusMode(v => !v);
  }

  function handleToggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
    }
  }

  // ── 파일(프로젝트 저장/열기) 핸들러 ──
  function handleRefreshProjects() {
    listProjects().then(setProjects);
  }

  function resetHistory() {
    setHistory([]);
    setFuture([]);
    lastSnapshotAt.current = 0;
  }

  function handleNewProject() {
    if (!confirm("새 책을 시작할까요? 저장하지 않은 변경 사항은 사라져요.")) return;
    const fresh = createBook();
    setBook(fresh);
    setActiveChapterId(fresh.chapters[0].id);
    setCurrentProjectId(null);
    resetHistory();
  }

  async function handleSaveProject() {
    if (currentProjectId) {
      const name = book.title || "제목 없는 책";
      await saveProject(currentProjectId, name, book);
      handleRefreshProjects();
    } else {
      await handleSaveAsProject();
    }
  }

  async function handleSaveAsProject() {
    const name = prompt("저장할 이름을 입력하세요.", book.title || "제목 없는 책");
    if (name === null) return;
    const newId = makeUuid();
    const newBook: Book = { ...book, id: newId };
    await saveProject(newId, name || "제목 없는 책", newBook);
    setBook(newBook);
    setCurrentProjectId(newId);
    handleRefreshProjects();
  }

  async function handleOpenProject(id: string) {
    if (id === currentProjectId) return;
    if (!confirm("이 파일을 열까요? 저장하지 않은 변경 사항은 사라져요.")) return;
    const loaded = await loadProject(id);
    if (!loaded) return;
    const normalized = normalizeBook(loaded);
    setBook(normalized);
    setActiveChapterId(normalized.chapters[0].id);
    setCurrentProjectId(id);
    resetHistory();
  }

  /** Word(.docx) 파일을 읽어 새 챕터(들)로 만들어 현재 책 끝에 이어 붙인다(기존 내용은 건드리지 않는다). */
  async function handleImportDocx(file: File) {
    try {
      const imported = await docxToChapters(file);
      mutate(prev => ({ ...prev, chapters: [...prev.chapters, ...imported] }));
      setActiveChapterId(imported[0].id);
    } catch (err) {
      console.error("Word 파일 가져오기 실패", err);
      alert("이 파일을 읽지 못했어요. .docx 파일이 맞는지 확인해 주세요.");
    }
  }

  // ── 찾아 바꾸기 ──
  const findMatchCount = useMemo(() => countMatches(book, findQuery), [book, findQuery]);

  function handleReplaceAll(find: string, replaceWith: string) {
    const { book: next, count } = replaceAllInBook(book, find, replaceWith);
    if (count === 0) return;
    mutate(() => next);
    alert(`${count}곳을 바꿨어요.`);
  }

  // ── 내보내기 ──
  async function handleExport() {
    const warnings = validateBook(book);
    if (warnings.length > 0) {
      const proceed = confirm(
        `내보내기 전에 확인해 주세요:\n\n${warnings.map(w => `· ${w}`).join("\n")}\n\n그래도 내보낼까요?`
      );
      if (!proceed) return;
    }
    setExporting(true);
    const fileName = suggestFileName(book);
    try {
      const blob = await buildEpub(book);
      const result = await saveEpubFile(blob, fileName);
      // 앱에서는 파일이 어디 저장됐는지 알려주지 않으면 사용자가 찾지 못한다.
      if (result.method === "native-share" || result.method === "native-file") {
        setExportNotice(`${fileName} 파일을 저장했어요.\n"파일" 앱 > 이펍공장 폴더에서 볼 수 있어요.`);
      }
    } catch (err) {
      // 공유 시트를 사용자가 닫은 것은 실패가 아니다.
      if (err instanceof DOMException && err.name === "AbortError") return;
      console.error("EPUB export failed", err);
      alert(
        "EPUB 파일을 저장하지 못했어요.\n" +
        "저장 공간이 부족하거나 앱 권한이 막혀 있을 수 있어요. 다시 시도해 주세요."
      );
    } finally {
      setExporting(false);
    }
  }

  // ── 렌더 ──
  const shellStyle: React.CSSProperties = {
    height: "100dvh",
    background: "#f7f1e3",
    color: "#2a2417",
    position: "relative",
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, "Helvetica Neue", Arial, sans-serif',
  };

  // 저장 위치 안내(앱). 확인을 누를 때까지 남겨둔다.
  const exportToast = exportNotice && (
    <div
      className="fixed inset-x-0 bottom-0 z-[300] px-4"
      style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 16px)" }}
    >
      <div
        className="mx-auto rounded-2xl px-4 py-3.5 flex items-start gap-3"
        style={{
          maxWidth: 460,
          background: "#2a2417",
          color: "#fff",
          boxShadow: "0 12px 32px rgba(0,0,0,0.28)",
        }}
      >
        <p className="flex-1 text-[13px] leading-relaxed whitespace-pre-line">{exportNotice}</p>
        <button
          onClick={() => setExportNotice(null)}
          className="shrink-0 text-[13px] font-bold px-2 py-1"
          style={{ color: "#c9c2ae" }}
        >
          확인
        </button>
      </div>
    </div>
  );

  const findReplacePanel = findReplaceOpen && (
    <FindReplacePanel
      find={findQuery}
      matchCount={findMatchCount}
      onChangeFind={setFindQuery}
      onReplaceAll={handleReplaceAll}
      onClose={() => setFindReplaceOpen(false)}
    />
  );

  const editorPane = (
    <EditorPane
      focusMode={focusMode}
      hideChapterRail={isPhone || isTablet}
      chapters={book.chapters}
      activeChapter={activeChapter}
      onSelectChapter={setActiveChapterId}
      onAddChapter={handleAddChapter}
      onRenameChapter={handleRenameChapter}
      onDeleteChapter={handleDeleteChapter}
      onMoveChapter={handleMoveChapter}
      onDuplicateChapter={handleDuplicateChapter}
      onMergeChapterWithNext={handleMergeChapterWithNext}
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
      onAddTable={handleAddTable}
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
  );

  const previewPane = (
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
  );

  const metaBar = (
    <BookMetaBar
      title={book.title}
      subtitle={book.subtitle}
      author={book.author}
      publisher={book.publisher}
      isbn={book.isbn}
      description={book.description}
      date={book.date}
      coverImage={book.coverImage}
      publisherLogo={book.publisherLogo}
      fontId={book.fontId}
      exporting={exporting}
      canUndo={history.length > 0}
      canRedo={future.length > 0}
      onUndo={handleUndo}
      onRedo={handleRedo}
      findReplaceOpen={findReplaceOpen}
      onToggleFindReplace={() => setFindReplaceOpen(v => !v)}
      focusMode={focusMode}
      onToggleFocusMode={handleToggleFocusMode}
      onToggleFullscreen={handleToggleFullscreen}
      projects={projects}
      currentProjectId={currentProjectId}
      onRefreshProjects={handleRefreshProjects}
      onNewProject={handleNewProject}
      onSaveProject={handleSaveProject}
      onSaveAsProject={handleSaveAsProject}
      onOpenProject={handleOpenProject}
      onImportDocx={handleImportDocx}
      onChangeTitle={t => mutate(prev => ({ ...prev, title: t }))}
      onChangeSubtitle={s => mutate(prev => ({ ...prev, subtitle: s }))}
      onChangeAuthor={a => mutate(prev => ({ ...prev, author: a }))}
      onChangePublisher={p => mutate(prev => ({ ...prev, publisher: p }))}
      onChangeIsbn={i => mutate(prev => ({ ...prev, isbn: i }))}
      onChangeDescription={d => mutate(prev => ({ ...prev, description: d }))}
      onChangeDate={d => mutate(prev => ({ ...prev, date: d }))}
      onChangeCover={handleChangeCover}
      onChangePublisherLogo={handleChangePublisherLogo}
      onChangeFont={handleChangeFont}
      onExport={handleExport}
      view={mobileView}
      onChangeView={setMobileView}
      appMode={isTablet}
      backButton={
        onExit ? (
          <button
            onClick={onExit}
            className="shrink-0 text-[14px] font-bold pr-1"
            style={{ color: "#4338ca" }}
          >
            ‹ 책장
          </button>
        ) : null
      }
    />
  );

  // ── 아이폰 앱: 한 번에 한 화면 + 하단 탭 바 ──
  if (isPhone) {
    const tabs = [
      { id: "chapters" as const, label: "챕터", icon: "☰" },
      { id: "editor" as const, label: "편집", icon: "✎" },
      { id: "preview" as const, label: "미리보기", icon: "▤" },
      { id: "book" as const, label: "책 정보", icon: "◫" },
    ];
    return (
      <div className="flex flex-col" style={{ ...shellStyle, paddingTop: "env(safe-area-inset-top)" }}>
        {findReplacePanel}
        {exportToast}

        {/* 상단 바: 제목 + 실행취소 + 내보내기 */}
        <header
          className="shrink-0 flex items-center gap-2 px-4"
          style={{ height: 52, borderBottom: "1px solid rgba(0,0,0,0.08)" }}
        >
          {onExit && (
            <button
              onClick={onExit}
              aria-label="책장으로"
              className="shrink-0 text-[15px] font-bold -ml-1 pr-0.5"
              style={{ color: "#4338ca" }}
            >
              ‹
            </button>
          )}
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-black truncate">{book.title || "제목 없는 책"}</div>
            <div className="text-[11px] truncate" style={{ color: "rgba(42,36,23,0.5)" }}>
              {activeChapter.title} · {activeChapterIndex + 1}/{book.chapters.length}장
            </div>
          </div>
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            aria-label="실행 취소"
            className="w-9 h-9 rounded-full text-base disabled:opacity-30"
            style={{ background: "rgba(0,0,0,0.05)" }}
          >
            ↩
          </button>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-3.5 rounded-full text-[13px] font-bold disabled:opacity-60"
            style={{ height: 36, background: "#2a2417", color: "#fff" }}
          >
            {exporting ? "만드는 중" : "내보내기"}
          </button>
        </header>

        {/* 본문: 탭에 따라 한 화면씩 */}
        <div className="flex-1 min-h-0">
          {phoneTab === "chapters" && (
            <ChapterRail
              chapters={book.chapters}
              activeChapterId={activeChapter.id}
              onSelect={id => { setActiveChapterId(id); setPhoneTab("editor"); }}
              onAddChapter={handleAddChapter}
              onRenameChapter={handleRenameChapter}
              onDeleteChapter={handleDeleteChapter}
              onMoveChapter={handleMoveChapter}
              onDuplicateChapter={handleDuplicateChapter}
              onMergeChapterWithNext={handleMergeChapterWithNext}
            />
          )}
          {phoneTab === "editor" && <div className="h-full">{editorPane}</div>}
          {phoneTab === "preview" && <div className="h-full">{previewPane}</div>}
          {phoneTab === "book" && (
            <PhoneBookPanel
              book={book}
              projects={projects}
              onChange={(patch) => mutate(prev => ({ ...prev, ...patch }))}
              onChangeCover={handleChangeCover}
              onChangeFont={handleChangeFont}
              onNewProject={handleNewProject}
              onSaveProject={handleSaveProject}
              onOpenProject={handleOpenProject}
              onRefreshProjects={handleRefreshProjects}
              onImportDocx={handleImportDocx}
              onToggleFindReplace={() => setFindReplaceOpen(v => !v)}
            />
          )}
        </div>

        {/* 하단 탭 바 */}
        <nav
          className="shrink-0 flex"
          style={{
            borderTop: "1px solid rgba(0,0,0,0.08)",
            background: "rgba(255,253,247,0.96)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {tabs.map(tab => {
            const active = phoneTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setPhoneTab(tab.id)}
                className="flex-1 flex flex-col items-center justify-center gap-0.5"
                style={{ height: 56, color: active ? "#4338ca" : "rgba(42,36,23,0.45)" }}
              >
                <span style={{ fontSize: 17, lineHeight: 1 }}>{tab.icon}</span>
                <span className="text-[10px] font-bold">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  // ── 아이패드 앱: 챕터 사이드바 + 편집 + 미리보기 ──
  if (isTablet) {
    return (
      <div className="flex flex-col" style={{ ...shellStyle, paddingTop: "env(safe-area-inset-top)" }}>
        {findReplacePanel}
        {exportToast}
        {metaBar}

        <div className="flex-1 min-h-0 flex" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
          {/* 챕터 사이드바 (접었다 폈다) */}
          <aside
            className="shrink-0 flex flex-col overflow-hidden border-r"
            style={{ width: railOpen ? 208 : 44, borderColor: "rgba(0,0,0,0.08)", transition: "width 160ms ease" }}
          >
            <button
              onClick={() => setRailOpen(v => !v)}
              aria-label={railOpen ? "챕터 목록 접기" : "챕터 목록 펼치기"}
              className="shrink-0 flex items-center justify-center text-base"
              style={{ height: 40, color: "rgba(42,36,23,0.55)" }}
            >
              {railOpen ? "‹" : "☰"}
            </button>
            {railOpen && (
              <div className="flex-1 min-h-0">
                <ChapterRail
                  chapters={book.chapters}
                  activeChapterId={activeChapter.id}
                  onSelect={setActiveChapterId}
                  onAddChapter={handleAddChapter}
                  onRenameChapter={handleRenameChapter}
                  onDeleteChapter={handleDeleteChapter}
                  onMoveChapter={handleMoveChapter}
                  onDuplicateChapter={handleDuplicateChapter}
                  onMergeChapterWithNext={handleMergeChapterWithNext}
                />
              </div>
            )}
          </aside>

          <div className="flex-1 min-w-0 overflow-hidden flex">{editorPane}</div>
          <div
            className="flex-1 min-w-0 overflow-hidden flex border-l"
            style={{ borderColor: "rgba(0,0,0,0.08)" }}
          >
            {previewPane}
          </div>
        </div>
      </div>
    );
  }

  // ── 데스크톱 웹: 좌우 분할 ──
  return (
    <div
      className="flex flex-col"
      style={shellStyle}
    >
      {findReplacePanel}
        {exportToast}
      {metaBar}

      <div className="flex-1 min-h-0 flex">
        {/* 아이패드에서는 두 화면을 항상 함께 보여준다(웹은 좁은 화면에서만 한쪽씩). */}
        <div
          className={
            isTablet
              ? "min-h-0 min-w-0 overflow-hidden flex w-1/2"
              : `min-h-0 min-w-0 overflow-hidden flex-1 sm:flex sm:w-1/2 ${mobileView === "editor" ? "flex" : "hidden"}`
          }
        >
          {editorPane}
        </div>

        <div
          className={
            isTablet
              ? "min-h-0 min-w-0 overflow-hidden flex w-1/2 border-l"
              : `min-h-0 min-w-0 overflow-hidden flex-1 sm:flex sm:w-1/2 border-l ${mobileView === "preview" ? "flex" : "hidden"}`
          }
          style={{ borderColor: "rgba(0,0,0,0.08)" }}
        >
          {previewPane}
        </div>
      </div>
    </div>
  );
}

/** 아이폰 앱의 "책 정보" 탭. 좁은 화면에 맞춰 꼭 필요한 것만 세로로 배치한다. */
function PhoneBookPanel({
  book, projects, onChange, onChangeCover, onChangeFont,
  onNewProject, onSaveProject, onOpenProject, onRefreshProjects, onImportDocx, onToggleFindReplace,
}: {
  book: Book;
  projects: ProjectMeta[];
  onChange: (patch: Partial<Book>) => void;
  onChangeCover: (file: File | null) => void;
  onChangeFont: (fontId: EpubFontId) => void;
  onNewProject: () => void;
  onSaveProject: () => void;
  onOpenProject: (id: string) => void;
  onRefreshProjects: () => void;
  onImportDocx: (file: File) => void;
  onToggleFindReplace: () => void;
}) {
  const coverInputRef = useRef<HTMLInputElement>(null);
  const docxInputRef = useRef<HTMLInputElement>(null);
  const [showOpen, setShowOpen] = useState(false);

  const fieldStyle: React.CSSProperties = {
    background: "#fffdf7",
    border: "1px solid rgba(0,0,0,0.1)",
    color: "#2a2417",
  };

  return (
    <div className="h-full overflow-y-auto scrollbar-none px-4 py-4 space-y-4">
      <section className="space-y-2.5">
        <PhoneLabel>책 정보</PhoneLabel>
        <input
          value={book.title}
          onChange={e => onChange({ title: e.target.value })}
          placeholder="책 제목"
          className="w-full rounded-xl px-4 py-3 text-[15px] font-bold outline-none"
          style={fieldStyle}
        />
        <input
          value={book.subtitle}
          onChange={e => onChange({ subtitle: e.target.value })}
          placeholder="부제 (없으면 비워두세요)"
          className="w-full rounded-xl px-4 py-3 text-[14px] outline-none"
          style={fieldStyle}
        />
        <input
          value={book.author}
          onChange={e => onChange({ author: e.target.value })}
          placeholder="지은이"
          className="w-full rounded-xl px-4 py-3 text-[14px] outline-none"
          style={fieldStyle}
        />
        <input
          value={book.publisher}
          onChange={e => onChange({ publisher: e.target.value })}
          placeholder="출판사"
          className="w-full rounded-xl px-4 py-3 text-[14px] outline-none"
          style={fieldStyle}
        />
      </section>

      <section className="space-y-2">
        <PhoneLabel>표지</PhoneLabel>
        <div className="flex items-center gap-3">
          {book.coverImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.coverImage} alt="표지" className="rounded-lg object-cover" style={{ width: 54, height: 76 }} />
          ) : (
            <div
              className="rounded-lg flex items-center justify-center text-[10px]"
              style={{ width: 54, height: 76, background: "rgba(0,0,0,0.05)", color: "rgba(42,36,23,0.4)" }}
            >
              없음
            </div>
          )}
          <div className="flex-1 flex gap-2">
            <button
              onClick={() => coverInputRef.current?.click()}
              className="flex-1 rounded-xl py-3 text-[13px] font-bold"
              style={fieldStyle}
            >
              사진 고르기
            </button>
            {book.coverImage && (
              <button
                onClick={() => onChangeCover(null)}
                className="px-4 rounded-xl text-[13px] font-bold"
                style={{ ...fieldStyle, color: "#b91c1c" }}
              >
                삭제
              </button>
            )}
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            hidden
            onChange={e => onChangeCover(e.target.files?.[0] ?? null)}
          />
        </div>
      </section>

      <section className="space-y-2">
        <PhoneLabel>글꼴</PhoneLabel>
        <div className="grid grid-cols-2 gap-2">
          {EPUB_FONTS.map(font => {
            const active = book.fontId === font.id;
            return (
              <button
                key={font.id}
                onClick={() => onChangeFont(font.id)}
                className="rounded-xl py-3 px-3 text-[13px] font-bold text-left"
                style={{
                  ...fieldStyle,
                  background: active ? "rgba(79,70,229,0.1)" : "#fffdf7",
                  borderColor: active ? "rgba(79,70,229,0.4)" : "rgba(0,0,0,0.1)",
                  color: active ? "#4338ca" : "#2a2417",
                }}
              >
                {font.label}
              </button>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <PhoneLabel>파일</PhoneLabel>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onSaveProject} className="rounded-xl py-3 text-[13px] font-bold" style={fieldStyle}>
            저장하기
          </button>
          <button
            onClick={() => { onRefreshProjects(); setShowOpen(v => !v); }}
            className="rounded-xl py-3 text-[13px] font-bold"
            style={fieldStyle}
          >
            불러오기
          </button>
          <button onClick={onNewProject} className="rounded-xl py-3 text-[13px] font-bold" style={fieldStyle}>
            새 책 만들기
          </button>
          <button
            onClick={() => docxInputRef.current?.click()}
            className="rounded-xl py-3 text-[13px] font-bold"
            style={fieldStyle}
          >
            Word 가져오기
          </button>
          <button onClick={onToggleFindReplace} className="rounded-xl py-3 text-[13px] font-bold col-span-2" style={fieldStyle}>
            찾아 바꾸기
          </button>
          <input
            ref={docxInputRef}
            type="file"
            accept=".docx"
            hidden
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) onImportDocx(file);
              e.target.value = "";
            }}
          />
        </div>

        {showOpen && (
          <div className="space-y-1.5 pt-1">
            {projects.length === 0 ? (
              <p className="text-[12px] px-1" style={{ color: "rgba(42,36,23,0.5)" }}>저장된 책이 없어요.</p>
            ) : (
              projects.map(p => (
                <button
                  key={p.id}
                  onClick={() => { onOpenProject(p.id); setShowOpen(false); }}
                  className="w-full rounded-xl px-4 py-3 text-left text-[13px] font-bold"
                  style={fieldStyle}
                >
                  {p.name || "제목 없는 책"}
                </button>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function PhoneLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[11px] font-black px-1" style={{ color: "rgba(42,36,23,0.45)" }}>
      {children}
    </div>
  );
}

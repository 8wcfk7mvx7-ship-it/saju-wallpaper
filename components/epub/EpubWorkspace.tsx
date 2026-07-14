"use client";
import { useEffect, useRef, useState } from "react";
import {
  createBook, createChapter, createParagraphBlock, createTextBoxBlock, normalizeBook,
  type Block, type Book, type Note,
} from "@/lib/epub/types";
import { imageBlocksFromFiles } from "@/lib/epub/blocks";
import { extractNoteRefIds, stripNoteToken } from "@/lib/epub/notes";
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

export default function EpubWorkspace() {
  const [book, setBook] = useState<Book>(() => createBook());
  const [activeChapterId, setActiveChapterId] = useState(book.chapters[0].id);
  const [mobileView, setMobileView] = useState<"editor" | "preview">("editor");
  const [exporting, setExporting] = useState(false);
  const [ready, setReady] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setBook(prev => ({
      ...prev,
      chapters: prev.chapters.map(c => (c.id === chapterId ? updater(c) : c)),
    }));
  }

  function handleAddChapter() {
    const chapter = createChapter(`${book.chapters.length + 1}장`);
    setBook(prev => ({ ...prev, chapters: [...prev.chapters, chapter] }));
    setActiveChapterId(chapter.id);
  }

  function handleRenameChapter(id: string, title: string) {
    updateChapter(id, c => ({ ...c, title }));
  }

  function handleDeleteChapter(id: string) {
    setBook(prev => {
      const chapters = prev.chapters.filter(c => c.id !== id);
      if (chapters.length === 0) return prev;
      if (id === activeChapterId) setActiveChapterId(chapters[0].id);
      return { ...prev, chapters };
    });
  }

  function handleMoveChapter(id: string, direction: -1 | 1) {
    setBook(prev => {
      const idx = prev.chapters.findIndex(c => c.id === id);
      const target = idx + direction;
      if (target < 0 || target >= prev.chapters.length) return prev;
      const chapters = [...prev.chapters];
      [chapters[idx], chapters[target]] = [chapters[target], chapters[idx]];
      return { ...prev, chapters };
    });
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

  function handleAddParagraph() {
    updateChapter(activeChapter.id, c => ({ ...c, blocks: [...c.blocks, createParagraphBlock("")] }));
  }

  function handleAddTextBox() {
    updateChapter(activeChapter.id, c => ({ ...c, blocks: [...c.blocks, createTextBoxBlock("")] }));
  }

  async function handleAddImages(files: FileList | File[]) {
    const blocks = await imageBlocksFromFiles(files);
    if (blocks.length === 0) return;
    updateChapter(activeChapter.id, c => ({ ...c, blocks: [...c.blocks, ...blocks] }));
  }

  function handleSplitAt(blockId: string) {
    setBook(prev => {
      const chapterIdx = prev.chapters.findIndex(c => c.id === activeChapter.id);
      const chapter = prev.chapters[chapterIdx];
      const blockIdx = chapter.blocks.findIndex(b => b.id === blockId);
      if (blockIdx < 0 || blockIdx >= chapter.blocks.length - 1) return prev;

      const keep = chapter.blocks.slice(0, blockIdx + 1);
      const moved = chapter.blocks.slice(blockIdx + 1);

      // 각주/미주는 실제로 참조되는 쪽 챕터를 따라간다. 양쪽에서 참조되면(드묾) 둘 다에 남긴다.
      const referencedIn = (blocks: Block[]) => {
        const ids = new Set<string>();
        for (const b of blocks) {
          if (b.type !== "paragraph" && b.type !== "textbox") continue;
          for (const id of extractNoteRefIds(b.text)) ids.add(id);
        }
        return ids;
      };
      const keepIds = referencedIn(keep);
      const movedIds = referencedIn(moved);
      const keepNotes = chapter.notes.filter(n => keepIds.has(n.id) || !movedIds.has(n.id));
      const movedNotes = chapter.notes.filter(n => movedIds.has(n.id));

      const newChapter = { ...createChapter(`${chapter.title} (계속)`), blocks: moved, notes: movedNotes };

      const chapters = [...prev.chapters];
      chapters[chapterIdx] = { ...chapter, blocks: keep, notes: keepNotes };
      chapters.splice(chapterIdx + 1, 0, newChapter);
      return { ...prev, chapters };
    });
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
      blocks: c.blocks.map(b =>
        b.type === "paragraph" || b.type === "textbox" ? { ...b, text: stripNoteToken(b.text, noteId) } : b
      ),
    }));
  }

  async function handleChangeCover(file: File | null) {
    if (!file) return;
    const dataUrl = await readFileAsDataUrl(file);
    setBook(prev => ({ ...prev, coverImage: dataUrl }));
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
    <div className="flex flex-col" style={{ height: "100dvh" }}>
      <BookMetaBar
        title={book.title}
        author={book.author}
        coverImage={book.coverImage}
        exporting={exporting}
        onChangeTitle={t => setBook(prev => ({ ...prev, title: t }))}
        onChangeAuthor={a => setBook(prev => ({ ...prev, author: a }))}
        onChangeCover={handleChangeCover}
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
            onChangeBlock={handleChangeBlock}
            onDeleteBlock={handleDeleteBlock}
            onMoveBlock={handleMoveBlock}
            onSplitAt={handleSplitAt}
            onAddParagraph={handleAddParagraph}
            onAddTextBox={handleAddTextBox}
            onAddImages={handleAddImages}
            onAddNote={handleAddNote}
            onChangeNote={handleChangeNote}
            onDeleteNote={handleDeleteNote}
          />
        </div>

        <div
          className={`min-h-0 flex-1 sm:flex sm:w-1/2 border-l ${mobileView === "preview" ? "flex" : "hidden"}`}
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <PreviewPane
            chapter={activeChapter}
            chapterIndex={activeChapterIndex}
            chapterCount={book.chapters.length}
            fontSize={book.previewFontSize}
            onFontSizeChange={size => setBook(prev => ({ ...prev, previewFontSize: size }))}
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

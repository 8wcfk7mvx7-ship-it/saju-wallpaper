"use client";
import { useState } from "react";
import type { Block, Chapter, FrontMatterKind, Note, NoteKind } from "@/lib/epub/types";
import type { InlineStyle } from "@/lib/epub/richtext";
import ChapterRail from "./ChapterRail";
import BlockView from "./BlockView";
import NotesPanel from "./NotesPanel";
import Ribbon from "./Ribbon";

interface Props {
  focusMode: boolean;
  chapters: Chapter[];
  activeChapter: Chapter;
  onSelectChapter: (id: string) => void;
  onAddChapter: () => void;
  onRenameChapter: (id: string, title: string) => void;
  onDeleteChapter: (id: string) => void;
  onMoveChapter: (id: string, direction: -1 | 1) => void;
  onDuplicateChapter: (id: string) => void;
  onChangeBlock: (blockId: string, block: Block) => void;
  onDeleteBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: -1 | 1) => void;
  onReorderBlock: (draggedId: string, targetId: string) => void;
  onDuplicateBlock: (blockId: string) => void;
  onSplitAt: (blockId: string) => void;
  onAddParagraph: () => void;
  onAddTextBox: () => void;
  onAddImages: (files: FileList | File[]) => void;
  onAddCopyright: () => void;
  onAddQuote: () => void;
  onAddSceneBreak: () => void;
  onAddPoem: () => void;
  onAddHeading: () => void;
  onAddPageBreak: () => void;
  onAddList: (ordered: boolean) => void;
  onAddFrontMatter: (kind: FrontMatterKind) => void;
  onToggleDropCap: () => void;
  onAddNote: (note: Note) => void;
  onChangeNote: (noteId: string, text: string) => void;
  onDeleteNote: (noteId: string) => void;
  onSetBookTitle: (blockId: string, start: number, end: number) => void;
  onSetBookSubtitle: (blockId: string, start: number, end: number) => void;
  onSplitAsChapter: (blockId: string, start: number, end: number) => void;
  onConvertSelectionToNote: (blockId: string, start: number, end: number, kind: NoteKind) => void;
  onApplyInlineStyle: (blockId: string, start: number, end: number, style: InlineStyle) => void;
}

export default function EditorPane(props: Props) {
  const {
    focusMode,
    chapters, activeChapter, onSelectChapter, onAddChapter, onRenameChapter, onDeleteChapter, onMoveChapter, onDuplicateChapter,
    onChangeBlock, onDeleteBlock, onMoveBlock, onReorderBlock, onDuplicateBlock, onSplitAt,
    onAddParagraph, onAddTextBox, onAddImages, onAddCopyright,
    onAddQuote, onAddSceneBreak, onAddPoem, onAddHeading, onAddPageBreak, onAddList, onAddFrontMatter, onToggleDropCap,
    onAddNote, onChangeNote, onDeleteNote,
    onSetBookTitle, onSetBookSubtitle, onSplitAsChapter, onConvertSelectionToNote, onApplyInlineStyle,
  } = props;
  const [dragOver, setDragOver] = useState(false);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);

  return (
    <div className="flex h-full min-h-0">
      <div className="w-40 sm:w-48 shrink-0 border-r" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
        <ChapterRail
          chapters={chapters}
          activeChapterId={activeChapter.id}
          onSelect={onSelectChapter}
          onAddChapter={onAddChapter}
          onRenameChapter={onRenameChapter}
          onDeleteChapter={onDeleteChapter}
          onMoveChapter={onMoveChapter}
          onDuplicateChapter={onDuplicateChapter}
        />
        <label
          className="flex items-center gap-1.5 text-[11px] px-3 py-2 border-t"
          style={{ color: "rgba(42,36,23,0.55)", borderColor: "rgba(0,0,0,0.08)" }}
        >
          <input type="checkbox" checked={activeChapter.dropCap} onChange={onToggleDropCap} />
          이 챕터 첫 글자 크게
        </label>
      </div>

      <div
        className="flex-1 min-w-0 flex flex-col"
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length) onAddImages(e.dataTransfer.files);
        }}
      >
        {!focusMode && (
          <Ribbon
            onAddParagraph={onAddParagraph}
            onAddHeading={onAddHeading}
            onAddTextBox={onAddTextBox}
            onAddQuote={onAddQuote}
            onAddPoem={onAddPoem}
            onAddSceneBreak={onAddSceneBreak}
            onAddPageBreak={onAddPageBreak}
            onAddList={onAddList}
            onAddImages={onAddImages}
            onAddCopyright={onAddCopyright}
            onAddFrontMatter={onAddFrontMatter}
          />
        )}
        <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-3 sm:px-4 py-3 space-y-3 relative">
          {dragOver && (
            <div
              className="absolute inset-2 rounded-2xl flex items-center justify-center text-sm font-bold pointer-events-none z-10"
              style={{ background: "rgba(37,99,235,0.08)", border: "2px dashed rgba(37,99,235,0.4)", color: "#1d4ed8" }}
            >
              여기에 이미지를 놓으세요
            </div>
          )}
          {activeChapter.blocks.map((block, i) => (
            <div
              key={block.id}
              className="flex items-start gap-1.5"
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                if (draggedBlockId && draggedBlockId !== block.id) onReorderBlock(draggedBlockId, block.id);
                setDraggedBlockId(null);
              }}
              style={{ opacity: draggedBlockId === block.id ? 0.4 : 1 }}
            >
              <span
                draggable
                onDragStart={e => { setDraggedBlockId(block.id); e.dataTransfer.effectAllowed = "move"; }}
                onDragEnd={() => setDraggedBlockId(null)}
                className="shrink-0 pt-3 text-sm cursor-grab select-none"
                style={{ color: "rgba(42,36,23,0.25)" }}
                title="드래그해서 순서 바꾸기"
              >
                ⠿
              </span>
              <div className="flex-1 min-w-0">
                <BlockView
                  block={block}
                  isFirst={i === 0}
                  isLast={i === activeChapter.blocks.length - 1}
                  onChange={b => onChangeBlock(block.id, b)}
                  onDelete={() => onDeleteBlock(block.id)}
                  onMove={dir => onMoveBlock(block.id, dir)}
                  onDuplicate={() => onDuplicateBlock(block.id)}
                  onSplitHere={() => onSplitAt(block.id)}
                  onAddNote={onAddNote}
                  onSetBookTitle={onSetBookTitle}
                  onSetBookSubtitle={onSetBookSubtitle}
                  onSplitAsChapter={onSplitAsChapter}
                  onConvertSelectionToNote={onConvertSelectionToNote}
                  onApplyInlineStyle={onApplyInlineStyle}
                />
              </div>
            </div>
          ))}
        </div>

        <NotesPanel chapter={activeChapter} onChangeNote={onChangeNote} onDeleteNote={onDeleteNote} />
      </div>
    </div>
  );
}

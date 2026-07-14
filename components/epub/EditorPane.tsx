"use client";
import { useRef, useState } from "react";
import type { Block, Chapter, FrontMatterKind, Note, NoteKind } from "@/lib/epub/types";
import { frontMatterLabel } from "@/lib/epub/types";
import type { InlineStyle } from "@/lib/epub/richtext";
import ChapterRail from "./ChapterRail";
import BlockView from "./BlockView";
import NotesPanel from "./NotesPanel";

interface Props {
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

const FRONT_MATTER_KINDS: FrontMatterKind[] = ["dedication", "epigraph", "foreword", "afterword"];

const addBtnStyle = { background: "rgba(0,0,0,0.045)", color: "rgba(42,36,23,0.7)" };

export default function EditorPane(props: Props) {
  const {
    chapters, activeChapter, onSelectChapter, onAddChapter, onRenameChapter, onDeleteChapter, onMoveChapter, onDuplicateChapter,
    onChangeBlock, onDeleteBlock, onMoveBlock, onReorderBlock, onDuplicateBlock, onSplitAt,
    onAddParagraph, onAddTextBox, onAddImages, onAddCopyright,
    onAddQuote, onAddSceneBreak, onAddPoem, onAddHeading, onAddPageBreak, onAddList, onAddFrontMatter, onToggleDropCap,
    onAddNote, onChangeNote, onDeleteNote,
    onSetBookTitle, onSetBookSubtitle, onSplitAsChapter, onConvertSelectionToNote, onApplyInlineStyle,
  } = props;
  const [dragOver, setDragOver] = useState(false);
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        <div
          className="shrink-0 flex flex-wrap items-center gap-1.5 px-3 sm:px-4 py-2.5 border-t"
          style={{ borderColor: "rgba(0,0,0,0.08)" }}
        >
          <button onClick={onAddParagraph} className="text-xs font-bold px-3 py-1.5 rounded-full" style={addBtnStyle}>+ 문단</button>
          <button onClick={onAddHeading} className="text-xs font-bold px-3 py-1.5 rounded-full" style={addBtnStyle}>+ 소제목</button>
          <button
            onClick={onAddTextBox}
            className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(109,40,217,0.1)", color: "#6d28d9" }}
          >
            + 텍스트 박스
          </button>
          <button onClick={onAddQuote} className="text-xs font-bold px-3 py-1.5 rounded-full" style={addBtnStyle}>+ 인용구</button>
          <button onClick={onAddPoem} className="text-xs font-bold px-3 py-1.5 rounded-full" style={addBtnStyle}>+ 시</button>
          <button onClick={onAddSceneBreak} className="text-xs font-bold px-3 py-1.5 rounded-full" style={addBtnStyle}>+ 장면 구분선</button>
          <button onClick={onAddPageBreak} className="text-xs font-bold px-3 py-1.5 rounded-full" style={addBtnStyle}>+ 페이지 나눔</button>
          <button onClick={() => onAddList(false)} className="text-xs font-bold px-3 py-1.5 rounded-full" style={addBtnStyle}>+ 글머리 목록</button>
          <button onClick={() => onAddList(true)} className="text-xs font-bold px-3 py-1.5 rounded-full" style={addBtnStyle}>+ 번호 목록</button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(37,99,235,0.1)", color: "#1d4ed8" }}
          >
            + 이미지
          </button>
          <button
            onClick={onAddCopyright}
            className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(146,114,14,0.12)", color: "#92720e" }}
          >
            + 저작권 페이지
          </button>
          <select
            value=""
            onChange={e => {
              if (e.target.value) onAddFrontMatter(e.target.value as FrontMatterKind);
              e.target.value = "";
            }}
            className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(146,114,14,0.12)", color: "#92720e" }}
          >
            <option value="">+ 특수 페이지...</option>
            {FRONT_MATTER_KINDS.map(k => (
              <option key={k} value={k}>{frontMatterLabel(k)}</option>
            ))}
          </select>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={e => {
              if (e.target.files?.length) onAddImages(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      </div>
    </div>
  );
}

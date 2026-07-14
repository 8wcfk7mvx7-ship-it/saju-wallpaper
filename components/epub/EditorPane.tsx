"use client";
import { useRef, useState } from "react";
import type { Block, Chapter } from "@/lib/epub/types";
import ChapterRail from "./ChapterRail";
import BlockView from "./BlockView";

interface Props {
  chapters: Chapter[];
  activeChapter: Chapter;
  onSelectChapter: (id: string) => void;
  onAddChapter: () => void;
  onRenameChapter: (id: string, title: string) => void;
  onDeleteChapter: (id: string) => void;
  onMoveChapter: (id: string, direction: -1 | 1) => void;
  onChangeBlock: (blockId: string, block: Block) => void;
  onDeleteBlock: (blockId: string) => void;
  onMoveBlock: (blockId: string, direction: -1 | 1) => void;
  onSplitAt: (blockId: string) => void;
  onAddParagraph: () => void;
  onAddTextBox: () => void;
  onAddImages: (files: FileList | File[]) => void;
}

export default function EditorPane(props: Props) {
  const {
    chapters, activeChapter, onSelectChapter, onAddChapter, onRenameChapter, onDeleteChapter, onMoveChapter,
    onChangeBlock, onDeleteBlock, onMoveBlock, onSplitAt, onAddParagraph, onAddTextBox, onAddImages,
  } = props;
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex h-full min-h-0">
      <div className="w-40 sm:w-48 shrink-0 border-r" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
        <ChapterRail
          chapters={chapters}
          activeChapterId={activeChapter.id}
          onSelect={onSelectChapter}
          onAddChapter={onAddChapter}
          onRenameChapter={onRenameChapter}
          onDeleteChapter={onDeleteChapter}
          onMoveChapter={onMoveChapter}
        />
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
              style={{ background: "rgba(96,165,250,0.12)", border: "2px dashed rgba(96,165,250,0.5)", color: "#93c5fd" }}
            >
              여기에 이미지를 놓으세요
            </div>
          )}
          {activeChapter.blocks.map((block, i) => (
            <BlockView
              key={block.id}
              block={block}
              isFirst={i === 0}
              isLast={i === activeChapter.blocks.length - 1}
              onChange={b => onChangeBlock(block.id, b)}
              onDelete={() => onDeleteBlock(block.id)}
              onMove={dir => onMoveBlock(block.id, dir)}
              onSplitHere={() => onSplitAt(block.id)}
            />
          ))}
        </div>

        <div
          className="shrink-0 flex items-center gap-2 px-3 sm:px-4 py-2.5 border-t"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <button
            onClick={onAddParagraph}
            className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)" }}
          >
            + 문단
          </button>
          <button
            onClick={onAddTextBox}
            className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(167,139,250,0.12)", color: "#c4b5fd" }}
          >
            + 텍스트 박스
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-xs font-bold px-3 py-1.5 rounded-full"
            style={{ background: "rgba(96,165,250,0.12)", color: "#93c5fd" }}
          >
            + 이미지
          </button>
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

"use client";
import type { Chapter } from "@/lib/epub/types";

interface Props {
  chapters: Chapter[];
  activeChapterId: string;
  onSelect: (id: string) => void;
  onAddChapter: () => void;
  onRenameChapter: (id: string, title: string) => void;
  onDeleteChapter: (id: string) => void;
  onMoveChapter: (id: string, direction: -1 | 1) => void;
  onDuplicateChapter: (id: string) => void;
}

export default function ChapterRail({
  chapters,
  activeChapterId,
  onSelect,
  onAddChapter,
  onRenameChapter,
  onDeleteChapter,
  onMoveChapter,
  onDuplicateChapter,
}: Props) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-3 py-2">
        <span className="text-xs font-bold" style={{ color: "rgba(42,36,23,0.45)" }}>
          챕터 {chapters.length}개
        </span>
        <button
          onClick={onAddChapter}
          className="text-xs font-bold px-2.5 py-1 rounded-lg"
          style={{ background: "rgba(79,70,229,0.1)", color: "#4338ca", border: "1px solid rgba(79,70,229,0.25)" }}
        >
          + 새 챕터
        </button>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-none px-2 pb-2 space-y-1">
        {chapters.map((chapter, i) => {
          const active = chapter.id === activeChapterId;
          return (
            <div
              key={chapter.id}
              onClick={() => onSelect(chapter.id)}
              className="group rounded-xl px-2.5 py-2 cursor-pointer transition-all"
              style={{
                background: active ? "rgba(79,70,229,0.1)" : "transparent",
                border: active ? "1px solid rgba(79,70,229,0.3)" : "1px solid transparent",
              }}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] shrink-0" style={{ color: "rgba(42,36,23,0.35)" }}>
                  {i + 1}
                </span>
                <input
                  value={chapter.title}
                  onChange={e => onRenameChapter(chapter.id, e.target.value)}
                  onClick={e => e.stopPropagation()}
                  className="flex-1 min-w-0 bg-transparent text-sm font-semibold outline-none"
                  style={{ color: active ? "#2a2417" : "rgba(42,36,23,0.65)" }}
                />
              </div>
              <div className="mt-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={e => { e.stopPropagation(); onMoveChapter(chapter.id, -1); }}
                  disabled={i === 0}
                  className="text-[11px] px-1.5 py-0.5 rounded disabled:opacity-30"
                  style={{ color: "rgba(42,36,23,0.5)" }}
                  aria-label="위로 이동"
                >
                  ▲
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onMoveChapter(chapter.id, 1); }}
                  disabled={i === chapters.length - 1}
                  className="text-[11px] px-1.5 py-0.5 rounded disabled:opacity-30"
                  style={{ color: "rgba(42,36,23,0.5)" }}
                  aria-label="아래로 이동"
                >
                  ▼
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onDuplicateChapter(chapter.id); }}
                  className="text-[11px] px-1.5 py-0.5 rounded"
                  style={{ color: "rgba(42,36,23,0.5)" }}
                >
                  복제
                </button>
                {chapters.length > 1 && (
                  <button
                    onClick={e => { e.stopPropagation(); onDeleteChapter(chapter.id); }}
                    className="text-[11px] px-1.5 py-0.5 rounded ml-auto"
                    style={{ color: "rgba(185,28,28,0.75)" }}
                  >
                    삭제
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

"use client";
import { useEffect, useRef, type CSSProperties } from "react";
import { createNote, type Block, type Note, type NoteKind } from "@/lib/epub/types";
import { insertNoteToken } from "@/lib/epub/notes";

interface Props {
  block: Block;
  isFirst: boolean;
  isLast: boolean;
  onChange: (block: Block) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  onSplitHere: () => void;
  onAddNote: (note: Note) => void;
}

const btnStyle: CSSProperties = {
  color: "rgba(255,255,255,0.45)",
  background: "rgba(255,255,255,0.05)",
};

export default function BlockView({ block, isFirst, isLast, onChange, onDelete, onMove, onSplitHere, onAddNote }: Props) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const pendingCursor = useRef<number | null>(null);

  useEffect(() => {
    if (pendingCursor.current !== null && textAreaRef.current) {
      const pos = pendingCursor.current;
      textAreaRef.current.focus();
      textAreaRef.current.setSelectionRange(pos, pos);
      pendingCursor.current = null;
    }
  }, [block]);

  function insertNote(kind: NoteKind) {
    if (block.type !== "paragraph" && block.type !== "textbox") return;
    const cursor = textAreaRef.current?.selectionStart ?? block.text.length;
    const note = createNote(kind);
    const { text, cursor: newCursor } = insertNoteToken(block.text, cursor, note.id);
    onAddNote(note);
    pendingCursor.current = newCursor;
    onChange({ ...block, text });
  }

  return (
    <div className="group relative rounded-xl px-3 py-2.5" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
      {block.type === "paragraph" && (
        <textarea
          ref={textAreaRef}
          value={block.text}
          onChange={e => onChange({ ...block, text: e.target.value })}
          placeholder="이어서 써보세요..."
          rows={Math.max(3, block.text.split("\n").length)}
          className="w-full bg-transparent outline-none resize-none text-[15px] leading-[1.8]"
          style={{ color: "rgba(255,255,255,0.9)" }}
        />
      )}

      {block.type === "textbox" && (
        <div
          className="rounded-lg p-3"
          style={{ background: "rgba(167,139,250,0.06)", border: "1px dashed rgba(167,139,250,0.35)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(167,139,250,0.2)", color: "#c4b5fd" }}>
              텍스트 박스
            </span>
            <input
              value={block.label}
              onChange={e => onChange({ ...block, label: e.target.value })}
              placeholder="라벨 (예: 편지, 메모)"
              className="flex-1 min-w-0 bg-transparent outline-none text-xs font-semibold"
              style={{ color: "rgba(255,255,255,0.7)" }}
            />
          </div>
          <textarea
            ref={textAreaRef}
            value={block.text}
            onChange={e => onChange({ ...block, text: e.target.value })}
            placeholder="박스 안에 들어갈 내용을 써보세요..."
            rows={Math.max(3, block.text.split("\n").length)}
            className="w-full bg-transparent outline-none resize-none text-sm leading-[1.7]"
            style={{ color: "rgba(255,255,255,0.85)" }}
          />
        </div>
      )}

      {block.type === "copyright" && (
        <div
          className="rounded-lg p-3 space-y-2"
          style={{ background: "rgba(245,197,24,0.05)", border: "1px dashed rgba(245,197,24,0.3)" }}
        >
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded inline-block" style={{ background: "rgba(245,197,24,0.2)", color: "#e8c964" }}>
            저작권(판권) 페이지
          </span>
          <input
            value={block.title}
            onChange={e => onChange({ ...block, title: e.target.value })}
            placeholder="책 제목"
            className="w-full bg-transparent outline-none text-sm font-bold"
            style={{ color: "rgba(255,255,255,0.9)" }}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={block.author}
              onChange={e => onChange({ ...block, author: e.target.value })}
              placeholder="지은이"
              className="w-full bg-transparent outline-none text-xs"
              style={{ color: "rgba(255,255,255,0.75)" }}
            />
            <input
              value={block.date}
              onChange={e => onChange({ ...block, date: e.target.value })}
              placeholder="발행일 (자유 형식)"
              className="w-full bg-transparent outline-none text-xs"
              style={{ color: "rgba(255,255,255,0.75)" }}
            />
          </div>
          <input
            value={block.publisher}
            onChange={e => onChange({ ...block, publisher: e.target.value })}
            placeholder="출판사(선택)"
            className="w-full bg-transparent outline-none text-xs"
            style={{ color: "rgba(255,255,255,0.75)" }}
          />
          <textarea
            value={block.body}
            onChange={e => onChange({ ...block, body: e.target.value })}
            placeholder="저작권 문구 등 원하는 내용을 직접 입력하세요. (예: ⓒ 2026 홍길동. All rights reserved.)"
            rows={Math.max(3, block.body.split("\n").length)}
            className="w-full bg-transparent outline-none resize-none text-xs leading-[1.7]"
            style={{ color: "rgba(255,255,255,0.75)" }}
          />
          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-1.5 text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
              <input type="checkbox" checked={block.showCover} onChange={e => onChange({ ...block, showCover: e.target.checked })} />
              표지 이미지 포함
            </label>
            <label className="flex items-center gap-1.5 text-[11px]" style={{ color: "rgba(255,255,255,0.5)" }}>
              <input type="checkbox" checked={block.showPublisherLogo} onChange={e => onChange({ ...block, showPublisherLogo: e.target.checked })} />
              출판사 로고 포함
            </label>
          </div>
        </div>
      )}

      {block.type === "image" && (
        <div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.src} alt={block.alt} className="max-w-full rounded-lg mb-2" style={{ maxHeight: 240 }} />
          <input
            value={block.alt}
            onChange={e => onChange({ ...block, alt: e.target.value })}
            placeholder="대체 텍스트(alt)"
            className="w-full bg-transparent outline-none text-xs mb-1"
            style={{ color: "rgba(255,255,255,0.6)" }}
          />
          <input
            value={block.caption}
            onChange={e => onChange({ ...block, caption: e.target.value })}
            placeholder="캡션(선택)"
            className="w-full bg-transparent outline-none text-xs"
            style={{ color: "rgba(255,255,255,0.6)" }}
          />
        </div>
      )}

      <div className="mt-2 flex items-center gap-1 flex-wrap opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onMove(-1)} disabled={isFirst} className="text-[11px] px-1.5 py-0.5 rounded disabled:opacity-30" style={btnStyle}>▲</button>
        <button onClick={() => onMove(1)} disabled={isLast} className="text-[11px] px-1.5 py-0.5 rounded disabled:opacity-30" style={btnStyle}>▼</button>
        <button onClick={onDelete} className="text-[11px] px-1.5 py-0.5 rounded" style={{ ...btnStyle, color: "rgba(248,113,113,0.7)" }}>삭제</button>
        {(block.type === "paragraph" || block.type === "textbox") && (
          <>
            <button
              onClick={() => insertNote("footnote")}
              className="text-[11px] px-2 py-0.5 rounded font-semibold"
              style={{ background: "rgba(245,197,24,0.12)", color: "#e8c964" }}
            >
              + 각주
            </button>
            <button
              onClick={() => insertNote("endnote")}
              className="text-[11px] px-2 py-0.5 rounded font-semibold"
              style={{ background: "rgba(245,197,24,0.12)", color: "#e8c964" }}
            >
              + 미주
            </button>
          </>
        )}
        {!isLast && (
          <button
            onClick={onSplitHere}
            className="text-[11px] px-2 py-0.5 rounded ml-auto font-semibold"
            style={{ background: "rgba(96,165,250,0.15)", color: "#93c5fd" }}
          >
            ✂ 여기서 챕터 나누기
          </button>
        )}
      </div>
    </div>
  );
}

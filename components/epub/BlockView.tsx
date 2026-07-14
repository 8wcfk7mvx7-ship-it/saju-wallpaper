"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createNote, hasText, type Align, type Block, type FrontMatterKind, type Note, type NoteKind } from "@/lib/epub/types";
import { frontMatterLabel } from "@/lib/epub/types";
import { insertNoteToken } from "@/lib/epub/notes";
import type { InlineStyle } from "@/lib/epub/richtext";
import SelectionMenu from "./SelectionMenu";

interface Props {
  block: Block;
  isFirst: boolean;
  isLast: boolean;
  onChange: (block: Block) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  onSplitHere: () => void;
  onAddNote: (note: Note) => void;
  onSetBookTitle: (blockId: string, start: number, end: number) => void;
  onSetBookSubtitle: (blockId: string, start: number, end: number) => void;
  onSplitAsChapter: (blockId: string, start: number, end: number) => void;
  onConvertSelectionToNote: (blockId: string, start: number, end: number, kind: NoteKind) => void;
  onApplyInlineStyle: (blockId: string, start: number, end: number, style: InlineStyle) => void;
}

interface SelectionState {
  x: number;
  y: number;
  start: number;
  end: number;
}

const btnStyle: CSSProperties = {
  color: "rgba(255,255,255,0.45)",
  background: "rgba(255,255,255,0.05)",
};

const ALIGN_OPTIONS: { value: Align; label: string }[] = [
  { value: "left", label: "왼쪽" },
  { value: "center", label: "가운데" },
  { value: "right", label: "오른쪽" },
  { value: "justify", label: "양쪽" },
];

function AlignButtons({ align, onChange }: { align: Align; onChange: (a: Align) => void }) {
  return (
    <div className="flex items-center gap-1 mb-1.5">
      {ALIGN_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
          style={{
            background: align === opt.value ? "rgba(96,165,250,0.25)" : "rgba(255,255,255,0.05)",
            color: align === opt.value ? "#93c5fd" : "rgba(255,255,255,0.4)",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const FRONT_MATTER_KINDS: FrontMatterKind[] = ["dedication", "epigraph", "foreword", "afterword"];

export default function BlockView({
  block, isFirst, isLast, onChange, onDelete, onMove, onSplitHere, onAddNote,
  onSetBookTitle, onSetBookSubtitle, onSplitAsChapter, onConvertSelectionToNote, onApplyInlineStyle,
}: Props) {
  const textAreaRef = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);
  const setTextAreaRef = (el: HTMLTextAreaElement | HTMLInputElement | null) => {
    textAreaRef.current = el;
  };
  const pendingCursor = useRef<number | null>(null);
  const [selection, setSelection] = useState<SelectionState | null>(null);

  useEffect(() => {
    if (pendingCursor.current !== null && textAreaRef.current) {
      const pos = pendingCursor.current;
      textAreaRef.current.focus();
      textAreaRef.current.setSelectionRange(pos, pos);
      pendingCursor.current = null;
    }
  }, [block]);

  function insertNote(kind: NoteKind) {
    if (!hasText(block)) return;
    const cursor = textAreaRef.current?.selectionStart ?? block.text.length;
    const note = createNote(kind);
    const { text, cursor: newCursor } = insertNoteToken(block.text, cursor, note.id);
    onAddNote(note);
    pendingCursor.current = newCursor;
    onChange({ ...block, text });
  }

  function handleContextMenu(e: React.MouseEvent<HTMLTextAreaElement | HTMLInputElement>) {
    const el = e.currentTarget;
    const { selectionStart, selectionEnd } = el;
    if (selectionStart === null || selectionEnd === null || selectionStart === selectionEnd) return; // 선택된 글자가 없으면 기본 메뉴 그대로 둔다
    e.preventDefault();
    setSelection({ x: e.clientX, y: e.clientY, start: selectionStart, end: selectionEnd });
  }

  return (
    <div className="group relative rounded-xl px-3 py-2.5" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
      {block.type === "paragraph" && (
        <>
          <AlignButtons align={block.align} onChange={a => onChange({ ...block, align: a })} />
          <textarea
            ref={setTextAreaRef}
            value={block.text}
            onChange={e => onChange({ ...block, text: e.target.value })}
            onContextMenu={handleContextMenu}
            placeholder="이어서 써보세요..."
            rows={Math.max(3, block.text.split("\n").length)}
            className="w-full bg-transparent outline-none resize-none text-[15px] leading-[1.8]"
            style={{ color: "rgba(255,255,255,0.9)" }}
          />
        </>
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
          <AlignButtons align={block.align} onChange={a => onChange({ ...block, align: a })} />
          <textarea
            ref={setTextAreaRef}
            value={block.text}
            onChange={e => onChange({ ...block, text: e.target.value })}
            onContextMenu={handleContextMenu}
            placeholder="박스 안에 들어갈 내용을 써보세요..."
            rows={Math.max(3, block.text.split("\n").length)}
            className="w-full bg-transparent outline-none resize-none text-sm leading-[1.7]"
            style={{ color: "rgba(255,255,255,0.85)" }}
          />
        </div>
      )}

      {block.type === "quote" && (
        <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", borderLeft: "3px solid rgba(255,255,255,0.25)" }}>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded inline-block mb-2" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
            인용구
          </span>
          <AlignButtons align={block.align} onChange={a => onChange({ ...block, align: a })} />
          <textarea
            ref={setTextAreaRef}
            value={block.text}
            onChange={e => onChange({ ...block, text: e.target.value })}
            onContextMenu={handleContextMenu}
            placeholder="인용할 문장을 써보세요..."
            rows={Math.max(2, block.text.split("\n").length)}
            className="w-full bg-transparent outline-none resize-none text-sm italic leading-[1.7]"
            style={{ color: "rgba(255,255,255,0.85)" }}
          />
          <input
            value={block.citation}
            onChange={e => onChange({ ...block, citation: e.target.value })}
            placeholder="출처(선택, 예: - 김OO, 「제목」)"
            className="w-full bg-transparent outline-none text-xs mt-1.5"
            style={{ color: "rgba(255,255,255,0.5)" }}
          />
        </div>
      )}

      {block.type === "poem" && (
        <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.15)" }}>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded inline-block mb-2" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
            시 / 운문 (줄바꿈 그대로 유지)
          </span>
          <AlignButtons align={block.align} onChange={a => onChange({ ...block, align: a })} />
          <textarea
            ref={setTextAreaRef}
            value={block.text}
            onChange={e => onChange({ ...block, text: e.target.value })}
            onContextMenu={handleContextMenu}
            placeholder={"한 행씩 줄바꿈으로 구분해서 써보세요...\n연이 바뀔 때는 빈 줄을 하나 더 넣으세요."}
            rows={Math.max(4, block.text.split("\n").length)}
            className="w-full bg-transparent outline-none resize-none text-sm leading-[1.9]"
            style={{ color: "rgba(255,255,255,0.85)", fontFamily: "serif" }}
          />
        </div>
      )}

      {block.type === "heading" && (
        <div className="flex items-center gap-2">
          <select
            value={block.level}
            onChange={e => onChange({ ...block, level: Number(e.target.value) as 2 | 3 })}
            className="bg-transparent outline-none text-xs font-bold px-1.5 py-1 rounded"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
          >
            <option value={2} style={{ color: "#000" }}>소제목(큰)</option>
            <option value={3} style={{ color: "#000" }}>소제목(작은)</option>
          </select>
          <input
            ref={setTextAreaRef}
            value={block.text}
            onChange={e => onChange({ ...block, text: e.target.value })}
            onContextMenu={handleContextMenu}
            placeholder="소제목을 입력하세요"
            className="flex-1 min-w-0 bg-transparent outline-none text-base font-black"
            style={{ color: "#fff" }}
          />
        </div>
      )}

      {block.type === "scenebreak" && (
        <div className="text-center py-2 text-sm font-bold tracking-[0.3em]" style={{ color: "rgba(255,255,255,0.35)" }}>
          ⸻ 장면 전환 구분선 ⸻
        </div>
      )}

      {block.type === "pagebreak" && (
        <div className="text-center py-2 text-xs font-bold" style={{ color: "rgba(96,165,250,0.6)" }}>
          ⤓ 여기서 페이지가 강제로 넘어갑니다
        </div>
      )}

      {block.type === "list" && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)" }}>
              {block.ordered ? "번호 목록" : "글머리 기호 목록"}
            </span>
            <button
              onClick={() => onChange({ ...block, ordered: !block.ordered })}
              className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}
            >
              {block.ordered ? "글머리 기호로 전환" : "번호로 전환"}
            </button>
          </div>
          <div className="space-y-1.5">
            {block.items.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-xs w-4 shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {block.ordered ? `${i + 1}.` : "•"}
                </span>
                <input
                  value={item}
                  onChange={e => {
                    const items = [...block.items];
                    items[i] = e.target.value;
                    onChange({ ...block, items });
                  }}
                  placeholder="항목 내용"
                  className="flex-1 min-w-0 bg-transparent outline-none text-sm"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                />
                <button
                  onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
                  disabled={block.items.length <= 1}
                  className="text-[11px] px-1 disabled:opacity-30"
                  style={{ color: "rgba(248,113,113,0.6)" }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => onChange({ ...block, items: [...block.items, ""] })}
            className="mt-2 text-[11px] px-2 py-1 rounded font-semibold"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.5)" }}
          >
            + 항목 추가
          </button>
        </div>
      )}

      {block.type === "frontmatter" && (
        <div
          className="rounded-lg p-3 space-y-2"
          style={{ background: "rgba(245,197,24,0.05)", border: "1px dashed rgba(245,197,24,0.3)" }}
        >
          <select
            value={block.kind}
            onChange={e => onChange({ ...block, kind: e.target.value as FrontMatterKind })}
            className="text-[10px] font-bold px-1.5 py-0.5 rounded inline-block"
            style={{ background: "rgba(245,197,24,0.2)", color: "#e8c964" }}
          >
            {FRONT_MATTER_KINDS.map(k => (
              <option key={k} value={k} style={{ color: "#000" }}>{frontMatterLabel(k)}</option>
            ))}
          </select>
          <input
            value={block.title}
            onChange={e => onChange({ ...block, title: e.target.value })}
            placeholder="페이지 제목"
            className="w-full bg-transparent outline-none text-sm font-bold"
            style={{ color: "rgba(255,255,255,0.9)" }}
          />
          <textarea
            value={block.body}
            onChange={e => onChange({ ...block, body: e.target.value })}
            placeholder={
              block.kind === "dedication" ? "예: 사랑하는 가족에게 이 책을 바칩니다."
              : block.kind === "epigraph" ? "책 앞에 넣을 인용구나 문장을 써보세요."
              : "내용을 직접 입력하세요."
            }
            rows={Math.max(3, block.body.split("\n").length)}
            className="w-full bg-transparent outline-none resize-none text-sm leading-[1.7]"
            style={{ color: "rgba(255,255,255,0.8)" }}
          />
          {block.kind === "epigraph" && (
            <input
              value={block.citation}
              onChange={e => onChange({ ...block, citation: e.target.value })}
              placeholder="출처(선택)"
              className="w-full bg-transparent outline-none text-xs"
              style={{ color: "rgba(255,255,255,0.5)" }}
            />
          )}
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
          <div className="flex items-center gap-3 mb-2">
            <div className="flex items-center gap-1">
              {(["left", "center", "right"] as const).map(a => (
                <button
                  key={a}
                  onClick={() => onChange({ ...block, align: a })}
                  className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                  style={{
                    background: block.align === a ? "rgba(96,165,250,0.25)" : "rgba(255,255,255,0.05)",
                    color: block.align === a ? "#93c5fd" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {a === "left" ? "왼쪽" : a === "center" ? "가운데" : "오른쪽"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 flex-1 min-w-0">
              <input
                type="range"
                min={20}
                max={100}
                value={block.widthPercent}
                onChange={e => onChange({ ...block, widthPercent: Number(e.target.value) })}
                className="flex-1 min-w-0"
              />
              <span className="text-[10px] w-9 shrink-0" style={{ color: "rgba(255,255,255,0.4)" }}>{block.widthPercent}%</span>
            </div>
          </div>
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
        {hasText(block) && (
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

      {selection && hasText(block) && (
        <SelectionMenu
          x={selection.x}
          y={selection.y}
          onClose={() => setSelection(null)}
          items={[
            { label: "굵게", onClick: () => onApplyInlineStyle(block.id, selection.start, selection.end, "bold") },
            { label: "기울임", onClick: () => onApplyInlineStyle(block.id, selection.start, selection.end, "italic") },
            { label: "밑줄", onClick: () => onApplyInlineStyle(block.id, selection.start, selection.end, "underline") },
            { label: "취소선", onClick: () => onApplyInlineStyle(block.id, selection.start, selection.end, "strike") },
            { label: "형광펜 강조", onClick: () => onApplyInlineStyle(block.id, selection.start, selection.end, "highlight") },
            { label: "위첨자", onClick: () => onApplyInlineStyle(block.id, selection.start, selection.end, "sup") },
            { label: "아래첨자", onClick: () => onApplyInlineStyle(block.id, selection.start, selection.end, "sub") },
            { label: "제목으로 설정 (책 제목)", onClick: () => onSetBookTitle(block.id, selection.start, selection.end) },
            { label: "부제로 설정 (책 부제)", onClick: () => onSetBookSubtitle(block.id, selection.start, selection.end) },
            { label: "챕터로 설정 (여기서 새 챕터 시작)", onClick: () => onSplitAsChapter(block.id, selection.start, selection.end) },
            { label: "각주로 설정", onClick: () => onConvertSelectionToNote(block.id, selection.start, selection.end, "footnote") },
            { label: "미주로 설정", onClick: () => onConvertSelectionToNote(block.id, selection.start, selection.end, "endnote") },
          ]}
        />
      )}
    </div>
  );
}

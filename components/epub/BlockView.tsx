"use client";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createNote, hasText, type Align, type Block, type CopyrightBlock, type FrontMatterKind, type Note, type NoteKind } from "@/lib/epub/types";
import { frontMatterLabel } from "@/lib/epub/types";
import { insertNoteToken } from "@/lib/epub/notes";
import { STYLE_TOKENS, type InlineStyle } from "@/lib/epub/richtext";
import SelectionMenu from "./SelectionMenu";

interface Props {
  block: Block;
  isFirst: boolean;
  isLast: boolean;
  onChange: (block: Block) => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  onDuplicate: () => void;
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
  color: "rgba(42,36,23,0.45)",
  background: "rgba(0,0,0,0.04)",
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
            background: align === opt.value ? "rgba(37,99,235,0.15)" : "rgba(0,0,0,0.04)",
            color: align === opt.value ? "#1d4ed8" : "rgba(42,36,23,0.4)",
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

const FRONT_MATTER_KINDS: FrontMatterKind[] = ["dedication", "epigraph", "foreword", "afterword"];

const COPYRIGHT_PRESETS: { label: string; build: (b: CopyrightBlock) => string }[] = [
  { label: "표준 저작권 문구", build: b => `이 책의 저작권은 지은이${b.author.trim() ? `(${b.author.trim()})` : ""}와 출판사에게 있으며, 무단 전재와 복제를 금합니다.` },
  { label: "처벌 경고 문구", build: () => "본서의 내용을 사전 허가 없이 무단으로 전재하거나 복제할 경우, 저작권법에 의해 처벌받을 수 있습니다." },
  { label: "CCL(자유 이용 허락)", build: () => "이 저작물은 크리에이티브 커먼즈 저작자표시-비영리 4.0 국제 라이선스에 따라 이용할 수 있습니다." },
  { label: "초판 안내", build: b => (b.date.trim() ? `초판 1쇄 발행 ${b.date.trim()}` : "초판 1쇄 발행") },
];

const DEDICATION_PRESETS = [
  "사랑하는 가족에게 이 책을 바칩니다.",
  "늘 곁에서 응원해준 이에게.",
  "이 책을 읽어줄 당신에게.",
];

/** 선택 영역 바로 앞뒤가 같은 서식 기호로 감싸져 있으면 "이미 적용된 상태"로 본다. */
function isStyleActive(text: string, start: number, end: number, style: InlineStyle): boolean {
  const token = STYLE_TOKENS[style];
  return text.slice(Math.max(0, start - token.length), start) === token && text.slice(end, end + token.length) === token;
}

export default function BlockView({
  block, isFirst, isLast, onChange, onDelete, onMove, onDuplicate, onSplitHere, onAddNote,
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
    <div className="group relative rounded-xl px-3 py-2.5" style={{ border: "1px solid rgba(0,0,0,0.08)" }}>
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
            style={{ color: "rgba(42,36,23,0.88)" }}
          />
        </>
      )}

      {block.type === "textbox" && (
        <div
          className="rounded-lg p-3"
          style={{ background: "rgba(109,40,217,0.05)", border: "1px dashed rgba(109,40,217,0.3)" }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(109,40,217,0.14)", color: "#6d28d9" }}>
              텍스트 박스
            </span>
            <input
              value={block.label}
              onChange={e => onChange({ ...block, label: e.target.value })}
              placeholder="라벨 (예: 편지, 메모)"
              className="flex-1 min-w-0 bg-transparent outline-none text-xs font-semibold"
              style={{ color: "rgba(42,36,23,0.65)" }}
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
            style={{ color: "rgba(42,36,23,0.8)" }}
          />
        </div>
      )}

      {block.type === "quote" && (
        <div className="rounded-lg p-3" style={{ background: "rgba(0,0,0,0.025)", borderLeft: "3px solid rgba(0,0,0,0.2)" }}>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded inline-block mb-2" style={{ background: "rgba(0,0,0,0.06)", color: "rgba(42,36,23,0.55)" }}>
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
            style={{ color: "rgba(42,36,23,0.8)" }}
          />
          <input
            value={block.citation}
            onChange={e => onChange({ ...block, citation: e.target.value })}
            placeholder="출처(선택, 예: - 김OO, 「제목」)"
            className="w-full bg-transparent outline-none text-xs mt-1.5"
            style={{ color: "rgba(42,36,23,0.45)" }}
          />
        </div>
      )}

      {block.type === "poem" && (
        <div className="rounded-lg p-3" style={{ background: "rgba(0,0,0,0.025)", border: "1px dashed rgba(0,0,0,0.15)" }}>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded inline-block mb-2" style={{ background: "rgba(0,0,0,0.06)", color: "rgba(42,36,23,0.55)" }}>
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
            style={{ color: "rgba(42,36,23,0.8)", fontFamily: "serif" }}
          />
        </div>
      )}

      {block.type === "heading" && (
        <div className="flex items-center gap-2">
          <select
            value={block.level}
            onChange={e => onChange({ ...block, level: Number(e.target.value) as 2 | 3 })}
            className="bg-transparent outline-none text-xs font-bold px-1.5 py-1 rounded"
            style={{ background: "rgba(0,0,0,0.045)", color: "rgba(42,36,23,0.55)" }}
          >
            <option value={2}>소제목(큰)</option>
            <option value={3}>소제목(작은)</option>
          </select>
          <input
            ref={setTextAreaRef}
            value={block.text}
            onChange={e => onChange({ ...block, text: e.target.value })}
            onContextMenu={handleContextMenu}
            placeholder="소제목을 입력하세요"
            className="flex-1 min-w-0 bg-transparent outline-none text-base font-black"
            style={{ color: "#2a2417" }}
          />
        </div>
      )}

      {block.type === "scenebreak" && (
        <div className="text-center py-2 text-sm font-bold tracking-[0.3em]" style={{ color: "rgba(42,36,23,0.32)" }}>
          ⸻ 장면 전환 구분선 ⸻
        </div>
      )}

      {block.type === "pagebreak" && (
        <div className="text-center py-2 text-xs font-bold" style={{ color: "rgba(37,99,235,0.55)" }}>
          ⤓ 여기서 페이지가 강제로 넘어갑니다
        </div>
      )}

      {block.type === "list" && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(0,0,0,0.06)", color: "rgba(42,36,23,0.55)" }}>
              {block.ordered ? "번호 목록" : "글머리 기호 목록"}
            </span>
            <button
              onClick={() => onChange({ ...block, ordered: !block.ordered })}
              className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
              style={{ background: "rgba(0,0,0,0.04)", color: "rgba(42,36,23,0.4)" }}
            >
              {block.ordered ? "글머리 기호로 전환" : "번호로 전환"}
            </button>
          </div>
          <div className="space-y-1.5">
            {block.items.map((item, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <span className="text-xs w-4 shrink-0" style={{ color: "rgba(42,36,23,0.32)" }}>
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
                  style={{ color: "rgba(42,36,23,0.8)" }}
                />
                <button
                  onClick={() => onChange({ ...block, items: block.items.filter((_, j) => j !== i) })}
                  disabled={block.items.length <= 1}
                  className="text-[11px] px-1 disabled:opacity-30"
                  style={{ color: "rgba(185,28,28,0.65)" }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => onChange({ ...block, items: [...block.items, ""] })}
            className="mt-2 text-[11px] px-2 py-1 rounded font-semibold"
            style={{ background: "rgba(0,0,0,0.04)", color: "rgba(42,36,23,0.5)" }}
          >
            + 항목 추가
          </button>
        </div>
      )}

      {block.type === "frontmatter" && (
        <div
          className="rounded-lg p-3 space-y-2"
          style={{ background: "rgba(146,114,14,0.05)", border: "1px dashed rgba(146,114,14,0.3)" }}
        >
          <select
            value={block.kind}
            onChange={e => onChange({ ...block, kind: e.target.value as FrontMatterKind })}
            className="text-[10px] font-bold px-1.5 py-0.5 rounded inline-block"
            style={{ background: "rgba(146,114,14,0.16)", color: "#92720e" }}
          >
            {FRONT_MATTER_KINDS.map(k => (
              <option key={k} value={k}>{frontMatterLabel(k)}</option>
            ))}
          </select>
          <input
            value={block.title}
            onChange={e => onChange({ ...block, title: e.target.value })}
            placeholder="페이지 제목"
            className="w-full bg-transparent outline-none text-sm font-bold"
            style={{ color: "rgba(42,36,23,0.88)" }}
          />
          {block.kind === "dedication" && (
            <select
              value=""
              onChange={e => {
                if (e.target.value) onChange({ ...block, body: e.target.value });
                e.target.value = "";
              }}
              className="text-xs px-2 py-1 rounded"
              style={{ background: "rgba(0,0,0,0.04)", color: "rgba(42,36,23,0.55)" }}
            >
              <option value="">문구 선택...</option>
              {DEDICATION_PRESETS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          )}
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
            style={{ color: "rgba(42,36,23,0.75)" }}
          />
          {block.kind === "epigraph" && (
            <input
              value={block.citation}
              onChange={e => onChange({ ...block, citation: e.target.value })}
              placeholder="출처(선택)"
              className="w-full bg-transparent outline-none text-xs"
              style={{ color: "rgba(42,36,23,0.45)" }}
            />
          )}
        </div>
      )}

      {block.type === "copyright" && (
        <div
          className="rounded-lg p-3 space-y-2"
          style={{ background: "rgba(146,114,14,0.05)", border: "1px dashed rgba(146,114,14,0.3)" }}
        >
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded inline-block" style={{ background: "rgba(146,114,14,0.16)", color: "#92720e" }}>
            저작권(판권) 페이지
          </span>
          <input
            value={block.title}
            onChange={e => onChange({ ...block, title: e.target.value })}
            placeholder="책 제목"
            className="w-full bg-transparent outline-none text-sm font-bold"
            style={{ color: "rgba(42,36,23,0.88)" }}
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              value={block.author}
              onChange={e => onChange({ ...block, author: e.target.value })}
              placeholder="지은이"
              className="w-full bg-transparent outline-none text-xs"
              style={{ color: "rgba(42,36,23,0.7)" }}
            />
            <input
              value={block.date}
              onChange={e => onChange({ ...block, date: e.target.value })}
              placeholder="발행일 (자유 형식)"
              className="w-full bg-transparent outline-none text-xs"
              style={{ color: "rgba(42,36,23,0.7)" }}
            />
          </div>
          <input
            value={block.publisher}
            onChange={e => onChange({ ...block, publisher: e.target.value })}
            placeholder="출판사(선택)"
            className="w-full bg-transparent outline-none text-xs"
            style={{ color: "rgba(42,36,23,0.7)" }}
          />
          <select
            value=""
            onChange={e => {
              const preset = COPYRIGHT_PRESETS.find(p => p.label === e.target.value);
              if (preset) onChange({ ...block, body: preset.build(block) });
              e.target.value = "";
            }}
            className="text-xs px-2 py-1 rounded"
            style={{ background: "rgba(0,0,0,0.04)", color: "rgba(42,36,23,0.55)" }}
          >
            <option value="">문구 템플릿 선택...</option>
            {COPYRIGHT_PRESETS.map(p => (
              <option key={p.label} value={p.label}>{p.label}</option>
            ))}
          </select>
          <textarea
            value={block.body}
            onChange={e => onChange({ ...block, body: e.target.value })}
            placeholder="저작권 문구 등 원하는 내용을 직접 입력하세요. (예: ⓒ 2026 홍길동. All rights reserved.)"
            rows={Math.max(3, block.body.split("\n").length)}
            className="w-full bg-transparent outline-none resize-none text-xs leading-[1.7]"
            style={{ color: "rgba(42,36,23,0.7)" }}
          />
          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-1.5 text-[11px]" style={{ color: "rgba(42,36,23,0.5)" }}>
              <input type="checkbox" checked={block.showCover} onChange={e => onChange({ ...block, showCover: e.target.checked })} />
              표지 이미지 포함
            </label>
            <label className="flex items-center gap-1.5 text-[11px]" style={{ color: "rgba(42,36,23,0.5)" }}>
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
                    background: block.align === a ? "rgba(37,99,235,0.15)" : "rgba(0,0,0,0.04)",
                    color: block.align === a ? "#1d4ed8" : "rgba(42,36,23,0.4)",
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
              <span className="text-[10px] w-9 shrink-0" style={{ color: "rgba(42,36,23,0.4)" }}>{block.widthPercent}%</span>
            </div>
          </div>
          <input
            value={block.alt}
            onChange={e => onChange({ ...block, alt: e.target.value })}
            placeholder="대체 텍스트(alt)"
            className="w-full bg-transparent outline-none text-xs mb-1"
            style={{ color: "rgba(42,36,23,0.55)" }}
          />
          <input
            value={block.caption}
            onChange={e => onChange({ ...block, caption: e.target.value })}
            placeholder="캡션(선택)"
            className="w-full bg-transparent outline-none text-xs"
            style={{ color: "rgba(42,36,23,0.55)" }}
          />
        </div>
      )}

      <div className="mt-2 flex items-center gap-1 flex-wrap opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onMove(-1)} disabled={isFirst} className="text-[11px] px-1.5 py-0.5 rounded disabled:opacity-30" style={btnStyle}>▲</button>
        <button onClick={() => onMove(1)} disabled={isLast} className="text-[11px] px-1.5 py-0.5 rounded disabled:opacity-30" style={btnStyle}>▼</button>
        <button onClick={onDuplicate} className="text-[11px] px-1.5 py-0.5 rounded" style={btnStyle}>복제</button>
        <button onClick={onDelete} className="text-[11px] px-1.5 py-0.5 rounded" style={{ ...btnStyle, color: "rgba(185,28,28,0.7)" }}>삭제</button>
        {hasText(block) && (
          <>
            <button
              onClick={() => insertNote("footnote")}
              className="text-[11px] px-2 py-0.5 rounded font-semibold"
              style={{ background: "rgba(146,114,14,0.12)", color: "#92720e" }}
            >
              + 각주
            </button>
            <button
              onClick={() => insertNote("endnote")}
              className="text-[11px] px-2 py-0.5 rounded font-semibold"
              style={{ background: "rgba(146,114,14,0.12)", color: "#92720e" }}
            >
              + 미주
            </button>
          </>
        )}
        {!isLast && (
          <button
            onClick={onSplitHere}
            className="text-[11px] px-2 py-0.5 rounded ml-auto font-semibold"
            style={{ background: "rgba(37,99,235,0.12)", color: "#1d4ed8" }}
          >
            ✂ 여기서 챕터 나누기
          </button>
        )}
      </div>

      {selection && hasText(block) && (() => {
        const text = block.text;
        const styleItem = (style: InlineStyle, label: string) => ({
          label,
          active: isStyleActive(text, selection.start, selection.end, style),
          onClick: () => onApplyInlineStyle(block.id, selection.start, selection.end, style),
        });
        return (
          <SelectionMenu
            x={selection.x}
            y={selection.y}
            onClose={() => setSelection(null)}
            items={[
              styleItem("bold", "굵게"),
              styleItem("italic", "기울임"),
              styleItem("underline", "밑줄"),
              styleItem("strike", "취소선"),
              styleItem("highlight", "형광펜 강조"),
              styleItem("sup", "위첨자"),
              styleItem("sub", "아래첨자"),
              styleItem("red", "빨간 글씨"),
              styleItem("blue", "파란 글씨"),
              styleItem("green", "초록 글씨"),
              { label: "제목으로 설정 (책 제목)", onClick: () => onSetBookTitle(block.id, selection.start, selection.end) },
              { label: "부제로 설정 (책 부제)", onClick: () => onSetBookSubtitle(block.id, selection.start, selection.end) },
              { label: "챕터로 설정 (여기서 새 챕터 시작)", onClick: () => onSplitAsChapter(block.id, selection.start, selection.end) },
              { label: "각주로 설정", onClick: () => onConvertSelectionToNote(block.id, selection.start, selection.end, "footnote") },
              { label: "미주로 설정", onClick: () => onConvertSelectionToNote(block.id, selection.start, selection.end, "endnote") },
            ]}
          />
        );
      })()}
    </div>
  );
}

"use client";
import { useMemo } from "react";
import type { Chapter } from "@/lib/epub/types";
import { computeNoteNumbers, referencedNoteIds } from "@/lib/epub/notes";
import { getEpubFont, type EpubFontId } from "@/lib/epub/fonts";
import BlockRenderer, { type BookAssets } from "./BlockRenderer";

interface Props {
  chapter: Chapter;
  chapterIndex: number;
  chapterCount: number;
  fontSize: number;
  fontId: EpubFontId;
  assets: BookAssets;
  onFontSizeChange: (size: number) => void;
  onPrevChapter: () => void;
  onNextChapter: () => void;
}

const MIN_FONT = 13;
const MAX_FONT = 30;

export default function PreviewPane({
  chapter, chapterIndex, chapterCount, fontSize, fontId, assets, onFontSizeChange, onPrevChapter, onNextChapter,
}: Props) {
  const previewFontFamily = getEpubFont(fontId).previewFontFamily;
  const noteById = useMemo(() => new Map(chapter.notes.map(n => [n.id, n])), [chapter.notes]);
  const noteNumbers = useMemo(() => computeNoteNumbers(chapter), [chapter]);
  const noteCtx = useMemo(() => ({ noteById, noteNumbers }), [noteById, noteNumbers]);

  const referenced = useMemo(() => referencedNoteIds(chapter), [chapter]);
  const footnotes = chapter.notes
    .filter(n => n.kind === "footnote" && referenced.has(n.id))
    .sort((a, b) => (noteNumbers.get(a.id) ?? 0) - (noteNumbers.get(b.id) ?? 0));
  const endnotes = chapter.notes
    .filter(n => n.kind === "endnote" && referenced.has(n.id))
    .sort((a, b) => (noteNumbers.get(a.id) ?? 0) - (noteNumbers.get(b.id) ?? 0));

  return (
    <div className="flex flex-col h-full min-h-0">
      <div
        className="shrink-0 flex items-center justify-between gap-2 px-3 sm:px-4 py-2 border-b"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <span className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>
          미리보기 · {chapterIndex + 1}/{chapterCount}장
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onFontSizeChange(Math.max(MIN_FONT, fontSize - 1))}
            className="w-6 h-6 rounded-full text-xs font-bold"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}
            aria-label="글자 작게"
          >
            A-
          </button>
          <span className="text-[11px] w-6 text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
            {fontSize}
          </span>
          <button
            onClick={() => onFontSizeChange(Math.min(MAX_FONT, fontSize + 1))}
            className="w-6 h-6 rounded-full text-sm font-bold"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.7)" }}
            aria-label="글자 크게"
          >
            A+
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex justify-center py-4 px-2 sm:py-6 sm:px-4">
        <div
          className="w-full max-w-[480px] rounded-xl overflow-hidden"
          style={{ background: "#f6f1e6", boxShadow: "0 12px 40px rgba(0,0,0,0.35)" }}
        >
          <div
            style={{
              fontSize,
              lineHeight: 1.8,
              color: "#1c1a14",
              fontFamily: previewFontFamily,
              padding: "2rem 1.6rem",
              minHeight: 320,
            }}
          >
            <h1 style={{ fontSize: "1.3em", fontWeight: 800, margin: "0 0 1em" }}>{chapter.title}</h1>
            {chapter.blocks.map(block => (
              <BlockRenderer key={block.id} block={block} ctx={noteCtx} assets={assets} />
            ))}

            {footnotes.length > 0 && (
              <div style={{ marginTop: "2em", paddingTop: "0.8em", borderTop: "1px solid rgba(0,0,0,0.15)" }}>
                <p style={{ fontWeight: 800, fontSize: "0.85em", marginBottom: "0.5em" }}>각주</p>
                {footnotes.map(n => (
                  <p key={n.id} style={{ fontSize: "0.8em", margin: "0 0 0.4em", opacity: 0.85 }}>
                    [{noteNumbers.get(n.id)}] {n.text || "(내용 없음)"}
                  </p>
                ))}
              </div>
            )}

            {endnotes.length > 0 && (
              <div style={{ marginTop: "2em", paddingTop: "1em", borderTop: "2px solid rgba(0,0,0,0.25)" }}>
                <p style={{ fontWeight: 800, fontSize: "0.95em", marginBottom: "0.6em" }}>미주</p>
                {endnotes.map(n => (
                  <p key={n.id} style={{ fontSize: "0.85em", margin: "0 0 0.5em", opacity: 0.85 }}>
                    [{noteNumbers.get(n.id)}] {n.text || "(내용 없음)"}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        className="shrink-0 flex items-center justify-between gap-2 px-3 sm:px-4 py-2.5 border-t"
        style={{ borderColor: "rgba(255,255,255,0.07)" }}
      >
        <button
          onClick={onPrevChapter}
          disabled={chapterIndex === 0}
          className="text-xs font-bold px-3 py-1.5 rounded-full disabled:opacity-30"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)" }}
        >
          ◀ 이전 챕터
        </button>
        <button
          onClick={onNextChapter}
          disabled={chapterIndex === chapterCount - 1}
          className="text-xs font-bold px-3 py-1.5 rounded-full disabled:opacity-30"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.75)" }}
        >
          다음 챕터 ▶
        </button>
      </div>
    </div>
  );
}

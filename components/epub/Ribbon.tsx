"use client";
import { useRef, type ReactNode } from "react";
import type { FrontMatterKind } from "@/lib/epub/types";
import { FRONT_MATTER_KINDS, frontMatterLabel } from "@/lib/epub/types";

interface Props {
  onAddParagraph: () => void;
  onAddHeading: () => void;
  onAddTextBox: () => void;
  onAddQuote: () => void;
  onAddPoem: () => void;
  onAddSceneBreak: () => void;
  onAddPageBreak: () => void;
  onAddList: (ordered: boolean) => void;
  onAddTable: () => void;
  onAddImages: (files: FileList | File[]) => void;
  onAddCopyright: () => void;
  onAddFrontMatter: (kind: FrontMatterKind) => void;
}

function RibbonGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      className="shrink-0 flex flex-col gap-1 px-2.5 py-1.5 rounded-xl"
      style={{ background: "rgba(0,0,0,0.025)", border: "1px solid rgba(0,0,0,0.06)" }}
    >
      <div className="flex items-center gap-1 flex-wrap">{children}</div>
      <p className="text-[9px] font-bold text-center tracking-wide" style={{ color: "rgba(42,36,23,0.35)" }}>{label}</p>
    </div>
  );
}

const btn = "text-[11px] font-bold px-2.5 py-1.5 rounded-lg whitespace-nowrap";

export default function Ribbon({
  onAddParagraph, onAddHeading, onAddTextBox, onAddQuote, onAddPoem, onAddSceneBreak, onAddPageBreak,
  onAddList, onAddTable, onAddImages, onAddCopyright, onAddFrontMatter,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className="shrink-0 flex items-stretch gap-2 px-3 sm:px-4 py-2 border-b overflow-x-auto scrollbar-none"
      style={{ borderColor: "rgba(0,0,0,0.08)" }}
    >
      <RibbonGroup label="텍스트">
        <button onClick={onAddParagraph} className={btn} style={{ background: "rgba(0,0,0,0.045)", color: "rgba(42,36,23,0.7)" }}>문단</button>
        <button onClick={onAddHeading} className={btn} style={{ background: "rgba(0,0,0,0.045)", color: "rgba(42,36,23,0.7)" }}>소제목</button>
        <button onClick={onAddTextBox} className={btn} style={{ background: "rgba(109,40,217,0.1)", color: "#6d28d9" }}>텍스트박스</button>
        <button onClick={onAddQuote} className={btn} style={{ background: "rgba(0,0,0,0.045)", color: "rgba(42,36,23,0.7)" }}>인용구</button>
        <button onClick={onAddPoem} className={btn} style={{ background: "rgba(0,0,0,0.045)", color: "rgba(42,36,23,0.7)" }}>시</button>
      </RibbonGroup>

      <RibbonGroup label="구조">
        <button onClick={onAddSceneBreak} className={btn} style={{ background: "rgba(0,0,0,0.045)", color: "rgba(42,36,23,0.7)" }}>장면 구분선</button>
        <button onClick={onAddPageBreak} className={btn} style={{ background: "rgba(0,0,0,0.045)", color: "rgba(42,36,23,0.7)" }}>페이지 나눔</button>
        <button onClick={() => onAddList(false)} className={btn} style={{ background: "rgba(0,0,0,0.045)", color: "rgba(42,36,23,0.7)" }}>글머리 목록</button>
        <button onClick={() => onAddList(true)} className={btn} style={{ background: "rgba(0,0,0,0.045)", color: "rgba(42,36,23,0.7)" }}>번호 목록</button>
        <button onClick={onAddTable} className={btn} style={{ background: "rgba(0,0,0,0.045)", color: "rgba(42,36,23,0.7)" }}>표</button>
      </RibbonGroup>

      <RibbonGroup label="삽입 · 특수 페이지">
        <button onClick={() => fileInputRef.current?.click()} className={btn} style={{ background: "rgba(37,99,235,0.1)", color: "#1d4ed8" }}>이미지</button>
        <button onClick={onAddCopyright} className={btn} style={{ background: "rgba(146,114,14,0.12)", color: "#92720e" }}>저작권 페이지</button>
        <select
          value=""
          onChange={e => {
            if (e.target.value) onAddFrontMatter(e.target.value as FrontMatterKind);
            e.target.value = "";
          }}
          className={btn}
          style={{ background: "rgba(146,114,14,0.12)", color: "#92720e" }}
        >
          <option value="">특수 페이지...</option>
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
      </RibbonGroup>
    </div>
  );
}

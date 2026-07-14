"use client";
import { useState } from "react";

interface Props {
  find: string;
  matchCount: number;
  onChangeFind: (find: string) => void;
  onReplaceAll: (find: string, replaceWith: string) => void;
  onClose: () => void;
}

export default function FindReplacePanel({ find, matchCount, onChangeFind, onReplaceAll, onClose }: Props) {
  const [replaceWith, setReplaceWith] = useState("");

  return (
    <div
      className="absolute right-3 sm:right-4 top-14 z-[140] w-72 rounded-xl p-3 space-y-2"
      style={{ background: "#fffdf7", border: "1px solid rgba(0,0,0,0.12)", boxShadow: "0 12px 32px rgba(0,0,0,0.25)" }}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-black" style={{ color: "#2a2417" }}>찾아 바꾸기 (책 전체)</span>
        <button onClick={onClose} className="text-xs px-1" style={{ color: "rgba(42,36,23,0.4)" }} aria-label="닫기">✕</button>
      </div>
      <input
        autoFocus
        value={find}
        onChange={e => onChangeFind(e.target.value)}
        placeholder="찾을 내용"
        className="w-full text-sm px-2.5 py-1.5 rounded-lg outline-none"
        style={{ background: "rgba(0,0,0,0.045)", color: "#2a2417" }}
      />
      <input
        value={replaceWith}
        onChange={e => setReplaceWith(e.target.value)}
        placeholder="바꿀 내용"
        className="w-full text-sm px-2.5 py-1.5 rounded-lg outline-none"
        style={{ background: "rgba(0,0,0,0.045)", color: "#2a2417" }}
      />
      <div className="flex items-center justify-between gap-2 pt-0.5">
        <span className="text-[11px]" style={{ color: "rgba(42,36,23,0.5)" }}>
          {find ? `${matchCount}개 찾음` : "정규식 없이 그대로 찾아요"}
        </span>
        <button
          onClick={() => onReplaceAll(find, replaceWith)}
          disabled={!find || matchCount === 0}
          className="text-xs font-bold px-3 py-1.5 rounded-full disabled:opacity-40 shrink-0"
          style={{ background: "#4f46e5", color: "#fff" }}
        >
          모두 바꾸기
        </button>
      </div>
    </div>
  );
}

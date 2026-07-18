"use client";
import { useMemo } from "react";
import type { Chapter, Note, NoteKind } from "@/lib/epub/types";
import { computeNoteNumbers, referencedNoteIds } from "@/lib/epub/notes";

interface Props {
  chapter: Chapter;
  onChangeNote: (noteId: string, text: string) => void;
  onDeleteNote: (noteId: string) => void;
}

function NoteGroup({
  title, notes, numbers, referenced, onChangeNote, onDeleteNote,
}: {
  title: string;
  notes: Note[];
  numbers: Map<string, number>;
  referenced: Set<string>;
  onChangeNote: (noteId: string, text: string) => void;
  onDeleteNote: (noteId: string) => void;
}) {
  if (notes.length === 0) return null;
  const sorted = [...notes].sort((a, b) => (numbers.get(a.id) ?? 0) - (numbers.get(b.id) ?? 0));
  return (
    <div className="mb-2">
      <p className="text-[11px] font-bold mb-1.5" style={{ color: "rgba(146,114,14,0.9)" }}>{title}</p>
      <div className="space-y-1.5">
        {sorted.map(note => (
          <div key={note.id} className="flex items-start gap-1.5">
            <span
              className="shrink-0 mt-1.5 text-[10px] font-bold w-4 text-center"
              style={{ color: "rgba(146,114,14,0.8)" }}
            >
              {numbers.get(note.id)}
            </span>
            <textarea
              value={note.text}
              onChange={e => onChangeNote(note.id, e.target.value)}
              placeholder={title === "각주" ? "각주 내용을 입력하세요" : "미주 내용을 입력하세요"}
              rows={1}
              className="flex-1 min-w-0 bg-transparent outline-none text-xs leading-[1.6] py-1 px-1.5 rounded"
              style={{ color: "rgba(42,36,23,0.75)", background: "rgba(0,0,0,0.03)" }}
            />
            {!referenced.has(note.id) && (
              <span className="shrink-0 text-[10px] px-1 py-0.5 rounded mt-1" style={{ color: "rgba(185,28,28,0.75)" }}>
                미사용
              </span>
            )}
            <button
              onClick={() => onDeleteNote(note.id)}
              className="shrink-0 text-[11px] px-1.5 py-1 rounded"
              style={{ color: "rgba(185,28,28,0.65)" }}
            >
              삭제
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NotesPanel({ chapter, onChangeNote, onDeleteNote }: Props) {
  const numbers = useMemo(() => computeNoteNumbers(chapter), [chapter]);
  const referenced = useMemo(() => referencedNoteIds(chapter), [chapter]);

  if (chapter.notes.length === 0) return null;

  const byKind = (kind: NoteKind) => chapter.notes.filter(n => n.kind === kind);

  return (
    <div
      className="shrink-0 px-3 sm:px-4 py-2.5 border-t"
      style={{ borderColor: "rgba(0,0,0,0.08)", background: "rgba(146,114,14,0.04)" }}
    >
      <NoteGroup title="각주" notes={byKind("footnote")} numbers={numbers} referenced={referenced} onChangeNote={onChangeNote} onDeleteNote={onDeleteNote} />
      <NoteGroup title="미주" notes={byKind("endnote")} numbers={numbers} referenced={referenced} onChangeNote={onChangeNote} onDeleteNote={onDeleteNote} />
    </div>
  );
}

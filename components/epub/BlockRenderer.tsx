"use client";
import type { Block, Note } from "@/lib/epub/types";
import { splitTextByNoteRefs } from "@/lib/epub/notes";

export interface NoteContext {
  noteById: Map<string, Note>;
  noteNumbers: Map<string, number>;
}

function NoteMark({ noteId, ctx }: { noteId: string; ctx: NoteContext }) {
  const note = ctx.noteById.get(noteId);
  const num = ctx.noteNumbers.get(noteId);
  if (!note || num === undefined) return null;
  return (
    <sup
      title={note.text || (note.kind === "footnote" ? "각주" : "미주")}
      style={{ color: "#7c6a3f", fontWeight: 700, cursor: "help", padding: "0 1px" }}
    >
      [{num}]
    </sup>
  );
}

function ParagraphText({ text, ctx }: { text: string; ctx: NoteContext }) {
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i} style={{ margin: "0 0 1em", textIndent: "1em" }}>
          {p.split("\n").map((line, j, arr) => (
            <span key={j}>
              {splitTextByNoteRefs(line).map((seg, k) =>
                seg.type === "text" ? (
                  <span key={k}>{seg.value}</span>
                ) : (
                  <NoteMark key={k} noteId={seg.noteId!} ctx={ctx} />
                )
              )}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}

export interface BookAssets {
  coverImage: string | null;
  publisherLogo: string | null;
}

export default function BlockRenderer({ block, ctx, assets }: { block: Block; ctx: NoteContext; assets: BookAssets }) {
  if (block.type === "paragraph") {
    return <ParagraphText text={block.text} ctx={ctx} />;
  }
  if (block.type === "textbox") {
    return (
      <aside
        style={{
          margin: "1.5em 0",
          padding: "1em 1.2em",
          border: "1px solid rgba(153,153,153,0.5)",
          borderRadius: 4,
          background: "rgba(255,255,255,0.04)",
        }}
      >
        {block.label.trim() && <p style={{ fontWeight: "bold", margin: "0 0 0.5em" }}>{block.label}</p>}
        <ParagraphText text={block.text} ctx={ctx} />
      </aside>
    );
  }
  if (block.type === "image") {
    return (
      <figure style={{ margin: "1.5em 0", textAlign: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={block.src} alt={block.alt} style={{ maxWidth: "100%", borderRadius: 4 }} />
        {block.caption.trim() && (
          <figcaption style={{ fontSize: "0.85em", opacity: 0.6, marginTop: "0.5em" }}>{block.caption}</figcaption>
        )}
      </figure>
    );
  }
  return (
    <section style={{ textAlign: "center", padding: "3em 0 1em", borderTop: "1px dashed rgba(0,0,0,0.15)" }}>
      {block.showCover && assets.coverImage && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={assets.coverImage} alt="표지" style={{ maxWidth: "45%", margin: "0 auto 1.5em", boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }} />
      )}
      <p style={{ fontWeight: 800, fontSize: "1.1em", margin: "0 0 0.6em" }}>{block.title}</p>
      {block.author.trim() && <p style={{ fontSize: "0.85em", margin: "0 0 0.2em", opacity: 0.75 }}>{block.author}</p>}
      {block.publisher.trim() && <p style={{ fontSize: "0.85em", margin: "0 0 0.2em", opacity: 0.75 }}>{block.publisher}</p>}
      {block.date.trim() && <p style={{ fontSize: "0.85em", margin: "0 0 0.2em", opacity: 0.75 }}>{block.date}</p>}
      {block.showPublisherLogo && assets.publisherLogo && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={assets.publisherLogo} alt="출판사 로고" style={{ maxWidth: "25%", margin: "1.2em auto 0" }} />
      )}
      {block.body.trim() && (
        <div style={{ textAlign: "left", marginTop: "1.5em", fontSize: "0.8em", opacity: 0.7 }}>
          <ParagraphText text={block.body} ctx={ctx} />
        </div>
      )}
    </section>
  );
}

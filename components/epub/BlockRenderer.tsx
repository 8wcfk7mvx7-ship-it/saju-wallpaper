"use client";
import type { Block } from "@/lib/epub/types";

function ParagraphText({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i} style={{ margin: "0 0 1em", textIndent: "1em" }}>
          {p.split("\n").map((line, j, arr) => (
            <span key={j}>
              {line}
              {j < arr.length - 1 && <br />}
            </span>
          ))}
        </p>
      ))}
    </>
  );
}

export default function BlockRenderer({ block }: { block: Block }) {
  if (block.type === "paragraph") {
    return <ParagraphText text={block.text} />;
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
        <ParagraphText text={block.text} />
      </aside>
    );
  }
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

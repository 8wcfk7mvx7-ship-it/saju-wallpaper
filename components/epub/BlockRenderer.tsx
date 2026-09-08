"use client";
import type { CSSProperties, ReactNode } from "react";
import type { Align, Block, Note } from "@/lib/epub/types";
import { frontMatterLabel, PROSE_FRONT_MATTER_KINDS } from "@/lib/epub/types";
import { splitTextByNoteRefs } from "@/lib/epub/notes";
import { parseRichText, type RichNode } from "@/lib/epub/richtext";

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

function renderRichNodes(nodes: RichNode[]): ReactNode {
  return nodes.map((node, i) => {
    if (node.type === "text") return <span key={i}>{node.value}</span>;
    const children = renderRichNodes(node.children);
    switch (node.style) {
      case "bold":
        return <strong key={i}>{children}</strong>;
      case "italic":
        return <em key={i}>{children}</em>;
      case "underline":
        return <span key={i} style={{ textDecoration: "underline" }}>{children}</span>;
      case "strike":
        return <s key={i}>{children}</s>;
      case "highlight":
        return <mark key={i} style={{ background: "#fde68a", color: "#1c1a14", padding: "0 2px", borderRadius: 2 }}>{children}</mark>;
      case "sup":
        return <sup key={i}>{children}</sup>;
      case "sub":
        return <sub key={i}>{children}</sub>;
      case "red":
        return <span key={i} style={{ color: "#c0392b" }}>{children}</span>;
      case "blue":
        return <span key={i} style={{ color: "#2563eb" }}>{children}</span>;
      case "green":
        return <span key={i} style={{ color: "#16a34a" }}>{children}</span>;
    }
  });
}

function RichLine({ line, ctx }: { line: string; ctx: NoteContext }) {
  return (
    <>
      {splitTextByNoteRefs(line).map((seg, k) =>
        seg.type === "text" ? <span key={k}>{renderRichNodes(parseRichText(seg.value))}</span> : <NoteMark key={k} noteId={seg.noteId!} ctx={ctx} />
      )}
    </>
  );
}

function RichParagraphs({ text, ctx, align, indent = true }: { text: string; ctx: NoteContext; align?: Align; indent?: boolean }) {
  const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
  return (
    <>
      {paragraphs.map((p, i) => (
        <p key={i} style={{ margin: "0 0 1em", textIndent: indent && (align === "left" || align === "justify" || !align) ? "1em" : 0, textAlign: align }}>
          {p.split("\n").map((line, j, arr) => (
            <span key={j}>
              <RichLine line={line} ctx={ctx} />
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

/** 뷰어 폰트 크기와 무관하게 percent 지점(위에서부터 %)에 내용이 오도록, 위아래 여백을 flex-grow 비율로 나눈다.
 *  실제 내보내기(generator.ts)에서는 강제 페이지 나눔까지 걸리지만, 미리보기에서는 위치 감각만 보여준다. */
function PagePositionPreview({ percent, children }: { percent: number; children: ReactNode }) {
  const top = Math.max(0, Math.min(100, percent));
  const bottom = 100 - top;
  return (
    <div style={{ position: "relative", height: "65vh", display: "flex", flexDirection: "column", margin: "1em 0" }}>
      <span
        style={{
          position: "absolute", top: 2, left: 0, fontSize: "0.65em", fontWeight: 800,
          opacity: 0.4, letterSpacing: "0.02em",
        }}
      >
        📍 위치 고정 · {top}%
      </span>
      <div style={{ flexGrow: top, flexShrink: 0 }} />
      <div>{children}</div>
      <div style={{ flexGrow: bottom, flexShrink: 0 }} />
    </div>
  );
}

export default function BlockRenderer({ block, ctx, assets }: { block: Block; ctx: NoteContext; assets: BookAssets }) {
  const content = renderBlockContent(block, ctx, assets);
  if ("pagePosition" in block && block.pagePosition != null) {
    return <PagePositionPreview percent={block.pagePosition}>{content}</PagePositionPreview>;
  }
  return content;
}

function renderBlockContent(block: Block, ctx: NoteContext, assets: BookAssets): ReactNode {
  switch (block.type) {
    case "paragraph":
      return <RichParagraphs text={block.text} ctx={ctx} align={block.align} />;

    case "textbox":
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
          <RichParagraphs text={block.text} ctx={ctx} align={block.align} />
        </aside>
      );

    case "quote":
      return (
        <blockquote style={{ margin: "1.5em 0.5em", paddingLeft: "1em", borderLeft: "3px solid rgba(0,0,0,0.25)", fontStyle: "italic" }}>
          <RichParagraphs text={block.text} ctx={ctx} align={block.align} indent={false} />
          {block.citation.trim() && (
            <footer style={{ fontStyle: "normal", fontSize: "0.85em", opacity: 0.65, marginTop: "0.5em" }}>{block.citation}</footer>
          )}
        </blockquote>
      );

    case "poem":
      return (
        <div style={{ margin: "1.5em 0", fontFamily: "serif" }}>
          <RichParagraphs text={block.text} ctx={ctx} align={block.align} indent={false} />
        </div>
      );

    case "heading": {
      const Tag = block.level === 2 ? "h2" : "h3";
      return (
        <Tag style={{ fontSize: block.level === 2 ? "1.2em" : "1.05em", fontWeight: 800, margin: "1.2em 0 0.6em", textAlign: block.align }}>
          <RichLine line={block.text} ctx={ctx} />
        </Tag>
      );
    }

    case "scenebreak":
      return <div style={{ textAlign: "center", margin: "2em 0", letterSpacing: "0.4em", opacity: 0.5 }}>⁂</div>;

    case "pagebreak":
      return (
        <div style={{ margin: "1em 0", textAlign: "center", fontSize: "0.7em", opacity: 0.3, borderTop: "1px dashed currentColor", paddingTop: "0.5em" }}>
          — 페이지 나눔 —
        </div>
      );

    case "list": {
      const Tag = block.ordered ? "ol" : "ul";
      return (
        <Tag style={{ margin: "0 0 1em", paddingLeft: "1.6em" }}>
          {block.items.filter(item => item.trim()).map((item, i) => (
            <li key={i} style={{ margin: "0 0 0.4em" }}>
              <RichLine line={item} ctx={ctx} />
            </li>
          ))}
        </Tag>
      );
    }

    case "table": {
      const cellStyle: CSSProperties = { border: "1px solid rgba(0,0,0,0.25)", padding: "0.4em 0.7em", textAlign: "left", verticalAlign: "top" };
      const bodyStart = block.hasHeader ? 1 : 0;
      return (
        <table style={{ width: "100%", margin: "1.5em 0", borderCollapse: "collapse", fontSize: "0.9em" }}>
          {block.hasHeader && block.rows[0] && (
            <thead>
              <tr>
                {block.rows[0].map((cell, ci) => (
                  <th key={ci} style={{ ...cellStyle, background: "rgba(0,0,0,0.06)", fontWeight: 700 }}>
                    {renderRichNodes(parseRichText(cell))}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {block.rows.slice(bodyStart).map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} style={cellStyle}>{renderRichNodes(parseRichText(cell))}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    case "frontmatter":
      return (
        <section style={{ textAlign: "center", padding: "3em 0 1em" }}>
          <p style={{ fontSize: "0.75em", letterSpacing: "0.2em", opacity: 0.5, margin: "0 0 1em" }}>{frontMatterLabel(block.kind)}</p>
          {block.title.trim() && <p style={{ fontWeight: 800, fontSize: "1.05em", margin: "0 0 1em" }}>{block.title}</p>}
          {block.body.trim() && (
            <div style={{ textAlign: PROSE_FRONT_MATTER_KINDS.has(block.kind) ? "left" : "center", fontStyle: block.kind === "epigraph" ? "italic" : "normal" }}>
              <RichParagraphs text={block.body} ctx={ctx} indent={PROSE_FRONT_MATTER_KINDS.has(block.kind)} />
            </div>
          )}
          {block.kind === "epigraph" && block.citation.trim() && (
            <p style={{ fontSize: "0.85em", opacity: 0.6, marginTop: "0.8em" }}>{block.citation}</p>
          )}
        </section>
      );

    case "image": {
      const justify = block.align === "left" ? "flex-start" : block.align === "right" ? "flex-end" : "center";
      return (
        <figure style={{ margin: "1.5em 0", display: "flex", flexDirection: "column", alignItems: justify }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={block.src} alt={block.alt} style={{ width: `${block.widthPercent}%`, maxWidth: "100%", borderRadius: 4 }} />
          {block.caption.trim() && (
            <figcaption style={{ fontSize: "0.85em", opacity: 0.6, marginTop: "0.5em" }}>{block.caption}</figcaption>
          )}
        </figure>
      );
    }

    case "copyright":
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
              <RichParagraphs text={block.body} ctx={ctx} />
            </div>
          )}
        </section>
      );
  }
}

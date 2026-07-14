"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  title: string;
  author: string;
  coverImage: string | null;
  exporting: boolean;
  onChangeTitle: (title: string) => void;
  onChangeAuthor: (author: string) => void;
  onChangeCover: (file: File | null) => void;
  onExport: () => void;
  view: "editor" | "preview";
  onChangeView: (view: "editor" | "preview") => void;
}

export default function BookMetaBar({
  title, author, coverImage, exporting,
  onChangeTitle, onChangeAuthor, onChangeCover, onExport,
  view, onChangeView,
}: Props) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [showMeta, setShowMeta] = useState(false);

  return (
    <div className="shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5">
        <button
          onClick={() => router.push("/")}
          className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)" }}
          aria-label="뒤로"
        >
          ←
        </button>

        <button
          onClick={() => setShowMeta(v => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="text-sm font-black truncate text-white">{title || "제목 없는 책"}</p>
          <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
            {author ? author : "책 정보 편집"}
          </p>
        </button>

        <div className="sm:hidden flex rounded-full p-0.5 shrink-0" style={{ background: "rgba(255,255,255,0.06)" }}>
          <button
            onClick={() => onChangeView("editor")}
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: view === "editor" ? "rgba(99,102,241,0.3)" : "transparent", color: "#fff" }}
          >
            편집
          </button>
          <button
            onClick={() => onChangeView("preview")}
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: view === "preview" ? "rgba(99,102,241,0.3)" : "transparent", color: "#fff" }}
          >
            미리보기
          </button>
        </div>

        <button
          onClick={onExport}
          disabled={exporting}
          className="shrink-0 text-xs font-bold px-3.5 py-1.5 rounded-full disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #6366f1, #a78bfa)", color: "#fff" }}
        >
          {exporting ? "만드는 중…" : "EPUB 내보내기"}
        </button>
      </div>

      {showMeta && (
        <div className="px-3 sm:px-4 pb-3 flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => coverInputRef.current?.click()}
            className="shrink-0 w-16 h-20 rounded-lg overflow-hidden flex items-center justify-center text-[10px] font-bold"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px dashed rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.4)" }}
          >
            {coverImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverImage} alt="표지" className="w-full h-full object-cover" />
            ) : (
              "표지 추가"
            )}
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => onChangeCover(e.target.files?.[0] ?? null)}
          />
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <input
              value={title}
              onChange={e => onChangeTitle(e.target.value)}
              placeholder="책 제목"
              className="w-full bg-transparent outline-none text-sm font-bold border-b pb-1"
              style={{ color: "#fff", borderColor: "rgba(255,255,255,0.1)" }}
            />
            <input
              value={author}
              onChange={e => onChangeAuthor(e.target.value)}
              placeholder="지은이"
              className="w-full bg-transparent outline-none text-sm border-b pb-1"
              style={{ color: "rgba(255,255,255,0.8)", borderColor: "rgba(255,255,255,0.1)" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

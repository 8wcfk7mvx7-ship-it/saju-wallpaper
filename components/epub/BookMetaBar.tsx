"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EPUB_FONTS, type EpubFontId } from "@/lib/epub/fonts";

interface Props {
  title: string;
  subtitle: string;
  author: string;
  date: string;
  coverImage: string | null;
  publisherLogo: string | null;
  fontId: EpubFontId;
  exporting: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onChangeTitle: (title: string) => void;
  onChangeSubtitle: (subtitle: string) => void;
  onChangeAuthor: (author: string) => void;
  onChangeDate: (date: string) => void;
  onChangeCover: (file: File | null) => void;
  onChangePublisherLogo: (file: File | null) => void;
  onChangeFont: (fontId: EpubFontId) => void;
  onExport: () => void;
  view: "editor" | "preview";
  onChangeView: (view: "editor" | "preview") => void;
}

export default function BookMetaBar({
  title, subtitle, author, date, coverImage, publisherLogo, fontId, exporting, canUndo, canRedo, onUndo, onRedo,
  onChangeTitle, onChangeSubtitle, onChangeAuthor, onChangeDate, onChangeCover, onChangePublisherLogo, onChangeFont, onExport,
  view, onChangeView,
}: Props) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [showMeta, setShowMeta] = useState(false);

  return (
    <div className="shrink-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
      <div className="flex items-center gap-2 px-3 sm:px-4 py-2.5">
        <button
          onClick={() => router.push("/")}
          className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.045)", color: "rgba(42,36,23,0.6)" }}
          aria-label="뒤로"
        >
          ←
        </button>

        <div className="hidden sm:flex items-center gap-1 shrink-0">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm disabled:opacity-30"
            style={{ background: "rgba(0,0,0,0.045)", color: "rgba(42,36,23,0.6)" }}
            aria-label="실행 취소"
            title="실행 취소"
          >
            ↶
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm disabled:opacity-30"
            style={{ background: "rgba(0,0,0,0.045)", color: "rgba(42,36,23,0.6)" }}
            aria-label="다시 실행"
            title="다시 실행"
          >
            ↷
          </button>
        </div>

        <button
          onClick={() => setShowMeta(v => !v)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="text-sm font-black truncate" style={{ color: "#2a2417" }}>{title || "제목 없는 책"}</p>
          <p className="text-[11px] truncate" style={{ color: "rgba(42,36,23,0.45)" }}>
            {subtitle || author || "책 정보 편집"}
          </p>
        </button>

        <div className="sm:hidden flex rounded-full p-0.5 shrink-0" style={{ background: "rgba(0,0,0,0.045)" }}>
          <button
            onClick={() => onChangeView("editor")}
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: view === "editor" ? "#4f46e5" : "transparent", color: view === "editor" ? "#fff" : "rgba(42,36,23,0.55)" }}
          >
            편집
          </button>
          <button
            onClick={() => onChangeView("preview")}
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: view === "preview" ? "#4f46e5" : "transparent", color: view === "preview" ? "#fff" : "rgba(42,36,23,0.55)" }}
          >
            미리보기
          </button>
        </div>

        <button
          onClick={onExport}
          disabled={exporting}
          className="shrink-0 text-xs font-bold px-3.5 py-1.5 rounded-full disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "#fff" }}
        >
          {exporting ? "만드는 중…" : "EPUB 내보내기"}
        </button>
      </div>

      {showMeta && (
        <div className="px-3 sm:px-4 pb-3 flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => coverInputRef.current?.click()}
              className="w-16 h-20 rounded-lg overflow-hidden flex items-center justify-center text-[10px] font-bold text-center leading-tight"
              style={{ background: "rgba(0,0,0,0.035)", border: "1px dashed rgba(0,0,0,0.18)", color: "rgba(42,36,23,0.4)" }}
            >
              {coverImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverImage} alt="표지" className="w-full h-full object-cover" />
              ) : (
                "표지 추가"
              )}
            </button>
            <button
              onClick={() => logoInputRef.current?.click()}
              className="w-16 h-20 rounded-lg overflow-hidden flex items-center justify-center text-[10px] font-bold text-center leading-tight p-1"
              style={{ background: "rgba(0,0,0,0.035)", border: "1px dashed rgba(0,0,0,0.18)", color: "rgba(42,36,23,0.4)" }}
            >
              {publisherLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={publisherLogo} alt="출판사 로고" className="w-full h-full object-contain" />
              ) : (
                "출판사 로고"
              )}
            </button>
          </div>
          <input
            ref={coverInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => onChangeCover(e.target.files?.[0] ?? null)}
          />
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => onChangePublisherLogo(e.target.files?.[0] ?? null)}
          />
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <input
              value={title}
              onChange={e => onChangeTitle(e.target.value)}
              placeholder="책 제목"
              className="w-full bg-transparent outline-none text-sm font-bold border-b pb-1"
              style={{ color: "#2a2417", borderColor: "rgba(0,0,0,0.12)" }}
            />
            <input
              value={subtitle}
              onChange={e => onChangeSubtitle(e.target.value)}
              placeholder="부제(선택)"
              className="w-full bg-transparent outline-none text-xs border-b pb-1"
              style={{ color: "rgba(42,36,23,0.65)", borderColor: "rgba(0,0,0,0.12)" }}
            />
            <input
              value={author}
              onChange={e => onChangeAuthor(e.target.value)}
              placeholder="지은이"
              className="w-full bg-transparent outline-none text-sm border-b pb-1"
              style={{ color: "rgba(42,36,23,0.78)", borderColor: "rgba(0,0,0,0.12)" }}
            />
            <div className="flex gap-2">
              <input
                value={date}
                onChange={e => onChangeDate(e.target.value)}
                placeholder="발행일 (자유 형식)"
                className="flex-1 min-w-0 bg-transparent outline-none text-xs border-b pb-1"
                style={{ color: "rgba(42,36,23,0.65)", borderColor: "rgba(0,0,0,0.12)" }}
              />
              <select
                value={fontId}
                onChange={e => onChangeFont(e.target.value as EpubFontId)}
                className="bg-transparent outline-none text-xs border-b pb-1"
                style={{ color: "rgba(42,36,23,0.65)", borderColor: "rgba(0,0,0,0.12)" }}
              >
                {EPUB_FONTS.map(f => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { EPUB_FONTS, type EpubFontId } from "@/lib/epub/fonts";
import type { ProjectMeta } from "@/lib/epub/storage";
import FileMenu from "./FileMenu";

interface Props {
  title: string;
  subtitle: string;
  author: string;
  publisher: string;
  isbn: string;
  description: string;
  date: string;
  coverImage: string | null;
  publisherLogo: string | null;
  fontId: EpubFontId;
  exporting: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  findReplaceOpen: boolean;
  onToggleFindReplace: () => void;
  focusMode: boolean;
  onToggleFocusMode: () => void;
  onToggleFullscreen: () => void;
  projects: ProjectMeta[];
  currentProjectId: string | null;
  onRefreshProjects: () => void;
  onNewProject: () => void;
  onSaveProject: () => void;
  onSaveAsProject: () => void;
  onOpenProject: (id: string) => void;
  onImportDocx: (file: File) => void;
  onChangeTitle: (title: string) => void;
  onChangeSubtitle: (subtitle: string) => void;
  onChangeAuthor: (author: string) => void;
  onChangePublisher: (publisher: string) => void;
  onChangeIsbn: (isbn: string) => void;
  onChangeDescription: (description: string) => void;
  onChangeDate: (date: string) => void;
  onChangeCover: (file: File | null) => void;
  onChangePublisherLogo: (file: File | null) => void;
  onChangeFont: (fontId: EpubFontId) => void;
  onExport: () => void;
  view: "editor" | "preview";
  onChangeView: (view: "editor" | "preview") => void;
}

export default function BookMetaBar({
  title, subtitle, author, publisher, isbn, description, date, coverImage, publisherLogo, fontId, exporting, canUndo, canRedo, onUndo, onRedo,
  findReplaceOpen, onToggleFindReplace,
  focusMode, onToggleFocusMode, onToggleFullscreen,
  projects, currentProjectId, onRefreshProjects, onNewProject, onSaveProject, onSaveAsProject, onOpenProject, onImportDocx,
  onChangeTitle, onChangeSubtitle, onChangeAuthor, onChangePublisher, onChangeIsbn, onChangeDescription, onChangeDate,
  onChangeCover, onChangePublisherLogo, onChangeFont, onExport,
  view, onChangeView,
}: Props) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [showMeta, setShowMeta] = useState(false);

  return (
    <div className="shrink-0" style={{ borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
      {/* 창 컨트롤 + 파일 메뉴 + 실행취소/다시실행 + 보기 전환 + 내보내기 */}
      <div className="flex items-center gap-2 px-3 sm:px-4 pt-2.5">
        <div className="flex items-center gap-1.5 shrink-0" title="창 컨트롤">
          <button
            onClick={() => router.push("/")}
            aria-label="닫기"
            title="닫기"
            className="w-3 h-3 rounded-full"
            style={{ background: "#ff5f57" }}
          />
          <button
            onClick={onToggleFocusMode}
            aria-label="최소화(집중 모드)"
            title="최소화(집중 모드)"
            className="w-3 h-3 rounded-full"
            style={{ background: "#febc2e", boxShadow: focusMode ? "0 0 0 2px rgba(254,188,46,0.5)" : "none" }}
          />
          <button
            onClick={onToggleFullscreen}
            aria-label="최대화(전체 화면)"
            title="최대화(전체 화면)"
            className="w-3 h-3 rounded-full"
            style={{ background: "#28c840" }}
          />
        </div>

        <span className="text-xs font-black shrink-0 hidden sm:inline" style={{ color: "rgba(42,36,23,0.55)" }}>
          이펍공장
        </span>

        <FileMenu
          projects={projects}
          currentProjectId={currentProjectId}
          onOpenMenu={onRefreshProjects}
          onNew={onNewProject}
          onSave={onSaveProject}
          onSaveAs={onSaveAsProject}
          onOpenProject={onOpenProject}
          onImportDocx={onImportDocx}
        />

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
          <button
            onClick={onToggleFindReplace}
            className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
            style={{
              background: findReplaceOpen ? "rgba(79,70,229,0.15)" : "rgba(0,0,0,0.045)",
              color: findReplaceOpen ? "#4f46e5" : "rgba(42,36,23,0.6)",
            }}
            aria-label="찾아 바꾸기"
            title="찾아 바꾸기"
          >
            🔍
          </button>
        </div>

        <div className="flex-1" />

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

      {/* 책 제목/부제 요약 — 누르면 아래 상세 정보 패널이 열린다 */}
      <button onClick={() => setShowMeta(v => !v)} className="w-full text-left px-3 sm:px-4 pt-1.5 pb-2.5">
        <p className="text-sm font-black truncate" style={{ color: "#2a2417" }}>{title || "제목 없는 책"}</p>
        <p className="text-[11px] truncate" style={{ color: "rgba(42,36,23,0.45)" }}>
          {subtitle || author || "책 정보 편집"}
        </p>
      </button>

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
            <div className="flex gap-2">
              <input
                value={author}
                onChange={e => onChangeAuthor(e.target.value)}
                placeholder="지은이"
                className="flex-1 min-w-0 bg-transparent outline-none text-sm border-b pb-1"
                style={{ color: "rgba(42,36,23,0.78)", borderColor: "rgba(0,0,0,0.12)" }}
              />
              <input
                value={publisher}
                onChange={e => onChangePublisher(e.target.value)}
                placeholder="출판사(선택)"
                className="flex-1 min-w-0 bg-transparent outline-none text-sm border-b pb-1"
                style={{ color: "rgba(42,36,23,0.78)", borderColor: "rgba(0,0,0,0.12)" }}
              />
            </div>
            <div className="flex gap-2">
              <input
                value={date}
                onChange={e => onChangeDate(e.target.value)}
                placeholder="발행일 (자유 형식)"
                className="flex-1 min-w-0 bg-transparent outline-none text-xs border-b pb-1"
                style={{ color: "rgba(42,36,23,0.65)", borderColor: "rgba(0,0,0,0.12)" }}
              />
              <input
                value={isbn}
                onChange={e => onChangeIsbn(e.target.value)}
                placeholder="ISBN(선택)"
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
            <textarea
              value={description}
              onChange={e => onChangeDescription(e.target.value)}
              placeholder="책 소개(선택) — EPUB 파일 정보에 들어갑니다"
              rows={2}
              className="w-full bg-transparent outline-none resize-none text-xs border-b pb-1"
              style={{ color: "rgba(42,36,23,0.65)", borderColor: "rgba(0,0,0,0.12)" }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

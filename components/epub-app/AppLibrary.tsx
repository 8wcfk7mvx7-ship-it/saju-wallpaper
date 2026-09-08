"use client";
import { useCallback, useEffect, useState } from "react";
import { deleteProject, listProjects, loadDraft, type ProjectMeta } from "@/lib/epub/storage";

interface Props {
  /** 아이패드는 한 줄에 더 많은 책을 놓는다. */
  wide?: boolean;
  onOpenProject: (id: string) => void;
  /** 저장 이름을 붙이지 않고 편집 중이던 원고를 이어서 연다. */
  onContinueDraft: () => void;
  onNewBook: () => void;
  onOpenSettings: () => void;
}

/** 앱 홈 화면: 저장한 책들을 표지와 함께 보여준다. */
export default function AppLibrary({ wide = false, onOpenProject, onContinueDraft, onNewBook, onOpenSettings }: Props) {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [draftTitle, setDraftTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    return Promise.all([listProjects(), loadDraft()]).then(([list, draft]) => {
      setProjects(list);
      // 아직 이름 붙여 저장하지 않았지만 쓰던 원고가 있으면 "이어서 쓰기"로 보여준다.
      const hasContent = draft?.chapters.some(c => c.blocks.length > 0);
      setDraftTitle(hasContent ? (draft?.title || "제목 없는 책") : null);
      setLoading(false);
    });
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  async function handleDelete(project: ProjectMeta) {
    if (!confirm(`"${project.name}"을(를) 삭제할까요? 되돌릴 수 없어요.`)) return;
    await deleteProject(project.id);
    refresh();
  }

  return (
    <div className="h-full flex flex-col" style={{ background: "#f7f1e3", color: "#2a2417" }}>
      <header
        className="shrink-0 flex items-center justify-between px-5"
        style={{ height: 60, borderBottom: "1px solid rgba(0,0,0,0.07)" }}
      >
        <h1 className="text-[20px] font-black">내 책장</h1>
        <button
          onClick={onOpenSettings}
          aria-label="설정"
          className="w-9 h-9 rounded-full flex items-center justify-center text-[17px]"
          style={{ background: "rgba(0,0,0,0.05)" }}
        >
          ⚙
        </button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-none px-5 py-5">
        {/* 아이패드에서는 너무 넓게 퍼지지 않도록 가운데로 모은다. */}
        <div className={wide ? "mx-auto w-full" : ""} style={wide ? { maxWidth: 720 } : undefined}>
        {/* 새 책 만들기 / 이어서 쓰기 */}
        <div className="space-y-2.5 mb-6">
          <button
            onClick={onNewBook}
            className="w-full rounded-2xl py-4 font-bold text-[15px] transition-transform active:scale-[0.99]"
            style={{ background: "#2a2417", color: "#fff" }}
          >
            + 새 책 만들기
          </button>
          {draftTitle && (
            <button
              onClick={onContinueDraft}
              className="w-full rounded-2xl py-3.5 font-bold text-[14px] text-left px-4 transition-transform active:scale-[0.99]"
              style={{ background: "#fffdf7", border: "1px solid rgba(0,0,0,0.1)" }}
            >
              <span style={{ color: "rgba(42,36,23,0.5)" }}>이어서 쓰기 · </span>
              {draftTitle}
            </button>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-center py-10" style={{ color: "rgba(42,36,23,0.4)" }}>불러오는 중…</p>
        ) : projects.length === 0 ? (
          <div className="text-center py-14">
            <div className="text-[40px] mb-3">📚</div>
            <p className="text-sm font-bold mb-1">아직 저장한 책이 없어요</p>
            <p className="text-[13px]" style={{ color: "rgba(42,36,23,0.45)" }}>
              새 책을 만들고 편집기에서 저장하면
              <br />
              여기에 모입니다.
            </p>
          </div>
        ) : (
          <>
            <p className="text-[11px] font-black mb-2.5 px-1" style={{ color: "rgba(42,36,23,0.45)" }}>
              저장한 책 {projects.length}권
            </p>
            <div className={`grid gap-3 ${wide ? "grid-cols-3" : "grid-cols-2"}`}>
              {projects.map(project => (
                <div
                  key={project.id}
                  className="rounded-2xl overflow-hidden"
                  style={{ background: "#fffdf7", border: "1px solid rgba(0,0,0,0.09)" }}
                >
                  <button onClick={() => onOpenProject(project.id)} className="w-full text-left">
                    <div
                      className="w-full flex items-center justify-center"
                      style={{ aspectRatio: "3 / 4", background: "rgba(0,0,0,0.04)" }}
                    >
                      {project.coverImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={project.coverImage} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[26px]" style={{ opacity: 0.25 }}>📖</span>
                      )}
                    </div>
                    <div className="px-3 pt-2.5 pb-2">
                      <p className="text-[13px] font-bold truncate">{project.name || "제목 없는 책"}</p>
                      <p className="text-[11px] truncate" style={{ color: "rgba(42,36,23,0.45)" }}>
                        {project.author || "지은이 없음"}
                        {project.chapterCount ? ` · ${project.chapterCount}장` : ""}
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center justify-between px-3 pb-2.5">
                    <span className="text-[10px]" style={{ color: "rgba(42,36,23,0.35)" }}>
                      {formatDate(project.updatedAt)}
                    </span>
                    <button
                      onClick={() => handleDelete(project)}
                      className="text-[11px] font-bold px-2 py-1 rounded-lg"
                      style={{ color: "#b91c1c" }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  if (sameDay) return `오늘 ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

"use client";
import { useEffect, useRef, useState } from "react";
import type { ProjectMeta } from "@/lib/epub/storage";

interface Props {
  projects: ProjectMeta[];
  currentProjectId: string | null;
  onOpenMenu: () => void;
  onNew: () => void;
  onSave: () => void;
  onSaveAs: () => void;
  onOpenProject: (id: string) => void;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function FileMenu({ projects, currentProjectId, onOpenMenu, onNew, onSave, onSaveAs, onOpenProject }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function toggle() {
    if (!open) onOpenMenu();
    setOpen(v => !v);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        className="text-xs font-bold px-3 py-1.5 rounded-full"
        style={{ background: open ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.045)", color: "rgba(42,36,23,0.75)" }}
      >
        파일 ▾
      </button>
      {open && (
        <div
          className="absolute left-0 top-full mt-1 z-[150] rounded-xl overflow-hidden py-1 min-w-[220px]"
          style={{ background: "#fffdf7", border: "1px solid rgba(0,0,0,0.1)", boxShadow: "0 12px 32px rgba(0,0,0,0.25)" }}
        >
          <button
            onClick={() => { setOpen(false); onNew(); }}
            className="w-full text-left px-3.5 py-2 text-sm font-semibold hover:bg-black/5"
            style={{ color: "#2a2417" }}
          >
            새로 만들기
          </button>
          <button
            onClick={() => { setOpen(false); onSave(); }}
            className="w-full text-left px-3.5 py-2 text-sm font-semibold hover:bg-black/5"
            style={{ color: "#2a2417" }}
          >
            저장
          </button>
          <button
            onClick={() => { setOpen(false); onSaveAs(); }}
            className="w-full text-left px-3.5 py-2 text-sm font-semibold hover:bg-black/5"
            style={{ color: "#2a2417" }}
          >
            다른 이름으로 저장...
          </button>

          {projects.length > 0 && (
            <>
              <div className="my-1 border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }} />
              <p className="px-3.5 pt-1 pb-1 text-[10px] font-bold" style={{ color: "rgba(42,36,23,0.4)" }}>
                저장된 파일 열기
              </p>
              <div className="max-h-52 overflow-y-auto">
                {projects.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setOpen(false); onOpenProject(p.id); }}
                    className="w-full text-left px-3.5 py-1.5 text-sm hover:bg-black/5 flex items-center justify-between gap-2"
                    style={{ color: p.id === currentProjectId ? "#4f46e5" : "#2a2417", fontWeight: p.id === currentProjectId ? 700 : 500 }}
                  >
                    <span className="truncate">{p.name || "제목 없는 책"}</span>
                    <span className="text-[10px] shrink-0" style={{ color: "rgba(42,36,23,0.4)" }}>{formatDate(p.updatedAt)}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

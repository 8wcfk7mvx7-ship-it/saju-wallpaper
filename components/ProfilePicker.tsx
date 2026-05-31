"use client";
import { useEffect, useState } from "react";
import { isLoggedIn, getProfiles, deleteProfile, formatProfile, SavedProfile } from "@/lib/profileUtils";

interface Props {
  onSelect: (p: SavedProfile) => void;
}

export default function ProfilePicker({ onSelect }: Props) {
  const [loggedIn, setLoggedIn] = useState(false);
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const li = isLoggedIn();
    setLoggedIn(li);
    if (li) setProfiles(getProfiles());
  }, []);

  if (!loggedIn || profiles.length === 0) return null;

  function handleDelete(i: number, e: React.MouseEvent) {
    e.stopPropagation();
    deleteProfile(i);
    setProfiles(getProfiles());
  }

  return (
    <div className="mb-5 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(201,168,76,0.25)", background: "rgba(201,168,76,0.04)" }}>
      {/* 헤더 */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">📋</span>
          <span className="text-sm font-bold" style={{ color: "rgba(255,255,255,0.75)" }}>
            저장된 생년월일
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded-full font-bold"
            style={{ background: "rgba(201,168,76,0.2)", color: "#c9a84c" }}>
            {profiles.length}
          </span>
        </div>
        <span className="text-xs transition-transform" style={{ color: "rgba(255,255,255,0.3)", display: "inline-block", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {profiles.map((p, i) => (
            <div key={i}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}
              onClick={() => onSelect(p)}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
                style={{ background: p.gender === "male" ? "rgba(96,165,250,0.15)" : "rgba(244,114,182,0.15)" }}>
                {p.gender === "male" ? "♂" : "♀"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-white truncate">{p.label || p.name || "이름 없음"}</p>
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.4)" }}>{formatProfile(p)}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] px-2 py-1 rounded-lg font-bold"
                  style={{ background: "rgba(201,168,76,0.15)", color: "#c9a84c" }}>
                  불러오기
                </span>
                <button
                  onClick={e => handleDelete(i, e)}
                  className="text-[10px] px-1.5 py-1 rounded-lg transition-colors"
                  style={{ color: "rgba(255,255,255,0.2)", background: "rgba(255,255,255,0.04)" }}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

"use client";
import { useEffect, useState } from "react";
import { isLoggedIn, getProfiles, SavedProfile } from "@/lib/profileUtils";
import { BirthFormData } from "@/components/BirthInputForm";

interface Props {
  onLoad: (data: Partial<BirthFormData>) => void;
}

export default function ProfileLoadSheet({ onLoad }: Props) {
  const [show, setShow] = useState(false);
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) return;
    const saved = getProfiles();
    if (saved.length === 0) return;
    setProfiles(saved);
    // 살짝 딜레이 후 툭 올라오게
    const t = setTimeout(() => setShow(true), 600);
    return () => clearTimeout(t);
  }, []);

  if (dismissed || profiles.length === 0) return null;

  function handleSelect(p: SavedProfile) {
    onLoad({
      birthYear: p.birthYear,
      birthMonth: p.birthMonth,
      birthDay: p.birthDay,
      birthHour: p.birthHourUnknown ? null : (p.birthHour === -1 ? null : p.birthHour),
      birthMinute: null,
      gender: p.gender,
    });
    setDismissed(true);
  }

  return (
    <>
      {/* 딤 배경 */}
      {show && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={() => setDismissed(true)}
        />
      )}

      {/* 바텀시트 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out"
        style={{ transform: show ? "translateY(0)" : "translateY(100%)" }}
      >
        <div className="rounded-t-3xl px-5 pt-5 pb-8 max-w-lg mx-auto"
          style={{ background: "#0f0a1e", border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none" }}>
          {/* 핸들 */}
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "rgba(255,255,255,0.2)" }} />

          <p className="text-base font-black text-white mb-1">저장된 사주를 불러오시겠어요?</p>
          <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
            저장된 프로필을 선택하면 자동으로 입력됩니다
          </p>

          <div className="space-y-2 mb-4">
            {profiles.slice(0, 5).map((p, i) => (
              <button
                key={i}
                onClick={() => handleSelect(p)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all active:scale-[0.98]"
                style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                <span className="text-xl shrink-0">👤</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {p.label || p.name || "저장된 프로필"}
                  </p>
                  <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {p.birthYear}.{String(p.birthMonth).padStart(2,"0")}.{String(p.birthDay).padStart(2,"0")}
                    {" · "}
                    {p.gender === "female" ? "여성" : "남성"}
                    {!p.birthHourUnknown && p.birthHour !== -1 ? ` · ${p.birthHour}시` : ""}
                  </p>
                </div>
                <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 18 }}>→</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setDismissed(true)}
            className="w-full py-3 rounded-2xl text-sm font-semibold transition-all"
            style={{ background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            직접 입력할게요
          </button>
        </div>
      </div>
    </>
  );
}

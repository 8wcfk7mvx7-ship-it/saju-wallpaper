"use client";
import { useEffect, useRef, useState } from "react";
import { getProfiles, saveProfile, deleteProfile, type SavedProfile } from "@/lib/profileUtils";
import { type BirthFormData } from "@/components/BirthInputForm";

interface Props {
  onLoad: (data: Partial<BirthFormData>) => void;
  currentData?: BirthFormData;
}

function canSave(d?: BirthFormData): boolean {
  if (!d) return false;
  return !!d.birthYear && !!d.birthMonth && !!d.birthDay;
}

export default function ProfileLoadSheet({ onLoad, currentData }: Props) {
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<SavedProfile[]>([]);
  const [saveLabel, setSaveLabel] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) setProfiles(getProfiles());
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowSaveForm(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function handleLoad(p: SavedProfile) {
    onLoad({
      name: p.name || "",
      birthYear: p.birthYear,
      birthMonth: p.birthMonth,
      birthDay: p.birthDay,
      birthHour: p.birthHourUnknown ? null : (p.birthHour === -1 ? null : p.birthHour),
      birthMinute: null,
      gender: p.gender,
    });
    setOpen(false);
    setShowSaveForm(false);
  }

  function handleDelete(idx: number) {
    deleteProfile(idx);
    setProfiles(getProfiles());
  }

  function handleSave() {
    if (!currentData || !canSave(currentData)) return;
    saveProfile({
      name: currentData.name || saveLabel || "저장된 사주",
      label: saveLabel || currentData.name || undefined,
      birthYear: currentData.birthYear as number,
      birthMonth: currentData.birthMonth as number,
      birthDay: currentData.birthDay as number,
      birthHour: currentData.birthHour ?? -1,
      birthHourUnknown: currentData.birthHour === null,
      gender: currentData.gender,
    });
    setProfiles(getProfiles());
    setSaveLabel("");
    setShowSaveForm(false);
  }

  return (
    <>
      {/* 플로팅 불러오기 버튼 */}
      <button
        onClick={() => { setOpen(true); setShowSaveForm(false); }}
        className="fixed bottom-24 right-4 z-30 flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold shadow-lg transition-all active:scale-95"
        style={{
          background: "rgba(15,10,30,0.92)",
          border: "1px solid rgba(124,58,237,0.35)",
          color: "rgba(196,181,253,0.9)",
          backdropFilter: "blur(12px)",
        }}
      >
        <span style={{ fontSize: 14 }}>👤</span>
        불러오기
      </button>

      {/* 오버레이 */}
      {open && (
        <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.5)" }} />
      )}

      {/* 바텀시트 */}
      <div
        ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300 ease-out"
        style={{ transform: open ? "translateY(0)" : "translateY(110%)" }}
      >
        <div
          className="mx-auto max-w-lg rounded-t-3xl px-5 pt-4 pb-8"
          style={{ background: "#0f0a1e", border: "1px solid rgba(255,255,255,0.1)", borderBottom: "none" }}
        >
          {/* 핸들 */}
          <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ background: "rgba(255,255,255,0.2)" }} />

          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-black text-white">생년월일 불러오기</p>
            <button
              onClick={() => { setOpen(false); setShowSaveForm(false); }}
              className="text-xs px-3 py-1.5 rounded-xl"
              style={{ color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)" }}
            >
              닫기
            </button>
          </div>

          {/* 저장된 프로필 목록 */}
          <div
            className="space-y-2 mb-3"
            style={{ maxHeight: 220, overflowY: "auto" }}
          >
            {profiles.length === 0 ? (
              <p className="text-center text-xs py-5" style={{ color: "rgba(255,255,255,0.3)" }}>
                저장된 사주가 없어요
              </p>
            ) : (
              profiles.map((p, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
                >
                  <button
                    onClick={() => handleLoad(p)}
                    className="flex-1 flex items-center gap-3 text-left min-w-0"
                  >
                    <span className="text-xl shrink-0">
                      {p.gender === "female" ? "👩" : "👨"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">
                        {p.label || p.name || "저장된 사주"}
                      </p>
                      <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {p.birthYear}.{String(p.birthMonth).padStart(2, "0")}.{String(p.birthDay).padStart(2, "0")}
                        {" · "}{p.gender === "female" ? "여" : "남"}
                        {!p.birthHourUnknown && p.birthHour !== -1 ? ` · ${p.birthHour}시` : ""}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleDelete(i)}
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs"
                    style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {/* 현재 입력 저장 */}
          {canSave(currentData) && !showSaveForm && (
            <button
              onClick={() => setShowSaveForm(true)}
              className="w-full py-3 rounded-2xl text-sm font-bold transition-all active:scale-[0.98]"
              style={{
                background: "rgba(124,58,237,0.15)",
                border: "1px solid rgba(124,58,237,0.35)",
                color: "#c4b5fd",
              }}
            >
              + 현재 입력 저장하기
            </button>
          )}

          {showSaveForm && (
            <div
              className="rounded-2xl px-4 py-3 space-y-2"
              style={{ background: "rgba(124,58,237,0.1)", border: "1px solid rgba(124,58,237,0.25)" }}
            >
              <p className="text-xs font-bold" style={{ color: "#c4b5fd" }}>저장할 별칭 (선택)</p>
              <input
                type="text"
                value={saveLabel}
                onChange={e => setSaveLabel(e.target.value)}
                placeholder={currentData?.name || "예: 나, 엄마, 친구"}
                className="w-full px-3 py-2.5 rounded-xl text-sm text-white"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  outline: "none",
                }}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSaveForm(false)}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold"
                  style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" }}
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                  style={{ background: "rgba(124,58,237,0.4)", color: "#fff" }}
                >
                  저장
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

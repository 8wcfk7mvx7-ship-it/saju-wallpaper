"use client";
import { useState, useEffect } from "react";

export interface BirthProfile {
  id: string;
  name: string;
  gender: "male" | "female";
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthHour: string;
  birthMinute: string;
  birthPlace: string;
  calType: "solar" | "lunar";
  isLeapMonth: boolean;
  useJajasi: boolean;
}

const STORAGE_KEY = "sp_profiles";

function loadProfiles(): BirthProfile[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}

function saveProfiles(profiles: BirthProfile[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
}

export function useSaveProfile(data: Omit<BirthProfile, "id" | "name">) {
  const [saved, setSaved] = useState(false);
  function save(name: string) {
    const profiles = loadProfiles();
    const newProfile: BirthProfile = { ...data, id: Date.now().toString(), name };
    profiles.unshift(newProfile);
    if (profiles.length > 10) profiles.pop();
    saveProfiles(profiles);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }
  return { save, saved };
}

interface Props {
  onSelect: (profile: BirthProfile) => void;
  currentData?: Omit<BirthProfile, "id" | "name">;
}

export default function ProfileSaveModal({ onSelect, currentData }: Props) {
  const [open, setOpen] = useState(false);
  const [profiles, setProfiles] = useState<BirthProfile[]>([]);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSavedState] = useState(false);

  useEffect(() => {
    if (open) setProfiles(loadProfiles());
  }, [open]);

  function handleSave() {
    if (!saveName.trim() || !currentData) return;
    const list = loadProfiles();
    list.unshift({ ...currentData, id: Date.now().toString(), name: saveName.trim() });
    if (list.length > 10) list.pop();
    saveProfiles(list);
    setProfiles(list);
    setSaveName("");
    setSavedState(true);
    setTimeout(() => setSavedState(false), 2000);
  }

  function handleDelete(id: string) {
    const list = loadProfiles().filter(p => p.id !== id);
    saveProfiles(list);
    setProfiles(list);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl transition"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)" }}
      >
        📂 프로필
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ background: "rgba(0,0,0,0.7)" }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}>
          <div className="w-full max-w-sm rounded-t-3xl px-5 pb-8 pt-6 space-y-4"
            style={{ background: "#0e0e1a", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">생년월일 프로필</h3>
              <button onClick={() => setOpen(false)} className="text-gray-500 text-lg">✕</button>
            </div>

            {/* 저장 */}
            {currentData && (
              <div className="space-y-2">
                <p className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>현재 입력 저장</p>
                <div className="flex gap-2">
                  <input
                    value={saveName}
                    onChange={e => setSaveName(e.target.value)}
                    placeholder="이름 입력 (예: 나, 엄마)"
                    className="flex-1 rounded-xl px-3 py-2 text-sm outline-none"
                    style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", color: "#fff" }}
                  />
                  <button
                    onClick={handleSave}
                    disabled={!saveName.trim() || saved}
                    className="px-4 py-2 rounded-xl text-sm font-bold transition"
                    style={{ background: saved ? "rgba(52,211,153,0.2)" : "rgba(99,102,241,0.3)", border: `1px solid ${saved ? "rgba(52,211,153,0.5)" : "rgba(99,102,241,0.5)"}`, color: saved ? "#34d399" : "#818cf8" }}
                  >
                    {saved ? "✓" : "저장"}
                  </button>
                </div>
              </div>
            )}

            {/* 저장된 프로필 목록 */}
            {profiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>저장된 프로필</p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {profiles.map(p => (
                    <div key={p.id} className="flex items-center gap-3 rounded-xl px-3 py-2.5"
                      style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{p.name}</p>
                        <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.4)" }}>
                          {p.birthYear}.{p.birthMonth}.{p.birthDay} {p.gender === "male" ? "남" : "여"}
                        </p>
                      </div>
                      <button onClick={() => { onSelect(p); setOpen(false); }}
                        className="text-xs px-3 py-1 rounded-lg font-bold"
                        style={{ background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "#818cf8" }}>
                        불러오기
                      </button>
                      <button onClick={() => handleDelete(p.id)}
                        className="text-xs px-2 py-1 rounded-lg"
                        style={{ color: "rgba(255,255,255,0.25)" }}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {profiles.length === 0 && !currentData && (
              <p className="text-sm text-center py-4" style={{ color: "rgba(255,255,255,0.3)" }}>저장된 프로필이 없습니다</p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

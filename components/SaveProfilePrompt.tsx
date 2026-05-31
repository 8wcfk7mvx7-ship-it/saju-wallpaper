"use client";
import { useState, useEffect } from "react";
import { isLoggedIn, isDuplicate, saveProfile, SavedProfile } from "@/lib/profileUtils";

interface Props {
  name: string;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number | null;
  birthHourUnknown: boolean;
  gender: "male" | "female";
}

export default function SaveProfilePrompt({ name, birthYear, birthMonth, birthDay, birthHour, birthHourUnknown, gender }: Props) {
  const [show, setShow] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) return;
    if (isDuplicate(birthYear, birthMonth, birthDay)) return;
    setShow(true);
  }, [birthYear, birthMonth, birthDay]);

  if (!show) return null;

  function handleSave() {
    const profile: Omit<SavedProfile, "savedAt"> = {
      name: name || "",
      birthYear, birthMonth, birthDay,
      birthHour: birthHour ?? -1,
      birthHourUnknown: birthHourUnknown || birthHour == null,
      gender,
    };
    saveProfile(profile);
    setSaved(true);
    setTimeout(() => setShow(false), 1800);
  }

  return (
    <div className="mt-4 px-4 py-3 rounded-2xl flex items-center gap-3"
      style={{ background: "rgba(201,168,76,0.07)", border: "1px solid rgba(201,168,76,0.2)" }}>
      {saved ? (
        <>
          <span className="text-base">✅</span>
          <p className="text-sm font-bold flex-1" style={{ color: "#c9a84c" }}>보관함에 저장됐습니다!</p>
        </>
      ) : (
        <>
          <span className="text-base">💾</span>
          <p className="text-xs flex-1 leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
            이 생년월일을 저장해두면<br />다음에 바로 불러올 수 있어요
          </p>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={handleSave}
              className="text-xs px-3 py-1.5 rounded-xl font-bold transition-all"
              style={{ background: "rgba(201,168,76,0.2)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.3)" }}>
              저장
            </button>
            <button onClick={() => setShow(false)}
              className="text-xs px-2 py-1.5 rounded-xl transition-all"
              style={{ color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.04)" }}>
              닫기
            </button>
          </div>
        </>
      )}
    </div>
  );
}

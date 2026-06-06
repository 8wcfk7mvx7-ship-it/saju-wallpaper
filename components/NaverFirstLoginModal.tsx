"use client";
import { useEffect, useState } from "react";

interface NaverUser {
  naverId: string;
  nickname: string;
  isNewUser?: boolean;
}

function parseUser(): NaverUser | null {
  try {
    const match = document.cookie.split(";").find(c => c.trim().startsWith("sp_user="));
    if (!match) return null;
    const encoded = match.trim().split("=")[1];
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1920 + 1 }, (_, i) => CURRENT_YEAR - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = [0, 10, 20, 30, 40, 50];

export default function NaverFirstLoginModal() {
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const [name, setName] = useState("");
  const [birthYear, setBirthYear] = useState(1990);
  const [birthMonth, setBirthMonth] = useState(1);
  const [birthDay, setBirthDay] = useState(1);
  const [birthHour, setBirthHour] = useState(0);
  const [birthMinute, setBirthMinute] = useState(0);
  const [birthHourUnknown, setBirthHourUnknown] = useState(false);
  const [birthPlace, setBirthPlace] = useState("서울");
  const [calendarType, setCalendarType] = useState<"양력" | "음력">("양력");

  useEffect(() => {
    const user = parseUser();
    if (user?.isNewUser) {
      setShow(true);
    }
  }, []);

  if (!show) return null;

  async function handleSave() {
    setSaving(true);
    try {
      await fetch("/api/auth/naver/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          birthYear,
          birthMonth,
          birthDay,
          birthHour,
          birthMinute,
          birthHourUnknown,
          birthPlace,
          calendarType,
        }),
      });
      setDone(true);
      setTimeout(() => setShow(false), 1500);
    } catch {
      setSaving(false);
    }
  }

  function handleSkip() {
    // isNewUser 플래그만 제거
    fetch("/api/auth/naver/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skip: true, name: "", birthYear: 0, birthMonth: 0, birthDay: 0, birthHour: 0, birthMinute: 0, birthHourUnknown: true, birthPlace: "", calendarType: "양력" }),
    }).catch(() => {});
    setShow(false);
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}>
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-6 pb-8 overflow-y-auto max-h-[90vh]"
        style={{ background: "#0d0d1a", border: "1px solid rgba(255,255,255,0.1)" }}>

        {done ? (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">✅</p>
            <p className="text-base font-black text-white">저장 완료!</p>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>사주 분석에 바로 활용할 수 있어요</p>
          </div>
        ) : (
          <>
            <div className="mb-5">
              <p className="text-lg font-black text-white mb-1">처음 오셨군요!</p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                생년월일을 저장해두면 매번 입력하지 않아도 돼요.<br />
                지금 저장하거나 나중에 보관함에서 추가할 수 있어요.
              </p>
            </div>

            <div className="space-y-4">
              {/* 이름 */}
              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>이름 (선택)</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="예: 홍길동"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                />
              </div>

              {/* 양력/음력 */}
              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>양력/음력</label>
                <div className="flex gap-2">
                  {(["양력", "음력"] as const).map(t => (
                    <button key={t} onClick={() => setCalendarType(t)}
                      className="flex-1 py-2 rounded-xl text-sm font-bold transition-all"
                      style={{
                        background: calendarType === t ? "rgba(201,168,76,0.2)" : "rgba(255,255,255,0.05)",
                        color: calendarType === t ? "#e8c97a" : "rgba(255,255,255,0.4)",
                        border: `1px solid ${calendarType === t ? "rgba(201,168,76,0.4)" : "rgba(255,255,255,0.08)"}`,
                      }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* 생년 */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>년</label>
                  <select value={birthYear} onChange={e => setBirthYear(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none appearance-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    {YEARS.map(y => <option key={y} value={y} style={{ background: "#0d0d1a" }}>{y}년</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>월</label>
                  <select value={birthMonth} onChange={e => setBirthMonth(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none appearance-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    {MONTHS.map(m => <option key={m} value={m} style={{ background: "#0d0d1a" }}>{m}월</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>일</label>
                  <select value={birthDay} onChange={e => setBirthDay(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none appearance-none"
                    style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                    {DAYS.map(d => <option key={d} value={d} style={{ background: "#0d0d1a" }}>{d}일</option>)}
                  </select>
                </div>
              </div>

              {/* 태어난 시각 */}
              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>태어난 시각 (선택)</label>
                <div className="flex items-center gap-2 mb-2">
                  <button onClick={() => setBirthHourUnknown(v => !v)}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
                    style={{
                      background: birthHourUnknown ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.05)",
                      color: birthHourUnknown ? "#e8c97a" : "rgba(255,255,255,0.35)",
                      border: `1px solid ${birthHourUnknown ? "rgba(201,168,76,0.3)" : "rgba(255,255,255,0.08)"}`,
                    }}>
                    {birthHourUnknown ? "✓" : ""} 모름
                  </button>
                </div>
                {!birthHourUnknown && (
                  <div className="grid grid-cols-2 gap-2">
                    <select value={birthHour} onChange={e => setBirthHour(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none appearance-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                      {HOURS.map(h => <option key={h} value={h} style={{ background: "#0d0d1a" }}>{h}시</option>)}
                    </select>
                    <select value={birthMinute} onChange={e => setBirthMinute(Number(e.target.value))}
                      className="w-full px-3 py-2.5 rounded-xl text-sm text-white focus:outline-none appearance-none"
                      style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}>
                      {MINUTES.map(m => <option key={m} value={m} style={{ background: "#0d0d1a" }}>{m}분</option>)}
                    </select>
                  </div>
                )}
              </div>

              {/* 출생지 */}
              <div>
                <label className="text-xs font-bold mb-1.5 block" style={{ color: "rgba(255,255,255,0.5)" }}>출생지 (선택)</label>
                <input
                  value={birthPlace}
                  onChange={e => setBirthPlace(e.target.value)}
                  placeholder="예: 서울, 부산, 해외"
                  className="w-full px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none focus:border-amber-500/50"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)" }}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSkip}
                className="flex-1 py-3 rounded-2xl text-sm font-bold transition-all"
                style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
                나중에
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-[2] py-3 rounded-2xl text-sm font-black text-white transition-all disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #c9a84c, #e8c97a)" }}>
                {saving ? "저장 중..." : "저장하기"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

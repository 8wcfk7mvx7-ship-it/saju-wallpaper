"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBalance, addBalance, getKstDateString } from "@/lib/blueberry";

const REWARD = 1;
const STORAGE_KEY = "sp_attendance";

function parseUser() {
  try {
    const match = document.cookie.split(";").find(c => c.trim().startsWith("sp_user="));
    if (!match) return null;
    const encoded = match.trim().split("=")[1];
    return JSON.parse(atob(encoded));
  } catch { return null; }
}

interface AttendanceData {
  lastDate: string;
  streak: number;
}

function loadAttendance(): AttendanceData {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (raw && typeof raw.lastDate === "string" && typeof raw.streak === "number") return raw;
  } catch {}
  return { lastDate: "", streak: 0 };
}

export default function AttendancePage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [balance, setBalance] = useState(0);
  const [data, setData] = useState<AttendanceData>({ lastDate: "", streak: 0 });
  const [justEarned, setJustEarned] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!parseUser());
    setBalance(getBalance());
    setData(loadAttendance());
  }, []);

  const today = getKstDateString();
  const alreadyChecked = data.lastDate === today;

  function checkIn() {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }
    if (alreadyChecked) return;

    const next = addBalance(REWARD);
    setBalance(next);

    const isConsecutive = (() => {
      if (!data.lastDate) return false;
      const prev = new Date(data.lastDate + "T00:00:00Z");
      const cur = new Date(today + "T00:00:00Z");
      return (cur.getTime() - prev.getTime()) === 24 * 60 * 60 * 1000;
    })();
    const nextData: AttendanceData = {
      lastDate: today,
      streak: isConsecutive ? data.streak + 1 : 1,
    };
    setData(nextData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextData));
    setJustEarned(true);
  }

  return (
    <main className="min-h-screen bg-[#06060e] text-white flex flex-col">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full bg-indigo-950/60 blur-[220px]" />
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-violet-950/40 blur-[180px]" />
      </div>

      <div className="relative z-10 flex items-center gap-3 px-5 pt-5">
        <button onClick={() => router.back()}
          className="text-xs text-gray-600 hover:text-gray-400 transition px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          ← 뒤로
        </button>
      </div>

      <div className="relative z-10 max-w-md mx-auto w-full px-5 pt-10 pb-24">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">📅</div>
          <h1 className="text-2xl font-black mb-1">출석체크</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            하루 한 번 출석체크하고 <span style={{ color: "#a78bfa" }}>✦ {REWARD}</span> 별조각을 받아보세요.
          </p>
        </div>

        <div className="rounded-2xl p-5 mb-6 text-center"
          style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.25)" }}>
          <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>현재 잔액</p>
          <p className="text-3xl font-black" style={{ color: "#a78bfa" }}>
            ✦ {balance.toLocaleString()}
          </p>
          <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>별조각</p>
        </div>

        {justEarned && (
          <div className="rounded-2xl p-4 mb-6 text-center"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <p className="text-sm font-bold" style={{ color: "#6ee7b7" }}>
              ✓ 출석체크 완료! ✦ {REWARD} 별조각이 적립되었습니다.
            </p>
          </div>
        )}

        <div className="rounded-2xl p-6 mb-6 text-center"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="text-4xl mb-3">{alreadyChecked ? "✅" : "✦"}</div>
          <p className="text-sm font-bold mb-1">
            {!isLoggedIn
              ? "로그인 후 출석체크를 이용할 수 있어요"
              : alreadyChecked
              ? "오늘 출석체크를 완료했어요"
              : "오늘의 출석체크를 진행해주세요"}
          </p>
          <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
            연속 출석 {data.streak}일째 · 1회당 ✦ {REWARD} 적립
          </p>
          <button
            onClick={checkIn}
            disabled={isLoggedIn && alreadyChecked}
            className="w-full py-4 rounded-2xl font-black text-base transition-all"
            style={{
              background: (!isLoggedIn || !alreadyChecked) ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.07)",
              color: (!isLoggedIn || !alreadyChecked) ? "#fff" : "rgba(255,255,255,0.25)",
              boxShadow: (!isLoggedIn || !alreadyChecked) ? "0 8px 28px rgba(99,102,241,0.4)" : "none",
              cursor: (!isLoggedIn || !alreadyChecked) ? "pointer" : "not-allowed",
            }}
          >
            {!isLoggedIn ? "로그인하고 출석체크하기" : alreadyChecked ? "내일 다시 출석체크해주세요" : "출석체크하기"}
          </button>
        </div>

        <div className="rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-xs font-bold mb-2 text-white">이용 안내</p>
          <div className="space-y-1.5">
            {[
              "출석체크는 한국 시간(KST) 기준으로 운영됩니다.",
              "한국시간 00:00~23:59 사이에 1회 출석체크하면 ✦ 1 별조각이 적립됩니다.",
              "하루에 한 번만 출석체크가 가능하며, 다음 날 00:00(한국시간)에 초기화됩니다.",
              "적립된 별조각은 모든 유료 서비스에 동일하게 사용할 수 있습니다.",
            ].map(t => (
              <div key={t} className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full mt-1.5 shrink-0" style={{ background: "rgba(201,168,76,0.5)" }} />
                <span className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{t}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

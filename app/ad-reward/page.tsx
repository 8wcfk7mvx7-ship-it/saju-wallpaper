"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBalance, addBalance } from "@/lib/blueberry";

const REWARD = 50;
const MAX_PER_DAY = 5;
const AD_SECONDS = 15;
const STORAGE_KEY = "sp_ad_reward";

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function getTodayCount(): number {
  if (typeof window === "undefined") return 0;
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return raw.date === todayKey() ? (raw.count || 0) : 0;
  } catch {
    return 0;
  }
}

function bumpTodayCount(): number {
  const next = getTodayCount() + 1;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: todayKey(), count: next }));
  return next;
}

export default function AdRewardPage() {
  const router = useRouter();
  const [balance, setBalance] = useState(0);
  const [todayCount, setTodayCount] = useState(0);
  const [status, setStatus] = useState<"idle" | "watching" | "done">("idle");
  const [secondsLeft, setSecondsLeft] = useState(AD_SECONDS);
  const [justEarned, setJustEarned] = useState<number | null>(null);

  useEffect(() => {
    setBalance(getBalance());
    setTodayCount(getTodayCount());
  }, []);

  useEffect(() => {
    if (status !== "watching") return;
    if (secondsLeft <= 0) {
      const next = addBalance(REWARD);
      setBalance(next);
      setTodayCount(bumpTodayCount());
      setJustEarned(REWARD);
      setStatus("done");
      return;
    }
    const t = setTimeout(() => setSecondsLeft(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [status, secondsLeft]);

  const remaining = Math.max(0, MAX_PER_DAY - todayCount);
  const canWatch = remaining > 0;

  function startWatching() {
    if (!canWatch) return;
    setJustEarned(null);
    setSecondsLeft(AD_SECONDS);
    setStatus("watching");
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

      <div className="relative z-10 max-w-2xl mx-auto w-full px-5 pt-10 pb-24">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🎬</div>
          <h1 className="text-2xl font-black mb-1">광고 보고 별조각 받기</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
            짧은 광고 한 편 보고 <span style={{ color: "#a78bfa" }}>✦ {REWARD}</span> 별조각을 받아보세요.
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

        {justEarned !== null && (
          <div className="rounded-2xl p-4 mb-6 text-center"
            style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.3)" }}>
            <p className="text-sm font-bold" style={{ color: "#6ee7b7" }}>
              ✓ 광고 시청 완료! ✦ {justEarned} 별조각이 적립되었습니다.
            </p>
          </div>
        )}

        {/* 광고 시청 영역 */}
        <div className="rounded-2xl p-6 mb-6 text-center"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
          {status === "watching" ? (
            <div>
              <div className="text-4xl mb-3">📺</div>
              <p className="text-sm font-bold mb-3">광고 재생 중...</p>
              <div className="w-full h-2 rounded-full overflow-hidden mb-2" style={{ background: "rgba(255,255,255,0.08)" }}>
                <div className="h-full transition-all duration-1000 ease-linear"
                  style={{
                    width: `${((AD_SECONDS - secondsLeft) / AD_SECONDS) * 100}%`,
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  }} />
              </div>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                {secondsLeft}초 후 보상이 지급됩니다
              </p>
            </div>
          ) : (
            <div>
              <div className="text-4xl mb-3">{canWatch ? "▶️" : "🌙"}</div>
              <p className="text-sm font-bold mb-1">
                {canWatch ? "오늘 광고를 시청하고 별조각을 받아보세요" : "오늘 받을 수 있는 별조각을 모두 받았어요"}
              </p>
              <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.35)" }}>
                오늘 {todayCount} / {MAX_PER_DAY}회 시청 완료 · 1회당 ✦ {REWARD} 적립
              </p>
              <button
                onClick={startWatching}
                disabled={!canWatch}
                className="w-full py-4 rounded-2xl font-black text-base transition-all"
                style={{
                  background: canWatch ? "linear-gradient(135deg, #6366f1, #8b5cf6)" : "rgba(255,255,255,0.07)",
                  color: canWatch ? "#fff" : "rgba(255,255,255,0.25)",
                  boxShadow: canWatch ? "0 8px 28px rgba(99,102,241,0.4)" : "none",
                  cursor: canWatch ? "pointer" : "not-allowed",
                }}
              >
                {canWatch ? "광고 시청하기" : `내일 다시 시도해주세요 (${MAX_PER_DAY}/${MAX_PER_DAY})`}
              </button>
            </div>
          )}
        </div>

        <div className="rounded-xl p-4"
          style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p className="text-xs font-bold mb-2 text-white">이용 안내</p>
          <div className="space-y-1.5">
            {[
              `광고 1회 시청 시 ✦ ${REWARD} 별조각이 즉시 적립됩니다.`,
              `하루 최대 ${MAX_PER_DAY}회까지 시청 가능합니다.`,
              "적립 횟수는 매일 자정에 초기화됩니다.",
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

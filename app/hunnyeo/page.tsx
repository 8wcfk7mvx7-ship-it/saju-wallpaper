"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORIES,
  TIPS,
  GUESTBOOK_SEED,
  CHECKED_STORAGE_KEY,
  GUESTBOOK_STORAGE_KEY,
  VISITED_STORAGE_KEY,
  type GuestbookEntry,
} from "@/lib/hunnyeoData";
import { loadJSON, saveJSON } from "@/lib/hunnyeoStorage";
import HunnyeoScoreBar from "@/components/HunnyeoScoreBar";

const RETRO_FONT = "'Malgun Gothic', 'Apple SD Gothic Neo', 'Gulim', sans-serif";
const bgStyle = {
  background: "linear-gradient(160deg, #ffe4f1 0%, #ffe9d6 35%, #e6e6ff 70%, #dff7ec 100%)",
  fontFamily: RETRO_FONT,
};

type Step = "loading" | "splash" | "menu";

export default function HunnyeoPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("loading");
  const [progress, setProgress] = useState(0);
  const [visitTotal, setVisitTotal] = useState(38471);
  const [visitToday, setVisitToday] = useState(48);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>(GUESTBOOK_SEED);
  const [gbName, setGbName] = useState("");
  const [gbMsg, setGbMsg] = useState("");

  // 로딩 진행 바
  useEffect(() => {
    if (step !== "loading") return;
    const start = Date.now();
    const duration = 1500;
    const timer = setInterval(() => {
      const pct = Math.min(100, Math.round(((Date.now() - start) / duration) * 100));
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timer);
        setTimeout(() => setStep("splash"), 200);
      }
    }, 60);
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 최초 마운트 시 localStorage에서 1회 하이드레이션
    setChecked(loadJSON(CHECKED_STORAGE_KEY, {} as Record<string, boolean>));
    setGuestbook(loadJSON(GUESTBOOK_STORAGE_KEY, GUESTBOOK_SEED));
    const visited = loadJSON<boolean>(VISITED_STORAGE_KEY, false);
    if (visited) {
      setVisitTotal(v => v + Math.floor(Math.random() * 30));
    }
  }, []);

  function handleEnter() {
    localStorage.setItem(VISITED_STORAGE_KEY, "true");
    setVisitTotal(v => v + 1);
    setVisitToday(v => v + 1);
    setStep("menu");
  }

  function submitGuestbook(e: React.FormEvent) {
    e.preventDefault();
    if (!gbName.trim() || !gbMsg.trim()) return;
    const entry: GuestbookEntry = {
      id: `gb-${Date.now()}`,
      name: gbName.trim().slice(0, 12),
      message: gbMsg.trim().slice(0, 200),
      date: new Date().toISOString().slice(0, 10).replace(/-/g, "."),
    };
    const next = [entry, ...guestbook];
    setGuestbook(next);
    saveJSON(GUESTBOOK_STORAGE_KEY, next);
    setGbName("");
    setGbMsg("");
  }

  const totalPoints = useMemo(
    () => TIPS.reduce((sum, t) => sum + (checked[t.id] ? t.points : 0), 0),
    [checked]
  );

  const categoryTiles = CATEGORIES.filter(c => c.key !== "all");
  const categoryProgress = useMemo(() => {
    const map: Record<string, { done: number; total: number }> = {};
    for (const c of categoryTiles) {
      const tips = TIPS.filter(t => t.category === c.key);
      map[c.key] = { done: tips.filter(t => checked[t.id]).length, total: tips.length };
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked]);

  // ── 로딩 화면 ─────────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-6 cursor-pointer"
        style={{ background: "#0a0a1a", fontFamily: "monospace" }}
        onClick={() => setStep("splash")}
      >
        <style>{`
          @keyframes hnBlink { 0%,45%,100% { opacity: 1 } 50%,95% { opacity: 0.15 } }
          .hn-blink { animation: hnBlink 1.3s step-end infinite; }
          @keyframes hnSpin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          .hn-spin { display:inline-block; animation: hnSpin 1.2s linear infinite; }
        `}</style>
        <div className="w-full max-w-xs text-center">
          <p className="text-3xl mb-4 hn-spin">💾</p>
          <p className="text-sm font-bold mb-1" style={{ color: "#4ade80" }}>
            HUNNYEO-SAENGJEONG.NET
          </p>
          <p className="text-xs mb-6" style={{ color: "#94a3b8" }}>
            접속 중<span className="hn-blink">...</span> 잠시만 기다려주세요
          </p>
          <div className="h-3 rounded-full overflow-hidden mb-2" style={{ background: "#1e293b", border: "1px solid #334155" }}>
            <div className="h-full rounded-full" style={{ width: `${progress}%`, background: "linear-gradient(90deg, #ff8fb3, #4ade80)", transition: "width 60ms linear" }} />
          </div>
          <p className="text-[11px]" style={{ color: "#facc15" }}>{progress}%</p>
          <p className="text-[10px] mt-6" style={{ color: "#475569" }}>탭하면 바로 들어갈 수 있어요</p>
        </div>
      </main>
    );
  }

  // ── 스플래시(들어가기) ────────────────────────────────────────────────
  if (step === "splash") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-10" style={bgStyle}>
        <style>{`
          @keyframes hnBlink { 0%,45%,100% { opacity: 1 } 50%,95% { opacity: 0.15 } }
          @keyframes hnFloat { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-10px) rotate(4deg); } }
          .hn-blink { animation: hnBlink 1.3s step-end infinite; }
          .hn-float { animation: hnFloat 3.2s ease-in-out infinite; }
        `}</style>
        <div
          className="w-full max-w-sm rounded-[28px] p-6 text-center relative overflow-hidden"
          style={{ background: "#fff9fb", border: "4px dashed #ff9fc4", boxShadow: "0 20px 50px -20px rgba(255,111,165,0.5)" }}
        >
          <div className="absolute -top-2 -left-2 text-3xl hn-float">🎀</div>
          <div className="absolute -top-1 -right-3 text-3xl hn-float" style={{ animationDelay: "0.6s" }}>💗</div>
          <div className="absolute bottom-2 left-3 text-2xl hn-float" style={{ animationDelay: "1.1s" }}>✨</div>

          <p className="text-[11px] font-bold tracking-widest mb-1" style={{ color: "#ff6fa5" }}>
            ⋆｡°✩ 90년대생 전용 미니홈피 ✩°｡⋆
          </p>
          <h1
            className="text-4xl font-black mb-1"
            style={{ color: "#ff5c9a", textShadow: "2px 2px 0 #ffe0ec, 0 0 18px rgba(255,111,165,0.4)" }}
          >
            훈녀생정
          </h1>
          <p className="text-xs font-bold mb-5" style={{ color: "#c084fc" }}>
            훈훈한 여자 생활정보 <span className="hn-blink">☆</span>
          </p>

          <div
            className="rounded-2xl px-4 py-3 mb-5 text-left text-[13px] leading-relaxed"
            style={{ background: "#fff0f6", border: "1.5px solid #ffc2dd", color: "#7a4a5c" }}
          >
            밀가루팩부터 수박당 다이어트, 미즈넷 시절 이야기까지 —<br />
            따라 해본 만큼 <b style={{ color: "#ff5c9a" }}>나의 훈녀력</b>이 쌓여요 🍎🍉
          </div>

          <div
            className="mx-auto mb-6 inline-flex items-center gap-3 px-4 py-2 rounded-xl"
            style={{ background: "#1a1a1a", boxShadow: "inset 0 0 6px rgba(0,0,0,0.6)" }}
          >
            <span className="text-[10px] font-bold" style={{ color: "#4ade80", fontFamily: "monospace" }}>
              TODAY {String(visitToday).padStart(6, "0")}
            </span>
            <span className="text-[10px] font-bold" style={{ color: "#facc15", fontFamily: "monospace" }}>
              TOTAL {String(visitTotal).padStart(7, "0")}
            </span>
          </div>

          <button
            onClick={handleEnter}
            className="w-full py-3.5 rounded-2xl font-black text-white text-base active:scale-[0.97] transition-transform"
            style={{ background: "linear-gradient(135deg, #ff8fb3, #ff5c9a)", boxShadow: "0 10px 24px -8px rgba(255,92,154,0.6)" }}
          >
            들어가기 → ⁀➷
          </button>
          <button onClick={() => router.push("/")} className="mt-3 text-xs font-bold" style={{ color: "#b891c9" }}>
            ← 다른 서비스 둘러보기
          </button>
        </div>
      </main>
    );
  }

  // ── 메뉴 허브 ─────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen pb-20" style={bgStyle}>
      <style>{`.hn-blink { animation: hnBlink 1.3s step-end infinite; } @keyframes hnBlink { 0%,45%,100% { opacity: 1 } 50%,95% { opacity: 0.15 } }`}</style>

      <div className="max-w-2xl mx-auto px-4 pt-4 flex items-center justify-between">
        <button onClick={() => router.push("/")} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "#fff", color: "#8b5cf6", border: "1.5px solid #ddd0ff" }}>
          🏠 홈
        </button>
        <button onClick={() => router.push("/hunnyeo/mypage")} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "#fff", color: "#ff5c9a", border: "1.5px solid #ffc2dd" }}>
          👧 내정보 보기
        </button>
      </div>

      <header className="max-w-2xl mx-auto px-4 pt-4 pb-2 text-center">
        <h1 className="text-3xl font-black mb-1" style={{ color: "#ff5c9a", textShadow: "2px 2px 0 #ffe0ec" }}>
          훈녀생정 <span className="hn-blink">💗</span>
        </h1>
        <p className="text-[12px] font-bold mb-4" style={{ color: "#a855f7" }}>
          완소 90년대생 전용 뷰티 다이어리 · 메뉴에서 골라보세요
        </p>
        <HunnyeoScoreBar points={totalPoints} />
      </header>

      {/* 메뉴 그리드 */}
      <div className="max-w-2xl mx-auto px-4 mt-4 grid grid-cols-2 gap-3">
        {categoryTiles.map(c => {
          const prog = categoryProgress[c.key];
          const done = prog?.done ?? 0;
          const total = prog?.total ?? 0;
          const complete = total > 0 && done === total;
          return (
            <button
              key={c.key}
              onClick={() => router.push(`/hunnyeo/${c.key}`)}
              className="text-left rounded-2xl p-4 relative overflow-hidden active:scale-[0.97] transition-transform"
              style={{ background: "#fff", border: `2px solid ${c.accent}55`, boxShadow: "0 6px 16px -10px rgba(0,0,0,0.2)" }}
            >
              {complete && (
                <span className="absolute top-2 right-2 text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: "#fff7d6", color: "#ca8a04" }}>
                  🏅 마스터
                </span>
              )}
              <p className="text-2xl mb-1.5">{c.emoji}</p>
              <p className="font-black text-sm mb-0.5" style={{ color: "#3f2a37" }}>{c.label}</p>
              <p className="text-[10px] mb-2" style={{ color: "#a3a3a3" }}>{c.desc}</p>
              <div className="h-1.5 rounded-full overflow-hidden mb-1" style={{ background: `${c.accent}22` }}>
                <div className="h-full rounded-full" style={{ width: total ? `${(done / total) * 100}%` : "0%", background: c.accent }} />
              </div>
              <p className="text-[10px] font-bold" style={{ color: c.accent }}>{done}/{total} 완료</p>
            </button>
          );
        })}
      </div>

      {/* 방명록 */}
      <div className="max-w-2xl mx-auto px-4 mt-6">
        <div className="rounded-2xl p-4" style={{ background: "#fdf6ff", border: "2px solid #e9d5ff" }}>
          <h3 className="font-black text-sm mb-3" style={{ color: "#9333ea" }}>
            📔 방명록 — 완소 흔적 남기기
          </h3>

          <form onSubmit={submitGuestbook} className="space-y-2 mb-4">
            <input
              value={gbName}
              onChange={e => setGbName(e.target.value)}
              placeholder="닉네임"
              maxLength={12}
              className="w-full rounded-xl px-3 py-2 text-xs outline-none"
              style={{ background: "#fff", border: "1.5px solid #e9d5ff", color: "#4b2e63" }}
            />
            <textarea
              value={gbMsg}
              onChange={e => setGbMsg(e.target.value)}
              placeholder="추억 한마디 남겨주세요 (완소♡)"
              rows={2}
              maxLength={200}
              className="w-full rounded-xl px-3 py-2 text-xs outline-none resize-none"
              style={{ background: "#fff", border: "1.5px solid #e9d5ff", color: "#4b2e63" }}
            />
            <button
              type="submit"
              disabled={!gbName.trim() || !gbMsg.trim()}
              className="w-full py-2 rounded-xl text-xs font-black text-white disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #c084fc, #a855f7)" }}
            >
              방명록 남기기 ✎
            </button>
          </form>

          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-none">
            {guestbook.map(g => (
              <div key={g.id} className="rounded-xl px-3 py-2" style={{ background: "#fff", border: "1px solid #f0e0ff" }}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-black" style={{ color: "#9333ea" }}>{g.name}</span>
                  <span className="text-[10px]" style={{ color: "#c4b5fd" }}>{g.date}</span>
                </div>
                <p className="text-[12px]" style={{ color: "#57406b" }}>{g.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] mt-6 px-4" style={{ color: "#c9a0b5" }}>
        본 콘텐츠는 2000년대 인터넷 감성을 재현한 추억·오락용 콘텐츠입니다. 건강 관련 정보는 참고용으로만 봐주세요.
      </p>
    </main>
  );
}

"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORIES,
  TIPS,
  GUESTBOOK_SEED,
  STAMP_STORAGE_KEY,
  GUESTBOOK_STORAGE_KEY,
  VISITED_STORAGE_KEY,
  type HunnyeoCategoryKey,
  type GuestbookEntry,
} from "@/lib/hunnyeoData";

const RETRO_FONT = "'Malgun Gothic', 'Apple SD Gothic Neo', 'Gulim', sans-serif";

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export default function HunnyeoPage() {
  const router = useRouter();
  const [entered, setEntered] = useState(false);
  const [visitTotal, setVisitTotal] = useState(38471);
  const [visitToday, setVisitToday] = useState(48);
  const [category, setCategory] = useState<HunnyeoCategoryKey>("all");
  const [stamped, setStamped] = useState<Record<string, boolean>>({});
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>(GUESTBOOK_SEED);
  const [gbName, setGbName] = useState("");
  const [gbMsg, setGbMsg] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 최초 마운트 시 localStorage에서 1회 하이드레이션
    setStamped(loadJSON(STAMP_STORAGE_KEY, {} as Record<string, boolean>));
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
    setEntered(true);
  }

  function toggleStamp(id: string) {
    setStamped(prev => {
      const next = { ...prev, [id]: !prev[id] };
      localStorage.setItem(STAMP_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
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
    localStorage.setItem(GUESTBOOK_STORAGE_KEY, JSON.stringify(next));
    setGbName("");
    setGbMsg("");
  }

  const filteredTips = useMemo(
    () => (category === "all" ? TIPS : TIPS.filter(t => t.category === category)),
    [category]
  );

  const bgStyle = {
    background: "linear-gradient(160deg, #ffe4f1 0%, #ffe9d6 35%, #e6e6ff 70%, #dff7ec 100%)",
    fontFamily: RETRO_FONT,
  };

  if (!entered) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-10" style={bgStyle}>
        <style>{`
          @keyframes hnBlink { 0%,45%,100% { opacity: 1 } 50%,95% { opacity: 0.15 } }
          @keyframes hnFloat { 0%,100% { transform: translateY(0) rotate(-4deg); } 50% { transform: translateY(-10px) rotate(4deg); } }
          @keyframes hnMarquee { 0% { transform: translateX(100%); } 100% { transform: translateX(-100%); } }
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
            그때 그 시절 <b style={{ color: "#ff5c9a" }}>완소</b> 정보들을 다시 꺼내봤어요 🍎🍉
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
          <button
            onClick={() => router.push("/")}
            className="mt-3 text-xs font-bold"
            style={{ color: "#b891c9" }}
          >
            ← 다른 서비스 둘러보기
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen pb-20" style={bgStyle}>
      <style>{`
        @keyframes hnBlink { 0%,45%,100% { opacity: 1 } 50%,95% { opacity: 0.15 } }
        .hn-blink { animation: hnBlink 1.3s step-end infinite; }
        .hn-tag { display:inline-block; font-size:11px; font-weight:700; padding:2px 8px; border-radius:999px; }
      `}</style>

      {/* 상단 네비 */}
      <div className="max-w-2xl mx-auto px-4 pt-4 flex items-center justify-between">
        <button onClick={() => router.back()} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "#fff", color: "#ff6fa5", border: "1.5px solid #ffc2dd" }}>
          ← 뒤로
        </button>
        <button onClick={() => router.push("/")} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "#fff", color: "#8b5cf6", border: "1.5px solid #ddd0ff" }}>
          🏠 홈
        </button>
      </div>

      {/* 헤더 */}
      <header className="max-w-2xl mx-auto px-4 pt-4 pb-2 text-center">
        <h1 className="text-3xl font-black mb-1" style={{ color: "#ff5c9a", textShadow: "2px 2px 0 #ffe0ec" }}>
          훈녀생정 <span className="hn-blink">💗</span>
        </h1>
        <p className="text-[12px] font-bold" style={{ color: "#a855f7" }}>
          완소 90년대생 전용 뷰티 다이어리 · 그 시절 그 감성 그대로
        </p>
      </header>

      {/* 탭 */}
      <div className="max-w-2xl mx-auto px-4 mt-3 flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {CATEGORIES.map(c => {
          const active = category === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className="shrink-0 px-3.5 py-2 rounded-full text-xs font-bold transition-all"
              style={{
                background: active ? c.accent : "#fff",
                color: active ? "#fff" : c.accent,
                border: `1.5px solid ${c.accent}`,
              }}
            >
              {c.emoji} {c.label}
            </button>
          );
        })}
      </div>

      {/* 다이어트 카테고리 안내 배너 */}
      {category === "diet" && (
        <div className="max-w-2xl mx-auto px-4 mt-3">
          <div className="rounded-2xl px-4 py-3 text-[12px] leading-relaxed" style={{ background: "#fff7e6", border: "1.5px dashed #f59e0b", color: "#92400e" }}>
            ⚠️ 여기 나오는 다이어트법은 그 시절 유행을 그대로 재현한 <b>추억 콘텐츠</b>예요. 실제로는 균형 잡힌 식사가 기본! 무리한 원푸드·초저열량 다이어트는 피해주세요.
          </div>
        </div>
      )}

      {/* 카드 리스트 */}
      <div className="max-w-2xl mx-auto px-4 mt-4 space-y-4">
        {filteredTips.map(tip => {
          const cat = CATEGORIES.find(c => c.key === tip.category)!;
          const isStamped = !!stamped[tip.id];
          return (
            <article
              key={tip.id}
              className="rounded-2xl p-4"
              style={{ background: "#fffdfb", border: `1.5px dashed ${cat.accent}88`, boxShadow: "0 6px 18px -10px rgba(0,0,0,0.15)" }}
            >
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="hn-tag" style={{ background: `${cat.accent}22`, color: cat.accent }}>
                  {cat.emoji} {cat.label}
                </span>
                <span className="text-[10px]" style={{ color: "#a3a3a3" }}>
                  글쓴이 {tip.author} · {tip.date} · 조회 {tip.views.toLocaleString()}
                </span>
              </div>

              <h2 className="font-black text-[15px] mb-2" style={{ color: "#3f2a37" }}>
                {tip.title}
              </h2>

              <div className="space-y-2 mb-2.5">
                {tip.body.map((p, i) => (
                  <p key={i} className="text-[13px] leading-relaxed" style={{ color: "#5c4653" }}>
                    {p}
                  </p>
                ))}
              </div>

              {tip.caution && (
                <div className="rounded-xl px-3 py-2 mb-2.5 text-[11px] leading-relaxed" style={{ background: "#fff2f2", border: "1px solid #fecaca", color: "#b91c1c" }}>
                  💡 지금 기준으로 보면: {tip.caution}
                </div>
              )}

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {tip.tags.map(t => (
                    <span key={t} className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "#f5f5f5", color: "#888" }}>
                      {t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => toggleStamp(tip.id)}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black transition-all active:scale-95"
                  style={{
                    background: isStamped ? "linear-gradient(135deg, #ff8fb3, #ff5c9a)" : "#fff",
                    color: isStamped ? "#fff" : "#ff5c9a",
                    border: "1.5px solid #ff8fb3",
                  }}
                >
                  {isStamped ? "💗" : "🤍"} 완소 도장 {tip.baseStamps + (isStamped ? 1 : 0)}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* 방명록 */}
      <div className="max-w-2xl mx-auto px-4 mt-8">
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

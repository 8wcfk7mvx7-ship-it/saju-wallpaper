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
import { pageStyle, RETRO_CSS } from "@/lib/hunnyeoTheme";
import HunnyeoScoreBar from "@/components/HunnyeoScoreBar";
import PixelIcon from "@/components/PixelIcon";
import PixelFall from "@/components/PixelFall";

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

  useEffect(() => {
    if (step !== "loading") return;
    const start = Date.now();
    const duration = 1600;
    const timer = setInterval(() => {
      const pct = Math.min(100, Math.round(((Date.now() - start) / duration) * 100));
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timer);
        setTimeout(() => setStep("splash"), 250);
      }
    }, 60);
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 최초 마운트 시 localStorage에서 1회 하이드레이션
    setChecked(loadJSON(CHECKED_STORAGE_KEY, {} as Record<string, boolean>));
    setGuestbook(loadJSON(GUESTBOOK_STORAGE_KEY, GUESTBOOK_SEED));
    if (loadJSON<boolean>(VISITED_STORAGE_KEY, false)) {
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

  const tiles = CATEGORIES.filter(c => c.key !== "all");

  // ── 로딩 화면 ─────────────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-6 cursor-pointer"
        style={{ background: "#12002b", fontFamily: "'Courier New', monospace" }}
        onClick={() => setStep("splash")}
      >
        <style>{RETRO_CSS}</style>
        <PixelFall />
        <div className="w-full max-w-xs text-center">
          <div className="mb-3"><PixelIcon name="floppy" size={44} className="hn-wiggle" /></div>
          <p className="text-lg font-black mb-1 hn-title">훈녀생정</p>
          <p className="text-[11px] mb-5" style={{ color: "#9df5c0" }}>
            지금 접속하고 있어요<span className="hn-blink">...</span>
          </p>

          <div className="h-5 rounded-full overflow-hidden mb-2" style={{ background: "#2a0b4d", border: "2px solid #ff6fb5" }}>
            <div
              className="h-full"
              style={{
                width: `${progress}%`,
                background: "repeating-linear-gradient(45deg,#ff3d9a 0 8px,#ffd93d 8px 16px)",
                transition: "width 60ms linear",
              }}
            />
          </div>
          <p className="text-sm font-black" style={{ color: "#ffd93d" }}>{progress}%</p>

          <div className="mt-6 flex justify-center gap-2">
            {(["heart", "star", "heart"] as const).map((n, i) => (
              <PixelIcon key={i} name={n} size={14} className="hn-twinkle" style={{ animationDelay: `${i * 0.25}s` }} />
            ))}
          </div>
          <p className="text-[10px] mt-5" style={{ color: "#7a5ea8" }}>화면을 누르면 바로 들어가요</p>
        </div>
      </main>
    );
  }

  // ── 들어가기 화면 ─────────────────────────────────────────────────────
  if (step === "splash") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-8" style={pageStyle}>
        <style>{RETRO_CSS}</style>
        <PixelFall />
        <div className="w-full max-w-sm hn-box p-5 text-center relative" style={{ borderStyle: "dashed", borderWidth: 4 }}>
          <PixelIcon name="ribbon" size={30} className="absolute -top-3 -left-3 hn-float" />
          <PixelIcon name="heart" size={26} className="absolute -top-3 -right-3 hn-float" style={{ animationDelay: ".7s" }} />

          <p className="text-[11px] font-black mb-2" style={{ color: "#ff6fb5" }}>
─── 90년대생 전용 미니홈피 ───
          </p>

          <h1 className="text-5xl font-black mb-1 hn-title">훈녀생정</h1>
          <p className="text-xs font-black mb-4" style={{ color: "#9b6bf5" }}>
            훈훈한 여자 생활정보 <span className="hn-blink">★</span>
          </p>

          <div className="hn-marquee mb-4 py-1.5 rounded-full" style={{ background: "#fff6da", border: "2px solid #f5b400" }}>
            <div>
              {[0, 1].map(i => (
                <span key={i} className="text-[11px] font-black" style={{ color: "#c98a00" }}>
                  밀가루팩 · 봉숭아물 · 황제 다이어트 · L자 다리 · 꿀 입술팩 · 완소템까지 총 {TIPS.length}가지 · 따라 한 만큼 훈녀력이 쌓여요 ·
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl px-3 py-3 mb-4 text-[13px] leading-relaxed font-bold" style={{ background: "#fff0f7", border: "2px dashed #ff9ecb", color: "#a04a75" }}>
            집에 있는 재료로 하는<br />
            그 시절 관리법 <b style={{ color: "#ff2b8d" }}>{TIPS.length}가지</b>를 모았어요
          </div>

          <div className="mx-auto mb-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg" style={{ background: "#1a1a1a", border: "2px solid #666" }}>
            <span className="text-[10px] font-black" style={{ color: "#4ade80", fontFamily: "monospace" }}>
              TODAY {String(visitToday).padStart(5, "0")}
            </span>
            <span className="text-[10px] font-black" style={{ color: "#facc15", fontFamily: "monospace" }}>
              TOTAL {String(visitTotal).padStart(7, "0")}
            </span>
          </div>

          <button onClick={handleEnter} className="hn-btn hn-btn-on w-full py-3.5 text-base">
들어가기 ▶
          </button>
          <button onClick={() => router.push("/")} className="mt-3 text-[11px] font-black underline" style={{ color: "#b06a94" }}>
            다른 서비스 둘러보기
          </button>
        </div>
      </main>
    );
  }

  // ── 메뉴 화면 ─────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen pb-20" style={pageStyle}>
      <style>{RETRO_CSS}</style>
        <PixelFall />

      <div className="max-w-2xl mx-auto px-4 pt-4 flex items-center justify-between">
        <button onClick={() => router.push("/")} className="hn-btn hn-box-p px-3 py-1.5 text-[11px]" style={{ borderColor: "#9b6bf5", color: "#7c3aed", boxShadow: "3px 3px 0 #ddd0ff" }}>
<PixelIcon name="home" size={13} /> 홈으로
        </button>
        <button onClick={() => router.push("/hunnyeo/mypage")} className="hn-btn px-3 py-1.5 text-[11px]">
<PixelIcon name="user" size={13} /> 내 정보
        </button>
      </div>

      <header className="max-w-2xl mx-auto px-4 pt-4 text-center">
        <div className="flex justify-center gap-2 mb-1.5">
          {(["heart", "star", "heart"] as const).map((n, i) => (
            <PixelIcon key={i} name={n} size={13} className="hn-twinkle" style={{ animationDelay: `${i * 0.22}s` }} />
          ))}
        </div>
        <h1 className="text-4xl font-black mb-1 hn-title">훈녀생정</h1>
        <p className="hn-cute text-[12px] mb-3" style={{ color: "#ff6fb5" }}>
오늘은 뭘 해볼까요?
        </p>
        <HunnyeoScoreBar points={totalPoints} />
      </header>

      <div className="flex justify-center gap-1.5 my-4">
        {[0, 1, 2].map(i => (
          <PixelIcon key={i} name="heart" size={12} style={{ opacity: 0.55 }} />
        ))}
      </div>

      {/* 메뉴판 */}
      <div className="max-w-2xl mx-auto px-4 grid grid-cols-2 gap-3.5">
        {tiles.map((c, idx) => {
          const catTips = TIPS.filter(t => t.category === c.key);
          const done = catTips.filter(t => checked[t.id]).length;
          const complete = catTips.length > 0 && done === catTips.length;
          const started = done > 0 && !complete;
          return (
            <button
              key={c.key}
              onClick={() => router.push(`/hunnyeo/${c.key}`)}
              className="hn-box hn-glitter p-3 pt-5 text-center relative"
              style={{
                borderColor: c.accent,
                boxShadow: `4px 4px 0 ${c.accent}55`,
                background: `linear-gradient(#fff 55%, ${c.accent}1f)`,
              }}
            >
              {/* 비뚤게 붙인 스티커 */}
              <span
                className={`hn-sticker absolute -top-2.5 -left-2 ${complete ? "hn-blink" : ""}`}
                style={{ borderColor: c.accent, color: complete ? "#c9186d" : "#d4348a" }}
              >
                {complete ? "올클리어!" : started ? "하는중" : `제${idx + 1}장`}
              </span>

              <PixelIcon
                name={c.icon}
                size={40}
                className="hn-float"
                style={{ display: "block", margin: "0 auto 6px", animationDelay: `${idx * 0.13}s` }}
              />
              <p className="hn-cute text-[16px] mb-0.5" style={{ color: c.accent }}>{c.label}</p>
              <p className="text-[11px] font-bold mb-2 leading-tight" style={{ color: "#a8798f" }}>{c.desc}</p>

              <div className="h-3.5 rounded-full overflow-hidden mb-1.5" style={{ background: "#fff", border: `2px solid ${c.accent}88` }}>
                <div
                  className="h-full"
                  style={{
                    width: catTips.length ? `${(done / catTips.length) * 100}%` : "0%",
                    background: `repeating-linear-gradient(45deg, ${c.accent} 0 5px, ${c.accent}99 5px 10px)`,
                  }}
                />
              </div>
              <p className="hn-cute text-[12px]" style={{ color: c.accent }}>
{done} / {catTips.length}
              </p>
            </button>
          );
        })}
      </div>

      <div className="flex justify-center gap-1.5 my-4">
        {[0, 1, 2].map(i => (
          <PixelIcon key={i} name="heart" size={12} style={{ opacity: 0.55 }} />
        ))}
      </div>

      {/* 방명록 */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="hn-box hn-box-p p-4">
          <h3 className="hn-cute text-[15px] mb-1 flex items-center gap-1.5" style={{ color: "#7c3aed" }}>
            <PixelIcon name="note" size={15} /> 방명록
          </h3>
          <p className="text-[11px] font-bold mb-3" style={{ color: "#9375b8" }}>흔적을 남겨주세요</p>

          <form onSubmit={submitGuestbook} className="space-y-2 mb-4">
            <input
              value={gbName}
              onChange={e => setGbName(e.target.value)}
              placeholder="이름"
              maxLength={12}
              className="w-full rounded-lg px-3 py-2 text-xs font-bold outline-none"
              style={{ border: "2px solid #ddd0ff", color: "#4b2e63" }}
            />
            <textarea
              value={gbMsg}
              onChange={e => setGbMsg(e.target.value)}
              placeholder="한마디 남겨주세요"
              rows={2}
              maxLength={200}
              className="w-full rounded-lg px-3 py-2 text-xs font-bold outline-none resize-none"
              style={{ border: "2px solid #ddd0ff", color: "#4b2e63" }}
            />
            <button
              type="submit"
              disabled={!gbName.trim() || !gbMsg.trim()}
              className="hn-btn w-full py-2 text-xs disabled:opacity-40"
              style={{ borderColor: "#9b6bf5", color: "#7c3aed", boxShadow: "3px 3px 0 #ddd0ff" }}
            >
남기기
            </button>
          </form>

          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-none">
            {guestbook.map(g => (
              <div key={g.id} className="rounded-lg px-3 py-2" style={{ background: "#faf5ff", border: "2px dotted #ddd0ff" }}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-xs font-black" style={{ color: "#7c3aed" }}>{g.name}</span>
                  <span className="text-[10px] font-bold" style={{ color: "#c4b5fd" }}>{g.date}</span>
                </div>
                <p className="text-[13px] font-bold" style={{ color: "#57406b" }}>{g.message}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <p className="text-center text-[10px] mt-6 px-6 font-bold" style={{ color: "#c093ac" }}>
        그 시절 민간요법을 모은 추억 콘텐츠예요
      </p>
    </main>
  );
}

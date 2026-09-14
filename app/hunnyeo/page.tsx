"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORIES,
  TIPS,
  CHECKED_STORAGE_KEY,
} from "@/lib/hunnyeoData";
import { loadJSON } from "@/lib/hunnyeoStorage";
import { pageStyle, RETRO_CSS } from "@/lib/hunnyeoTheme";
import HunnyeoScoreBar from "@/components/HunnyeoScoreBar";
import PixelIcon from "@/components/PixelIcon";
import PixelFall from "@/components/PixelFall";

type Step = "loading" | "splash" | "menu";

export default function HunnyeoPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("loading");
  const [progress, setProgress] = useState(0);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

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
  }, []);

  function handleEnter() {
    setStep("menu");
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
                  밀가루팩 · 봉숭아물 · 빌리의 부트캠프 · 파워워킹 · 글자스킬 · 애정운까지 총 {TIPS.length}가지 · 따라 한 만큼 훈녀력이 쌓여요 ·
                </span>
              ))}
            </div>
          </div>

          <div className="rounded-xl px-3 py-3 mb-4 text-[13px] leading-relaxed font-bold" style={{ background: "#fff0f7", border: "2px dashed #ff9ecb", color: "#a04a75" }}>
            집에 있는 재료로 하는<br />
            그 시절 관리법 <b style={{ color: "#ff2b8d" }}>{TIPS.length}가지</b>를 모았어요
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

      {/* 칼로리표 입구 */}
      <section className="max-w-2xl mx-auto px-4 mt-3">
        <button
          onClick={() => router.push("/hunnyeo/calorie")}
          className="hn-box w-full p-3.5 flex items-center gap-3 text-left"
          style={{ borderColor: "#f97316", boxShadow: "4px 4px 0 #fed7aa" }}
        >
          <PixelIcon name="flame" size={30} />
          <span className="flex-1">
            <span className="hn-cute text-[15px] block" style={{ color: "#c2410c" }}>
              행동별 칼로리표
            </span>
            <span className="text-[11.5px] font-bold" style={{ color: "#7a6070" }}>
              책 읽기도, 노래 부르기도 칼로리가 있어요
            </span>
          </span>
          <span className="text-[15px] font-black shrink-0" style={{ color: "#f97316" }}>▶</span>
        </button>
      </section>

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

      <p className="text-center text-[10px] mt-6 px-6 font-bold" style={{ color: "#c093ac" }}>
        그 시절 민간요법을 모은 추억 콘텐츠예요
      </p>
    </main>
  );
}

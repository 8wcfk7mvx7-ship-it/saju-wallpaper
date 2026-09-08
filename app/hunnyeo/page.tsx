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
  getLevelInfo,
  pageOfCategory,
  type GuestbookEntry,
} from "@/lib/hunnyeoData";
import { loadJSON, saveJSON } from "@/lib/hunnyeoStorage";
import { pageStyle, RETRO_CSS, INK, INK_RED, INK_LIGHT, BOOK_FONT_GOTHIC } from "@/lib/hunnyeoTheme";

type Step = "loading" | "cover" | "toc";

export default function HunnyeoPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("loading");
  const [progress, setProgress] = useState(0);
  const [printCount, setPrintCount] = useState(38471);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [guestbook, setGuestbook] = useState<GuestbookEntry[]>(GUESTBOOK_SEED);
  const [gbName, setGbName] = useState("");
  const [gbMsg, setGbMsg] = useState("");

  useEffect(() => {
    if (step !== "loading") return;
    const start = Date.now();
    const duration = 1500;
    const timer = setInterval(() => {
      const pct = Math.min(100, Math.round(((Date.now() - start) / duration) * 100));
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timer);
        setTimeout(() => setStep("cover"), 200);
      }
    }, 60);
    return () => clearInterval(timer);
  }, [step]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 최초 마운트 시 localStorage에서 1회 하이드레이션
    setChecked(loadJSON(CHECKED_STORAGE_KEY, {} as Record<string, boolean>));
    setGuestbook(loadJSON(GUESTBOOK_STORAGE_KEY, GUESTBOOK_SEED));
    if (loadJSON<boolean>(VISITED_STORAGE_KEY, false)) {
      setPrintCount(v => v + Math.floor(Math.random() * 30));
    }
  }, []);

  function openBook() {
    localStorage.setItem(VISITED_STORAGE_KEY, "true");
    setStep("toc");
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
  const level = getLevelInfo(totalPoints);
  const chapters = CATEGORIES.filter(c => c.key !== "all");

  // ── 인쇄 중 (로딩) ───────────────────────────────────────────────────
  if (step === "loading") {
    return (
      <main
        className="min-h-screen flex items-center justify-center px-8 cursor-pointer"
        style={{ ...pageStyle }}
        onClick={() => setStep("cover")}
      >
        <style>{RETRO_CSS}</style>
        <div className="w-full max-w-xs text-center">
          <p className="text-[11px] mb-6" style={{ color: INK_LIGHT, letterSpacing: ".3em" }}>
            완 소 문 고
          </p>
          <p className="text-2xl mb-1 hn-title">인 쇄 중</p>
          <p className="text-[12px] mb-6" style={{ color: INK_LIGHT }}>
            잠시만 기다려 주세요<span className="hn-blink">…</span>
          </p>

          <div className="h-4 mb-2" style={{ border: `2px solid ${INK}`, background: "#fffdf5" }}>
            <div
              className="h-full"
              style={{
                width: `${progress}%`,
                background: `repeating-linear-gradient(90deg, ${INK} 0 4px, transparent 4px 8px)`,
                transition: "width 60ms linear",
              }}
            />
          </div>
          <p className="text-[12px]" style={{ color: INK_RED, fontFamily: BOOK_FONT_GOTHIC }}>{progress}%</p>

          <p className="text-[10px] mt-10" style={{ color: INK_LIGHT }}>
            화면을 누르면 바로 넘어갑니다
          </p>
        </div>
      </main>
    );
  }

  // ── 표지 ─────────────────────────────────────────────────────────────
  if (step === "cover") {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 py-8" style={pageStyle}>
        <style>{RETRO_CSS}</style>
        <div className="hn-staple" />

        <div className="w-full max-w-sm hn-frame-double p-6 relative" style={{ marginLeft: 10 }}>
          {/* 가격 스티커 */}
          <div
            className="hn-price absolute -top-4 -right-3 w-16 h-16 flex flex-col items-center justify-center"
            style={{ zIndex: 2 }}
          >
            <span className="text-[9px] leading-none">정가</span>
            <span className="text-[15px] font-black leading-tight">500</span>
            <span className="text-[9px] leading-none">원</span>
          </div>

          <p className="text-center text-[10px] mb-1" style={{ color: INK_LIGHT, letterSpacing: ".4em" }}>
            완소문고 제 7 권
          </p>
          <p className="text-center text-[11px] mb-5" style={{ color: INK_RED }}>
            ─── 소녀 필독 ───
          </p>

          <div className="hn-frame py-5 px-3 mb-5 text-center" style={{ background: "rgba(255,253,245,0.75)" }}>
            <h1 className="text-[42px] font-black leading-none mb-2 hn-title">훈녀생정</h1>
            <p className="text-[12px]" style={{ color: INK }}>훈훈한 여자 생활정보</p>
          </div>

          <div className="text-center mb-5">
            <p className="text-[12px] leading-relaxed" style={{ color: INK }}>
              밀가루팩 · 봉숭아물 들이기<br />
              덴마크 다이어트 · 머릿결 관리<br />
              발 관리 · 완소템 총정리
            </p>
          </div>

          <p className="text-center text-[11px] mb-5 hn-underline inline-block w-full" style={{ color: INK_RED }}>
            집에 있는 재료로 누구나 할 수 있습니다
          </p>

          <button onClick={openBook} className="hn-btn hn-btn-on w-full py-3 text-[15px]">
            책 펴 보기 ▶
          </button>

          <div className="flex items-center justify-between mt-5 pt-3" style={{ borderTop: `1px solid ${INK_LIGHT}` }}>
            <span className="text-[9px]" style={{ color: INK_LIGHT }}>완소문고 편집부 엮음</span>
            <span className="text-[9px]" style={{ color: INK_LIGHT }}>{printCount.toLocaleString()}부 발행</span>
          </div>

          {/* 조악한 바코드 */}
          <div className="flex justify-center gap-[1.5px] mt-3 h-7 items-end">
            {Array.from({ length: 34 }, (_, i) => (
              <span key={i} style={{ width: (i * 7) % 3 === 0 ? 3 : 1.5, height: (i % 5) * 3 + 14, background: INK }} />
            ))}
          </div>

          <button onClick={() => router.push("/")} className="mt-4 w-full text-[10px] underline" style={{ color: INK_LIGHT }}>
            다른 서비스 보러 가기
          </button>
        </div>
      </main>
    );
  }

  // ── 차례 ─────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen pb-16" style={pageStyle}>
      <style>{RETRO_CSS}</style>
      <div className="hn-staple" />

      <div className="max-w-2xl mx-auto px-5 pt-4" style={{ marginLeft: 14 }}>
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => setStep("cover")} className="hn-btn px-3 py-1.5 text-[11px]">◀ 표지</button>
          <button onClick={() => router.push("/hunnyeo/mypage")} className="hn-btn px-3 py-1.5 text-[11px]">
            내 기록장
          </button>
        </div>

        {/* 차례 제목 */}
        <div className="text-center mb-5">
          <h1 className="text-[30px] font-black hn-title mb-1">차　례</h1>
          <p className="text-[11px]" style={{ color: INK_LIGHT }}>─────── 훈녀생정 ───────</p>
        </div>

        {/* 훈녀력 표시 */}
        <div className="hn-frame p-3 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-bold" style={{ fontFamily: BOOK_FONT_GOTHIC }}>
              나의 훈녀력
            </span>
            <span className="text-[12px] font-black" style={{ color: INK_RED, fontFamily: BOOK_FONT_GOTHIC }}>
              {totalPoints}점 · {level.level.name}
            </span>
          </div>
          <div className="h-3" style={{ border: `1.5px solid ${INK}`, background: "#fffdf5" }}>
            <div
              className="h-full"
              style={{ width: `${Math.max(level.progress * 100, totalPoints > 0 ? 5 : 0)}%`, background: `repeating-linear-gradient(90deg, ${INK_RED} 0 5px, rgba(198,45,31,0.35) 5px 10px)` }}
            />
          </div>
          <p className="text-[10px] mt-1.5 text-center" style={{ color: INK_LIGHT }}>
            {level.next ? `다음 등급 「${level.next.name}」까지 ${level.pointsToNext}점` : "최고 등급입니다"}
          </p>
        </div>

        {/* 목차 항목 */}
        <div className="space-y-3.5 mb-8">
          {chapters.map((c, i) => {
            const catTips = TIPS.filter(t => t.category === c.key);
            const done = catTips.filter(t => checked[t.id]).length;
            const complete = done === catTips.length;
            return (
              <button key={c.key} onClick={() => router.push(`/hunnyeo/${c.key}`)} className="w-full text-left">
                <div className="flex items-end">
                  <span className="text-[13px] font-bold shrink-0" style={{ fontFamily: BOOK_FONT_GOTHIC, color: INK }}>
                    제{i + 1}장　{c.label}
                  </span>
                  <span className="hn-dots" />
                  <span className="text-[12px] shrink-0" style={{ color: INK_LIGHT }}>
                    {pageOfCategory(c.key)}쪽
                  </span>
                </div>
                <div className="flex items-center justify-between mt-0.5 pl-1">
                  <span className="text-[10px]" style={{ color: INK_LIGHT }}>{c.desc}</span>
                  <span className="text-[10px] font-bold" style={{ color: complete ? INK_RED : INK_LIGHT, fontFamily: BOOK_FONT_GOTHIC }}>
                    {complete ? "◎ 완료" : `${done}/${catTips.length}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-center text-[11px] mb-6" style={{ color: INK_LIGHT }}>· · · · ·</p>

        {/* 독자 엽서 (방명록) */}
        <div className="hn-frame-red p-4 mb-6">
          <p className="text-center text-[13px] font-bold mb-1" style={{ fontFamily: BOOK_FONT_GOTHIC, color: INK_RED }}>
            독 자 엽 서
          </p>
          <p className="text-center text-[10px] mb-3" style={{ color: INK_LIGHT }}>
            읽고 나서 한마디 적어 주세요
          </p>

          <form onSubmit={submitGuestbook} className="space-y-2 mb-4">
            <input
              value={gbName}
              onChange={e => setGbName(e.target.value)}
              placeholder="이름"
              maxLength={12}
              className="w-full px-2 py-1.5 text-[12px] outline-none"
              style={{ border: `1.5px solid ${INK}`, background: "#fffdf5", color: INK }}
            />
            <textarea
              value={gbMsg}
              onChange={e => setGbMsg(e.target.value)}
              placeholder="한마디"
              rows={2}
              maxLength={200}
              className="w-full px-2 py-1.5 text-[12px] outline-none resize-none"
              style={{ border: `1.5px solid ${INK}`, background: "#fffdf5", color: INK }}
            />
            <button type="submit" disabled={!gbName.trim() || !gbMsg.trim()} className="hn-btn w-full py-1.5 text-[11px] disabled:opacity-40">
              보내기
            </button>
          </form>

          <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-none">
            {guestbook.map(g => (
              <div key={g.id} className="px-2 py-1.5" style={{ borderBottom: `1px dotted ${INK_LIGHT}` }}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[11px] font-bold" style={{ color: INK, fontFamily: BOOK_FONT_GOTHIC }}>{g.name}</span>
                  <span className="text-[9px]" style={{ color: INK_LIGHT }}>{g.date}</span>
                </div>
                <p className="text-[11.5px] leading-relaxed" style={{ color: INK }}>{g.message}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[9px] leading-relaxed mb-3" style={{ color: INK_LIGHT }}>
          이 책은 2000년대 생활 정보를 정리한 추억용 읽을거리입니다.<br />
          건강 관련 내용은 참고용으로만 봐 주세요.
        </p>
        <p className="hn-pageno text-[11px]">— 2 —</p>

        <button onClick={() => router.push("/")} className="mt-4 w-full text-[10px] underline" style={{ color: INK_LIGHT }}>
          다른 서비스 보러 가기
        </button>
      </div>
    </main>
  );
}

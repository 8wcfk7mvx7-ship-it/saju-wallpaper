"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CATEGORIES,
  TIPS,
  CHECKED_STORAGE_KEY,
  chapterOfCategory,
  pageOfTip,
  type HunnyeoCategoryKey,
} from "@/lib/hunnyeoData";
import { loadJSON, saveJSON } from "@/lib/hunnyeoStorage";
import { pageStyle, RETRO_CSS, INK, INK_RED, INK_LIGHT, BOOK_FONT_GOTHIC } from "@/lib/hunnyeoTheme";

export default function HunnyeoCategoryPage() {
  const router = useRouter();
  const params = useParams<{ category: string }>();
  const categoryKey = params.category as HunnyeoCategoryKey;
  const cat = CATEGORIES.find(c => c.key === categoryKey && c.key !== "all");

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [justChecked, setJustChecked] = useState<string | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 최초 마운트 시 localStorage에서 1회 하이드레이션
    setChecked(loadJSON(CHECKED_STORAGE_KEY, {} as Record<string, boolean>));
  }, []);

  useEffect(() => {
    if (!cat) router.replace("/hunnyeo");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat]);

  const tips = useMemo(() => TIPS.filter(t => t.category === categoryKey), [categoryKey]);
  const totalPoints = useMemo(
    () => TIPS.reduce((sum, t) => sum + (checked[t.id] ? t.points : 0), 0),
    [checked]
  );
  const doneCount = tips.filter(t => checked[t.id]).length;

  function toggleCheck(id: string) {
    setChecked(prev => {
      const willCheck = !prev[id];
      const next = { ...prev, [id]: willCheck };
      saveJSON(CHECKED_STORAGE_KEY, next);
      if (willCheck) {
        setJustChecked(id);
        setTimeout(() => setJustChecked(cur => (cur === id ? null : cur)), 1500);
      }
      return next;
    });
  }

  if (!cat) return null;
  const chapter = chapterOfCategory(cat.key);

  return (
    <main className="min-h-screen pb-16" style={pageStyle}>
      <style>{RETRO_CSS}</style>
      <div className="hn-staple" />

      <div className="max-w-2xl mx-auto px-5 pt-4" style={{ marginLeft: 14 }}>
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => router.push("/hunnyeo")} className="hn-btn px-3 py-1.5 text-[11px]">◀ 차례</button>
          <span className="text-[11px]" style={{ color: INK_LIGHT }}>훈녀생정 · 완소문고</span>
          <button onClick={() => router.push("/hunnyeo/mypage")} className="hn-btn px-3 py-1.5 text-[11px]">내 기록장</button>
        </div>

        {/* 장 표제 */}
        <div className="text-center mb-6">
          <p className="text-[12px] mb-1" style={{ color: INK_RED, letterSpacing: ".3em", fontFamily: BOOK_FONT_GOTHIC }}>
            제 {chapter} 장
          </p>
          <h1 className="text-[30px] font-black hn-title mb-1.5">{cat.label}</h1>
          <p className="text-[11px]" style={{ color: INK_LIGHT }}>{cat.desc}</p>
          <p className="text-[11px] mt-2" style={{ color: INK }}>
            ── 모두 {tips.length}가지 중 {doneCount}가지 해봄 ──
          </p>
        </div>

        {/* 본문 */}
        <div className="space-y-8">
          {tips.map((tip, idx) => {
            const isChecked = !!checked[tip.id];
            const label = tip.type === "read" ? "읽었음" : "해보았음";
            return (
              <article key={tip.id} className="relative">
                {/* 완료 도장 */}
                {isChecked && (
                  <div
                    className={`hn-seal absolute right-0 -top-2 w-[72px] h-[72px] text-[15px] font-black ${justChecked === tip.id ? "hn-stamp" : ""}`}
                    style={{ zIndex: 3, opacity: 0.75, borderWidth: 3 }}
                  >
                    확인
                  </div>
                )}

                {/* 소제목 */}
                <div className="flex items-baseline gap-2 mb-3 pb-1.5" style={{ borderBottom: `2px solid ${INK}` }}>
                  <span
                    className="shrink-0 px-1.5 py-0.5 text-[11px] font-black"
                    style={{ background: INK, color: "#fffdf5", fontFamily: BOOK_FONT_GOTHIC }}
                  >
                    {idx + 1}
                  </span>
                  <h2 className="text-[17px] font-black leading-snug" style={{ fontFamily: BOOK_FONT_GOTHIC, color: INK }}>
                    {tip.title}
                  </h2>
                </div>

                {/* 준비물 */}
                {tip.materials && (
                  <div className="hn-frame px-3 py-2 mb-3">
                    <p className="text-[11px] font-bold mb-1" style={{ fontFamily: BOOK_FONT_GOTHIC, color: INK_RED }}>
                      ▣ 준비물
                    </p>
                    <p className="text-[12.5px] leading-relaxed" style={{ color: INK }}>
                      {tip.materials.join("　·　")}
                    </p>
                  </div>
                )}

                {/* 방법 */}
                <p className="text-[11px] font-bold mb-1.5" style={{ fontFamily: BOOK_FONT_GOTHIC, color: INK_RED }}>
                  {tip.type === "read" ? "▣ 알아 둡시다" : "▣ 하는 방법"}
                </p>
                <ol className="space-y-1.5 mb-3 pl-0.5">
                  {tip.steps.map((s, i) => (
                    <li key={i} className="flex gap-2 text-[13px] leading-relaxed" style={{ color: INK }}>
                      <span className="shrink-0 font-bold" style={{ color: INK_RED, fontFamily: BOOK_FONT_GOTHIC }}>
                        {tip.type === "read" ? "·" : `(${i + 1})`}
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>

                {/* 효과 */}
                <div className="px-3 py-2 mb-3" style={{ borderLeft: `4px solid ${INK_RED}`, background: "rgba(255,250,240,0.6)" }}>
                  <p className="text-[13px] leading-relaxed font-bold" style={{ color: INK }}>
                    {tip.effect}
                  </p>
                </div>

                {tip.caution && (
                  <p className="text-[11px] leading-relaxed mb-3 px-2" style={{ color: INK_LIGHT }}>
                    ※ {tip.caution}
                  </p>
                )}

                {/* 태그 + 체크칸 */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {tip.tags.map(t => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5" style={{ border: `1px solid ${INK_LIGHT}`, color: INK_LIGHT }}>
                        {t}
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={() => toggleCheck(tip.id)}
                    className={`hn-btn shrink-0 px-3 py-1.5 text-[12px] ${isChecked ? "hn-btn-on" : ""}`}
                  >
                    {isChecked ? "☑" : "☐"} {label} ({tip.points}점)
                  </button>
                </div>

                <p className="hn-pageno text-[11px] mt-5">— {pageOfTip(tip.id)} —</p>
              </article>
            );
          })}
        </div>

        {/* 다음 장 안내 */}
        <div className="mt-10 text-center">
          <p className="text-[11px] mb-3" style={{ color: INK_LIGHT }}>· · · · ·</p>
          <button onClick={() => router.push("/hunnyeo")} className="hn-btn px-5 py-2 text-[12px]">
            차례로 돌아가기
          </button>
          <p className="text-[10px] mt-4" style={{ color: INK_LIGHT }}>
            지금까지 모은 훈녀력 {totalPoints}점
          </p>
        </div>
      </div>
    </main>
  );
}

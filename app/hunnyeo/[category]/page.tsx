"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CATEGORIES, TIPS, CHECKED_STORAGE_KEY, type HunnyeoCategoryKey } from "@/lib/hunnyeoData";
import { loadJSON, saveJSON } from "@/lib/hunnyeoStorage";
import { pageStyle, RETRO_CSS } from "@/lib/hunnyeoTheme";
import HunnyeoScoreBar from "@/components/HunnyeoScoreBar";

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
        setTimeout(() => setJustChecked(cur => (cur === id ? null : cur)), 1200);
      }
      return next;
    });
  }

  if (!cat) return null;

  return (
    <main className="min-h-screen pb-20" style={pageStyle}>
      <style>{RETRO_CSS}</style>

      <div className="max-w-2xl mx-auto px-4 pt-4 flex items-center justify-between">
        <button onClick={() => router.push("/hunnyeo")} className="hn-btn px-3 py-1.5 text-[11px]">
          ← 메뉴판
        </button>
        <button onClick={() => router.push("/hunnyeo/mypage")} className="hn-btn hn-box-p px-3 py-1.5 text-[11px]" style={{ borderColor: "#9b6bf5", color: "#7c3aed", boxShadow: "3px 3px 0 #ddd0ff" }}>
          👧 내 정보
        </button>
      </div>

      <header className="max-w-2xl mx-auto px-4 pt-4 text-center">
        <div className="text-5xl mb-1 hn-wiggle">{cat.emoji}</div>
        <h1 className="text-3xl font-black mb-1 hn-title">{cat.label}</h1>
        <p className="text-[11px] font-black mb-3" style={{ color: cat.accent }}>
          ♡ {cat.desc} · {doneCount}/{tips.length} 완료 ♡
        </p>
        <HunnyeoScoreBar points={totalPoints} compact />
      </header>

      <p className="hn-hearts my-4">♡ ⋆ ♥ ⋆ ♡ ⋆ ♥ ⋆ ♡</p>

      <div className="max-w-2xl mx-auto px-4 space-y-4">
        {tips.map((tip, idx) => {
          const isChecked = !!checked[tip.id];
          const actionLabel = tip.type === "read" ? "읽었어요" : "따라했어요";
          return (
            <article
              key={tip.id}
              className="hn-box hn-glitter p-4 relative"
              style={{
                borderColor: cat.accent,
                boxShadow: `4px 4px 0 ${cat.accent}55`,
                background: isChecked ? `linear-gradient(#fff 60%, ${cat.accent}22)` : "#fff",
              }}
            >
              {isChecked && (
                <span className="hn-sticker absolute -top-2.5 -right-2">완료 ♡</span>
              )}

              {/* 제목 */}
              <div className="flex items-start gap-2 mb-3">
                <span
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black text-white"
                  style={{ background: cat.accent, boxShadow: `2px 2px 0 ${cat.accent}55` }}
                >
                  {idx + 1}
                </span>
                <h2 className="font-black text-[16px] leading-snug" style={{ color: "#c9186d" }}>
                  {tip.title}
                </h2>
              </div>

              {/* 준비물 */}
              {tip.materials && (
                <div className="rounded-2xl px-3 py-2 mb-3" style={{ background: "#fffbe8", border: "2px dotted #f5b400" }}>
                  <p className="text-[11px] font-black mb-1" style={{ color: "#c98a00" }}>🧺 준비물</p>
                  <p className="text-[12px] font-bold leading-relaxed" style={{ color: "#7a6a3a" }}>
                    {tip.materials.map(m => `♡ ${m}`).join("  ")}
                  </p>
                </div>
              )}

              {/* 방법 */}
              <p className="text-[11px] font-black mb-1.5" style={{ color: cat.accent }}>
                {tip.type === "read" ? "📖 알아두기" : "✏️ 하는 방법"}
              </p>
              <ol className="space-y-1.5 mb-3">
                {tip.steps.map((s, i) => (
                  <li key={i} className="flex gap-2 text-[13px] leading-relaxed font-bold" style={{ color: "#5c4653" }}>
                    <span className="shrink-0" style={{ color: cat.accent }}>{tip.type === "read" ? "♡" : `${i + 1}.`}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>

              {/* 효과 */}
              <div className="rounded-xl px-3 py-2 mb-3" style={{ background: "#fff0f7", border: "2px solid #ffb3d8" }}>
                <p className="text-[12px] font-black leading-relaxed" style={{ color: "#c9186d" }}>
                  ✨ {tip.effect}
                </p>
              </div>

              {tip.caution && (
                <div className="rounded-xl px-3 py-2 mb-3 text-[11px] leading-relaxed font-bold" style={{ background: "#fff5f5", border: "2px dotted #f7a8a8", color: "#c0392b" }}>
                  ⚠️ {tip.caution}
                </div>
              )}

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex flex-wrap gap-1">
                  {tip.tags.map(t => (
                    <span key={t} className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: "#f7f2f5", color: "#a08a99", border: "1.5px solid #ecdfe8" }}>
                      {t}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => toggleCheck(tip.id)}
                  className={`hn-btn shrink-0 px-3.5 py-2 text-[12px] ${isChecked ? "hn-btn-on" : ""} ${justChecked === tip.id ? "hn-pop" : ""}`}
                >
                  {isChecked ? "✅" : "☐"} {actionLabel} +{tip.points}점
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <p className="text-center text-[10px] mt-6 px-6 font-bold leading-relaxed" style={{ color: "#c093ac" }}>
        2000년대 생활 정보를 정리한 추억용 콘텐츠예요.<br />건강 관련 내용은 참고용으로만 봐주세요.
      </p>
    </main>
  );
}

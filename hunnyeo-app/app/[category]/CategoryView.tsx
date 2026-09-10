"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, TIPS, CHECKED_STORAGE_KEY, FAVORITE_STORAGE_KEY, type HunnyeoCategoryKey } from "@/lib/hunnyeoData";
import { loadJSON, saveJSON } from "@/lib/hunnyeoStorage";
import { pageStyle, RETRO_CSS } from "@/lib/hunnyeoTheme";
import HunnyeoScoreBar from "@/components/HunnyeoScoreBar";
import PixelIcon from "@/components/PixelIcon";
import PixelFall from "@/components/PixelFall";
import { tapFeedback, successFeedback } from "@/lib/hunnyeoHaptics";

export default function CategoryView({ category }: { category: HunnyeoCategoryKey }) {
  const router = useRouter();
  const categoryKey = category;
  const cat = CATEGORIES.find(c => c.key === categoryKey && c.key !== "all");

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [justChecked, setJustChecked] = useState<string | null>(null);
  const [favorite, setFavorite] = useState<Record<string, boolean>>({});
  const [onlyTodo, setOnlyTodo] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 최초 마운트 시 localStorage에서 1회 하이드레이션
    setChecked(loadJSON(CHECKED_STORAGE_KEY, {} as Record<string, boolean>));
    setFavorite(loadJSON(FAVORITE_STORAGE_KEY, {} as Record<string, boolean>));
  }, []);

  useEffect(() => {
    if (!cat) router.replace("/");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat]);

  const tips = useMemo(() => TIPS.filter(t => t.category === categoryKey), [categoryKey]);
  const totalPoints = useMemo(
    () => TIPS.reduce((sum, t) => sum + (checked[t.id] ? t.points : 0), 0),
    [checked]
  );
  const doneCount = tips.filter(t => checked[t.id]).length;
  const visibleTips = onlyTodo ? tips.filter(t => !checked[t.id]) : tips;

  function toggleCheck(id: string) {
    setChecked(prev => {
      const willCheck = !prev[id];
      const next = { ...prev, [id]: willCheck };
      saveJSON(CHECKED_STORAGE_KEY, next);
      if (willCheck) {
        // 이 체크로 장이 다 채워지면 축하 쪽 진동을 준다.
        const allDone = tips.every(t => (t.id === id ? true : next[t.id]));
        if (allDone) successFeedback();
        else tapFeedback();
        setJustChecked(id);
        setTimeout(() => setJustChecked(cur => (cur === id ? null : cur)), 1200);
      }
      return next;
    });
  }

  function toggleFavorite(id: string) {
    tapFeedback();
    setFavorite(prev => {
      const next = { ...prev, [id]: !prev[id] };
      if (!next[id]) delete next[id];
      saveJSON(FAVORITE_STORAGE_KEY, next);
      return next;
    });
  }

  if (!cat) return null;

  return (
    <main className="min-h-screen pb-20" style={pageStyle}>
      <style>{RETRO_CSS}</style>
        <PixelFall />

      <div className="max-w-2xl mx-auto px-4 pt-4 flex items-center justify-between">
        <button onClick={() => router.push("/")} className="hn-btn px-3 py-1.5 text-[11px]">
          ◀ 메뉴판
        </button>
        <button onClick={() => router.push("/mypage")} className="hn-btn hn-box-p px-3 py-1.5 text-[11px]" style={{ borderColor: "#9b6bf5", color: "#7c3aed", boxShadow: "3px 3px 0 #ddd0ff" }}>
          <PixelIcon name="user" size={13} /> 내 정보
        </button>
      </div>

      <header className="max-w-2xl mx-auto px-4 pt-4 text-center">
        <div className="mb-1"><PixelIcon name={cat.icon} size={52} className="hn-wiggle" /></div>
        <h1 className="text-3xl font-black mb-1 hn-title">{cat.label}</h1>
        <p className="hn-cute text-[12px] mb-3" style={{ color: cat.accent }}>
          {cat.desc} · {doneCount}/{tips.length} 완료
        </p>
        <HunnyeoScoreBar points={totalPoints} compact />
      </header>

      <div className="flex justify-center gap-1.5 my-4">
        {[0, 1, 2].map(i => (
          <PixelIcon key={i} name="heart" size={12} style={{ opacity: 0.55 }} />
        ))}
      </div>

      {/* 남은 것만 보기 */}
      <div className="max-w-2xl mx-auto px-4 mb-3 flex justify-end">
        <button
          onClick={() => setOnlyTodo(v => !v)}
          className={`hn-btn px-3 py-1.5 text-[11px] ${onlyTodo ? "hn-btn-on" : ""}`}
          aria-pressed={onlyTodo}
        >
          <span className="flex items-center gap-1">
            <PixelIcon name={onlyTodo ? "check" : "box"} size={12} />
            {onlyTodo ? "남은 것만 보는 중" : "남은 것만 보기"}
          </span>
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 space-y-4">
        {visibleTips.length === 0 && (
          <div className="hn-box p-6 text-center">
            <PixelIcon name="crown" size={30} className="hn-float" />
            <p className="hn-cute text-[16px] mt-2" style={{ color: "#c9186d" }}>
              이 장은 다 했어요!
            </p>
            <p className="text-[12px] font-bold mt-1" style={{ color: "#b08aa0" }}>
              다른 장도 채우러 가볼까요?
            </p>
          </div>
        )}
        {visibleTips.map((tip, idx) => {
          const isChecked = !!checked[tip.id];
          const actionLabel = tip.type === "read" ? "읽었어요" : "따라했어요";
          return (
            <article
              key={tip.id}
              id={tip.id}
              className="hn-box hn-glitter p-4 relative scroll-mt-4"
              style={{
                borderColor: cat.accent,
                boxShadow: `4px 4px 0 ${cat.accent}55`,
                background: isChecked ? `linear-gradient(#fff 60%, ${cat.accent}22)` : "#fff",
              }}
            >
              {isChecked && (
                <span className="hn-sticker absolute -top-2.5 -right-2 flex items-center gap-1">
                  <PixelIcon name="check" size={11} /> 완료
                </span>
              )}

              {/* 제목 */}
              <div className="flex items-start gap-2 mb-3">
                <span
                  className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-black text-white"
                  style={{ background: cat.accent, boxShadow: `2px 2px 0 ${cat.accent}55` }}
                >
                  {idx + 1}
                </span>
                <h2 className="hn-cute text-[17px] leading-snug flex-1" style={{ color: "#c9186d" }}>
                  {tip.title}
                </h2>
                <button
                  type="button"
                  onClick={() => toggleFavorite(tip.id)}
                  className="shrink-0 p-1 -mt-1"
                  aria-label={favorite[tip.id] ? "찜 해제" : "찜하기"}
                  aria-pressed={!!favorite[tip.id]}
                >
                  <PixelIcon
                    name="heart"
                    size={17}
                    style={{ opacity: favorite[tip.id] ? 1 : 0.22 }}
                    className={favorite[tip.id] ? "hn-pop" : ""}
                  />
                </button>
              </div>

              {/* 준비물 */}
              {tip.materials && (
                <div className="rounded-2xl px-3 py-2 mb-3" style={{ background: "#fffbe8", border: "2px dotted #f5b400" }}>
                  <p className="text-[11px] font-black mb-1 flex items-center gap-1" style={{ color: "#c98a00" }}>
                    <PixelIcon name="basket" size={13} /> 준비물
                  </p>
                  <p className="text-[13px] font-bold leading-relaxed" style={{ color: "#7a6a3a" }}>
                    {tip.materials.join(" · ")}
                  </p>
                </div>
              )}

              {/* 방법 */}
              <p className="text-[11px] font-black mb-1.5 flex items-center gap-1" style={{ color: cat.accent }}>
                <PixelIcon name={tip.type === "read" ? "book" : "pencil"} size={13} />
                {tip.type === "read" ? "알아두기" : "하는 방법"}
              </p>
              <ol className="space-y-1.5 mb-3">
                {tip.steps.map((s, i) => (
                  <li key={i} className="flex gap-2 text-[14px] leading-relaxed font-bold" style={{ color: "#5c4653" }}>
                    <span className="shrink-0" style={{ color: cat.accent }}>{tip.type === "read" ? "·" : `${i + 1}.`}</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ol>

              {/* 효과 */}
              <div className="rounded-xl px-3 py-2 mb-3" style={{ background: "#fff0f7", border: "2px solid #ffb3d8" }}>
                <p className="text-[13px] font-black leading-relaxed flex gap-1.5" style={{ color: "#c9186d" }}>
                  <PixelIcon name="sparkle" size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{tip.effect}</span>
                </p>
              </div>

              {tip.caution && (
                <div className="rounded-xl px-3 py-2 mb-3 text-[12px] leading-relaxed font-bold flex gap-1.5" style={{ background: "#fff5f5", border: "2px dotted #f7a8a8", color: "#c0392b" }}>
                  <PixelIcon name="warning" size={13} style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>{tip.caution}</span>
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
                  <span className="flex items-center gap-1 text-[12px]">
                    <PixelIcon name={isChecked ? "check" : "box"} size={12} />
                    {actionLabel} +{tip.points}점
                  </span>
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <p className="text-center text-[10px] mt-6 px-6 font-bold" style={{ color: "#c093ac" }}>
        그 시절 민간요법을 모은 추억 콘텐츠예요
      </p>
    </main>
  );
}

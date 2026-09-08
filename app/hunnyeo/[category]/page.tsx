"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { CATEGORIES, TIPS, CHECKED_STORAGE_KEY, type HunnyeoCategoryKey } from "@/lib/hunnyeoData";
import { loadJSON, saveJSON } from "@/lib/hunnyeoStorage";
import HunnyeoScoreBar from "@/components/HunnyeoScoreBar";

const RETRO_FONT = "'Malgun Gothic', 'Apple SD Gothic Neo', 'Gulim', sans-serif";
const bgStyle = {
  background: "linear-gradient(160deg, #ffe4f1 0%, #ffe9d6 35%, #e6e6ff 70%, #dff7ec 100%)",
  fontFamily: RETRO_FONT,
};

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
    <main className="min-h-screen pb-20" style={bgStyle}>
      <style>{`
        @keyframes hnPop { 0% { transform: scale(0.6); opacity: 0; } 60% { transform: scale(1.15); opacity: 1; } 100% { transform: scale(1); opacity: 1; } }
        .hn-pop { animation: hnPop 0.35s cubic-bezier(0.34,1.56,0.64,1); }
      `}</style>

      <div className="max-w-2xl mx-auto px-4 pt-4 flex items-center justify-between">
        <button onClick={() => router.push("/hunnyeo")} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "#fff", color: "#ff6fa5", border: "1.5px solid #ffc2dd" }}>
          ← 메뉴로
        </button>
        <button onClick={() => router.push("/hunnyeo/mypage")} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "#fff", color: "#8b5cf6", border: "1.5px solid #ddd0ff" }}>
          👧 내정보
        </button>
      </div>

      <header className="max-w-2xl mx-auto px-4 pt-4 pb-2 text-center">
        <p className="text-3xl mb-1">{cat.emoji}</p>
        <h1 className="text-2xl font-black mb-1" style={{ color: "#ff5c9a" }}>{cat.label}</h1>
        <p className="text-[12px] font-bold mb-4" style={{ color: "#a855f7" }}>{cat.desc} · {doneCount}/{tips.length} 완료</p>
        <HunnyeoScoreBar points={totalPoints} compact />
      </header>

      <div className="max-w-2xl mx-auto px-4 mt-4 space-y-4">
        {tips.map(tip => {
          const isChecked = !!checked[tip.id];
          const actionLabel = tip.type === "read" ? "읽었어요" : "해봤어요";
          return (
            <article
              key={tip.id}
              className="rounded-2xl p-4"
              style={{ background: "#fffdfb", border: `1.5px dashed ${cat.accent}88`, boxShadow: "0 6px 18px -10px rgba(0,0,0,0.15)" }}
            >
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
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
                  onClick={() => toggleCheck(tip.id)}
                  className={`shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-black transition-all active:scale-95 ${justChecked === tip.id ? "hn-pop" : ""}`}
                  style={{
                    background: isChecked ? "linear-gradient(135deg, #ff8fb3, #ff5c9a)" : "#fff",
                    color: isChecked ? "#fff" : "#ff5c9a",
                    border: "1.5px solid #ff8fb3",
                  }}
                >
                  {isChecked ? `✅ ${actionLabel}` : `☐ ${actionLabel}`} +{tip.points}pt
                </button>
              </div>
            </article>
          );
        })}
      </div>

      <p className="text-center text-[10px] mt-6 px-4" style={{ color: "#c9a0b5" }}>
        본 콘텐츠는 2000년대 인터넷 감성을 재현한 추억·오락용 콘텐츠입니다. 건강 관련 정보는 참고용으로만 봐주세요.
      </p>
    </main>
  );
}

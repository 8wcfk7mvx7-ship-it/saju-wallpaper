"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORIES,
  TIPS,
  LEVELS,
  TOTAL_POSSIBLE_POINTS,
  CHECKED_STORAGE_KEY,
  NICKNAME_STORAGE_KEY,
  getLevelInfo,
} from "@/lib/hunnyeoData";
import { loadJSON, saveJSON } from "@/lib/hunnyeoStorage";
import HunnyeoScoreBar from "@/components/HunnyeoScoreBar";

const RETRO_FONT = "'Malgun Gothic', 'Apple SD Gothic Neo', 'Gulim', sans-serif";
const bgStyle = {
  background: "linear-gradient(160deg, #ffe4f1 0%, #ffe9d6 35%, #e6e6ff 70%, #dff7ec 100%)",
  fontFamily: RETRO_FONT,
};

export default function HunnyeoMyPage() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [nickname, setNickname] = useState("완소소녀");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 최초 마운트 시 localStorage에서 1회 하이드레이션
    setChecked(loadJSON(CHECKED_STORAGE_KEY, {} as Record<string, boolean>));
    setNickname(loadJSON(NICKNAME_STORAGE_KEY, "완소소녀"));
  }, []);

  const totalPoints = useMemo(
    () => TIPS.reduce((sum, t) => sum + (checked[t.id] ? t.points : 0), 0),
    [checked]
  );
  const info = getLevelInfo(totalPoints);
  const checkedTips = TIPS.filter(t => checked[t.id]);
  const categoryTiles = CATEGORIES.filter(c => c.key !== "all");

  function saveNickname() {
    const clean = nameDraft.trim().slice(0, 14) || "완소소녀";
    setNickname(clean);
    saveJSON(NICKNAME_STORAGE_KEY, clean);
    setEditingName(false);
  }

  function resetProgress() {
    if (!confirm("훈녀력을 정말 초기화할까요? 체크했던 기록이 모두 사라져요ㅠㅠ")) return;
    setChecked({});
    saveJSON(CHECKED_STORAGE_KEY, {});
  }

  return (
    <main className="min-h-screen pb-20" style={bgStyle}>
      <div className="max-w-2xl mx-auto px-4 pt-4 flex items-center justify-between">
        <button onClick={() => router.push("/hunnyeo")} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "#fff", color: "#ff6fa5", border: "1.5px solid #ffc2dd" }}>
          ← 메뉴로
        </button>
        <button onClick={() => router.push("/")} className="text-xs font-bold px-3 py-1.5 rounded-full" style={{ background: "#fff", color: "#8b5cf6", border: "1.5px solid #ddd0ff" }}>
          🏠 홈
        </button>
      </div>

      {/* 프로필 카드 */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div
          className="rounded-[24px] p-5 text-center relative overflow-hidden"
          style={{ background: "#fff9fb", border: "3px dashed #ff9fc4" }}
        >
          <div
            className="w-16 h-16 mx-auto rounded-full flex items-center justify-center text-3xl mb-2"
            style={{ background: "linear-gradient(135deg, #ffd3e6, #ffe9d6)", border: "2px solid #fff" }}
          >
            {info.level.emoji}
          </div>

          {editingName ? (
            <div className="flex items-center justify-center gap-2 mb-1">
              <input
                autoFocus
                value={nameDraft}
                onChange={e => setNameDraft(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveNickname()}
                maxLength={14}
                className="text-center text-lg font-black rounded-lg px-2 py-1 outline-none"
                style={{ border: "1.5px solid #ffc2dd", color: "#3f2a37" }}
              />
              <button onClick={saveNickname} className="text-xs font-bold px-2 py-1 rounded-lg text-white" style={{ background: "#ff5c9a" }}>
                저장
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setNameDraft(nickname); setEditingName(true); }}
              className="text-lg font-black mb-1"
              style={{ color: "#3f2a37" }}
            >
              {nickname}님 ✎
            </button>
          )}

          <p className="text-xs font-bold mb-4" style={{ color: "#c084fc" }}>
            {info.level.name}
          </p>

          <div className="text-left">
            <HunnyeoScoreBar points={totalPoints} />
          </div>

          <p className="text-[11px] mt-3" style={{ color: "#a3a3a3" }}>
            전체 {TOTAL_POSSIBLE_POINTS}pt 중 {totalPoints}pt 획득 · {checkedTips.length}/{TIPS.length}개 완료
          </p>
        </div>
      </div>

      {/* 레벨 로드맵 */}
      <div className="max-w-2xl mx-auto px-4 mt-4">
        <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1.5px solid #ffd3e6" }}>
          <h3 className="font-black text-sm mb-3" style={{ color: "#ff5c9a" }}>🗺️ 훈녀력 레벨 로드맵</h3>
          <div className="space-y-2">
            {LEVELS.map((lv, i) => {
              const reached = totalPoints >= lv.min;
              const current = info.index === i;
              return (
                <div
                  key={lv.name}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                  style={{
                    background: current ? "#fff0f6" : "#fafafa",
                    border: current ? "1.5px solid #ff9fc4" : "1px solid #eee",
                    opacity: reached ? 1 : 0.55,
                  }}
                >
                  <span className="text-lg">{lv.emoji}</span>
                  <div className="flex-1">
                    <p className="text-xs font-black" style={{ color: reached ? "#3f2a37" : "#a3a3a3" }}>{lv.name}</p>
                    <p className="text-[10px]" style={{ color: "#a3a3a3" }}>{lv.min}pt 이상</p>
                  </div>
                  {current && <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white" style={{ background: "#ff5c9a" }}>현재</span>}
                  {reached && !current && <span className="text-xs">✅</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 카테고리별 진행률 */}
      <div className="max-w-2xl mx-auto px-4 mt-4">
        <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1.5px solid #ffd3e6" }}>
          <h3 className="font-black text-sm mb-3" style={{ color: "#ff5c9a" }}>📊 카테고리별 완료 현황</h3>
          <div className="space-y-2.5">
            {categoryTiles.map(c => {
              const tips = TIPS.filter(t => t.category === c.key);
              const done = tips.filter(t => checked[t.id]).length;
              const complete = done === tips.length;
              return (
                <button
                  key={c.key}
                  onClick={() => router.push(`/hunnyeo/${c.key}`)}
                  className="w-full text-left rounded-xl px-3 py-2.5"
                  style={{ background: "#fafafa", border: "1px solid #eee" }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black flex items-center gap-1.5" style={{ color: "#3f2a37" }}>
                      {c.emoji} {c.label} {complete && <span>🏅</span>}
                    </span>
                    <span className="text-[11px] font-bold" style={{ color: c.accent }}>{done}/{tips.length}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: `${c.accent}22` }}>
                    <div className="h-full rounded-full" style={{ width: tips.length ? `${(done / tips.length) * 100}%` : "0%", background: c.accent }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 내가 완료한 목록 */}
      <div className="max-w-2xl mx-auto px-4 mt-4">
        <div className="rounded-2xl p-4" style={{ background: "#fff", border: "1.5px solid #ffd3e6" }}>
          <h3 className="font-black text-sm mb-3" style={{ color: "#ff5c9a" }}>
            ✅ 내가 따라해본 훈녀생정 ({checkedTips.length})
          </h3>
          {checkedTips.length === 0 ? (
            <p className="text-xs text-center py-6" style={{ color: "#a3a3a3" }}>
              아직 체크한 정보가 없어요. 메뉴에서 하나씩 도전해보세요!
            </p>
          ) : (
            <div className="space-y-1.5">
              {checkedTips.map(t => (
                <div key={t.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "#fafafa" }}>
                  <span className="text-[12px] truncate pr-2" style={{ color: "#5c4653" }}>{t.title}</span>
                  <span className="text-[10px] font-bold shrink-0" style={{ color: "#ff5c9a" }}>+{t.points}pt</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-4">
        <button
          onClick={resetProgress}
          className="w-full py-2.5 rounded-xl text-xs font-bold"
          style={{ background: "#fff", color: "#b91c1c", border: "1.5px solid #fecaca" }}
        >
          훈녀력 초기화하기
        </button>
      </div>
    </main>
  );
}

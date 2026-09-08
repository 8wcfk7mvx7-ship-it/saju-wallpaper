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
  chapterOfCategory,
} from "@/lib/hunnyeoData";
import { loadJSON, saveJSON } from "@/lib/hunnyeoStorage";
import { pageStyle, RETRO_CSS, INK, INK_RED, INK_LIGHT, BOOK_FONT_GOTHIC } from "@/lib/hunnyeoTheme";

export default function HunnyeoMyPage() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [nickname, setNickname] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 최초 마운트 시 localStorage에서 1회 하이드레이션
    setChecked(loadJSON(CHECKED_STORAGE_KEY, {} as Record<string, boolean>));
    setNickname(loadJSON(NICKNAME_STORAGE_KEY, ""));
  }, []);

  const totalPoints = useMemo(
    () => TIPS.reduce((sum, t) => sum + (checked[t.id] ? t.points : 0), 0),
    [checked]
  );
  const info = getLevelInfo(totalPoints);
  const checkedTips = TIPS.filter(t => checked[t.id]);
  const chapters = CATEGORIES.filter(c => c.key !== "all");

  function saveNickname() {
    const clean = nameDraft.trim().slice(0, 14);
    setNickname(clean);
    saveJSON(NICKNAME_STORAGE_KEY, clean);
    setEditingName(false);
  }

  function resetProgress() {
    if (!confirm("기록을 모두 지울까요? 찍어 둔 확인 도장이 전부 사라집니다.")) return;
    setChecked({});
    saveJSON(CHECKED_STORAGE_KEY, {});
  }

  return (
    <main className="min-h-screen pb-16" style={pageStyle}>
      <style>{RETRO_CSS}</style>
      <div className="hn-staple" />

      <div className="max-w-2xl mx-auto px-5 pt-4" style={{ marginLeft: 14 }}>
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => router.push("/hunnyeo")} className="hn-btn px-3 py-1.5 text-[11px]">◀ 차례</button>
          <button onClick={() => router.push("/")} className="hn-btn px-3 py-1.5 text-[11px]">다른 서비스</button>
        </div>

        {/* 표제 */}
        <div className="text-center mb-6">
          <p className="text-[12px] mb-1" style={{ color: INK_RED, letterSpacing: ".3em", fontFamily: BOOK_FONT_GOTHIC }}>
            부　록
          </p>
          <h1 className="text-[28px] font-black hn-title mb-1">내 기록장</h1>
          <p className="text-[11px]" style={{ color: INK_LIGHT }}>해 본 것에 확인 도장을 찍어 두세요</p>
        </div>

        {/* 독자 카드 */}
        <div className="hn-frame-double p-4 mb-6 relative">
          <div className="hn-seal absolute right-3 top-3 w-16 h-16 text-[17px] font-black flex-col leading-none">
            <span className="text-[9px] mb-0.5">훈녀력</span>
            <span>{LEVELS.length - info.index}급</span>
          </div>

          <p className="text-[11px] font-bold mb-3" style={{ fontFamily: BOOK_FONT_GOTHIC, color: INK_RED }}>
            ▣ 독자 카드
          </p>

          <div className="flex items-end gap-2 mb-3">
            <span className="text-[12px] shrink-0" style={{ color: INK }}>이　름</span>
            {editingName ? (
              <>
                <input
                  autoFocus
                  value={nameDraft}
                  onChange={e => setNameDraft(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveNickname()}
                  maxLength={14}
                  className="flex-1 text-[14px] px-1 py-0.5 outline-none bg-transparent"
                  style={{ borderBottom: `1.5px solid ${INK}`, color: INK }}
                />
                <button onClick={saveNickname} className="hn-btn px-2 py-1 text-[10px]">적기</button>
              </>
            ) : (
              <button
                onClick={() => { setNameDraft(nickname); setEditingName(true); }}
                className="flex-1 text-left text-[15px] pb-0.5"
                style={{ borderBottom: `1.5px solid ${INK}`, color: nickname ? INK : INK_LIGHT, fontFamily: BOOK_FONT_GOTHIC }}
              >
                {nickname || "여기를 눌러 이름을 적으세요"}
              </button>
            )}
          </div>

          <div className="flex items-end gap-2 mb-3">
            <span className="text-[12px] shrink-0" style={{ color: INK }}>등　급</span>
            <span className="flex-1 text-[14px] pb-0.5 font-bold" style={{ borderBottom: `1.5px solid ${INK}`, color: INK_RED, fontFamily: BOOK_FONT_GOTHIC }}>
              {info.level.name}
            </span>
          </div>

          <div className="flex items-end gap-2 mb-4">
            <span className="text-[12px] shrink-0" style={{ color: INK }}>훈녀력</span>
            <span className="flex-1 text-[14px] pb-0.5 font-bold" style={{ borderBottom: `1.5px solid ${INK}`, color: INK, fontFamily: BOOK_FONT_GOTHIC }}>
              {totalPoints}점 / {TOTAL_POSSIBLE_POINTS}점 　({checkedTips.length}／{TIPS.length}가지 완료)
            </span>
          </div>

          <div className="h-4" style={{ border: `2px solid ${INK}`, background: "#fffdf5" }}>
            <div
              className="h-full"
              style={{
                width: `${Math.max(info.progress * 100, totalPoints > 0 ? 5 : 0)}%`,
                background: `repeating-linear-gradient(90deg, ${INK_RED} 0 5px, rgba(198,45,31,0.35) 5px 10px)`,
              }}
            />
          </div>
          <p className="text-[10px] mt-1.5 text-center" style={{ color: INK_LIGHT }}>
            {info.next ? `다음 등급 「${info.next.name}」까지 ${info.pointsToNext}점 남았습니다` : "최고 등급에 올랐습니다"}
          </p>
        </div>

        {/* 등급표 */}
        <p className="text-[12px] font-bold mb-2" style={{ fontFamily: BOOK_FONT_GOTHIC, color: INK_RED }}>▣ 등급표</p>
        <table className="w-full mb-6 text-[12px]" style={{ borderCollapse: "collapse" }}>
          <tbody>
            {LEVELS.map((lv, i) => {
              const reached = totalPoints >= lv.min;
              const current = info.index === i;
              return (
                <tr key={lv.name} style={{ background: current ? "rgba(198,45,31,0.08)" : "transparent" }}>
                  <td
                    className="px-2 py-1.5 text-center w-12 font-bold"
                    style={{ border: `1.5px solid ${INK}`, color: reached ? INK_RED : INK_LIGHT, fontFamily: BOOK_FONT_GOTHIC }}
                  >
                    {LEVELS.length - i}급
                  </td>
                  <td className="px-2 py-1.5 font-bold" style={{ border: `1.5px solid ${INK}`, color: reached ? INK : INK_LIGHT, fontFamily: BOOK_FONT_GOTHIC }}>
                    {lv.name}
                  </td>
                  <td className="px-2 py-1.5 text-center w-16" style={{ border: `1.5px solid ${INK}`, color: INK_LIGHT }}>{lv.min}점</td>
                  <td className="px-2 py-1.5 text-center w-12" style={{ border: `1.5px solid ${INK}`, color: INK_RED, fontFamily: BOOK_FONT_GOTHIC }}>
                    {current ? "현재" : reached ? "◎" : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 장별 진도표 */}
        <p className="text-[12px] font-bold mb-2" style={{ fontFamily: BOOK_FONT_GOTHIC, color: INK_RED }}>▣ 장별 진도표</p>
        <table className="w-full mb-6 text-[12px]" style={{ borderCollapse: "collapse" }}>
          <tbody>
            {chapters.map(c => {
              const catTips = TIPS.filter(t => t.category === c.key);
              const done = catTips.filter(t => checked[t.id]).length;
              const complete = done === catTips.length;
              return (
                <tr key={c.key} onClick={() => router.push(`/hunnyeo/${c.key}`)} className="cursor-pointer">
                  <td className="px-2 py-1.5 w-12 text-center" style={{ border: `1.5px solid ${INK}`, color: INK_LIGHT }}>
                    제{chapterOfCategory(c.key)}장
                  </td>
                  <td className="px-2 py-1.5 font-bold" style={{ border: `1.5px solid ${INK}`, fontFamily: BOOK_FONT_GOTHIC }}>
                    {c.label}
                  </td>
                  <td className="px-2 py-1.5 w-24" style={{ border: `1.5px solid ${INK}` }}>
                    <span className="tracking-tight" style={{ color: INK_RED }}>
                      {"◉".repeat(done)}
                      <span style={{ color: INK_LIGHT }}>{"○".repeat(catTips.length - done)}</span>
                    </span>
                  </td>
                  <td className="px-2 py-1.5 w-14 text-center" style={{ border: `1.5px solid ${INK}`, color: complete ? INK_RED : INK_LIGHT, fontFamily: BOOK_FONT_GOTHIC }}>
                    {done}/{catTips.length}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* 해 본 것 목록 */}
        <p className="text-[12px] font-bold mb-2" style={{ fontFamily: BOOK_FONT_GOTHIC, color: INK_RED }}>
          ▣ 내가 해 본 것 ({checkedTips.length}가지)
        </p>
        <div className="hn-frame p-3 mb-6">
          {checkedTips.length === 0 ? (
            <p className="text-[12px] text-center py-5" style={{ color: INK_LIGHT }}>
              아직 확인 도장을 찍은 것이 없습니다.<br />차례에서 하나씩 골라 보세요.
            </p>
          ) : (
            <ul className="space-y-1">
              {checkedTips.map(t => (
                <li key={t.id} className="flex items-baseline text-[12.5px]" style={{ color: INK }}>
                  <span className="shrink-0" style={{ color: INK_RED }}>☑</span>
                  <span className="ml-1.5">{t.title}</span>
                  <span className="hn-dots" />
                  <span className="shrink-0 text-[11px]" style={{ color: INK_LIGHT }}>{t.points}점</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button onClick={resetProgress} className="hn-btn w-full py-2 text-[11px]" style={{ borderColor: INK_LIGHT, color: INK_LIGHT, boxShadow: "2px 2px 0 rgba(107,97,84,0.5)" }}>
          기록 모두 지우기
        </button>

        <p className="hn-pageno text-[11px] mt-8">— 56 —</p>
        <p className="text-center text-[9px] mt-3" style={{ color: INK_LIGHT }}>
          완소문고 · 훈녀생정 · 정가 500원
        </p>
      </div>
    </main>
  );
}

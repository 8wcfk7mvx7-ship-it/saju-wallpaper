"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORIES,
  TIPS,
  LEVELS,
  TOTAL_POSSIBLE_POINTS,
  CHECKED_STORAGE_KEY,
  NICKNAME_STORAGE_KEY,
  AVATAR_STORAGE_KEY,
  getLevelInfo,
} from "@/lib/hunnyeoData";
import { loadJSON, saveJSON } from "@/lib/hunnyeoStorage";
import { fileToSquareDataUrl } from "@/lib/hunnyeoImage";
import { pageStyle, RETRO_CSS } from "@/lib/hunnyeoTheme";
import HunnyeoScoreBar from "@/components/HunnyeoScoreBar";
import PixelIcon from "@/components/PixelIcon";
import PixelFall from "@/components/PixelFall";
import { HunnyeoDisclaimerBox } from "@/components/HunnyeoDisclaimer";

export default function HunnyeoMyPage() {
  const router = useRouter();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [nickname, setNickname] = useState("완소소녀");
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [avatar, setAvatar] = useState<string>("");
  const [photoError, setPhotoError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 최초 마운트 시 localStorage에서 1회 하이드레이션
    setChecked(loadJSON(CHECKED_STORAGE_KEY, {} as Record<string, boolean>));
    setNickname(loadJSON(NICKNAME_STORAGE_KEY, "완소소녀"));
    setAvatar(loadJSON(AVATAR_STORAGE_KEY, ""));
  }, []);

  const totalPoints = useMemo(
    () => TIPS.reduce((sum, t) => sum + (checked[t.id] ? t.points : 0), 0),
    [checked]
  );
  const info = getLevelInfo(totalPoints);
  const checkedTips = TIPS.filter(t => checked[t.id]);
  const tiles = CATEGORIES.filter(c => c.key !== "all");

  function saveNickname() {
    const clean = nameDraft.trim().slice(0, 14) || "완소소녀";
    setNickname(clean);
    saveJSON(NICKNAME_STORAGE_KEY, clean);
    setEditingName(false);
  }

  async function handlePickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // 같은 파일을 다시 골라도 동작하도록 초기화
    if (!file) return;
    setPhotoError("");
    try {
      const dataUrl = await fileToSquareDataUrl(file);
      setAvatar(dataUrl);
      saveJSON(AVATAR_STORAGE_KEY, dataUrl);
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "사진을 넣지 못했어요.");
    }
  }

  function removePhoto() {
    setAvatar("");
    saveJSON(AVATAR_STORAGE_KEY, "");
    setPhotoError("");
  }

  function resetProgress() {
    if (!confirm("훈녀력을 정말 초기화할까요? 체크했던 기록이 모두 사라져요.")) return;
    setChecked({});
    saveJSON(CHECKED_STORAGE_KEY, {});
  }

  return (
    <main className="min-h-screen pb-20" style={pageStyle}>
      <style>{RETRO_CSS}</style>
        <PixelFall />

      <div className="max-w-2xl mx-auto px-4 pt-4 flex items-center justify-between">
        <button onClick={() => router.push("/")} className="hn-btn px-3 py-1.5 text-[11px]">
          ◀ 메뉴판
        </button>
        <span className="hn-sticker text-[10px]">내 정보</span>
      </div>

      {/* 프로필 */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="hn-box p-5 text-center relative" style={{ borderStyle: "dashed", borderWidth: 4 }}>
          <PixelIcon name="star" size={24} className="absolute -top-3 -left-3 hn-float" />
          <PixelIcon name="ribbon" size={26} className="absolute -top-3 -right-3 hn-float" style={{ animationDelay: ".7s" }} />

          <p className="text-[11px] font-black mb-2" style={{ color: "#ff6fb5" }}>─── 내 정보 ───</p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePickPhoto}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative w-24 h-24 mx-auto rounded-full flex items-center justify-center mb-2 overflow-hidden"
            style={{
              background: "repeating-linear-gradient(45deg,#ffe3f2 0 8px,#fff6da 8px 16px)",
              border: "3px solid #ff9ecb",
              boxShadow: "3px 3px 0 #ffd3e6",
            }}
            aria-label={avatar ? "프로필 사진 바꾸기" : "앨범에서 프로필 사진 넣기"}
          >
            {avatar ? (
              // 사용자가 고른 사진 (localStorage에만 저장되는 data URL)
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="내 프로필 사진" className="w-full h-full object-cover" />
            ) : (
              <PixelIcon name={info.level.icon} size={46} className="hn-wiggle" />
            )}

            <span
              className="absolute bottom-0 left-0 right-0 py-0.5 text-[9px] font-black"
              style={{ background: "rgba(255,61,154,0.85)", color: "#fff" }}
            >
              {avatar ? "사진 바꾸기" : "사진 넣기"}
            </span>
          </button>

          {avatar && (
            <button
              type="button"
              onClick={removePhoto}
              className="text-[10px] font-bold underline mb-1"
              style={{ color: "#b06a94" }}
            >
              사진 지우기
            </button>
          )}

          {photoError && (
            <p className="text-[11px] font-bold mb-1" style={{ color: "#c0392b" }}>{photoError}</p>
          )}

          {editingName ? (
            <div className="flex items-center justify-center gap-2 mb-1">
              <input
                autoFocus
                value={nameDraft}
                onChange={e => setNameDraft(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveNickname()}
                maxLength={14}
                className="text-center text-base font-black rounded-lg px-2 py-1 outline-none"
                style={{ border: "2px solid #ffb3d8", color: "#4a2c3d" }}
              />
              <button onClick={saveNickname} className="hn-btn hn-btn-on px-3 py-1.5 text-[11px]">저장</button>
            </div>
          ) : (
            <button onClick={() => { setNameDraft(nickname); setEditingName(true); }} className="text-xl font-black mb-1" style={{ color: "#4a2c3d" }}>
              {nickname}
            </button>
          )}

          <p className="text-xs font-black mb-4" style={{ color: "#9b6bf5" }}>{info.level.name}</p>

          <div className="text-left">
            <HunnyeoScoreBar points={totalPoints} />
          </div>

          <p className="text-[12px] font-bold mt-3" style={{ color: "#b06a94" }}>
            전체 {TOTAL_POSSIBLE_POINTS}점 중 {totalPoints}점 · {checkedTips.length}/{TIPS.length}개 완료
          </p>
        </div>
      </div>

      <div className="flex justify-center gap-1.5 my-4">
        {[0, 1, 2].map(i => (
          <PixelIcon key={i} name="heart" size={12} style={{ opacity: 0.55 }} />
        ))}
      </div>

      {/* 등급표 */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="hn-box hn-box-y p-4">
          <h3 className="hn-cute text-[15px] mb-3 flex items-center gap-1.5" style={{ color: "#c98a00" }}>
            <PixelIcon name="crown" size={15} /> 훈녀력 등급표
          </h3>
          <div className="space-y-2">
            {LEVELS.map((lv, i) => {
              const reached = totalPoints >= lv.min;
              const current = info.index === i;
              return (
                <div
                  key={lv.name}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2"
                  style={{
                    background: current ? "#fff6da" : "#fdfbf5",
                    border: current ? "2.5px solid #f5b400" : "2px dotted #eadfc0",
                    opacity: reached ? 1 : 0.5,
                  }}
                >
                  <PixelIcon name={lv.icon} size={22} />
                  <div className="flex-1">
                    <p className="hn-cute text-[13px]" style={{ color: reached ? "#7a5b00" : "#b5a98a" }}>{lv.name}</p>
                    <p className="text-[10px] font-bold" style={{ color: "#b5a98a" }}>{lv.min}점부터</p>
                  </div>
                  {current && <span className="text-[10px] font-black px-2 py-0.5 rounded-full text-white hn-blink" style={{ background: "#f5b400" }}>지금 여기!</span>}
                  {reached && !current && <PixelIcon name="check" size={15} />}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-1.5 my-4">
        {[0, 1, 2].map(i => (
          <PixelIcon key={i} name="heart" size={12} style={{ opacity: 0.55 }} />
        ))}
      </div>

      {/* 카테고리별 현황 */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="hn-box p-4">
          <h3 className="hn-cute text-[15px] mb-3 flex items-center gap-1.5" style={{ color: "#e0399b" }}>
            <PixelIcon name="note" size={15} /> 메뉴별 완료 현황
          </h3>
          <div className="space-y-2.5">
            {tiles.map(c => {
              const catTips = TIPS.filter(t => t.category === c.key);
              const done = catTips.filter(t => checked[t.id]).length;
              const complete = done === catTips.length;
              return (
                <button
                  key={c.key}
                  onClick={() => router.push(`/hunnyeo/${c.key}`)}
                  className="w-full text-left rounded-xl px-3 py-2.5"
                  style={{ background: "#fdfafc", border: `2px dotted ${c.accent}77` }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-black flex items-center gap-1.5" style={{ color: c.accent }}>
                      <PixelIcon name={c.icon} size={16} /> <span className="hn-cute text-[13px]">{c.label}</span>
                      {complete && <PixelIcon name="crown" size={13} className="hn-blink" />}
                    </span>
                    <span className="text-[11px] font-black" style={{ color: c.accent }}>{done}/{catTips.length}</span>
                  </div>
                  <div className="h-3 rounded-full overflow-hidden" style={{ background: "#f6f0f4", border: `2px solid ${c.accent}55` }}>
                    <div className="h-full" style={{ width: catTips.length ? `${(done / catTips.length) * 100}%` : "0%", background: c.accent }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-1.5 my-4">
        {[0, 1, 2].map(i => (
          <PixelIcon key={i} name="heart" size={12} style={{ opacity: 0.55 }} />
        ))}
      </div>

      {/* 완료 목록 */}
      <div className="max-w-2xl mx-auto px-4">
        <div className="hn-box hn-box-p p-4">
          <h3 className="hn-cute text-[15px] mb-3 flex items-center gap-1.5" style={{ color: "#7c3aed" }}>
            <PixelIcon name="heart" size={15} /> 내가 해본 것 ({checkedTips.length})
          </h3>
          {checkedTips.length === 0 ? (
            <p className="text-xs font-bold text-center py-6" style={{ color: "#a58ac9" }}>
              아직 체크한 것이 없어요.<br />메뉴판에서 하나씩 골라보세요!
            </p>
          ) : (
            <div className="space-y-1.5">
              {checkedTips.map(t => (
                <div key={t.id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "#faf5ff", border: "2px dotted #ddd0ff" }}>
                  <span className="text-[13px] font-bold truncate pr-2" style={{ color: "#57406b" }}>{t.title}</span>
                  <span className="text-[10px] font-black shrink-0" style={{ color: "#7c3aed" }}>+{t.points}점</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-4">
        <button
          onClick={resetProgress}
          className="hn-btn w-full py-2.5 text-[11px]"
          style={{ borderColor: "#f7a8a8", color: "#c0392b", boxShadow: "3px 3px 0 #ffd9d9" }}
        >
          훈녀력 초기화하기
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-4 mt-6">
        <HunnyeoDisclaimerBox />
      </div>
    </main>
  );
}

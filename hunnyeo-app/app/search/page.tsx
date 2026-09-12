"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  TIPS,
  CATEGORIES,
  CHECKED_STORAGE_KEY,
  FAVORITE_STORAGE_KEY,
} from "@/lib/hunnyeoData";
import { searchTips } from "@/lib/hunnyeoPick";
import { loadJSON, saveJSON } from "@/lib/hunnyeoStorage";
import { tapFeedback } from "@/lib/hunnyeoHaptics";
import { pageStyle, RETRO_CSS } from "@/lib/hunnyeoTheme";
import PixelIcon from "@/components/PixelIcon";
import PixelFall from "@/components/PixelFall";
import HunnyeoTipCard from "@/components/HunnyeoTipCard";

// 227개나 되므로 찾는 수단이 없으면 답답하다.
// 제목·태그·준비물·방법을 모두 뒤지고, 찜한 것만 따로 볼 수도 있다.

type Mode = "search" | "favorite";

export default function SearchPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("search");
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [favorite, setFavorite] = useState<Record<string, boolean>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 최초 마운트 시 localStorage에서 1회 하이드레이션
    setChecked(loadJSON(CHECKED_STORAGE_KEY, {} as Record<string, boolean>));
    setFavorite(loadJSON(FAVORITE_STORAGE_KEY, {} as Record<string, boolean>));
    inputRef.current?.focus();
  }, []);

  function toggleFavorite(id: string) {
    tapFeedback();
    setFavorite(prev => {
      const next = { ...prev, [id]: !prev[id] };
      if (!next[id]) delete next[id];
      saveJSON(FAVORITE_STORAGE_KEY, next);
      return next;
    });
  }

  const results = useMemo(() => {
    if (mode === "favorite") return TIPS.filter(t => favorite[t.id]);
    return searchTips(query);
  }, [mode, query, favorite]);

  const favoriteCount = Object.keys(favorite).length;
  const showEmptyHint = mode === "search" && query.trim().length === 0;

  return (
    <main className="min-h-screen pb-20" style={pageStyle}>
      <style>{RETRO_CSS}</style>
      <PixelFall />

      <div className="max-w-2xl mx-auto px-4 pt-4 flex items-center justify-between">
        <button onClick={() => router.push("/")} className="hn-btn px-3 py-1.5 text-[11px]">
          ◀ 메뉴판
        </button>
        <span className="hn-sticker text-[10px]">찾아보기</span>
      </div>

      {/* 검색창 */}
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <div className="hn-box p-3">
          <label htmlFor="hn-search" className="sr-only">생정 검색</label>
          <div className="flex items-center gap-2">
            <PixelIcon name="eye" size={18} />
            <input
              id="hn-search"
              ref={inputRef}
              value={query}
              onChange={e => {
                setQuery(e.target.value);
                if (mode !== "search") setMode("search");
              }}
              type="search"
              inputMode="search"
              placeholder="밀가루, 붓기, 봉숭아…"
              className="flex-1 min-w-0 bg-transparent outline-none text-[15px] font-bold"
              style={{ color: "#c9186d" }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="text-[11px] font-black px-2 py-1 rounded-full"
                style={{ background: "#ffe3f0", color: "#c9186d" }}
                aria-label="검색어 지우기"
              >
                지우기
              </button>
            )}
          </div>
        </div>

        {/* 검색 / 찜 전환 */}
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => setMode("search")}
            className={`hn-btn flex-1 py-2 text-[12px] ${mode === "search" ? "hn-btn-on" : ""}`}
          >
            검색
          </button>
          <button
            onClick={() => { setMode("favorite"); setQuery(""); }}
            className={`hn-btn flex-1 py-2 text-[12px] ${mode === "favorite" ? "hn-btn-on" : ""}`}
          >
            <span className="flex items-center justify-center gap-1">
              <PixelIcon name="heart" size={12} /> 찜한 것 {favoriteCount}
            </span>
          </button>
        </div>
      </div>

      {/* 결과 */}
      <div className="max-w-2xl mx-auto px-4 mt-4 space-y-3">
        {showEmptyHint ? (
          <div className="hn-box p-5 text-center">
            <PixelIcon name="basket" size={30} className="hn-float" />
            <p className="hn-cute text-[15px] mt-2" style={{ color: "#c9186d" }}>
              무엇을 찾아볼까요?
            </p>
            <p className="text-[12px] font-bold mt-1 mb-3" style={{ color: "#b08aa0" }}>
              재료 이름이나 고민을 넣어 보세요
            </p>
            <div className="flex flex-wrap justify-center gap-1.5">
              {["밀가루", "붓기", "봉숭아", "각질", "다이어트", "글자스킬"].map(w => (
                <button
                  key={w}
                  onClick={() => setQuery(w)}
                  className="text-[11px] font-black px-2.5 py-1 rounded-full"
                  style={{ background: "#fff", color: "#c9186d", border: "2px solid #ffb3d8" }}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="hn-box p-6 text-center">
            <PixelIcon name="droplet" size={28} style={{ opacity: 0.6 }} />
            <p className="hn-cute text-[15px] mt-2" style={{ color: "#c9186d" }}>
              {mode === "favorite" ? "아직 찜한 게 없어요" : "찾는 게 없어요"}
            </p>
            <p className="text-[12px] font-bold mt-1" style={{ color: "#b08aa0" }}>
              {mode === "favorite"
                ? "마음에 드는 항목의 하트를 눌러 두면 여기 모여요"
                : "낱말을 줄여서 다시 찾아 보세요"}
            </p>
          </div>
        ) : (
          <>
            <p className="text-[12px] font-black px-1" style={{ color: "#c9186d" }}>
              {results.length}개를 찾았어요
            </p>
            {results.map(tip => (
              <HunnyeoTipCard
                key={tip.id}
                tip={tip}
                done={!!checked[tip.id]}
                favorite={!!favorite[tip.id]}
                onToggleFavorite={() => toggleFavorite(tip.id)}
                onClick={() => router.push(`/${tip.category}/#${tip.id}`)}
              />
            ))}
          </>
        )}
      </div>

      <p className="text-center text-[10px] mt-6 px-6 font-bold" style={{ color: "#c093ac" }}>
        전체 {TIPS.length}가지 · {CATEGORIES.length - 1}개 장
      </p>
    </main>
  );
}

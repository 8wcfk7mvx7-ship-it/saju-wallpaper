"use client";
import { CATEGORIES, type HunnyeoTip } from "@/lib/hunnyeoData";
import PixelIcon from "@/components/PixelIcon";

// 검색 결과·오늘의 생정처럼 목록 밖에서 항목을 보여줄 때 쓰는 작은 카드.
// 장 화면의 큰 카드와 달리 제목·효과만 간추려 보여준다.

export default function HunnyeoTipCard({
  tip,
  onClick,
  favorite,
  onToggleFavorite,
  done,
}: {
  tip: HunnyeoTip;
  onClick?: () => void;
  favorite?: boolean;
  onToggleFavorite?: () => void;
  done?: boolean;
}) {
  const cat = CATEGORIES.find(c => c.key === tip.category);
  const accent = cat?.accent ?? "#ff6fb5";

  return (
    <div
      className="hn-box p-3.5 relative"
      style={{ borderColor: accent, boxShadow: `4px 4px 0 ${accent}55` }}
    >
      {done && (
        <span className="hn-sticker absolute -top-2.5 -right-2 flex items-center gap-1">
          <PixelIcon name="check" size={11} /> 완료
        </span>
      )}

      <button
        type="button"
        onClick={onClick}
        className="w-full text-left"
        aria-label={`${tip.title} 자세히 보기`}
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          {cat && <PixelIcon name={cat.icon} size={16} />}
          <span className="text-[10px] font-black" style={{ color: accent }}>
            {cat?.label}
          </span>
        </div>
        <h3 className="hn-cute text-[16px] leading-snug mb-1.5" style={{ color: "#c9186d" }}>
          {tip.title}
        </h3>
        <p className="text-[12.5px] font-bold leading-relaxed" style={{ color: "#7a6070" }}>
          {tip.effect}
        </p>
      </button>

      {onToggleFavorite && (
        <button
          type="button"
          onClick={onToggleFavorite}
          className="absolute bottom-3 right-3 p-1"
          aria-label={favorite ? "찜 해제" : "찜하기"}
          aria-pressed={favorite}
        >
          <PixelIcon
            name="heart"
            size={18}
            style={{ opacity: favorite ? 1 : 0.25 }}
            className={favorite ? "hn-pop" : ""}
          />
        </button>
      )}
    </div>
  );
}

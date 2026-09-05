"use client";
import { PixelArt, makeMask, unionMask, outlineify, mergeGrids, type Grid } from "@/components/PixelArt";

type ArtProps = { size?: number; className?: string; style?: React.CSSProperties };

// ── 해 ────────────────────────────────────────────────────────────────────
const SUN_W = 16, SUN_H = 16;
function sunGrid(): Grid {
  const cx = 8, cy = 8;
  const core = makeMask(SUN_W, SUN_H, (x, y) => Math.hypot(x - cx, y - cy) <= 3.2);
  const rayMask = makeMask(SUN_W, SUN_H, () => false);
  for (let a = 0; a < 8; a++) {
    const angle = (a * Math.PI) / 4;
    for (const r of [4.6, 5.6, 6.6]) {
      const px = Math.round(cx + r * Math.cos(angle) - 0.5);
      const py = Math.round(cy + r * Math.sin(angle) - 0.5);
      if (px >= 0 && py >= 0 && px < SUN_W && py < SUN_H) rayMask[py][px] = true;
    }
  }
  const core2 = outlineify(core, "#e8b23d", "#a3651a");
  const rays2 = outlineify(rayMask, "#e8b23d", "#e8b23d");
  return mergeGrids(SUN_W, SUN_H, rays2, core2);
}
export function SunPixel({ size = 40, className, style }: ArtProps) {
  return <PixelArt grid={sunGrid()} size={size} className={className} style={style} />;
}

// ── 구름 ──────────────────────────────────────────────────────────────────
const CLOUD_W = 20, CLOUD_H = 12;
function cloudGrid(): Grid {
  const puffs = unionMask(
    makeMask(CLOUD_W, CLOUD_H, (x, y) => Math.hypot(x - 6, y - 6.5) <= 3.6),
    makeMask(CLOUD_W, CLOUD_H, (x, y) => Math.hypot(x - 10.5, y - 4.8) <= 4.3),
    makeMask(CLOUD_W, CLOUD_H, (x, y) => Math.hypot(x - 15, y - 6.5) <= 3.4),
    makeMask(CLOUD_W, CLOUD_H, (x, y) => x >= 4 && x <= 17 && y >= 6.5 && y <= 8.5),
  );
  return outlineify(puffs, "#fffaee", "#6b4423");
}
export function CloudPixel({ size = 48, className, style }: ArtProps) {
  const grid = cloudGrid();
  return <PixelArt grid={grid} size={size} className={className} style={style} />;
}

// ── 복주머니 (福 주머니) — 새해 복을 담는 전통 주머니 ─────────────────────────
const POUCH_W = 14, POUCH_H = 16;
function pouchGrid(): Grid {
  const body = makeMask(POUCH_W, POUCH_H, (x, y) => {
    const dx = (x - 7) / 5.6, dy = (y - 10.5) / 5.2;
    return y >= 4.5 && dx * dx + dy * dy <= 1;
  });
  const neck = makeMask(POUCH_W, POUCH_H, (x, y) => x >= 5 && x <= 9 && y >= 2.5 && y <= 5.5);
  const bodyLayer = outlineify(body, "#c0392b", "#6e1f16");
  const neckLayer = outlineify(neck, "#d9a441", "#8a6420");
  // 복(福) 자리를 상징하는 작은 금박 점 장식
  const dot = makeMask(POUCH_W, POUCH_H, (x, y) => Math.hypot(x - 7, y - 10.5) <= 1.3);
  const dotLayer = outlineify(dot, "#f0c95a", "#d9a441");
  const merged = mergeGrids(POUCH_W, POUCH_H, bodyLayer, dotLayer, neckLayer);
  // 매듭 끈 두 가닥
  for (const cx of [5, 9]) {
    for (let y = 0; y <= 2; y++) merged[y][cx] = "#8a6420";
  }
  return merged;
}
export function PouchPixel({ size = 48, className, style }: ArtProps) {
  return <PixelArt grid={pouchGrid()} size={size} className={className} style={style} />;
}

// ── "행운" 도장(스탬프) — 전통 도장을 본뜬 배지 ───────────────────────────────
export function LuckStamp({ size = 88, rotate = -8, text = "幸" }: { size?: number; rotate?: number; text?: string }) {
  return (
    <div
      style={{
        width: size, height: size,
        background: "#b3382c",
        border: "3px solid #7a1f18",
        borderRadius: 6,
        display: "flex", alignItems: "center", justifyContent: "center",
        transform: `rotate(${rotate}deg)`,
        boxShadow: "3px 3px 0 rgba(74,50,32,0.35)",
        color: "#fdf3e0",
        fontFamily: "Galmuri, sans-serif",
        fontWeight: 700,
        fontSize: size * 0.42,
        lineHeight: 1,
      }}
    >
      {text}
    </div>
  );
}

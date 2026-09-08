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

// ── 포춘쿠키 — 초승달처럼 접힌 실루엣(두 원의 겹침으로 표현) ───────────────────
const COOKIE_W = 20, COOKIE_H = 14;
function cookieGrid(): Grid {
  const body = makeMask(COOKIE_W, COOKIE_H, (x, y) => {
    const outer = Math.hypot(x - 10, y - 8) <= 7.2;
    const bite = Math.hypot(x - 10, y - 2.5) <= 6.6; // 위쪽을 파내 초승달(접힌 쿠키) 모양으로
    return outer && !bite;
  });
  const layer = outlineify(body, "#e3b871", "#8a5a2b");
  // 살짝 접힌 자국을 표현하는 대각선 하이라이트
  const grid = mergeGrids(COOKIE_W, COOKIE_H, layer);
  for (const [x, y] of [[6, 9], [7, 10], [8, 11], [13, 9], [12, 10], [11, 11]]) {
    if (grid[y]?.[x]) grid[y][x] = "#f3d9a4";
  }
  return grid;
}
export function CookiePixel({ size = 40, className, style }: ArtProps) {
  return <PixelArt grid={cookieGrid()} size={size} className={className} style={style} />;
}

// ── 네잎클로버 — 앱 로고/브랜드 마크. 탭바의 CloverIcon(선 아이콘)과 같은
//    4원+줄기 구도를 픽셀아트로 그려서, 앱 아이콘·온보딩·로딩 화면까지
//    하나의 로고로 통일한다(기존 "幸" 도장은 다른 아이콘들과 스타일이
//    겉돌아서 이 클로버로 교체했다).
const CLOVER_W = 22, CLOVER_H = 24;
function cloverGrid(): Grid {
  const petal = (cx: number, cy: number) => makeMask(CLOVER_W, CLOVER_H, (x, y) => Math.hypot(x - cx, y - cy) <= 4.3);
  const petals = unionMask(petal(7.5, 8), petal(14.5, 8), petal(7.5, 15), petal(14.5, 15));
  const stem = makeMask(CLOVER_W, CLOVER_H, (x, y) => x >= 10 && x <= 12 && y >= 13 && y <= 22);
  const petalLayer = outlineify(petals, "#4d7c3a", "#2d4a22");
  const stemLayer = outlineify(stem, "#4d7c3a", "#2d4a22");
  const dot = makeMask(CLOVER_W, CLOVER_H, (x, y) => Math.hypot(x - 11, y - 11.5) <= 1.8);
  const dotLayer = outlineify(dot, "#d4922a", "#8a5a18");
  return mergeGrids(CLOVER_W, CLOVER_H, stemLayer, petalLayer, dotLayer);
}
export function CloverStamp({ size = 88, className, style }: ArtProps) {
  return <PixelArt grid={cloverGrid()} size={size} className={className} style={style} />;
}

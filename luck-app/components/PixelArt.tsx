// components/PixelArt.tsx — 도트(픽셀아트) 그래픽을 좌표 계산으로 그리는 유틸.
// 손으로 한 줄씩 아스키 그림을 세는 대신, 원/타원 방정식으로 실루엣(mask)을 만들고
// 가장자리 픽셀만 다른 색(테두리)으로 바꿔주는 방식이라 비율이 정확하고 고치기도 쉽다.
export type Grid = (string | null)[][];

export function PixelArt({ grid, size = 48, className, style }: { grid: Grid; size?: number; className?: string; style?: React.CSSProperties }) {
  const rows = grid.length;
  const cols = grid[0]?.length ?? rows;
  const cellSize = size / cols;
  const height = rows * cellSize;
  return (
    <svg width={size} height={height} viewBox={`0 0 ${cols} ${rows}`} className={className} style={style} shapeRendering="crispEdges">
      {grid.map((row, y) => row.map((color, x) => (color ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={color} /> : null)))}
    </svg>
  );
}

export function makeMask(w: number, h: number, test: (x: number, y: number) => boolean): boolean[][] {
  const mask: boolean[][] = [];
  for (let y = 0; y < h; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < w; x++) row.push(test(x + 0.5, y + 0.5));
    mask.push(row);
  }
  return mask;
}

export function unionMask(...masks: boolean[][][]): boolean[][] {
  const h = masks[0].length, w = masks[0][0].length;
  const out: boolean[][] = [];
  for (let y = 0; y < h; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < w; x++) row.push(masks.some((m) => m[y][x]));
    out.push(row);
  }
  return out;
}

// 실루엣(mask)을 채우고, 바깥과 맞닿은 픽셀만 테두리색으로 바꿔서 또렷한 픽셀아트 윤곽을 만든다.
export function outlineify(mask: boolean[][], fillColor: string, outlineColor: string): Grid {
  const h = mask.length, w = mask[0].length;
  const grid: Grid = [];
  for (let y = 0; y < h; y++) {
    const row: (string | null)[] = [];
    for (let x = 0; x < w; x++) {
      if (!mask[y][x]) { row.push(null); continue; }
      const isEdge = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        return nx < 0 || ny < 0 || nx >= w || ny >= h || !mask[ny][nx];
      });
      row.push(isEdge ? outlineColor : fillColor);
    }
    grid.push(row);
  }
  return grid;
}

// 여러 Grid를 겹쳐 그린다 (나중 것이 위에 그려짐, null은 투명이라 아래 레이어가 비쳐 보임)
export function mergeGrids(w: number, h: number, ...layers: Grid[]): Grid {
  const out: Grid = Array.from({ length: h }, () => Array<string | null>(w).fill(null));
  for (const layer of layers) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (layer[y]?.[x]) out[y][x] = layer[y][x];
  }
  return out;
}

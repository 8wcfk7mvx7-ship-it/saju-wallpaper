"use client";
// lib/shareCard.ts — "오늘의 운세"를 카톡/인스타 스토리 등에 공유할 수 있는
// 세로형 이미지 카드를 캔버스로 직접 그려서 만든다.
// html2canvas 같은 라이브러리 대신 Canvas 2D API로 손수 그리는 이유:
//  1) 앱 번들 크기를 늘리지 않고(모바일 앱이라 용량에 민감),
//  2) 커스텀 비트맵 폰트(Galmuri)·둥근 카드 등 지금 화면의 스타일을 그대로, 기기마다
//     다르게 깨지는 걱정 없이 안정적으로 재현할 수 있어서.
import { cloverGrid } from "@/components/LuckArt";

const COLOR = {
  bg: "#f8eced",
  ink: "#2d2e2f",
  inkSoft: "#6a6f72",
  clover: "#12533c",
  card: "#fdf6f7",
  cardBorder: "#2d2e2f",
};

const GRADE_COLOR: Record<string, string> = {
  S: "#d4922a", A: "#4d7c3a", B: "#8a6b4a", C: "#c2673a", D: "#b23a2e",
};

export interface ShareGrade {
  label: string; // "애정운" 등
  grade: string; // "S"~"D" 또는 "?"(미개인화)
}

export interface ShareCardInput {
  dateLabel: string;    // "10월 7일"
  seasonLabel: string;  // "추분"
  ganwoonTip: string;   // 오늘의 개운법 한 줄
  todayColor: string;   // "흰색·금색"
  todayNumbers: [number, number];
  grades: ShareGrade[]; // 애정운/금전운/직장운 순
}

function roundedRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function dashedLine(ctx: CanvasRenderingContext2D, x1: number, x2: number, y: number) {
  ctx.save();
  ctx.strokeStyle = COLOR.cardBorder;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x2, y);
  ctx.stroke();
  ctx.restore();
}

// 공백 기준 그리디 줄바꿈 — 한 단어가 그 자체로 너무 길면 글자 단위로도 쪼갠다.
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width <= maxWidth || !line) {
      line = test;
    } else {
      lines.push(line);
      line = word;
    }
    while (ctx.measureText(line).width > maxWidth && line.length > 1) {
      let cut = line.length - 1;
      while (cut > 1 && ctx.measureText(line.slice(0, cut)).width > maxWidth) cut--;
      lines.push(line.slice(0, cut));
      line = line.slice(cut);
    }
  }
  if (line) lines.push(line);
  return lines;
}

function drawCloverLogo(ctx: CanvasRenderingContext2D, x: number, y: number, height: number) {
  const grid = cloverGrid();
  const rows = grid.length, cols = grid[0].length;
  const cell = height / rows;
  for (let gy = 0; gy < rows; gy++) {
    for (let gx = 0; gx < cols; gx++) {
      const color = grid[gy][gx];
      if (!color) continue;
      ctx.fillStyle = color;
      ctx.fillRect(x + gx * cell, y + gy * cell, cell + 0.5, cell + 0.5);
    }
  }
  return cols * cell; // 그려진 가로폭 (다음 요소 배치에 사용)
}

async function ensureFontsLoaded() {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  try {
    await Promise.all([
      document.fonts.load("700 48px Galmuri"),
      document.fonts.load("400 40px Galmuri"),
    ]);
    await document.fonts.ready;
  } catch {
    // 폰트 로딩에 실패해도 기본 산세리프로 그려지도록 조용히 진행
  }
}

// data URL("data:image/png;base64,...")을 반환한다.
// 네이티브에서는 호출하는 쪽에서 "data:image/png;base64," 접두어를 떼고 Filesystem에 쓰면 된다.
export async function renderShareCardDataUrl(input: ShareCardInput): Promise<string> {
  await ensureFontsLoaded();

  const W = 1080, H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context를 만들 수 없어요.");

  const font = (weight: number, size: number) => `${weight} ${size}px Galmuri, "Apple SD Gothic Neo", sans-serif`;

  // 배경
  ctx.fillStyle = COLOR.bg;
  ctx.fillRect(0, 0, W, H);

  // 카드 패널
  const pad = 64;
  const panelX = pad, panelY = pad, panelW = W - pad * 2, panelH = H - pad * 2;
  roundedRectPath(ctx, panelX, panelY, panelW, panelH, 36);
  ctx.fillStyle = COLOR.card;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(45,46,47,0.12)";
  ctx.stroke();

  const innerPad = 56;
  const left = panelX + innerPad;
  const right = panelX + panelW - innerPad;
  const contentW = right - left;
  let cy = panelY + innerPad;

  // 헤더: 클로버 로고 + 워드마크
  const logoH = 56;
  const logoW = drawCloverLogo(ctx, left, cy, logoH);
  ctx.fillStyle = COLOR.ink;
  ctx.font = font(700, 34);
  ctx.textBaseline = "middle";
  ctx.fillText("행운의 어플", left + logoW + 18, cy + logoH / 2 + 2);
  cy += logoH + 48;

  // 날짜
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = COLOR.ink;
  ctx.font = font(700, 72);
  ctx.fillText(input.dateLabel, left, cy + 60);
  cy += 60 + 16;

  // 절기
  ctx.fillStyle = COLOR.inkSoft;
  ctx.font = font(400, 32);
  ctx.fillText(`${input.seasonLabel} 절기`, left, cy + 32);
  cy += 32 + 44;

  dashedLine(ctx, left, right, cy);
  cy += 48;

  // 오늘의 개운법
  ctx.fillStyle = COLOR.clover;
  ctx.font = font(700, 30);
  ctx.fillText("오늘의 개운법", left, cy + 30);
  cy += 30 + 32;

  ctx.fillStyle = COLOR.ink;
  ctx.font = font(400, 40);
  const tipLines = wrapText(ctx, input.ganwoonTip, contentW);
  const lineH = 58;
  for (const line of tipLines) {
    ctx.fillText(line, left, cy + 40);
    cy += lineH;
  }
  cy += 16;

  dashedLine(ctx, left, right, cy);
  cy += 48;

  // 행운의 컬러 / 행운의 숫자
  const statColW = contentW / 2;
  ctx.fillStyle = COLOR.inkSoft;
  ctx.font = font(700, 26);
  ctx.fillText("행운의 컬러", left, cy + 26);
  ctx.fillText("행운의 숫자", left + statColW, cy + 26);
  cy += 26 + 20;

  ctx.fillStyle = COLOR.ink;
  ctx.font = font(700, 48);
  ctx.fillText(input.todayColor, left, cy + 48);
  ctx.fillText(input.todayNumbers.join(" · "), left + statColW, cy + 48);
  cy += 48 + 44;

  dashedLine(ctx, left, right, cy);
  cy += 48;

  // 오늘의 운세 (애정운/금전운/직장운)
  ctx.fillStyle = COLOR.inkSoft;
  ctx.font = font(700, 26);
  ctx.fillText("오늘의 운세", left, cy + 26);
  cy += 26 + 36;

  const slot = contentW / input.grades.length;
  const circleR = 56;
  input.grades.forEach((g, i) => {
    const cx = left + slot * i + slot / 2;
    const circleCy = cy + circleR;
    ctx.beginPath();
    ctx.arc(cx, circleCy, circleR, 0, Math.PI * 2);
    ctx.fillStyle = g.grade === "?" ? COLOR.inkSoft : (GRADE_COLOR[g.grade] ?? COLOR.inkSoft);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = font(700, 48);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(g.grade, cx, circleCy + 2);
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    ctx.fillStyle = COLOR.inkSoft;
    ctx.font = font(700, 26);
    ctx.textAlign = "center";
    ctx.fillText(g.label, cx, circleCy + circleR + 40);
    ctx.textAlign = "left";
  });

  // 푸터
  ctx.fillStyle = COLOR.inkSoft;
  ctx.font = font(400, 26);
  ctx.textAlign = "center";
  ctx.globalAlpha = 0.8;
  ctx.fillText("매일 한 줄, 행운의 어플", panelX + panelW / 2, panelY + panelH - 36);
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";

  return canvas.toDataURL("image/png");
}

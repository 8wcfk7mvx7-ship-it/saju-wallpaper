// ── 자랑 카드 만들기 / 나누기 ─────────────────────────────────────────────
// 화면을 그대로 찍는 대신 캔버스에 직접 그린다. 웹폰트가 아직 안 실렸거나
// 스크롤 위치가 어정쩡해도 결과가 항상 같기 때문이다. 인터넷도 필요 없다.

import { LEVELS, TIPS, type LevelInfo } from "./hunnyeoData";

const W = 1080;
const H = 1350; // 4:5 — 인스타그램에 올리기 좋은 비율

// 도트 리본 (PixelIcon 의 ribbon 과 같은 그림)
const RIBBON = [
  "111.....111",
  "1111...1111",
  "11111.11111",
  "11111211111",
  "11111211111",
  "11111.11111",
  "1111...1111",
  "111.....111",
];
const RIBBON_COLORS = ["#ff6fb5", "#ff2b8d"];

function drawPixelArt(
  ctx: CanvasRenderingContext2D,
  rows: string[],
  colors: string[],
  x: number,
  y: number,
  cell: number
) {
  rows.forEach((row, ry) => {
    [...row].forEach((ch, rx) => {
      if (ch === ".") return;
      ctx.fillStyle = colors[Number(ch) - 1];
      ctx.fillRect(x + rx * cell, y + ry * cell, cell, cell);
    });
  });
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export interface ShareCardInput {
  nickname: string;
  info: LevelInfo;
  points: number;
  doneCount: number;
}

/** 자랑 카드를 PNG 데이터 URL 로 만든다. */
export function drawShareCard({ nickname, info, points, doneCount }: ShareCardInput): string {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("이미지를 만들 수 없어요.");

  // 배경: 분홍 사탕 줄무늬
  ctx.fillStyle = "#ffd6e8";
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 4);
  ctx.fillStyle = "#ffe9f2";
  for (let i = -H; i < H * 2; i += 120) ctx.fillRect(-H, i, H * 3, 60);
  ctx.restore();

  // 하얀 속지
  const pad = 60;
  ctx.fillStyle = "#fff";
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 48);
  ctx.fill();
  ctx.strokeStyle = "#ff3d9a";
  ctx.lineWidth = 10;
  ctx.setLineDash([26, 18]);
  roundRect(ctx, pad, pad, W - pad * 2, H - pad * 2, 48);
  ctx.stroke();
  ctx.setLineDash([]);

  const cx = W / 2;
  const font = (size: number, weight = "900") =>
    `${weight} ${size}px "Jua", "Apple SD Gothic Neo", "Noto Sans KR", sans-serif`;
  ctx.textAlign = "center";

  // 머리말
  ctx.fillStyle = "#ff6fb5";
  ctx.font = font(34);
  ctx.fillText("─── 나의 훈녀력 ───", cx, 200);

  // 리본
  drawPixelArt(ctx, RIBBON, RIBBON_COLORS, cx - (11 * 26) / 2, 250, 26);

  // 닉네임
  ctx.fillStyle = "#c9186d";
  ctx.font = font(76);
  ctx.fillText(nickname || "완소소녀", cx, 560);

  // 등급
  ctx.fillStyle = "#7c3aed";
  ctx.font = font(56);
  ctx.fillText(info.level.name, cx, 650);

  // 점수
  ctx.fillStyle = "#ff3d9a";
  ctx.font = font(130);
  ctx.fillText(`${points}점`, cx, 800);

  // 진행 막대
  const barW = W - 260;
  const barX = 130;
  const barY = 860;
  ctx.fillStyle = "#ffe3f0";
  roundRect(ctx, barX, barY, barW, 44, 22);
  ctx.fill();
  const ratio = Math.max(0.02, Math.min(1, info.progress ?? points / 100));
  ctx.fillStyle = "#ff3d9a";
  roundRect(ctx, barX, barY, barW * ratio, 44, 22);
  ctx.fill();

  // 해본 개수
  ctx.fillStyle = "#a8869a";
  ctx.font = font(38, "700");
  ctx.fillText(`${TIPS.length}가지 중 ${doneCount}개를 해봤어요`, cx, 970);

  // 등급표 (지금 등급을 굵게). 꼬리말과 겹치지 않도록 줄간격을 맞춰 둔다.
  const listTop = 1035;
  const lineGap = 40;
  ctx.font = font(30, "700");
  LEVELS.forEach((lv, i) => {
    const isNow = lv.name === info.level.name;
    ctx.fillStyle = isNow ? "#c9186d" : "#e3b9cd";
    ctx.fillText(isNow ? `▶ ${lv.name}` : lv.name, cx, listTop + i * lineGap);
  });

  // 꼬리말
  ctx.fillStyle = "#ff6fb5";
  ctx.font = font(32);
  ctx.fillText("훈녀생정 · 90년대생 추억 뷰티 노트", cx, listTop + LEVELS.length * lineGap + 42);

  return canvas.toDataURL("image/png");
}

/** 데이터 URL 을 Blob 으로. 공유·저장에 쓴다. */
function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(",");
  const mime = head.match(/:(.*?);/)?.[1] ?? "image/png";
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export type ShareOutcome = "shared" | "downloaded" | "longpress";

/**
 * 카드를 나눈다.
 * 1) 앱이면 시스템 공유창 (Capacitor Share)
 * 2) 웹이고 파일 공유가 되면 브라우저 공유창
 * 3) 둘 다 안 되면 내려받기
 * 어느 쪽도 안 되면 "이미지를 길게 눌러 저장" 안내로 넘긴다.
 */
export async function shareCard(dataUrl: string): Promise<ShareOutcome> {
  const fileName = "훈녀생정.png";

  // 1) 네이티브 앱
  try {
    const cap = await import("@capacitor/core");
    if (cap.Capacitor.isNativePlatform()) {
      const [{ Filesystem, Directory }, { Share }] = await Promise.all([
        import("@capacitor/filesystem"),
        import("@capacitor/share"),
      ]);
      const base64 = dataUrl.split(",")[1];
      const written = await Filesystem.writeFile({
        path: fileName,
        data: base64,
        directory: Directory.Cache,
      });
      await Share.share({
        title: "나의 훈녀력",
        text: "훈녀생정에서 내 훈녀력을 확인했어요!",
        files: [written.uri],
      });
      return "shared";
    }
  } catch {
    // 아래 웹 방식으로 넘어간다
  }

  // 2) 웹 공유 (파일 지원 시)
  try {
    const blob = dataUrlToBlob(dataUrl);
    const file = new File([blob], fileName, { type: "image/png" });
    const nav = navigator as Navigator & {
      canShare?: (d: { files: File[] }) => boolean;
      share?: (d: { files: File[]; title?: string }) => Promise<void>;
    };
    if (nav.canShare?.({ files: [file] }) && nav.share) {
      await nav.share({ files: [file], title: "나의 훈녀력" });
      return "shared";
    }
  } catch {
    // 아래 내려받기로 넘어간다
  }

  // 3) 내려받기
  try {
    const blob = dataUrlToBlob(dataUrl);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return "downloaded";
  } catch {
    return "longpress";
  }
}

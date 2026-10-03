// ── 프로필 사진 처리 ──────────────────────────────────────────────────────
// 앨범에서 고른 사진을 그대로 저장하면 localStorage 용량(보통 5MB)을 금방
// 넘기므로, 정사각형으로 잘라 작게 줄이고 JPEG로 다시 인코딩해서 저장한다.

const OUTPUT_SIZE = 240; // 저장할 정사각형 한 변 길이(px)
const JPEG_QUALITY = 0.82;

export async function fileToSquareDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("이미지 파일이 아니에요.");
  }

  const bitmapUrl = URL.createObjectURL(file);
  try {
    const img = await loadImage(bitmapUrl);

    // 가운데를 기준으로 정사각형만 잘라낸다.
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("이미지를 처리할 수 없어요.");
    ctx.drawImage(img, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    return canvas.toDataURL("image/jpeg", JPEG_QUALITY);
  } finally {
    URL.revokeObjectURL(bitmapUrl);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("사진을 불러오지 못했어요."));
    img.src = src;
  });
}

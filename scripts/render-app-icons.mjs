// 앱 아이콘 SVG를 iOS/PWA용 PNG 여러 크기로 렌더링한다.
// 실행: node scripts/render-app-icons.mjs
import { chromium } from "playwright-core";
import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const SVG_PATH = resolve("public/app-icons/epub-app-icon.svg");
const OUT_DIR = resolve("public/app-icons");
// iOS 앱 아이콘(1024) + 홈 화면/설정 크기들 + PWA 크기들
const SIZES = [1024, 512, 192, 180, 167, 152, 120, 87, 80, 60, 40];

const svg = readFileSync(SVG_PATH, "utf8");
mkdirSync(OUT_DIR, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage();

for (const size of SIZES) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<body style="margin:0">${svg.replace(/width="1024"/, `width="${size}"`).replace(/height="1024"/, `height="${size}"`)}</body>`,
    { waitUntil: "load" }
  );
  const out = `${OUT_DIR}/icon-${size}.png`;
  await page.screenshot({ path: out, omitBackground: false });
  console.log("wrote", out);
}

await browser.close();

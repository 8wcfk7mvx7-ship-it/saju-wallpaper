// scripts/capture-store-screenshots.mjs
// 앱스토어/플레이스토어 등록용 스크린샷을 헤드리스 브라우저로 자동 캡처합니다.
// Capacitor 앱이 실제로는 라이브 웹사이트(server.url)를 그대로 감싸는 웹뷰이므로,
// 웹 페이지 스크린샷이 곧 앱 화면 스크린샷과 동일합니다.
//
// 사용법: BASE_URL=http://localhost:3100 node scripts/capture-store-screenshots.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "fs";
import path from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3100";
const OUT_DIR = process.env.OUT_DIR || "store-assets/screenshots";
const CHROME_PATH = process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

// 스토어에서 요구하는 대표 해상도들
const DEVICES = [
  { name: "iphone-6.7", width: 1290, height: 2796, scale: 3 },   // iOS App Store (6.7" 필수 사이즈)
  { name: "android-phone", width: 1080, height: 1920, scale: 2 }, // Google Play (16:9 표준)
];

const PAGES = [
  { path: "/", label: "01-home" },
  { path: "/service/luck", label: "02-today-luck" },
  { path: "/service/today", label: "03-today-fortune" },
  { path: "/service/manseryeok", label: "04-manseryeok" },
];

async function run() {
  const browser = await chromium.launch({ executablePath: CHROME_PATH, headless: true });
  for (const device of DEVICES) {
    const dir = path.join(OUT_DIR, device.name);
    mkdirSync(dir, { recursive: true });
    const context = await browser.newContext({
      viewport: { width: Math.round(device.width / device.scale), height: Math.round(device.height / device.scale) },
      deviceScaleFactor: device.scale,
      isMobile: true,
    });
    const page = await context.newPage();
    for (const p of PAGES) {
      try {
        await page.goto(`${BASE_URL}${p.path}`, { waitUntil: "networkidle", timeout: 30000 });
        await page.waitForTimeout(800); // 폰트·애니메이션 안정화 대기
        const file = path.join(dir, `${p.label}.png`);
        await page.screenshot({ path: file });
        console.log(`saved ${file}`);
      } catch (err) {
        console.error(`failed ${device.name} ${p.path}:`, err.message);
      }
    }
    await context.close();
  }
  await browser.close();
}

run();

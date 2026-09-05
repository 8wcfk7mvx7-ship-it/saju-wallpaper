// scripts/capture-store-screenshots.mjs
// 앱스토어/플레이스토어 등록용 스크린샷을 헤드리스 브라우저로 자동 캡처합니다.
// Capacitor 앱이 실제로는 라이브 웹사이트(server.url)를 그대로 감싸는 웹뷰이므로,
// 웹 페이지 스크린샷이 곧 앱 화면 스크린샷과 동일합니다.
//
// 사용법: BASE_URL=http://localhost:3200 node scripts/capture-store-screenshots.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "fs";
import path from "path";

const BASE_URL = process.env.BASE_URL || "http://localhost:3200";
const OUT_DIR = process.env.OUT_DIR || "store-assets/screenshots";
const CHROME_PATH = process.env.CHROME_PATH || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

const DEVICES = [
  { name: "iphone-6.7", width: 1290, height: 2796, scale: 3 },
  { name: "android-phone", width: 1080, height: 1920, scale: 2 },
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

    try {
      // 1) 온보딩 위저드 — STEP 1/7 (환영 화면)
      await page.goto(BASE_URL, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      await page.screenshot({ path: path.join(dir, "01-onboarding-step1.png") });

      // 2) STEP 4/7 (생년월일) — 위저드 진행 UI를 보여주는 대표 스텝
      await page.click("text=다음"); // step1 -> 2
      await page.waitForTimeout(150);
      await page.click("text=다음"); // step2 -> 3
      await page.waitForTimeout(150);
      await page.click("text=다음"); // step3 -> 4
      await page.waitForTimeout(150);
      await page.fill('input[type="date"]', "1994-03-21");
      await page.screenshot({ path: path.join(dir, "02-onboarding-step4.png") });

      // 3) 나머지 스텝을 빠르게 통과해 대시보드 진입 (오늘 탭)
      await page.click("text=다음"); // -> 5
      await page.waitForTimeout(150);
      await page.click("text=다음"); // -> 6
      await page.waitForTimeout(150);
      await page.click("text=다음"); // -> 7
      await page.waitForTimeout(150);
      await page.click("text=시작하기");
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(dir, "03-dashboard-today.png"), fullPage: true });

      // 4) 메모 / 기록 탭 (하단 탭바)
      await page.click("text=메모");
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(dir, "04-dashboard-memo.png") });

      await page.click("text=기록");
      await page.waitForTimeout(300);
      await page.screenshot({ path: path.join(dir, "05-dashboard-log.png") });
    } catch (err) {
      console.error(`${device.name}: 캡처 실패`, err.message);
    }

    await context.close();
  }
  await browser.close();
  console.log("스크린샷 저장 완료:", OUT_DIR);
}

run();

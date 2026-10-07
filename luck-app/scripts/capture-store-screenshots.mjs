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
      await page.click("text=다음"); // -> 5 (태어난 시간)
      await page.waitForTimeout(150);
      await page.click("text=다음"); // -> 6 (성별)
      await page.waitForTimeout(150);
      await page.click("text=다음"); // -> 7 (아침 알림 받을지)
      await page.waitForTimeout(150);
      await page.click("text=다음"); // -> 8 (오늘의 메모, 마지막)
      await page.waitForTimeout(150);
      await page.click("text=시작하기");
      await page.waitForTimeout(2200);
      // 이 앱은 iOS WKWebView의 position:fixed 버그를 피하려고 body 자체는 절대
      // 스크롤되지 않게 잠가두고(overflow:hidden), 실제 스크롤은 안쪽 div가 맡는다
      // (app/page.tsx의 "h-full overflow-y-auto" 컨테이너). 그래서 Playwright의
      // fullPage 스크린샷이 문서 높이를 뷰포트 높이로만 재서 아래쪽이 잘린다 —
      // 캡처 직전에만 일시적으로 스크롤 잠금을 풀어 전체 높이가 제대로 측정되게 한다.
      await page.evaluate(() => {
        document.documentElement.style.overflow = "visible";
        document.documentElement.style.height = "auto";
        document.body.style.overflow = "visible";
        document.body.style.height = "auto";
        document.querySelectorAll("main").forEach((el) => {
          el.style.height = "auto";
          el.style.overflow = "visible";
        });
        document.querySelectorAll(".overflow-y-auto").forEach((el) => {
          el.style.height = "auto";
          el.style.overflow = "visible";
        });
      });
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(dir, "03-dashboard-today.png"), fullPage: true });

      // 위에서 풀어둔 overflow:hidden/100dvh를 코드로 "되돌리면" 될 것 같지만, 실제로는
      // 안 된다: Playwright의 fullPage 캡처가 캡처 중에만 뷰포트를 전체 콘텐츠 높이로
      // 키웠다가 되돌리는데, 그 과정에서 100dvh(동적 뷰포트 단위) 계산값이 꼬여서
      // main/스크롤 컨테이너가 실제 뷰포트보다 큰 상태로 남는다(스크롤 위치는 0인데도
      // 컨테이너 자체가 위로 밀려 보임). CSS를 일일이 복구하는 대신 그냥 새로고침해서
      // 완전히 깨끗한 상태로 메모/기록 탭을 다시 찍는다 — 생년월일은 이미 저장돼 있어서
      // 새로고침해도 온보딩을 다시 거치지 않고 바로 대시보드로 돌아온다.
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(1800);

      // 4) 메모 / 기록 탭 (하단 탭바)
      await page.click("text=메모");
      await page.waitForTimeout(800);
      await page.screenshot({ path: path.join(dir, "04-dashboard-memo.png") });

      await page.click("text=기록");
      await page.waitForTimeout(800);
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

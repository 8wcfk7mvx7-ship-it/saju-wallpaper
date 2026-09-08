// 아이폰/아이패드 앱 화면 샘플 스크린샷을 찍는다.
// 실행: npm run dev -- -p 3100 후 node scripts/shoot-app-screens.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3100";
const OUT = "/tmp/claude-0/-home-user-saju-wallpaper/122ea908-1a80-54ba-a354-e6b416c528d3/scratchpad/app-screens";
mkdirSync(OUT, { recursive: true });

const DEVICES = {
  phone: { width: 390, height: 844, scale: 2, label: "iPhone" },   // iPhone 14/15 기준
  tablet: { width: 834, height: 1194, scale: 2, label: "iPad" },   // iPad Air 세로
};

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const errors = [];

async function newPage(device) {
  const ctx = await browser.newContext({
    viewport: { width: device.width, height: device.height },
    deviceScaleFactor: device.scale,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  page.on("pageerror", e => errors.push(String(e)));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  // Next.js 개발용 오버레이가 화면 위를 덮어 클릭을 가로채므로 촬영 중에는 숨긴다.
  await page.addStyleTag({ content: "nextjs-portal{display:none !important}" }).catch(() => {});
  page.on("load", () => {
    page.addStyleTag({ content: "nextjs-portal{display:none !important}" }).catch(() => {});
  });
  return { ctx, page };
}

/** 원고 샘플을 채운다(빈 화면 대신 실제 쓰는 모습이 보이도록). */
async function seedContent(page, isPhone) {
  if (isPhone) {
    // 책 정보 탭에서 제목/지은이 입력
    await page.locator("nav").getByRole("button", { name: "책 정보" }).click();
    await page.getByPlaceholder("책 제목").fill("여름궁전의 밤");
    await page.getByPlaceholder("지은이").fill("김도윤");
    await page.locator("nav").getByRole("button", { name: "편집" }).click();
    await page.waitForTimeout(200);
  } else {
    // 책 정보 요약 줄(제목이 보이는 버튼)을 눌러 상세 패널을 열고 닫는다.
    const metaSummary = page.locator("button").filter({ hasText: "제목 없는 책" }).first();
    await metaSummary.click();
    await page.waitForTimeout(200);
    await page.getByPlaceholder("책 제목").fill("여름궁전의 밤");
    await page.getByPlaceholder("지은이").first().fill("김도윤");
    await page.locator("button").filter({ hasText: "여름궁전의 밤" }).first().click();
    await page.waitForTimeout(200);
  }

  await page.getByRole("button", { name: "소제목", exact: true }).click();
  await page.waitForTimeout(150);
  await page.getByPlaceholder("소제목을 입력하세요").last().fill("첫 번째 밤");

  await page.getByRole("button", { name: "문단", exact: true }).click();
  await page.waitForTimeout(150);
  await page.locator("textarea").last().fill(
    "여름궁전의 정원에는 밤마다 등이 켜졌다. 누가 켜는지는 아무도 몰랐지만, 등이 켜지면 사람들은 하던 일을 멈추고 창밖을 바라보았다."
  );

  await page.getByRole("button", { name: "인용구", exact: true }).click();
  await page.waitForTimeout(150);
  await page.locator("textarea").last().fill("빛은 언제나 문을 두드리는 쪽에서 온다.");

  await page.getByRole("button", { name: "문단", exact: true }).click();
  await page.waitForTimeout(150);
  await page.locator("textarea").last().fill(
    "그해 여름, 나는 그 등을 켜는 사람을 만났다. 그리고 그 만남이 내 삶의 방향을 바꾸어 놓았다."
  );
  await page.waitForTimeout(400);
}

for (const [key, device] of Object.entries(DEVICES)) {
  // 1) 로그인 화면
  {
    const { ctx, page } = await newPage(device);
    await page.goto(`${BASE}/epub-app?screen=login&device=${key}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${OUT}/${key}-1-login.png` });
    await ctx.close();
    console.log(`${device.label} 로그인 화면 촬영 완료`);
  }

  // 2) 편집 화면 (게스트로 진입 후 원고 작성)
  {
    const { ctx, page } = await newPage(device);
    await page.goto(`${BASE}/epub-app?device=${key}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    await page.getByRole("button", { name: "게스트로 시작" }).click();
    await page.waitForTimeout(800);
    await seedContent(page, key === "phone");
    await page.screenshot({ path: `${OUT}/${key}-2-editor.png` });
    console.log(`${device.label} 편집 화면 촬영 완료`);

    // 3) 미리보기 화면
    if (key === "phone") {
      await page.locator("nav").getByRole("button", { name: "미리보기" }).click();
    }
    await page.waitForTimeout(500);
    await page.screenshot({ path: `${OUT}/${key}-3-preview.png` });
    console.log(`${device.label} 미리보기 화면 촬영 완료`);

    // 4) 아이폰은 챕터/책정보 탭도 촬영
    if (key === "phone") {
      await page.locator("nav").getByRole("button", { name: "챕터" }).click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${OUT}/${key}-4-chapters.png` });

      await page.locator("nav").getByRole("button", { name: "책 정보" }).click();
      await page.waitForTimeout(400);
      await page.screenshot({ path: `${OUT}/${key}-5-book.png` });
      console.log(`${device.label} 챕터/책정보 화면 촬영 완료`);
    }
    await ctx.close();
  }
}

await browser.close();
console.log("errors:", errors.filter(e => !e.includes("net::ERR")).slice(0, 10));

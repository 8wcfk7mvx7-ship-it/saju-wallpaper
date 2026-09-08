// 앱스토어 제출용 스크린샷을 애플이 요구하는 정확한 픽셀 크기로 찍는다.
//
//   아이폰 6.9"  1320 x 2868  (440 x 956 pt @3x)  ← 필수
//   아이패드 13"  2064 x 2752 (1032 x 1376 pt @2x) ← 아이패드 지원 시 필수
//
// 실행: npm run dev -- -p 3100 후 node scripts/shoot-appstore-screens.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3100";
const OUT = process.env.OUT_DIR
  || "/tmp/claude-0/-home-user-saju-wallpaper/122ea908-1a80-54ba-a354-e6b416c528d3/scratchpad/appstore";
mkdirSync(OUT, { recursive: true });

const DEVICES = {
  iphone: { css: { width: 440, height: 956 }, scale: 3, out: "1320x2868", label: 'iPhone 6.9"' },
  ipad: { css: { width: 1032, height: 1376 }, scale: 2, out: "2064x2752", label: 'iPad 13"' },
};

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const made = [];

async function open(device) {
  const ctx = await browser.newContext({
    viewport: device.css,
    deviceScaleFactor: device.scale,
    isMobile: device.css.width < 700,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  const hide = () => page.addStyleTag({ content: "nextjs-portal{display:none !important}" }).catch(() => {});
  page.on("load", hide);
  await hide();
  return { ctx, page };
}

async function shoot(page, key, name, device) {
  const file = `${OUT}/${key}-${name}-${device.out}.png`;
  await page.screenshot({ path: file });
  made.push(`${device.label} · ${name}`);
  console.log("촬영:", file.split("/").pop());
}

/** 심사용 화면에 보여줄 원고를 채운다. */
async function writeSample(page, isPhone) {
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

  // 제목/지은이 채우기
  if (isPhone) {
    await page.locator("nav").getByRole("button", { name: "책 정보" }).click();
    await page.waitForTimeout(300);
    await page.getByPlaceholder("책 제목").fill("여름궁전의 밤");
    await page.getByPlaceholder("지은이").fill("김도윤");
    await page.locator("nav").getByRole("button", { name: "편집" }).click();
  } else {
    await page.locator("button").filter({ hasText: "제목 없는 책" }).first().click();
    await page.waitForTimeout(250);
    await page.getByPlaceholder("책 제목").fill("여름궁전의 밤");
    await page.getByPlaceholder("지은이").first().fill("김도윤");
    await page.locator("button").filter({ hasText: "여름궁전의 밤" }).first().click();
  }
  await page.waitForTimeout(500);
}

for (const [key, device] of Object.entries(DEVICES)) {
  const isPhone = key === "iphone";
  const deviceParam = isPhone ? "phone" : "tablet";

  // 1) 로그인
  {
    const { ctx, page } = await open(device);
    await page.goto(`${BASE}/epub-app?screen=login&device=${deviceParam}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(900);
    await shoot(page, key, "1-login", device);
    await ctx.close();
  }

  // 2~4) 책장 / 편집 / 미리보기
  {
    const { ctx, page } = await open(device);
    await page.goto(`${BASE}/epub-app?device=${deviceParam}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    await page.getByRole("button", { name: "게스트로 시작" }).click();
    await page.waitForTimeout(700);
    await page.getByRole("button", { name: "+ 새 책 만들기" }).click();
    await page.waitForTimeout(800);

    await writeSample(page, isPhone);
    await shoot(page, key, "2-editor", device);

    if (isPhone) {
      await page.locator("nav").getByRole("button", { name: "미리보기" }).click();
      await page.waitForTimeout(600);
      await shoot(page, key, "3-preview", device);
    } else {
      // 넓은 화면에서는 사이드바가 이미 펼쳐져 있다. 접혀 있을 때만 펼친다.
      const expand = page.getByRole("button", { name: "챕터 목록 펼치기" });
      if (await expand.isVisible().catch(() => false)) {
        await expand.click();
        await page.waitForTimeout(500);
      }
      await shoot(page, key, "3-sidebar", device);
    }

    // 저장해서 책장에 책이 보이게 만든다
    page.once("dialog", d => d.accept("여름궁전의 밤"));
    if (isPhone) {
      await page.locator("nav").getByRole("button", { name: "책 정보" }).click();
      await page.waitForTimeout(300);
      await page.getByRole("button", { name: "저장하기" }).click();
    } else {
      await page.locator("button").filter({ hasText: "파일" }).first().click();
      await page.waitForTimeout(300);
      await page.getByRole("button", { name: "저장", exact: true }).first().click();
    }
    await page.waitForTimeout(800);

    await page.getByRole("button", { name: isPhone ? "책장으로" : "‹ 책장" }).click();
    await page.waitForTimeout(800);
    await shoot(page, key, "4-library", device);

    await ctx.close();
  }
}

await browser.close();

console.log(`\n총 ${made.length}장:`);
made.forEach(m => console.log(" ·", m));
console.log(`\n저장 위치: ${OUT}`);

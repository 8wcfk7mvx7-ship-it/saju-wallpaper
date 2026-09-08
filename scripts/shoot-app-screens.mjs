// 아이폰/아이패드 앱의 모든 화면 샘플을 촬영한다.
// 실행: npm run dev -- -p 3100 후 node scripts/shoot-app-screens.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3100";
const OUT = process.env.SHOT_DIR
  || "/tmp/claude-0/-home-user-saju-wallpaper/122ea908-1a80-54ba-a354-e6b416c528d3/scratchpad/app-screens";
mkdirSync(OUT, { recursive: true });

const DEVICES = {
  phone: { width: 390, height: 844, scale: 2, label: "iPhone" },   // iPhone 14/15
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
  const hideOverlay = () => page.addStyleTag({ content: "nextjs-portal{display:none !important}" }).catch(() => {});
  page.on("load", hideOverlay);
  await hideOverlay();
  return { ctx, page };
}

/** 원고 샘플을 채운다(빈 화면 대신 실제 쓰는 모습이 보이도록). */
async function seedContent(page) {
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

/** 저장 이름을 묻는 prompt에 자동으로 답한다. */
function autoAnswerPrompt(page, answer) {
  page.once("dialog", d => d.accept(answer));
}

const shots = [];
async function shoot(page, name) {
  const path = `${OUT}/${name}.png`;
  await page.screenshot({ path });
  shots.push(name);
  console.log("촬영:", name);
}

// ── 아이폰: 로그인 → 책장 → 편집기 4탭 → 책장 → 설정 ──
{
  const device = DEVICES.phone;
  const { ctx, page } = await newPage(device);

  await page.goto(`${BASE}/epub-app?screen=login&device=phone`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shoot(page, "phone-1-login");

  await page.goto(`${BASE}/epub-app?device=phone`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "게스트로 시작" }).click();
  await page.waitForTimeout(700);
  await shoot(page, "phone-2-library-empty");

  await page.getByRole("button", { name: "+ 새 책 만들기" }).click();
  await page.waitForTimeout(800);
  await seedContent(page);
  await shoot(page, "phone-3-editor");

  // 책 정보 탭에서 제목/지은이 입력 후 저장
  await page.locator("nav").getByRole("button", { name: "책 정보" }).click();
  await page.waitForTimeout(300);
  await page.getByPlaceholder("책 제목").fill("여름궁전의 밤");
  await page.getByPlaceholder("지은이").fill("김도윤");
  await page.waitForTimeout(300);
  await shoot(page, "phone-4-book-info");

  autoAnswerPrompt(page, "여름궁전의 밤");
  await page.getByRole("button", { name: "저장하기" }).click();
  await page.waitForTimeout(600);

  await page.locator("nav").getByRole("button", { name: "미리보기" }).click();
  await page.waitForTimeout(500);
  await shoot(page, "phone-5-preview");

  await page.locator("nav").getByRole("button", { name: "챕터" }).click();
  await page.waitForTimeout(400);
  await shoot(page, "phone-6-chapters");

  // 책장으로 돌아가면 저장한 책이 보인다
  await page.getByRole("button", { name: "책장으로" }).click();
  await page.waitForTimeout(700);
  await shoot(page, "phone-7-library");

  await page.getByRole("button", { name: "설정" }).click();
  await page.waitForTimeout(500);
  await shoot(page, "phone-8-settings");

  await ctx.close();
}

// ── 아이패드: 로그인 → 책장 → 편집기 → 설정 ──
{
  const device = DEVICES.tablet;
  const { ctx, page } = await newPage(device);

  await page.goto(`${BASE}/epub-app?screen=login&device=tablet`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await shoot(page, "tablet-1-login");

  await page.goto(`${BASE}/epub-app?device=tablet`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.getByRole("button", { name: "게스트로 시작" }).click();
  await page.waitForTimeout(700);

  await page.getByRole("button", { name: "+ 새 책 만들기" }).click();
  await page.waitForTimeout(800);

  // 책 정보 요약 줄을 눌러 상세 패널을 열고 제목/지은이를 채운다.
  await page.locator("button").filter({ hasText: "제목 없는 책" }).first().click();
  await page.waitForTimeout(250);
  await page.getByPlaceholder("책 제목").fill("여름궁전의 밤");
  await page.getByPlaceholder("지은이").first().fill("김도윤");
  await page.locator("button").filter({ hasText: "여름궁전의 밤" }).first().click();
  await page.waitForTimeout(250);

  await seedContent(page);
  await shoot(page, "tablet-2-editor");

  // 챕터 사이드바를 펼친 모습
  await page.getByRole("button", { name: "챕터 목록 펼치기" }).click();
  await page.waitForTimeout(400);
  await shoot(page, "tablet-3-editor-sidebar");

  autoAnswerPrompt(page, "여름궁전의 밤");
  await page.locator("button").filter({ hasText: "파일" }).first().click();
  await page.waitForTimeout(300);
  await page.getByRole("button", { name: "저장", exact: true }).first().click();
  await page.waitForTimeout(600);

  await page.getByRole("button", { name: "‹ 책장" }).click();
  await page.waitForTimeout(700);
  await shoot(page, "tablet-4-library");

  await page.getByRole("button", { name: "설정" }).click();
  await page.waitForTimeout(500);
  await shoot(page, "tablet-5-settings");

  await ctx.close();
}

await browser.close();
console.log("\n총", shots.length, "장 촬영 완료");
const real = errors.filter(e => !e.includes("net::ERR"));
console.log("errors:", real.slice(0, 8));

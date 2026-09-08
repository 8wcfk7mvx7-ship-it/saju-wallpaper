// 앱(Capacitor) 저장 경로를 브라우저에서 흉내내어 확인한다.
// 실제 아이폰 없이도 (1) 플러그인 import가 되는지 (2) 파일 쓰기가 호출되는지
// (3) 공유 시트를 닫아도 저장이 유지되는지 (4) 안내 문구가 뜨는지를 잡아낸다.
//
// 실행: npm run dev -- -p 3100 후 node scripts/verify-native-save.mjs
import { chromium } from "playwright-core";

const BASE = "http://localhost:3100";
const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", e => errors.push(String(e)));
page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });

// Capacitor 런타임이 자기 자신을 등록한 "뒤"에 네이티브인 척 바꿔야 한다.
// (미리 넣어두면 @capacitor/core가 웹 구현으로 덮어써 버린다)
async function pretendNative() {
  await page.evaluate(() => {
    window.Capacitor = window.Capacitor || {};
    window.Capacitor.isNativePlatform = () => true;
  });
}

await page.addStyleTag({ content: "nextjs-portal{display:none !important}" }).catch(() => {});
page.on("load", () => page.addStyleTag({ content: "nextjs-portal{display:none !important}" }).catch(() => {}));

await page.goto(`${BASE}/epub-app?device=phone`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.getByRole("button", { name: "게스트로 시작" }).click();
await page.waitForTimeout(700);
await page.getByRole("button", { name: "+ 새 책 만들기" }).click();
await page.waitForTimeout(800);

await page.getByRole("button", { name: "문단", exact: true }).click();
await page.waitForTimeout(150);
await page.locator("textarea").last().fill("네이티브 저장 확인용 원고입니다.");

await page.locator("nav").getByRole("button", { name: "책 정보" }).click();
await page.waitForTimeout(300);
await page.getByPlaceholder("책 제목").fill("저장 테스트");
await page.locator("nav").getByRole("button", { name: "편집" }).click();
await page.waitForTimeout(400);

await pretendNative();
const nativeNow = await page.evaluate(() => window.Capacitor.isNativePlatform());
console.log("  네이티브로 인식되는가:", nativeNow);

page.on("dialog", d => { console.log("  [대화상자]", d.message().split("\n").slice(0,3).join(" / ")); d.accept(); });
await page.getByRole("button", { name: /내보내기/ }).click();
await page.waitForTimeout(4000);

const failures = [];
function check(label, ok, extra) {
  console.log(`${ok ? "✓" : "✗"} ${label}${extra ? ` (${extra})` : ""}`);
  if (!ok) failures.push(label);
}

// 저장 완료 안내가 떴는가 = 네이티브 경로가 끝까지 돌았다는 뜻
const notice = await page.getByText(/파일을 저장했어요/).isVisible().catch(() => false);
check("앱 저장 경로가 끝까지 실행되고 안내가 표시됨", notice);

const noticeText = notice ? await page.getByText(/파일을 저장했어요/).textContent() : "";
check("안내에 파일 위치가 들어감", /파일" 앱/.test(noticeText || ""), noticeText?.replace(/\n/g, " "));



const realErrors = errors.filter(e => !e.includes("net::ERR"));
check("자바스크립트 오류 없음", realErrors.length === 0);
if (realErrors.length) console.log(realErrors.slice(0, 5));

await browser.close();

if (failures.length) {
  console.error(`\n실패 ${failures.length}건:`, failures);
  process.exit(1);
}
console.log("\n앱 저장 경로 확인 완료");

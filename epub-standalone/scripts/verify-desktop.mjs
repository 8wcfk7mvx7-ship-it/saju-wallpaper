// 데스크톱 앱(맥/윈도우) 화면이 인터넷 없이도 끝까지 동작하는지 확인하고 화면을 찍는다.
// 실행: npm run build 후 node scripts/verify-desktop.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";
import path from "node:path";

const APP = `file://${path.resolve(import.meta.dirname, "../dist/index.html")}`;
const OUT = process.env.OUT_DIR
  || "/tmp/claude-0/-home-user-saju-wallpaper/122ea908-1a80-54ba-a354-e6b416c528d3/scratchpad/desktop";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const page = await browser.newPage({ viewport: { width: 1280, height: 860 }, deviceScaleFactor: 2 });
const errors = [];
page.on("pageerror", e => errors.push(String(e)));
page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
page.on("dialog", d => d.accept("여름궁전의 밤"));

const failures = [];
const check = (label, ok) => { console.log((ok ? "✓" : "✗"), label); if (!ok) failures.push(label); };

await page.goto(APP, { waitUntil: "networkidle" });
await page.waitForTimeout(900);
check("책장 화면으로 시작", await page.getByText("내 책장").isVisible().catch(() => false));

// 스타일이 통째로 빠지는 사고를 잡는다(화면 코드가 이 폴더 바깥에 있어 실제로 한 번 겪었다).
const styling = await page.evaluate(() => {
  const btn = [...document.querySelectorAll("button")].find(b => b.textContent?.includes("새 책 만들기"));
  if (!btn) return null;
  const s = getComputedStyle(btn);
  return { radius: s.borderRadius, display: getComputedStyle(document.querySelector("header")).display };
});
check("Tailwind 스타일이 적용됨", !!styling && styling.radius !== "0px" && styling.display === "flex");
await page.screenshot({ path: `${OUT}/1-library-empty.png` });

await page.getByRole("button", { name: "+ 새 책 만들기" }).click();
await page.waitForTimeout(900);
check("편집기 진입", await page.getByRole("button", { name: "문단", exact: true }).isVisible().catch(() => false));

await page.getByRole("button", { name: "소제목", exact: true }).click();
await page.waitForTimeout(200);
await page.getByPlaceholder("소제목을 입력하세요").last().fill("첫 번째 밤");
await page.getByRole("button", { name: "문단", exact: true }).click();
await page.waitForTimeout(200);
await page.locator("textarea").last().fill(
  "여름궁전의 정원에는 밤마다 등이 켜졌다. 누가 켜는지는 아무도 몰랐지만, 등이 켜지면 사람들은 하던 일을 멈추고 창밖을 바라보았다."
);
await page.getByRole("button", { name: "인용구", exact: true }).click();
await page.waitForTimeout(200);
await page.locator("textarea").last().fill("빛은 언제나 문을 두드리는 쪽에서 온다.");

await page.locator("button").filter({ hasText: "제목 없는 책" }).first().click();
await page.waitForTimeout(300);
await page.getByPlaceholder("책 제목").fill("여름궁전의 밤");
await page.getByPlaceholder("지은이").first().fill("김도윤");
await page.locator("button").filter({ hasText: "여름궁전의 밤" }).first().click();
await page.waitForTimeout(600);
check("미리보기에 원고가 그대로 보임", (await page.locator("body").innerText()).includes("첫 번째 밤"));
await page.screenshot({ path: `${OUT}/2-editor.png` });

// 인터넷 없이(file://) EPUB 내보내기
const [download] = await Promise.all([
  page.waitForEvent("download", { timeout: 20000 }),
  page.getByRole("button", { name: /EPUB 내보내기/ }).click(),
]);
const epubPath = `${OUT}/desktop-export.epub`;
await download.saveAs(epubPath);

const { readFileSync } = await import("node:fs");
const JSZip = (await import("jszip")).default;
const zip = await JSZip.loadAsync(readFileSync(epubPath));
const names = Object.keys(zip.files);
check("오프라인에서 EPUB 생성", names.length > 0);
check("EPUB 규격(mimetype 선두)", names[0] === "mimetype");
check("폰트가 파일 안에 들어감", names.some(n => /\.(woff2?|ttf|otf)$/.test(n)));
const chapter = await zip.file("OEBPS/text/chapter-1.xhtml").async("string");
check("본문이 담김", chapter.includes("여름궁전의 정원에는"));

// 저장 → 책장 복귀
await page.locator("button").filter({ hasText: "파일" }).first().click();
await page.waitForTimeout(300);
await page.getByRole("button", { name: "저장", exact: true }).first().click();
await page.waitForTimeout(900);
await page.getByRole("button", { name: "‹ 책장" }).click();
await page.waitForTimeout(900);
check("책장에 저장한 책이 보임", (await page.locator("body").innerText()).includes("여름궁전의 밤"));
await page.screenshot({ path: `${OUT}/3-library.png` });

await page.getByRole("button", { name: "설정" }).click();
await page.waitForTimeout(600);
check("설정 화면", await page.getByText("앱 정보").isVisible().catch(() => false));
await page.screenshot({ path: `${OUT}/4-settings.png` });

const real = errors.filter(e => !e.includes("net::ERR"));
check("자바스크립트 오류 없음", real.length === 0);
if (real.length) console.log(real.slice(0, 5));

await browser.close();
console.log(`\n화면: ${OUT}`);
if (failures.length) {
  console.error(`실패 ${failures.length}건:`, failures);
  process.exit(1);
}
console.log("데스크톱 앱 확인 완료");

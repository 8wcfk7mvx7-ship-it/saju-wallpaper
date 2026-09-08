// 앱 화면에서 EPUB 내보내기가 실제로 유효한 파일을 만드는지 끝까지 확인한다.
// 실행: npm run dev -- -p 3100 후 node scripts/verify-epub-export.mjs
import { chromium } from "playwright-core";
import { mkdirSync } from "node:fs";

const BASE = "http://localhost:3100";
const OUT = process.env.OUT_DIR
  || "/tmp/claude-0/-home-user-saju-wallpaper/122ea908-1a80-54ba-a354-e6b416c528d3/scratchpad/epub-verify";
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium" });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  acceptDownloads: true,
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", e => errors.push(String(e)));
page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
await page.addStyleTag({ content: "nextjs-portal{display:none !important}" }).catch(() => {});
page.on("load", () => page.addStyleTag({ content: "nextjs-portal{display:none !important}" }).catch(() => {}));

await page.goto(`${BASE}/epub-app?device=phone`, { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.getByRole("button", { name: "게스트로 시작" }).click();
await page.waitForTimeout(700);
await page.getByRole("button", { name: "+ 새 책 만들기" }).click();
await page.waitForTimeout(800);

// 원고 작성
await page.getByRole("button", { name: "소제목", exact: true }).click();
await page.waitForTimeout(150);
await page.getByPlaceholder("소제목을 입력하세요").last().fill("첫 번째 밤");
await page.getByRole("button", { name: "문단", exact: true }).click();
await page.waitForTimeout(150);
await page.locator("textarea").last().fill("여름궁전의 정원에는 밤마다 등이 켜졌다.");

// 책 정보 입력(제목이 없으면 내보내기 전에 경고가 뜬다)
await page.locator("nav").getByRole("button", { name: "책 정보" }).click();
await page.waitForTimeout(300);
await page.getByPlaceholder("책 제목").fill("여름궁전의 밤");
await page.getByPlaceholder("지은이").fill("김도윤");
await page.locator("nav").getByRole("button", { name: "편집" }).click();
await page.waitForTimeout(400);

// 내보내기
page.on("dialog", d => { console.log("경고창:", d.message().split("\n")[0]); d.accept(); });
const [download] = await Promise.all([
  page.waitForEvent("download", { timeout: 20000 }),
  page.getByRole("button", { name: /내보내기/ }).click(),
]);

const epubPath = `${OUT}/export-test.epub`;
await download.saveAs(epubPath);
await browser.close();

// ── 내려받은 파일이 진짜 EPUB인지 검사 ──
const { readFileSync } = await import("node:fs");
const JSZip = (await import("jszip")).default;

const zip = await JSZip.loadAsync(readFileSync(epubPath));
const names = Object.keys(zip.files);
const failures = [];

function check(label, ok) {
  console.log(`${ok ? "✓" : "✗"} ${label}`);
  if (!ok) failures.push(label);
}

// EPUB 규격: mimetype이 맨 앞에 무압축으로 들어가야 한다.
const firstEntry = names[0];
check("mimetype이 첫 항목", firstEntry === "mimetype");
check("mimetype 내용이 application/epub+zip", (await zip.file("mimetype").async("string")) === "application/epub+zip");
check("META-INF/container.xml 있음", names.includes("META-INF/container.xml"));
check("OPF 있음", names.some(n => n.endsWith(".opf")));
check("목차(nav) 있음", names.some(n => n.endsWith("nav.xhtml")));
check("NCX 있음", names.some(n => n.endsWith(".ncx")));
check("폰트 내장됨", names.some(n => /\.(woff2?|ttf|otf)$/.test(n)));

const chapter = await zip.file("OEBPS/text/chapter-1.xhtml").async("string");
check("본문에 소제목이 들어감", chapter.includes("첫 번째 밤"));
check("본문에 문단이 들어감", chapter.includes("여름궁전의 정원에는"));

const opfName = names.find(n => n.endsWith(".opf"));
const opf = await zip.file(opfName).async("string");
check("제목 메타데이터", opf.includes("여름궁전의 밤"));
check("지은이 메타데이터", opf.includes("김도윤"));

const realErrors = errors.filter(e => !e.includes("net::ERR"));
check("자바스크립트 오류 없음", realErrors.length === 0);
if (realErrors.length) console.log(realErrors);

console.log(`\n파일: ${epubPath}`);
if (failures.length) {
  console.error(`\n실패 ${failures.length}건:`, failures);
  process.exit(1);
}
console.log("EPUB 내보내기 정상 동작 확인 완료");

// 이펍공장 전용 Capacitor 설정으로 cap 명령을 실행한다.
// Capacitor CLI가 capacitor.config.ts만 읽기 때문에, 실행하는 동안만 설정 파일을 바꿔치기한다.
//
// 사용법:
//   node scripts/cap-epub.mjs add ios
//   node scripts/cap-epub.mjs sync ios
//   node scripts/cap-epub.mjs open ios
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, renameSync, unlinkSync } from "node:fs";

const MAIN = "capacitor.config.ts";
const EPUB = "capacitor.epub.config.ts";
const BACKUP = "capacitor.config.main.bak.ts";

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("실행할 cap 명령을 적어주세요. 예: node scripts/cap-epub.mjs sync ios");
  process.exit(1);
}

if (!existsSync(EPUB)) {
  console.error(`${EPUB} 파일이 없습니다.`);
  process.exit(1);
}

const hadMain = existsSync(MAIN);
if (hadMain) renameSync(MAIN, BACKUP);
copyFileSync(EPUB, MAIN);

const result = spawnSync("npx", ["cap", ...args], { stdio: "inherit" });

// 어떤 경우에도 원래 설정을 되돌려 놓는다.
unlinkSync(MAIN);
if (hadMain) renameSync(BACKUP, MAIN);

process.exit(result.status ?? 1);

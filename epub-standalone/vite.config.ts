import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";

// 데스크톱 앱은 웹앱의 소스를 그대로 가져다 쓴다(복사본을 두면 금방 어긋나기 때문).
// Next.js/Capacitor에만 있는 것들만 껍데기로 바꿔치기한다.
const repoRoot = path.resolve(__dirname, "..");
const ORIGINAL_FONTS = path.resolve(repoRoot, "lib/epub/fonts.ts");
const FONTS_SHIM = path.resolve(__dirname, "src/shims/fonts.ts");

/**
 * 폰트 목록을 데스크톱용(파일을 base64로 박아 넣은 것)으로 바꿔치기한다.
 * 별칭(alias)만으로는 부족한데, 웹앱 안에서 "./fonts"처럼 상대 경로로 부르는 곳이 있어
 * 최종적으로 어떤 파일로 이어지는지를 보고 판단해야 하기 때문이다.
 */
function useDesktopFonts() {
  return {
    name: "use-desktop-fonts",
    enforce: "pre" as const,
    async resolveId(source: string, importer: string | undefined, options: { isEntry: boolean }) {
      // 껍데기 자신이 원본을 불러오는 것은 그대로 둬야 한다(안 그러면 자기 자신을 무한히 부른다).
      if (importer === FONTS_SHIM) return null;
      const resolved = await (this as any).resolve(source, importer, { ...options, skipSelf: true });
      if (resolved && resolved.id === ORIGINAL_FONTS) return FONTS_SHIM;
      return null;
    },
  };
}

export default defineConfig({
  plugins: [useDesktopFonts(), react(), tailwindcss(), viteSingleFile()],
  resolve: {
    // 순서가 중요하다. 좁은 규칙(개별 파일)이 넓은 규칙("@/")보다 먼저 와야 한다.
    alias: [
      // 데스크톱은 계정 없이 쓰므로 로그인 서버 연결이 없다.
      { find: /^@\/lib\/supabaseClient$/, replacement: path.resolve(__dirname, "src/shims/supabaseClient.ts") },
      // 데스크톱에는 Next.js 라우터가 없다.
      { find: /^next\/navigation$/, replacement: path.resolve(__dirname, "src/shims/next-navigation.ts") },
      // 네이티브 플러그인은 쓰지 않지만 동적 import가 있어 껍데기가 필요하다.
      { find: /^@capacitor\/filesystem$/, replacement: path.resolve(__dirname, "src/shims/capacitor.ts") },
      { find: /^@capacitor\/share$/, replacement: path.resolve(__dirname, "src/shims/capacitor.ts") },
      // 나머지 "@/..."는 웹앱 소스를 그대로 가리킨다.
      { find: /^@\//, replacement: `${repoRoot}/` },
    ],
  },
  build: {
    outDir: "dist",
    // 폰트까지 전부 HTML 한 장에 넣어 인터넷 없이도 열리게 한다.
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
  },
});

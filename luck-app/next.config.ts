import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // 서버 기능이 없는 완전한 클라이언트 앱이라 정적 파일로 내보내 Capacitor에 그대로 번들링한다.
  output: "export",
  // 상위 저장소(saju-wallpaper)의 lockfile과 워크스페이스 루트 추정이 섞이지 않도록 고정
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;

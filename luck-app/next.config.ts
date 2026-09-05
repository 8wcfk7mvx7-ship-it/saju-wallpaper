import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // 상위 저장소(saju-wallpaper)의 lockfile과 워크스페이스 루트 추정이 섞이지 않도록 고정
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;

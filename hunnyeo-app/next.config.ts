import type { NextConfig } from "next";

// 훈녀생정은 서버를 쓰지 않는다(네트워크 호출 0). 그래서 통째로 정적 파일로
// 뽑아 앱 안에 담는다. 비행기 모드에서도 전부 동작하고, 앱스토어 심사에서
// "웹사이트를 그대로 감싼 앱"(가이드라인 4.2)으로 보일 여지도 줄어든다.
const nextConfig: NextConfig = {
  output: "export",

  // /love → /love/index.html 로 떨어뜨린다. 앱 안에서 경로를 찾기 쉬워진다.
  trailingSlash: true,

  // 이미지 최적화 서버가 없으므로 끈다.
  images: { unoptimized: true },
};

export default nextConfig;

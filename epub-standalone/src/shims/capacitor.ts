// 데스크톱 앱은 Capacitor 네이티브 플러그인을 쓰지 않는다.
// download.ts가 동적으로 import하기 때문에 빌드가 깨지지 않도록 빈 껍데기만 둔다.
// (실제로는 isNativePlatform()이 false라 호출되지 않는다)
export const Filesystem = {
  writeFile: async () => {
    throw new Error("데스크톱 앱에서는 사용하지 않습니다.");
  },
};

export const Directory = {
  Documents: "DOCUMENTS",
  Cache: "CACHE",
};

export const Share = {
  share: async () => {
    throw new Error("데스크톱 앱에서는 사용하지 않습니다.");
  },
};

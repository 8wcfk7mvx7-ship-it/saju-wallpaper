// 데스크톱 앱에는 Next.js 라우터가 없다.
// 편집기가 쓰는 부분(창 닫기 버튼의 router.push)만 흉내낸다.
export function useRouter() {
  return {
    push: (_path: string) => {
      // 데스크톱 앱에서는 이동할 다른 페이지가 없다. 창 닫기로 처리한다.
      window.close();
    },
    replace: (_path: string) => {},
    back: () => {},
    refresh: () => {},
    prefetch: () => {},
  };
}

export function usePathname() {
  return "/epub-app";
}

export function useSearchParams() {
  return new URLSearchParams();
}

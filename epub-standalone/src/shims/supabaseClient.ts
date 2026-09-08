// 데스크톱 앱은 계정 없이 이 기기에만 저장한다. 로그인 서버에 연결하지 않는다.
export const supabaseBrowser = null;

export function isAuthConfigured() {
  return false;
}

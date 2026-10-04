"use client";
// lib/auth.ts — 애플/구글/이메일 로그인 (Supabase Auth 사용)
// 로그인은 완전히 선택사항이다 — 안 해도 기존처럼 기기 안 localStorage로 계속 쓸 수 있고,
// 로그인하면 lib/cloudSync.ts가 데이터를 Supabase로 백업·복원해준다.
//
// 네이티브 앱(iOS/Android)에서는 구글/애플이 웹뷰 안에서의 로그인을 막기 때문에, OAuth는
// @capacitor/browser로 시스템 브라우저(사파리/크롬)를 열어 진행하고, 로그인이 끝나면
// 앱의 커스텀 URL 스킴(kr.ai.luckyapp.app://login-callback)으로 돌아오는 딥링크를
// @capacitor/app의 appUrlOpen 이벤트로 받아 세션을 완성한다
// (네이티브 쪽 등록: android/.../AndroidManifest.xml의 intent-filter, ios/.../Info.plist의
// CFBundleURLTypes). 웹에서는 기존처럼 같은 창에서 바로 리다이렉트한다.
//
// 이 코드가 실제로 동작하려면 Supabase 프로젝트가 있어야 하고(아직 없으면 생성 후
// supabase/schema.sql 실행), 대시보드 Authentication > URL Configuration에
// kr.ai.luckyapp.app://login-callback 을 Redirect URL로 등록하고, Authentication > Providers에서
// Apple/Google을 각각 설정(Apple: Services ID·Team ID·Key ID·Private Key, Google: OAuth
// 클라이언트 ID·시크릿)해야 한다. 그 전까지는 버튼이 눌려도 로그인이 완료되지 않는다.
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { App } from "@capacitor/app";
import { getSupabase, isCloudSyncConfigured } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

export { isCloudSyncConfigured };

const NATIVE_REDIRECT = "kr.ai.luckyapp.app://login-callback";

async function signInWithOAuthProvider(provider: "apple" | "google"): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  if (Capacitor.isNativePlatform()) {
    // 네이티브: 웹뷰 안에서 바로 리다이렉트하지 않고, OAuth URL만 받아와서 시스템 브라우저로 연다.
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: NATIVE_REDIRECT, skipBrowserRedirect: true },
    });
    if (error) return { error: error.message };
    if (data.url) await Browser.open({ url: data.url });
    return { error: null };
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
  });
  return { error: error?.message ?? null };
}

export function signInWithApple(): Promise<{ error: string | null }> {
  return signInWithOAuthProvider("apple");
}

export function signInWithGoogle(): Promise<{ error: string | null }> {
  return signInWithOAuthProvider("google");
}

// 네이티브 앱에서만 등록 — 시스템 브라우저가 kr.ai.luckyapp.app://login-callback으로 돌아올 때
// 그 URL에 담긴 토큰으로 Supabase 세션을 완성한다. 세션이 설정되면 onAuthChange 구독자(아래)가
// 알아서 반응하므로, 여기서는 세션만 만들어주면 된다. 반환값은 구독 해제 함수.
export function listenForNativeAuthRedirect(): () => void {
  if (!Capacitor.isNativePlatform() || !isCloudSyncConfigured()) return () => {};
  const supabase = getSupabase();
  const handle = App.addListener("appUrlOpen", async ({ url }) => {
    if (!url.startsWith(NATIVE_REDIRECT)) return;
    const fragment = url.split("#")[1] ?? url.split("?")[1] ?? "";
    const params = new URLSearchParams(fragment);
    const access_token = params.get("access_token");
    const refresh_token = params.get("refresh_token");
    if (access_token && refresh_token) {
      await supabase.auth.setSession({ access_token, refresh_token });
    }
    await Browser.close().catch(() => {});
  });
  return () => { handle.then((h) => h.remove()); };
}

export async function signUpWithEmail(email: string, password: string): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signUp({ email, password });
  return { error: error?.message ?? null };
}

export async function signInWithEmail(email: string, password: string): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error?.message ?? null };
}

export async function sendPasswordReset(email: string): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  return { error: error?.message ?? null };
}

export async function signOut(): Promise<void> {
  if (!isCloudSyncConfigured()) return;
  await getSupabase().auth.signOut();
}

export async function getCurrentUser(): Promise<User | null> {
  if (!isCloudSyncConfigured()) return null;
  const { data } = await getSupabase().auth.getUser();
  return data.user ?? null;
}

// 로그인 상태 변화를 구독한다 (로그인/로그아웃/토큰 갱신 시 콜백 호출). 반환값을 호출해 구독 해제.
export function onAuthChange(callback: (session: Session | null) => void): () => void {
  if (!isCloudSyncConfigured()) return () => {};
  const { data } = getSupabase().auth.onAuthStateChange((_event, session) => callback(session));
  return () => data.subscription.unsubscribe();
}

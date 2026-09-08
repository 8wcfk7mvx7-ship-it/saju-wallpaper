"use client";
// lib/auth.ts — 애플/구글/이메일 로그인 (Supabase Auth 사용)
// 로그인은 완전히 선택사항이다 — 안 해도 기존처럼 기기 안 localStorage로 계속 쓸 수 있고,
// 로그인하면 lib/cloudSync.ts가 데이터를 Supabase로 백업·복원해준다.
//
// 네이티브 앱(iOS/Android)에서 애플/구글 로그인을 쓰려면 Supabase 대시보드의
// Authentication > URL Configuration에 앱의 커스텀 스킴(예: kr.ai.luckyapp.app://login-callback)을
// Redirect URL로 등록하고, @capacitor/browser로 시스템 브라우저를 열어 로그인시킨 뒤 딥링크로
// 돌아오게 하는 별도 배선이 필요하다 — 이 환경에서는 네이티브 빌드 자체를 못 해봐서 웹 리다이렉트
// 방식만 구현·확인했다.
import { getSupabase, isCloudSyncConfigured } from "@/lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

export { isCloudSyncConfigured };

export async function signInWithApple(): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "apple",
    options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
  });
  return { error: error?.message ?? null };
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  const supabase = getSupabase();
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
  });
  return { error: error?.message ?? null };
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

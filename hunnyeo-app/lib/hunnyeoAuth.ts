// ── 애플 · 구글 로그인 ────────────────────────────────────────────────────
// 브라우저를 열지 않고 기기 안에서 바로 뜨는 로그인 창을 쓴다.
// 로그인은 "여러 기기 기록 동기화"를 위한 것이지, 앱을 쓰는 데 필수가 아니다.
// 웹 미리보기(브라우저)에서는 지원하지 않는다 — 앱에서만 켜진다.

import { supabase } from "./hunnyeoSupabase";

const APPLE_CLIENT_ID = "kr.ai.hunnyeo.app";
const GOOGLE_IOS_CLIENT_ID = "752770746287-uvg8aeroioekmipf1s6b5hh2kvoik6e7.apps.googleusercontent.com";
const GOOGLE_WEB_CLIENT_ID = "752770746287-u34u96u5dcfk1e16clgn3s1bt1bpo67d.apps.googleusercontent.com";

export interface HunnyeoUser {
  id: string;
  email: string | null;
  name: string | null;
}

async function isNative(): Promise<boolean> {
  const cap = await import("@capacitor/core");
  return cap.Capacitor.isNativePlatform();
}

export async function authAvailable(): Promise<boolean> {
  return isNative();
}

export async function signInWithApple(): Promise<HunnyeoUser | null> {
  if (!(await isNative())) return null;
  const { SignInWithApple } = await import("@capacitor-community/apple-sign-in");
  const result = await SignInWithApple.authorize({
    clientId: APPLE_CLIENT_ID,
    // 네이티브 흐름에서는 실제로 열리지 않지만 플러그인이 값 자체는 요구한다.
    redirectURI: "https://hunnyeo.app/auth/callback",
    scopes: "email name",
  });
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "apple",
    token: result.response.identityToken,
  });
  if (error) throw error;
  return currentUser();
}

export async function signInWithGoogle(): Promise<HunnyeoUser | null> {
  if (!(await isNative())) return null;
  const { GoogleAuth } = await import("@southdevs/capacitor-google-auth");
  await GoogleAuth.initialize({
    clientId: GOOGLE_IOS_CLIENT_ID,
    scopes: ["email", "profile"],
  });
  const result = await GoogleAuth.signIn({
    clientId: GOOGLE_IOS_CLIENT_ID,
    serverClientId: GOOGLE_WEB_CLIENT_ID,
    scopes: ["email", "profile"],
  });
  const { error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: result.authentication.idToken,
  });
  if (error) throw error;
  return currentUser();
}

export async function signOutEverywhere(): Promise<void> {
  try {
    const { GoogleAuth } = await import("@southdevs/capacitor-google-auth");
    await GoogleAuth.signOut();
  } catch {
    // 구글로 로그인한 적 없으면 조용히 지나간다.
  }
  await supabase.auth.signOut();
}

export async function currentUser(): Promise<HunnyeoUser | null> {
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  return {
    id: user.id,
    email: user.email ?? null,
    name: meta?.full_name ?? meta?.name ?? null,
  };
}

// lib/supabaseClient.ts — 브라우저(클라이언트)용 Supabase 클라이언트
// 회원가입/로그인/세션 관리에 사용합니다. (anon key, RLS 적용)
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseBrowser = url && anonKey
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

export function isAuthConfigured() {
  return !!supabaseBrowser;
}

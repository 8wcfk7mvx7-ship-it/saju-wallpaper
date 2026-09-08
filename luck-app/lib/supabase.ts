"use client";
// lib/supabase.ts — 로그인/클라우드 동기화용 Supabase 클라이언트
// 로그인 없이도 앱이 완전히 동작해야 하므로(localStorage 전용 모드), 환경변수가 비어 있으면
// 클라이언트를 아예 만들지 않고 null을 반환한다 — 로그인 관련 UI는 이 경우 자동으로 숨겨진다.
// 필요한 환경변수:
//   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
// (Supabase 프로젝트 생성 → Project Settings > API 에서 확인. supabase/schema.sql을 먼저 실행해두어야 함)
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;
if (URL && ANON_KEY) {
  client = createClient(URL, ANON_KEY, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
}

// 로그인 기능이 설정돼 있는지 — false면 설정 탭 등에서 로그인 관련 UI 자체를 숨긴다.
export function isCloudSyncConfigured(): boolean {
  return client !== null;
}

export function getSupabase(): SupabaseClient {
  if (!client) {
    throw new Error("Supabase가 설정되지 않았어요. NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY를 확인해주세요.");
  }
  return client;
}

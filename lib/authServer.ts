// lib/authServer.ts — API 라우트에서 로그인한 사용자를 확인하기 위한 헬퍼
import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Authorization: Bearer <access_token> 헤더로 전달된 Supabase 세션 토큰을 검증
export async function getUserFromRequest(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;

  const sb = getServiceClient();
  if (!sb) return null;

  const { data, error } = await sb.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export { getServiceClient };

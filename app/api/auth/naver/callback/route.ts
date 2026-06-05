import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state") || "/";
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://summerpalace.ai.kr";

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?loginError=1`);
  }

  try {
    const clientId = process.env.NAVER_CLIENT_ID!;
    const clientSecret = process.env.NAVER_CLIENT_SECRET!;
    const redirectUri = `${baseUrl}/api/auth/naver/callback`;

    // 토큰 교환
    const tokenRes = await fetch("https://nid.naver.com/oauth2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
        state,
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${baseUrl}/?loginError=1`);
    }

    // 사용자 정보 조회
    const userRes = await fetch("https://openapi.naver.com/v1/nid/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const userData = await userRes.json();
    const profile = userData.response;

    const naverId = String(profile.id);
    const nickname = profile.name || profile.nickname || "사용자";
    const profileImage = profile.profile_image || null;
    const email = profile.email || null;

    // Supabase에 upsert
    const sb = getSupabase();
    if (sb) {
      await sb.from("kakao_users").upsert(
        { kakao_id: naverId, nickname, profile_image: profileImage, email, last_login: new Date().toISOString() },
        { onConflict: "kakao_id" }
      );
    }

    // 쿠키에 사용자 정보 저장 (7일)
    const userInfo = JSON.stringify({ naverId, nickname, profileImage, email });
    const encodedUser = Buffer.from(userInfo).toString("base64");

    const redirectTo = state.startsWith("/") ? `${baseUrl}${state}` : baseUrl;
    const response = NextResponse.redirect(redirectTo);
    response.cookies.set("sp_user", encodedUser, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch {
    return NextResponse.redirect(`${baseUrl}/?loginError=1`);
  }
}

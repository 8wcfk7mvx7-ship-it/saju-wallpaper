import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GOOGLE_CLIENT_ID = "890801754093-edh505ocbhojnbr2fmfkj4rum2p3recr.apps.googleusercontent.com";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const { credential, redirect } = await req.json();
    if (!credential) {
      return NextResponse.json({ error: "credential 누락" }, { status: 400 });
    }

    const verifyRes = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
    );
    if (!verifyRes.ok) {
      return NextResponse.json({ error: "토큰 검증 실패" }, { status: 401 });
    }
    const payload = await verifyRes.json();

    if (payload.aud !== GOOGLE_CLIENT_ID) {
      return NextResponse.json({ error: "클라이언트 ID 불일치" }, { status: 401 });
    }

    // naverId는 모든 소셜 로그인이 공유하는 쿠키 내 사용자 ID 필드명
    // kakao_users 테이블은 전체 소셜 로그인 공용 테이블 (kakao_id 컬럼 = social_id)
    const naverId = String(payload.sub);
    const nickname = payload.name || "사용자";
    const profileImage = payload.picture || null;
    const email = payload.email || null;

    let isNewUser = false;
    const sb = getSupabase();
    if (sb) {
      const { data: existing } = await sb
        .from("kakao_users")
        .select("id")
        .eq("kakao_id", naverId)
        .single();
      isNewUser = !existing;
      await sb.from("kakao_users").upsert(
        { kakao_id: naverId, nickname, profile_image: profileImage, email, last_login: new Date().toISOString() },
        { onConflict: "kakao_id" }
      );
    }

    const userInfo = JSON.stringify({ naverId, nickname, profileImage, email, isNewUser });
    const encodedUser = Buffer.from(userInfo).toString("base64");

    const response = NextResponse.json({ ok: true, redirect: typeof redirect === "string" && redirect.startsWith("/") ? redirect : "/" });
    response.cookies.set("sp_user", encodedUser, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
    });
    return response;
  } catch {
    return NextResponse.json({ error: "로그인 처리 실패" }, { status: 500 });
  }
}

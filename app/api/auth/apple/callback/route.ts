import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function base64url(input: Buffer) {
  return input.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// Apple은 client_secret으로 ES256 서명된 JWT를 요구한다.
function generateClientSecret() {
  const teamId = process.env.APPLE_TEAM_ID!;
  const clientId = process.env.APPLE_CLIENT_ID!;
  const keyId = process.env.APPLE_KEY_ID!;
  const privateKey = process.env.APPLE_PRIVATE_KEY!.replace(/\\n/g, "\n");

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "ES256", kid: keyId };
  const payload = {
    iss: teamId,
    iat: now,
    exp: now + 3600,
    aud: "https://appleid.apple.com",
    sub: clientId,
  };

  const headerSeg = base64url(Buffer.from(JSON.stringify(header)));
  const payloadSeg = base64url(Buffer.from(JSON.stringify(payload)));
  const signingInput = `${headerSeg}.${payloadSeg}`;

  const signature = crypto.sign("sha256", Buffer.from(signingInput), {
    key: privateKey,
    dsaEncoding: "ieee-p1363",
  });

  return `${signingInput}.${base64url(signature)}`;
}

function decodeIdToken(idToken: string) {
  const payload = idToken.split(".")[1];
  return JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
}

export async function POST(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://summerpalace.ai.kr";

  try {
    const form = await req.formData();
    const code = form.get("code") as string | null;
    const state = (form.get("state") as string | null) || "/";
    const userRaw = form.get("user") as string | null;

    if (!code) {
      return NextResponse.redirect(`${baseUrl}/?loginError=1`);
    }

    const clientId = process.env.APPLE_CLIENT_ID!;
    const redirectUri = `${baseUrl}/api/auth/apple/callback`;
    const clientSecret = generateClientSecret();

    const tokenRes = await fetch("https://appleid.apple.com/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code,
      }),
    });
    const tokenData = await tokenRes.json();

    if (!tokenData.id_token) {
      return NextResponse.redirect(`${baseUrl}/?loginError=1`);
    }

    const claims = decodeIdToken(tokenData.id_token);
    const appleId = String(claims.sub);
    const email = claims.email || null;

    let nickname = "사용자";
    if (userRaw) {
      try {
        const parsed = JSON.parse(userRaw);
        const first = parsed?.name?.firstName || "";
        const last = parsed?.name?.lastName || "";
        if (first || last) nickname = `${last}${first}`.trim();
      } catch {
        // ignore
      }
    }

    let isNewUser = false;
    const sb = getSupabase();
    if (sb) {
      const { data: existing } = await sb
        .from("kakao_users")
        .select("id, nickname")
        .eq("kakao_id", appleId)
        .single();
      isNewUser = !existing;
      if (existing?.nickname) nickname = existing.nickname;
      await sb.from("kakao_users").upsert(
        { kakao_id: appleId, nickname, email, last_login: new Date().toISOString() },
        { onConflict: "kakao_id" }
      );
    }

    const userInfo = JSON.stringify({ naverId: appleId, nickname, profileImage: null, email, isNewUser });
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

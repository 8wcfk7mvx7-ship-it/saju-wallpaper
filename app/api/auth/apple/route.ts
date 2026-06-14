import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.APPLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "APPLE_CLIENT_ID 환경변수가 없습니다." }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://summerpalace.ai.kr";
  const redirectUri = `${baseUrl}/api/auth/apple/callback`;
  const state = req.nextUrl.searchParams.get("redirect") || "/";

  const appleAuthUrl =
    `https://appleid.apple.com/auth/authorize` +
    `?client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&scope=${encodeURIComponent("name email")}` +
    `&response_mode=form_post` +
    `&state=${encodeURIComponent(state)}`;

  return NextResponse.redirect(appleAuthUrl);
}

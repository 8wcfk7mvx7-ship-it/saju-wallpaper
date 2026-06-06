import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const clientId = process.env.NAVER_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "NAVER_CLIENT_ID 환경변수가 없습니다." }, { status: 500 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://summerpalace.ai.kr";
  const redirectUri = `${baseUrl}/api/auth/naver/callback`;
  const state = req.nextUrl.searchParams.get("redirect") || "/";

  const naverAuthUrl =
    `https://nid.naver.com/oauth2.0/authorize` +
    `?client_id=${clientId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&response_type=code` +
    `&state=${encodeURIComponent(state)}`;

  return NextResponse.redirect(naverAuthUrl);
}

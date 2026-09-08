// 앱(iOS/안드로이드 WebView)용 구글 로그인 시작점.
// WebView 안에서는 구글 JS 팝업이 뜨지 않기 때문에, 애플 로그인과 같은 방식으로
// 페이지 전체를 구글로 넘겼다가 되돌아오게 한다.
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { GOOGLE_CLIENT_ID, safeRedirect } from "@/lib/googleAuth";

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://summerpalace.ai.kr";
  const redirectTo = safeRedirect(req.nextUrl.searchParams.get("redirect"), "/epub-app");

  // 응답이 우리가 보낸 요청에 대한 것인지 확인하려고 nonce를 만들어 쿠키에 함께 남긴다.
  const nonce = crypto.randomBytes(16).toString("hex");

  const authUrl =
    "https://accounts.google.com/o/oauth2/v2/auth" +
    `?client_id=${encodeURIComponent(GOOGLE_CLIENT_ID)}` +
    `&redirect_uri=${encodeURIComponent(`${baseUrl}/api/auth/google/callback`)}` +
    // id_token만 바로 받는 방식이라 서버에 구글 client_secret을 두지 않아도 된다.
    "&response_type=id_token" +
    "&response_mode=form_post" +
    `&scope=${encodeURIComponent("openid email profile")}` +
    `&nonce=${nonce}` +
    `&state=${encodeURIComponent(redirectTo)}`;

  const response = NextResponse.redirect(authUrl);
  response.cookies.set("g_nonce", nonce, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    // 구글에서 form_post로 돌아올 때도 쿠키가 실려야 하므로 lax로는 부족하다.
    sameSite: "none",
    secure: true,
  });
  return response;
}

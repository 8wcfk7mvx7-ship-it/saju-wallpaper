// 웹(브라우저) 구글 로그인: 구글 JS가 받아온 id_token을 그대로 보내오는 방식.
// 앱(WebView)에서는 팝업이 막히므로 /api/auth/google/start 리다이렉트 방식을 쓴다.
import { NextRequest, NextResponse } from "next/server";
import { completeGoogleLogin, safeRedirect } from "@/lib/googleAuth";

export async function POST(req: NextRequest) {
  try {
    const { credential, redirect } = await req.json();
    if (!credential) {
      return NextResponse.json({ error: "credential 누락" }, { status: 400 });
    }

    const { cookieValue } = await completeGoogleLogin(credential);

    const response = NextResponse.json({ ok: true, redirect: safeRedirect(redirect) });
    response.cookies.set("sp_user", cookieValue, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
    });
    return response;
  } catch (err) {
    const message = err instanceof Error ? err.message : "로그인 처리 실패";
    // 토큰 검증 단계의 실패는 401, 그 밖은 500으로 구분한다.
    const status = message.includes("검증") || message.includes("불일치") ? 401 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

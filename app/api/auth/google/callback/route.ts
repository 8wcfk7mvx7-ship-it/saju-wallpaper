// 구글이 로그인 결과를 form_post로 돌려주는 지점(앱용 리다이렉트 방식).
import { NextRequest, NextResponse } from "next/server";
import { completeGoogleLogin, safeRedirect } from "@/lib/googleAuth";

export async function POST(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://summerpalace.ai.kr";

  try {
    const form = await req.formData();
    const idToken = form.get("id_token") as string | null;
    const redirectTo = safeRedirect(form.get("state"), "/epub-app");

    if (!idToken) {
      return NextResponse.redirect(`${baseUrl}${redirectTo}?loginError=1`);
    }

    const nonce = req.cookies.get("g_nonce")?.value;
    const { cookieValue } = await completeGoogleLogin(idToken, nonce);

    const response = NextResponse.redirect(`${baseUrl}${redirectTo}`);
    response.cookies.set("sp_user", cookieValue, {
      httpOnly: false,
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
      sameSite: "lax",
    });
    // 한 번 쓴 nonce는 지운다.
    response.cookies.delete("g_nonce");
    return response;
  } catch {
    return NextResponse.redirect(`${baseUrl}/epub-app?loginError=1`);
  }
}

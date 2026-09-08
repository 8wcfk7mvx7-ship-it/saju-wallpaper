// 구글 로그인 처리에서 웹(팝업)과 앱(리다이렉트)이 공통으로 쓰는 부분.
// 어느 경로로 들어오든 결국 "구글 id_token을 검증하고 사용자를 기록한 뒤 쿠키 값을 만든다"는 점은 같다.
import { createClient } from "@supabase/supabase-js";

export const GOOGLE_CLIENT_ID = "890801754093-edh505ocbhojnbr2fmfkj4rum2p3recr.apps.googleusercontent.com";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export interface GoogleLoginResult {
  /** 브라우저에 심을 sp_user 쿠키 값(base64). */
  cookieValue: string;
  nickname: string;
  isNewUser: boolean;
}

/**
 * 구글이 발급한 id_token을 검증하고 사용자를 저장한 뒤 쿠키에 넣을 값을 만든다.
 * 검증에 실패하면 예외를 던진다.
 */
export async function completeGoogleLogin(credential: string, expectedNonce?: string): Promise<GoogleLoginResult> {
  const verifyRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`
  );
  if (!verifyRes.ok) throw new Error("토큰 검증 실패");

  const payload = await verifyRes.json();
  if (payload.aud !== GOOGLE_CLIENT_ID) throw new Error("클라이언트 ID 불일치");
  // 리다이렉트 방식에서는 요청할 때 만든 nonce가 그대로 돌아왔는지까지 확인한다.
  if (expectedNonce && payload.nonce !== expectedNonce) throw new Error("nonce 불일치");

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
  return {
    cookieValue: Buffer.from(userInfo).toString("base64"),
    nickname,
    isNewUser,
  };
}

/** 로그인 후 돌아갈 경로. 외부 주소로 튕기지 않도록 내부 경로만 허용한다. */
export function safeRedirect(value: unknown, fallback = "/"): string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//") ? value : fallback;
}

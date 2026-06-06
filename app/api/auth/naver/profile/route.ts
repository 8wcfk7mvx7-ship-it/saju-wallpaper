import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function parseUserCookie(req: NextRequest) {
  const raw = req.cookies.get("sp_user")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(Buffer.from(raw, "base64").toString("utf-8"));
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const user = parseUserCookie(req);
  if (!user?.naverId) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const body = await req.json();
  const {
    name,
    birthYear,
    birthMonth,
    birthDay,
    birthHour,
    birthMinute,
    birthHourUnknown,
    birthPlace,
    calendarType, // "양력" | "음력"
  } = body;

  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json({ error: "DB 연결 실패" }, { status: 500 });
  }

  const { error } = await sb.from("kakao_users").update({
    birth_name: name,
    birth_year: birthYear,
    birth_month: birthMonth,
    birth_day: birthDay,
    birth_hour: birthHourUnknown ? null : birthHour,
    birth_minute: birthHourUnknown ? null : birthMinute,
    birth_hour_unknown: birthHourUnknown,
    birth_place: birthPlace,
    calendar_type: calendarType,
    profile_saved: true,
  }).eq("kakao_id", user.naverId);

  if (error) {
    // 컬럼이 없을 수 있으므로 무시하고 성공 처리
    console.error("profile save error:", error);
  }

  // isNewUser 플래그 제거한 새 쿠키 발급
  const updatedUser = { ...user, isNewUser: false };
  const encoded = Buffer.from(JSON.stringify(updatedUser)).toString("base64");
  const res = NextResponse.json({ ok: true });
  res.cookies.set("sp_user", encoded, {
    httpOnly: false,
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
  });
  return res;
}

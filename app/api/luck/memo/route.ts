import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, getServiceClient } from "@/lib/authServer";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// 최근 메모 목록 조회 (?days=7 형태로 최근 N일, 기본 7일 / ?date=YYYY-MM-DD로 특정 하루)
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const days = Math.min(Math.max(Number(searchParams.get("days")) || 7, 1), 90);

  const sb = getServiceClient()!;
  let query = sb.from("daily_memos").select("memo_date, content").eq("user_id", user.id);

  if (date) {
    if (!DATE_RE.test(date)) return NextResponse.json({ error: "잘못된 날짜 형식입니다." }, { status: 400 });
    query = query.eq("memo_date", date);
  } else {
    query = query.order("memo_date", { ascending: false }).limit(days);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ memos: data });
}

// 특정 날짜 메모 저장/수정 (하루 1건, upsert)
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { date, content } = await req.json();
  if (!DATE_RE.test(date) || typeof content !== "string" || content.length > 2000) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const sb = getServiceClient()!;
  const { error } = await sb.from("daily_memos").upsert(
    { user_id: user.id, memo_date: date, content },
    { onConflict: "user_id,memo_date" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

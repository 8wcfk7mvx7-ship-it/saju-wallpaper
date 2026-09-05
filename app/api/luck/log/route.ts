import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, getServiceClient } from "@/lib/authServer";
import { getCurrentSolarTerm } from "@/lib/solarTerms";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// 최근 행운 기록 조회 (?days=7, 기본 7일 / ?date=YYYY-MM-DD로 특정 하루)
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const days = Math.min(Math.max(Number(searchParams.get("days")) || 7, 1), 90);

  const sb = getServiceClient()!;
  let query = sb.from("daily_luck_logs").select("log_date, rating, tags, note, solar_term").eq("user_id", user.id);

  if (date) {
    if (!DATE_RE.test(date)) return NextResponse.json({ error: "잘못된 날짜 형식입니다." }, { status: 400 });
    query = query.eq("log_date", date);
  } else {
    query = query.order("log_date", { ascending: false }).limit(days);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ logs: data });
}

// 하루 행운 점수 기록 (1~5점, 태그, 짧은 메모) — 하루 1건, upsert
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { date, rating, tags, note } = await req.json();
  if (
    !DATE_RE.test(date) ||
    typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5 ||
    !Array.isArray(tags) || tags.length > 10 || tags.some((t) => typeof t !== "string" || t.length > 20) ||
    typeof note !== "string" || note.length > 500
  ) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const solarTerm = getCurrentSolarTerm(new Date(`${date}T00:00:00+09:00`)).name;

  const sb = getServiceClient()!;
  const { error } = await sb.from("daily_luck_logs").upsert(
    { user_id: user.id, log_date: date, rating, tags, note, solar_term: solarTerm },
    { onConflict: "user_id,log_date" }
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

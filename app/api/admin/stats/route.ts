import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function checkAdminAuth(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false;
  return req.headers.get("x-admin-password") === adminPassword;
}

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json({ todayViews: 0, totalViews: 0, payments: [], dbConnected: false });
  }

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const weekAgo = new Date(now); weekAgo.setDate(weekAgo.getDate() - 6); weekAgo.setHours(0, 0, 0, 0);
  const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 29); monthAgo.setHours(0, 0, 0, 0);
  const prevMonthStart = new Date(now); prevMonthStart.setDate(prevMonthStart.getDate() - 59); prevMonthStart.setHours(0, 0, 0, 0);

  const [
    todayRes, totalRes,
    paymentsRes, allPaymentsMonthRes, allPaymentsPrevMonthRes,
    pageViewsWeekRes, pageViewsTodayAllRes,
    kakaoUsersRes, kakaoUsersTodayRes,
    blueberryPaymentsRes,
    chatQuestionsRes,
  ] = await Promise.all([
    sb.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
    sb.from("page_views").select("id", { count: "exact", head: true }),
    sb.from("payments").select("*").order("created_at", { ascending: false }).limit(100),
    sb.from("payments").select("amount, product_name, created_at").gte("created_at", monthAgo.toISOString()),
    sb.from("payments").select("amount").gte("created_at", prevMonthStart.toISOString()).lt("created_at", monthAgo.toISOString()),
    sb.from("page_views").select("page, created_at").gte("created_at", weekAgo.toISOString()),
    sb.from("page_views").select("page, created_at").gte("created_at", todayStart.toISOString()),
    sb.from("kakao_users").select("id, nickname, profile_image, email, created_at, last_login").order("created_at", { ascending: false }).limit(50),
    sb.from("kakao_users").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
    sb.from("payments").select("amount, product_name, created_at").ilike("product_name", "%블루베리%").order("created_at", { ascending: false }).limit(50),
    sb.from("chat_questions").select("question_norm, count").order("count", { ascending: false }).limit(20),
  ]);

  // ── 7일 일별 방문자 ──
  const dailyViewsMap: Record<string, number> = {};
  const dailyRevenueMap: Record<string, number> = {};
  for (let d = 0; d < 7; d++) {
    const dt = new Date(weekAgo); dt.setDate(dt.getDate() + d);
    const key = dt.toISOString().slice(0, 10);
    dailyViewsMap[key] = 0;
    dailyRevenueMap[key] = 0;
  }
  for (const v of pageViewsWeekRes.data ?? []) {
    const key = v.created_at.slice(0, 10);
    if (key in dailyViewsMap) dailyViewsMap[key]++;
  }
  for (const p of allPaymentsMonthRes.data ?? []) {
    const key = p.created_at.slice(0, 10);
    if (key in dailyRevenueMap) dailyRevenueMap[key] += p.amount;
  }

  // ── 시간대별 방문자 (오늘) ──
  const hourlyViews: number[] = new Array(24).fill(0);
  for (const v of pageViewsTodayAllRes.data ?? []) {
    const h = new Date(v.created_at).getHours();
    hourlyViews[h]++;
  }

  // ── 인기 페이지 ──
  const pageCountMap: Record<string, number> = {};
  for (const v of pageViewsWeekRes.data ?? []) {
    const p = v.page || "/";
    pageCountMap[p] = (pageCountMap[p] || 0) + 1;
  }
  const topPages = Object.entries(pageCountMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([page, count]) => ({ page, count }));

  // ── 상품별 매출 ──
  const productMap: Record<string, { count: number; revenue: number }> = {};
  for (const p of allPaymentsMonthRes.data ?? []) {
    const name = p.product_name || "기타";
    if (!productMap[name]) productMap[name] = { count: 0, revenue: 0 };
    productMap[name].count++;
    productMap[name].revenue += p.amount;
  }
  const productRevenue = Object.entries(productMap)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .map(([name, v]) => ({ name, ...v }));

  // ── 매출 합계 ──
  const thisMonthRevenue = (allPaymentsMonthRes.data ?? []).reduce((s, p) => s + p.amount, 0);
  const prevMonthRevenue = (allPaymentsPrevMonthRes.data ?? []).reduce((s, p) => s + p.amount, 0);
  const todayRevenue = (allPaymentsMonthRes.data ?? [])
    .filter(p => p.created_at >= todayStart.toISOString())
    .reduce((s, p) => s + p.amount, 0);
  const totalRevenue = (paymentsRes.data ?? []).reduce((s, p) => s + p.amount, 0);

  // ── 전환율 ──
  const totalPaidCount = (paymentsRes.data ?? []).length;
  const conversionRate = totalRes.count && totalRes.count > 0
    ? ((totalPaidCount / totalRes.count) * 100).toFixed(2)
    : "0.00";

  // ── 월령도사 인기 질문 (익명화·정규화된 문구별 누적 카운트, DB에서 이미 집계됨) ──
  const topQuestions = (chatQuestionsRes.data ?? []).map((v) => ({ question: v.question_norm, count: v.count }));

  return NextResponse.json({
    dbConnected: true,
    todayViews: todayRes.count ?? 0,
    totalViews: totalRes.count ?? 0,
    todayRevenue,
    thisMonthRevenue,
    prevMonthRevenue,
    totalRevenue,
    totalPaidCount,
    conversionRate,
    payments: paymentsRes.data ?? [],
    dailyViews: Object.entries(dailyViewsMap).map(([date, count]) => ({ date, count })),
    dailyRevenue: Object.entries(dailyRevenueMap).map(([date, amount]) => ({ date, amount })),
    hourlyViews,
    topPages,
    productRevenue,
    kakaoUsers: kakaoUsersRes.data ?? [],
    kakaoTodayCount: kakaoUsersTodayRes.count ?? 0,
    kakaoTotalCount: (kakaoUsersRes.data ?? []).length,
    blueberryPayments: blueberryPaymentsRes.data ?? [],
    blueberryRevenue: (blueberryPaymentsRes.data ?? []).reduce((s, p) => s + p.amount, 0),
    topQuestions,
  });
}

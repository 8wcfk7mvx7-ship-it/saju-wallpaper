import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createNotionDailyStats } from "@/lib/notion";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Vercel Cron이 매일 호출해 어제 하루치 운영 통계를 노션에 기록한다.
export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sb = getSupabase();
  if (!sb) {
    return NextResponse.json({ synced: false, reason: "no supabase" });
  }

  const now = new Date();
  const todayStart = new Date(now); todayStart.setHours(0, 0, 0, 0);
  const monthAgo = new Date(now); monthAgo.setDate(monthAgo.getDate() - 29); monthAgo.setHours(0, 0, 0, 0);

  const [todayRes, totalRes, paymentsRes, allPaymentsMonthRes] = await Promise.all([
    sb.from("page_views").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
    sb.from("page_views").select("id", { count: "exact", head: true }),
    sb.from("payments").select("amount, customer_email"),
    sb.from("payments").select("amount, created_at").gte("created_at", monthAgo.toISOString()),
  ]);

  const totalRevenue = (paymentsRes.data ?? []).reduce((s, p) => s + p.amount, 0);
  const totalPaidCount = (paymentsRes.data ?? []).length;
  const thisMonthRevenue = (allPaymentsMonthRes.data ?? []).reduce((s, p) => s + p.amount, 0);
  const todayRevenue = (allPaymentsMonthRes.data ?? [])
    .filter((p) => p.created_at >= todayStart.toISOString())
    .reduce((s, p) => s + p.amount, 0);
  const conversionRate = totalRes.count && totalRes.count > 0
    ? Number(((totalPaidCount / totalRes.count) * 100).toFixed(2))
    : 0;
  const avgOrderValue = totalPaidCount > 0 ? Math.round(totalRevenue / totalPaidCount) : 0;

  await createNotionDailyStats({
    date: todayStart.toISOString().slice(0, 10),
    todayViews: todayRes.count ?? 0,
    totalViews: totalRes.count ?? 0,
    todayRevenue,
    thisMonthRevenue,
    totalRevenue,
    totalPaidCount,
    conversionRate,
    avgOrderValue,
  });

  return NextResponse.json({ synced: true });
}

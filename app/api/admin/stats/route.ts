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
    return NextResponse.json({
      todayViews: 0, totalViews: 0, payments: [], dbConnected: false,
    });
  }

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [todayRes, totalRes, paymentsRes] = await Promise.all([
    sb.from("page_views").select("id", { count: "exact", head: true })
      .gte("created_at", todayStart.toISOString()),
    sb.from("page_views").select("id", { count: "exact", head: true }),
    sb.from("payments").select("*").order("created_at", { ascending: false }).limit(100),
  ]);

  return NextResponse.json({
    todayViews: todayRes.count ?? 0,
    totalViews: totalRes.count ?? 0,
    payments: paymentsRes.data ?? [],
    dbConnected: true,
  });
}

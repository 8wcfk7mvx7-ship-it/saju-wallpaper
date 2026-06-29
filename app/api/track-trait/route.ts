import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const { trait, page } = await req.json();
    const sb = getSupabase();
    if (!sb || !trait) return NextResponse.json({ ok: true });

    await sb.from("saju_trait_events").insert({ trait_key: trait, page: page || "/" });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

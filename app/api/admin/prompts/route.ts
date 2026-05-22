import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_PROMPTS, clearPromptsCache } from "@/lib/prompts";

// 어드민 비밀번호 확인
function checkAdminAuth(req: NextRequest): boolean {
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) return false; // env 미설정 시 접근 차단
  const authHeader = req.headers.get("x-admin-password");
  return authHeader === adminPassword;
}

function getSupabase() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_KEY!;
  return createClient(url, key);
}

// ── GET: 모든 프롬프트 조회 ──────────────────────
export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const sb = getSupabase();
    const { data: savedRows } = await sb
      .from("admin_prompts")
      .select("key, value, updated_at");

    const savedMap: Record<string, { value: string; updatedAt: string }> = {};
    for (const row of savedRows || []) {
      savedMap[row.key] = { value: row.value, updatedAt: row.updated_at };
    }

    // 기본값과 커스텀값 병합하여 반환
    const result = DEFAULT_PROMPTS.map(p => ({
      key: p.key,
      label: p.label,
      category: p.category,
      description: p.description,
      defaultValue: p.defaultValue,
      currentValue: savedMap[p.key]?.value ?? p.defaultValue,
      isCustomized: !!savedMap[p.key],
      updatedAt: savedMap[p.key]?.updatedAt ?? null,
    }));

    return NextResponse.json({ prompts: result });
  } catch (e) {
    return NextResponse.json({ error: "DB 오류" }, { status: 500 });
  }
}

// ── POST: 프롬프트 저장/업데이트 ─────────────────
export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { key, value } = await req.json();
    if (!key || typeof value !== "string") {
      return NextResponse.json({ error: "key, value 필수" }, { status: 400 });
    }

    const sb = getSupabase();
    const { error } = await sb
      .from("admin_prompts")
      .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: "key" });

    if (error) throw error;

    // 캐시 즉시 초기화 → 다음 생성 요청부터 새 프롬프트 사용
    clearPromptsCache();

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: "저장 실패" }, { status: 500 });
  }
}

// ── DELETE: 프롬프트 기본값으로 초기화 ───────────
export async function DELETE(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { key } = await req.json();
    const sb = getSupabase();
    await sb.from("admin_prompts").delete().eq("key", key);
    clearPromptsCache();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "초기화 실패" }, { status: 500 });
  }
}

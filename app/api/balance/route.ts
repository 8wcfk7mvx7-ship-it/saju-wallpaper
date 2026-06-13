import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, getServiceClient } from "@/lib/authServer";

// 로그인한 회원의 별조각 잔액 조회
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const sb = getServiceClient()!;
  const { data, error } = await sb.from("profiles").select("balance, phone_verified").eq("id", user.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ balance: data.balance, phoneVerified: data.phone_verified });
}

// 잔액 차감 (서비스 이용) — 그리고 관리자 비밀키를 가진 요청에 한해서만 충전(add) 허용.
// 일반 충전(결제)은 결제 confirm 서버 로직에서 service role로 직접 처리해야 합니다.
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { action, amount } = await req.json();
  if (!["add", "deduct"].includes(action) || typeof amount !== "number" || amount <= 0 || !Number.isFinite(amount)) {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  if (action === "add") {
    const adminSecret = req.headers.get("x-admin-secret");
    if (!process.env.ADMIN_SECRET || adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
    }
  }

  const sb = getServiceClient()!;
  const { data: profile, error: readErr } = await sb.from("profiles").select("balance").eq("id", user.id).single();
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });

  let nextBalance: number;
  if (action === "add") {
    nextBalance = profile.balance + amount;
  } else {
    if (profile.balance < amount) {
      return NextResponse.json({ error: "잔액이 부족합니다." }, { status: 400 });
    }
    nextBalance = profile.balance - amount;
  }

  const { error: updErr } = await sb.from("profiles").update({ balance: nextBalance, updated_at: new Date().toISOString() }).eq("id", user.id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ balance: nextBalance });
}

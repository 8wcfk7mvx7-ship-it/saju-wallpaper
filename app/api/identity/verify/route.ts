import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest, getServiceClient } from "@/lib/authServer";
import crypto from "crypto";

// 포트원(아임포트) 본인인증 결과를 서버에서 검증하고 profiles.phone_verified를 갱신
export async function POST(req: NextRequest) {
  const user = await getUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const { identityVerificationId } = await req.json();
  if (!identityVerificationId || typeof identityVerificationId !== "string") {
    return NextResponse.json({ error: "잘못된 요청입니다." }, { status: 400 });
  }

  const apiSecret = process.env.PORTONE_API_SECRET;
  if (!apiSecret) {
    return NextResponse.json({ error: "본인인증 설정이 완료되지 않았습니다." }, { status: 500 });
  }

  const res = await fetch(
    `https://api.portone.io/identity-verifications/${encodeURIComponent(identityVerificationId)}`,
    { headers: { Authorization: `PortOne ${apiSecret}` } }
  );
  if (!res.ok) {
    return NextResponse.json({ error: "본인인증 정보를 확인할 수 없습니다." }, { status: 400 });
  }
  const data = await res.json();
  if (data.status !== "VERIFIED") {
    return NextResponse.json({ error: "본인인증이 완료되지 않았습니다." }, { status: 400 });
  }

  const phoneNumber: string | undefined = data.verifiedCustomer?.phoneNumber;
  const phoneHash = phoneNumber
    ? crypto.createHash("sha256").update(phoneNumber).digest("hex")
    : null;

  const sb = getServiceClient()!;
  const { error: updErr } = await sb
    .from("profiles")
    .update({ phone_verified: true, phone_hash: phoneHash, updated_at: new Date().toISOString() })
    .eq("id", user.id);
  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

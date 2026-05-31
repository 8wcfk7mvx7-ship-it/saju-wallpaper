import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: NextRequest) {
  try {
    const { name, email, message } = await req.json();

    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return NextResponse.json({ error: "필수 항목 누락" }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "이메일 형식이 올바르지 않습니다" }, { status: 400 });
    }

    if (message.trim().length < 5) {
      return NextResponse.json({ error: "문의 내용이 너무 짧습니다" }, { status: 400 });
    }

    const adminEmail = process.env.ADMIN_EMAIL;
    if (!process.env.RESEND_API_KEY || !adminEmail) {
      return NextResponse.json({ success: true });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const FROM = process.env.RESEND_FROM_EMAIL || "Summer Palace <noreply@summerpalace.ai.kr>";

    await Promise.all([
      resend.emails.send({
        from: FROM,
        to: adminEmail,
        replyTo: email,
        subject: `[Summer Palace 문의] ${name}님 — ${message.substring(0, 30)}`,
        html: `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#06060e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:520px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:28px;">
    <p style="font-size:24px;margin:0;">🏯</p>
    <h1 style="color:#c9a84c;font-size:18px;font-weight:900;margin:8px 0 4px;">새 문의가 도착했습니다</h1>
  </div>
  <div style="background:#0d0d1a;border:1px solid rgba(201,168,76,0.2);border-radius:12px;padding:20px;margin-bottom:20px;">
    <table style="width:100%;border-collapse:collapse;">
      <tr>
        <td style="color:#6b7280;font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);width:80px;">이름</td>
        <td style="color:#fff;font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">${name}</td>
      </tr>
      <tr>
        <td style="color:#6b7280;font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">이메일</td>
        <td style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
          <a href="mailto:${email}" style="color:#c9a84c;font-size:13px;">${email}</a>
        </td>
      </tr>
      <tr>
        <td style="color:#6b7280;font-size:13px;padding:12px 0 0;vertical-align:top;">문의 내용</td>
        <td style="color:#e5e7eb;font-size:13px;padding:12px 0 0;white-space:pre-wrap;line-height:1.7;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</td>
      </tr>
    </table>
  </div>
  <p style="color:#6b7280;font-size:12px;text-align:center;">
    Reply-To: <a href="mailto:${email}" style="color:#c9a84c;">${email}</a> — 바로 답장하세요
  </p>
</div>
</body>
</html>`.trim(),
      }),

      resend.emails.send({
        from: FROM,
        to: email,
        subject: `[Summer Palace] 문의가 접수되었습니다`,
        html: `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#06060e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
<div style="max-width:520px;margin:0 auto;padding:40px 20px;">
  <div style="text-align:center;margin-bottom:28px;">
    <p style="font-size:28px;margin:0;">✅</p>
    <h1 style="color:#fff;font-size:20px;font-weight:900;margin:8px 0 4px;">문의 접수 완료</h1>
    <p style="color:#6b7280;font-size:13px;margin:0;">${name}님의 문의가 정상적으로 접수되었습니다.</p>
  </div>
  <div style="background:#0d0d1a;border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:20px;margin-bottom:20px;">
    <p style="color:#9ca3af;font-size:12px;margin:0 0 8px 0;">접수된 문의 내용</p>
    <p style="color:#e5e7eb;font-size:14px;white-space:pre-wrap;line-height:1.7;margin:0;">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
  </div>
  <div style="background:rgba(201,168,76,0.06);border:1px solid rgba(201,168,76,0.15);border-radius:12px;padding:16px;margin-bottom:24px;">
    <p style="color:#c9a84c;font-size:13px;font-weight:700;margin:0 0 6px 0;">📬 답변 안내</p>
    <p style="color:#9ca3af;font-size:12px;line-height:1.7;margin:0;">
      영업일 기준 1~2일 이내에 이 메일로 답변 드리겠습니다.<br>
      긴급 문의는 카카오 채널을 이용해 주세요.<br>
      <a href="http://pf.kakao.com/_cuksX" style="color:#fbbf24;">💬 카카오 채널 바로가기</a>
    </p>
  </div>
  <div style="text-align:center;border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;">
    <p style="color:#374151;font-size:11px;margin:0;">© 2026 Summer Palace · summerpalace.ai.kr</p>
  </div>
</div>
</body>
</html>`.trim(),
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "이메일 발송 중 오류가 발생했습니다" }, { status: 500 });
  }
}

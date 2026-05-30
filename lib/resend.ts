import { Resend } from "resend";

const FROM = process.env.RESEND_FROM_EMAIL || "Summer Palace <noreply@summerpalace.ai.kr>";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export interface ReceiptEmailParams {
  to: string;
  customerName: string;
  orderId: string;
  amount: number;
  productName: string;
  serviceUrl?: string;
}

export async function sendReceiptEmail(params: ReceiptEmailParams): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;

  const { to, customerName, orderId, amount, productName, serviceUrl } = params;

  try {
    await getResend().emails.send({
      from: FROM,
      to,
      subject: `[Summer Palace] 결제 완료 - ${productName}`,
      html: `
<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#06060e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:40px 20px;">
    <!-- 헤더 -->
    <div style="text-align:center;margin-bottom:32px;">
      <p style="font-size:28px;margin:0;">🏯</p>
      <h1 style="color:#ffffff;font-size:20px;font-weight:900;margin:8px 0 4px;">Summer Palace</h1>
      <p style="color:#6b7280;font-size:12px;margin:0;letter-spacing:0.1em;">AI 사주 분석 서비스</p>
    </div>

    <!-- 결제 완료 카드 -->
    <div style="background:#0d0d1a;border:1px solid rgba(139,92,246,0.25);border-radius:16px;padding:24px;margin-bottom:24px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
        <span style="font-size:20px;">✅</span>
        <h2 style="color:#ffffff;font-size:16px;font-weight:700;margin:0;">결제가 완료되었습니다</h2>
      </div>

      <table style="width:100%;border-collapse:collapse;">
        <tr>
          <td style="color:#6b7280;font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">고객명</td>
          <td style="color:#ffffff;font-size:13px;text-align:right;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">${customerName}님</td>
        </tr>
        <tr>
          <td style="color:#6b7280;font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">상품명</td>
          <td style="color:#ffffff;font-size:13px;text-align:right;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">${productName}</td>
        </tr>
        <tr>
          <td style="color:#6b7280;font-size:13px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">주문번호</td>
          <td style="color:#9ca3af;font-size:12px;text-align:right;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">${orderId}</td>
        </tr>
        <tr>
          <td style="color:#6b7280;font-size:13px;padding:12px 0 0;">결제 금액</td>
          <td style="color:#c084fc;font-size:18px;font-weight:900;text-align:right;padding:12px 0 0;">₩${amount.toLocaleString()}</td>
        </tr>
      </table>
    </div>

    <!-- 서비스 바로가기 -->
    ${serviceUrl ? `
    <div style="text-align:center;margin-bottom:24px;">
      <a href="${serviceUrl}" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#4f46e5);color:#ffffff;font-weight:700;font-size:14px;padding:14px 32px;border-radius:12px;text-decoration:none;">
        결과 보러가기 →
      </a>
    </div>
    ` : ""}

    <!-- 면책 고지 -->
    <div style="background:#1a0a00;border:1px solid rgba(245,158,11,0.2);border-radius:12px;padding:16px;margin-bottom:24px;">
      <p style="color:#fbbf24;font-size:12px;font-weight:600;margin:0 0 6px;">⚠️ 오락·참고 목적 서비스 안내</p>
      <p style="color:#9ca3af;font-size:11px;line-height:1.6;margin:0;">
        Summer Palace의 모든 분석 결과는 순수 오락·참고용 콘텐츠입니다.
        실제 투자·의료·법률 결정의 근거로 활용하지 마세요.
      </p>
    </div>

    <!-- 문의 -->
    <div style="text-align:center;margin-bottom:24px;">
      <p style="color:#6b7280;font-size:12px;margin:0 0 8px;">문의가 있으시면 카카오 채널로 연락해주세요</p>
      <a href="http://pf.kakao.com/_cuksX" style="color:#fbbf24;font-size:13px;font-weight:600;text-decoration:none;">
        💬 카카오 채널 문의
      </a>
      <span style="color:#4b5563;margin:0 8px;">·</span>
      <a href="mailto:support@summerpalace.ai.kr" style="color:#6b7280;font-size:12px;text-decoration:none;">
        support@summerpalace.ai.kr
      </a>
    </div>

    <!-- 푸터 -->
    <div style="text-align:center;border-top:1px solid rgba(255,255,255,0.06);padding-top:20px;">
      <p style="color:#374151;font-size:11px;margin:0;">© 2026 Summer Palace. All rights reserved.</p>
      <p style="color:#374151;font-size:11px;margin:4px 0 0;">
        <a href="https://summerpalace.ai.kr/terms" style="color:#374151;text-decoration:underline;">이용약관</a>
        · <a href="https://summerpalace.ai.kr/privacy" style="color:#374151;text-decoration:underline;">개인정보처리방침</a>
        · <a href="https://summerpalace.ai.kr/refund" style="color:#374151;text-decoration:underline;">환불규정</a>
      </p>
    </div>
  </div>
</body>
</html>
      `.trim(),
    });
    return true;
  } catch {
    return false;
  }
}

export async function sendAdminNotification(orderId: string, amount: number, productName: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!process.env.RESEND_API_KEY || !adminEmail) return;

  try {
    await getResend().emails.send({
      from: FROM,
      to: adminEmail,
      subject: `[Summer Palace] 새 결제 — ${productName} ₩${amount.toLocaleString()}`,
      html: `<p>주문번호: ${orderId}<br>상품: ${productName}<br>금액: ₩${amount.toLocaleString()}</p>`,
    });
  } catch {}
}

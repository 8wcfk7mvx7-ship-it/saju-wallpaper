import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { confirmTossPayment } from "@/lib/toss";
import { sendReceiptEmail, sendAdminNotification } from "@/lib/resend";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount, customerEmail, customerName, productName } = await req.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ error: "결제 정보가 올바르지 않습니다." }, { status: 400 });
    }

    // 별조각(포인트) 결제는 클라이언트에서 이미 잔액 차감을 완료한 뒤 들어오므로 토스 승인을 건너뛴다.
    const isStarpiece = paymentKey === "STARPIECE";
    const result = isStarpiece
      ? { paymentKey, orderId, totalAmount: Number(amount), method: "별조각" }
      : await confirmTossPayment(paymentKey, orderId, Number(amount));

    // DB에 결제 기록 저장
    const sb = getSupabase();
    if (sb) {
      await sb.from("payments").insert({
        order_id: orderId,
        amount: Number(amount),
        product_name: productName || "Summer Palace 분석",
        customer_name: customerName || "고객",
        customer_email: customerEmail || null,
        payment_key: paymentKey,
        status: "paid",
      }).then(() => {});
    }

    if (customerEmail) {
      await sendReceiptEmail({
        to: customerEmail,
        customerName: customerName || "고객",
        orderId,
        amount: Number(amount),
        productName: productName || "Summer Palace 분석",
      });
    }

    await sendAdminNotification(orderId, Number(amount), productName || "분석");

    return NextResponse.json({ success: true, payment: result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "결제 승인 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

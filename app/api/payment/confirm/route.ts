import { NextRequest, NextResponse } from "next/server";
import { confirmTossPayment } from "@/lib/toss";
import { sendReceiptEmail, sendAdminNotification } from "@/lib/resend";

export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount, customerEmail, customerName, productName } = await req.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { error: "결제 정보가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const result = await confirmTossPayment(paymentKey, orderId, Number(amount));

    if (customerEmail) {
      const serviceUrl = result?.successUrl as string | undefined;
      await sendReceiptEmail({
        to: customerEmail,
        customerName: customerName || "고객",
        orderId,
        amount: Number(amount),
        productName: productName || "Summer Palace 분석",
        serviceUrl,
      });
    }

    await sendAdminNotification(orderId, Number(amount), productName || "분석");

    return NextResponse.json({ success: true, payment: result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "결제 승인 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { confirmTossPayment } from "@/lib/toss";

export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await req.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { error: "결제 정보가 올바르지 않습니다." },
        { status: 400 }
      );
    }

    const result = await confirmTossPayment(paymentKey, orderId, Number(amount));
    return NextResponse.json({ success: true, payment: result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "결제 승인 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

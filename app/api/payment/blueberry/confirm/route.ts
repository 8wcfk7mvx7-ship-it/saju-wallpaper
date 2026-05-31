import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { confirmTossPayment } from "@/lib/toss";
import { sendAdminNotification } from "@/lib/resend";

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// 충전 금액 → 블루베리 (원금 + 10% 보너스)
function wonToBlueberries(won: number): number {
  return Math.floor(won * 1.1);
}

export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount, userId, customerEmail, customerName } = await req.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json({ error: "결제 정보가 올바르지 않습니다." }, { status: 400 });
    }

    const result = await confirmTossPayment(paymentKey, orderId, Number(amount));
    const blueberries = wonToBlueberries(Number(amount));

    const sb = getSupabase();
    if (sb) {
      // 결제 기록
      await sb.from("payments").insert({
        order_id: orderId,
        amount: Number(amount),
        product_name: `블루베리 충전 ${Number(amount).toLocaleString()}원`,
        customer_name: customerName || "고객",
        customer_email: customerEmail || null,
        payment_key: paymentKey,
        status: "paid",
      });

      // 로그인 유저의 경우 Supabase에 블루베리 잔액 업데이트
      if (userId) {
        const { data: existing } = await sb
          .from("user_blueberries")
          .select("balance")
          .eq("user_id", userId)
          .single();

        if (existing) {
          await sb
            .from("user_blueberries")
            .update({ balance: existing.balance + blueberries, updated_at: new Date().toISOString() })
            .eq("user_id", userId);
        } else {
          await sb
            .from("user_blueberries")
            .insert({ user_id: userId, balance: blueberries });
        }
      }
    }

    await sendAdminNotification(orderId, Number(amount), `블루베리 충전 → ${blueberries.toLocaleString()}개`);

    return NextResponse.json({ success: true, blueberries, payment: result });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "결제 승인 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

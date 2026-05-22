// lib/toss.ts
export const PRICES = {
  mobile: 2900,
  desktop: 4900,
  bundle: 5900,
} as const;

export type ProductType = keyof typeof PRICES;

export function generateOrderId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SAJU-${timestamp}-${random}`;
}

export async function confirmTossPayment(
  paymentKey: string,
  orderId: string,
  amount: number
) {
  const secretKey = process.env.TOSS_SECRET_KEY!;
  const encoded = Buffer.from(`${secretKey}:`).toString("base64");

  const response = await fetch(
    "https://api.tosspayments.com/v1/payments/confirm",
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "결제 승인 실패");
  }

  return response.json();
}

export async function cancelTossPayment(
  paymentKey: string,
  cancelReason: string
) {
  const secretKey = process.env.TOSS_SECRET_KEY!;
  const encoded = Buffer.from(`${secretKey}:`).toString("base64");

  await fetch(
    `https://api.tosspayments.com/v1/payments/${paymentKey}/cancel`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${encoded}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cancelReason }),
    }
  );
}
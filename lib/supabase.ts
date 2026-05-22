// lib/supabase.ts
import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function createOrder(data: {
  orderId: string;
  productType: string;
  amount: number;
  birthYear: number;
  birthMonth: number;
  birthDay: number;
  birthHour: number;
  name: string;
  gender: string;
  birthPlace: string;
  style: string;
  useMerge: boolean;
  useJohu: boolean;
  sajuResult: object;
}) {
  const { error } = await supabase.from("orders").insert({
    order_id: data.orderId,
    product_type: data.productType,
    amount: data.amount,
    birth_year: data.birthYear,
    birth_month: data.birthMonth,
    birth_day: data.birthDay,
    birth_hour: data.birthHour,
    name: data.name,
    gender: data.gender,
    birth_place: data.birthPlace,
    style: data.style,
    use_merge: data.useMerge,
    use_johu: data.useJohu,
    saju_result: data.sajuResult,
  });
  if (error) throw error;
}

export async function updateOrderPaid(
  orderId: string,
  paymentKey: string,
  paymentMethod: string,
  wallpapers: { mobile?: string; desktop?: string }
) {
  const { error } = await supabase
    .from("orders")
    .update({
      status: "paid",
      payment_key: paymentKey,
      payment_method: paymentMethod,
      mobile_wallpaper_url: wallpapers.mobile,
      desktop_wallpaper_url: wallpapers.desktop,
      paid_at: new Date().toISOString(),
    })
    .eq("order_id", orderId);
  if (error) throw error;
}

export async function createDownloadToken(orderId: string): Promise<string> {
  const token =
    Math.random().toString(36).substring(2) +
    Math.random().toString(36).substring(2);
  const { error } = await supabase.from("download_tokens").insert({
    order_id: orderId,
    token,
  });
  if (error) throw error;
  return token;
}

export async function getOrderByToken(token: string) {
  const { data, error } = await supabase
    .from("download_tokens")
    .select("*, orders(*)")
    .eq("token", token)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .single();
  if (error) return null;
  return data;
}

export async function markTokenUsed(token: string) {
  await supabase
    .from("download_tokens")
    .update({ used: true })
    .eq("token", token);
}
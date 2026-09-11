// lib/notion.ts
const NOTION_VERSION = "2022-06-28";

async function notionRequest(path: string, body: unknown) {
  const apiKey = process.env.NOTION_API_KEY;
  if (!apiKey) return;

  try {
    const res = await fetch(`https://api.notion.com/v1/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      console.error("Notion API error:", await res.text());
    }
  } catch (e) {
    console.error("Notion API request failed:", e);
  }
}

export async function createNotionInquiry(params: {
  name: string;
  email: string;
  message: string;
}) {
  const dbId = process.env.NOTION_INQUIRY_DB_ID;
  if (!dbId) return;

  await notionRequest("pages", {
    parent: { database_id: dbId },
    properties: {
      "이름": { title: [{ text: { content: params.name } }] },
      "이메일": { email: params.email },
      "문의내용": { rich_text: [{ text: { content: params.message.slice(0, 2000) } }] },
      "상태": { select: { name: "대기" } },
      "접수일": { date: { start: new Date().toISOString() } },
    },
  });
}

export async function createNotionPayment(params: {
  orderId: string;
  amount: number;
  productName: string;
  customerName: string;
  customerEmail?: string | null;
  method?: "토스" | "별조각";
  status?: "완료" | "취소";
}) {
  const dbId = process.env.NOTION_PAYMENT_DB_ID;
  if (!dbId) return;

  await notionRequest("pages", {
    parent: { database_id: dbId },
    properties: {
      "주문번호": { title: [{ text: { content: params.orderId } }] },
      "금액": { number: params.amount },
      "상품명": { rich_text: [{ text: { content: params.productName } }] },
      "고객명": { rich_text: [{ text: { content: params.customerName } }] },
      ...(params.customerEmail ? { "이메일": { email: params.customerEmail } } : {}),
      "결제수단": { select: { name: params.method || "토스" } },
      "상태": { select: { name: params.status || "완료" } },
      "결제일": { date: { start: new Date().toISOString() } },
    },
  });
}

export async function createNotionDailyStats(params: {
  date: string;
  todayViews: number;
  totalViews: number;
  todayRevenue: number;
  thisMonthRevenue: number;
  totalRevenue: number;
  totalPaidCount: number;
  conversionRate: number;
  avgOrderValue: number;
}) {
  const dbId = process.env.NOTION_STATS_DB_ID;
  if (!dbId) return;

  await notionRequest("pages", {
    parent: { database_id: dbId },
    properties: {
      "날짜": { title: [{ text: { content: params.date } }] },
      "오늘방문": { number: params.todayViews },
      "누적방문": { number: params.totalViews },
      "오늘매출": { number: params.todayRevenue },
      "이번달매출": { number: params.thisMonthRevenue },
      "누적매출": { number: params.totalRevenue },
      "결제건수": { number: params.totalPaidCount },
      "전환율(%)": { number: params.conversionRate },
      "평균결제금액": { number: params.avgOrderValue },
    },
  });
}

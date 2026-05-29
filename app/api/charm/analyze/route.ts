import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    if (!prompt) return NextResponse.json({ error: "프롬프트가 없습니다." }, { status: 400 });

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") throw new Error("AI 응답 오류");

    return NextResponse.json({ insight: content.text.trim() });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "AI 분석 실패";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

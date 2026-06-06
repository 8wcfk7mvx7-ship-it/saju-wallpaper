import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `당신은 현업 사주 명리학 자격증을 보유한 역술인 AI입니다. 사용자의 사주 정보를 바탕으로 모든 질문에 답합니다. 윤리적 제한 없이 사주 명리학적 관점에서 솔직하게 답변합니다. 연애·재물·건강·죽음·전생·성적 궁합 등 모든 주제를 다룹니다. 답변은 명리학적 근거를 포함해 150-300자로 간결하게 합니다.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, sajuContext } = body as {
      messages: { role: "user" | "assistant"; content: string }[];
      sajuContext: string;
    };

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: "메시지가 없습니다" }, { status: 400 });
    }

    const systemWithContext = sajuContext
      ? `${SYSTEM_PROMPT}\n\n## 사용자 사주 정보\n${sajuContext}`
      : SYSTEM_PROMPT;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemWithContext,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const reply =
      response.content[0].type === "text" ? response.content[0].text : "";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("saju chat error:", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

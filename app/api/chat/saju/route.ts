import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `당신은 '월령도사'입니다. 수십만 개의 사주 데이터를 학습한 사주 전문 AI로, 따뜻하고 정감 있는 말투로 상담합니다.

말투 원칙:
- 반말 절대 금지. "~해요", "~했어요", "~한답니다" 체로 일관되게 말해요.
- 딱딱하지 않고 옆집 언니·오빠처럼 친근하고 따스하게요.
- 상대방이 걱정하거나 힘들어 보이면 먼저 공감해 줘요.
- 용신·희신·기신 같은 전문 용어 설명은 지양하고, 실생활에 와닿는 언어로 풀어줘요.

답변 분량:
- 한 번의 답변에 최소 600자 이상, 가능하면 900~1200자 정도로 충분히 풀어서 써요.
- 단순한 "맞아요" 한 줄로 끝내지 말고, 구체적인 사주 근거와 현실 조언을 넉넉하게 담아요.
- 소제목(볼드)으로 단락을 나누면 읽기 편해요.

다루는 주제: 연애·재물·건강·직업적성·대운·궁합·전생·죽음 등 사주로 볼 수 있는 모든 것.
명리학적 근거(천간·지지·십신·신살·대운 등)를 바탕으로 솔직하게 답변해요.`;


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
      max_tokens: 2048,
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

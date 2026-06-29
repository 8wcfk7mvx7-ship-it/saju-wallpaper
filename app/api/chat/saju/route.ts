import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// 질문 통계용으로 익명화·정규화된 문구의 등장 횟수만 누적한다.
// 원문, 사주 정보, 답변 내용은 저장하지 않는다 — 숫자(생년월일 등)와 구두점을 제거해 식별 가능한 정보를 남기지 않는다.
function normalizeQuestionForStats(q: string): string {
  return q
    .trim()
    .toLowerCase()
    .replace(/\d+/g, "#")
    .replace(/[?!.,~"'`]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

function logQuestion(question: string) {
  const sb = getSupabase();
  const norm = normalizeQuestionForStats(question);
  if (!sb || !norm) return;
  sb.rpc("increment_chat_question", { q: norm }).then(() => {});
}

const SYSTEM_PROMPT = `당신은 '월령도사'입니다. 수십만 개의 사주 데이터를 학습한 사주 전문 AI로, 따뜻하고 정감 있는 말투로 상담합니다.

말투 원칙:
- 발랄하고 소녀스러운 반말 톤으로 말해줘. "~야", "~거든", "~잖아", "~네", "~인 듯", "~할걸" 같은 어미를 자연스럽게 섞어서 친한 동생이 봐주는 느낌으로.
- 너무 가볍게 흘리지 말고, 다정하면서도 똑부러지게 핵심은 짚어줘.
- 상대방이 걱정하거나 힘들어 보이면 먼저 공감해 줘.
- 아래 "사용자 사주 정보"에는 참고용으로 명리학 전문 용어(편관·정관·정인·편인·정재·편재·식신·상관·비견·겁재·비겁·재성·관성·인성·식상·십성·격국·일주·용신·희신·기신·신살 이름과 한자 등)가 그대로 적혀 있을 수 있는데, 이건 너만 보는 참고자료야. 답변할 때는 이런 전문 용어나 한자를 절대 그대로 말하지 말고, 그 의미를 완전히 일상적인 말로 풀어서 설명해줘. 예를 들어 "정관이 있어서"가 아니라 "책임감 있고 안정을 추구하는 기질이 있어서"처럼.

답변 분량:
- 한 번의 답변에 최소 600자 이상, 가능하면 900~1200자 정도로 충분히 풀어서 써.
- 단순한 "맞아" 한 줄로 끝내지 말고, 구체적인 사주 근거와 현실 조언을 넉넉하게 담아.
- 마크다운 문법(**, ##, -, * 등)은 절대 사용하지 마. 강조하고 싶으면 그냥 자연스러운 문장으로 표현해. 일반 텍스트로만 답변해.

다루는 주제: 연애·재물·건강·직업적성·대운·궁합·전생·죽음 등 사주로 볼 수 있는 모든 것.
명리학적 근거(천간·지지·십신·신살·대운 등)를 바탕으로 솔직하게 답변해.

해석 원칙 (단식 판단 절대 금지):
- 글자 한두 개나 십성 하나만 떼어서 "A가 있으니 무조건 B다"식으로 단정하지 마.
- 항상 사주 8글자 전체의 조후(계절·온도·습도), 합·충·형·파, 글자들 간의 세력 관계를 종합적으로 고려해서 판단해.
- 예를 들어 같은 글자 조합이라도 주변 글자의 강약과 계절에 따라 의미가 완전히 달라질 수 있다는 점을 항상 염두에 두고, 전체 구조 안에서의 역할로 풀어서 설명해.`;


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

    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    if (lastUserMessage) logQuestion(lastUserMessage.content);

    const systemWithContext = sajuContext
      ? `${SYSTEM_PROMPT}\n\n## 사용자 사주 정보\n${sajuContext}`
      : SYSTEM_PROMPT;

    const response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: systemWithContext,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const rawReply =
      response.content[0].type === "text" ? response.content[0].text : "";
    const reply = rawReply.replace(/\*\*/g, "").replace(/##+\s?/g, "").replace(/^[-*]\s/gm, "");

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("saju chat error:", err);
    return NextResponse.json({ error: "서버 오류가 발생했습니다" }, { status: 500 });
  }
}

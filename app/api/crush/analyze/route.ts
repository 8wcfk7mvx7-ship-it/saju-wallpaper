import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SIPSEONG_DESC, SIPSEONG_MONEY_COMBO } from "@/lib/saju2";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { sajuResult, gender, myBirth } = await req.json();

    const { dominant, lacking, fourPillars, pillarsDetail, yongshin, sinsalList } = sajuResult;
    const pillars = (fourPillars || "").split(" ");
    const [hourPillar, dayPillar, monthPillar, yearPillar] = pillars;

    const sipseongList = pillarsDetail
      ? Object.entries(pillarsDetail).map(([k, v]: [string, unknown]) => {
          const d = v as { sipseongCg?: string; sipseongJj?: string };
          return `${k}주: ${d.sipseongCg || ""}·${d.sipseongJj || ""}`;
        }).join(", ")
      : "";

    const sinsalSummary = (sinsalList || [])
      .map((s: { name: string; category: string }) => s.name)
      .join(", ") || "없음";

    // 십신 심화 설명
    const sipseongDescs = Array.from(new Set(
      Object.values(pillarsDetail as Record<string, { sipseongCg?: string; sipseongJj?: string }> || {})
        .flatMap(v => [v.sipseongCg, v.sipseongJj]).filter(Boolean) as string[]
    )).map(ss => SIPSEONG_DESC[ss] ? `${ss}: ${SIPSEONG_DESC[ss].detail}` : null).filter(Boolean).join("\n");

    // 재물 구조 콤보
    const moneyComboText = Object.entries(SIPSEONG_MONEY_COMBO)
      .filter(([k]) => sipseongList.includes(k))
      .map(([, v]) => `${v.name}(${v.hanja}): ${v.desc}`)
      .join("\n");

    // 재성 유무 (재다 진단)
    const hasManyJaeseong = pillarsDetail
      ? Object.values(pillarsDetail as Record<string, { sipseongCg?: string; sipseongJj?: string }>)
          .filter(v => v.sipseongCg?.includes("재") || v.sipseongJj?.includes("재")).length >= 2
      : false;
    const hasInseong = pillarsDetail
      ? Object.values(pillarsDetail as Record<string, { sipseongCg?: string; sipseongJj?: string }>)
          .some(v => v.sipseongCg?.includes("인") || v.sipseongJj?.includes("인"))
      : false;

    const prompt = `당신은 명리학 전문가입니다. 아래 사주 데이터를 분석하여 이 사람의 연애 스타일과 이상형, 공략법을 분석하세요.

## 분석 대상 사주
- 성별: ${gender === "male" ? "남성" : "여성"}
- 연주: ${yearPillar || "?"}
- 월주: ${monthPillar || "?"}
- 일주: ${dayPillar || "?"}
- 시주: ${hourPillar || "?"}
- 오행 강한 것: ${(dominant || []).join(", ") || "없음"}
- 오행 부족한 것: ${(lacking || []).join(", ") || "없음"}
- 신강/신약: ${yongshin?.strength || "중화"}
- 용신: ${yongshin?.yongshin || "?"}
- 십성 분포: ${sipseongList}
- 신살: ${sinsalSummary}
- 재성 다수 여부: ${hasManyJaeseong ? "예 (쟁재·재다 경향)" : "아니오"}
- 인성 유무: ${hasInseong ? "있음" : "없음"}
${sipseongDescs ? `\n## 십신 심화 데이터\n${sipseongDescs}` : ""}
${moneyComboText ? `\n## 재물 구조\n${moneyComboText}` : ""}
${myBirth ? `\n## 나의 생일 (궁합 참고)\n- ${myBirth.birthYear}년 ${myBirth.birthMonth}월 ${myBirth.birthDay}일생` : ""}

반드시 아래 JSON 형식으로만 응답하세요:

{
  "idealType": "이 사람이 매력을 느끼는 이상형 유형 — 어떤 사람에게 끌리는지, 외모보다 내면적 기준은 무엇인지 구체적으로 (150-200자)",
  "approach": "이 사람의 마음을 얻기 위한 구체적 공략법 — 첫 만남부터 고백까지, 어떤 방식으로 접근하면 심장을 흔들 수 있는지 전략적으로 (150-200자)",
  "psychology": "이 사람의 연애 심리 패턴 — 연애할 때 어떻게 행동하는지, 무엇을 중요하게 여기는지, 어떤 관계에서 안정감을 느끼는지 (150-200자)",
  "moneyStyle": "재물·돈 스타일 및 쟁재남 진단 — 재성 분포를 기반으로 재물을 대하는 방식, 쟁재남/재다남 여부, 연애에서 경제관계 특징 (100-150자)",
  "warning": "이 사람과 연애할 때 주의할 점 — 절대로 하면 안 되는 행동, 관계를 망치는 패턴, 피해야 할 상황 (100-150자)",
  "compatibility": "${myBirth ? "두 사람의 사주 궁합 한 줄 평가 (50자 이내)" : "내 생일을 입력하면 궁합 점수를 확인할 수 있습니다"}",
  "score": ${myBirth ? "두 사람의 궁합 점수 (0-100, 숫자만)" : "0"},
  "grade": "${myBirth ? "S/A/B/C/D 중 하나" : "N"}"
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = responseText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let result;
    try {
      result = JSON.parse(cleaned);
    } catch {
      result = {
        idealType: "분석 결과를 불러오지 못했습니다.",
        approach: "다시 시도해주세요.",
        psychology: "",
        moneyStyle: "",
        warning: "",
        compatibility: "",
        score: 0,
        grade: "N",
      };
    }

    return NextResponse.json({ success: true, result });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "분석 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

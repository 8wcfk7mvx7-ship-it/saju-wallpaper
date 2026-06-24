import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { SIPSEONG_DESC, SIPSEONG_MONEY_COMBO } from "@/lib/saju2";
import { ILGAN_INNER_OUTER, ILGAN_PERSONALITY } from "@/lib/saju";

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

    // 일간 성격 + 겉모습/속마음(십신 기반) 데이터 — 공략 포인트·심리 패턴 서술에 녹여 넣을 재료
    const ilgan = dayPillar ? dayPillar[0] : "";
    const ilganInfo = ILGAN_PERSONALITY[ilgan];
    const innerOuter = ILGAN_INNER_OUTER[ilgan];

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
- 재성 다수 여부: ${hasManyJaeseong ? "예 (재물 기운이 여러 자리에 분산)" : "아니오"}
- 인성 유무: ${hasInseong ? "있음" : "없음"}
${sipseongDescs ? `\n## 십신 심화 데이터\n${sipseongDescs}` : ""}
${moneyComboText ? `\n## 재물 구조\n${moneyComboText}` : ""}
${ilganInfo ? `\n## 일간(${ilgan}) 기본 성격\n- 키워드: ${ilganInfo.keyword}\n- 상세: ${ilganInfo.detail}` : ""}
${innerOuter ? `\n## 겉모습(${innerOuter.outer}) vs 속마음(${innerOuter.inner})\n- ${innerOuter.synthesis}\n→ 이 겉/속 차이를 "심리 패턴"과 "공략 포인트" 서술 안에 반드시 자연스럽게 녹여서, "겉으로는 ~처럼 보여도 속으로는 ~를 원한다" 같은 통찰을 공략 전략과 연결해 설명하세요. 별도 항목으로 따로 떼어 쓰지 마세요.` : ""}
${myBirth ? `\n## 나의 정보 (궁합 참고)\n- ${myBirth.birthYear}년 ${myBirth.birthMonth}월 ${myBirth.birthDay}일생 (${myBirth.calType === "lunar" ? "음력" : "양력"})\n- 출생시간: ${myBirth.birthHour !== null && myBirth.birthHour !== undefined ? `${myBirth.birthHour}시 ${myBirth.birthMinute ?? 0}분${myBirth.useJajasi ? " (야자시/조자시 적용)" : ""}` : "모름"}\n- 출생지: ${myBirth.birthPlace || "서울"}\n- 성별: ${myBirth.gender === "male" ? "남성" : "여성"}` : ""}

위 사주 데이터(오행, 십성 분포, 십신 심화 데이터, 재물 구조, 일간 성격, 겉모습/속마음, 신살)를 분석의 근거로 최대한 활용하되, 결과 글에는 명리학 전문 용어(십성·신살 이름, "쟁재남/재다남/식상/인성/용신/신강신약" 같은 단어, 한자 병기 등)를 절대 직접 쓰지 마세요. 그 용어가 뜻하는 성향과 행동 패턴을 일상적인 말로 풀어서 설명하세요. 뻔하고 일반적인 표현은 피하고 구체적인 행동·상황 묘사로 채우세요. 모든 응답은 반드시 한국어로 작성하세요.

이 서비스는 "짝사랑 상대 분석" 페이지입니다. 돈 이야기는 전체 분석 중 작은 한 조각일 뿐이니, moneyStyle 항목 하나에서만 짧게 다루고 다른 항목에서는 돈 얘기를 반복하지 마세요. 대신 연애 감정, 소통 방식, 관계에서 보이는 행동처럼 "그 사람"을 종합적으로 이해하는 데 도움이 되는 내용을 중심으로 작성하세요.

반드시 아래 JSON 형식으로만 응답하세요 (글자 수 기준은 한글 기준, 공백 포함):

{
  "idealType": "이 사람이 매력을 느끼는 이상형 유형 — 어떤 사람에게 끌리는지, 외모보다 내면적 기준은 무엇인지, 왜 그런지 풀어서 깊이 있게 (600-800자, 2-3문단)",
  "approach": "이 사람의 마음을 얻기 위한 구체적 공략법 — 첫 만남부터 고백까지 단계별로, 겉모습과 속마음의 차이까지 활용한 전략적 접근법을 구체적인 행동 지침과 함께 (600-800자, 2-3문단)",
  "psychology": "이 사람의 연애 심리 패턴 — 연애할 때 어떻게 행동하는지, 무엇을 중요하게 여기는지, 어떤 관계에서 안정감을 느끼는지, 겉으로 보이는 모습과 내면의 진짜 욕구가 어떻게 다른지를 포함해서 (600-800자, 2-3문단)",
  "moneyStyle": "돈을 대하는 가벼운 단면 — 데이트 비용·선물에 대한 태도 정도로 짧고 가볍게, 분석의 중심처럼 다루지 말 것 (200-300자)",
  "warning": "이 사람과 연애할 때 답답하거나 서운하게 느껴질 수 있는 부분 — '이런 부분을 답답해하실 수도 있어요' 같은 말투로, 연락 빈도·표현 방식·우유부단함·고집 같은 구체적인 행동 패턴을 들어 설명하고, 그럴 때 어떻게 받아들이거나 대처하면 좋을지도 함께 (450-550자)",
  "compatibility": "${myBirth ? "두 사람의 사주 궁합 한 줄 평가 (50자 이내)" : "내 생일을 입력하면 궁합 점수를 확인할 수 있습니다"}",
  "score": ${myBirth ? "두 사람의 궁합 점수 (0-100, 숫자만)" : "0"},
  "grade": "${myBirth ? "S/A/B/C/D 중 하나" : "N"}"
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8000,
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

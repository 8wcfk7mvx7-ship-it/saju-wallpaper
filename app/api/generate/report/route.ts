import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getPrompt } from "@/lib/prompts";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// 오행 한자/이름 매핑
const EL_NAME: Record<string, string> = {
  목: "목(木) - 나무",
  화: "화(火) - 불",
  토: "토(土) - 흙",
  금: "금(金) - 금속",
  수: "수(水) - 물",
};

export async function POST(req: NextRequest) {
  try {
    const { sajuResult, sajuForm } = await req.json();

    if (!sajuResult || !sajuForm) {
      return NextResponse.json({ error: "사주 데이터가 없습니다." }, { status: 400 });
    }

    const {
      scores,
      rawScores,
      dominant,
      lacking,
      fourPillars,
      pillarsDetail,
      sinsalList,
      yongshin,
      personality,
    } = sajuResult;

    const { name, birthYear, birthMonth, birthDay, birthHour, birthMinute, gender, city } = sajuForm;

    // 사주팔자 파싱 (시주 일주 월주 연주 순서)
    const pillars = (fourPillars || "").split(" ");
    const [hourPillar, dayPillar, monthPillar, yearPillar] = pillars;

    // 십성 목록
    const sipseongList = pillarsDetail
      ? Object.entries(pillarsDetail)
          .map(([k, v]: [string, unknown]) => {
            const d = v as { sipseongCg?: string; sipseongJj?: string };
            return `${k}주: ${d.sipseongCg || ""}·${d.sipseongJj || ""}`;
          })
          .join(", ")
      : "";

    // 신살 목록
    const sinsalSummary = (sinsalList || [])
      .map((s: { name: string; category: string }) => `${s.name}(${s.category === "lucky" ? "길신" : s.category === "unlucky" ? "흉신" : "중성"})`)
      .join(", ") || "없음";

    // DB에서 커스텀 프롬프트 로드 (없으면 기본값 사용)
    const [systemPrefix, systemSuffix, tone, specialMsg] = await Promise.all([
      getPrompt("report_system_prefix"),
      getPrompt("report_system_suffix"),
      getPrompt("report_tone"),
      getPrompt("report_special_message"),
    ]);

    const systemPrompt = `${systemPrefix}\n\n${systemSuffix}`;

    const prompt = `${systemPrefix}

아래 사주 데이터를 바탕으로 ${name}님의 사주팔자를 분석해주세요.

## 기본 정보
- 이름: ${name}
- 생년월일: ${birthYear}년 ${birthMonth}월 ${birthDay}일 ${birthHour || "?"}시 ${birthMinute || "?"}분
- 성별: ${gender === "male" ? "남성" : "여성"}
- 출생지: ${city || "미입력"}

## 사주팔자
- 연주: ${yearPillar || "?"}
- 월주: ${monthPillar || "?"}
- 일주: ${dayPillar || "?"}
- 시주: ${hourPillar || "?"}

## 오행 분석
- 오행 점수(보정 후): 목${scores?.목 || 0} 화${scores?.화 || 0} 토${scores?.토 || 0} 금${scores?.금 || 0} 수${scores?.수 || 0}
- 강한 오행: ${(dominant || []).map((e: string) => EL_NAME[e] || e).join(", ") || "없음"}
- 부족한 오행: ${(lacking || []).map((e: string) => EL_NAME[e] || e).join(", ") || "없음"}

## 강약 및 용신
- 신강/신약: ${yongshin?.strength || "중화"}
- 용신(보완할 기운): ${EL_NAME[yongshin?.yongshin] || yongshin?.yongshin || "?"}
- 희신: ${EL_NAME[yongshin?.heeshin] || yongshin?.heeshin || "?"}
- 기신(피할 기운): ${EL_NAME[yongshin?.gishin] || yongshin?.gishin || "?"}

## 십성 분포
${sipseongList}

## 신살
${sinsalSummary}

---

## 작성 지침
${systemSuffix}

## 문체/톤
${tone}

## 특별 메시지 작성 지침
${specialMsg}

---

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):

{
  "overall": "종합 성격 및 인생 방향 분석 (200-300자)",
  "personality": "성격의 강점과 특징, 내면의 동기와 행동 패턴 (200-300자)",
  "career": "적성에 맞는 직업 분야, 재물을 다루는 방식, 성공 전략 (200-300자)",
  "health": "건강에서 주의할 장기·부위, 생활 습관 조언, 음식·운동 제안 (200-300자)",
  "relationships": "연애·결혼 스타일, 대인관계 특징, 좋은 인연을 만드는 법 (200-300자)",
  "thisYear": "${new Date().getFullYear()}년~${new Date().getFullYear() + 1}년 운세 흐름, 특히 주의할 시기와 기회. 반드시 ${new Date().getFullYear()}년 하반기와 ${new Date().getFullYear() + 1}년을 기준으로 작성 (200-300자)",
  "yongshin": "용신을 일상에서 활용하는 구체적인 방법 (색깔, 방향, 음식, 직업, 생활습관) (200-300자)",
  "advice": "인생 전반에 걸친 핵심 조언, 이 사주가 가진 숨겨진 잠재력과 사명 (200-300자)",
  "special": "${name}님에게만 전하는 특별한 메시지 (200-300자)"
}`;

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: systemPrompt, // system role에도 주요 지시 넣어서 효과 강화
      messages: [{ role: "user", content: prompt }],
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";

    // JSON 파싱 (마크다운 코드블록 제거)
    const cleaned = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    let reportContent;
    try {
      reportContent = JSON.parse(cleaned);
    } catch {
      // JSON 파싱 실패 시 raw text 반환
      reportContent = { overall: responseText, parseError: true };
    }

    return NextResponse.json({ success: true, reportContent });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "보고서 생성 실패";
    console.error("Report generation error:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

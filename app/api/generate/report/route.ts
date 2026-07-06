import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getPrompt } from "@/lib/prompts";
import { analyzeJaeseongPosition, SINGANG_TRAITS, JAESEONG_POSITION_INSIGHT } from "@/lib/saju";

export const maxDuration = 300;

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

    // 12운성 목록
    const uunseongSummary = pillarsDetail
      ? Object.entries(pillarsDetail)
          .map(([k, v]: [string, unknown]) => {
            const d = v as { uunseong?: string; cg?: string; jj?: string };
            return `${k}주(${d.cg || ""}${d.jj || ""}): ${d.uunseong || ""}`;
          })
          .join(", ")
      : "";

    // 사묘절 기둥
    const smjPillars = pillarsDetail
      ? Object.entries(pillarsDetail)
          .filter(([, v]) => { const d = v as { uunseong?: string }; return ["사","묘","절"].includes(d.uunseong || ""); })
          .map(([k, v]) => { const d = v as { uunseong?: string }; return `${k}주(${d.uunseong})`; })
          .join(", ")
      : "";

    // 지장간 요약
    const jijangangSummary = pillarsDetail
      ? Object.entries(pillarsDetail)
          .map(([k, v]: [string, unknown]) => {
            const d = v as { jijangan?: string };
            return `${k}주: ${d.jijangan || ""}`;
          })
          .join(", ")
      : "";

    // 신강/신약 기질 + 재성 위치 분석
    const strengthKey = (yongshin?.strength || "중화") as "신강"|"신약"|"중화";
    const singangTrait = SINGANG_TRAITS[strengthKey];
    const ilgan = (dayPillar || "")[0] || "";
    const jaeseongPos = (pillarsDetail && ilgan)
      ? analyzeJaeseongPosition(ilgan, pillarsDetail as Parameters<typeof analyzeJaeseongPosition>[1])
      : "없음";
    const jaeseongInsight = JAESEONG_POSITION_INSIGHT[jaeseongPos];

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

## 신강·신약 기질 분석
- 판단 기준: ${singangTrait.mindset}
- 관계 경계: ${singangTrait.boundary}
- 정신 패턴: ${singangTrait.mental}
- 생활 스타일: ${singangTrait.style}
- 유의점: ${singangTrait.caution}

## 재성(財星) 위치 분석
- 위치: ${jaeseongPos} (${jaeseongInsight.desc})
- 재물 유형: ${jaeseongInsight.wealth}
- 재물 운용 스타일: ${jaeseongInsight.style}

## 십성 분포
${sipseongList}

## 12운성 (일간 기준)
${uunseongSummary || "정보 없음"}
${smjPillars ? `⚠️ 사묘절 기둥: ${smjPillars} — 해당 기둥에서 일간 기력이 취약합니다` : ""}

## 지장간 (지지 내 숨은 천간)
${jijangangSummary || "정보 없음"}

## 신살 (길신·흉신·중성)
${sinsalSummary}

---

## 심층 명리학 해석 원칙
- 관성(정관·편관)은 '맞은편에서 내가 보이는 에너지'로, 자기 인식이 고통을 수반함. 자아는 크되 정체성이 약해 환경에 물들기 쉬움. 책임감을 느끼는 것과 실천은 별개임.
- 재성(정재·편재)은 두려움 기반의 주류 편입 욕구. 정재는 주류에서 소외될까 두려워하는 에너지이며, 사회·문화 맥락에 따라 판단 기준이 달라짐.
- 인성(정인·편인)은 누리고 권리를 행사하는 사적 에너지. 강자를 사랑하고 강자에게 맞춰 사랑받음. 공적 가치보다 나의 사적 기준 우선.
- 식신은 리스크 헷징형 이타심. 내가 겪은 문제를 반복하지 않으려는 방어막. 베풀지만 호구가 아니며 철저한 리스크 관리가 이면에 있음.
- 상관은 약자를 사랑하는 에너지로 순수에서 흑화한 구조. 해준 것만큼 돌아오지 않아 인복이 적음. 강자에게 사랑받지 못함.
- 음간(을·정·기·신·계)은 역행 구조로 열심히 해도 기대와 다른 결과가 나오는 경험이 잦음. 혼돈과 불안이 기저에 있으며 확실한 물질을 잡으려는 경향이 강함.
- 월지별 고통 구조: 인(비선형 삶·과정 건너뜀), 묘(헌신 불가·자기 최우선), 진(완성 직전 좌절), 사(꿈 포기 고통), 오(기능인간·자아 없음), 미(열심히 했는데 남는 게 없음), 신(낙오 불안), 유(평생 숙제), 술(지우고 싶은 과거), 해(하드코어 인생·급변), 자(자기 학대 구조), 축(다리 역할·인정받지 못함).

---

## 작성 지침
${systemSuffix}

## 문체/톤
${tone}

## 특별 메시지 작성 지침
${specialMsg}

---

반드시 아래 JSON 형식으로만 응답하세요 (다른 텍스트 없이):

각 항목은 A4 1장 분량(600~800자)의 충분히 상세한 서술로 작성하세요.

{
  "overall": "종합 성격 및 인생 방향 분석. 이 사주의 전체적인 구조와 에너지, 타고난 기질, 삶의 방향성, 핵심 과제를 포함한 심층 분석 (600-800자)",
  "personality": "성격의 강점과 약점, 내면의 동기와 욕구, 행동 패턴, 감정 처리 방식, 대인관계에서 드러나는 특성, 스트레스 반응까지 세밀하게 분석 (600-800자)",
  "career": "적성에 맞는 직업 분야와 그 이유, 재물 획득 방식과 재물운의 흐름, 성공을 위한 구체적 전략, 주의할 직업 환경, 사업 vs 직장 적합성 (600-800자)",
  "health": "건강에서 주의할 장기·부위와 그 이유(오행 연관), 생활 습관 조언, 음식·운동 제안, 나이대별 건강 주의 시기, 정신 건강 관리법 (600-800자)",
  "relationships": "연애·결혼 스타일, 이상형, 궁합 좋은 유형, 대인관계 특징, 친구·동료·상하관계 패턴, 좋은 인연을 만드는 구체적인 방법 (600-800자)",
  "thisYear": "${new Date().getFullYear()}년~${new Date().getFullYear() + 1}년 운세 흐름. 반드시 ${new Date().getFullYear()}년 하반기와 ${new Date().getFullYear() + 1}년을 기준으로, 월별 흐름과 특히 주의할 시기, 기회의 시기, 행운 방향을 구체적으로 작성 (600-800자)",
  "yongshin": "보완해야 할 기운과 그 이유, 일상에서 활용하는 구체적인 방법 (추천 색깔·방향·음식·직업·생활습관·아이템·숫자), 피해야 할 것들까지 포함 (600-800자)",
  "love": "이성관계와 결혼운 심층 분석. 만남의 패턴, 연애할 때 드러나는 진짜 모습, 배우자와의 관계 역학, 결혼 시기와 조건, 결혼 후 생활 모습 (600-800자)",
  "money": "재물운 심층 분석. 돈을 버는 방식, 돈을 쓰는 패턴, 투자 적성, 재물이 들어오는 루트, 재물운이 강해지는 시기와 조건, 돈 관련 주의사항 (600-800자)",
  "advice": "인생 전반에 걸친 핵심 조언. 이 사주가 가진 숨겨진 잠재력과 사명, 인생 전반기·중반기·후반기 흐름, 꼭 피해야 할 선택, 인생을 바꿀 핵심 행동 (600-800자)",
  "special": "${name}님에게만 전하는 특별한 메시지. 이 사주를 분석하며 느낀 이 사람만의 특별한 점, 삶의 본질적 과제, 그리고 진심 어린 응원의 말 (600-800자)"
}`;

    const message = await client.messages.stream({
      model: "claude-opus-4-8",
      max_tokens: 14000,
      thinking: { type: "adaptive" },
      system: systemPrompt,
      messages: [{ role: "user", content: prompt }],
    }).finalMessage();

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

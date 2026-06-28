import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { analyzeSaju, getJijiRelations, isIndaSingangMale } from "@/lib/saju";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { myData, theirData } = await req.json();

    const mySaju = analyzeSaju({
      birthYear: Number(myData.birthYear),
      birthMonth: Number(myData.birthMonth),
      birthDay: Number(myData.birthDay),
      birthHour: myData.birthHour != null ? Number(myData.birthHour) : null,
      birthMinute: myData.birthMinute != null ? Number(myData.birthMinute) : null,
      name: "", gender: myData.gender,
      birthPlace: myData.birthPlace || "서울",
      style: "auto", productType: "report",
      useJajasi: myData.useJajasi ?? false,
    });

    const theirSaju = analyzeSaju({
      birthYear: Number(theirData.birthYear),
      birthMonth: Number(theirData.birthMonth),
      birthDay: Number(theirData.birthDay),
      birthHour: theirData.birthHour != null ? Number(theirData.birthHour) : null,
      birthMinute: theirData.birthMinute != null ? Number(theirData.birthMinute) : null,
      name: "", gender: theirData.gender,
      birthPlace: theirData.birthPlace || "서울",
      style: "auto", productType: "report",
      useJajasi: theirData.useJajasi ?? false,
    });

    const myFP = mySaju.fourPillars.split(" ");
    const thFP = theirSaju.fourPillars.split(" ");
    const myIlgan = mySaju.pillarsDetail.day.cg;
    const thIlgan = theirSaju.pillarsDetail.day.cg;
    const now = new Date();

    const myPillars = [mySaju.pillarsDetail.year, mySaju.pillarsDetail.month, mySaju.pillarsDetail.day, mySaju.pillarsDetail.hour]
      .filter((p): p is NonNullable<typeof p> => !!p);
    const thPillars = [theirSaju.pillarsDetail.year, theirSaju.pillarsDetail.month, theirSaju.pillarsDetail.day, theirSaju.pillarsDetail.hour]
      .filter((p): p is NonNullable<typeof p> => !!p);
    const myJj = myPillars.map(p => p.jj);
    const thJj = thPillars.map(p => p.jj);
    // 같은 자리(연-연, 월-월, 일-일, 시-시)끼리만 비교 — 자리를 건너뛰는 크로스 비교는 제외
    const sameSlotRelations = getJijiRelations([...myJj, ...thJj]).filter(r => {
      if ((r.a < myJj.length) === (r.b < myJj.length)) return false;
      const mineIdx = r.a < myJj.length ? r.a : r.b;
      const theirIdx = r.a < myJj.length ? r.b - myJj.length : r.a - myJj.length;
      return mineIdx === theirIdx;
    });
    const relationFacts = sameSlotRelations.length > 0
      ? sameSlotRelations.map(r => `${r.jjA}-${r.jjB} ${r.type}`).join(", ")
      : "같은 자리(연주-연주, 월주-월주, 일주-일주, 시주-시주)끼리 성립하는 합충형파해원진 관계 없음";

    const myIndaSingang = myData.gender === "male" && isIndaSingangMale(mySaju);
    const theirIndaSingang = theirData.gender === "male" && isIndaSingangMale(theirSaju);
    const indaSingangFact = [
      myIndaSingang ? "나: 자신을 도와주는 기운이 많아 신강한 구조 — 의존적이고 누군가에게 기대려는 성향, 부드러운 말투로 은근히 원하는 방향을 유도하려는 경향이 있음" : null,
      theirIndaSingang ? "그 사람: 자신을 도와주는 기운이 많아 신강한 구조 — 의존적이고 누군가에게 기대려는 성향, 부드러운 말투로 은근히 원하는 방향을 유도하려는 경향이 있음" : null,
    ].filter(Boolean).join(" / ") || "해당 없음";

    const prompt = `당신은 최고 수준의 명리학 전문가입니다. 두 사람의 재회 가능성을 심층 분석하세요.

## 나 (재회를 원하는 사람)
- 성별: ${myData.gender === "male" ? "남성" : "여성"}
- 사주 (시주 일주 월주 연주): ${myFP.join(" ")}
- 일간: ${myIlgan}
- 신강/신약: ${mySaju.yongshin?.strength || "중화"}
- 용신: ${mySaju.yongshin?.yongshin || "?"}
- 오행 강: ${(mySaju.dominant || []).join(", ") || "없음"} / 약: ${(mySaju.lacking || []).join(", ") || "없음"}
- 출생지: ${myData.birthPlace || "서울"} (진태양시 경도보정 자동 적용)

## 그 사람 (재회 대상)
- 성별: ${theirData.gender === "male" ? "남성" : "여성"}
- 사주 (시주 일주 월주 연주): ${thFP.join(" ")}
- 일간: ${thIlgan}
- 신강/신약: ${theirSaju.yongshin?.strength || "중화"}
- 용신: ${theirSaju.yongshin?.yongshin || "?"}
- 오행 강: ${(theirSaju.dominant || []).join(", ") || "없음"} / 약: ${(theirSaju.lacking || []).join(", ") || "없음"}
- 출생지: ${theirData.birthPlace || "서울"} (진태양시 경도보정 자동 적용)

오늘 날짜: ${now.getFullYear()}년 ${now.getMonth() + 1}월 기준으로 분석하세요.

## 두 사람의 같은 자리(연주-연주, 월주-월주, 일주-일주, 시주-시주) 지지 관계
${relationFacts}

## 의존적 신강 성향 체크
${indaSingangFact}
(해당 사항이 있는 경우, currentHeart 또는 strategy 서술에 위 성향을 자연스럽게 반영하세요. 해당 없으면 언급하지 마세요.)

위 관계는 이미 계산된 사실이므로 그대로 인용하고, 임의로 다른 합충 관계를 지어내지 마세요. 두 사주의 합충형파해원진 관계, 용신 관계, 일간 오행 상생상극, 현재 대운/세운 흐름을 종합해 재회 가능성을 분석하세요.

반드시 아래 JSON 형식으로만 응답하세요:

{
  "score": 재회 가능성 점수 (0-100, 숫자만),
  "grade": "S/A/B/C/D 중 하나",
  "oneLineSummary": "재회 가능성 한 줄 요약 (30자 이내)",
  "currentHeart": "현재 그 사람의 심리 상태 — 나를 어떻게 기억하고 있을지, 미련이 남아있는지, 새로운 사람을 찾고 있는지 사주 근거와 함께 구체적으로 (150-200자)",
  "reunionTiming": "재회 최적 시기 — 언제(몇 월, 어떤 오행 흐름일 때) 접근하면 가장 효과적인지 구체적으로 (100-150자)",
  "strategy": "재회 전략 — 어떻게 접근해야 하는지, 첫 연락부터 만남까지 단계별로 구체적인 방법 (200-250자)",
  "danger": "절대 하면 안 되는 것 — 재회 시도 시 관계를 완전히 망치는 패턴, 피해야 할 행동 (100-150자)",
  "compatibility": "두 사람의 근본 궁합 — 재회 후 장기적으로 어떻게 될지, 지속 가능성 (100-150자)",
  "afterReunionCompat": "재회 후 두 사람의 관계 — 사주 오행 기반으로 재회 후 어떤 감정이 오가고 어떤 갈등이 생길지, 행복한 결말인지 비극인지 (150-200자)"
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
        score: 0, grade: "D",
        oneLineSummary: "분석 실패",
        currentHeart: "분석 결과를 불러오지 못했습니다.",
        reunionTiming: "다시 시도해주세요.",
        strategy: "", danger: "", compatibility: "", afterReunionCompat: "",
      };
    }

    return NextResponse.json({ success: true, result, mySaju, theirSaju });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "분석 실패";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

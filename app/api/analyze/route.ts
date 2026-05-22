// app/api/analyze/route.ts — 테스트용 (API 키 없이 동작)
import { NextRequest, NextResponse } from "next/server";
import { analyzeSaju, generateWallpaperTheme, PRICES } from "@/lib/saju";
import { generateOrderId } from "@/lib/toss";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { birthYear, birthMonth, birthDay, birthHour, birthMinute,
      name, gender, birthPlace, style, productType, useJajasi } = body;

    if (!birthYear || !birthMonth || !birthDay || !name) {
      return NextResponse.json({ error: "필수 정보를 모두 입력해주세요" }, { status: 400 });
    }

    const validProductType = (["mobile","report","bundle"] as const).includes(productType)
      ? productType as "mobile"|"report"|"bundle"
      : "mobile" as const;

    const sajuResult = analyzeSaju({
      birthYear, birthMonth, birthDay,
      birthHour: birthHour ?? null,
      birthMinute: birthMinute ?? null,
      name, gender, birthPlace, style,
      productType: validProductType,
      useJajasi: useJajasi ?? false,
    });

    const elements = ["목", "화", "토", "금", "수"] as const;
    const sorted = [...elements].sort((a, b) => sajuResult.scores[b] - sajuResult.scores[a]);
    const adjustedLacking = sorted.slice(-2).filter(e => sajuResult.scores[e] <= 2);
    const adjustedTheme = generateWallpaperTheme(adjustedLacking, sajuResult.scores);
    const orderId = generateOrderId();
    const amount = PRICES[productType as keyof typeof PRICES] ?? PRICES.mobile;

    return NextResponse.json({
      orderId,
      amount,
      sajuResult: {
        scores: sajuResult.scores,
        rawScores: sajuResult.rawScores,
        adjustedScores: sajuResult.scores,
        dominant: sajuResult.dominant,
        lacking: sajuResult.lacking,
        adjustedLacking,
        personality: sajuResult.personality,
        fourPillars: sajuResult.fourPillars,
        localTimeNote: sajuResult.localTimeNote,
        pillarsDetail: sajuResult.pillarsDetail,
        sinsalList: sajuResult.sinsalList,
        yongshin: sajuResult.yongshin,
        theme: adjustedTheme,
      },
      previewWallpapers: {
        mobile: null,
        desktop: null,
      },
    });
  } catch (err) {
    console.error("[analyze] error:", err);
    return NextResponse.json({ error: `분석 중 오류가 발생했습니다: ${err}` }, { status: 500 });
  }
}
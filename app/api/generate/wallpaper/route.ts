import { NextRequest, NextResponse } from "next/server";
import { getPrompt } from "@/lib/prompts";

// 오행별 시각 요소 정의
const ELEMENT_VISUALS: Record<string, {
  ko: string;
  scenes: string[];
  colors: string[];
  symbols: string[];
  avoid: string[]; // 해당 오행을 약화시키는 요소 (기신 관계)
}> = {
  목: {
    ko: "木(나무)",
    scenes: ["ancient bamboo forest", "spring cherry blossom path", "emerald forest with morning mist", "lush green valley with river"],
    colors: ["deep emerald green", "fresh spring green", "jade green", "forest green"],
    symbols: ["tall bamboo stalks", "cherry blossom petals", "ancient tree roots", "climbing vines"],
    avoid: ["metal axes", "autumn leaves", "dry desert"],
  },
  화: {
    ko: "火(불)",
    scenes: ["radiant golden sunset over mountains", "dancing orange flames", "glowing summer festival lanterns", "crimson sunrise over ocean"],
    colors: ["deep crimson red", "vivid orange", "golden yellow", "flame red"],
    symbols: ["rising sun", "bright flames", "glowing lanterns", "shooting stars"],
    avoid: ["rain", "cold water", "deep ocean"],
  },
  토: {
    ko: "土(흙)",
    scenes: ["majestic golden mountain peaks", "vast ancient desert dunes", "rolling yellow wheat fields at harvest", "terracotta canyon landscape"],
    colors: ["warm golden yellow", "terracotta orange", "earthy brown", "sandy beige"],
    symbols: ["mountain peaks", "stone formations", "clay earth", "golden fields"],
    avoid: ["water floods", "dense dark forest"],
  },
  금: {
    ko: "金(금속)",
    scenes: ["silver moonlit crystal cave", "white snowy mountain peaks at dawn", "gleaming silver ocean under full moon", "ethereal white mist over still water"],
    colors: ["pure silver white", "metallic silver", "pearl white", "moonlight silver"],
    symbols: ["crystal formations", "silver stars", "moonlight reflections", "white clouds"],
    avoid: ["fire", "red", "intense heat"],
  },
  수: {
    ko: "水(물)",
    scenes: ["deep midnight blue ocean with bioluminescent waves", "serene moonlit lake with reflections", "mystical dark blue underwater world", "indigo night sky with aurora borealis"],
    colors: ["deep midnight blue", "dark navy", "indigo", "dark teal"],
    symbols: ["gentle waves", "moon reflection", "flowing river", "rain drops"],
    avoid: ["dry land", "bright fire", "strong sun"],
  },
};

// 스타일별 프롬프트 수식어
const STYLE_MODIFIERS: Record<string, {
  prefix: string;
  suffix: string;
  negative: string;
}> = {
  pixel: {
    prefix: "16-bit pixel art retro RPG style, pixelated, sprite-like,",
    suffix: "retro game aesthetic, 16-bit color palette, nostalgic pixel art, SNES era graphics",
    negative: "photorealistic, 3D render, blurry, watercolor",
  },
  illustration: {
    prefix: "whimsical fairy tale storybook illustration, hand-drawn style,",
    suffix: "children's book art, soft lines, magical atmosphere, Studio Ghibli inspired",
    negative: "photorealistic, pixel art, 3D render, dark",
  },
  watercolor: {
    prefix: "beautiful watercolor painting, soft brushstrokes,",
    suffix: "watercolor texture, flowing colors, artistic, painterly aesthetic, paper texture",
    negative: "photorealistic, pixel art, 3D render, sharp edges",
  },
  auto: {
    prefix: "stunning digital art, highly detailed,",
    suffix: "artstation trending, award-winning digital artwork, vibrant colors",
    negative: "blurry, low quality, ugly, distorted",
  },
};

// 태양/달 처리: 태양=화기운, 달=화기운
// → 화가 부족하면 태양(낮) + 달(밤) 적극 활용
// → 화가 과하면 태양/달 최소화

async function buildWallpaperPrompts(
  lacking: string[],
  dominant: string[],
  style: string
): Promise<Array<{ prompt: string; theme: string; themeKo: string }>> {
  // DB에서 커스텀 스타일 프롬프트 로드 (없으면 STYLE_MODIFIERS 기본값 사용)
  const styleKey = style in STYLE_MODIFIERS ? style : "auto";
  const defaultMod = STYLE_MODIFIERS[styleKey];

  // 스타일별 DB 키 매핑
  const promptKeyMap: Record<string, "wallpaper_style_watercolor" | "wallpaper_style_pixel" | "wallpaper_style_illustration" | "wallpaper_style_auto"> = {
    watercolor: "wallpaper_style_watercolor",
    pixel: "wallpaper_style_pixel",
    illustration: "wallpaper_style_illustration",
    auto: "wallpaper_style_auto",
  };
  const dbKey = promptKeyMap[styleKey] ?? "wallpaper_style_auto";
  const [customStylePrompt, qualitySuffix] = await Promise.all([
    getPrompt(dbKey),
    getPrompt("wallpaper_quality_suffix"),
  ]);

  // 커스텀 프롬프트가 있으면 prefix로, 없으면 기본 prefix+suffix 사용
  const stylePrefix = customStylePrompt || defaultMod.prefix;
  const styleSuffix = qualitySuffix || defaultMod.suffix;

  // 가장 부족한 오행 2개
  const top2lacking = lacking.slice(0, 2);
  if (top2lacking.length === 0) top2lacking.push("수", "목"); // fallback

  const fireIsLacking = top2lacking.includes("화") || lacking.includes("화");
  const fireIsExcessive = dominant.includes("화");

  // 3장: 낮(DAY) / 밤(NIGHT) / 추상/중성
  const prompts: Array<{ prompt: string; theme: string; themeKo: string }> = [];

  // --- 낮 버전 (DAY) ---
  const dayEl = top2lacking[0] || "화";
  const dayVis = ELEMENT_VISUALS[dayEl];
  const dayScene = dayVis?.scenes[0] || "beautiful landscape";
  const dayColors = dayVis?.colors.slice(0, 2).join(" and ") || "vibrant colors";

  // 화가 부족하면 태양을 강조, 화가 과하면 구름이나 안개로 부드럽게
  const sunElement = fireIsLacking
    ? "with a radiant golden sun in the sky, warm sunlight, daytime"
    : fireIsExcessive
    ? "with soft diffused daylight, golden hour, no direct sun"
    : "with gentle warm sunlight, daytime atmosphere";

  prompts.push({
    theme: "day",
    themeKo: "낮 버전",
    prompt: `${stylePrefix}, ${dayScene}, ${dayColors}, ${dayVis?.symbols[0] || ""}, ${sunElement}, ${styleSuffix}, high quality, ultra detailed`,
  });

  // --- 밤 버전 (NIGHT) ---
  const nightEl = top2lacking[1] || top2lacking[0] || "수";
  const nightVis = ELEMENT_VISUALS[nightEl];
  const nightScene = nightVis?.scenes[1] || "mystical night landscape";
  const nightColors = nightVis?.colors.slice(0, 2).join(" and ") || "deep night colors";

  // 화가 부족하면 달을 강조 (달=화기운), 화가 과하면 달 최소화, 별 강조
  const moonElement = fireIsLacking
    ? "with a large glowing full moon, moonlight reflection on water, night"
    : fireIsExcessive
    ? "with a crescent moon barely visible, starry night sky, no moonlight"
    : "with a beautiful moon, twinkling stars, night atmosphere";

  prompts.push({
    theme: "night",
    themeKo: "밤 버전",
    prompt: `${stylePrefix}, ${nightScene}, ${nightColors}, ${nightVis?.symbols[1] || ""}, ${moonElement}, mysterious night atmosphere, deep dark background, ${styleSuffix}, high quality, ultra detailed`,
  });

  // --- 추상/조화 버전 (ABSTRACT) ---
  const el1 = ELEMENT_VISUALS[top2lacking[0]];
  const el2 = ELEMENT_VISUALS[top2lacking[1] || top2lacking[0]];
  const abstractScene = `harmonious blend of ${el1?.scenes[2] || "ethereal landscape"} and ${el2?.scenes[3] || "mystical scenery"}`;
  const abstractColors = [
    ...(el1?.colors.slice(0, 1) || []),
    ...(el2?.colors.slice(0, 1) || []),
    "gradient transitioning between the two",
  ].join(", ");

  prompts.push({
    theme: "abstract",
    themeKo: "조화 버전",
    prompt: `${stylePrefix}, ${abstractScene}, ${abstractColors}, ${el1?.symbols[2] || ""} and ${el2?.symbols[3] || ""}, cosmic energy flow, yin yang balance, spiritual harmony, ${styleSuffix}, high quality, ultra detailed`,
  });

  return prompts;
}

export async function POST(req: NextRequest) {
  try {
    const { sajuResult, sajuForm } = await req.json();

    if (!sajuResult) {
      return NextResponse.json({ error: "사주 데이터가 없습니다." }, { status: 400 });
    }

    const { lacking, dominant } = sajuResult;
    const style = sajuForm?.style || "auto";
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API 키가 설정되지 않았습니다." }, { status: 500 });
    }

    const promptsData = await buildWallpaperPrompts(lacking || [], dominant || [], style);

    // DALL-E 3로 3장 순차 생성
    const results: Array<{
      url: string;
      theme: string;
      themeKo: string;
      prompt: string;
    }> = [];

    for (const pd of promptsData) {
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: pd.prompt,
          n: 1,
          size: "1024x1792", // 9:16 portrait (가장 근접)
          quality: "standard",
          response_format: "b64_json", // URL 대신 base64로 받아 만료 걱정 없음
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || `DALL-E 생성 실패 (${pd.themeKo})`);
      }

      const data = await response.json();
      const b64 = data.data?.[0]?.b64_json;
      if (!b64) throw new Error(`이미지 데이터 없음 (${pd.themeKo})`);

      results.push({
        url: `data:image/png;base64,${b64}`,
        theme: pd.theme,
        themeKo: pd.themeKo,
        prompt: pd.prompt,
      });
    }

    return NextResponse.json({
      success: true,
      wallpapers: results,
      lackinElements: lacking,
      style,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "배경화면 생성 실패";
    console.error("Wallpaper generation error:", e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

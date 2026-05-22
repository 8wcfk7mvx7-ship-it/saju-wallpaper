// lib/claude.ts
import Anthropic from "@anthropic-ai/sdk";
import { WallpaperTheme, WallpaperStyle } from "./saju";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type WallpaperSize = "mobile" | "desktop";

export async function generateWallpaperSVG(
  theme: WallpaperTheme,
  size: WallpaperSize,
  style: WallpaperStyle,
  sajuDescription: string
): Promise<string> {
  const dimensions =
    size === "mobile"
      ? { width: 1080, height: 2340 }
      : { width: 2560, height: 1440 };

  const styleGuide: Record<string, string> = {
    watercolor: "수채화 느낌으로 번지는 듯한 부드러운 색상, 물감이 퍼지는 효과, 흰 여백, 투명한 레이어",
    pixel: "픽셀아트 스타일, 격자형 패턴, 선명한 경계선, 레트로 게임 느낌, 8비트 감성",
    illustration: "일러스트 스타일, 깔끔한 선, 플랫 디자인, 현대적이고 세련된 느낌",
    game: "게임 UI 스타일, 화려한 빛 효과, 판타지 RPG 느낌, 역동적인 구도",
    cartoon: "카툰 스타일, 굵은 아웃라인, 밝고 채도 높은 색상, 귀엽고 친근한 분위기",
    auto: "오행 에너지에 최적화된 자유로운 스타일, 자연스럽고 조화로운 구성",
  };

  const prompt = `당신은 SVG 아트 전문가입니다. 사주 오행에 맞는 배경화면 SVG를 생성해주세요.

## 사주 정보
${sajuDescription}

## 디자인 테마
- 무드: ${theme.mood}
- 설명: ${theme.description}
- 주 색상: ${theme.primaryColors.join(", ")}
- 포인트 색상: ${theme.accentColors.join(", ")}
- 패턴: ${theme.pattern}

## 스타일
${styleGuide[style]}

## 기술 사양
- viewBox: "0 0 ${dimensions.width} ${dimensions.height}"
- 그라디언트 배경 필수
- <defs>에 재사용 요소 정의
- 레이어: 배경 → 중간 패턴 → 전경 요소
- opacity 변화로 깊이감 표현

순수 SVG 코드만 반환하세요. <svg> 태그로 시작해서 </svg>로 끝내세요.`;

  const message = await client.messages.create({
    model: "claude-opus-4-5",
    max_tokens: 4000,
    messages: [{ role: "user", content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("SVG 생성 실패");

  let svg = content.text.trim();
  svg = svg.replace(/^```svg\n?/, "").replace(/^```\n?/, "").replace(/\n?```$/, "").trim();

  if (!svg.startsWith("<svg")) throw new Error("유효하지 않은 SVG");

  return svg;
}

export async function generateBothWallpapers(
  theme: WallpaperTheme,
  style: WallpaperStyle,
  sajuDescription: string
): Promise<{ mobile: string; desktop: string }> {
  const [mobile, desktop] = await Promise.all([
    generateWallpaperSVG(theme, "mobile", style, sajuDescription),
    generateWallpaperSVG(theme, "desktop", style, sajuDescription),
  ]);
  return { mobile, desktop };
}
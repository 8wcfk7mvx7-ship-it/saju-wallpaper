/**
 * lib/prompts.ts
 * ─────────────────────────────────────────────
 * 기본 프롬프트 정의 + Supabase 커스텀 프롬프트 로더
 * 어드민 페이지에서 수정한 프롬프트는 Supabase에 저장되며
 * 이 파일의 DEFAULT 값을 오버라이드합니다.
 */
import { createClient } from "@supabase/supabase-js";

// ─────────────────────────────────────────────
// 프롬프트 키 정의
// ─────────────────────────────────────────────
export type PromptKey =
  // 배경화면 스타일
  | "wallpaper_style_watercolor"
  | "wallpaper_style_oilpainting"
  | "wallpaper_style_pixel"
  | "wallpaper_style_illustration"
  | "wallpaper_style_auto"
  // 배경화면 공통
  | "wallpaper_quality_suffix"    // 모든 프롬프트 끝에 붙는 품질/크기 수식어
  | "wallpaper_negative"          // DALL-E negative prompt (참고용 — 실제 적용은 스타일별)
  // 보고서 (Claude)
  | "report_system_prefix"        // 보고서 생성 프롬프트 앞부분 (역할 설정)
  | "report_system_suffix"        // 보고서 생성 프롬프트 뒷부분 (추가 지시)
  | "report_tone"                 // 문체/톤 지시 ("따뜻하고 전문적인 한국어로...")
  | "report_special_message";     // 마지막 특별 메시지 추가 지시

export interface PromptDefinition {
  key: PromptKey;
  label: string;          // 어드민 UI 표시명
  category: "wallpaper" | "report";
  description: string;    // 이 프롬프트가 무엇인지 설명
  defaultValue: string;
}

// ─────────────────────────────────────────────
// 기본값 (DB에 없으면 이걸 사용)
// ─────────────────────────────────────────────
export const DEFAULT_PROMPTS: PromptDefinition[] = [
  // ── 배경화면 스타일 ───────────────────────────
  {
    key: "wallpaper_style_watercolor",
    label: "수채화 스타일",
    category: "wallpaper",
    description: "수채화(watercolor) 스타일 선택 시 프롬프트 수식어",
    defaultValue:
      "beautiful watercolor painting style, soft translucent brushstrokes, bleeding ink effect, " +
      "delicate washes of color layering over each other, white paper texture showing through, " +
      "loose gestural marks, luminous and airy atmosphere, wet-on-wet technique",
  },
  {
    key: "wallpaper_style_oilpainting",
    label: "유화 스타일",
    category: "wallpaper",
    description: "유화(oil painting) 스타일 — 수채화 선택 시 같이 적용 가능",
    defaultValue:
      "masterful oil painting style, rich impasto texture, visible bold brushstrokes, " +
      "deep saturated colors with dramatic contrast, chiaroscuro lighting, " +
      "classical painterly technique, canvas texture, museum-quality fine art",
  },
  {
    key: "wallpaper_style_pixel",
    label: "픽셀아트 스타일",
    category: "wallpaper",
    description: "픽셀아트 선택 시 프롬프트 수식어",
    defaultValue:
      "16-bit pixel art retro RPG style, crisp pixelated edges, limited color palette, " +
      "sprite-like aesthetic, SNES Super Nintendo era graphics, nostalgic retro game visuals, " +
      "dithering effect, clean pixel grid",
  },
  {
    key: "wallpaper_style_illustration",
    label: "동화 일러스트 스타일",
    category: "wallpaper",
    description: "일러스트 선택 시 프롬프트 수식어",
    defaultValue:
      "whimsical fairy tale storybook illustration, hand-drawn style with clean lines, " +
      "soft pastel colors, magical enchanted atmosphere, Studio Ghibli inspired, " +
      "charming character design, detailed foliage and scenery",
  },
  {
    key: "wallpaper_style_auto",
    label: "AI 자동추천 스타일",
    category: "wallpaper",
    description: "AI 자동 선택 시 프롬프트 수식어",
    defaultValue:
      "stunning digital art, highly detailed painterly style, " +
      "artstation trending, award-winning composition, vibrant harmonious colors, " +
      "cinematic atmosphere, professional concept art",
  },
  {
    key: "wallpaper_quality_suffix",
    label: "공통 품질 수식어",
    category: "wallpaper",
    description: "모든 배경화면 프롬프트 끝에 자동으로 추가되는 수식어 (해상도, 구도 등)",
    defaultValue:
      "smartphone wallpaper portrait orientation 9:19 aspect ratio, " +
      "ultra high resolution, sharp focus, professionally composed, " +
      "suitable as phone lock screen and home screen",
  },
  {
    key: "wallpaper_negative",
    label: "제외 키워드 (참고용)",
    category: "wallpaper",
    description: "생성 시 피해야 할 요소 목록 (DALL-E는 negative prompt 미지원, 프롬프트에 'avoid ...' 형식으로 활용)",
    defaultValue:
      "text, watermark, logo, signature, ugly, distorted, blurry, low quality, " +
      "nsfw, violence, horror, human faces, people",
  },

  // ── 보고서 (Claude) ───────────────────────────
  {
    key: "report_system_prefix",
    label: "보고서 시스템 프롬프트 (앞)",
    category: "report",
    description: "Claude에게 역할을 부여하는 첫 줄 프롬프트",
    defaultValue:
      "당신은 30년 경력의 사주명리학 전문가이자 심리상담가입니다. " +
      "전통 사주 이론에 근거하면서도 현대인의 삶에 실질적으로 도움이 되는 통찰을 제공합니다.",
  },
  {
    key: "report_system_suffix",
    label: "보고서 시스템 프롬프트 (뒤)",
    category: "report",
    description: "분석 결과 작성 시 지켜야 할 추가 지시사항",
    defaultValue:
      "분석 시 주의사항:\n" +
      "- 과장된 길흉화복 예언 금지\n" +
      "- 불안을 조장하는 표현 금지\n" +
      "- 실용적이고 구체적인 조언 위주\n" +
      "- 이름을 자연스럽게 언급하여 개인화\n" +
      "- 긍정적이고 성장 지향적인 시각 유지",
  },
  {
    key: "report_tone",
    label: "보고서 문체/톤",
    category: "report",
    description: "보고서 전체 문체 지시 (말투, 어조)",
    defaultValue:
      "따뜻하고 신뢰감 있는 한국어로 작성. 존댓말 사용. " +
      "전문 용어는 괄호 안에 한자로 병기. " +
      "각 섹션 200-300자 분량으로 충분히 상세하게 서술.",
  },
  {
    key: "report_special_message",
    label: "특별 메시지 추가 지시",
    category: "report",
    description: "보고서 마지막 '특별 메시지' 섹션 작성 지침",
    defaultValue:
      "이름을 부르며 시작. 그 사람만의 특별한 잠재력 한 가지를 구체적으로 언급. " +
      "인생에서 가장 중요한 시기와 기회에 대한 따뜻한 격려로 마무리. " +
      "지나치게 감상적이거나 과장되지 않게.",
  },
];

// ─────────────────────────────────────────────
// Supabase에서 커스텀 프롬프트 로드
// ─────────────────────────────────────────────
let cachedPrompts: Record<string, string> | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5분 캐시

export async function getCustomPrompts(): Promise<Record<string, string>> {
  // 캐시 유효 시 재사용
  if (cachedPrompts && Date.now() - cacheTime < CACHE_TTL) {
    return cachedPrompts;
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
    if (!supabaseUrl || !supabaseKey) return {};

    const sb = createClient(supabaseUrl, supabaseKey);
    const { data, error } = await sb
      .from("admin_prompts")
      .select("key, value");

    if (error || !data) return {};

    const map: Record<string, string> = {};
    for (const row of data) {
      map[row.key] = row.value;
    }
    cachedPrompts = map;
    cacheTime = Date.now();
    return map;
  } catch {
    return {};
  }
}

/**
 * 특정 프롬프트 키의 값을 가져옵니다.
 * Supabase 커스텀 값이 있으면 그것을, 없으면 기본값을 반환합니다.
 */
export async function getPrompt(key: PromptKey): Promise<string> {
  const customs = await getCustomPrompts();
  if (customs[key]) return customs[key];
  return DEFAULT_PROMPTS.find(p => p.key === key)?.defaultValue ?? "";
}

/**
 * 캐시를 초기화합니다 (어드민에서 저장 후 즉시 반영 위해 사용)
 */
export function clearPromptsCache() {
  cachedPrompts = null;
  cacheTime = 0;
}

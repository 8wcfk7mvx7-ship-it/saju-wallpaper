// ── 별점 부탁하기 ─────────────────────────────────────────────────────────
// 기분 좋은 순간(장 완주, 며칠째 접속)에만 시스템 별점 창을 띄운다.
// 앱스토어 심사 가이드라인상 시스템 창이 뜨는지 여부는 iOS가 알아서
// 정하므로, 우리는 "너무 자주 조르지 않기"만 지켜주면 된다.

const REVIEW_LOG_KEY = "hunnyeo_review_prompt_v1";
const MAX_PROMPTS = 3;
const MIN_GAP_DAYS = 14;

interface ReviewLog {
  count: number;
  lastAt: number; // epoch ms
}

function loadLog(): ReviewLog {
  try {
    const raw = localStorage.getItem(REVIEW_LOG_KEY);
    if (!raw) return { count: 0, lastAt: 0 };
    return JSON.parse(raw) as ReviewLog;
  } catch {
    return { count: 0, lastAt: 0 };
  }
}

function saveLog(log: ReviewLog) {
  try {
    localStorage.setItem(REVIEW_LOG_KEY, JSON.stringify(log));
  } catch {
    // 저장이 안 돼도 이번 요청만 못 남길 뿐이니 넘어간다.
  }
}

function canAskNow(log: ReviewLog): boolean {
  if (log.count >= MAX_PROMPTS) return false;
  const daysSince = (Date.now() - log.lastAt) / 86_400_000;
  return log.lastAt === 0 || daysSince >= MIN_GAP_DAYS;
}

/**
 * 기분 좋은 순간에 호출한다. 네이티브 앱이 아니거나, 너무 최근에 물었거나,
 * 이미 여러 번 물었으면 조용히 아무 일도 하지 않는다.
 */
export async function maybeRequestReview(): Promise<void> {
  const log = loadLog();
  if (!canAskNow(log)) return;

  try {
    const cap = await import("@capacitor/core");
    if (!cap.Capacitor.isNativePlatform()) return;
    const { InAppReview } = await import("@capacitor-community/in-app-review");
    await InAppReview.requestReview();
    saveLog({ count: log.count + 1, lastAt: Date.now() });
  } catch {
    // 플러그인이 없거나 시스템이 거절해도 앱 흐름에는 영향을 주지 않는다.
  }
}

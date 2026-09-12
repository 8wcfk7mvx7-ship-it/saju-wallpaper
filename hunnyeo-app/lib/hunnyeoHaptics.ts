// ── 진동 피드백 ───────────────────────────────────────────────────────────
// 앱(네이티브)에서는 Capacitor Haptics 로, 그 외에는 아무 일도 하지 않는다.
// 플러그인을 정적으로 import 하면 웹 빌드가 무거워지므로 처음 쓸 때 불러온다.

type ImpactStyle = "Light" | "Medium" | "Heavy";

let haptics: {
  impact: (o: { style: ImpactStyle }) => Promise<void>;
  notification: (o: { type: string }) => Promise<void>;
} | null = null;
let loaded = false;

async function getHaptics() {
  if (loaded) return haptics;
  loaded = true;
  try {
    const cap = await import("@capacitor/core");
    if (!cap.Capacitor.isNativePlatform()) return null;
    const mod = await import("@capacitor/haptics");
    haptics = {
      impact: o => mod.Haptics.impact({ style: o.style as never }),
      notification: o => mod.Haptics.notification({ type: o.type as never }),
    };
  } catch {
    haptics = null;
  }
  return haptics;
}

/** 항목을 체크했을 때처럼 가벼운 확인 */
export function tapFeedback() {
  void getHaptics().then(h => h?.impact({ style: "Light" }).catch(() => {}));
}

/** 등급이 오르는 것처럼 기쁜 순간 */
export function successFeedback() {
  void getHaptics().then(h => h?.notification({ type: "SUCCESS" }).catch(() => {}));
}

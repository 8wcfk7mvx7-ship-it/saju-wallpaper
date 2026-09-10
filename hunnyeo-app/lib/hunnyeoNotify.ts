// ── 하루 한 번 알림 ───────────────────────────────────────────────────────
// 앱(네이티브)에서만 동작한다. 서버 없이 기기가 스스로 띄우는 알림이라
// 인터넷이 없어도 뜨고, 개인정보가 밖으로 나가지 않는다.

const NOTIFY_ID = 1001;

async function getPlugin() {
  try {
    const cap = await import("@capacitor/core");
    if (!cap.Capacitor.isNativePlatform()) return null;
    const { LocalNotifications } = await import("@capacitor/local-notifications");
    return LocalNotifications;
  } catch {
    return null;
  }
}

/** 이 기기가 알림을 띄울 수 있는지 (웹에서는 항상 false) */
export async function notificationsAvailable(): Promise<boolean> {
  return (await getPlugin()) !== null;
}

/** 매일 정해진 시각에 한 번. 권한이 거절되면 false 를 돌려준다. */
export async function enableDailyReminder(hour = 20, minute = 0): Promise<boolean> {
  const plugin = await getPlugin();
  if (!plugin) return false;

  const permission = await plugin.requestPermissions();
  if (permission.display !== "granted") return false;

  await plugin.cancel({ notifications: [{ id: NOTIFY_ID }] });
  await plugin.schedule({
    notifications: [
      {
        id: NOTIFY_ID,
        title: "오늘의 생정이 왔어요",
        body: "오늘은 뭘 해볼까요? 훈녀력을 채워봐요.",
        schedule: { on: { hour, minute }, allowWhileIdle: true },
      },
    ],
  });
  return true;
}

export async function disableDailyReminder(): Promise<void> {
  const plugin = await getPlugin();
  await plugin?.cancel({ notifications: [{ id: NOTIFY_ID }] });
}

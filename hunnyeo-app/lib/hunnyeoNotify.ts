// ── 하루 한 번 알림 ───────────────────────────────────────────────────────
// 앱(네이티브)에서만 동작한다. 서버 없이 기기가 스스로 띄우는 알림이라
// 인터넷이 없어도 뜨고, 개인정보가 밖으로 나가지 않는다.
//
// "오늘의 생정"은 날짜마다 바뀌는 항목이라, 반복 알림 하나로는 매일 다른
// 내용을 보여줄 수 없다 (제목이 예약한 그 순간 것으로 고정돼 버린다).
// 그래서 앞으로 60일치를 각각 그날의 항목 제목을 담아 미리 예약해 둔다.
// (iOS 로컬 알림은 기기당 최대 64개까지 대기시킬 수 있어 여유 있게 60일로 잡았다)

import { getTodayTip, todayKey } from "./hunnyeoPick";

const NOTIFY_ID_BASE = 1001;
const SCHEDULE_DAYS = 60;

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

type NotifyPlugin = NonNullable<Awaited<ReturnType<typeof getPlugin>>>;

function scheduledIds(): { id: number }[] {
  return Array.from({ length: SCHEDULE_DAYS }, (_, i) => ({ id: NOTIFY_ID_BASE + i }));
}

/** 오늘 그 시각이 이미 지났으면, 예약은 내일부터 시작해야 한다. */
function startsTomorrow(hour: number, minute: number): boolean {
  const today = new Date();
  today.setHours(hour, minute, 0, 0);
  return today.getTime() <= Date.now();
}

/** 시작일(오늘 또는 내일)부터 daysFromStart 일 뒤, 정해진 시각. */
function fireDateFor(daysFromStart: number, hour: number, minute: number, startOffset: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + startOffset + daysFromStart);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function cancelAll(plugin: NotifyPlugin): Promise<void> {
  await plugin.cancel({ notifications: scheduledIds() });
}

/** 이 기기가 알림을 띄울 수 있는지 (웹에서는 항상 false) */
export async function notificationsAvailable(): Promise<boolean> {
  return (await getPlugin()) !== null;
}

/**
 * 매일 정해진 시각에, 그날의 "오늘의 생정" 제목을 담아 알림을 보낸다.
 * 이미 켜져 있을 때 다시 불러도 60일치를 새로 채워 넣을 뿐이라 안전하다
 * (앱을 열 때마다 한 번씩 불러 주면 예약이 끊기지 않는다).
 * 권한이 거절되면 false 를 돌려준다.
 */
export async function enableDailyReminder(hour = 8, minute = 0, nickname = ""): Promise<boolean> {
  const plugin = await getPlugin();
  if (!plugin) return false;

  const permission = await plugin.requestPermissions();
  if (permission.display !== "granted") return false;

  await cancelAll(plugin);

  const startOffset = startsTomorrow(hour, minute) ? 1 : 0;
  const greeting = nickname ? `${nickname}님, ` : "";
  const notifications = Array.from({ length: SCHEDULE_DAYS }, (_, i) => {
    const fireDate = fireDateFor(i, hour, minute, startOffset);
    const tip = getTodayTip(todayKey(fireDate));
    return {
      id: NOTIFY_ID_BASE + i,
      title: "오늘의 생정이 왔어요",
      body: `${greeting}오늘의 생정: ${tip.title}`,
      schedule: { at: fireDate, allowWhileIdle: true },
    };
  });

  await plugin.schedule({ notifications });
  return true;
}

export async function disableDailyReminder(): Promise<void> {
  const plugin = await getPlugin();
  if (!plugin) return;
  await cancelAll(plugin);
}

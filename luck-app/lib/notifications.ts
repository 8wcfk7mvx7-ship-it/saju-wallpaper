"use client";
// lib/notifications.ts — 아침 알림("오늘도 행운을 불러보세요") 로컬 알림 스케줄링
// 서버 없이 기기에서 직접 예약하는 로컬 알림이라 별도 푸시 서버가 필요 없다.
// 주의: 브라우저(웹 프리뷰)에서는 실제 기기 알림이 뜨지 않을 수 있음 — 알림 권한 요청과
// 매일 반복 예약은 실제 iOS/Android 네이티브 빌드에서만 확실히 동작을 확인할 수 있다.
import { LocalNotifications } from "@capacitor/local-notifications";

const NOTIF_ID = 1001;
const ENABLED_KEY = "luck_notify_morning";

export function getMorningNotifyEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(ENABLED_KEY) === "1";
}

// 반환값이 실제로 켜졌는지(권한 허용 여부 포함)를 나타낸다 — 호출한 쪽에서 이 값으로 토글 상태를 갱신한다.
export async function setMorningNotifyEnabled(enabled: boolean): Promise<boolean> {
  if (typeof window === "undefined") return false;
  try {
    if (enabled) {
      const perm = await LocalNotifications.requestPermissions();
      if (perm.display !== "granted") return false;
      await LocalNotifications.schedule({
        notifications: [
          {
            id: NOTIF_ID,
            title: "행운의 앱",
            body: "오늘도 행운을 불러보세요",
            schedule: { on: { hour: 6, minute: 0 }, allowWhileIdle: true },
          },
        ],
      });
      localStorage.setItem(ENABLED_KEY, "1");
      return true;
    }
    await LocalNotifications.cancel({ notifications: [{ id: NOTIF_ID }] });
    localStorage.removeItem(ENABLED_KEY);
    return false;
  } catch {
    // 웹 프리뷰 등 로컬 알림 플러그인이 동작하지 않는 환경 — 조용히 실패 처리
    return false;
  }
}

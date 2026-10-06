# 심사 노트 (App Review Information → Notes)

> ⚠️ 2026-10 업데이트: 애플/구글 로그인(선택, 동기화용)과 AdMob 배너 광고가
> 추가됐습니다. 아래 영문 노트를 이 버전 기준으로 다시 썼습니다 — 예전에
> "로그인 없음 / 네트워크 0건"이라고 적었던 문구를 그대로 내면 애플 심사에서
> 거짓 정보 제출로 리젝되거나 계정이 정지될 수 있으니 반드시 아래 새 버전을 쓰세요.

심사자는 한국어를 모를 가능성이 높습니다. 아래 영문을 그대로 붙여 넣으세요.
로그인은 선택사항이므로 **데모 계정은 "필요 없음"으로 두면 됩니다** — 다만 심사자가
로그인을 눌러볼 수도 있으니, 로그인 없이도 전 기능을 쓸 수 있다는 점을 노트에 적어둡니다.

---

## 붙여 넣을 영문 (App Review Notes)

```
ABOUT THIS APP

Hunnyeo-Saengjeong ("훈녀생정") is a nostalgia archive for Koreans born in the
1990s. In the mid-2000s, Korean students shared homemade beauty and lifestyle
tips on blogs and online cafes under the name "훈훈한 여자 생활정보" (roughly:
"lovely girl's life info"). This app collects 387 of those tips across 17
chapters and presents them in the visual style of that era.

The app is a self-contained archive. Users can check off items they have tried,
which accumulates points and unlocks nostalgic rank titles.

NO ACCOUNT REQUIRED
Sign-up and sign-in are optional. All 387 entries and every feature are usable
immediately on launch without creating an account. Signing in with Apple or
Google only adds cross-device sync of the user's own checklist/progress data
(via Supabase) - it unlocks no additional content and is never required.

OFFLINE-FIRST
All 387 entries, fonts and images are bundled in the app binary, so the
content works fully in Airplane Mode. The only network activity is (a) the
optional sign-in/sync described above, and (b) loading the banner ad
described below. No analytics SDK is included.

FREE, ONE OPTIONAL IN-APP PURCHASE, ONE SMALL BANNER AD
The app is completely free to use. It shows one small banner ad (Google
AdMob) at the bottom of the screen; there are no interstitial or rewarded
ads. Users who decline the App Tracking Transparency prompt still see ads
(non-personalized) and lose no functionality. A single optional, non-
consumable in-app purchase ("Remove Ads") permanently hides the banner for
that user - it unlocks no additional content, it is purely cosmetic. A
"Restore Purchases" button is available on the My Info screen.

NATIVE FEATURES
Beyond the archive itself the app provides: full-text search across all 387
entries, favourites, a daily rotating pick, a random draw, a "remaining only"
filter, haptic feedback on completion, an opt-in daily local notification
(scheduled on-device, no server), adjustable text size, a shareable
achievement card rendered on-device and passed to the system share sheet, and
an export/import code so records survive a device change.


ABOUT THE CONTENT (please read)

Two categories of content may look unusual, so here is the context:

1) FOLK REMEDIES AND OLD DIET TRENDS
   Some entries describe diet fads that circulated in Korea in the 2000s
   (e.g. single-food diets). These are presented as a historical record of what
   was popular at the time, NOT as health advice or as something we recommend.

   Safeguards we built in:
   - A mandatory disclaimer popup appears on first launch and must be
     acknowledged before use.
   - The disclaimer states the content is unverified folk knowledge, is not a
     substitute for medical advice, and that users should stop and consult a
     professional if they experience problems.
   - Individual risky entries carry their own inline warning box.
   - We deliberately EXCLUDED any tip involving purging, vomiting, or starvation.
     Such content is not present anywhere in the app.
   - The disclaimer is also permanently accessible on the "My Info" screen.

2) SUPERSTITIONS AND URBAN LEGENDS ("글자스킬" / "애정운" chapters)
   These chapters document Korean schoolyard superstitions from around 2002-2006
   - phrases students wrote in notebooks believing they would bring luck or
   romance. They are presented as folklore with a clear note that their
   effectiveness is not proven.

   These entries are marked as "read-only" items: users can mark them as READ,
   but the app never asks anyone to perform them. One entry about wishing harm
   on another person is included only with an explicit warning that doing so is
   not acceptable.

   Nothing in these chapters is religious content, and no real person or
   organization is referenced.

AGE RATING
We selected 12+ because the superstition chapters include mild ghost-themed
folklore.

Thank you for reviewing. If any of the Korean content needs clarification,
please let us know and we will translate the specific entry.
```

---

## App Review Information 나머지 칸 채우는 법

| 칸 | 입력 |
|---|---|
| 로그인 필요 (Sign-in required) | **체크 해제** — 로그인은 선택사항이고 전 기능을 로그인 없이 쓸 수 있습니다 |
| 연락처 이름/성 | 본인 이름 |
| 전화번호 | 심사자가 연락할 수 있는 번호 |
| 이메일 | 실제로 확인하는 주소 (리젝 통보가 여기로 옵니다) |
| 첨부 파일 | 불필요 |

## 리젝되면 자주 나오는 사유와 대응

| 사유 | 대응 |
|---|---|
| **4.2 Minimum Functionality** — 콘텐츠 목록 앱이라 단순하다고 볼 경우 | 오프라인 동작, 검색, 찜, 오늘의 생정, 자랑 카드(시스템 공유 시트), 로컬 알림, 햅틱, 글자 크기, 기록 내보내기/불러오기, 진행률·등급, 직접 그린 도트 아이콘 30종을 근거로 회신 |
| **1.4.1 Physical Harm** — 다이어트 콘텐츠 | 위 심사 노트의 안전장치 목록을 그대로 회신. 최초 팝업 스크린샷을 첨부하면 효과적 |
| **2.1 App Completeness** — 앱이 비어 보인다 | 심사자가 표지 화면에서 "들어가기 ▶" 를 못 눌렀을 가능성. 진입 방법을 안내 |
| **5.1.1 Privacy Policy** | 개인정보처리방침 URL 이 실제로 열리는지 확인. 접속 안 되면 바로 리젝 |
| **2.3.1 / App Tracking Transparency 안내 문구 누락** | Xcode `Info.plist` 에 `NSUserTrackingUsageDescription` 문구가 들어있는지 확인 (lib/hunnyeoAds.ts 상단 주석 참고) |
| **광고가 "테스트 광고"로 보인다는 지적** | `lib/hunnyeoAds.ts` 의 `isTesting: true` 를 실제 AdMob 콘솔 승인 후 `false` 로 바꾸고 테스트 ID 네 개를 전부 본인 것으로 교체했는지 확인 |
| **3.1.1 In-App Purchase — 구매가 안 되거나 복원이 안 됨** | App Store Connect의 인앱 구입 상품 상태가 "제출 준비 완료"인지 확인 (상품이 "미완료" 상태면 심사 중 구매 자체가 막힘). 제품 ID가 `remove_ads` 로 코드와 정확히 일치하는지도 확인 |
| **3.1.1 Restore Purchases 버튼을 못 찾겠다는 지적** | 내 정보 → 설정 → "광고 제거" 바로 아래 "이전에 구매했어요(복원하기)" 링크 위치를 노트에 적어 안내 |

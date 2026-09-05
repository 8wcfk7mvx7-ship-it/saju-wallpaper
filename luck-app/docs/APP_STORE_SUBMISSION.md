# 앱스토어 / 플레이스토어 등록 가이드 — 행운의 어플

> 사람이 해야 하는 일을 최소화하는 게 목표지만, 정직하게 선을 긋습니다.
> **일부 단계는 이 원격 리눅스 개발 환경에서 제가 직접 클릭·결제·서명할 수 없습니다.**
> (macOS/Xcode가 없고, 사람 명의의 계정 생성·본인인증·카드 결제·2단계 인증을 대신 통과할 수 없어요.)

이 앱(행운의 어플 / kr.ai.luckyapp.app)은 Capacitor로 웹사이트를 그대로 감싸는 구조입니다
(`capacitor.config.ts`의 `server.url`). 웹을 배포하면 앱스토어 재심사 없이도 네이티브 앱 화면이 즉시 갱신됩니다.

## ① 배포 전 필수 작업 (사람이 1회)

1. **웹앱을 실제 도메인에 배포**하세요 (Vercel 추천 — `luck-app/` 폴더를 그대로 새 Vercel 프로젝트로 연결).
   배포 후 `capacitor.config.ts`의 `server.url`을 실제 도메인으로 교체하세요.
2. **Apple Developer Program** 가입 (https://developer.apple.com/programs/, 연 $99 — 신분증·카드 필요)
3. **Google Play Console** 계정 개설 (https://play.google.com/console/, $25 + 신분증)
4. 두 계정의 API 키를 한 번만 발급해서 GitHub Actions Secret으로 등록해두면, 이후 빌드·서명·업로드는
   CI에서 Fastlane으로 자동화할 수 있습니다 (Summer Palace 프로젝트의 `docs/APP_STORE_SUBMISSION.md`와 동일한 방식).

## ② 지금 자동화해 둔 것

- **스크린샷 자동 캡처**: `scripts/capture-store-screenshots.mjs` — 온보딩 화면 + 생년월일 입력 후
  대시보드 화면을 iOS 6.7형(1290×2796)·Android 폰(1080×1920) 해상도로 자동 캡처합니다.
  ```bash
  BASE_URL=https://<실제-배포-도메인> node scripts/capture-store-screenshots.mjs
  ```
- **앱 아이콘**: `public/icon-{192,512,1024}.png` — 클로버 심볼 기반 자체 아이콘을 스크립트로 생성해뒀습니다
  (`scripts/icon-source.html` 수정 후 재생성 가능).
- **개인정보처리방침 / 이용약관**: `app/privacy`, `app/terms` — 앱스토어 등록에 필수인 URL을 이미 준비해뒀습니다.
  배포 후 각각 `https://<도메인>/privacy`, `https://<도메인>/terms`로 등록하면 됩니다.
- **24절기 콘텐츠**: `lib/solarTerms.ts` — 앱 설명 문구에 그대로 활용 가능.

## ③ 이 환경에서 할 수 없는 것 (계정 소유자만 가능)

| 항목 | 이유 |
|---|---|
| iOS 네이티브 빌드(`npx cap add ios` 이후 Xcode 서명/빌드) | macOS + Xcode 필요 — 이 환경은 Linux |
| 앱 서명 인증서 발급 | Apple Developer 로그인(2단계 인증 포함) 필요 |
| 실제 "심사 제출" 클릭 | App Store Connect / Play Console 계정 소유자의 최종 승인 행위 |

→ macOS 빌드는 GitHub Actions의 `macos-latest` 러너로 대체 가능하니, 사람이 macOS를 직접 살 필요는 없습니다.

## ④ 스토어 등록 메타데이터 초안

- **앱 이름**: 행운의 어플
- **부제**: 24절기 개운법 · 용신 맞춤 오늘의 행운 다이어리
- **카테고리**: 라이프스타일(Lifestyle)
- **연령 등급**: 4+/전체이용가
- **키워드**: 행운,오늘의운세,개운법,절기,사주,용신,다이어리,행운기록
- **앱 설명 초안**: "생년월일로 알아보는 나만의 용신 기운, 24절기마다 달라지는 개운법과 액막이법을 하루
  한 번 확인하세요. 오늘의 메모와 행운 점수를 기록하며 나만의 행운 다이어리를 만들어보세요."

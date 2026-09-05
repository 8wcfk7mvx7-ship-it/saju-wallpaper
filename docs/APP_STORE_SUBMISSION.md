# 앱스토어 / 플레이스토어 등록 가이드

> 목표: 사람이 해야 하는 일을 최소화하고 나머지는 최대한 자동화. 다만 이 문서는 정직하게 씁니다 —
> **일부 단계는 이 원격 리눅스 개발 환경에서 제가 직접 클릭·결제·서명할 수 없는 영역입니다.**
> (macOS/Xcode가 없고, 사람 명의의 계정 생성·본인인증·카드 결제·2단계 인증을 대신 통과할 수 없어요.)
> 아래에 "자동화된 것 / 자동화 가능한 것 / 사람이 반드시 해야 하는 것"을 명확히 구분했습니다.

이 앱(Summer Palace / kr.ai.summerpalace.app)은 Capacitor로 라이브 웹사이트(summerpalace.ai.kr)를
그대로 감싸는 구조입니다 (`capacitor.config.ts`의 `server.url`). 즉 웹을 배포하면 앱스토어 재심사 없이도
네이티브 앱 화면이 즉시 갱신됩니다 — 이번 "오늘의 행운" 기능도 이미 그렇게 반영됩니다.

## ① 이미 자동화해 둔 것 (이번 세션)

- **스크린샷 자동 캡처**: `scripts/capture-store-screenshots.mjs` — 헤드리스 브라우저(Playwright)로
  iOS 6.7형(1290×2796)·Android 폰(1080×1920) 해상도의 실제 화면 스크린샷을 자동 생성합니다.
  ```bash
  BASE_URL=https://summerpalace.ai.kr node scripts/capture-store-screenshots.mjs
  ```
  결과물은 `store-assets/screenshots/{iphone-6.7,android-phone}/` 에 저장됩니다.
- **개운법 콘텐츠**: 24절기 데이터(`lib/solarTerms.ts`)를 리서치 기반으로 미리 채워뒀습니다 — 스토어
  등록 시 필요한 "앱 설명" 문구에 그대로 활용할 수 있습니다.
- **개인정보처리방침/이용약관**: `app/privacy`, `app/terms` 에 이미 존재 — 새 기능(메모·행운 기록 저장)이
  추가한 개인정보 항목은 "서비스 이용 기록(오늘의 메모, 행운 점수)"뿐이며, 기존 방침의 "서비스 이용 과정에서
  수집되는 정보" 범주에 포함되는 수준이라 별도 조항 추가가 필수는 아닙니다. 다만 정확한 문구는
  `app/privacy/page.tsx`를 열어 "수집 항목" 목록에 한 줄 추가하는 것을 권장합니다(제가 문구 초안을 만들
  수는 있지만, 실제 법적 검토는 사람이 최종 확인하는 것이 안전합니다).

## ② 지금 자동화할 수 없는 이유 (환경 제약)

| 항목 | 이유 |
|---|---|
| Apple Developer Program 가입 (연 $99) | Apple ID 본인인증 + 신용카드 결제가 필요 — 계정 소유자만 가능 |
| Google Play Console 가입 (1회 $25) | 결제 + 정부 신분증 기반 개발자 인증(2023년부터 필수) 필요 |
| iOS 네이티브 빌드(`npx cap add ios` 이후 Xcode 빌드/서명) | **macOS + Xcode 필요** — 이 환경은 Linux 컨테이너라 iOS 빌드가 원천적으로 불가능 |
| 앱 서명 인증서/프로비저닝 프로파일 발급 | Apple Developer 계정 로그인 세션이 필요 (2단계 인증 포함) |
| 실제 "출시" 버튼 클릭 | App Store Connect / Play Console 심사 제출은 계정 소유자의 최종 승인 행위 |

## ③ 사람이 딱 한 번만 하면 되는 일 (최소화된 체크리스트)

1. **Apple Developer Program** 가입 (https://developer.apple.com/programs/) — 신분증·카드 필요, 약 1일 소요
2. **Google Play Console** 계정 개설 (https://play.google.com/console/) — $25 + 신분증, 며칠 내 승인
3. 두 계정의 **API 키를 한 번만 발급**해서 GitHub Actions Secret으로 등록:
   - Apple: App Store Connect → 사용자 및 액세스 → 키(App Store Connect API) 생성, `.p8` 파일 다운로드
   - Google: Play Console → 설정 → API 액세스 → 서비스 계정 JSON 키 생성
   - 이 두 개만 등록해두면, 이후의 **빌드·서명·업로드·메타데이터 갱신은 CI에서 Fastlane으로 완전 자동화**할 수 있습니다 (아래 ④).
4. macOS 빌드 러너 확보 — GitHub Actions의 `macos-latest` 러너를 그대로 쓰면 되므로 사람이 macOS를 살 필요는 없습니다. (아래 워크플로에 이미 반영)

이후부터는 **웹사이트를 배포하는 것만으로 앱 내용이 갱신**되고(웹뷰 구조 덕분에), 새 버전을 스토어에 새로
제출해야 하는 경우(네이티브 코드·아이콘·권한 변경 등)만 CI 워크플로를 트리거하면 됩니다.

## ④ CI 자동화 스켈레톤 (계정 발급 후 그대로 사용)

`fastlane/` 디렉토리에 iOS/Android용 Fastfile 스켈레톤을 만들어 뒀습니다. 계정과 API 키가 준비되면:

```bash
npx cap add ios       # 최초 1회, 네이티브 프로젝트 생성 (macOS 필요 — CI의 macos-latest에서 실행)
npx cap add android   # 최초 1회, 네이티브 프로젝트 생성 (Linux/macOS 모두 가능)
npx cap sync
```

그 다음 `.github/workflows/release.yml` (스켈레톤 포함)을 채워 넣으면:
- `main` 브랜치에 버전 태그(`v1.0.0` 등)를 푸시 → macOS 러너에서 iOS 빌드·서명·TestFlight 업로드,
  Ubuntu 러너에서 Android 빌드·서명·Play Console 내부 테스트 트랙 업로드까지 **완전 자동**으로 진행됩니다.
- 실제 "심사 제출(submit for review)"은 Fastlane `deliver`/`supply` 옵션으로 자동화할 수도 있지만,
  최초 1~2회는 App Store Connect / Play Console 화면에서 스크린샷·설명 문구를 육안으로 확인하고
  사람이 제출 버튼을 누르는 것을 권장합니다 (거절 사유가 되는 메타데이터 실수를 막기 위함).

## ⑤ 스토어 등록 메타데이터 초안

- **앱 이름**: Summer Palace — 사주 명리 & 오늘의 행운
- **부제(subtitle)**: 24절기 개운법 · 용신 맞춤 오늘의 행운
- **카테고리**: 라이프스타일(Lifestyle)
- **연령 등급**: 4+/전체이용가 (성인 인증이 필요한 일부 콘텐츠는 앱 내 `AdultGate`로 별도 처리되어 있음 — 기존 구조 그대로 유지)
- **키워드(한국어)**: 사주,운세,오늘의운세,행운,개운법,절기,만세력,궁합,용신,타로
- **앱 설명 초안**: "생년월일로 알아보는 나만의 용신 기운, 24절기마다 달라지는 개운법과 액막이법을
  하루 한 번 확인하세요. 오늘의 메모와 행운 점수를 기록하며 나만의 행운 다이어리를 만들어보세요."

# 이펍공장 iOS 앱

앱 화면은 `/epub-app` 경로에 있다. Capacitor가 이 웹 화면을 네이티브 WebView로 감싸서
아이폰·아이패드 앱으로 만든다. `ios/` 폴더에 Xcode 프로젝트가 이미 만들어져 있다.

## 화면 흐름

```
로그인(구글/애플/이메일/게스트)
      ↓
   내 책장  ──설정──▶  설정(계정/보관/앱 정보)
      ↓
    편집기  ──‹ 책장──▶  내 책장
```

| 화면 | 아이폰 | 아이패드 |
| --- | --- | --- |
| 로그인 | 세로 버튼 4개 | 같은 구성, 카드 폭만 넓음 |
| 내 책장 | 표지 2단 그리드 | 3단 그리드, 가운데 정렬(최대 720px) |
| 편집기 | 하단 탭 4개(챕터/편집/미리보기/책 정보) | 챕터 사이드바 + 편집 + 미리보기 3분할 |
| 설정 | 전체 화면 | 전체 화면 |

기기 판별은 화면 폭 700px 기준이다(그 이상이면 아이패드 레이아웃).
아이패드는 가로로 돌리면(1000px 이상) 챕터 사이드바가 자동으로 펼쳐진다.

### 미리보기용 주소

| 주소 | 여는 화면 |
| --- | --- |
| `/epub-app?screen=login` | 로그인 |
| `/epub-app?screen=library` | 내 책장 |
| `/epub-app?screen=settings` | 설정 |
| `/epub-app?device=phone` | 아이폰 레이아웃 강제 |
| `/epub-app?device=tablet` | 아이패드 레이아웃 강제 |

## 앱 설정 파일이 두 개인 이유

- `capacitor.config.ts` — 메인 사이트 앱(Summer Palace, `kr.ai.summerpalace.app`)
- `capacitor.epub.config.ts` — 이펍공장 앱(`kr.ai.summerpalace.epub`), 켜면 바로 `/epub-app`이 열린다

Capacitor CLI는 `capacitor.config.ts`만 읽기 때문에, 이펍공장 앱 작업은 아래 스크립트로 한다.
실행하는 동안만 설정 파일을 바꿔치기하고 끝나면 원래대로 되돌린다.

```
npm run cap:epub -- sync ios     # 웹 변경사항을 앱에 반영
npm run cap:epub -- open ios     # Xcode 열기 (맥에서만)
```

## 맥에서 앱스토어에 올리기

Xcode와 CocoaPods이 필요하다(이 저장소가 만들어진 리눅스 환경에는 둘 다 없어서 여기까지만 준비되어 있다).

```
npm install
sudo gem install cocoapods        # 처음 한 번만
npm run cap:epub -- sync ios      # pod install까지 함께 실행된다
npm run cap:epub -- open ios      # Xcode 실행
```

Xcode에서:

1. App 타겟 → Signing & Capabilities → Team에 애플 개발자 계정 연결
2. Bundle Identifier가 `kr.ai.summerpalace.epub`인지 확인
3. Product → Archive → Distribute App → App Store Connect

`server.url`이 라이브 도메인을 가리키고 있어서, 웹을 배포하면 앱 심사를 다시 받지 않아도
앱 화면이 함께 갱신된다. **단, 앱을 올리기 전에 `/epub-app`이 실제 도메인에 배포되어 있어야 한다.**

## 아이콘과 스플래시

`public/app-icons/`에 원본이 있고, iOS 프로젝트에는 이미 복사되어 있다.

```
npm run app:icons     # 아이콘 PNG 다시 만들기
```

- 아이콘 원본: `epub-app-icon.svg` → `icon-1024.png` (앱스토어 제출용)
- 스플래시 원본: `epub-splash.svg` → `splash-2732.png`

## 화면 샘플 다시 찍기

```
npm run dev -- -p 3100
npm run app:shots
```

## 로그인

`components/epub-app/AppLogin.tsx`에서 처리한다.

- **구글**: 웹과 앱이 서로 다른 방식을 쓴다.
  - 웹: 구글 JS(GIS) 팝업 → `POST /api/auth/google`
  - 앱: 앱 WebView에서는 팝업이 뜨지 않고 구글도 WebView 내 팝업 로그인을 막기 때문에,
    애플과 같은 리다이렉트 방식을 쓴다. `GET /api/auth/google/start` → 구글 →
    `POST /api/auth/google/callback`(form_post) → 쿠키 심고 `/epub-app`으로 복귀.
    client_secret 없이 되도록 `response_type=id_token`을 쓰고, nonce로 위조를 막는다.
  - 두 경로 모두 `lib/googleAuth.ts`의 같은 검증/저장 로직을 쓴다.
- **애플**: 기존 `/api/auth/apple` 리다이렉트 사용
- **이메일**: Supabase `signInWithPassword`
- **게스트**: 계정 없이 진입하고 `epub-app-guest` 플래그를 localStorage에 남긴다(원고는 기기에만 저장)

애플 심사 기준상 소셜 로그인을 넣으면 **Sign in with Apple도 함께 제공해야 한다**(이미 포함되어 있다).

> 구글 클라우드 콘솔에서 승인된 리디렉션 URI에
> `https://<도메인>/api/auth/google/callback`을 추가해야 앱 로그인이 동작한다.

## EPUB 파일 저장

`lib/epub/download.ts`가 상황에 맞는 방법을 고른다.

| 환경 | 방법 |
| --- | --- |
| 앱(iOS/안드로이드) | 문서 폴더에 파일로 쓰고 공유 시트를 띄운다 |
| 모바일 브라우저 | 파일 공유(Web Share) |
| 데스크톱 브라우저 | 일반 다운로드 |

앱 WebView는 `<a download>`가 막혀 있어서 파일 쓰기 방식이 유일한 길이다.
저장 위치를 `Documents`로 잡고 Info.plist에 `UIFileSharingEnabled`를 켜둬서,
저장한 EPUB이 아이폰 "파일" 앱의 이펍공장 폴더에 그대로 보인다.

검증:

```
npm run dev -- -p 3100
npm run app:verify      # EPUB 규격 12개 항목 + 앱 저장 경로 확인
```

## 앱스토어 제출용 스크린샷

애플이 요구하는 픽셀 크기에 맞춰 자동으로 찍는다.

```
npm run dev -- -p 3100
npm run app:store-shots
```

- 아이폰 6.9": 1320 × 2868 (필수)
- 아이패드 13": 2064 × 2752 (아이패드 지원 시 필수)

## 아직 남은 일

- **계정 간 원고 동기화가 없다.** 지금은 로그인을 해도 원고는 그 기기에만 저장되므로,
  로그인 사용자와 게스트 사용자가 실질적으로 같다. 서버 보관을 붙이려면 Supabase 테이블과
  동기화 API가 필요하다(이 저장소가 만들어진 환경에는 Supabase 자격증명이 없어 손대지 않았다).
- **실기기 확인이 필요한 항목**(리눅스 환경에서는 코드 경로까지만 확인했다)
  - 공유 시트가 실제로 뜨는지, "파일" 앱에 이펍공장 폴더가 보이는지
  - 앱 WebView에서 구글 리다이렉트 로그인이 구글에 막히지 않는지.
    만약 `disallowed_useragent`로 막히면 `@capacitor/browser`(SFSafariViewController)로
    바깥 브라우저에서 로그인시키고 딥링크로 돌아오는 방식으로 바꿔야 한다.
- 앱을 올리기 전에 `/epub-app`이 실제 도메인에 배포되어 있어야 한다.

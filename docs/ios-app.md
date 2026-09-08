# 이펍공장 iOS 앱 만들기

앱 화면은 `/epub-app` 경로에 있다. Capacitor가 이 웹 화면을 네이티브 WebView로 감싸서
아이폰·아이패드 앱으로 만든다.

## 화면 구성

| 경로 | 화면 |
| --- | --- |
| `/epub-app` | 로그인(구글/애플/이메일/게스트) → 편집기 |
| `/epub-app?device=phone` | 아이폰 레이아웃 강제(미리보기용) |
| `/epub-app?device=tablet` | 아이패드 레이아웃 강제(미리보기용) |
| `/epub-app?screen=login` | 로그인 화면 강제(미리보기용) |

기기 판별은 화면 폭 700px 기준이다(그 이상이면 아이패드 레이아웃).

- **아이폰**: 한 번에 한 화면 + 하단 탭 바(챕터 / 편집 / 미리보기 / 책 정보)
- **아이패드**: 접었다 펼 수 있는 챕터 사이드바 + 편집 + 미리보기 3분할

## 아이콘

`public/app-icons/`에 있다. 원본은 `epub-app-icon.svg`이고, PNG는 아래 명령으로 다시 만든다.

```
node scripts/render-app-icons.mjs
```

Xcode에는 `icon-1024.png`를 App Store 아이콘으로 넣으면 나머지 크기는 Xcode가 처리한다.

## 맥에서 실제 앱으로 빌드하기

이 저장소를 맥에 내려받은 뒤(Xcode 설치 필요):

```
npm install
npx cap add ios          # ios/ 폴더가 없을 때 한 번만
npx cap sync ios
npx cap open ios         # Xcode가 열린다
```

Xcode에서 Signing & Capabilities에 애플 개발자 계정을 연결하고,
Product → Archive → Distribute App 순서로 App Store에 올린다.

`capacitor.config.ts`의 `server.url`이 라이브 도메인을 가리키고 있어서,
웹을 배포하면 앱 심사를 다시 받지 않아도 앱 화면이 함께 갱신된다.
앱이 이펍공장 화면으로 바로 열리게 하려면 `server.url`을 `https://<도메인>/epub-app`으로 바꾼다.

## 로그인

`components/epub-app/AppLogin.tsx`에서 처리한다.

- 구글: 기존 `/api/auth/google` 사용(구글 버튼을 숨겨두고 우리 디자인 버튼으로 클릭만 전달)
- 애플: 기존 `/api/auth/apple` 리다이렉트 사용
- 이메일: Supabase `signInWithPassword`
- 게스트: 계정 없이 진입하고 `epub-app-guest` 플래그를 localStorage에 남긴다(원고는 기기에만 저장)

애플 심사 기준상 소셜 로그인을 넣으면 **Sign in with Apple도 함께 제공해야 한다**(이미 포함되어 있다).

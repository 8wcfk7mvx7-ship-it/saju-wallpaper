# "광고 제거" 결제(₩990) 연결 가이드

코드는 다 되어 있습니다 (`lib/purchases.ts`, 설정 화면의 "광고 제거" 카드까지). 지금은 버튼을
눌러도 "구매 기능이 아직 준비되지 않았어요"만 뜨는데, 이유는 결제를 대신 처리해주는
RevenueCat이라는 서비스에 아직 우리 앱이 등록되지 않아서입니다. 아래 순서대로 하면 켜집니다.

## RevenueCat을 쓰는 이유
애플/구글 결제를 직접 연결하려면 영수증 검증(진짜 결제했는지 서버에서 확인하는 것)을
직접 구현해야 하는데, 실수하기 아주 쉬운 부분입니다. RevenueCat이 이 부분을 대신해주고,
무료 플랜으로 충분합니다(월 매출 2,500달러까지 무료).

## 1. App Store Connect / Google Play Console에 상품 등록
먼저 "진짜 팔 물건"을 각 스토어에 등록해야 합니다. **둘 다 상품 ID를 정확히 `remove_ads`로
맞춰주세요** (코드가 이 이름을 보고 있음).

- **App Store Connect**: 앱 선택 → 기능(Features) → 앱 내 구입(In-App Purchases) → "+"
  → **비소모성(Non-Consumable)** 선택 → 제품 ID: `remove_ads` → 가격 등급에서 ₩990에
  가장 가까운 등급 선택 → 참고용 화면 이름/설명 입력 후 저장
- **Google Play Console**: 앱 선택 → 수익 창출 → 제품 → 인앱 상품 → "제품 만들기" →
  제품 ID: `remove_ads` → 가격 990원 입력 → 저장 → 활성화

## 2. RevenueCat 가입 및 연결
1. [app.revenuecat.com](https://app.revenuecat.com) 가입 (무료) → 새 프로젝트 생성
2. 프로젝트 안에서 **iOS 앱**과 **Android 앱**을 각각 추가
   - iOS: 번들 ID `kr.ai.luckyapp.app` 입력, App Store Connect와 연동(API 키 필요 — 화면에서
     안내하는 대로 App Store Connect에서 발급)
   - Android: 패키지명 `kr.ai.luckyapp.app` 입력, Google Play 서비스 계정 연동(마찬가지로
     화면 안내를 따라가면 됨)
3. 각 앱 화면에 들어가면 **API 키**가 보입니다 (`appl_...`, `goog_...` 모양) — 이 두 개를
   복사해서 나한테 알려주면 `lib/purchases.ts`의 `REVENUECAT_API_KEY`에 바로 넣어줄게요.

## 3. Entitlement / Offering 설정 (RevenueCat 대시보드 안에서)
1. 왼쪽 메뉴 **Products** → "+" → 위에서 등록한 두 플랫폼의 `remove_ads` 상품을 각각 추가
2. 왼쪽 메뉴 **Entitlements** → "+" → 식별자를 **정확히 `remove_ads`**로 생성 → 방금 만든
   두 플랫폼 상품을 이 Entitlement에 연결(Attach)
3. 왼쪽 메뉴 **Offerings** → 기본으로 있는 "default" 오퍼링 선택 → "+ New Package" →
   **Package type: Lifetime** 선택 → 방금 만든 상품 연결

이게 끝나면 코드가 알아서 가격("₩990" 같은 실제 현지화된 가격)을 가져와서 보여주고,
구매·복원이 전부 동작합니다.

## 확인
API 키를 알려주면 내가 코드에 넣고, 실기기에서 결제 테스트까지 도와줄게요. (iOS는
TestFlight/샌드박스 계정, Android는 라이선스 테스터로 등록해야 돈 안 내고 테스트 가능 —
이 부분도 그때 같이 설정하면 됩니다.)

## 참고 — 설정 전에도 앱은 완전히 정상 작동합니다
"광고 제거" 버튼은 설정 전까지 눌러도 "아직 준비되지 않았어요" 안내만 뜨고 아무 일도
일어나지 않습니다. 배너 광고(테스트 광고)는 평소처럼 계속 보이고요. 이 기능 없이도
스토어 제출에는 전혀 지장이 없으니, 먼저 출시하고 나중에 연결해도 됩니다.

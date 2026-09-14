# fastlane 사용법

## 처음 한 번만
```bash
brew install fastlane
cd hunnyeo-app
npm install
npx cap add ios          # ios/ 폴더 생성
npx cap sync ios
open ios/App/App.xcworkspace   # Xcode 에서 Signing & Capabilities → Team 선택
```

`fastlane/Appfile` 의 `apple_id`, `team_id`, `itc_team_id` 를 본인 값으로 바꾸세요.

## 그 다음부터
```bash
fastlane beta      # TestFlight 로 (내 폰에서 먼저 테스트)
fastlane release   # 심사 제출
```

## 비밀번호를 매번 묻지 않게 하려면
App Store Connect 에서 API 키(.p8)를 만들어 `Appfile` 대신 `app_store_connect_api_key`
를 쓰면 2단계 인증 없이 자동화됩니다. GitHub Actions 로 옮길 때 필요합니다.

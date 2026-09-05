# 행운의 어플

24절기 개운법 · 액막이법 · 사주 용신 맞춤 컬러/행동 · 성별 반영 매력·이성운 팁을 매일 하나씩 알려주고,
오늘의 메모와 행운 점수를 기록하는 독립 iOS/Android 앱입니다.
(`saju-wallpaper`(Summer Palace)와는 별개의 앱이며, 사주 계산 엔진(`lib/saju.ts`)만 공유합니다.)

## 로컬 실행

```bash
npm install
npm run dev       # http://localhost:3000
```

## 특징

- **로그인 없이 바로 사용 가능** — 생년월일·메모·행운 기록은 모두 기기 안(localStorage)에 저장됩니다.
- **용신 맞춤**: 생년월일시를 입력하면 `lib/saju.ts`의 `analyzeSaju`로 용신을 계산해 절기 기운과 비교한
  맞춤 컬러·코멘트를 보여줍니다.
- **24절기 자동 판별**: `lunar-typescript`로 오늘이 어느 절기인지 계산 (`lib/solarTerms.ts`).

## 앱으로 감싸기 (Capacitor)

1. 웹앱을 배포하고 `capacitor.config.ts`의 `server.url`을 실제 도메인으로 바꾸세요.
2. macOS에서:
   ```bash
   npx cap add ios
   npx cap add android
   npx cap sync
   npx cap open ios       # Xcode에서 서명 후 빌드
   npx cap open android   # Android Studio에서 서명 후 빌드
   ```

## 문서

- `docs/MONETIZATION.md` — 수익모델 결론(v1 완전 무료, 추후 라이트 프리미엄)
- `docs/APP_STORE_SUBMISSION.md` — 앱스토어/플레이스토어 등록 가이드 (자동화된 것 / 사람이 해야 하는 것 구분)
- `supabase/schema.sql` — 향후 로그인+멀티기기 동기화를 붙일 때 쓸 DB 설계 (v1은 미사용)

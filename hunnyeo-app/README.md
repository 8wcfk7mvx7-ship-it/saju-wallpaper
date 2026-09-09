# 훈녀생정 — 앱스토어 배포용 단독 앱

90년대생 추억 뷰티 노트. 16개 장 228개 항목.
서버를 쓰지 않는 **완전 오프라인 앱**이라 비행기 모드에서도 전부 열립니다.

```
hunnyeo-app/
├─ app/              화면 (루트=메뉴판, [category]=장별, mypage=내 정보)
├─ components/       도트 아이콘 30종, 떨어지는 장식, 점수바, 안내 팝업
├─ lib/              228개 항목 데이터 + 테마 + 저장 유틸
├─ resources/        앱 아이콘(1024) · 스플래시(2732)
├─ store/            앱스토어 제출 서류 3종
└─ fastlane/         배포 자동화
```

---

## 맥에서 할 일 (순서대로)

### 0. 준비물
- 맥 + Xcode (앱스토어에서 설치)
- [Apple Developer Program](https://developer.apple.com/programs/) 등록 — **연 $99**, 개인은 보통 1~2일

### 1. 프로젝트 받아서 빌드
```bash
cd hunnyeo-app
npm install
npm run build          # out/ 에 정적 파일 생성 (여기까지는 맥 아니어도 됨)
```

### 2. iOS 네이티브 프로젝트 생성
```bash
npx cap add ios        # ios/ 폴더가 새로 만들어집니다
npx cap sync ios       # out/ 내용을 앱 안에 복사
```

### 3. 아이콘·스플래시 자동 생성
```bash
npx @capacitor/assets generate --ios
```
`resources/icon.png` 와 `resources/splash.png` 를 읽어서 필요한 크기를 전부 만들어 줍니다.

### 4. Xcode 에서 서명
```bash
npx cap open ios
```
- `App` 타깃 → **Signing & Capabilities** → Team 에 본인 계정 선택
- Bundle Identifier 가 `kr.ai.hunnyeo.app` 인지 확인
- 실제 아이폰을 연결해 한 번 실행해 보세요 (**비행기 모드로도 테스트**)

### 5. App Store Connect 에 앱 등록
[appstoreconnect.apple.com](https://appstoreconnect.apple.com) → 나의 앱 → **+**
- 이름/부제/설명/키워드 → `store/01-앱스토어-등재문구.md` 그대로 붙여넣기
- 개인정보 설문 → `store/02-개인정보-답안.md` 대로 "데이터를 수집하지 않음"
- 개인정보처리방침 URL → 같은 문서의 전문을 웹에 올리고 주소 입력 (**필수**)
- 심사 노트 → `store/03-심사노트-review-notes.md` 의 영문 붙여넣기

### 6. 스크린샷
아이폰 6.9인치 기준 **1320 × 2868** 이 필요합니다. 아이패드도 지원한다면 13인치 **2064 × 2752**.
시뮬레이터에서 iPhone 16 Pro Max 를 띄우고 `⌘S` 로 찍으면 규격이 맞습니다.
추천 5장: 표지 / 메뉴판 / 글자스킬 / 애정운 / 내 정보

### 7. 업로드 & 제출
```bash
# 수동
Xcode → Product → Archive → Distribute App → App Store Connect

# 또는 자동 (fastlane/README.md 참고)
fastlane beta       # TestFlight 로 먼저
fastlane release    # 심사 제출
```

심사는 보통 **24~48시간**. 리젝되면 `store/03-심사노트-review-notes.md` 아래쪽의
"리젝되면 자주 나오는 사유와 대응" 표를 보세요.

---

## 심사에 유리한 점 (이미 되어 있음)

| 항목 | 상태 |
|---|---|
| 네트워크 호출 | **0건** — 비행기 모드에서 전부 동작 |
| 로그인 / 회원가입 | 없음 — 심사자가 바로 쓸 수 있음 |
| 인앱결제 · 외부결제 | 없음 — 완전 무료 |
| 광고 · 분석 SDK | 없음 |
| 수집하는 개인정보 | 없음 — 기록은 기기에만 |
| 건강 관련 면책 | 최초 실행 시 필수 팝업 + 항목별 경고 |

## 웹 버전과의 관계

이 폴더는 `app/hunnyeo/` 의 코드를 복사해 단독 앱으로 만든 것입니다.
콘텐츠(`lib/hunnyeo/tips-*.ts`)를 고칠 때는 **양쪽 다** 고쳐야 합니다.
나중에 공용 패키지로 묶는 것도 방법입니다.

# 로그인(애플/구글/이메일/게스트) 연결 가이드

코드는 다 되어 있습니다 (`lib/auth.ts`, `components/AuthScreen.tsx`, 네이티브 딥링크 배선까지).
지금 로그인 버튼이 눌려도 아무 일이 안 일어나는 이유는 딱 하나 — **아직 실제 Supabase 프로젝트가
연결되어 있지 않아서**입니다. 아래 순서대로 하면 켜집니다.

## 1. Supabase 프로젝트 만들기
1. [supabase.com](https://supabase.com) 가입 → 새 프로젝트 생성 (무료 플랜으로 충분)
2. 프로젝트 생성되면 **SQL Editor**로 들어가서 `supabase/schema.sql` 파일 내용을 그대로 붙여넣고 실행
   (profiles·memos·logs·calls 테이블이 만들어짐)
3. **Project Settings > API**로 가서 `Project URL`과 `anon public` 키를 복사해둠

## 2. 앱에 Supabase 연결하기
`luck-app/.env.local` 파일을 새로 만들고:
```
NEXT_PUBLIC_SUPABASE_URL=복사한 Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=복사한 anon public 키
```
이 값은 **빌드할 때** 앱 안에 박히는 값이라(정적 내보내기라서), `.env.local`을 만든 뒤
`npm run build`를 다시 돌려야 반영됩니다. (이 파일은 git에 올라가지 않음 — `.gitignore`에 이미 포함)

## 3. Redirect URL 등록 (네이티브 앱에서 로그인 되돌아오기용)
Supabase 대시보드 **Authentication > URL Configuration**에서 Redirect URLs에 추가:
```
kr.ai.luckyapp.app://login-callback
```
(앱이 시스템 브라우저로 로그인시킨 뒤 이 주소로 돌아오면, 앱이 그 딥링크를 받아 로그인을 완료합니다 — 이 부분은 이미 코드로 다 만들어 놓음.)

## 4. 구글 로그인 켜기
1. [Google Cloud Console](https://console.cloud.google.com) → 프로젝트 생성 → **APIs & Services > OAuth consent screen** 설정 (앱 이름, 지원 이메일 등)
2. **Credentials > Create Credentials > OAuth client ID** → 애플리케이션 유형 "웹 애플리케이션"
3. 승인된 리디렉션 URI에 Supabase가 알려주는 콜백 주소 추가 (Supabase 대시보드 Authentication > Providers > Google 화면에 정확한 주소가 나와 있음, 보통 `https://[프로젝트ID].supabase.co/auth/v1/callback`)
4. 발급된 **클라이언트 ID / 클라이언트 보안 비밀**을 Supabase 대시보드 Authentication > Providers > Google에 입력하고 저장

## 5. 애플 로그인 켜기
1. [Apple Developer](https://developer.apple.com/account) → **Certificates, Identifiers & Profiles > Identifiers**에서 이미 만든 App ID(`kr.ai.luckyapp.app`)에 "Sign In with Apple" capability 추가
2. **Identifiers > Services IDs**에서 새 Services ID 생성 (예: `kr.ai.luckyapp.app.signin`) → "Sign In with Apple" 활성화 → 도메인/리턴 URL에 Supabase 콜백 주소 등록
3. **Keys**에서 "Sign In with Apple" 키 생성 → `.p8` 파일 다운로드 (한 번만 가능하니 보관 잘 해둘 것)
4. Team ID, Services ID, Key ID, 다운받은 Key 내용을 Supabase 대시보드 Authentication > Providers > Apple에 입력하고 저장

## 6. 확인
위 설정 다 끝나면:
```
npm run build
npx cap sync
```
하고 Xcode/Android Studio에서 실행 → 설정 탭 > 계정 > 로그인/회원가입 → Google/Apple 버튼을
누르면 시스템 브라우저가 열리고, 로그인하면 자동으로 앱으로 돌아와서 로그인 완료됩니다.

## 참고 — 로그인 없이도 앱은 완전히 정상 작동합니다
"게스트로 시작" 버튼은 이미 동작합니다 (로그인 화면에서 뒤로 돌아갈 뿐, 모든 데이터는 계속
기기 안에만 저장됨). 로그인은 "여러 기기 동기화"를 원하는 사람만 쓰는 선택 기능이라, 위 설정을
전부 미루더라도 앱 출시 자체에는 지장이 없습니다.

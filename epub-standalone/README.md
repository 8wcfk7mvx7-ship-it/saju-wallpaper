# 이펍공장 데스크톱 앱 (맥 / 윈도우)

맥북·윈도우에 설치해서 쓰는 앱이다. **인터넷 없이 완전히 동작하고**, 원고는 그 컴퓨터에만 저장된다.

## 웹앱과의 관계

화면 코드를 복사해 오지 않는다. 웹앱 소스(`../components`, `../lib`)를 **그대로 가져다 빌드**하므로
웹앱을 고치면 데스크톱 앱도 같이 최신이 된다. 데스크톱에만 없는 것들만 껍데기로 바꿔치기한다.

| 바꿔치기 대상 | 이유 | 위치 |
| --- | --- | --- |
| `next/navigation` | 데스크톱엔 Next.js 라우터가 없다 | `src/shims/next-navigation.ts` |
| `@capacitor/filesystem`, `@capacitor/share` | 네이티브 플러그인을 쓰지 않는다 | `src/shims/capacitor.ts` |
| `@/lib/supabaseClient` | 계정 없이 이 기기에만 저장한다 | `src/shims/supabaseClient.ts` |
| `lib/epub/fonts.ts` | 폰트를 파일 안에 base64로 넣어야 `file://`에서 열린다 | `src/shims/fonts.ts` |

폰트 바꿔치기만 별칭이 아니라 작은 Vite 플러그인으로 처리하는데, 웹앱 안에서 `./fonts`처럼
상대 경로로 부르는 곳이 있어 "최종적으로 어떤 파일인지"를 보고 판단해야 하기 때문이다.

> Tailwind에게 `@source "../../components"`로 바깥 폴더도 훑으라고 알려줘야 한다
> (`src/index.css`). 이걸 빠뜨리면 스타일이 통째로 빠진 화면이 나온다.

## 화면

로그인 없이 **책장 → 편집기 → 설정**으로 이어진다. 편집기는 아이패드와 같은 3분할
(챕터 사이드바 + 편집 + 미리보기)을 쓰고, 창이 넓으면 사이드바가 자동으로 펼쳐진다.

## 빌드

```
npm install
npm run build            # dist/index.html 한 장으로 묶는다(폰트까지 포함)
npm start                # 만들고 바로 실행해 보기
```

확인:

```
node scripts/verify-desktop.mjs   # 오프라인 동작 + EPUB 생성까지 11개 항목 검사
```

## 설치 파일 만들기

```
npm run dist:mac    # 맥용 (.zip / .dmg)
npm run dist:win    # 윈도우용 (.exe 설치 파일)
```

- **`.dmg`는 맥에서만 만들어진다.** 리눅스에서는 `hdiutil` 같은 맥 전용 도구가 없어
  `.zip`까지만 만들어진다. 맥에서 `npm run dist:mac`을 돌리면 `.dmg`도 함께 나온다.
- 애플 개발자 인증서로 서명하지 않으면 처음 열 때 "확인되지 않은 개발자" 경고가 뜬다.
  우클릭 → 열기로 한 번 넘기면 그다음부터는 그냥 열린다.
  맥 앱스토어에 올리려면 서명과 공증(notarization)이 필요하다.
- Electron이 브라우저 엔진을 통째로 안고 있어서 결과물이 300~400MB로 큰 편이다.

## 파일이 저장되는 곳

- 원고: 그 컴퓨터의 브라우저 저장소(IndexedDB)에 자동 저장된다.
- 완성한 책: "EPUB 내보내기"를 누르면 일반 다운로드 폴더에 저장된다.

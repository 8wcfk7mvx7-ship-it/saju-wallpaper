# 이펍공장 오프라인 빌드

`/epub` 편집기(components/epub, lib/epub 원본은 앱 루트에 있음)를 인터넷 연결 없이도 쓸 수 있는
**단일 HTML 파일**로 빌드하기 위한 별도의 작은 Vite 프로젝트입니다. 메인 Next.js 앱의 빌드/배포와는
무관하고, 필요할 때 로컬에서 수동으로 빌드해서 사용자에게 파일로 전달하는 용도입니다.

이펍공장의 편집 로직 자체는 100% 클라이언트 사이드(JSZip + IndexedDB)라서 서버 없이도 완전히
동작하고, 그 점을 이용해 브라우저에서 더블클릭으로 여는 오프라인 버전을 만들었습니다.

## 빌드

```
npm install
npm run build
```

`dist/index.html` 하나가 완성된 결과물입니다(JS/CSS/폰트가 base64로 전부 인라인되어 있음).
이 파일만 있으면 인터넷 없이도 더블클릭으로 열어 바로 쓸 수 있습니다.

## 원본과 다른 점

- `next/navigation`의 `useRouter` 의존(닫기 버튼)을 제거했습니다.
- Capacitor 네이티브 저장 경로를 제거하고 항상 일반 브라우저 다운로드를 사용합니다(`src/lib/epub/download.ts`).
- 폰트 파일을 `fetch(publicPath)`가 아니라 Vite 에셋 import(base64 인라인)로 가져옵니다
  (`file://`로 열었을 때 상대 경로 fetch가 막히는 브라우저 제약을 피하기 위함, `src/lib/epub/fonts.ts`).
- `lib/epub`, `components/epub`는 메인 앱에서 복사해온 것이라, 메인 앱을 고치면 이쪽도 수동으로
  다시 복사해줘야 최신 상태가 유지됩니다(자동 동기화 없음).

## 네이티브 macOS 앱(.app) 관련

`electron/main.cjs`, `package.json`의 `dist:mac` 스크립트로 Electron 앱 패키징을 시도했으나,
이 저장소가 처음 만들어진 개발 환경(샌드박스)의 네트워크 정책이 Electron 바이너리 다운로드를 막고
있어 실제로 빌드하지는 못했습니다. 일반 인터넷 환경에서 `npm install && npm run dist:mac`을
실행하면 빌드될 수 있지만, Apple 개발자 서명이 없어 macOS Gatekeeper 경고가 뜹니다.

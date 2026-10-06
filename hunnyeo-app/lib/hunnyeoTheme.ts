// ── 훈녀생정 공용 레트로 테마 ─────────────────────────────────────────────
// 2000년대 초중반 개인 홈페이지 감성: 사탕색 배경, 물방울무늬, 각진 그림자,
// 반짝이는 별, 흐르는 글씨, 무지개 제목.
//
// "Sugar Rush" 팔레트(진한 톤 / 옅은 배경 톤) — 테두리·버튼은 진한 쪽,
// 배경·그림자는 옅은 쪽을 쓴다. 장(챕터)별 고유색은 구분이 목적이라 그대로 둔다.
//   핑크   : #f90072 (진) / #fec3df (연)
//   노랑   : #ffd219 (진) / #ffeea8 (연)
//   민트   : #0ac9c3 (진) / #a0f3ed (연)
//   라벤더 : #333df2 (진) / #bdc0f7 (연)

// app/hunnyeo/layout.tsx 에서 next/font 로 불러온 큐티 서체
// (Gaegu = 손글씨 본문, Jua = 동글동글 제목). 변수를 못 읽는 경우를 대비해 대체 서체를 둔다.
export const RETRO_FONT =
  "var(--font-hn-body), 'Gaegu', 'Comic Sans MS', 'Gulim', '굴림', sans-serif";
export const TITLE_FONT =
  "var(--font-hn-title), 'Jua', 'Comic Sans MS', 'Gulim', '굴림', sans-serif";

// 하얀 물방울 + 핑크·노랑·민트·라벤더 네 가지 연한 사선 줄무늬 ("Sugar Rush" 배경)
export const PAGE_BG = [
  "radial-gradient(circle at 12px 12px, rgba(255,255,255,0.9) 3px, transparent 3.5px)",
  "radial-gradient(circle at 30px 30px, rgba(255,255,255,0.55) 2px, transparent 2.5px)",
  "repeating-linear-gradient(45deg, #ffdcec 0px, #ffdcec 23px, #fffae5 23px, #fffae5 46px, #e2fbfa 46px, #e2fbfa 69px, #ebecfd 69px, #ebecfd 92px)",
].join(",");

export const PAGE_BG_SIZE = "24px 24px, 40px 40px, auto";

export const pageStyle = {
  background: PAGE_BG,
  backgroundSize: PAGE_BG_SIZE,
  fontFamily: RETRO_FONT,
};

// 각 페이지 <style> 태그에 그대로 넣는 공용 CSS
export const RETRO_CSS = `
  @keyframes hnBlink { 0%,45%,100% { opacity: 1 } 50%,95% { opacity: 0.35 } }
  @keyframes hnFloat { 0%,100% { transform: translateY(0) rotate(-6deg); } 50% { transform: translateY(-9px) rotate(6deg); } }
  @keyframes hnTwinkle { 0%,100% { opacity: .25; transform: scale(.7) } 50% { opacity: 1; transform: scale(1.25) } }
  @keyframes hnMarquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }
  @keyframes hnRainbow { 0% { filter: hue-rotate(0deg) } 100% { filter: hue-rotate(360deg) } }
  @keyframes hnPop { 0% { transform: scale(.5) rotate(-12deg); } 60% { transform: scale(1.2) rotate(6deg); } 100% { transform: scale(1) rotate(0); } }
  @keyframes hnWiggle { 0%,100% { transform: rotate(-3deg) } 50% { transform: rotate(3deg) } }

  .hn-blink { animation: hnBlink 1s step-end infinite; }
  .hn-float { animation: hnFloat 3.2s ease-in-out infinite; }
  .hn-twinkle { animation: hnTwinkle 1.6s ease-in-out infinite; }
  .hn-pop { animation: hnPop .4s cubic-bezier(.34,1.56,.64,1); }
  .hn-wiggle { animation: hnWiggle 2.2s ease-in-out infinite; }

  /* 흐르는 글씨 (옛날 marquee 태그 느낌) — 같은 문구 두 벌을 이어 붙여 끊김 없이 흐른다 */
  .hn-marquee { overflow: hidden; }
  .hn-marquee > div { display: flex; width: max-content; animation: hnMarquee 16s linear infinite; }
  .hn-marquee > div > span { white-space: nowrap; padding-right: 2rem; }

  /* 각진 그림자 박스 — 아이콘과 같은 느낌으로 테두리를 짙게, 위쪽에 살짝 윤기 */
  .hn-box {
    background: #fff;
    border: 3px solid #f90072;
    border-radius: 14px;
    box-shadow: 4px 4px 0 #fec3df, inset 0 2px 0 rgba(255,255,255,0.6);
  }

  /* 동글동글 제목 서체 (손글씨 본문과 대비) */
  .hn-cute { font-family: var(--font-hn-title), 'Jua', 'Comic Sans MS', sans-serif; }

  /* 비뚤게 붙인 스티커 라벨 */
  .hn-sticker {
    font-family: var(--font-hn-title), 'Jua', 'Comic Sans MS', sans-serif;
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 900;
    background: #ffeea8;
    color: #f90072;
    border: 2px solid #f90072;
    box-shadow: 1.5px 1.5px 0 rgba(249,0,114,0.4), inset 0 1px 0 rgba(255,255,255,0.7);
    transform: rotate(-8deg);
  }
  .hn-sticker-pink { background: #fec3df; color: #f90072; }

  /* 반짝이 뿌린 카드 */
  .hn-glitter { position: relative; overflow: hidden; }
  .hn-glitter::after {
    content: "";
    position: absolute; inset: 0;
    pointer-events: none;
    background:
      radial-gradient(circle at 18% 22%, rgba(255,255,255,.95) 1.5px, transparent 2px),
      radial-gradient(circle at 78% 34%, rgba(255,255,255,.9) 1.2px, transparent 1.8px),
      radial-gradient(circle at 42% 78%, rgba(255,255,255,.85) 1.4px, transparent 2px),
      radial-gradient(circle at 88% 82%, rgba(255,255,255,.9) 1.2px, transparent 1.8px);
  }

  /* 화면에 드문드문 떨어지는 도트 장식 */
  @keyframes hnFall {
    0%   { transform: translate3d(0, -12vh, 0) rotate(0deg); opacity: 0; }
    8%   { opacity: 1; }
    92%  { opacity: 1; }
    100% { transform: translate3d(var(--hn-drift, 14px), 108vh, 0) rotate(320deg); opacity: 0; }
  }
  .hn-fall-layer {
    position: fixed;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
    z-index: 1;
  }
  .hn-fall-item {
    position: absolute;
    top: 0;
    animation-name: hnFall;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .hn-fall-layer { display: none; }
  }

  /* 하트 물결 구분선 */
  .hn-hearts {
    text-align: center;
    font-size: 12px;
    letter-spacing: 4px;
    color: #ff9ecb;
  }
  .hn-box-y { border-color: #ffd219; box-shadow: 4px 4px 0 #ffeea8, inset 0 2px 0 rgba(255,255,255,0.6); }
  .hn-box-p { border-color: #333df2; box-shadow: 4px 4px 0 #bdc0f7, inset 0 2px 0 rgba(255,255,255,0.6); }

  /* Sugar Rush 제목 */
  .hn-title {
    font-family: var(--font-hn-title), 'Jua', 'Comic Sans MS', sans-serif;
    letter-spacing: 0.02em;
    background: linear-gradient(90deg, #ff89bf, #ffd219, #0ac9c3, #333df2, #9fa3e3);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    filter:
      drop-shadow(1px 1px 0 #fff)
      drop-shadow(-1px -1px 0 #fff)
      drop-shadow(3px 3px 0 rgba(255,137,191,0.5))
      saturate(1.35);
  }

  /* 입체 버튼 — 아이콘과 같은 짙은 테두리 + 위쪽 윤기로 보석 느낌 */
  .hn-btn {
    font-family: var(--font-hn-title), 'Jua', 'Comic Sans MS', sans-serif;
    border: 3px solid #f90072;
    border-radius: 999px;
    background: linear-gradient(#fff, #ffdcec);
    color: #f90072;
    font-weight: 900;
    box-shadow: 3px 3px 0 #fec3df, inset 0 2px 0 rgba(255,255,255,0.8);
    transition: transform .08s ease, box-shadow .08s ease;
  }
  .hn-btn:active { transform: translate(3px,3px); box-shadow: 0 0 0 #fec3df; }
  .hn-btn-on {
    background: linear-gradient(#ff89bf, #f90072);
    color: #fff;
    box-shadow: 3px 3px 0 #804460, inset 0 2px 0 rgba(255,255,255,0.45);
  }

  /* 별 구분선 */
  .hn-divider {
    text-align: center;
    letter-spacing: 3px;
    color: #ffa8d3;
    font-size: 11px;
  }
`;

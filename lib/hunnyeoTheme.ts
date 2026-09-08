// ── 훈녀생정 공용 레트로 테마 ─────────────────────────────────────────────
// 2000년대 초중반 개인 홈페이지 감성: 사탕색 배경, 물방울무늬, 각진 그림자,
// 반짝이는 별, 흐르는 글씨, 무지개 제목.

export const RETRO_FONT =
  "'Comic Sans MS', 'Chalkboard SE', 'HY견고딕', 'Gulim', '굴림', sans-serif";

// 분홍이 주인공인 사탕색 배경: 하얀 물방울 + 분홍 사선 줄무늬 + 연분홍 바탕
export const PAGE_BG = [
  "radial-gradient(circle at 12px 12px, rgba(255,255,255,0.9) 3px, transparent 3.5px)",
  "radial-gradient(circle at 30px 30px, rgba(255,255,255,0.55) 2px, transparent 2.5px)",
  "repeating-linear-gradient(45deg, #ffd9ec 0px, #ffd9ec 26px, #ffe9f4 26px, #ffe9f4 52px, #fff3d9 52px, #fff3d9 66px, #ffe1f0 66px, #ffe1f0 92px)",
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

  /* 각진 그림자 박스 */
  .hn-box {
    background: #fff;
    border: 3px solid #ff3d9a;
    border-radius: 14px;
    box-shadow: 4px 4px 0 #ffc6e2;
  }

  /* 비뚤게 붙인 스티커 라벨 */
  .hn-sticker {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 900;
    background: #fff45e;
    color: #d4348a;
    border: 2px solid #ff3d9a;
    box-shadow: 1.5px 1.5px 0 rgba(255,61,154,0.4);
    transform: rotate(-8deg);
  }
  .hn-sticker-pink { background: #ffd9ec; color: #c9186d; }

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

  /* 하트 물결 구분선 */
  .hn-hearts {
    text-align: center;
    font-size: 12px;
    letter-spacing: 4px;
    color: #ff9ecb;
  }
  .hn-box-y { border-color: #f5b400; box-shadow: 4px 4px 0 #ffe9a8; }
  .hn-box-p { border-color: #9b6bf5; box-shadow: 4px 4px 0 #ddd0ff; }

  /* 무지개 제목 */
  .hn-title {
    background: linear-gradient(90deg, #ff3d9a, #ff8a3d, #f5d400, #4ecb71, #3db6ff, #a259ff);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    filter:
      drop-shadow(1px 1px 0 #fff)
      drop-shadow(-1px -1px 0 #fff)
      drop-shadow(3px 3px 0 rgba(255,61,154,0.5))
      saturate(1.35);
  }

  /* 입체 버튼 */
  .hn-btn {
    border: 3px solid #ff3d9a;
    border-radius: 999px;
    background: linear-gradient(#fff, #ffe3f2);
    color: #ff2b8d;
    font-weight: 900;
    box-shadow: 3px 3px 0 #ffb3d8;
    transition: transform .08s ease, box-shadow .08s ease;
  }
  .hn-btn:active { transform: translate(3px,3px); box-shadow: 0 0 0 #ffb3d8; }
  .hn-btn-on {
    background: linear-gradient(#ff6fb5, #ff2b8d);
    color: #fff;
    box-shadow: 3px 3px 0 #c9186d;
  }

  /* 별 구분선 */
  .hn-divider {
    text-align: center;
    letter-spacing: 3px;
    color: #ffa8d3;
    font-size: 11px;
  }
`;

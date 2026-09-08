// ── 훈녀생정 공용 테마: "문방구 500원짜리 책" ─────────────────────────────
// 90~2000년대 동네 문방구 계산대 옆에 꽂혀 있던 싸구려 소책자 감성.
// 누런 갱지, 검정+빨강 2도 인쇄, 살짝 어긋난 인쇄, 중철(스테이플) 제본,
// 점선 목차, 페이지 번호, 조악한 네모 제목틀.

export const BOOK_FONT =
  "'Batang', '바탕', 'Nanum Myeongjo', 'Apple SD Gothic Neo', serif";
export const BOOK_FONT_GOTHIC =
  "'HY견고딕', 'Malgun Gothic', '맑은 고딕', 'Apple SD Gothic Neo', sans-serif";

// 잉크 색 (순검정이 아니라 바랜 검정 + 조악한 빨강)
export const INK = "#2e2823";
export const INK_RED = "#c62d1f";
export const INK_LIGHT = "#6b6154";
export const PAPER = "#efe4c8";
export const PAPER_DARK = "#e4d7b6";

// 갱지 질감: 미세한 반점 + 결
export const PAGE_BG = [
  "radial-gradient(circle at 20% 30%, rgba(140,120,80,0.07) 0 1px, transparent 1.5px)",
  "radial-gradient(circle at 70% 65%, rgba(140,120,80,0.06) 0 1px, transparent 1.5px)",
  "repeating-linear-gradient(0deg, rgba(120,100,60,0.035) 0 1px, transparent 1px 4px)",
  "linear-gradient(#efe4c8, #ece0c0)",
].join(",");

export const pageStyle = {
  background: PAGE_BG,
  backgroundSize: "17px 17px, 23px 23px, auto, auto",
  fontFamily: BOOK_FONT,
  color: INK,
};

export const RETRO_CSS = `
  @keyframes hnBlink { 0%,45%,100% { opacity: 1 } 50%,95% { opacity: .35 } }
  @keyframes hnStamp { 0% { transform: scale(2.2) rotate(-25deg); opacity: 0 } 60% { transform: scale(.9) rotate(-14deg); opacity: 1 } 100% { transform: scale(1) rotate(-12deg); opacity: 1 } }
  @keyframes hnPrint { from { background-position-x: 0 } to { background-position-x: 40px } }

  .hn-blink { animation: hnBlink 1s step-end infinite; }
  .hn-stamp { animation: hnStamp .45s ease-out; }

  /* 인쇄가 살짝 어긋난 2도 제목 */
  .hn-title {
    font-family: ${BOOK_FONT_GOTHIC};
    color: ${INK};
    text-shadow: 1.5px 1.5px 0 rgba(198,45,31,0.55);
    letter-spacing: -0.02em;
  }
  .hn-title-red {
    font-family: ${BOOK_FONT_GOTHIC};
    color: ${INK_RED};
    text-shadow: 1.5px 1.5px 0 rgba(46,40,35,0.35);
  }

  /* 종이 위 네모 인쇄틀 */
  .hn-frame {
    border: 2px solid ${INK};
    background: rgba(255,252,242,0.5);
  }
  .hn-frame-double {
    border: 3px double ${INK};
    background: rgba(255,252,242,0.5);
  }
  .hn-frame-red { border: 2px solid ${INK_RED}; background: rgba(255,250,245,0.55); }

  /* 목차 점선 리더 */
  .hn-dots {
    flex: 1;
    border-bottom: 1.5px dotted ${INK_LIGHT};
    margin: 0 6px 5px 6px;
    min-width: 12px;
  }

  /* 중철 제본 스테이플 자국 */
  .hn-staple {
    position: fixed;
    left: 0; top: 0; bottom: 0;
    width: 14px;
    background: linear-gradient(90deg, rgba(120,100,60,0.18), rgba(120,100,60,0.02));
    pointer-events: none;
    z-index: 1;
  }
  .hn-staple::before, .hn-staple::after {
    content: "";
    position: absolute; left: 3px;
    width: 7px; height: 20px;
    background: #9a958c;
    border: 1px solid #6f6a62;
    border-radius: 1px;
  }
  .hn-staple::before { top: 22%; }
  .hn-staple::after { bottom: 22%; }

  /* 도장 (스탬프) */
  .hn-seal {
    display: inline-flex; align-items: center; justify-content: center;
    border: 2.5px solid ${INK_RED};
    color: ${INK_RED};
    border-radius: 50%;
    transform: rotate(-12deg);
    font-family: ${BOOK_FONT_GOTHIC};
    letter-spacing: -0.05em;
    opacity: .85;
  }

  /* 버튼: 인쇄된 네모 칸 */
  .hn-btn {
    font-family: ${BOOK_FONT_GOTHIC};
    border: 2px solid ${INK};
    background: #fffdf5;
    color: ${INK};
    font-weight: 700;
    box-shadow: 2px 2px 0 rgba(46,40,35,0.85);
    transition: transform .06s ease, box-shadow .06s ease;
  }
  .hn-btn:active { transform: translate(2px,2px); box-shadow: 0 0 0; }
  .hn-btn-on {
    background: ${INK_RED};
    border-color: ${INK_RED};
    color: #fff8ee;
    box-shadow: 2px 2px 0 rgba(46,40,35,0.6);
  }

  /* 가격 스티커 */
  .hn-price {
    background: #f5d033;
    border: 2px solid ${INK};
    color: ${INK};
    font-family: ${BOOK_FONT_GOTHIC};
    border-radius: 50%;
    transform: rotate(-14deg);
    box-shadow: 1.5px 1.5px 0 rgba(46,40,35,0.4);
  }

  /* 페이지 번호 */
  .hn-pageno {
    text-align: center;
    color: ${INK_LIGHT};
    letter-spacing: .25em;
  }

  /* 손글씨 밑줄 */
  .hn-underline {
    background: linear-gradient(transparent 62%, rgba(198,45,31,0.28) 62% 92%, transparent 92%);
  }
`;

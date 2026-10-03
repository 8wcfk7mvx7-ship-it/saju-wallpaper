"use client";
import PixelIcon, { type PixelIconName } from "@/components/PixelIcon";

// ── 화면에 드문드문 떨어지는 도트 장식 ─────────────────────────────────────
// 옛날 개인 홈페이지에 붙이던 "눈 내리는 스크립트" 감성.
// 값은 고정 배열로 두어 서버·클라이언트 렌더 결과가 어긋나지 않게 한다.
// 애니메이션은 CSS(hnFall)로만 돌리고, 동작 최소화 설정에서는 숨긴다.

interface FallItem {
  name: PixelIconName;
  left: string; // 가로 위치
  size: number; // 아이콘 크기(px)
  duration: number; // 한 번 떨어지는 데 걸리는 시간(초)
  delay: number; // 시작 지연(초)
  drift: number; // 떨어지며 옆으로 밀리는 정도(px)
  opacity: number;
}

const ITEMS: FallItem[] = [
  { name: "star",   left: "6%",  size: 11, duration: 19, delay: 0,    drift: 26,  opacity: 0.7 },
  { name: "flower", left: "18%", size: 14, duration: 26, delay: 6.5,  drift: -18, opacity: 0.6 },
  { name: "heart",  left: "31%", size: 10, duration: 22, delay: 12,   drift: 20,  opacity: 0.55 },
  { name: "star",   left: "44%", size: 9,  duration: 30, delay: 3,    drift: -24, opacity: 0.5 },
  { name: "flower", left: "58%", size: 12, duration: 24, delay: 15.5, drift: 16,  opacity: 0.65 },
  { name: "heart",  left: "70%", size: 13, duration: 28, delay: 8,    drift: -20, opacity: 0.55 },
  { name: "star",   left: "83%", size: 10, duration: 21, delay: 18,   drift: 22,  opacity: 0.6 },
  { name: "flower", left: "93%", size: 11, duration: 33, delay: 11,   drift: -14, opacity: 0.5 },
];

export default function PixelFall() {
  return (
    <div className="hn-fall-layer" aria-hidden="true">
      {ITEMS.map((it, i) => (
        <span
          key={i}
          className="hn-fall-item"
          style={{
            left: it.left,
            opacity: it.opacity,
            animationDuration: `${it.duration}s`,
            animationDelay: `${it.delay}s`,
            ["--hn-drift" as string]: `${it.drift}px`,
          }}
        >
          <PixelIcon name={it.name} size={it.size} />
        </span>
      ))}
    </div>
  );
}

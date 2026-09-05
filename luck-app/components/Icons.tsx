// components/Icons.tsx — 앱 전용 라인 아이콘 세트
// 이모지(🍀📝📊⚙️)는 OS/기기마다 색과 스타일이 제각각이라 나머지 UI와 따로 놀아 보인다.
// 대신 currentColor 기반의 단색 선 아이콘으로 통일해서 탭바 활성/비활성 색이 자연스럽게 반영되고,
// 브랜드 톤(잉크색 선, 레트로 느낌)과 어울리게 만든다.
type IconProps = { size?: number; className?: string; style?: React.CSSProperties };

// 픽셀/도트 느낌에 맞춰 둥근 선 대신 각진 선(square/miter)을 사용
const base = {
  fill: "none",
  strokeWidth: 2,
  strokeLinecap: "square" as const,
  strokeLinejoin: "miter" as const,
};

export function CloverIcon({ size = 20, className, style }: IconProps) {
  // 네 개의 원 + 줄기로 이루어진 단순한 실루엣 — 작은 크기에서도 클로버로 또렷하게 읽힌다
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} style={style}>
      <circle cx="9" cy="9" r="4.6" fill="currentColor" />
      <circle cx="15" cy="9" r="4.6" fill="currentColor" />
      <circle cx="9" cy="15" r="4.6" fill="currentColor" />
      <circle cx="15" cy="15" r="4.6" fill="currentColor" />
      <rect x="11" y="14" width="2" height="7" fill="currentColor" />
    </svg>
  );
}

export function MemoIcon({ size = 20, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke="currentColor" {...base} className={className} style={style}>
      <rect x="5" y="4" width="14" height="16" rx="1.5" />
      <path d="M8.5 9h7M8.5 12.5h7M8.5 16h4" />
    </svg>
  );
}

export function ChartIcon({ size = 20, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke="currentColor" {...base} className={className} style={style}>
      <path d="M4 20V10M11 20V4M18 20v-7" />
      <path d="M3 20h18" />
    </svg>
  );
}

export function GearIcon({ size = 20, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke="currentColor" {...base} className={className} style={style}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v2.2M12 18.8V21M21 12h-2.2M5.2 12H3M18 6l-1.5 1.5M7.5 16.5 6 18M18 18l-1.5-1.5M7.5 7.5 6 6" />
    </svg>
  );
}

export function SparkleIcon({ size = 20, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke="currentColor" {...base} className={className} style={style}>
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
      <path d="M12 8a4 4 0 0 0 4 4 4 4 0 0 0-4 4 4 4 0 0 0-4-4 4 4 0 0 0 4-4Z" />
    </svg>
  );
}

export function PaletteIcon({ size = 20, className, style }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" stroke="currentColor" {...base} className={className} style={style}>
      <path d="M12 3a9 5.5 0 1 0 0 11c1.2 0 2-.9 2-2s-.5-1.4-.5-2 .5-1 1.5-1h1a4 4 0 0 0 4-4c0-3-3.6-5.5-8-5.5Z" />
      <circle cx="8.2" cy="9" r=".9" fill="currentColor" stroke="none" />
      <circle cx="12" cy="7.2" r=".9" fill="currentColor" stroke="none" />
      <circle cx="15.8" cy="9" r=".9" fill="currentColor" stroke="none" />
    </svg>
  );
}

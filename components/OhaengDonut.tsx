type ElementScore = { 목: number; 화: number; 토: number; 금: number; 수: number };

const EL_COLORS: Record<string, string> = { 목: "#22c55e", 화: "#ef4444", 토: "#f59e0b", 금: "#e2e8f0", 수: "#94a3b8" };
const ELS = ["목", "화", "토", "금", "수"];

export default function OhaengDonut({ scores }: { scores: ElementScore }) {
  const total = Object.values(scores).reduce((a, b) => a + b, 0);
  let cumAngle = -90;
  const R = 60, cx = 80, cy = 80, strokeW = 22;
  const segments = ELS.map(el => {
    const pct = total > 0 ? scores[el as keyof ElementScore] / total : 0;
    const angle = pct * 360;
    const startAngle = cumAngle;
    cumAngle += angle;
    return { el, pct, startAngle, angle };
  });
  function arcPath(startDeg: number, angleDeg: number) {
    if (angleDeg >= 359.9) angleDeg = 359.9;
    const start = (startDeg * Math.PI) / 180;
    const end = ((startDeg + angleDeg) * Math.PI) / 180;
    const x1 = cx + R * Math.cos(start), y1 = cy + R * Math.sin(start);
    const x2 = cx + R * Math.cos(end), y2 = cy + R * Math.sin(end);
    const large = angleDeg > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${R} ${R} 0 ${large} 1 ${x2} ${y2}`;
  }
  return (
    <div className="flex flex-col items-center">
      <svg width="160" height="160" viewBox="0 0 160 160">
        {segments.filter(s => s.pct > 0.01).map(s => (
          <path key={s.el} d={arcPath(s.startAngle, s.angle)}
            fill="none" stroke={EL_COLORS[s.el]} strokeWidth={strokeW}
            strokeLinecap="butt" opacity={0.85} />
        ))}
        <circle cx={cx} cy={cy} r={R - strokeW / 2 - 2} fill="#0a0a18" />
        <text x={cx} y={cy - 6} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">오행</text>
        <text x={cx} y={cy + 8} textAnchor="middle" fill="rgba(255,255,255,0.5)" fontSize="9">분포</text>
      </svg>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
        {segments.map(s => (
          <span key={s.el} className="text-[10px] font-bold flex items-center gap-0.5">
            <span style={{ color: EL_COLORS[s.el] }}>●</span>
            <span style={{ color: EL_COLORS[s.el] }}>{s.el}</span>
            <span style={{ color: "rgba(255,255,255,0.5)" }}>{Math.round(s.pct * 100)}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

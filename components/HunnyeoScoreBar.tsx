"use client";
import { getLevelInfo } from "@/lib/hunnyeoData";

export default function HunnyeoScoreBar({ points, compact = false }: { points: number; compact?: boolean }) {
  const info = getLevelInfo(points);

  return (
    <div
      className="rounded-2xl px-4 py-3"
      style={{ background: "#fff", border: "1.5px solid #ffd3e6", boxShadow: "0 4px 14px -8px rgba(255,111,165,0.4)" }}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{info.level.emoji}</span>
          <span className="text-sm font-black" style={{ color: "#ff5c9a" }}>{info.level.name}</span>
        </div>
        <span className="text-xs font-bold" style={{ color: "#a855f7" }}>
          나의 훈녀력 {points}pt
        </span>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden" style={{ background: "#ffe4f1" }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${info.progress * 100}%`, background: "linear-gradient(90deg, #ff8fb3, #c084fc)" }}
        />
      </div>
      {!compact && (
        <p className="text-[10px] mt-1.5" style={{ color: "#b891c9" }}>
          {info.next ? `다음 레벨 ${info.next.emoji} ${info.next.name}까지 ${info.pointsToNext}pt 남음!` : "훈녀생정 만렙 달성! 완전소중 그 자체 👑"}
        </p>
      )}
    </div>
  );
}

"use client";
import { getLevelInfo } from "@/lib/hunnyeoData";

export default function HunnyeoScoreBar({ points, compact = false }: { points: number; compact?: boolean }) {
  const info = getLevelInfo(points);

  return (
    <div className="hn-box hn-box-y p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-black flex items-center gap-1" style={{ color: "#e0399b" }}>
          <span className="text-lg hn-wiggle inline-block">{info.level.emoji}</span>
          {info.level.name}
        </span>
        <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ background: "#fff0f7", color: "#ff2b8d", border: "2px solid #ffb3d8" }}>
          훈녀력 {points}점
        </span>
      </div>

      {/* 옛날 게임 체력바 느낌 */}
      <div className="h-4 rounded-full overflow-hidden" style={{ background: "#ffeaf5", border: "2px solid #ff9ecb" }}>
        <div
          className="h-full transition-all duration-500"
          style={{
            width: `${Math.max(info.progress * 100, points > 0 ? 6 : 0)}%`,
            background: "repeating-linear-gradient(45deg, #ff6fb5 0 6px, #ff9ecb 6px 12px)",
          }}
        />
      </div>

      {!compact && (
        <p className="text-[11px] mt-2 font-bold text-center" style={{ color: "#b06a94" }}>
          {info.next
            ? `다음 등급 ${info.next.emoji} ${info.next.name}까지 ${info.pointsToNext}점 남았어요!`
            : "최고 등급이에요! 완전 소중 그 자체 ♡"}
        </p>
      )}
    </div>
  );
}

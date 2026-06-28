import type { ReactNode } from "react";

export default function ResultSection({
  title, accent = "#a78bfa", badge, children,
}: { title: string; accent?: string; badge?: { label: string; color: string }; children: ReactNode }) {
  return (
    <div className="mb-5 rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.09)" }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 rounded-full" style={{ background: accent }} />
          <h2 className="text-base font-black text-white tracking-wide">{title}</h2>
        </div>
        {badge && (
          <span className="text-[11px] font-bold px-2 py-1 rounded-full" style={{ background: `${badge.color}22`, color: badge.color }}>
            {badge.label}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

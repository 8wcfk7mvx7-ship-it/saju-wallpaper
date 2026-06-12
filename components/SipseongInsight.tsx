"use client";
import { SIPSEONG_DESC, ILGAN_TIME_CHARM } from "@/lib/saju2";
import type { SajuResult } from "@/lib/saju";

export function getTopSipseong(r: SajuResult): string | null {
  const pd = r.pillarsDetail;
  const list = [
    pd.year.sipseongCg, pd.year.sipseongJj,
    pd.month.sipseongCg, pd.month.sipseongJj,
    pd.hour?.sipseongCg, pd.hour?.sipseongJj,
  ].filter(Boolean) as string[];
  const counts: Record<string, number> = {};
  list.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : null;
}

export default function SipseongInsight({ result, title = "사주 속 핵심 기운" }: { result: SajuResult; title?: string }) {
  const top = getTopSipseong(result);
  const desc = top ? SIPSEONG_DESC[top] : null;
  const timeCharm = ILGAN_TIME_CHARM[result.pillarsDetail.day.cg];
  if (!desc && !timeCharm) return null;
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5 space-y-3">
      {desc && (
        <div>
          <p className="text-sm font-bold text-violet-300 mb-1">{title} — {top} ({desc.hanja})</p>
          <p className="text-xs text-gray-500 mb-2">{desc.short}</p>
          <p className="text-sm text-gray-300 leading-relaxed">{desc.detail}</p>
        </div>
      )}
      {timeCharm && (
        <div className={desc ? "border-t border-white/5 pt-3" : ""}>
          <p className="text-sm font-bold text-orange-300 mb-1">매력이 가장 빛나는 시간 — {timeCharm.time}</p>
          <p className="text-sm text-gray-300 leading-relaxed">{timeCharm.desc}</p>
        </div>
      )}
    </div>
  );
}

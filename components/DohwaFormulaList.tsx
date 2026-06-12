"use client";
import { DOHWA_SINSAL_FORMULA } from "@/lib/saju2";
import type { SajuResult } from "@/lib/saju";

const DOHWA_KEYS = ["도화살", "홍염살", "진도화", "나체도화", "곤랑도화", "녹방도화"];

export default function DohwaFormulaList({ result }: { result: SajuResult }) {
  const matched = result.sinsalList.filter(s => DOHWA_KEYS.includes(s.name));
  if (matched.length === 0) return null;
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 mb-5">
      <p className="text-sm font-bold text-pink-300 mb-3">사주에 자리한 도화 기운 — {matched.map(m => m.name).join(" + ")}</p>
      <div className="space-y-4">
        {matched.map(m => {
          const f = DOHWA_SINSAL_FORMULA[m.name];
          if (!f) return null;
          return (
            <div key={m.name} className="border-t border-white/5 pt-3 first:border-t-0 first:pt-0">
              <p className="text-xs font-bold text-white mb-1">{m.name} ({f.hanja})</p>
              <p className="text-[11px] text-gray-500 mb-1.5 leading-relaxed">성립 공식: {f.formula}</p>
              <p className="text-sm text-gray-300 leading-relaxed">{f.effect}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

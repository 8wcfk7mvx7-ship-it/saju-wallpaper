"use client";
import { DOHWA_SINSAL_FORMULA } from "@/lib/saju2";
import { JJ_OHAENG, type SajuResult } from "@/lib/saju";

const DOHWA_KEYS = ["도화살", "홍염살", "진도화", "나체도화", "곤랑도화", "녹방도화"];

function getNote(name: string, pillars: string[], result: SajuResult): string {
  const pd = result.pillarsDetail;
  const jjOf = (label: string) => {
    if (label === "연") return pd.year.jj;
    if (label === "월") return pd.month.jj;
    if (label === "일") return pd.day.jj;
    if (label === "시") return pd.hour?.jj;
    return undefined;
  };
  const yongshinEl = result.yongshin.yongshin;
  const ilsiLabels = pillars.filter(p => p === "일" || p === "시");
  const hasIlSi = ilsiLabels.length > 0;
  const ilsiYongshinMatch = ilsiLabels.some(p => JJ_OHAENG[jjOf(p) || ""] === yongshinEl);
  const hasYeonOnly = pillars.every(p => p === "연");

  if (name === "녹방도화") {
    if (ilsiYongshinMatch) return "일·시지에 자리하고 용신 기운까지 갖춘 최상급 구조 — 진짜 내 매력으로 완성된 도화입니다.";
    if (hasIlSi) return "일·시지에 자리했지만 용신과는 다른 기운이에요. 매력은 있지만 결정적인 한 방은 아직 부족합니다.";
    return "연·월지에 자리해 조상대로부터 내려온 잠재적 기운에 가까워요. 본인의 직접적인 매력으로 드러나려면 한 단계가 더 필요합니다.";
  }

  if (ilsiYongshinMatch) return "일·시지에 자리하고 용신 기운까지 갖췄어요. 이건 진짜 '나의 매력'으로 완성된 구조입니다.";
  if (hasIlSi) return "일·시지에 자리해 본인의 매력으로 드러나는 기운이에요. 다만 용신과는 다른 기운이라 효과가 살짝 약해질 수 있어요.";
  if (hasYeonOnly) return "연지에만 자리한 기운이에요. 할아버지·할머니대부터 내려온 도화 유전자 정도로, 본인의 매력으로 직접 발현되기엔 다소 약합니다.";
  return "월지에 자리한 기운이라 환경·분위기에 묻어나는 정도예요. 본인이 직접 주도하는 매력보다는 주변에서 만들어지는 인상에 가깝습니다.";
}

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
              <p className="text-xs font-bold text-white mb-1">{m.name} ({f.hanja}) — {m.pillars.join("·")}주</p>
              <p className="text-[11px] text-gray-500 mb-1.5 leading-relaxed">성립 공식: {f.formula}</p>
              <p className="text-sm text-gray-300 leading-relaxed mb-1.5">{f.effect}</p>
              <p className="text-xs text-amber-300/90 leading-relaxed">{getNote(m.name, m.pillars, result)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

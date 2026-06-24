"use client";
import {
  getJijiRelations, REL_TYPE_COLOR, sortJijiRelationsByStrength,
  canonicalJijiPairOrder, type JijiRelation, type SajuResult,
} from "@/lib/saju";

// 합충 관계 유형별 한 줄 코칭 — "오늘의 운세" 스타일 다이어그램과 함께 보여줄 설명
const HAPCHUNG_NOTE: Record<JijiRelation["type"], string> = {
  육합: "강한 정서적 유대와 친밀감이 형성되는 조합이에요. 처음부터 편안하게 느껴질 가능성이 높습니다.",
  삼합: "서로의 부족한 기운을 채워주는 궁합이에요. 함께 있을 때 안정감과 시너지가 동시에 생깁니다.",
  반합: "부분적인 합의 기운이 있어요. 완전한 삼합보다는 약하지만 긍정적인 끌림이 작용합니다.",
  충: "강한 자극과 긴장이 동시에 존재해요. 처음엔 확 끌리지만 갈등도 잦을 수 있는 '애증' 구조입니다.",
  형: "서로를 깎아내거나 신경전이 생기기 쉬운 조합이에요. 배려와 거리 조절이 특히 중요합니다.",
  파: "관계가 미묘하게 어긋나거나 흐트러지는 기운이에요. 작은 오해가 쌓이지 않도록 소통이 필요합니다.",
  해: "은근한 방해나 서운함이 쌓일 수 있는 조합이에요. 서로의 영역을 침범하지 않는 게 중요합니다.",
  원진: "이유 없이 미묘하게 거리감이 느껴질 수 있는 궁합이에요(귀문). 시간을 들여 신뢰를 쌓아야 합니다.",
};

const SLOT_LABEL = ["연주", "월주", "일주", "시주"];

interface Slot { slot: number; label: string; jj: string; cg: string; }

function pickSlots(s: SajuResult): Slot[] {
  const p = s.pillarsDetail;
  const raw = [p.year, p.month, p.day, p.hour];
  return raw
    .map((d, slot) => (d ? { slot, label: SLOT_LABEL[slot], jj: d.jj, cg: d.cg } : null))
    .filter((d): d is Slot => !!d);
}

export interface HapchungDiagramProps {
  mySaju: SajuResult;
  targetSaju: SajuResult;
  myName?: string;
  targetName?: string;
  title?: string;
  subtitle?: string;
  accent?: string; // 헤더 텍스트 컬러
  borderColor?: string; // 카드 테두리
  bgColor?: string; // 카드 배경
  myChipColor?: string; // 내 원국 박스 컬러 (rgba)
  targetChipColor?: string; // 그 사람 원국 박스 컬러 (rgba)
}

export default function HapchungDiagram({
  mySaju, targetSaju,
  myName = "나", targetName = "그 사람",
  title = "나와 이 사람의 합충(合沖) 분석",
  subtitle = "두 원국을 나란히 놓고 합·충·형·파·해·원진(귀문)을 화살표로 짚어봐요",
  accent = "#a78bfa",
  borderColor = "rgba(167,139,250,0.3)",
  bgColor = "rgba(167,139,250,0.05)",
  myChipColor = "rgba(251,113,133,0.12)",
  targetChipColor = "rgba(167,139,250,0.12)",
}: HapchungDiagramProps) {
  const myPillars = pickSlots(mySaju);
  const targetPillars = pickSlots(targetSaju);
  const allJj = [...myPillars.map(p => p.jj), ...targetPillars.map(p => p.jj)];
  const myCount = myPillars.length;
  // 같은 자리(연주-연주, 월주-월주, 일주-일주, 시주-시주)끼리만 비교 — 자리를 건너뛰는 크로스 비교는 제외
  const crossRelations = sortJijiRelationsByStrength(
    getJijiRelations(allJj).filter(r => {
      if ((r.a < myCount) === (r.b < myCount)) return false;
      const mine = r.a < myCount ? myPillars[r.a] : myPillars[r.b];
      const theirs = r.a < myCount ? targetPillars[r.b - myCount] : targetPillars[r.a - myCount];
      return mine.slot === theirs.slot;
    })
  );
  const hapCount = crossRelations.filter(r => r.type === "육합" || r.type === "삼합" || r.type === "반합").length;
  const chungCount = crossRelations.filter(r => r.type === "충").length;
  const tensionCount = crossRelations.filter(r => r.type === "형" || r.type === "파" || r.type === "해" || r.type === "원진").length;
  // 화면상 왼쪽부터 시주·일주·월주·연주 순으로 보이도록 자리 순서를 뒤집어 배치
  const xOf = (slot: number) => 12.5 + (3 - slot) * 25;
  const myChipBorder = myChipColor.replace(/0\.\d+\)$/, "0.35)");
  const targetChipBorder = targetChipColor.replace(/0\.\d+\)$/, "0.35)");

  return (
    <div className="mb-4 rounded-2xl overflow-hidden" style={{ border: `1px solid ${borderColor}`, background: bgColor }}>
      <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: borderColor.replace(/0\.\d+\)$/, "0.18)") }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🔗</span>
          <h3 className="text-sm font-black" style={{ color: accent }}>{title}</h3>
        </div>
        <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>{subtitle}</p>
      </div>

      <div className="p-5">
        {/* 원국 다이어그램 */}
        <div className="relative mb-4" style={{ height: 190 }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            {crossRelations.map((r, i) => {
              const mine = myPillars[r.a];
              const theirs = targetPillars[r.b - myCount];
              const x1 = xOf(mine.slot), x2 = xOf(theirs.slot);
              const isStrong = r.type === "육합" || r.type === "삼합" || r.type === "충";
              return (
                <line key={i} x1={x1} y1={22} x2={x2} y2={78}
                  stroke={REL_TYPE_COLOR[r.type]} strokeWidth={isStrong ? 1.4 : 0.9}
                  strokeOpacity={0.85} strokeDasharray={r.type === "충" ? undefined : (r.type === "원진" || r.type === "해" ? "2,2" : undefined)}
                  markerEnd={`url(#arrow-${r.type})`} />
              );
            })}
            <defs>
              {Object.entries(REL_TYPE_COLOR).map(([type, color]) => (
                <marker key={type} id={`arrow-${type}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 Z" fill={color} />
                </marker>
              ))}
            </defs>
          </svg>

          {myPillars.map(p => (
            <div key={`my-${p.slot}`} className="absolute flex flex-col items-center" style={{ left: `${xOf(p.slot)}%`, top: "22%", transform: "translate(-50%, -50%)" }}>
              <div className="rounded-lg px-2.5 py-1.5 text-center" style={{ background: myChipColor, border: `1px solid ${myChipBorder}` }}>
                <p className="text-sm font-black text-white leading-tight">{p.cg}{p.jj}</p>
              </div>
              <p className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>{p.label}</p>
            </div>
          ))}
          {targetPillars.map(p => (
            <div key={`target-${p.slot}`} className="absolute flex flex-col items-center" style={{ left: `${xOf(p.slot)}%`, top: "78%", transform: "translate(-50%, -50%)" }}>
              <p className="text-[9px] mb-1" style={{ color: "rgba(255,255,255,0.3)" }}>{p.label}</p>
              <div className="rounded-lg px-2.5 py-1.5 text-center" style={{ background: targetChipColor, border: `1px solid ${targetChipBorder}` }}>
                <p className="text-sm font-black text-white leading-tight">{p.cg}{p.jj}</p>
              </div>
            </div>
          ))}

          <span className="absolute top-0 left-0 text-[10px] font-bold" style={{ color: "#fb7185" }}>{myName}</span>
          <span className="absolute bottom-0 left-0 text-[10px] font-bold" style={{ color: accent }}>{targetName}</span>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="rounded-xl p-3 text-center" style={{ background: "rgba(52,211,153,0.08)", border: "1px solid rgba(52,211,153,0.2)" }}>
            <p className="text-lg font-black" style={{ color: "#34d399" }}>{hapCount}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>합 (끌림)</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
            <p className="text-lg font-black" style={{ color: "#f87171" }}>{chungCount}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>충 (자극·긴장)</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: "rgba(192,132,252,0.08)", border: "1px solid rgba(192,132,252,0.2)" }}>
            <p className="text-lg font-black" style={{ color: "#c084fc" }}>{tensionCount}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>형·파·해·원진(귀문)</p>
          </div>
        </div>

        {crossRelations.length === 0 && (
          <p className="text-sm leading-relaxed text-center py-2" style={{ color: "rgba(255,255,255,0.5)" }}>
            두 사람의 사주 사이에 강하게 부딫히는 합충 관계는 없어요. 무난하게 서로를 알아갈 수 있는 궁합이에요.
          </p>
        )}

        <div className="space-y-2">
          {crossRelations.map((r, i) => {
            const [c1, c2] = canonicalJijiPairOrder(r.jjA, r.jjB, r.type);
            const myLabel = myPillars[r.a].label;
            const targetLabel = targetPillars[r.b - myCount].label;
            const typeText = r.type === "원진" ? "원진(귀문)" : r.type;
            return (
              <div key={i} className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded" style={{ background: REL_TYPE_COLOR[r.type], color: "#06060e" }}>{typeText}</span>
                  <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
                    {myName}({myLabel}) {c1} ↔ {targetName}({targetLabel}) {c2}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{HAPCHUNG_NOTE[r.type]}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

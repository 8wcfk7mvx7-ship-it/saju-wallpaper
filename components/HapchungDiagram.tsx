"use client";
import {
  getJijiRelations, REL_TYPE_COLOR, sortJijiRelationsByStrength,
  canonicalJijiPairOrder, type JijiRelation, type SajuResult,
} from "@/lib/saju";

const HAPCHUNG_NOTE: Record<JijiRelation["type"], string> = {
  육합: "처음 만났을 때부터 '이 사람과 편하다'는 느낌이 오는 조합이에요. 함께 밥 먹고, 같이 있을수록 자연스럽게 친밀해집니다.",
  삼합: "두 사람이 만나면 부족한 에너지를 서로 채워주는 구조예요. 같이 일하거나 계획을 세울 때 시너지가 뚜렷하게 납니다.",
  반합: "완전한 합보다는 약하지만, 특정 상황에서 서로 맞아떨어지는 느낌을 받는 조합이에요.",
  충: "처음에 확 끌리고 강하게 자극하는 관계예요. 서로 성향이 달라 작은 것도 대립이 될 수 있지만, 그 긴장감이 오히려 케미가 되기도 합니다.",
  형: "사소한 말 한마디에 신경전이 생기기 쉬운 조합이에요. 피곤하거나 여유 없을 때 대화를 미루는 것만으로도 갈등이 줄어듭니다.",
  파: "꾸준히 쌓아온 것이 갑자기 어긋나는 기운이에요. 동거나 재정 합치기 같은 큰 결정은 충분히 여유를 두고 결정하는 게 좋습니다.",
  해: "좋은 의도가 엇갈려 오해로 번지는 구조예요. '그럴 줄 알았어' 보다 먼저 물어보는 습관이 관계를 지켜줍니다.",
  원진: "이유 없이 묘하게 거리감이 느껴지거나, 멀어졌다가 다시 당기는 관계예요. 감정이 쌓이면 한방에 터지는 경우가 있으니 소소하게 풀어가는 게 중요합니다.",
};

// 천간합: [양간, 음간] — 음간 쪽으로 화살표
const CG_HAP_PAIRS: [string, string][] = [
  ["갑","기"],["을","경"],["병","신"],["정","임"],["무","계"],
];
function cgHapYin(a: string, b: string): string | null {
  const pair = CG_HAP_PAIRS.find(([x,y]) => (x===a&&y===b)||(y===a&&x===b));
  return pair ? pair[1] : null;
}

// 충 승자 (오행극 기준); 진술·축미는 土 vs 土 → 쌍방
const CHUNG_WINNER: Record<string, string> = {
  자오:"자", 오자:"자",
  묘유:"유", 유묘:"유",
  사해:"해", 해사:"해",
  인신:"신", 신인:"신",
};

// 삼합 왕지 — 에너지가 집중되는 중심 지지
const SAMHAP_CENTER = new Set(["오","묘","자","유"]);

type ArrowDir = "my-to-target" | "target-to-my" | "bidirectional";

function getJijiArrowDir(type: JijiRelation["type"], myJj: string, targetJj: string): ArrowDir {
  if (type === "원진" || type === "형" || type === "육합") return "bidirectional";
  if (type === "삼합" || type === "반합") {
    if (SAMHAP_CENTER.has(myJj)) return "target-to-my";
    if (SAMHAP_CENTER.has(targetJj)) return "my-to-target";
    return "bidirectional";
  }
  if (type === "충") {
    const key = `${myJj}${targetJj}`;
    const winner = CHUNG_WINNER[key];
    if (!winner) return "bidirectional";
    return winner === myJj ? "my-to-target" : "target-to-my";
  }
  return "my-to-target";
}

const SLOT_LABEL = ["연주", "월주", "일주", "시주"];
interface Slot { slot: number; label: string; jj: string; cg: string; }

function pickSlots(s: SajuResult): Slot[] {
  const p = s.pillarsDetail;
  const raw = [p.year, p.month, p.day, p.hour];
  return raw
    .map((d, slot) => (d ? { slot, label: SLOT_LABEL[slot], jj: d.jj, cg: d.cg } : null))
    .filter((d): d is Slot => !!d);
}

interface CgHapRel { slot: number; mySlot: Slot; targetSlot: Slot; arrowToTarget: boolean; }
function getCgCrossRelations(myPillars: Slot[], targetPillars: Slot[]): CgHapRel[] {
  const result: CgHapRel[] = [];
  for (const mp of myPillars) {
    const tp = targetPillars.find(p => p.slot === mp.slot);
    if (!tp) continue;
    const yin = cgHapYin(mp.cg, tp.cg);
    if (yin !== null) {
      result.push({ slot: mp.slot, mySlot: mp, targetSlot: tp, arrowToTarget: tp.cg === yin });
    }
  }
  return result;
}

export interface HapchungDiagramProps {
  mySaju: SajuResult;
  targetSaju: SajuResult;
  myName?: string;
  targetName?: string;
  title?: string;
  subtitle?: string;
  accent?: string;
  borderColor?: string;
  bgColor?: string;
  myChipColor?: string;
  targetChipColor?: string;
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

  const crossRelations = sortJijiRelationsByStrength(
    getJijiRelations(allJj).filter(r => {
      if ((r.a < myCount) === (r.b < myCount)) return false;
      const mine = r.a < myCount ? myPillars[r.a] : myPillars[r.b];
      const theirs = r.a < myCount ? targetPillars[r.b - myCount] : targetPillars[r.a - myCount];
      return mine.slot === theirs.slot;
    })
  );

  const cgRelations = getCgCrossRelations(myPillars, targetPillars);

  const hapCount = crossRelations.filter(r => r.type === "육합" || r.type === "삼합" || r.type === "반합").length + cgRelations.length;
  const chungCount = crossRelations.filter(r => r.type === "충").length;
  const tensionCount = crossRelations.filter(r => r.type === "형" || r.type === "파" || r.type === "해" || r.type === "원진").length;

  const xOf = (slot: number) => 12.5 + (3 - slot) * 25;
  const myChipBorder = myChipColor.replace(/0\.\d+\)$/, "0.35)");
  const targetChipBorder = targetChipColor.replace(/0\.\d+\)$/, "0.35)");

  const allRelTypes = [...new Set(crossRelations.map(r => r.type))];

  return (
    <div className="mb-4 rounded-2xl overflow-hidden" style={{ border: `1px solid ${borderColor}`, background: bgColor }}>
      <div className="px-5 pt-5 pb-3 border-b" style={{ borderColor: borderColor.replace(/0\.\d+\)$/, "0.18)") }}>
        <div className="flex items-center gap-2">
          <span className="text-xl">🔗</span>
          <h3 className="text-sm font-black" style={{ color: accent }}>{title}</h3>
        </div>
        <p className="text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>{subtitle}</p>
      </div>

      <div className="p-5">
        {/* 원국 다이어그램 */}
        <div className="relative mb-4" style={{ height: 190 }}>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
            <defs>
              {/* markerEnd: 화살표 끝 (my→target 방향) */}
              {allRelTypes.map(type => (
                <marker key={`end-${type}`} id={`arrow-end-${type}`} viewBox="0 0 10 10" refX="8" refY="5"
                  markerWidth="4.5" markerHeight="4.5" orient="auto">
                  <path d="M0,0 L10,5 L0,10 Z" fill={REL_TYPE_COLOR[type]} />
                </marker>
              ))}
              {/* markerStart: 화살표 시작역방향 (target→my 방향) */}
              {allRelTypes.map(type => (
                <marker key={`start-${type}`} id={`arrow-start-${type}`} viewBox="0 0 10 10" refX="2" refY="5"
                  markerWidth="4.5" markerHeight="4.5" orient="auto-start-reverse">
                  <path d="M0,0 L10,5 L0,10 Z" fill={REL_TYPE_COLOR[type]} />
                </marker>
              ))}
              {/* 천간합 화살표 마커 (초록) */}
              <marker id="arrow-cg-hap-end" viewBox="0 0 10 10" refX="8" refY="5"
                markerWidth="4" markerHeight="4" orient="auto">
                <path d="M0,0 L10,5 L0,10 Z" fill="#34d399" />
              </marker>
              <marker id="arrow-cg-hap-start" viewBox="0 0 10 10" refX="2" refY="5"
                markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                <path d="M0,0 L10,5 L0,10 Z" fill="#34d399" />
              </marker>
            </defs>

            {/* 지지 합충 라인 */}
            {crossRelations.map((r, i) => {
              const mine = myPillars[r.a];
              const theirs = targetPillars[r.b - myCount];
              const x1 = xOf(mine.slot), x2 = xOf(theirs.slot);
              const isStrong = r.type === "육합" || r.type === "삼합" || r.type === "충";
              const dir = getJijiArrowDir(r.type, mine.jj, theirs.jj);
              return (
                <line key={`jj-${i}`} x1={x1} y1={22} x2={x2} y2={78}
                  stroke={REL_TYPE_COLOR[r.type]}
                  strokeWidth={isStrong ? 1.4 : 0.9}
                  strokeOpacity={0.85}
                  strokeDasharray={r.type === "충" ? undefined : (r.type === "원진" || r.type === "해" ? "2,2" : undefined)}
                  markerEnd={dir !== "target-to-my" ? `url(#arrow-end-${r.type})` : undefined}
                  markerStart={dir !== "my-to-target" ? `url(#arrow-start-${r.type})` : undefined}
                />
              );
            })}

            {/* 천간합 라인 (점선 초록) */}
            {cgRelations.map((rel, i) => {
              const x = xOf(rel.slot);
              return (
                <line key={`cg-${i}`} x1={x} y1={22} x2={x} y2={78}
                  stroke="#34d399" strokeWidth={0.8} strokeOpacity={0.7}
                  strokeDasharray="3,2"
                  markerEnd={rel.arrowToTarget ? "url(#arrow-cg-hap-end)" : undefined}
                  markerStart={!rel.arrowToTarget ? "url(#arrow-cg-hap-start)" : undefined}
                />
              );
            })}
          </svg>

          {myPillars.map(p => (
            <div key={`my-${p.slot}`} className="absolute flex flex-col items-center" style={{ left: `${xOf(p.slot)}%`, top: "22%", transform: "translate(-50%, -50%)" }}>
              <div className="rounded-lg px-2.5 py-1.5 text-center" style={{ background: myChipColor, border: `1px solid ${myChipBorder}` }}>
                <p className="text-sm font-black text-white leading-tight">{p.cg}{p.jj}</p>
              </div>
              <p className="text-[9px] mt-1" style={{ color: "rgba(255,255,255,0.45)" }}>{p.label}</p>
            </div>
          ))}
          {targetPillars.map(p => (
            <div key={`target-${p.slot}`} className="absolute flex flex-col items-center" style={{ left: `${xOf(p.slot)}%`, top: "78%", transform: "translate(-50%, -50%)" }}>
              <p className="text-[9px] mb-1" style={{ color: "rgba(255,255,255,0.45)" }}>{p.label}</p>
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
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>합 (끌림)</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
            <p className="text-lg font-black" style={{ color: "#f87171" }}>{chungCount}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>충 (자극·긴장)</p>
          </div>
          <div className="rounded-xl p-3 text-center" style={{ background: "rgba(192,132,252,0.08)", border: "1px solid rgba(192,132,252,0.2)" }}>
            <p className="text-lg font-black" style={{ color: "#c084fc" }}>{tensionCount}</p>
            <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>형·파·해·원진(귀문)</p>
          </div>
        </div>

        {crossRelations.length === 0 && cgRelations.length === 0 && (
          <p className="text-sm leading-relaxed text-center py-2" style={{ color: "rgba(255,255,255,0.75)" }}>
            두 사람의 사주 사이에 강하게 부딫히는 합충 관계는 없어요. 무난하게 서로를 알아갈 수 있는 궁합이에요.
          </p>
        )}

        <div className="space-y-2">
          {/* 천간합 카드 */}
          {cgRelations.map((rel, i) => {
            const destName = rel.arrowToTarget ? targetName : myName;
            const destLabel = rel.arrowToTarget ? rel.targetSlot.label : rel.mySlot.label;
            const pairLabel = rel.arrowToTarget
              ? `${myName}(${rel.mySlot.label}) ${rel.mySlot.cg} → ${targetName}(${rel.targetSlot.label}) ${rel.targetSlot.cg}`
              : `${targetName}(${rel.targetSlot.label}) ${rel.targetSlot.cg} → ${myName}(${rel.mySlot.label}) ${rel.mySlot.cg}`;
            return (
              <div key={`cg-card-${i}`} className="rounded-xl p-3.5" style={{ background: "rgba(52,211,153,0.05)", border: "1px solid rgba(52,211,153,0.2)" }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded" style={{ background: "#34d399", color: "#06060e" }}>천간합</span>
                  <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.55)" }}>{pairLabel}</span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
                  두 사람의 천간이 서로 합을 이루는 조합이에요. {destName}({destLabel}) 쪽으로 에너지가 흐르며, 그 사람이 이 관계에서 더 강한 주도력을 갖게 됩니다.
                </p>
              </div>
            );
          })}

          {crossRelations.map((r, i) => {
            const [c1, c2] = canonicalJijiPairOrder(r.jjA, r.jjB, r.type);
            const myLabel = myPillars[r.a].label;
            const targetLabel = targetPillars[r.b - myCount].label;
            const typeText = r.type === "원진" ? "원진(귀문)" : r.type;
            const isHapPaOverlap = (r.type === "육합" || r.type === "파") &&
              crossRelations.some(o => o !== r && o.a === r.a && o.b === r.b && (o.type === "육합" || o.type === "파"));
            return (
              <div key={`jj-card-${i}`} className="rounded-xl p-3.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded" style={{ background: REL_TYPE_COLOR[r.type], color: "#06060e" }}>{typeText}</span>
                  <span className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {myName}({myLabel}) {c1} ↔ {targetName}({targetLabel}) {c2}
                  </span>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.8)" }}>
                  {HAPCHUNG_NOTE[r.type]}
                  {isHapPaOverlap && " 같은 지지 쌍이 합과 파를 동시에 이루는 조합이라, 서로를 끌어당기는 힘은 분명하지만 그 합이 끝까지 매끄럽게 유지되긴 어려워요. 시작은 좋아도 시간이 지나며 이해관계나 감정 대립으로 균열이 생기기 쉬운 구조예요."}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "격국(格局) — 내 사주의 格은 무엇인가 | Summer Palace",
  description: "사주 격국 완전 정리. 내격 10종(식신격·정관격·편재격 등), 성격·파격·외격·종격·화격, 월지 기준 격국 취용법까지 명리학 핵심을 설명합니다.",
};

const NAEGYEOK = [
  { name: "식신격", hanja: "食神格", color: "#f5c518", desc: "끊임없는 노력·투자, 가시적 성과 추구. 불확실한 미래에 사전 대응하는 안정적 실력파. 타인의 간섭을 싫어하고 자기 페이스를 중시한다." },
  { name: "상관격", hanja: "傷官格", color: "#f87171", desc: "창의성·정의감이 강하고 표현욕이 넘친다. 좌절하면 냉소·반사회적 에너지로 전환될 수 있다. 독설과 예술성이 공존하는 유형." },
  { name: "정재격", hanja: "正財格", color: "#34d399", desc: "낭비 없고 실용적. 가정적·헌신적 성향이 강하며 안정된 수입을 선호한다. 손실 회피 성향이 크고 고정 수입 확보를 우선시한다." },
  { name: "편재격", hanja: "偏財格", color: "#06b6d4", desc: "활동 범위에 제한이 없고 다양한 분야에 도전한다. 복리 지향적이며 투자 재투자를 반복한다. 확장과 다양성을 즐긴다." },
  { name: "정관격", hanja: "正官格", color: "#a78bfa", desc: "원칙·규칙 안에서 최고를 추구한다. 조직 친화적이며 신뢰감이 높다. 도덕과 규범에 반하는 행동을 극도로 싫어한다." },
  { name: "편관격", hanja: "偏官格", color: "#fb7185", desc: "조직 질서를 확립하고 계층 관계가 명확하다. 극복 시 강한 리더십을 발휘한다. 압박과 경쟁을 통해 성장하는 유형." },
  { name: "정인격", hanja: "正印格", color: "#fbbf24", desc: "선량하고 학문·직관이 발달했다. 관성이 함께하면 청렴·자비로운 성향. 공부와 자격증, 지식 축적에 강점이 있다." },
  { name: "편인격", hanja: "偏印格", color: "#e879f9", desc: "독창성·예술성이 강하고 비정형적 사고를 한다. 전문 기술과 특수 능력이 발달하며 틀을 벗어난 창의력이 장점이다." },
  { name: "비견격", hanja: "比肩格", color: "#60a5fa", desc: "독립심·자존심이 극강하다. 경쟁 속에서 빛나는 유형이며 자기 기준이 행동의 중심이다. 리더십과 개인주의가 공존한다." },
  { name: "겁재격", hanja: "劫財格", color: "#f97316", desc: "강인한 의지로 역경을 극복하는 유형. 재물 기복에 주의가 필요하고 형제·동료와의 경쟁 의식이 강하다." },
];

export default function GyeokgukPage() {
  return (
    <div>
      <div className="mb-8">
        <Link href="/guide" className="text-xs mb-4 inline-block transition-colors" style={{ color: "rgba(255,255,255,0.35)" }}>
          ← 가이드 목록
        </Link>
        <p className="text-xs font-black tracking-widest uppercase mb-2" style={{ color: "#60a5fa" }}>格局 · 격국</p>
        <h1 className="text-3xl sm:text-4xl font-black text-white mb-3 leading-tight">내 사주의 格은 무엇인가</h1>
        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
          격국(格局)은 사주의 <strong style={{ color: "rgba(255,255,255,0.85)" }}>월지(月支)</strong>를 기준으로 일간의 본질적 성향과 운명의 방향성을 분류하는 틀입니다.
          월령(月令)은 사주에서 가장 핵심적인 기운 — 일부 학파는 월지 하나가 사주 전체의 <strong style={{ color: "#f5c518" }}>50% 이상</strong>을 결정한다고 봅니다.
        </p>
      </div>

      {/* 격국 취용법 */}
      <div className="rounded-2xl p-5 mb-8" style={{ background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.2)" }}>
        <p className="text-sm font-black mb-3" style={{ color: "#60a5fa" }}>🔮 격국 취용법 (格局 取用法)</p>
        <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.65)" }}>
          월지(月支)에서 일간과의 십성(十星) 관계로 格을 정한다.
          월지 지장간 중 가장 강한 기운을 취용신(取用神)으로 삼아 格의 이름을 붙인다.
        </p>
        <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(245,197,24,0.06)", border: "1px solid rgba(245,197,24,0.18)", color: "rgba(255,255,255,0.6)" }}>
          예) 일간 <strong style={{ color: "#ffffff" }}>甲木</strong>, 월지 <strong style={{ color: "#ffffff" }}>酉金</strong> → 酉 본기가 庚金(편관) → <strong style={{ color: "#f5c518" }}>편관격(칠살격)</strong>
          <br />신강·신약 판단 후 용신을 확정하면 격국 분석이 완성된다.
        </div>
      </div>

      {/* 내격 10종 */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base font-black text-white">内格 (내격)</span>
          <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: "rgba(139,92,246,0.12)", border: "1px solid rgba(139,92,246,0.25)", color: "#a78bfa" }}>10종</span>
        </div>
        <div className="space-y-3">
          {NAEGYEOK.map((g) => (
            <div key={g.name} className="rounded-2xl p-4 flex gap-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderLeft: `3px solid ${g.color}` }}>
              <div className="shrink-0 w-20">
                <p className="text-sm font-black" style={{ color: g.color }}>{g.name}</p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{g.hanja}</p>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>{g.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 성격 파격 외격 */}
      <div className="mb-8">
        <h2 className="text-lg font-black text-white mb-4">成格 · 破格 · 外格</h2>
        <div className="space-y-3">
          <div className="rounded-2xl p-4" style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <p className="text-sm font-black mb-2" style={{ color: "#34d399" }}>成格 (성격) — 格이 완성된 상태</p>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              格이 진정으로 갖춰진 상태. 소명을 지키며 희생이 따르는 대신, 운의 흐름이 일관적이고 삶의 방향성이 명확하다. 성격 사주는 타고난 길을 충실히 걸을 때 빛난다.
            </p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p className="text-sm font-black mb-2" style={{ color: "#f87171" }}>破格 (파격) — 格이 완성되지 못한 상태</p>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              格이 완벽하게 이루어지지 못한 상태. 자기 만족 추구 경향이 강하고 운의 기복이 크다. 단, 파격 사주도 방향만 잘 잡으면 성공할 수 있다 — 파격이 곧 실패를 의미하지 않는다.
            </p>
          </div>
          <div className="rounded-2xl p-4" style={{ background: "rgba(245,197,24,0.06)", border: "1px solid rgba(245,197,24,0.2)" }}>
            <p className="text-sm font-black mb-2" style={{ color: "#f5c518" }}>外格 (외격) — 특수한 사주</p>
            <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
              종격(從格)·화격(化格) 등 매우 특이한 사주 구조. 한 오행·십성이 압도적으로 강해 다른 오행으로 억제할 수 없을 때, 그 왕강한 세력에 순응하는 구조.
              종재격·종관격·종살격·종인격·종아격, 화격 5종(갑기합화토 등)이 있다.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
        <span className="text-lg">⏱</span>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>읽는 시간: 약 8분</p>
      </div>
    </div>
  );
}

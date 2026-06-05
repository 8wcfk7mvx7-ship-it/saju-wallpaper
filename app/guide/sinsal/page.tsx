import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "신살이란 — 역마살·도화살·귀문관살 등 주요 신살 완전 정리",
  description: "명리학의 신살(神殺) — 역마살, 도화살, 귀문관살, 홍염살, 화개살, 원진살, 백호살, 양인살의 의미와 긍정적 활용법을 설명합니다.",
};

const SINSALS = [
  {
    name: "역마살(驛馬殺)",
    icon: "🐴",
    color: "#fbbf24",
    summary: "끊임없이 이동하고 변화를 추구하는 기운",
    desc: "역마살이 있는 사람은 한 곳에 오래 머물기 힘들고, 이직·이사·해외 활동이 잦습니다. 현대에는 무역, 외교, 운송, 유통, 여행업 등과 연결되며 오히려 강점이 될 수 있습니다.",
    positive: "변화 적응력, 해외 활동 적성, 다양한 경험 축적",
    caution: "정착·안정보다 흐름을 즐기는 삶의 방식이 맞습니다. 억지로 한 곳에 붙잡으면 에너지가 막힙니다.",
  },
  {
    name: "도화살(桃花殺)",
    icon: "🌸",
    color: "#f9a8d4",
    summary: "이성을 끌어당기는 매력과 인기의 기운",
    desc: "도화살은 외모나 분위기에서 이성을 자연스럽게 끌어당기는 힘입니다. 연예인·모델·방송인에게 자주 보이며, 사교성과 친화력이 뛰어납니다. 단, 이성 관계 변동이 많을 수 있습니다.",
    positive: "높은 대인 매력, 예술·엔터테인먼트 적성, 폭넓은 인간관계",
    caution: "자신의 매력이 불필요한 이성 관계를 끌어들일 수 있습니다. 분명한 경계 설정이 중요합니다.",
  },
  {
    name: "귀문관살(鬼門關殺)",
    icon: "🌀",
    color: "#a78bfa",
    summary: "영적 감수성과 특이한 직관력의 기운",
    desc: "귀문관살이 있으면 남다른 직관력과 감수성을 갖추지만, 정신적으로 예민하고 신경증적 경향이 나타날 수 있습니다. 상담사, 심리치료사, 작가, 철학자 등에 적합한 기운입니다.",
    positive: "뛰어난 직관과 공감 능력, 창의적 사고, 심층적 분석력",
    caution: "지나치게 예민해지거나 강박적인 사고에 빠지지 않도록 심신 안정을 유지하는 것이 중요합니다.",
  },
  {
    name: "홍염살(紅艶殺)",
    icon: "🌹",
    color: "#fb7185",
    summary: "짙은 성적 매력과 로맨틱한 에너지의 기운",
    desc: "홍염살은 이성에게 강한 성적 매력을 발산하는 기운입니다. 도화살보다 관능적이고 깊은 끌림이 특징입니다. 예술·패션·뷰티 분야에서도 강한 심미안을 드러냅니다.",
    positive: "강렬한 이성 매력, 예술·심미 감각, 깊은 연애 능력",
    caution: "감정의 깊이만큼 실연의 상처도 클 수 있습니다. 감정 소모에 주의가 필요합니다.",
  },
  {
    name: "화개살(華蓋殺)",
    icon: "🎨",
    color: "#6ee7b7",
    summary: "예술적 재능과 고독한 깊이의 기운",
    desc: "화개살은 예술·종교·철학에 깊이 빠져드는 기운입니다. 혼자 있는 시간을 즐기고 독창적인 세계관을 갖습니다. 학자·예술가·수도자 기질에 잘 맞습니다.",
    positive: "예술·문학·학문에서 두각, 깊은 사색과 독창성, 정신적 풍요",
    caution: "대인관계에서 고독감을 느낄 수 있습니다. 자신만의 세계를 개방하는 연습이 도움이 됩니다.",
  },
  {
    name: "원진살(怨嗔殺)",
    icon: "⚡",
    color: "#f97316",
    summary: "상대방과 묘하게 맞지 않아 마찰이 생기는 기운",
    desc: "원진살은 띠나 일간 기준으로 특정 상대와 묘하게 감정 소모가 많은 관계를 만드는 기운입니다. 궁합에서 원진이 겹치면 좋아하면서도 갈등이 반복되는 '애증 관계'가 됩니다.",
    positive: "원진 관계에서도 극복하면 깊은 유대가 생길 수 있습니다.",
    caution: "원진살이 겹치는 관계라면 의도적으로 의사소통과 타협을 강화해야 합니다.",
  },
  {
    name: "백호살(白虎殺)",
    icon: "🐯",
    color: "#e2e8f0",
    summary: "강렬하고 급격한 변화·사고의 기운",
    desc: "백호살은 날카롭고 강한 에너지를 가져 수술·사고·혈액 관련 사건이 연결되기도 합니다. 그러나 이 기운을 잘 활용하면 의사·군인·경찰·스포츠 선수 등 날카로운 집중력이 필요한 분야에서 뛰어납니다.",
    positive: "강한 집중력, 위기 상황에서의 결단력, 전투적 승부욕",
    caution: "충동적 행동과 과도한 긴장에 주의가 필요합니다. 운동·명상으로 에너지를 조절하세요.",
  },
  {
    name: "양인살(羊刃殺)",
    icon: "⚔️",
    color: "#fca5a5",
    summary: "예리하고 강렬한 자아와 승부욕의 기운",
    desc: "양인살은 의지력과 자기주장이 극도로 강한 기운입니다. 지도자형이지만 조직 내 마찰도 많습니다. 군인·검사·외과의사 등 칼날 같은 기운이 필요한 직업과 인연이 깊습니다.",
    positive: "강한 의지력, 리더십, 목표 관철 능력",
    caution: "대인관계에서 고압적이 될 수 있습니다. 유연성과 경청 능력을 키우는 것이 중요합니다.",
  },
];

export default function SinsalPage() {
  return (
    <article className="prose-guide">
      <style>{`
        .prose-guide h2 { font-size: 1.2rem; font-weight: 800; color: #fff; margin: 2rem 0 0.75rem; }
        .prose-guide p { font-size: 0.9375rem; line-height: 1.85; color: rgba(255,255,255,0.72); margin-bottom: 1rem; }
        .prose-guide .callout { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-left: 3px solid #c9a84c; border-radius: 10px; padding: 1rem 1.25rem; margin: 1.25rem 0; }
      `}</style>

      <div className="mb-8">
        <Link href="/guide" className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>← 가이드 목록</Link>
        <p className="text-xs font-semibold mt-4 mb-2 uppercase tracking-widest" style={{ color: "#c9a84c" }}>사주 기초</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">신살이란 — 역마·도화·귀문 등</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>읽는 시간: 약 6분 · 최종 수정: 2026.06</p>
      </div>

      <div className="prose-guide">
        <div className="callout">
          <p style={{ margin: 0 }}>
            <strong style={{ color: "#fff" }}>한 줄 요약:</strong> 신살(神殺)은 사주 명리학에서 특정 기운의 조합이 만들어내는 삶의 패턴입니다. 이름에 '살(殺)'이 붙지만 반드시 나쁜 것이 아니며, 방향을 알고 활용하면 강점이 됩니다.
          </p>
        </div>

        <p>
          신살은 연주·월주·일주·시주의 간지 조합에서 특정 패턴을 발견해 이름 붙인 것입니다. 수십 가지가 존재하지만 실제로 자주 해석에 쓰이는 것은 10여 가지입니다. 아래에 가장 대표적인 8가지를 정리했습니다.
        </p>

        <div className="space-y-4 my-6">
          {SINSALS.map(({ name, icon, color, summary, desc, positive, caution }) => (
            <div key={name} className="rounded-2xl p-5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="text-base font-black text-white mb-0">{name}</p>
                  <p className="text-xs" style={{ color }}>{summary}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.68)" }}>{desc}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)" }}>
                  <span className="font-bold" style={{ color: "#4ade80" }}>✦ 긍정 활용: </span>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>{positive}</span>
                </div>
                <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)" }}>
                  <span className="font-bold" style={{ color: "#fbbf24" }}>⚠ 주의: </span>
                  <span style={{ color: "rgba(255,255,255,0.6)" }}>{caution}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <h2>신살을 대하는 올바른 자세</h2>
        <p>
          신살은 숙명이 아닙니다. 같은 역마살이 있어도 어떤 사람은 세계 여행가가 되고, 어떤 사람은 잦은 이직으로 불안해합니다. 신살이 가진 에너지의 방향을 파악해 적합한 삶의 방식을 선택하는 것이 명리학의 실용적 활용법입니다. '이 신살이 있으니 나쁘다'가 아니라, '이 에너지를 어디에 쓸까'를 생각하는 것이 핵심입니다.
        </p>

        <div className="callout">
          <p style={{ margin: 0, fontSize: "0.85rem" }}>
            본 콘텐츠는 교육·오락 목적의 참고 자료입니다. 신살 해석은 전체 사주의 구조와 함께 보아야 하며, 단독으로 운명을 결정하지 않습니다.
          </p>
        </div>

        <h2>다음 단계</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {[
            { href: "/guide/daewoon", label: "대운·세운 →" },
            { href: "/guide/saju-basics", label: "← 사주 기초" },
          ].map(({ href, label }) => (
            <a key={href} href={href} className="text-sm font-semibold px-4 py-2 rounded-xl"
              style={{ background: "rgba(201,168,76,0.1)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.25)", textDecoration: "none" }}>
              {label}
            </a>
          ))}
        </div>
      </div>
    </article>
  );
}

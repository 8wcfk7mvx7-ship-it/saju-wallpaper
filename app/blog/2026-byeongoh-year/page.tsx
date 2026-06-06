import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "2026 병오년(丙午年) 운세 흐름 완전 분석",
  description: "2026 병오년은 천간 병(丙)과 지지 오(午) 모두 화(火) 기운의 해입니다. 일간별 기회와 주의 사항, 2026년의 핵심 흐름을 명리학으로 분석합니다.",
};

const ILGAN_OUTLOOK = [
  { ilgan: "갑(甲)", ohaeng: "목", emoji: "🌳", summary: "화 기운을 생조받아 에너지가 넘침", outlook: "갑목이 화를 만나면 목생화로 에너지가 발산됩니다. 이직·창업·새로운 프로젝트 시작에 좋은 해입니다. 단, 과도한 소진에 주의하세요." },
  { ilgan: "을(乙)", ohaeng: "목", emoji: "🌿", summary: "표현력·사교성이 강해지는 해", outlook: "을목도 화를 생조해 활발한 대인관계와 표현력 향상이 기대됩니다. 예술·미디어·강의 분야에서 기회가 생깁니다." },
  { ilgan: "병(丙)", ohaeng: "화", emoji: "☀️", summary: "비겁이 강해져 경쟁·자기주장이 극대화", outlook: "같은 화 기운이 겹쳐 에너지는 넘치지만 충돌도 많아집니다. 독립적인 프로젝트나 1인 활동에 집중하는 것이 유리합니다." },
  { ilgan: "정(丁)", ohaeng: "화", emoji: "🕯️", summary: "비겁 운에서 집중력과 경쟁이 교차", outlook: "정화는 병화의 강한 에너지에 압도될 수 있습니다. 섬세한 집중이 필요한 작업을 지속하되, 협업보다 독립 작업이 유리합니다." },
  { ilgan: "무(戊)", ohaeng: "토", emoji: "⛰️", summary: "화생토로 생조받아 안정·성장의 해", outlook: "화가 토를 생조해 무토 일간에게는 기반을 다지는 좋은 해입니다. 부동산·자산 관련 계획을 구체화하기에 적합합니다." },
  { ilgan: "기(己)", ohaeng: "토", emoji: "🌱", summary: "생조받아 현실적 성취가 강조되는 해", outlook: "기토도 화의 생을 받아 실무 능력이 빛나는 해입니다. 꼼꼼한 준비와 실행이 결실로 이어지기 쉽습니다." },
  { ilgan: "경(庚)", ohaeng: "금", emoji: "⚔️", summary: "화극금으로 압박받는 시기, 유연성 필요", outlook: "화가 금을 극하므로 경금에게는 도전적인 해입니다. 원칙을 유지하되 고집을 버리고 유연하게 대처하면 위기를 기회로 전환할 수 있습니다." },
  { ilgan: "신(辛)", ohaeng: "금", emoji: "💎", summary: "극을 받으며 정화되는 시련의 해", outlook: "신금도 화의 극을 받습니다. 감정적으로 예민해질 수 있으며 건강 관리가 중요합니다. 폐·피부·호흡기에 주의하세요." },
  { ilgan: "임(壬)", ohaeng: "수", emoji: "🌊", summary: "수극화로 적극적 대응이 효과적인 해", outlook: "임수가 화를 극하는 구도로, 강한 의지와 계획력이 빛납니다. 기획·전략·리서치 분야에서 두각을 나타낼 수 있습니다." },
  { ilgan: "계(癸)", ohaeng: "수", emoji: "🌧️", summary: "극하는 역할로 통제력이 부각되는 해", outlook: "계수도 화를 극하지만 화가 워낙 강해 부담을 느낄 수 있습니다. 건강과 수분 섭취에 특히 신경 쓰고, 무리한 일정은 피하세요." },
];

export default function Page2026() {
  return (
    <article className="prose-guide">
      <style>{`
        .prose-guide h2 { font-size: 1.2rem; font-weight: 800; color: #fff; margin: 2rem 0 0.75rem; }
        .prose-guide h3 { font-size: 1rem; font-weight: 700; color: #e8c97a; margin: 1.5rem 0 0.5rem; }
        .prose-guide p { font-size: 0.9375rem; line-height: 1.85; color: rgba(255,255,255,0.72); margin-bottom: 1rem; }
        .prose-guide ul { padding-left: 1.25rem; margin-bottom: 1rem; }
        .prose-guide li { font-size: 0.9375rem; line-height: 1.8; color: rgba(255,255,255,0.65); margin-bottom: 0.3rem; }
        .prose-guide .callout { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-left: 3px solid #c9a84c; border-radius: 10px; padding: 1rem 1.25rem; margin: 1.25rem 0; }
      `}</style>

      <div className="mb-8">
        <Link href="/blog" className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>← 블로그 목록</Link>
        <div className="flex items-center gap-2 mt-4 mb-2">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: "rgba(249,115,22,0.15)", color: "#f97316", border: "1px solid rgba(249,115,22,0.3)" }}>2026 시즌</span>
          <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>2026.06.01</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">2026 병오년(丙午年) 운세 흐름 완전 분석</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>읽는 시간: 약 7분</p>
      </div>

      <div className="prose-guide">
        <div className="callout">
          <p style={{ margin: 0 }}>
            <strong style={{ color: "#fff" }}>2026 병오년 핵심:</strong> 천간 병(丙)과 지지 오(午) 모두 화(火)입니다. 강렬한 불의 해로, 열정·도전·빠른 변화가 주요 키워드입니다. 화 기운의 일간(병·정)은 경쟁 심화, 수 기운의 일간(임·계)은 강한 추진력을 발휘할 수 있습니다.
          </p>
        </div>

        <h2>병오년(丙午年)이란</h2>
        <p>
          2026년의 간지는 병오(丙午)입니다. 천간 병(丙)은 양의 화(陽火), 지지 오(午)는 화 기운이 가장 강한 글자입니다. 두 기운이 겹쳐 '화 위에 화'인 강렬한 해가 됩니다. 서양 점성술의 '불의 해'와 비슷한 개념이지만, 명리학에서는 이 기운이 각 일간과 어떻게 작용하는지를 세밀하게 봅니다.
        </p>

        <h2>병오년의 주요 키워드</h2>
        <ul>
          <li><strong style={{ color: "#fff" }}>열정과 야망:</strong> 화는 상승하는 기운입니다. 2026년은 목표를 향해 돌진하는 에너지가 사회 전반에 넘칩니다.</li>
          <li><strong style={{ color: "#fff" }}>빠른 변화:</strong> 화 기운은 빠르게 타오르고 빠르게 식습니다. 급격한 시장 변화, 유행의 속도 가속이 예상됩니다.</li>
          <li><strong style={{ color: "#fff" }}>갈등과 경쟁:</strong> 화는 자기 표현이 강한 기운입니다. 개인 간·국가 간 주도권 경쟁이 심화될 수 있습니다.</li>
          <li><strong style={{ color: "#fff" }}>창의와 혁신:</strong> 화의 밝은 면은 창의성입니다. 예술·엔터테인먼트·IT·스타트업 분야에서 혁신이 두드러집니다.</li>
          <li><strong style={{ color: "#fff" }}>관계의 변동:</strong> 화는 인연을 만들기도 하고 끊기도 합니다. 관계 정리와 새 인연 형성이 교차하는 해입니다.</li>
        </ul>

        <h2>주의해야 할 점</h2>
        <ul>
          <li>화 기운이 강하면 수(水)가 약해집니다. 냉정한 판단력과 끈기가 부족해질 수 있으므로 충동적 결정을 경계하세요.</li>
          <li>건강: 심장·혈압·피부·눈 관련 질환에 주의가 필요합니다.</li>
          <li>금전: 급하게 투자하거나 감정적으로 지출하는 경향이 강해집니다. 계획적 재정 관리가 중요합니다.</li>
        </ul>

        <h2>일간별 2026 병오년 전망</h2>
        <p>내 일간(태어난 날의 천간)에 따라 병오년이 미치는 영향이 달라집니다.</p>

        <div className="space-y-3 my-5">
          {ILGAN_OUTLOOK.map(({ ilgan, ohaeng, emoji, summary, outlook }) => (
            <div key={ilgan} className="rounded-2xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xl">{emoji}</span>
                <div>
                  <span className="text-sm font-black text-white">{ilgan} 일간</span>
                  <span className="text-xs ml-2" style={{ color: "rgba(255,255,255,0.4)" }}>({ohaeng})</span>
                </div>
              </div>
              <p className="text-xs font-semibold mb-1.5" style={{ color: "#fbbf24" }}>{summary}</p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>{outlook}</p>
            </div>
          ))}
        </div>

        <h2>2026년 유리한 달</h2>
        <p>
          화 기운이 절정인 해에는 수(水) 기운이 강한 달—음력 10월(해월)·11월(자월)—에 냉정하게 정리하고 계획을 세우는 것이 유리합니다. 봄(음력 1~3월)은 목생화로 에너지가 풍부해 시작하기 좋습니다. 가을(음력 7~9월)은 금 기운이 화를 억제해 안정을 찾기 좋습니다.
        </p>

        <div className="callout">
          <p style={{ margin: 0, fontSize: "0.85rem" }}>
            본 콘텐츠는 교육·오락 목적의 참고 자료입니다. 명리학 분석은 경향과 흐름을 제시하며, 구체적 사건이나 날짜를 예언하지 않습니다. 중요한 결정은 반드시 전문가와 상담하세요.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mt-6">
          {[
            { href: "/guide/daewoon", label: "← 대운·세운이란" },
            { href: "/guide", label: "가이드 목록 →" },
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

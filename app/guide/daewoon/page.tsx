import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "대운·세운이란 — 인생 타임라인을 읽는 법",
  description: "10년 단위 대운(大運)과 1년 단위 세운(歲運)의 개념, 대운 시작 나이 계산법, 교운기의 의미, 대운·세운을 실생활에 활용하는 방법을 설명합니다.",
};

export default function DaewoonPage() {
  return (
    <article className="prose-guide">
      <style>{`
        .prose-guide h2 { font-size: 1.2rem; font-weight: 800; color: #fff; margin: 2rem 0 0.75rem; }
        .prose-guide h3 { font-size: 1rem; font-weight: 700; color: #e8c97a; margin: 1.5rem 0 0.5rem; }
        .prose-guide p { font-size: 0.9375rem; line-height: 1.85; color: rgba(255,255,255,0.72); margin-bottom: 1rem; }
        .prose-guide ul { padding-left: 1.25rem; margin-bottom: 1rem; }
        .prose-guide li { font-size: 0.9375rem; line-height: 1.8; color: rgba(255,255,255,0.65); margin-bottom: 0.3rem; }
        .prose-guide .callout { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-left: 3px solid #c9a84c; border-radius: 10px; padding: 1rem 1.25rem; margin: 1.25rem 0; }
        .prose-guide table { width:100%; border-collapse:collapse; font-size:0.8125rem; margin-bottom:1rem; }
        .prose-guide th { background:rgba(201,168,76,0.1); color:#c9a84c; padding:0.45rem 0.6rem; text-align:left; font-weight:700; border:1px solid rgba(255,255,255,0.08); }
        .prose-guide td { padding:0.45rem 0.6rem; border:1px solid rgba(255,255,255,0.06); color:rgba(255,255,255,0.62); }
      `}</style>

      <div className="mb-8">
        <Link href="/guide" className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>← 가이드 목록</Link>
        <p className="text-xs font-semibold mt-4 mb-2 uppercase tracking-widest" style={{ color: "#c9a84c" }}>사주 기초</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">대운·세운 — 인생 타임라인 읽기</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>읽는 시간: 약 5분 · 최종 수정: 2026.06</p>
      </div>

      <div className="prose-guide">
        <div className="callout">
          <p style={{ margin: 0 }}>
            <strong style={{ color: "#fff" }}>한 줄 요약:</strong> 사주 원국(여덟 글자)이 '타고난 스펙'이라면, 대운과 세운은 '시기별 환경'입니다. 언제 바람이 불고 언제 파도가 치는지를 미리 파악해 준비하는 것이 대운·세운 분석의 핵심입니다.
          </p>
        </div>

        <h2>대운(大運)이란</h2>
        <p>
          대운(大運)은 10년 단위로 바뀌는 운의 흐름을 말합니다. 사주 원국의 월주(月柱)를 기준으로, 태어난 시점부터 가장 가까운 절기까지의 날수를 계산해 대운 시작 나이를 구합니다. 이 나이를 '대운수'라 하며, 대운수부터 10년마다 새로운 대운이 시작됩니다.
        </p>
        <p>
          예를 들어 대운수가 3이면 만 3세, 13세, 23세, 33세, 43세, 53세, 63세, 73세에 각각 새로운 대운 기운이 펼쳐집니다. 각 10년의 대운은 천간과 지지 한 쌍으로 표현되며, 그 기운이 원국의 기운과 어떻게 작용하는지를 분석합니다.
        </p>

        <h3>대운 시작 나이 계산 원리</h3>
        <p>
          양남(陽男)·음녀(陰女)는 태어난 날로부터 다음 절기까지의 날수를 3으로 나눕니다. 음남(陰男)·양녀(陽女)는 태어난 날로부터 이전 절기까지의 날수를 3으로 나눕니다. 나머지는 반올림합니다. 이 값이 대운이 처음 시작되는 나이(대운수)입니다.
        </p>

        <h2>세운(歲運)이란</h2>
        <p>
          세운은 1년 단위로 바뀌는 운의 흐름입니다. 해당 연도의 간지가 세운이 됩니다. 예를 들어 2026년 병오년(丙午)에는 병오가 세운으로 작용합니다. 세운은 대운의 큰 흐름 안에서 '이번 한 해의 기회와 위험'을 더 세밀하게 보여줍니다.
        </p>

        <table>
          <thead>
            <tr><th>구분</th><th>기간</th><th>역할</th></tr>
          </thead>
          <tbody>
            <tr><td><strong style={{ color: "#fff" }}>대운(大運)</strong></td><td>10년 단위</td><td>인생의 큰 환경과 흐름 (계절)</td></tr>
            <tr><td><strong style={{ color: "#fff" }}>세운(歲運)</strong></td><td>1년 단위</td><td>해당 연도의 기회·위험 (날씨)</td></tr>
            <tr><td>월운(月運)</td><td>1개월 단위</td><td>그 달의 세부 에너지</td></tr>
            <tr><td>일운(日運)</td><td>1일 단위</td><td>그날의 기운 (일진)</td></tr>
          </tbody>
        </table>

        <h2>교운기(交運期)란</h2>
        <p>
          대운이 바뀌는 전후 1~2년을 교운기(交運期)라 합니다. 두 가지 기운이 동시에 작용해 혼란스럽거나 예측 불가능한 일이 생기기 쉬운 시기입니다. 이 시기에 큰 결정(이직, 이민, 결혼)을 할 때는 특히 신중함이 필요합니다. 반대로 교운기를 잘 넘기면 새로운 대운에 빠르게 안착할 수 있습니다.
        </p>

        <h2>대운의 좋고 나쁨을 어떻게 읽는가</h2>
        <p>
          대운의 기운이 내 원국(사주 여덟 글자)을 도와주면 '좋은 대운', 충돌하거나 억누르면 '힘든 대운'으로 봅니다. 핵심 판단 기준은 다음과 같습니다.
        </p>
        <ul>
          <li><strong style={{ color: "#fff" }}>용신(用神) 운:</strong> 내게 필요한 기운이 오는 대운. 기회가 많고 사업·연애·승진이 잘 풀립니다.</li>
          <li><strong style={{ color: "#fff" }}>기신(忌神) 운:</strong> 내게 방해가 되는 기운이 오는 대운. 건강·재정·인간관계에서 마찰이 생기기 쉽습니다.</li>
          <li><strong style={{ color: "#fff" }}>충(沖) 운:</strong> 원국의 주요 글자와 충돌하는 기운이 오는 대운. 급격한 변화나 이별, 사고의 가능성이 높아집니다.</li>
          <li><strong style={{ color: "#fff" }}>합(合) 운:</strong> 원국의 기운과 합이 되는 대운. 귀인을 만나거나 좋은 환경이 형성됩니다.</li>
        </ul>

        <h2>대운·세운을 실생활에 활용하는 법</h2>
        <p>
          대운·세운 분석은 '이 시기에 무조건 이렇게 된다'가 아니라 '이 시기에 어떤 에너지가 강해지는가'를 파악하는 도구입니다. 구체적인 활용 예시는 다음과 같습니다.
        </p>
        <ul>
          <li>이직·창업: 용신 운이 겹치는 해에 시작하면 에너지가 실립니다.</li>
          <li>결혼: 관성(官星) 또는 재성(財星)이 강해지는 대운에서 인연이 만들어지기 쉽습니다.</li>
          <li>건강: 충 운이나 기신 운에는 무리한 활동보다 회복·충전을 우선합니다.</li>
          <li>투자: 금(金) 또는 수(水) 기운이 강해지는 시기와 내 일간의 관계를 파악해 타이밍을 고려합니다.</li>
        </ul>

        <div className="callout">
          <p style={{ margin: 0, fontSize: "0.85rem" }}>
            본 콘텐츠는 교육·오락 목적의 참고 자료입니다. 대운·세운 분석을 투자·의료·법률 결정의 근거로 사용하지 마세요. 중요한 결정은 반드시 전문가와 상담하세요.
          </p>
        </div>

        <h2>다음 단계</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {[
            { href: "/blog/2026-byeongoh-year", label: "2026 병오년 운세 흐름 →" },
            { href: "/guide/sinsal", label: "← 신살이란" },
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

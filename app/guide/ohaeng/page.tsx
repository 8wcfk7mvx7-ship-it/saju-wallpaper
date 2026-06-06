import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "오행이란 — 목·화·토·금·수의 의미와 상생·상극",
  description: "명리학의 근간인 오행(五行). 목·화·토·금·수 다섯 기운의 특성, 상생·상극 관계, 내 사주에서 오행 균형을 읽는 법을 설명합니다.",
};

const OHAENG = [
  {
    key: "목(木)",
    hanja: "木",
    color: "#4ade80",
    bg: "rgba(74,222,128,0.08)",
    border: "rgba(74,222,128,0.25)",
    season: "봄",
    dir: "동(東)",
    organ: "간장·담",
    trait: "성장·뻗음·창의",
    personality: "진취적이고 아이디어가 풍부합니다. 새로운 것을 시작하는 에너지가 강하지만 마무리가 약할 수 있습니다. 인정과 독립심이 강하고, 감정적으로 풍부합니다.",
    excess: "고집이 세지고 화를 잘 냅니다. 간·눈 관련 질환에 주의가 필요합니다.",
    lack: "결단력이 약해지고 무기력해질 수 있습니다. 의지력과 추진력을 키워야 합니다.",
  },
  {
    key: "화(火)",
    hanja: "火",
    color: "#f87171",
    bg: "rgba(248,113,113,0.08)",
    border: "rgba(248,113,113,0.25)",
    season: "여름",
    dir: "남(南)",
    organ: "심장·소장",
    trait: "확산·열정·표현",
    personality: "표현력과 카리스마가 뛰어납니다. 사람을 모으고 분위기를 주도하는 힘이 있습니다. 밝고 활기차지만 급하고 과장이 심할 수 있습니다.",
    excess: "충동적이고 집중력이 분산됩니다. 심장·혈압 관련 건강에 주의가 필요합니다.",
    lack: "소극적이 되고 열정이 식습니다. 사회성이 약해질 수 있어 적극적인 표현 연습이 필요합니다.",
  },
  {
    key: "토(土)",
    hanja: "土",
    color: "#fbbf24",
    bg: "rgba(251,191,36,0.08)",
    border: "rgba(251,191,36,0.25)",
    season: "환절기(사계절 끝)",
    dir: "중앙",
    organ: "비장·위장",
    trait: "안정·중재·포용",
    personality: "믿음직하고 포용력이 큽니다. 중재자 역할을 잘하며 꾸준하고 성실합니다. 변화를 싫어하고 고집이 세지만 책임감이 강합니다.",
    excess: "변화를 지나치게 거부하고 집착이 심해집니다. 소화기 질환에 주의가 필요합니다.",
    lack: "우유부단해지고 중심을 잡지 못합니다. 안정감을 주는 환경과 루틴을 만드는 것이 도움이 됩니다.",
  },
  {
    key: "금(金)",
    hanja: "金",
    color: "#e2e8f0",
    bg: "rgba(226,232,240,0.06)",
    border: "rgba(226,232,240,0.2)",
    season: "가을",
    dir: "서(西)",
    organ: "폐·대장",
    trait: "수렴·결실·원칙",
    personality: "냉철하고 원칙적입니다. 분석력이 뛰어나고 완벽주의 성향이 있습니다. 옳고 그름을 명확히 가리며, 감정보다 이성으로 판단합니다.",
    excess: "지나치게 냉정하고 고집이 강해집니다. 폐·피부 관련 건강에 주의가 필요합니다.",
    lack: "결단력이 부족하고 타인 의존성이 높아집니다. 자기 기준을 세우는 훈련이 필요합니다.",
  },
  {
    key: "수(水)",
    hanja: "水",
    color: "#93c5fd",
    bg: "rgba(147,197,253,0.08)",
    border: "rgba(147,197,253,0.25)",
    season: "겨울",
    dir: "북(北)",
    organ: "신장·방광",
    trait: "저장·지혜·유연",
    personality: "직관력과 지략이 뛰어납니다. 깊이 생각하고 유연하게 적응합니다. 감수성이 풍부하고 독립적이지만 고독을 즐기는 면이 있습니다.",
    excess: "지나치게 내성적이 되고 불안감이 높아집니다. 신장·방광 관련 건강에 주의가 필요합니다.",
    lack: "지구력이 부족하고 유연성이 떨어집니다. 두려움을 극복하는 훈련이 필요합니다.",
  },
];

export default function OhaengPage() {
  return (
    <article className="prose-guide">
      <style>{`
        .prose-guide h2 { font-size: 1.2rem; font-weight: 800; color: #fff; margin: 2rem 0 0.75rem; }
        .prose-guide p { font-size: 0.9375rem; line-height: 1.85; color: rgba(255,255,255,0.72); margin-bottom: 1rem; }
        .prose-guide ul { padding-left: 1.25rem; margin-bottom: 1rem; }
        .prose-guide li { font-size: 0.9375rem; line-height: 1.8; color: rgba(255,255,255,0.65); margin-bottom: 0.25rem; }
        .prose-guide .callout { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-left: 3px solid #c9a84c; border-radius: 10px; padding: 1rem 1.25rem; margin: 1.25rem 0; }
      `}</style>

      <div className="mb-8">
        <Link href="/guide" className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>← 가이드 목록</Link>
        <p className="text-xs font-semibold mt-4 mb-2 uppercase tracking-widest" style={{ color: "#c9a84c" }}>사주 기초</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">오행이란 — 목·화·토·금·수</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>읽는 시간: 약 6분 · 최종 수정: 2026.06</p>
      </div>

      <div className="prose-guide">
        <div className="callout">
          <p style={{ margin: 0 }}>
            <strong style={{ color: "#fff" }}>한 줄 요약:</strong> 오행(五行)은 우주와 자연, 그리고 사람의 기운을 목(木)·화(火)·토(土)·금(金)·수(水) 다섯 가지로 분류한 체계입니다. 사주 분석의 핵심은 내 팔자에 이 다섯 기운이 어떻게 분포해 있는지 파악하는 것입니다.
          </p>
        </div>

        <h2>왜 오행이 중요한가</h2>
        <p>
          사주 여덟 글자에는 각각 오행이 배정되어 있습니다. 어떤 기운이 많으면 그 기운의 특성이 성격과 삶에 강하게 드러나고, 부족한 기운이 있으면 그 부분에서 약점이나 과제가 나타납니다. 명리학에서는 이 균형을 분석해 '용신(用神)'—내게 필요한 기운—을 찾고, 그에 맞는 환경과 방향을 제안합니다.
        </p>

        <h2>다섯 가지 기운 상세</h2>
        <div className="space-y-4 my-6">
          {OHAENG.map(({ key, hanja, color, bg, border, season, dir, organ, trait, personality, excess, lack }) => (
            <div key={key} className="rounded-2xl p-5" style={{ background: bg, border: `1px solid ${border}` }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-3xl font-black" style={{ color }}>{hanja}</span>
                <div>
                  <p className="text-base font-black text-white mb-0">{key}</p>
                  <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>{season} · {dir} · {organ} · {trait}</p>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.7)" }}>{personality}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "rgba(0,0,0,0.2)" }}>
                  <span className="font-bold" style={{ color }}>과다 시: </span>
                  <span style={{ color: "rgba(255,255,255,0.55)" }}>{excess}</span>
                </div>
                <div className="rounded-xl px-3 py-2 text-xs" style={{ background: "rgba(0,0,0,0.2)" }}>
                  <span className="font-bold" style={{ color }}>부족 시: </span>
                  <span style={{ color: "rgba(255,255,255,0.55)" }}>{lack}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <h2>상생(相生) — 서로 낳는 관계</h2>
        <p>
          오행 사이에는 서로를 돕고 생성하는 상생 관계가 있습니다.
        </p>
        <div className="rounded-2xl p-4 my-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <p className="text-center text-base font-bold" style={{ color: "rgba(255,255,255,0.8)", letterSpacing: 4 }}>
            목 → 화 → 토 → 금 → 수 → 목
          </p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
            <p>• 목생화(木生火): 나무가 불을 키운다</p>
            <p>• 화생토(火生土): 불이 타면 재(토)가 된다</p>
            <p>• 토생금(土生金): 땅에서 금속이 나온다</p>
            <p>• 금생수(金生水): 금속에 이슬이 맺힌다</p>
            <p>• 수생목(水生木): 물이 나무를 키운다</p>
          </div>
        </div>

        <h2>상극(相克) — 서로 제어하는 관계</h2>
        <p>
          상극은 한 기운이 다른 기운을 억제하는 관계입니다. 이 관계를 통해 오행 전체의 균형이 유지됩니다.
        </p>
        <div className="rounded-2xl p-4 my-4" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
            <p>• 목극토(木克土): 나무뿌리가 땅을 뚫는다</p>
            <p>• 화극금(火克金): 불이 금속을 녹인다</p>
            <p>• 토극수(土克水): 흙이 물을 막는다</p>
            <p>• 금극목(金克木): 쇠가 나무를 자른다</p>
            <p>• 수극화(水克火): 물이 불을 끈다</p>
          </div>
        </div>

        <h2>내 사주에서 오행 균형 읽기</h2>
        <p>
          사주 여덟 글자를 오행으로 환산해 어떤 기운이 몇 개인지 세면 오행 분포를 파악할 수 있습니다. 특정 기운이 3개 이상이면 '과다', 0개면 '완전 부재'로 봅니다. 명리학에서는 이 불균형을 조율할 용신 기운을 찾아 삶의 방향과 환경 선택에 활용합니다.
        </p>

        <div className="callout">
          <p style={{ margin: 0, fontSize: "0.85rem" }}>
            본 콘텐츠는 교육·오락 목적의 참고 자료입니다. 건강·의료 결정의 근거로 사용하지 마세요.
          </p>
        </div>

        <h2>다음 단계</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {[
            { href: "/guide/cheongan-jiji", label: "천간·지지 →" },
            { href: "/guide/sinsal", label: "신살 →" },
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

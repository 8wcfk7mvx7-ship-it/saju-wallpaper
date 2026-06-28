import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "4살 차이 궁합 vs 6살 차이 궁합 — 띠 갭으로 보는 궁합 속설",
  description: "4살 차이는 궁합을 따로 볼 필요가 없다는 말과, 6살 차이가 오히려 안 좋다는 속설이 어디서 나왔는지 12지지 순환표로 설명합니다.",
};

const SAMHAP_GROUPS = [
  { el: "수(水)국", animals: ["쥐(자)", "용(진)", "원숭이(신)"] },
  { el: "화(火)국", animals: ["호랑이(인)", "말(오)", "개(술)"] },
  { el: "목(木)국", animals: ["토끼(묘)", "양(미)", "돼지(해)"] },
  { el: "금(金)국", animals: ["뱀(사)", "닭(유)", "소(축)"] },
];

const CHUNG_PAIRS = [
  ["쥐(자)", "말(오)"],
  ["소(축)", "양(미)"],
  ["호랑이(인)", "원숭이(신)"],
  ["토끼(묘)", "닭(유)"],
  ["용(진)", "개(술)"],
  ["뱀(사)", "돼지(해)"],
];

const ZODIAC_12 = ["쥐", "소", "호랑이", "토끼", "용", "뱀", "말", "양", "원숭이", "닭", "개", "돼지"];

export default function AgeGapPage() {
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
        <p className="text-xs font-semibold mt-4 mb-2 uppercase tracking-widest" style={{ color: "#c9a84c" }}>사주 속설 팩트체크</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">4살 차이는 궁합 볼 필요 없고, 6살 차이는 오히려 나쁘다?</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>읽는 시간: 약 5분 · 최종 수정: 2026.06</p>
      </div>

      <div className="prose-guide">
        <div className="callout">
          <p style={{ margin: 0 }}>
            <strong style={{ color: "#fff" }}>한 줄 요약:</strong> 두 속설 모두 12지지(띠)가 12년마다 한 바퀴 도는 순환 구조에서 나왔습니다. 4살 차이는 자동으로 같은 삼합(三合) 그룹에 들어가고, 6살 차이는 자동으로 정반대 충(沖) 관계에 들어가기 때문에 생긴 말입니다.
          </p>
        </div>

        <h2>띠는 12년 주기로 돌아간다</h2>
        <p>
          연지(年支), 즉 띠는 쥐·소·호랑이·토끼·용·뱀·말·양·원숭이·닭·개·돼지 12가지가 정해진 순서로 매년 하나씩 돌아갑니다. 그래서 띠 사이의 관계는 두 사람의 나이 차이(연도 차이)만으로도 어느 정도 예측이 됩니다.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem", margin: "1rem 0" }}>
          {ZODIAC_12.map((a, i) => (
            <div key={a} style={{
              flex: "1 0 60px", textAlign: "center", padding: "0.5rem 0.25rem",
              borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            }}>
              <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)" }}>{i}</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#fff" }}>{a}</div>
            </div>
          ))}
        </div>

        <h2>4살 차이 — 무조건 같은 삼합(三合) 그룹</h2>
        <p>
          12지지는 4칸씩 건너뛰는 네 그룹으로 나뉘는데, 이를 삼합(三合)이라 부릅니다. 같은 삼합 그룹에 속한 띠끼리는 기운이 서로 도와 자연스럽게 잘 맞는 관계로 봅니다. 그런데 띠가 12년 주기이다 보니, 나이 차이가 정확히 4살이면 두 사람은 항상 같은 삼합 그룹 안에 들어가게 됩니다. 이 구조적인 이유 때문에 "4살 차이는 따로 궁합 볼 필요도 없다"는 말이 퍼졌습니다.
        </p>
        <table>
          <thead><tr><th>삼합 그룹</th><th>띠 구성</th><th>나이 차이</th></tr></thead>
          <tbody>
            {SAMHAP_GROUPS.map(g => (
              <tr key={g.el}>
                <td><strong style={{ color: "#fff" }}>{g.el}</strong></td>
                <td>{g.animals.join(" · ")}</td>
                <td>4살 또는 8살</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p>
          예를 들어 쥐띠와 4살 차이가 나는 사람은 항상 용띠 또는 원숭이띠가 됩니다. 셋 다 같은 수(水)국 삼합 그룹이라 구조적으로 충돌이 없는 관계입니다.
        </p>

        <h2>6살 차이 — 무조건 정반대 충(沖) 관계</h2>
        <p>
          반대로 12지지에서 정확히 6칸 떨어진 띠끼리는 충(沖) 관계, 즉 정면으로 부딪히는 관계로 봅니다. 12년 주기에서 6은 정확히 반 바퀴이기 때문에, 나이 차이가 6살이면 두 사람의 띠는 항상 이 충 관계에 놓입니다. 그래서 "6살 차이는 오히려 안 좋다"는 속설이 나온 것입니다.
        </p>
        <table>
          <thead><tr><th>충(沖) 관계</th><th>나이 차이</th></tr></thead>
          <tbody>
            {CHUNG_PAIRS.map(([a, b]) => (
              <tr key={a}><td>{a} ↔ {b}</td><td>6살</td></tr>
            ))}
          </tbody>
        </table>

        <h2>그렇다면 6살 차이는 실제로도 나쁠까</h2>
        <p>
          충(沖) 관계는 무조건 나쁜 것이 아니라 자극과 긴장을 동반하는 관계입니다. 안정을 추구하는 두 사람이라면 마찰로 느껴지지만, 자극을 즐기는 두 사람이라면 오히려 강한 끌림과 케미로 작용하기도 합니다. 또한 이 속설은 연지(年支), 즉 띠 하나만으로 판단한 것이고, 실제 사주 궁합은 연주뿐 아니라 월주·일주·시주까지 네 기둥을 모두 비교해 합·충·형·파·해를 종합적으로 따져야 정확합니다.
        </p>

        <h2>4살 차이도 방심할 수는 없다</h2>
        <p>
          4살 차이가 삼합으로 묶인다는 것도 연지 하나만 보는 구조적 특징일 뿐입니다. 월주·일주·시주에서 충이나 형이 겹치면 4살 차이여도 갈등이 생길 수 있습니다. 띠 차이는 궁합을 보는 여러 단서 중 하나일 뿐, 그 자체로 결론을 내리기에는 부족합니다.
        </p>

        <div className="callout">
          <p style={{ margin: 0, fontSize: "0.85rem" }}>
            본 콘텐츠는 교육·오락 목적의 참고 자료입니다. 띠 나이 차이만으로 관계의 좋고 나쁨을 단정할 수 없으며, 정확한 궁합은 두 사람의 전체 사주를 함께 봐야 합니다.
          </p>
        </div>

        <h2>다음 단계</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {[
            { href: "/service/gunghap", label: "내 사주 궁합 전체 분석 →" },
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

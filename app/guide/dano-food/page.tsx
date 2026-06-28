import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "단오에 먹으면 좋은 음식 vs 피해야 할 음식 — 양기로 보는 단오 절식",
  description: "단오(음력 5월 5일)에 양기를 채워준다는 음식과 기운을 거스른다는 음식을 명리학 음양 논리와 실제 전통 절식으로 함께 정리합니다.",
};

const GOOD_FOODS = [
  { name: "수리취떡", reason: "쑥·수리취를 넣어 수레바퀴 모양으로 빚은 절편. 실제 단오 대표 절식으로, 따뜻한 성질의 재료로 양기를 보강한다고 봄" },
  { name: "앵두화채·앵두편", reason: "단오 무렵 익는 제철 과일. 맑고 새로운 기운을 들인다고 여겨 단오 절식으로 꼽힘" },
  { name: "제호탕", reason: "오미자·인삼 등을 달여 만든 전통 음료. 더위로 지친 기운을 보충해 여름 양기를 다스린다는 의미" },
  { name: "준치탕·준치만두", reason: "준치를 따뜻하게 익혀 먹는 절식. 날것으로 먹는 생선회와 달리 익혀 먹어 찬 기운을 누르지 않는다고 봄" },
  { name: "삼계탕·따뜻한 국밥", reason: "지친 기운을 보충하고 몸의 양기를 채워준다고 여겨지는 음식" },
  { name: "계란·갓 지은 따뜻한 밥", reason: "새로운 시작의 기운, 묵은 기운을 비우고 새 기운을 들인다는 의미로 꼽힘" },
  { name: "김밥·비빔밥·잔치국수", reason: "여러 재료가 한 그릇에 섞이거나 길게 이어지는 형태라 흩어진 복을 모으고 인연을 길게 잇는다는 의미로 연결됨" },
  { name: "제철 과일", reason: "맑고 새로운 기운을 들인다고 보아 권장되는 음식" },
];

const AVOID_FOODS = [
  { name: "빙수·냉면 등 찬 음식", reason: "양기가 들어오는 것을 차갑게 식히거나 깎는다고 봄" },
  { name: "생선회·육회 등 날것", reason: "찬 기운이 도는 음식이라 양기의 흐름을 방해한다고 봄 (같은 재료라도 따뜻하게 익히면 절식으로 분류되는 경우가 많음)" },
  { name: "술", reason: "맑은 기운을 흐리고 판단력을 떨어뜨린다고 여겨짐" },
  { name: "야식·먹다 남긴 음식", reason: "밤에 들어오는 복을 막거나, 묵은·탁한 기운이 남아있다고 봄" },
  { name: "탄산음료", reason: "기운을 들뜨게 해 차분히 쌓여야 할 재물운이 샌다고 여겨짐" },
  { name: "탄 음식", reason: "막힌 기운과 구설을 부른다고 봄" },
  { name: "남과 나눠 먹던 음식", reason: "상대의 기운이 섞여 들어온다고 여겨짐" },
  { name: "장아찌 등 오래 묵힌 발효 음식", reason: "묵은 기운이 새로 들어오는 양의 기운을 방해한다고 봄" },
  { name: "유통기한 임박·오래 둔 냉장·냉동 음식", reason: "끝나가는 기운이 함께 들어온다고 여겨짐" },
  { name: "지나치게 기름진 음식", reason: "무겁고 탁한 기운을 들인다고 봄" },
];

export default function DanoFoodPage() {
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
        <p className="text-xs font-semibold mt-4 mb-2 uppercase tracking-widest" style={{ color: "#c9a84c" }}>사주 명리학 속 절기 풍습</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">단오에 먹으면 좋은 음식과 피해야 할 음식</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>읽는 시간: 약 6분</p>
      </div>

      <div className="prose-guide">
        <div className="callout">
          <p style={{ margin: 0 }}>
            <strong style={{ color: "#fff" }}>한 줄 요약:</strong> 단오(음력 5월 5일)는 1년 중 양기가 가장 강한 날로 여겨집니다. 그래서 음식도 양기를 보강하는 따뜻하고 맑은 음식을 권하고, 양기를 깎거나 흐리는 차갑고 탁한 음식은 피하라는 풍습이 전해집니다.
          </p>
        </div>

        <h2>왜 단오에 음식을 가린다고 할까</h2>
        <p>
          명리학에서 단오는 양(陽)의 기운이 1년 중 가장 높이 차오르는 날로 봅니다. 음력 5월 5일이라는 날짜 자체도 양수(홀수)가 겹치는 날이라 양기가 강하다고 해석합니다. 이날 들어오는 양기를 잘 받아들이느냐, 차갑고 탁한 기운으로 깎아 먹느냐에 따라 그 해 남은 기간의 흐름이 달라진다는 것이 이 풍습의 핵심 논리입니다.
        </p>

        <h2>양기를 채워준다는 음식</h2>
        <table>
          <thead><tr><th>음식</th><th>이유</th></tr></thead>
          <tbody>
            {GOOD_FOODS.map(f => (
              <tr key={f.name}><td><strong style={{ color: "#fff" }}>{f.name}</strong></td><td>{f.reason}</td></tr>
            ))}
          </tbody>
        </table>

        <h2>양기를 거스른다는 음식</h2>
        <table>
          <thead><tr><th>음식</th><th>이유</th></tr></thead>
          <tbody>
            {AVOID_FOODS.map(f => (
              <tr key={f.name}><td><strong style={{ color: "#fff" }}>{f.name}</strong></td><td>{f.reason}</td></tr>
            ))}
          </tbody>
        </table>

        <h2>같은 재료도 조리법에 따라 갈린다 — 준치와 생선회</h2>
        <p>
          흥미로운 점은 생선 자체가 무조건 피해야 할 음식으로 분류되지는 않는다는 것입니다. 실제 단오 전통 절식 중에는 준치를 따뜻하게 끓인 준치탕과 준치만두가 있습니다. 같은 생선이라도 차갑게 날것으로 먹는 회는 찬 기운으로, 따뜻하게 익혀 먹는 탕이나 만두는 양기를 보강하는 음식으로 구분되는 것입니다. 이 풍습에서 음식을 가르는 기준은 재료 자체보다 음(陰)과 양(陽)의 성질, 즉 차가운지 따뜻한지에 더 가깝습니다.
        </p>

        <h2>실제 전통 절식 더 살펴보기</h2>
        <p>
          수리취떡은 쑥이나 수리취를 넣어 수레바퀴 모양으로 빚은 절편으로, 둥근 모양이 수레바퀴를 닮아 '수리'라는 이름이 붙었습니다. 앵두화채와 앵두편은 단오 무렵 제철로 익는 앵두를 활용한 음식입니다. 제호탕은 오미자·인삼 등 약재를 달여 만든 음료로, 여름 더위로부터 몸을 보호한다는 의미에서 단오부터 여름 내내 마셨다고 전해집니다. 이 음식들은 모두 따뜻하거나 맑은 성질을 가졌다는 공통점이 있어, 양기를 보강한다는 풍습의 논리와도 맞아떨어집니다.
        </p>

        <h2>결론적으로 무엇을 먹으면 될까</h2>
        <p>
          정리하면 단오 음식 풍습의 기준은 따뜻함과 맑음입니다. 갓 지은 따뜻한 밥, 익혀서 먹는 국물 음식, 그날 새로 만든 깨끗한 음식을 고르고, 차갑거나 날것이거나 오래 묵은 음식, 남이 먹던 음식을 피하면 이 풍습의 취지에 맞게 단오를 보낼 수 있습니다.
        </p>

        <div className="callout">
          <p style={{ margin: 0, fontSize: "0.85rem" }}>
            본 콘텐츠는 명리학 음양 논리와 전통 절기 풍습을 바탕으로 정리한 참고 자료이며, 의학적·영양학적 권고가 아닙니다.
          </p>
        </div>

        <h2>다음 단계</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {[
            { href: "/guide/ohaeng", label: "오행이란 — 목·화·토·금·수 →" },
            { href: "/service/fengshui", label: "생활 속 풍수 이야기 →" },
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

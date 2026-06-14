"use client";
import { useState } from "react";
import ShareImageButton from "@/components/ShareImageButton";

type CategoryFilter = "전체" | "침실" | "재물" | "배치";

const ARTICLES: {
  id: number;
  title: string;
  summary: string;
  content: string;
  category: CategoryFilter[];
}[] = [
  {
    id: 1,
    title: "침실 머리 방향의 비밀",
    summary: "창문 방향으로 머리를 두면 기운이 빠져나간다",
    content:
      "창문은 기(氣)가 드나드는 통로입니다. 잠자는 동안 머리가 창문을 향하면 깊은 잠을 자기 어렵고 에너지가 회복되지 않습니다. 북쪽이나 동쪽으로 머리를 향해 자는 것이 가장 좋습니다. 특히 자시(子時·밤 11시~새벽 1시)에 자는 방향이 중요합니다.",
    category: ["침실"],
  },
  {
    id: 2,
    title: "현관 정리의 법칙",
    summary: "신발이 어지럽혀져 있으면 재물운이 막힌다",
    content:
      "현관은 집의 기운이 들어오는 첫 관문입니다. 신발이 뒤집혀 있거나 정리되지 않으면 좋은 기운이 집 안으로 들어오지 못합니다. 외출 후 귀가하면 신발은 반드시 코가 안쪽을 향하게 정리하세요.",
    category: ["재물", "배치"],
  },
  {
    id: 3,
    title: "침대 위치의 풍수",
    summary: "문을 바로 마주 보는 침대 배치는 피하라",
    content:
      "침대가 문과 정면으로 마주보면 관살(官殺)의 기운이 강해져 수면의 질이 낮아집니다. 침대는 문에서 대각선 방향에 두되, 발이 문 쪽을 향하지 않게 하세요. 누웠을 때 문이 보이는 위치가 가장 이상적입니다.",
    category: ["침실", "배치"],
  },
  {
    id: 4,
    title: "부엌과 재물운",
    summary: "부엌이 지저분하면 재물이 새나간다",
    content:
      "부엌은 먹고 사는 것, 즉 생계와 재물을 상징합니다. 가스레인지 위는 항상 깨끗하게, 싱크대에 그릇이 쌓이지 않게 하세요. 냉장고에 오래된 음식이 가득하면 새로운 복이 들어올 공간이 없습니다.",
    category: ["재물"],
  },
  {
    id: 5,
    title: "거울의 풍수",
    summary: "침실에 큰 거울은 기운을 흩뜨린다",
    content:
      "거울은 기운을 반사시킵니다. 침실에 큰 거울이 있으면 자는 동안 에너지가 분산되어 숙면을 방해합니다. 특히 거울이 침대를 정면으로 비추는 배치는 피하세요. 거울은 현관이나 욕실에 두는 것이 좋습니다.",
    category: ["침실", "배치"],
  },
  {
    id: 6,
    title: "금전운 오행 아이템",
    summary: "내 사주 오행으로 돈을 부르는 아이템이 다르다",
    content: `• 금전운 부족한 사람(재성 약한 사주): 장지갑 — 돈이 머무는 공간을 넓혀줍니다. 노란색·황금색 지갑이 좋습니다.
• 토기운 부족한 사람(토 오행 약): 도자기 저금통 — 흙의 기운으로 재물을 모아줍니다. 갈색·베이지색 도자기가 좋습니다.
• 목기운 부족한 사람: 나무 소품·화분 — 성장하는 기운을 보완합니다.
• 화기운 부족한 사람: 붉은색 조명·캔들 — 활기와 명예운을 더해줍니다.
• 수기운 부족한 사람: 어항·분수 소품 — 흐르는 물처럼 기회가 들어옵니다.
• 금기운 부족한 사람: 금속 소품·시계 — 결단력과 수확의 기운을 보강합니다.`,
    category: ["재물"],
  },
  {
    id: 7,
    title: "공부방·작업실 방위",
    summary: "책상은 북쪽 벽을 바라보게 두어라",
    content:
      "북쪽은 수(水)의 방위로 지혜와 집중을 상징합니다. 책상이 북쪽을 향하도록 배치하면 집중력이 높아집니다. 창문이 북쪽에 있다면 빛이 들어와 공부에 방해가 될 수 있으니, 동쪽을 향하는 것이 차선책입니다.",
    category: ["배치"],
  },
];

const CATEGORIES: { key: CategoryFilter; label: string }[] = [
  { key: "전체", label: "전체" },
  { key: "침실", label: "침실" },
  { key: "재물", label: "재물" },
  { key: "배치", label: "배치" },
];

export default function FengshuiPage() {
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>("전체");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const filtered =
    activeCategory === "전체"
      ? ARTICLES
      : ARTICLES.filter((a) => a.category.includes(activeCategory));

  function toggle(id: number) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <main
      className="min-h-screen text-white"
      style={{ background: "#06060e" }}
    >
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full blur-[180px]"
          style={{ background: "rgba(101,163,13,0.07)" }}
        />
        <div
          className="absolute bottom-[-5%] right-[-5%] w-[500px] h-[500px] rounded-full blur-[200px]"
          style={{ background: "rgba(101,163,13,0.05)" }}
        />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-12" id="fengshui-result">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold mb-4"
            style={{
              background: "rgba(101,163,13,0.1)",
              border: "1px solid rgba(101,163,13,0.25)",
              color: "#84cc16",
            }}>
            <span>🏮</span>
            <span>무료로 읽는 풍수 지혜</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">풍수지리 이야기</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>
            집을 바꾸면 운이 바뀐다 — 침실·현관·부엌·책상 배치의 비밀
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex gap-2 flex-wrap justify-center mb-8">
          {CATEGORIES.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => {
                setActiveCategory(key);
                setExpandedId(null);
              }}
              className="px-4 py-1.5 rounded-full text-sm font-bold transition-all"
              style={
                activeCategory === key
                  ? {
                      background: "rgba(101,163,13,0.25)",
                      border: "1px solid rgba(101,163,13,0.5)",
                      color: "#a3e635",
                    }
                  : {
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.5)",
                    }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Article List */}
        <div className="flex flex-col gap-3">
          {filtered.map((article) => {
            const isOpen = expandedId === article.id;
            return (
              <div
                key={article.id}
                className="rounded-2xl overflow-hidden transition-all"
                style={{
                  background: isOpen
                    ? "rgba(101,163,13,0.07)"
                    : "rgba(255,255,255,0.03)",
                  border: isOpen
                    ? "1px solid rgba(101,163,13,0.3)"
                    : "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {/* Card Header — clickable */}
                <button
                  onClick={() => toggle(article.id)}
                  className="w-full text-left px-5 py-4 flex items-start gap-4"
                >
                  {/* Number badge */}
                  <span
                    className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black mt-0.5"
                    style={{
                      background: isOpen
                        ? "rgba(101,163,13,0.3)"
                        : "rgba(255,255,255,0.07)",
                      color: isOpen ? "#a3e635" : "rgba(255,255,255,0.4)",
                    }}
                  >
                    {article.id}
                  </span>

                  <div className="flex-1 min-w-0">
                    <h2 className="text-[15px] font-black text-white leading-tight">
                      {article.title}
                    </h2>
                    <p
                      className="text-xs mt-1 leading-snug"
                      style={{ color: isOpen ? "#84cc16" : "rgba(255,255,255,0.45)" }}
                    >
                      {article.summary}
                    </p>
                  </div>

                  {/* Expand chevron */}
                  <span
                    className="shrink-0 text-xs transition-transform duration-300"
                    style={{
                      color: "rgba(255,255,255,0.3)",
                      transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  >
                    ▼
                  </span>
                </button>

                {/* Expanded content */}
                {isOpen && (
                  <div
                    className="px-5 pb-5"
                    style={{ borderTop: "1px solid rgba(101,163,13,0.15)" }}
                  >
                    <p
                      className="text-sm leading-relaxed mt-4 whitespace-pre-line"
                      style={{ color: "rgba(255,255,255,0.75)" }}
                    >
                      {article.content}
                    </p>
                    {/* Category tags */}
                    <div className="flex gap-1.5 mt-4 flex-wrap">
                      {article.category.map((cat) => (
                        <span
                          key={cat}
                          className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                          style={{
                            background: "rgba(101,163,13,0.12)",
                            border: "1px solid rgba(101,163,13,0.25)",
                            color: "#84cc16",
                          }}
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p
          className="text-center text-xs mt-10"
          style={{ color: "rgba(255,255,255,0.2)" }}
        >
          풍수지리는 동양의 전통 지혜입니다. 참고용으로 활용하세요.
        </p>
        <ShareImageButton targetId="fengshui-result" fileName="풍수" />
      </div>
    </main>
  );
}

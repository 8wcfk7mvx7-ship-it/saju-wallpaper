"use client";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

const BOOKS = [
  {
    category: "사주·명리",
    emoji: "🔮",
    title: "내 사주의 진실",
    subtitle: "팔자를 알면 인생이 보인다",
    desc: "타고난 오행 에너지와 일간의 특성을 쉽고 깊게 풀어낸 입문서. 복잡한 명리학 이론 없이 내 사주를 스스로 읽는 법을 알려줍니다.",
    status: "준비 중",
    color: "#a78bfa",
  },
  {
    category: "운명·대운",
    emoji: "🌊",
    title: "대운의 파도를 타라",
    subtitle: "10년 단위 흐름을 읽는 사람만 성공한다",
    desc: "대운·세운·교운기를 실생활에 적용하는 방법. 언제 투자하고, 언제 쉬어야 하는지 — 타이밍의 철학을 담았습니다.",
    status: "준비 중",
    color: "#60a5fa",
  },
  {
    category: "연애·관계",
    emoji: "💑",
    title: "우리 사주가 맞을까",
    subtitle: "원진살과 합충으로 보는 관계의 진실",
    desc: "사주로 보는 궁합의 과학. 왜 어떤 사람과는 죽이 맞고, 어떤 사람과는 에너지를 빼앗기는지 — 관계의 역학을 분석합니다.",
    status: "준비 중",
    color: "#f9a8d4",
  },
  {
    category: "오행·개운",
    emoji: "🌿",
    title: "오행으로 집을 꾸미다",
    subtitle: "공간에 사주 에너지를 채우는 인테리어 가이드",
    desc: "용신 오행에 맞는 색깔, 방향, 소품, 식물 배치법. 집이 달라지면 기운도 달라집니다.",
    status: "기획 중",
    color: "#4ade80",
  },
];

const GENRES = [
  { icon: "🔮", label: "명리·사주" },
  { icon: "🌿", label: "오행·풍수" },
  { icon: "💑", label: "관계·궁합" },
  { icon: "📈", label: "운명·대운" },
  { icon: "✨", label: "자기계발" },
  { icon: "🏛️", label: "동양철학" },
];

export default function PublishPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#06060e] text-white">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full blur-[200px]" style={{ background: "rgba(201,168,76,0.08)" }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full blur-[180px]" style={{ background: "rgba(139,92,246,0.06)" }} />
      </div>

      {/* 헤더 */}
      <div className="sticky top-0 z-40 border-b backdrop-blur-xl"
        style={{ background: "rgba(6,6,14,0.9)", borderColor: "rgba(255,255,255,0.07)" }}>
        <div className="max-w-3xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/")} className="text-gray-600 hover:text-gray-400 transition text-sm">← 홈</button>
            <div className="w-px h-4" style={{ background: "rgba(255,255,255,0.1)" }} />
            <span className="text-xs font-bold" style={{ color: "#c9a84c" }}>여름궁전 출판사</span>
          </div>
          <a href="mailto:smple@outlook.kr"
            className="text-xs px-3 py-1.5 rounded-lg transition"
            style={{ background: "rgba(201,168,76,0.12)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.25)" }}>
            출판 문의
          </a>
        </div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-5 pb-24">

        {/* 히어로 */}
        <section className="py-16 sm:py-20">
          <div className="inline-flex items-center gap-2 mb-5 px-3 py-1 rounded-full"
            style={{ background: "rgba(201,168,76,0.08)", border: "1px solid rgba(201,168,76,0.2)" }}>
            <span className="text-xs font-bold" style={{ color: "#c9a84c" }}>📚 SUMMER PALACE BOOKS</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black mb-5 leading-tight">
            여름궁전<br />
            <span style={{ color: "#c9a84c" }}>출판사</span>
          </h1>
          <p className="text-base sm:text-lg leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.55)" }}>
            동양 철학과 현대적 삶의 교차점에서<br />
            진짜 쓸모 있는 책을 만듭니다.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
            사주·명리·오행·풍수를 어렵게 가르치지 않습니다.<br />
            당신이 오늘 당장 써먹을 수 있는 지식으로 만들어 드립니다.
          </p>
        </section>

        {/* 장르 태그 */}
        <section className="mb-14">
          <div className="flex flex-wrap gap-2">
            {GENRES.map(g => (
              <span key={g.label}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }}>
                {g.icon} {g.label}
              </span>
            ))}
          </div>
        </section>

        {/* 출판 예정 도서 */}
        <section className="mb-16">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: "#c9a84c" }}>UPCOMING TITLES</p>
              <h2 className="text-xl font-black text-white">출판 예정 도서</h2>
            </div>
          </div>

          <div className="space-y-4">
            {BOOKS.map((book, i) => (
              <div key={i} className="rounded-2xl p-6 relative overflow-hidden group"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{ background: `radial-gradient(ellipse at top left, ${book.color}0a 0%, transparent 70%)` }} />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{book.emoji}</span>
                      <div>
                        <span className="text-xs px-2 py-0.5 rounded-full mb-1 inline-block"
                          style={{ background: `${book.color}18`, color: book.color, border: `1px solid ${book.color}35` }}>
                          {book.category}
                        </span>
                        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{book.subtitle}</p>
                      </div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full shrink-0"
                      style={{
                        background: book.status === "준비 중" ? "rgba(251,191,36,0.1)" : "rgba(148,163,184,0.1)",
                        color: book.status === "준비 중" ? "#fbbf24" : "#94a3b8",
                        border: book.status === "준비 중" ? "1px solid rgba(251,191,36,0.25)" : "1px solid rgba(148,163,184,0.2)",
                      }}>
                      {book.status}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-white mb-3">{book.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{book.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 원고 투고 */}
        <section className="mb-16">
          <div className="rounded-2xl p-7 sm:p-9"
            style={{ background: "linear-gradient(135deg, rgba(201,168,76,0.08) 0%, rgba(139,92,246,0.06) 100%)", border: "1px solid rgba(201,168,76,0.2)" }}>
            <p className="text-xs font-bold mb-2" style={{ color: "#c9a84c" }}>MANUSCRIPT SUBMISSION</p>
            <h3 className="text-2xl font-black text-white mb-4">원고를 투고하세요</h3>
            <div className="space-y-3 mb-6">
              {[
                { icon: "📚", title: "출판 분야", desc: "동양 철학, 명리학, 오행, 풍수, 사주, 관련 자기계발" },
                { icon: "✍️", title: "투고 방법", desc: "이메일로 원고 또는 기획안을 보내주세요" },
                { icon: "⏱️", title: "검토 기간", desc: "접수 후 2주 이내 회신 드립니다" },
                { icon: "🤝", title: "계약 조건", desc: "저자 친화적인 조건으로 계약합니다" },
              ].map(item => (
                <div key={item.title} className="flex items-start gap-3">
                  <span className="text-lg shrink-0">{item.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-white">{item.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <a href="mailto:smple@outlook.kr"
              className="inline-flex items-center gap-2 font-bold text-sm px-6 py-3 rounded-xl transition-all hover:scale-105"
              style={{ background: "rgba(201,168,76,0.15)", color: "#e8c97a", border: "1px solid rgba(201,168,76,0.3)" }}>
              📧 smple@outlook.kr로 투고하기
            </a>
          </div>
        </section>

        {/* 출판사 소개 */}
        <section className="mb-14">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { num: "2026", label: "설립 연도", icon: "🏛️" },
              { num: "동양철학 × AI", label: "출판 방향성", icon: "🔮" },
              { num: "summerpalace.ai.kr", label: "연계 서비스", icon: "🌐" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-5 text-center"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                <span className="text-3xl mb-2 block">{s.icon}</span>
                <p className="font-black text-white text-sm">{s.num}</p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 편집 방침 */}
        <section className="mb-16">
          <div className="space-y-1 py-6 border-y" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
            {[
              "어렵게 가르치지 않습니다. 당장 쓸 수 있어야 합니다.",
              "이론보다 사례. 역사보다 지금 내 삶에 적용하는 방법.",
              "독자가 책을 덮는 순간 삶이 달라져야 합니다.",
              "동양 철학의 깊이를 현대 언어로 번역합니다.",
            ].map((p, i) => (
              <div key={i} className="flex items-start gap-3 py-3">
                <span className="text-xs font-black mt-0.5" style={{ color: "#c9a84c" }}>0{i + 1}</span>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>{p}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 하단 CTA */}
        <section className="text-center pb-6">
          <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>
            Summer Palace · 여름궁전 출판사<br />
            smple@outlook.kr
          </p>
          <button onClick={() => router.push("/")}
            className="text-xs px-5 py-2.5 rounded-xl transition"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>
            AI 사주 서비스 바로가기 →
          </button>
        </section>
      </div>
    </main>
  );
}

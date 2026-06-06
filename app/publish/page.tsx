"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export const dynamic = "force-dynamic";

const SERVICES = [
  { emoji: "🔮", title: "사주 분석", desc: "오행·일간·용신 완전 분석", href: "/service/saju" },
  { emoji: "🌊", title: "대운·세운", desc: "10년 단위 인생 흐름", href: "/service/daewoon" },
  { emoji: "💑", title: "궁합 분석", desc: "원진·합충·오행 궁합", href: "/service/gunghap" },
  { emoji: "✨", title: "매력 분석", desc: "일간별 타고난 매력", href: "/service/charm" },
  { emoji: "🗺️", title: "도시 추천", desc: "용신 오행 맞춤 거주지", href: "/service/place" },
  { emoji: "📈", title: "투자 성향", desc: "사주로 보는 투자 DNA", href: "/service/stock" },
];

const BOOKS = [
  {
    emoji: "🔮", category: "사주·명리",
    title: "내 사주의 진실",
    subtitle: "팔자를 알면 인생이 보인다",
    desc: "오행 에너지와 일간의 특성을 현대적 언어로 풀어낸 명리 입문서.",
    color: "#a78bfa", status: "준비 중",
  },
  {
    emoji: "🌊", category: "운명·대운",
    title: "대운의 파도를 타라",
    subtitle: "10년 단위 흐름을 읽는 사람만 성공한다",
    desc: "대운·세운·교운기를 실생활에 적용하는 방법. 언제 투자하고 쉬어야 하는지.",
    color: "#60a5fa", status: "준비 중",
  },
  {
    emoji: "💑", category: "연애·관계",
    title: "우리 사주가 맞을까",
    subtitle: "원진살과 합충으로 보는 관계의 진실",
    desc: "사주로 보는 궁합의 과학. 어떤 사람과 에너지가 맞고 빼앗기는지.",
    color: "#f9a8d4", status: "준비 중",
  },
  {
    emoji: "🌿", category: "오행·개운",
    title: "오행으로 집을 꾸미다",
    subtitle: "공간에 사주 에너지를 채우는 인테리어 가이드",
    desc: "용신 오행에 맞는 색깔, 방향, 소품, 식물 배치법.",
    color: "#4ade80", status: "기획 중",
  },
];

export default function PublishPage() {
  const router = useRouter();
  const [publishOpen, setPublishOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#06060e] text-white">
      {/* 배경 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-30%] left-[10%] w-[800px] h-[800px] rounded-full blur-[220px]" style={{ background: "rgba(201,168,76,0.05)" }} />
        <div className="absolute bottom-[-20%] right-[5%] w-[600px] h-[600px] rounded-full blur-[180px]" style={{ background: "rgba(139,92,246,0.04)" }} />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto px-6">

        {/* ─── 헤더 ─── */}
        <header className="pt-12 pb-4 flex items-center justify-between">
          <button onClick={() => router.push("/")} className="flex items-center gap-2.5">
            <span className="text-xl" style={{ color: "#c9a84c" }}>☯</span>
            <div>
              <p className="text-sm font-black tracking-tight text-white">Summer Palace</p>
              <p className="text-[10px] font-medium" style={{ color: "rgba(201,168,76,0.7)" }}>AI 사주 · 동양철학</p>
            </div>
          </button>
          <span className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)" }}>
            summerpalace.ai.kr
          </span>
        </header>

        {/* 구분선 */}
        <div className="h-px mb-14" style={{ background: "rgba(255,255,255,0.06)" }} />

        {/* ─── 메인 히어로 ─── */}
        <section className="mb-16">
          <p className="text-xs tracking-[0.2em] font-semibold mb-5 uppercase" style={{ color: "rgba(201,168,76,0.55)" }}>
            Summer Palace · 여름궁전
          </p>
          <h1 className="text-5xl sm:text-6xl font-black leading-[1.05] tracking-tight mb-7">
            사주를<br />
            <span style={{
              background: "linear-gradient(135deg, #c9a84c 0%, #e8d08a 50%, #c9a84c 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              다시 읽다
            </span>
          </h1>
          <p className="text-base leading-[1.9] mb-10 max-w-sm" style={{ color: "rgba(255,255,255,0.42)" }}>
            오행·일간·대운·용신을 AI로 분석합니다.<br />
            복잡한 이론 없이, 오늘 당장 쓸 수 있는<br />
            동양 철학의 언어로.
          </p>
          <button
            onClick={() => router.push("/service/saju")}
            className="inline-flex items-center gap-3 font-black text-sm px-7 py-3.5 rounded-2xl transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: "linear-gradient(135deg, #c9a84c 0%, #d4a843 100%)",
              color: "#06060e",
              boxShadow: "0 8px 32px rgba(201,168,76,0.25)",
            }}>
            ☯ 내 사주 분석하기
          </button>
        </section>

        {/* ─── 서비스 ─── */}
        <section className="mb-16">
          <p className="text-[10px] tracking-[0.25em] font-bold uppercase mb-5" style={{ color: "rgba(255,255,255,0.18)" }}>
            Services
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {SERVICES.map(s => (
              <button key={s.href} onClick={() => router.push(s.href)}
                className="text-left p-4 rounded-2xl transition-all hover:bg-white/[0.055] group"
                style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.065)" }}>
                <span className="text-xl mb-2.5 block">{s.emoji}</span>
                <p className="text-sm font-bold text-white mb-0.5 group-hover:text-amber-300 transition-colors">{s.title}</p>
                <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>{s.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* ─── 스테이트먼트 ─── */}
        <section className="mb-16">
          <div className="py-8 border-y space-y-6" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            {[
              { n: "01", t: "사주를 어렵게 설명하지 않습니다. 오늘 내 삶에 적용할 수 있어야 합니다." },
              { n: "02", t: "이론보다 사례. 데이터보다 통찰. 복잡한 용어보다 명확한 언어." },
              { n: "03", t: "동양 철학 5000년의 지혜를 현대 AI 기술로 다시 씁니다." },
            ].map(item => (
              <div key={item.n} className="flex items-start gap-5">
                <span className="text-xs font-black mt-0.5 shrink-0 tabular-nums" style={{ color: "rgba(201,168,76,0.4)" }}>{item.n}</span>
                <p className="text-sm leading-loose" style={{ color: "rgba(255,255,255,0.4)" }}>{item.t}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── 출판사 토글 ─── */}
        <section className="mb-4">
          <button
            onClick={() => setPublishOpen(v => !v)}
            className="group flex items-center gap-2.5 text-[11px] transition-all hover:opacity-60 py-1"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            <span
              className="transition-transform duration-200"
              style={{ transform: publishOpen ? "rotate(90deg)" : "rotate(0deg)", display: "inline-block" }}>
              ›
            </span>
            <span className="tracking-[0.2em] uppercase font-semibold">출판사 소개</span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold"
              style={{ background: "rgba(201,168,76,0.1)", color: "rgba(201,168,76,0.55)", border: "1px solid rgba(201,168,76,0.15)" }}>
              BOOKS
            </span>
          </button>
        </section>

        {/* ─── 출판사 섹션 (펼침) ─── */}
        {publishOpen && (
          <section className="mb-16 pt-8 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>

            <div className="mb-8">
              <p className="text-[10px] tracking-[0.25em] font-bold uppercase mb-4" style={{ color: "rgba(201,168,76,0.45)" }}>
                Summer Palace Books
              </p>
              <h2 className="text-2xl font-black text-white mb-2">여름궁전 출판사</h2>
              <p className="text-sm leading-loose" style={{ color: "rgba(255,255,255,0.38)" }}>
                동양 철학과 현대적 삶의 교차점에서<br />진짜 쓸모 있는 책을 만듭니다.
              </p>
            </div>

            {/* 도서 목록 */}
            <div className="mb-8">
              <p className="text-[10px] tracking-[0.2em] font-bold uppercase mb-4" style={{ color: "rgba(255,255,255,0.18)" }}>
                Upcoming Titles
              </p>
              <div className="space-y-2.5">
                {BOOKS.map((book, i) => (
                  <div key={i} className="p-5 rounded-2xl"
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.055)" }}>
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{book.emoji}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: `${book.color}12`, color: book.color, border: `1px solid ${book.color}28` }}>
                          {book.category}
                        </span>
                      </div>
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)" }}>{book.status}</span>
                    </div>
                    <h3 className="text-base font-black text-white mb-1">{book.title}</h3>
                    <p className="text-[10px] mb-1.5" style={{ color: "rgba(255,255,255,0.28)" }}>{book.subtitle}</p>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>{book.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 원고 투고 */}
            <div className="p-5 rounded-2xl"
              style={{ background: "rgba(201,168,76,0.04)", border: "1px solid rgba(201,168,76,0.12)" }}>
              <p className="text-[10px] tracking-widest uppercase font-bold mb-2" style={{ color: "rgba(201,168,76,0.45)" }}>
                Manuscript
              </p>
              <h3 className="text-base font-black text-white mb-2">원고 투고</h3>
              <p className="text-xs leading-loose mb-4" style={{ color: "rgba(255,255,255,0.38)" }}>
                동양 철학, 명리학, 사주, 오행, 풍수 관련 원고 및 기획안을 이메일로 보내주세요. 접수 후 2주 이내 회신 드립니다.
              </p>
              <a href="mailto:smple@outlook.kr"
                className="inline-flex items-center gap-2 text-xs font-bold px-4 py-2 rounded-xl transition-all hover:opacity-75"
                style={{ background: "rgba(201,168,76,0.1)", color: "#c9a84c", border: "1px solid rgba(201,168,76,0.2)" }}>
                📧 smple@outlook.kr
              </a>
            </div>
          </section>
        )}

        {/* ─── 푸터 ─── */}
        <footer className="border-t py-10" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-black" style={{ color: "rgba(255,255,255,0.35)" }}>
                Summer Palace · 여름궁전
              </p>
              <p className="text-[10px] mt-0.5" style={{ color: "rgba(255,255,255,0.18)" }}>
                smple@outlook.kr · summerpalace.ai.kr · 대표 정다정
              </p>
            </div>
            <button onClick={() => router.push("/")}
              className="text-[11px] px-4 py-2 rounded-xl transition-all hover:bg-white/6"
              style={{ color: "rgba(255,255,255,0.28)", border: "1px solid rgba(255,255,255,0.07)" }}>
              AI 사주 →
            </button>
          </div>
        </footer>

      </div>
    </main>
  );
}

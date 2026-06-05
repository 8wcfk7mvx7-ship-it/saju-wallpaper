import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "사주팔자란 무엇인가 — 사주 기초 완전 가이드",
  description: "사주팔자(四柱八字)의 의미, 연주·월주·일주·시주 네 기둥 구성, 천간·지지 여덟 글자가 나타내는 것을 기초부터 설명합니다.",
};

export default function SajuBasicsPage() {
  return (
    <article className="prose-guide">
      <style>{`
        .prose-guide h2 { font-size: 1.2rem; font-weight: 800; color: #fff; margin: 2rem 0 0.75rem; }
        .prose-guide h3 { font-size: 1rem; font-weight: 700; color: #e8c97a; margin: 1.5rem 0 0.5rem; }
        .prose-guide p { font-size: 0.9375rem; line-height: 1.85; color: rgba(255,255,255,0.72); margin-bottom: 1rem; }
        .prose-guide ul { padding-left: 1.25rem; margin-bottom: 1rem; }
        .prose-guide li { font-size: 0.9375rem; line-height: 1.8; color: rgba(255,255,255,0.65); margin-bottom: 0.25rem; }
        .prose-guide table { width: 100%; border-collapse: collapse; margin-bottom: 1.25rem; font-size: 0.875rem; }
        .prose-guide th { background: rgba(201,168,76,0.1); color: #c9a84c; padding: 0.5rem 0.75rem; text-align: left; font-weight: 700; border: 1px solid rgba(255,255,255,0.08); }
        .prose-guide td { padding: 0.5rem 0.75rem; border: 1px solid rgba(255,255,255,0.06); color: rgba(255,255,255,0.62); }
        .prose-guide .callout { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-left: 3px solid #c9a84c; border-radius: 10px; padding: 1rem 1.25rem; margin: 1.25rem 0; }
      `}</style>

      <div className="mb-8">
        <Link href="/guide" className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>← 가이드 목록</Link>
        <p className="text-xs font-semibold mt-4 mb-2 uppercase tracking-widest" style={{ color: "#c9a84c" }}>사주 기초</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">사주팔자란 무엇인가</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>읽는 시간: 약 5분 · 최종 수정: 2026.06</p>
      </div>

      <div className="prose-guide">
        <div className="callout">
          <p style={{ margin: 0 }}>
            <strong style={{ color: "#fff" }}>한 줄 요약:</strong> 사주팔자는 태어난 연·월·일·시(四柱)를 간지(干支) 문자로 변환한 여덟 글자(八字)로, 타고난 오행 기운의 분포를 파악해 성격·적성·운세 흐름을 읽는 동아시아 전통 명리학 체계입니다.
          </p>
        </div>

        <h2>사주(四柱)란</h2>
        <p>
          사주(四柱)의 한자를 풀면 '네 개의 기둥'입니다. 사람이 태어난 순간의 시간 정보—연(年)·월(月)·일(日)·시(時)—가 각각 하나의 기둥 역할을 합니다. 동아시아 전통에서는 이 네 가지 시간 정보에 우주의 기운이 응축되어 있다고 보았습니다.
        </p>
        <p>
          이 네 기둥에 천간(天干)과 지지(地支) 두 글자씩을 배정하면 총 여덟 글자, 즉 팔자(八字)가 됩니다. 그래서 흔히 '사주팔자'라고 묶어서 부릅니다. 이 여덟 글자에는 목(木)·화(火)·토(土)·금(金)·수(水) 오행의 기운이 각기 담겨 있어, 어떤 기운이 많고 어떤 기운이 부족한지를 분석하는 것이 명리학의 핵심입니다.
        </p>

        <h2>네 기둥의 의미</h2>
        <table>
          <thead>
            <tr><th>기둥</th><th>나타내는 것</th><th>대표 의미</th></tr>
          </thead>
          <tbody>
            <tr><td>연주(年柱)</td><td>태어난 연도</td><td>조상·부모 인연, 초년 환경, 사회적 공적 이미지</td></tr>
            <tr><td>월주(月柱)</td><td>태어난 월</td><td>부모와의 관계, 청년기 환경, 직업 성향</td></tr>
            <tr><td>일주(日柱)</td><td>태어난 날</td><td><strong>자기 자신(일간)</strong>·배우자 인연, 일생의 핵심</td></tr>
            <tr><td>시주(時柱)</td><td>태어난 시각</td><td>자녀 인연, 말년 운, 내면의 욕망</td></tr>
          </tbody>
        </table>
        <p>
          네 기둥 중에서 <strong style={{ color: "#fff" }}>일주(日柱)의 천간—일간(日干)</strong>이 '나'를 가장 직접 나타낸다고 봅니다. 갑(甲)·을(乙)·병(丙)·정(丁)·무(戊)·기(己)·경(庚)·신(辛)·임(壬)·계(癸) 10가지 일간에 따라 타고난 성격과 삶의 패턴이 결정된다고 해석합니다.
        </p>

        <h2>팔자(八字)의 구성</h2>
        <p>
          여덟 글자는 각 기둥마다 위(천간)·아래(지지) 한 쌍씩 배정됩니다. 예를 들어 연주가 '갑자(甲子)'라면, 갑(甲)이 천간이고 자(子)가 지지입니다. 천간 10개와 지지 12개를 조합하면 60가지 간지 쌍(60갑자)이 만들어지며, 이 순환이 60년 주기로 반복됩니다.
        </p>

        <div className="callout">
          <p style={{ margin: "0 0 0.5rem" }}><strong style={{ color: "#fff" }}>예시: 1990년 음력 3월 15일 오후 2시생</strong></p>
          <ul style={{ margin: 0 }}>
            <li>연주: 경오(庚午) — 1990년 간지</li>
            <li>월주: 을묘(乙卯) — 음력 3월 간지</li>
            <li>일주: 갑자(甲子) — 해당 날짜 간지</li>
            <li>시주: 기미(己未) — 오후 1~3시 간지</li>
          </ul>
        </div>

        <h2>명리학의 역사</h2>
        <p>
          명리학의 기원은 중국 당(唐)나라 시대(7~10세기)로 거슬러 올라갑니다. 이허중(李虛中)이 연주 중심의 분석 체계를 정립했고, 송(宋)나라 시대에 서자평(徐子平)이 일주—즉 일간을 중심으로 삼는 현재의 체계를 완성했습니다. 이후 명(明)·청(淸) 시대를 거치며 다수의 명리 고전이 집성되었고, 조선을 통해 한국에 정착해 오늘날에 이릅니다.
        </p>

        <h2>사주가 말해주는 것</h2>
        <ul>
          <li><strong style={{ color: "#fff" }}>타고난 기질과 성향:</strong> 내성적·외향적, 감성적·이성적, 리더형·지원형 등 본질적 성격</li>
          <li><strong style={{ color: "#fff" }}>강점과 약점:</strong> 오행의 과다·부족으로 나타나는 삶의 패턴</li>
          <li><strong style={{ color: "#fff" }}>운세 흐름:</strong> 10년 단위 대운, 연 단위 세운으로 보는 시기별 흐름</li>
          <li><strong style={{ color: "#fff" }}>인간관계 패턴:</strong> 어떤 사람과 잘 맞고 어떤 관계에서 마찰이 생기는지</li>
          <li><strong style={{ color: "#fff" }}>적성과 직업 경향:</strong> 오행별 잘 맞는 분야와 환경</li>
        </ul>

        <h2>사주가 말해주지 않는 것</h2>
        <p>
          사주는 특정 사건의 발생 여부나 구체적인 날짜를 정확히 예언하지 않습니다. '이 시기에 금전 흐름이 약해진다', '이 대운에 대인관계 갈등이 증가할 수 있다'처럼 <strong style={{ color: "#fff" }}>경향과 흐름을 읽는 도구</strong>로 이해하는 것이 적절합니다. 같은 사주를 가진 쌍둥이도 다른 삶을 살듯이, 사주는 개인의 선택과 환경에 의해 매우 다양하게 발현됩니다.
        </p>

        <div className="callout">
          <p style={{ margin: 0, fontSize: "0.85rem" }}>
            본 콘텐츠는 교육·오락 목적의 참고 자료입니다. 사주 분석 결과를 실제 의료·법률·재정 결정의 근거로 사용하지 마세요.
          </p>
        </div>

        <h2>다음 단계</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {[
            { href: "/guide/ohaeng", label: "오행이란 →" },
            { href: "/guide/cheongan-jiji", label: "천간·지지 →" },
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

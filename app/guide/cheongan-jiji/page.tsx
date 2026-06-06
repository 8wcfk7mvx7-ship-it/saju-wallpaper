import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "천간·지지란 — 10천간 12지지 완전 정리",
  description: "사주를 구성하는 10천간(갑·을·병·정·무·기·경·신·임·계)과 12지지(자·축·인·묘·진·사·오·미·신·유·술·해)의 오행·음양·의미를 정리합니다.",
};

const CHEONGAN = [
  { gan: "갑(甲)", ohaeng: "목(木)", yinyang: "양(陽)", icon: "🌳", trait: "리더십, 개척, 고집, 성장" },
  { gan: "을(乙)", ohaeng: "목(木)", yinyang: "음(陰)", icon: "🌿", trait: "유연성, 친화력, 섬세함, 끈기" },
  { gan: "병(丙)", ohaeng: "화(火)", yinyang: "양(陽)", icon: "☀️", trait: "열정, 카리스마, 급함, 솔직함" },
  { gan: "정(丁)", ohaeng: "화(火)", yinyang: "음(陰)", icon: "🕯️", trait: "집중력, 예민함, 예술성, 직관" },
  { gan: "무(戊)", ohaeng: "토(土)", yinyang: "양(陽)", icon: "⛰️", trait: "안정감, 포용력, 고집, 책임감" },
  { gan: "기(己)", ohaeng: "토(土)", yinyang: "음(陰)", icon: "🌱", trait: "세심함, 실용성, 보수성, 친절" },
  { gan: "경(庚)", ohaeng: "금(金)", yinyang: "양(陽)", icon: "⚔️", trait: "원칙, 결단력, 냉정함, 의리" },
  { gan: "신(辛)", ohaeng: "금(金)", yinyang: "음(陰)", icon: "💎", trait: "완벽주의, 예민함, 세련됨, 자존심" },
  { gan: "임(壬)", ohaeng: "수(水)", yinyang: "양(陽)", icon: "🌊", trait: "지략, 자유로움, 다재다능, 변화" },
  { gan: "계(癸)", ohaeng: "수(水)", yinyang: "음(陰)", icon: "🌧️", trait: "직관, 감수성, 내성적, 신중함" },
];

const JIJI = [
  { ji: "자(子)", animal: "쥐 🐭", ohaeng: "수(水)", season: "겨울 초", month: "11월", time: "23~1시" },
  { ji: "축(丑)", animal: "소 🐮", ohaeng: "토(土)", season: "겨울 말", month: "12월", time: "1~3시" },
  { ji: "인(寅)", animal: "호랑이 🐯", ohaeng: "목(木)", season: "봄 초", month: "1월", time: "3~5시" },
  { ji: "묘(卯)", animal: "토끼 🐰", ohaeng: "목(木)", season: "봄 중", month: "2월", time: "5~7시" },
  { ji: "진(辰)", animal: "용 🐲", ohaeng: "토(土)", season: "봄 말", month: "3월", time: "7~9시" },
  { ji: "사(巳)", animal: "뱀 🐍", ohaeng: "화(火)", season: "여름 초", month: "4월", time: "9~11시" },
  { ji: "오(午)", animal: "말 🐴", ohaeng: "화(火)", season: "여름 중", month: "5월", time: "11~13시" },
  { ji: "미(未)", animal: "양 🐑", ohaeng: "토(土)", season: "여름 말", month: "6월", time: "13~15시" },
  { ji: "신(申)", animal: "원숭이 🐵", ohaeng: "금(金)", season: "가을 초", month: "7월", time: "15~17시" },
  { ji: "유(酉)", animal: "닭 🐔", ohaeng: "금(金)", season: "가을 중", month: "8월", time: "17~19시" },
  { ji: "술(戌)", animal: "개 🐕", ohaeng: "토(土)", season: "가을 말", month: "9월", time: "19~21시" },
  { ji: "해(亥)", animal: "돼지 🐷", ohaeng: "수(水)", season: "겨울 초", month: "10월", time: "21~23시" },
];

export default function CheonganJijiPage() {
  return (
    <article className="prose-guide">
      <style>{`
        .prose-guide h2 { font-size: 1.2rem; font-weight: 800; color: #fff; margin: 2rem 0 0.75rem; }
        .prose-guide p { font-size: 0.9375rem; line-height: 1.85; color: rgba(255,255,255,0.72); margin-bottom: 1rem; }
        .prose-guide .callout { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.09); border-left: 3px solid #c9a84c; border-radius: 10px; padding: 1rem 1.25rem; margin: 1.25rem 0; }
        .tbl { width:100%; border-collapse:collapse; font-size:0.8125rem; margin-bottom:1rem; }
        .tbl th { background:rgba(201,168,76,0.1); color:#c9a84c; padding:0.45rem 0.6rem; text-align:left; font-weight:700; border:1px solid rgba(255,255,255,0.08); }
        .tbl td { padding:0.45rem 0.6rem; border:1px solid rgba(255,255,255,0.06); color:rgba(255,255,255,0.62); }
      `}</style>

      <div className="mb-8">
        <Link href="/guide" className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.35)" }}>← 가이드 목록</Link>
        <p className="text-xs font-semibold mt-4 mb-2 uppercase tracking-widest" style={{ color: "#c9a84c" }}>사주 기초</p>
        <h1 className="text-2xl sm:text-3xl font-black text-white mb-3">천간·지지 — 22글자의 의미</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>읽는 시간: 약 7분 · 최종 수정: 2026.06</p>
      </div>

      <div className="prose-guide">
        <div className="callout">
          <p style={{ margin: 0 }}>
            <strong style={{ color: "#fff" }}>한 줄 요약:</strong> 사주 여덟 글자는 10천간과 12지지로 이루어집니다. 각 글자에는 오행과 음양이 배정되어 있으며, 이 조합이 사람의 기운을 구체적으로 표현합니다.
          </p>
        </div>

        <h2>천간(天干)이란</h2>
        <p>
          천간은 하늘의 기운을 나타내는 10개의 문자입니다. 갑(甲)부터 계(癸)까지 순서대로 이어지며, 각각 오행(목·화·토·금·수)과 음양(陰·陽)이 배정됩니다. 사주에서 일주의 천간(일간)이 '나'를 나타내는 핵심입니다.
        </p>

        <table className="tbl">
          <thead>
            <tr><th>천간</th><th>오행</th><th>음양</th><th>핵심 성향</th></tr>
          </thead>
          <tbody>
            {CHEONGAN.map(({ gan, ohaeng, yinyang, icon, trait }) => (
              <tr key={gan}>
                <td><span className="font-bold text-white">{gan}</span> {icon}</td>
                <td>{ohaeng}</td>
                <td>{yinyang}</td>
                <td>{trait}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>지지(地支)란</h2>
        <p>
          지지는 땅의 기운을 나타내는 12개의 문자입니다. 12지지는 12 동물(띠)과 연결되며, 각각 특정 계절·월·시간대에 대응합니다. 지지 안에는 천간의 기운이 숨어 있는데, 이를 지장간(支藏干)이라 하며 사주 해석을 더욱 섬세하게 합니다.
        </p>

        <table className="tbl">
          <thead>
            <tr><th>지지</th><th>동물</th><th>오행</th><th>계절</th><th>월</th><th>시간</th></tr>
          </thead>
          <tbody>
            {JIJI.map(({ ji, animal, ohaeng, season, month, time }) => (
              <tr key={ji}>
                <td className="font-bold text-white">{ji}</td>
                <td>{animal}</td>
                <td>{ohaeng}</td>
                <td>{season}</td>
                <td>음력 {month}</td>
                <td>{time}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h2>60갑자 — 60년의 순환</h2>
        <p>
          10천간과 12지지를 순서대로 조합하면 60가지 간지 쌍이 만들어집니다. 이것이 60갑자(甲子)입니다. 갑자(甲子)에서 시작해 계해(癸亥)로 끝나고, 다시 갑자로 돌아오는 60년 주기입니다. '환갑(還甲)'이 60세인 이유가 여기에서 비롯됩니다.
        </p>

        <div className="callout">
          <p style={{ margin: "0 0 0.4rem" }}><strong style={{ color: "#fff" }}>최근 연도 간지:</strong></p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>
            <span>2022 — 임인(壬寅)</span>
            <span>2023 — 계묘(癸卯)</span>
            <span>2024 — 갑진(甲辰)</span>
            <span>2025 — 을사(乙巳)</span>
            <span>2026 — 병오(丙午)</span>
            <span>2027 — 정미(丁未)</span>
            <span>2028 — 무신(戊申)</span>
            <span>2029 — 기유(己酉)</span>
          </div>
        </div>

        <h2>일주(日柱)와 나</h2>
        <p>
          사주에서 가장 중요한 글자는 일주(日柱)의 천간, 즉 일간(日干)입니다. 일간은 '나'의 본질적 기운을 나타내며, 나머지 일곱 글자는 일간을 둘러싼 환경·관계·운의 흐름으로 해석합니다. 예를 들어 일간이 갑(甲)이면 '갑목(甲木)'의 성향—개척적이고 주도적이며 고집이 강한 리더십—이 타고난 기질의 핵심입니다.
        </p>

        <div className="callout">
          <p style={{ margin: 0, fontSize: "0.85rem" }}>
            본 콘텐츠는 교육·오락 목적의 참고 자료입니다. 사주 해석은 개인마다 다를 수 있으며, 전문 명리사의 상담을 대체하지 않습니다.
          </p>
        </div>

        <h2>다음 단계</h2>
        <div className="flex flex-wrap gap-2 mt-2">
          {[
            { href: "/guide/sinsal", label: "신살이란 →" },
            { href: "/guide/daewoon", label: "대운·세운 →" },
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

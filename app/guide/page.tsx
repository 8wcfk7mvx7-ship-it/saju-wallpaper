import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "사주 명리학 가이드",
  description: "사주팔자, 오행, 천간·지지, 신살, 대운·세운 등 명리학 기초를 단계별로 설명합니다.",
};

const GUIDES = [
  {
    href: "/guide/saju-basics",
    title: "사주팔자란 무엇인가",
    desc: "연·월·일·시 네 기둥과 여덟 글자가 어떻게 사람의 기운을 표현하는지 기초부터 설명합니다.",
    time: "약 5분",
  },
  {
    href: "/guide/ohaeng",
    title: "오행이란 — 목·화·토·금·수",
    desc: "동아시아 사상의 근간인 다섯 가지 기운. 상생·상극 관계와 사주에서 오행 균형을 읽는 법을 알아봅니다.",
    time: "약 6분",
  },
  {
    href: "/guide/cheongan-jiji",
    title: "천간·지지 — 22글자의 의미",
    desc: "사주를 구성하는 10천간과 12지지, 그리고 60갑자 순환 체계를 정리합니다.",
    time: "약 7분",
  },
  {
    href: "/guide/sinsal",
    title: "신살이란 — 역마·도화·귀문 등",
    desc: "역마살·도화살·귀문관살 등 주요 신살의 종류와 실제 삶에서 나타나는 의미를 설명합니다.",
    time: "약 6분",
  },
  {
    href: "/guide/daewoon",
    title: "대운·세운 — 인생 타임라인 읽기",
    desc: "10년 단위 대운과 1년 단위 세운이 무엇인지, 내 인생의 흐름을 어떻게 파악하는지 알아봅니다.",
    time: "약 5분",
  },
  {
    href: "/guide/gyeokguk",
    title: "격국(格局) — 내 사주의 格은 무엇인가",
    desc: "월지 기준으로 사주의 본질적 성향을 분류하는 格局. 내격 10종·성격·파격·외격을 완전 정리합니다.",
    time: "약 8분",
  },
  {
    href: "/guide/age-gap",
    title: "4살 차이 vs 6살 차이 — 띠 궁합 속설 팩트체크",
    desc: "4살 차이는 궁합 볼 필요도 없다는 말과 6살 차이가 오히려 안 좋다는 속설이 12지지 순환 구조에서 어떻게 나왔는지 표로 정리합니다.",
    time: "약 5분",
  },
  {
    href: "/guide/dano-food",
    title: "단오에 먹으면 좋은 음식 vs 피해야 할 음식",
    desc: "1년 중 양기가 가장 강하다는 단오에, 양기를 채워준다는 음식과 거스른다는 음식을 명리학 음양 논리와 실제 전통 절식으로 함께 정리합니다.",
    time: "약 6분",
  },
  {
    href: "/service/fengshui",
    title: "풍수지리 이야기 — 공간이 운명을 바꾼다",
    desc: "침실 머리 방향, 재물운 아이템, 기운 배치법 등 생활 속 풍수 지혜를 무료로 읽어보세요.",
    time: "약 5분",
  },
];

export default function GuidePage() {
  return (
    <div>
      <div className="mb-10">
        <p className="text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color: "#c9a84c" }}>
          Summer Palace · 명리학 가이드
        </p>
        <h1 className="text-3xl font-black text-white mb-3">사주 기초 가이드</h1>
        <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
          사주를 처음 접하는 분을 위한 단계별 설명 모음입니다. 광고 없이 핵심만 정리했습니다.
        </p>
      </div>

      <div className="space-y-3">
        {GUIDES.map(({ href, title, desc, time }) => (
          <Link
            key={href}
            href={href}
            className="block rounded-2xl p-5 transition-all"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-bold text-white mb-1">{title}</h2>
                <p className="text-sm leading-relaxed mb-2" style={{ color: "rgba(255,255,255,0.5)" }}>{desc}</p>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>읽는 시간: {time}</span>
              </div>
              <span className="text-sm shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>›</span>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-2xl p-5" style={{ background: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}>
        <p className="text-sm font-semibold mb-1" style={{ color: "#c9a84c" }}>블로그도 확인해보세요</p>
        <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.45)" }}>연도별 운세 흐름, 일간별 특성 등 심화 콘텐츠를 다룹니다.</p>
        <a href="https://cykablyat.tistory.com" target="_blank" rel="noopener noreferrer" className="text-xs font-bold" style={{ color: "#c9a84c" }}>블로그 바로가기 →</a>
      </div>
    </div>
  );
}

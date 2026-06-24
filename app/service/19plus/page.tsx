"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const SERVICES = [
  {
    emoji: "🔥",
    title: "19금 사주 궁합",
    desc: "정임합·자오충·인오술합으로 보는 두 사람의 성적 케미 완전 분석.",
    href: "/service/hotcompat",
  },
  {
    emoji: "🌹",
    title: "나의 성적 매력은?",
    desc: "홍염살·목욕·도화살로 보는 타고난 이성 매력과 매력 포인트 완전 분석.",
    href: "/service/eros",
  },
];

export default function AdultGatePage() {
  const [confirmed, setConfirmed] = useState(false);
  const router = useRouter();

  if (!confirmed) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#06060e" }}>
        <div className="max-w-2xl w-full text-center">
          <div className="text-5xl mb-6">🔞</div>
          <h1 className="text-2xl font-black text-white mb-3">성인 전용 서비스</h1>
          <p className="text-sm leading-relaxed mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
            이 페이지는 19세 이상을 위한 성인 콘텐츠를 포함합니다.<br />
            본인이 만 19세 이상임을 확인해 주세요.
          </p>
          <button
            onClick={() => setConfirmed(true)}
            className="w-full py-4 rounded-2xl font-black text-white text-base mb-3 transition-all active:scale-[0.98]"
            style={{ background: "linear-gradient(135deg, #7c3aed, #dc2626)" }}
          >
            만 19세 이상입니다 — 입장하기
          </button>
          <button
            onClick={() => router.push("/")}
            className="w-full py-3 rounded-2xl text-sm transition-all"
            style={{ color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            돌아가기
          </button>
          <p className="text-xs mt-6" style={{ color: "rgba(255,255,255,0.2)" }}>
            미성년자의 접근은 금지되어 있습니다. 허위 확인 시 모든 책임은 이용자에게 있습니다.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-12" style={{ background: "#06060e" }}>
      <div className="max-w-2xl mx-auto">
        <button onClick={() => router.push("/")} className="flex items-center gap-1.5 mb-8 text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
          ← 홈으로
        </button>
        <div className="text-center mb-10">
          <span className="text-4xl">🔞</span>
          <h1 className="text-2xl font-black text-white mt-3 mb-2">성인 전용 서비스</h1>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
            사주 명리학으로 보는 성인 콘텐츠 분석 서비스입니다.
          </p>
        </div>

        <div className="space-y-3">
          {SERVICES.map(({ emoji, title, desc, href }) => (
            <button
              key={href}
              onClick={() => router.push(href)}
              className="w-full rounded-2xl p-5 text-left transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              <div className="flex items-start gap-4">
                <span className="text-3xl">{emoji}</span>
                <div>
                  <p className="text-base font-black text-white mb-1">{title}</p>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <p className="text-xs text-center mt-8" style={{ color: "rgba(255,255,255,0.2)" }}>
          본 서비스는 오락·참고 목적의 AI 콘텐츠입니다. 만 19세 미만 이용 불가.
        </p>
      </div>
    </main>
  );
}

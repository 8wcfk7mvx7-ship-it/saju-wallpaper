"use client";
import { useState } from "react";

export default function ShareButton({ title = "내 사주 분석 결과", text = "Summer Palace에서 내 사주를 분석했어요" }: { title?: string; text?: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title, text, url }); return; } catch {}
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleShare}
      className="w-full py-3.5 rounded-2xl font-bold text-sm border transition-all active:scale-[0.98] flex items-center justify-center gap-2"
      style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}
    >
      {copied ? "✓ 링크 복사됨" : "↗ 친구에게 공유하기"}
    </button>
  );
}

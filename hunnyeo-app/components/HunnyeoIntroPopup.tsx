"use client";
import { useEffect, useState } from "react";
import { DISCLAIMER_ACK_KEY } from "@/lib/hunnyeoData";
import { loadJSON, saveJSON } from "@/lib/hunnyeoStorage";
import { RETRO_CSS } from "@/lib/hunnyeoTheme";
import { DISCLAIMER_TITLE, DISCLAIMER_LINES } from "@/components/HunnyeoDisclaimer";
import PixelIcon from "@/components/PixelIcon";

// ── 최초 1회 안내 팝업 ────────────────────────────────────────────────────
// 앱을 처음 열었을 때 한 번만 뜬다. "확인했어요"를 누르면 localStorage에
// 표시를 남겨 두 번 다시 뜨지 않는다. (기록을 지우면 다시 뜬다)

export default function HunnyeoIntroPopup() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // 서버 렌더 결과와 어긋나지 않도록 마운트 후에만 판단한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 최초 마운트 시 localStorage 확인 1회
    setOpen(!loadJSON<boolean>(DISCLAIMER_ACK_KEY, false));
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  function acknowledge() {
    saveJSON(DISCLAIMER_ACK_KEY, true);
    setOpen(false);
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8 overflow-y-auto"
      style={{ background: "rgba(90,30,60,0.55)" }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="hn-intro-title"
    >
      <style>{RETRO_CSS}</style>

      <div
        className="w-full max-w-sm hn-box p-5 relative my-auto"
        style={{ borderStyle: "dashed", borderWidth: 4 }}
      >
        <PixelIcon name="ribbon" size={28} className="absolute -top-3 -left-3 hn-float" />
        <PixelIcon name="heart" size={24} className="absolute -top-3 -right-3 hn-float" style={{ animationDelay: ".6s" }} />

        <p className="text-center text-[11px] font-black mb-1" style={{ color: "#ff6fb5" }}>
          ─── 훈녀생정에 처음 오셨네요 ───
        </p>
        <h2 id="hn-intro-title" className="text-center text-2xl font-black mb-3 hn-title">
          잠깐만요!
        </h2>

        <div className="rounded-2xl p-3.5 mb-4" style={{ background: "#fff8e6", border: "2.5px dashed #f0a500" }}>
          <p className="hn-cute text-[14px] mb-2 flex items-center gap-1.5" style={{ color: "#b06a00" }}>
            <PixelIcon name="warning" size={15} /> {DISCLAIMER_TITLE}
          </p>
          <ul className="space-y-1.5">
            {DISCLAIMER_LINES.map((line, i) => (
              <li key={i} className="flex gap-1.5 text-[12px] leading-relaxed font-bold" style={{ color: "#7a5a1e" }}>
                <span style={{ color: "#f0a500" }}>·</span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>

        <button onClick={acknowledge} className="hn-btn hn-btn-on w-full py-3 text-[15px]">
          확인했어요
        </button>
        <p className="text-center text-[10px] mt-2.5 font-bold" style={{ color: "#b58aa2" }}>
          이 안내는 처음 한 번만 보여드려요
        </p>
      </div>
    </div>
  );
}

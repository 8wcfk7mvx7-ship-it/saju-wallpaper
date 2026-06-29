"use client";
import { useState } from "react";
import { trackTraits } from "@/lib/trackTrait";

export default function ShareImageButton({ targetId, fileName }: { targetId: string; fileName: string }) {
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSaveImage() {
    const node = document.getElementById(targetId);
    if (!node) return;
    setSaving(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, { backgroundColor: "#06060e", pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = `${fileName}.png`;
      link.href = dataUrl;
      link.click();
      trackTraits(["save_image"], window.location.pathname);
      setDone(true);
      setTimeout(() => setDone(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={handleSaveImage}
      disabled={saving}
      className="w-full py-3.5 rounded-2xl font-bold text-sm border transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 mt-3"
      style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}
    >
      {saving ? "저장 중..." : done ? "이미지 저장됨" : "이미지로 저장하기"}
    </button>
  );
}

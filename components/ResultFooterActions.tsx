"use client";
import { useRouter } from "next/navigation";
import ShareButton from "./ShareButton";
import ShareImageButton from "./ShareImageButton";

export default function ResultFooterActions({
  targetId, fileName, shareTitle, shareText,
}: { targetId: string; fileName: string; shareTitle?: string; shareText?: string }) {
  const router = useRouter();
  return (
    <div className="space-y-2.5 mt-4">
      <button
        onClick={() => router.push("/")}
        className="w-full py-3.5 rounded-2xl font-bold text-sm border transition-all active:scale-[0.98] flex items-center justify-center gap-2"
        style={{ borderColor: "rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.6)" }}
      >
        홈으로 돌아가기
      </button>
      <ShareButton title={shareTitle} text={shareText} />
      <ShareImageButton targetId={targetId} fileName={fileName} />
    </div>
  );
}

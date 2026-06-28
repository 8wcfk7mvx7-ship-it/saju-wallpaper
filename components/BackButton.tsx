"use client";
import { useRouter } from "next/navigation";

interface Props {
  href?: string;
}

export default function BackButton({ href }: Props) {
  const router = useRouter();
  return (
    <div className="px-4 sm:px-6 pt-4 pb-2 max-w-lg mx-auto w-full flex items-center gap-3">
      <button
        onClick={() => href ? router.push(href) : router.back()}
        className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
        style={{ color: "rgba(255,255,255,0.4)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
      >
        ← 뒤로
      </button>
      <button
        onClick={() => router.push("/")}
        className="flex items-center gap-1.5 text-sm font-semibold transition-colors"
        style={{ color: "rgba(255,255,255,0.4)" }}
        onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
        onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
      >
        홈
      </button>
    </div>
  );
}

"use client";
import { usePathname } from "next/navigation";

export default function LoginOptions({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const redirect = pathname || "/";

  return (
    <div className="w-full space-y-3">
      <a
        href={`/api/auth/kakao?redirect=${encodeURIComponent(redirect)}`}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
        style={{ background: "#FEE500", color: "#191919" }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 3C6.477 3 2 6.477 2 10.74c0 2.73 1.84 5.13 4.6 6.5l-1.04 3.8a.6.6 0 0 0 .9.66l4.34-2.87c.39.04.79.06 1.2.06 5.523 0 10-3.477 10-7.65C22 6.477 17.523 3 12 3z" fill="#191919"/>
        </svg>
        카카오로 로그인
      </a>
      <a
        href={`/api/auth/naver?redirect=${encodeURIComponent(redirect)}`}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
        style={{ background: "#03C75A", color: "#fff" }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <path d="M16.273 12.845L7.376 0H0v24h7.727V11.155L16.624 24H24V0h-7.727z" fill="#fff"/>
        </svg>
        네이버로 로그인
      </a>
      {onClose && (
        <button onClick={onClose}
          className="w-full py-3 rounded-2xl font-bold text-sm text-gray-400 hover:text-gray-200 transition-all">
          닫기
        </button>
      )}
    </div>
  );
}

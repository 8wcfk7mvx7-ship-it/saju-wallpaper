"use client";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function LoginOptions({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleGoogleLogin() {
    if (!supabaseBrowser) return;
    await supabaseBrowser.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: "https://summerpalace.ai.kr/auth/callback",
      },
    });
  }

  return (
    <div className="w-full space-y-3">
      {/* Google 로그인 */}
      <button
        onClick={handleGoogleLogin}
        className="flex items-center justify-center gap-3 w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
        style={{ background: "#fff", color: "#1f1f1f", border: "1px solid rgba(0,0,0,0.12)" }}
      >
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        Google로 로그인
      </button>

      {/* Apple 로그인 */}
      <a
        href={`/api/auth/apple?redirect=${encodeURIComponent(pathname || "/")}`}
        className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-sm transition-all active:scale-[0.98]"
        style={{ background: "#000", color: "#fff", border: "1px solid rgba(255,255,255,0.15)" }}
      >
        <svg width="16" height="16" viewBox="0 0 384 512" fill="#fff">
          <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1-2 49.9-15.2 69.5-34.3z"/>
        </svg>
        Apple로 로그인
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

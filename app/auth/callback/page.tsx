"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    async function handle() {
      if (!supabaseBrowser) {
        router.replace("/");
        return;
      }
      // Supabase가 URL 해시/코드에서 세션을 자동으로 교환
      const { error } = await supabaseBrowser.auth.exchangeCodeForSession(window.location.href);
      if (error) {
        console.error("auth callback error:", error);
      }
      router.replace("/");
    }
    handle();
  }, [router]);

  return (
    <div className="min-h-screen bg-[#06060e] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-violet-400/30 border-t-violet-400 rounded-full animate-spin" />
    </div>
  );
}

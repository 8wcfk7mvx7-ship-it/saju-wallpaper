"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser, isAuthConfigured } from "@/lib/supabaseClient";

declare global {
  interface Window {
    PortOne?: {
      requestIdentityVerification: (req: {
        storeId: string;
        identityVerificationId: string;
        channelKey: string;
      }) => Promise<{ code?: string; message?: string; identityVerificationId?: string }>;
    };
  }
}

export default function VerifyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.portone.io/v2/browser-sdk.js";
    script.async = true;
    script.onload = () => setSdkReady(true);
    document.body.appendChild(script);
    return () => { document.body.removeChild(script); };
  }, []);

  async function handleVerify() {
    setError("");

    if (!supabaseBrowser) {
      setError("로그인이 필요합니다.");
      return;
    }
    const { data: sess } = await supabaseBrowser.auth.getSession();
    const token = sess.session?.access_token;
    if (!token) {
      setError("로그인이 필요합니다.");
      return;
    }

    const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID;
    const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY;
    if (!sdkReady || !window.PortOne || !storeId || !channelKey) {
      setError("본인인증 설정이 완료되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setLoading(true);
    const identityVerificationId = `identity-${crypto.randomUUID()}`;
    const result = await window.PortOne.requestIdentityVerification({
      storeId, identityVerificationId, channelKey,
    });

    if (result?.code) {
      setLoading(false);
      setError("본인인증이 취소되었거나 실패했습니다.");
      return;
    }

    const res = await fetch("/api/identity/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ identityVerificationId }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error || "본인인증 처리 중 오류가 발생했습니다.");
      return;
    }
    setDone(true);
  }

  if (!isAuthConfigured()) {
    return (
      <main className="min-h-screen bg-[#06060e] text-white flex items-center justify-center px-5">
        <p className="text-sm text-gray-500">본인인증 기능을 준비 중입니다.</p>
      </main>
    );
  }

  if (done) {
    return (
      <main className="min-h-screen bg-[#06060e] text-white flex flex-col items-center justify-center px-5 text-center gap-4">
        <div className="text-5xl">✅</div>
        <h1 className="text-xl font-black">본인인증이 완료되었습니다</h1>
        <button onClick={() => router.push("/")}
          className="mt-2 px-6 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
          홈으로
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06060e] text-white flex flex-col items-center justify-center px-5 text-center gap-4">
      <div className="text-5xl">📱</div>
      <h1 className="text-xl font-black">휴대폰 본인인증</h1>
      <p className="text-sm text-gray-400 max-w-sm">
        본인인증을 완료하면 일부 서비스를 더 안전하게 이용할 수 있어요.
      </p>
      {error && <p className="text-xs text-rose-400">{error}</p>}
      <button onClick={handleVerify} disabled={loading}
        className="mt-2 px-6 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white disabled:opacity-50">
        {loading ? "인증 중..." : "본인인증 시작하기"}
      </button>
    </main>
  );
}

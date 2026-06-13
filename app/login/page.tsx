"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser, isAuthConfigured } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    if (!supabaseBrowser) {
      setError("로그인 설정이 완료되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setLoading(true);
    const { error: signErr } = await supabaseBrowser.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (signErr) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
      return;
    }
    router.push("/");
  }

  if (!isAuthConfigured()) {
    return (
      <main className="min-h-screen bg-[#06060e] text-white flex items-center justify-center px-5">
        <p className="text-sm text-gray-500">로그인 기능을 준비 중입니다.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06060e] text-white flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-black mb-1 text-center">로그인</h1>
        <p className="text-sm text-gray-500 mb-8 text-center">Summer Palace 계정으로 별조각을 안전하게 관리하세요.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="이메일"
            className="w-full rounded-xl px-4 py-3 text-sm bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500"
          />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="비밀번호"
            className="w-full rounded-xl px-4 py-3 text-sm bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500"
          />

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-2xl font-black text-base bg-gradient-to-r from-violet-600 to-indigo-600 text-white transition-all active:scale-[0.98] disabled:opacity-50">
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          아직 계정이 없으신가요?{" "}
          <button onClick={() => router.push("/signup")} className="text-violet-400 underline">회원가입</button>
        </p>
      </div>
    </main>
  );
}

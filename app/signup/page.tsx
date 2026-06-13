"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser, isAuthConfigured } from "@/lib/supabaseClient";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== password2) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }
    if (!supabaseBrowser) {
      setError("회원가입 설정이 완료되지 않았습니다. 잠시 후 다시 시도해주세요.");
      return;
    }

    setLoading(true);
    const { error: signErr } = await supabaseBrowser.auth.signUp({ email, password });
    setLoading(false);

    if (signErr) {
      setError(signErr.message);
      return;
    }
    setDone(true);
  }

  if (!isAuthConfigured()) {
    return (
      <main className="min-h-screen bg-[#06060e] text-white flex items-center justify-center px-5">
        <p className="text-sm text-gray-500">회원가입 기능을 준비 중입니다.</p>
      </main>
    );
  }

  if (done) {
    return (
      <main className="min-h-screen bg-[#06060e] text-white flex flex-col items-center justify-center px-5 text-center gap-4">
        <div className="text-5xl">📩</div>
        <h1 className="text-xl font-black">인증 메일을 확인해주세요</h1>
        <p className="text-sm text-gray-400 max-w-sm">
          {email}로 인증 메일을 보냈습니다. 메일의 링크를 눌러 인증을 완료하면 로그인할 수 있어요.
        </p>
        <button onClick={() => router.push("/login")}
          className="mt-2 px-6 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-violet-600 to-indigo-600 text-white">
          로그인 페이지로
        </button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06060e] text-white flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-black mb-1 text-center">회원가입</h1>
        <p className="text-sm text-gray-500 mb-8 text-center">Summer Palace 계정을 만들면 별조각이 안전하게 보관돼요.</p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="이메일"
            className="w-full rounded-xl px-4 py-3 text-sm bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500"
          />
          <input
            type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="비밀번호 (8자 이상)"
            className="w-full rounded-xl px-4 py-3 text-sm bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500"
          />
          <input
            type="password" value={password2} onChange={e => setPassword2(e.target.value)}
            placeholder="비밀번호 확인"
            className="w-full rounded-xl px-4 py-3 text-sm bg-white/5 border border-white/10 text-white outline-none focus:border-violet-500"
          />

          {error && <p className="text-xs text-rose-400">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-2xl font-black text-base bg-gradient-to-r from-violet-600 to-indigo-600 text-white transition-all active:scale-[0.98] disabled:opacity-50">
            {loading ? "처리 중..." : "가입하기"}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-6">
          이미 계정이 있으신가요?{" "}
          <button onClick={() => router.push("/login")} className="text-violet-400 underline">로그인</button>
        </p>
      </div>
    </main>
  );
}

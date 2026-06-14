"use client";
import LoginOptions from "@/components/LoginOptions";
import BackButton from "@/components/BackButton";

export default function LoginSelectPage() {
  return (
    <main className="min-h-screen bg-[#06060e] text-white flex flex-col">
      <BackButton />
      <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-10">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-black text-center mb-1">로그인</h1>
          <p className="text-sm text-gray-500 text-center mb-8">간편하게 로그인하고 별조각을 안전하게 보관하세요.</p>
          <LoginOptions />
        </div>
      </div>
    </main>
  );
}

"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RefundPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/terms?tab=refund");
  }, [router]);
  return (
    <main className="min-h-screen bg-[#06060e] flex items-center justify-center">
      <p className="text-gray-500 text-sm">이동 중...</p>
    </main>
  );
}

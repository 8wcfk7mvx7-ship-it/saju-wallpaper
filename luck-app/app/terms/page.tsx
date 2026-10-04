import { TermsContent } from "@/components/LegalContent";

export const metadata = { title: "이용약관 — 행운의 앱" };

export default function TermsPage() {
  return (
    <main className="min-h-screen px-6 py-12" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <TermsContent />
    </main>
  );
}

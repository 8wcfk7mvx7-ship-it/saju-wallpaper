import { PrivacyContent } from "@/components/LegalContent";

export const metadata = { title: "개인정보처리방침 — 행운의 앱" };

export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-6 py-12" style={{ background: "var(--bg)", color: "var(--ink)" }}>
      <PrivacyContent />
    </main>
  );
}

import type { Metadata } from "next";
import { Suspense } from "react";
import EpubAppShell from "@/components/epub-app/EpubAppShell";

export const metadata: Metadata = {
  title: "이펍공장",
  description: "아이폰·아이패드에서 전자책(EPUB)을 만드는 편집기 앱.",
};

export default function EpubAppPage() {
  return (
    <Suspense>
      <EpubAppShell />
    </Suspense>
  );
}

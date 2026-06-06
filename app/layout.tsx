import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

const chosun = localFont({
  src: "./fonts/ChosunilboMyungjo.woff",
  variable: "--font-chosun",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: { default: "여름궁전(Summer Palace) — AI 사주 명리 분석", template: "%s | Summer Palace" },
  description: "사주팔자 명리학 기반 AI 분석 서비스. 오행·천간지지·신살·대운으로 타고난 에너지를 이해하고 삶의 방향을 찾아드립니다.",
  metadataBase: new URL("https://summerpalace.ai.kr"),
  alternates: { canonical: "/" },
  verification: {
    google: "0GaEKS56_KoG7igvbIw-DuFt2L8g7jH4SUJjq1sT-hQ",
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "Summer Palace",
    url: "https://summerpalace.ai.kr",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://summerpalace.ai.kr/#organization",
      name: "Summer Palace (여름궁전)",
      url: "https://summerpalace.ai.kr",
      email: "smple@outlook.kr",
      description: "사주팔자 명리학 기반 AI 분석 서비스",
    },
    {
      "@type": "WebSite",
      "@id": "https://summerpalace.ai.kr/#website",
      url: "https://summerpalace.ai.kr",
      name: "Summer Palace",
      description: "사주팔자 명리학 기반 AI 분석 서비스. 오행·천간지지·신살·대운으로 타고난 에너지를 분석합니다.",
      publisher: { "@id": "https://summerpalace.ai.kr/#organization" },
      inLanguage: "ko-KR",
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: "https://summerpalace.ai.kr/guide?q={search_term_string}" },
        "query-input": "required name=search_term_string",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`h-full antialiased ${chosun.variable}`} suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className={`min-h-full flex flex-col ${chosun.className}`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}

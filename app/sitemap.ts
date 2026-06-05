import type { MetadataRoute } from "next";

const BASE = "https://summerpalace.ai.kr";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE}/saju`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/gunghap`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE}/crush`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE}/result`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/daewoon`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/calendar`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/mbti`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE}/stock`, lastModified: now, changeFrequency: "monthly", priority: 0.75 },
    { url: `${BASE}/spy`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/overcome`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/taste`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/place`, lastModified: now, changeFrequency: "monthly", priority: 0.65 },
    { url: `${BASE}/charm`, lastModified: now, changeFrequency: "monthly", priority: 0.65 },
    { url: `${BASE}/reunion`, lastModified: now, changeFrequency: "monthly", priority: 0.65 },

    // 가이드
    { url: `${BASE}/guide`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/guide/saju-basics`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/guide/ohaeng`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/guide/cheongan-jiji`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/guide/sinsal`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },
    { url: `${BASE}/guide/daewoon`, lastModified: now, changeFrequency: "monthly", priority: 0.85 },

    // 블로그
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.85 },
    { url: `${BASE}/blog/2026-byeongoh-year`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },

    // 정책
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/refund`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE}/notice`, lastModified: now, changeFrequency: "weekly", priority: 0.4 },
  ];

  return staticRoutes;
}

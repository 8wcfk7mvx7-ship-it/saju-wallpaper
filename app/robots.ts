import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/admin/", "/service/19plus/"],
      },
    ],
    sitemap: "https://summerpalace.ai.kr/sitemap.xml",
    host: "https://summerpalace.ai.kr",
  };
}

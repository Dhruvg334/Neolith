import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://neolith.local";
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/"],
      },
      {
        userAgent: ["GPTBot", "AnthropicBot", "CCBot", "Google-Extended"],
        allow: ["/", "/docs", "/adopt", "/security", "/privacy", "/terms", "/llms.txt"],
        disallow: ["/api/", "/operator", "/approvals"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}

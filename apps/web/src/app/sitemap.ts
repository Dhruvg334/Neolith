import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://neolith.local";
  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date("2026-10-19T00:00:00Z"),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/tasks`,
      lastModified: new Date("2026-10-19T00:00:00Z"),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/approvals`,
      lastModified: new Date("2026-10-19T00:00:00Z"),
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/operator`,
      lastModified: new Date("2026-10-19T00:00:00Z"),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];
}

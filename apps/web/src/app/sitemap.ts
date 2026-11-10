import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://neolith.local";
  const now = new Date("2026-11-10T12:00:00Z");

  const routes: readonly {
    path: string;
    priority: number;
    changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  }[] = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" },
    { path: "/agent", priority: 0.95, changeFrequency: "daily" },
    { path: "/dashboard", priority: 0.9, changeFrequency: "daily" },
    { path: "/accounts", priority: 0.9, changeFrequency: "daily" },
    { path: "/tasks", priority: 0.85, changeFrequency: "daily" },
    { path: "/approvals", priority: 0.85, changeFrequency: "daily" },
    { path: "/governance", priority: 0.8, changeFrequency: "weekly" },
    { path: "/policies", priority: 0.8, changeFrequency: "weekly" },
    { path: "/operator", priority: 0.75, changeFrequency: "weekly" },
    { path: "/docs", priority: 0.9, changeFrequency: "weekly" },
    { path: "/adopt", priority: 0.85, changeFrequency: "monthly" },
    { path: "/security", priority: 0.85, changeFrequency: "monthly" },
    { path: "/privacy", priority: 0.7, changeFrequency: "monthly" },
    { path: "/terms", priority: 0.7, changeFrequency: "monthly" },
  ];

  return routes.map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}

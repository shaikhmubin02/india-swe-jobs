import type { MetadataRoute } from "next";
import { COMPANIES, META } from "@/lib/data";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticPages = [
    { url: "/", priority: 1.0, changeFrequency: "daily" as const },
    { url: "/internships", priority: 0.9, changeFrequency: "daily" as const },
    { url: "/new-grad", priority: 0.9, changeFrequency: "daily" as const },
    { url: "/experienced", priority: 0.9, changeFrequency: "daily" as const },
    { url: "/walkins", priority: 0.9, changeFrequency: "daily" as const },
    { url: "/companies", priority: 0.8, changeFrequency: "weekly" as const },
    { url: "/about", priority: 0.5, changeFrequency: "monthly" as const },
    { url: "/privacy", priority: 0.3, changeFrequency: "yearly" as const },
    { url: "/contact", priority: 0.3, changeFrequency: "yearly" as const },
  ].map((p) => ({
    url: `${SITE_URL}${p.url}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  const cityPages = META.cities
    .filter((c) => c.slug !== "india-anywhere")
    .map((c) => ({
      url: `${SITE_URL}/city/${c.slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

  const companyPages = COMPANIES.map((c) => ({
    url: `${SITE_URL}/companies/${c.slug}`,
    lastModified: now,
    changeFrequency: "daily" as const,
    priority: c.open > 0 ? 0.7 : 0.4,
  }));

  return [...staticPages, ...cityPages, ...companyPages];
}

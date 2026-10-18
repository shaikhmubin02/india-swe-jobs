import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// Unlike the reference site (whose robots.txt disallows everything except
// Googlebot), this board is meant to be discoverable.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/saved"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}

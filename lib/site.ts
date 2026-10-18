// Single place to set the canonical origin. Override with NEXT_PUBLIC_SITE_URL
// at build time (e.g. on a Cloudflare/OpenNext deploy).
export const SITE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:4321").replace(/\/$/, "");

export const SITE_NAME = "India SWE Jobs";

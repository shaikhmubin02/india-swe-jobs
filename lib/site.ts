// Single place to set the canonical origin. Used by app/robots.ts and
// app/sitemap.ts, both of which are generated at build time on the server.
//
// Resolution order:
//   1. NEXT_PUBLIC_SITE_URL            — set this for a custom domain
//   2. VERCEL_PROJECT_PRODUCTION_URL   — Vercel's own production domain, so a
//      stock deploy emits correct absolute URLs without configuration
//   3. VERCEL_URL                      — preview deployments
//   4. localhost, for `npm run dev`
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "") ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
  "http://localhost:4321"
).replace(/\/$/, "");

export const SITE_NAME = "India SWE Jobs";

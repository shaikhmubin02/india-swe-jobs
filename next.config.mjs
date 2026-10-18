/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The board is fully statically prerendered: every listing page embeds the
  // whole dataset in the RSC flight payload and all filtering happens on the
  // client. This mirrors the reference site's architecture (no jobs API).
  experimental: {
    optimizePackageImports: [],
  },
};

export default nextConfig;

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  images: {
    minimumCacheTTL: 31536000,
    qualities: [75, 90, 100],
    localPatterns: [
      {
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        // 1. Versioned static assets (icons, project media, readmes with ?v=hash)
        source: "/(icons|project|readme)/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // 2. Version endpoint for background auto-updates: never cache
        source: "/version.json",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
          },
        ],
      },
      {
        // 3. HTML pages: instant load with background revalidation
        source: "/",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/project",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, stale-while-revalidate=86400",
          },
        ],
      },
      {
        source: "/project/:name",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());

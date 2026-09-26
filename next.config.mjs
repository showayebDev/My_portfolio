/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: false,
  skipTrailingSlashRedirect: true,
  experimental: {
    // Keep prefetched & visited routes in Next.js Client Router memory cache for 24h
    staleTimes: {
      dynamic: 86400,
      static: 86400,
    },
  },
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
        source: "/profile-pic.png",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/favicon.ico",
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
        // 4. Next.js RSC Data Payloads (?_rsc=build_token):
        // Each build generates a unique _rsc token. Safe to cache as immutable in disk cache!
        // On rebuild, the new _rsc token automatically fetches fresh content.
        source: "/:path*",
        has: [
          {
            type: "query",
            key: "_rsc",
          },
        ],
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // 5. HTML Document requests (initial load / F5 refresh without _rsc):
        // Validates via ETag (returns 304 Not Modified if unchanged, or 200 OK with new build if rebuilt)
        source: "/",
        missing: [
          {
            type: "query",
            key: "_rsc",
          },
        ],
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/project",
        missing: [
          {
            type: "query",
            key: "_rsc",
          },
        ],
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/project/:name",
        missing: [
          {
            type: "query",
            key: "_rsc",
          },
        ],
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;

import("@opennextjs/cloudflare").then((m) => m.initOpenNextCloudflareForDev());

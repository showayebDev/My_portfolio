import { headers } from "next/headers";

export const dynamic = 'force-dynamic';

export default async function robots() {
  let siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/$/, '');

  if (!siteUrl) {
    try {
      const headersList = await headers();
      const host = headersList.get('x-forwarded-host') || headersList.get('host');
      const proto = headersList.get('x-forwarded-proto') || 'https';
      if (host) {
        siteUrl = `${proto}://${host}`.replace(/\/$/, '');
      }
    } catch {
      // ignore
    }
  }

  if (!siteUrl) {
    siteUrl = 'http://localhost:3000';
  } else if (!/^https?:\/\//i.test(siteUrl)) {
    siteUrl = `https://${siteUrl}`;
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

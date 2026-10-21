export default function robots() {
  const rawSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').trim().replace(/\/$/, '');
  const siteUrl = rawSiteUrl && !/^https?:\/\//i.test(rawSiteUrl) ? `https://${rawSiteUrl}` : rawSiteUrl;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}

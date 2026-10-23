import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const baseUrl = (site ? site.toString() : (process.env.PUBLIC_SITE_URL || 'http://localhost:4321')).replace(/\/$/, '');
  const sitemapUrl = `${baseUrl}/sitemap.xml`;

  const robotsTxt = `User-agent: *
Allow: /

# Disallow build/cache internals if any
Disallow: /_astro/
Disallow: /api/

# Host & Sitemap
Host: ${new URL(baseUrl).host}
Sitemap: ${sitemapUrl}
`;

  return new Response(robotsTxt.trim() + '\n', {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};

import type { APIRoute } from 'astro';
import { getAllProjects } from '../lib/api.js';

interface SitemapEntry {
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: string;
}

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = (
    import.meta.env.PUBLIC_SITE_URL ||
    process.env.PUBLIC_SITE_URL ||
    (site ? site.toString() : 'https://showayeb.dev')
  ).replace(/\/$/, '');
  const now = new Date().toISOString();

  const entries: SitemapEntry[] = [
    {
      url: `${baseUrl}/`,
      lastmod: now,
      changefreq: 'weekly',
      priority: '1.0',
    },
    {
      url: `${baseUrl}/project`,
      lastmod: now,
      changefreq: 'weekly',
      priority: '0.8',
    },
  ];

  try {
    const { projects } = await getAllProjects();
    if (Array.isArray(projects)) {
      for (const project of projects) {
        const slug = project.slug || project.name;
        if (!slug) continue;

        const lastmod = project.updatedAt
          ? new Date(project.updatedAt).toISOString()
          : project.createdAt
            ? new Date(project.createdAt).toISOString()
            : now;

        entries.push({
          url: `${baseUrl}/project/${slug}`,
          lastmod,
          changefreq: 'monthly',
          priority: '0.7',
        });
      }
    }
  } catch (error) {
    console.error('[sitemap.xml] Error fetching projects:', error);
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (entry) => `  <url>
    <loc>${entry.url}</loc>${entry.lastmod ? `\n    <lastmod>${entry.lastmod}</lastmod>` : ''}${entry.changefreq ? `\n    <changefreq>${entry.changefreq}</changefreq>` : ''}${entry.priority ? `\n    <priority>${entry.priority}</priority>` : ''}
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml.trim() + '\n', {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
};

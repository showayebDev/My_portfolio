import { getAllProjects } from "@/lib/getPortfolioData";

export const revalidate = 60; // Revalidate every 60 seconds (or instantly on demand)

export default async function sitemap() {
  const rawSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').trim().replace(/\/$/, '');
  const siteUrl = rawSiteUrl && !/^https?:\/\//i.test(rawSiteUrl) ? `https://${rawSiteUrl}` : rawSiteUrl;
  const today = new Date();

  // Static routes
  const staticRoutes = [
    {
      url: `${siteUrl}`,
      lastModified: today,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/project`,
      lastModified: today,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  try {
    const { projects } = await getAllProjects();
    const projectRoutes = (projects || [])
      .filter((p) => (p.slug || p.name) && p._status !== 'draft')
      .map((p) => ({
        url: `${siteUrl}/project/${encodeURIComponent(p.slug || p.name)}`,
        lastModified: p.updatedAt ? new Date(p.updatedAt) : today,
        changeFrequency: "weekly",
        priority: 0.7,
      }));

    return [...staticRoutes, ...projectRoutes];
  } catch (e) {
    console.error("Error generating dynamic sitemap:", e);
    return staticRoutes;
  }
}

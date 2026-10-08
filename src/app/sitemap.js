import { getAllProjects } from "@/lib/getPortfolioData";
import { getSiteUrl } from "@/lib/siteUrl";

export const revalidate = 60; // Revalidate every 60 seconds (or instantly on demand)

export default async function sitemap() {
  const siteUrl = getSiteUrl();
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
      .filter((p) => (p.slug || p.name) && (p.sortOrder ?? p.sort_order ?? 0) !== 0)
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

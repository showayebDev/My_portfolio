import { getAllProjects } from "@/lib/getPortfolioData";
import { headers } from "next/headers";

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every 60 seconds (or instantly on demand)

export default async function sitemap() {
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

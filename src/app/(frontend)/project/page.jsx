import { getAllProjects } from "@/lib/getPortfolioData";
import ProjectClient from "@/components/ProjectClient";

export const revalidate = 3600;

export async function generateMetadata() {
  const { profile } = await getAllProjects();
  const title = profile.name ? `Projects – ${profile.name}` : "Projects";
  const description =
    profile.siteDescription ||
    "Browse my recent open source software, web applications, and developer tools.";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function Project() {
  const { projects, profile } = await getAllProjects();
  return <ProjectClient initialProjects={projects} initialProfile={profile} />;
}

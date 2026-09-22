import portfolioData from "@/data/portfolio-data.json";

export async function generateStaticParams() {
  const projects = portfolioData.projects || [];
  return projects.map((p) => ({
    name: p.name,
  }));
}

function getProject(name) {
  if (!name) return null;
  const project = (portfolioData.projects || []).find(
    (p) => p.name?.toLowerCase() === name.toLowerCase() && p.sort_order !== null && p.sort_order !== 0
  );
  if (!project) return null;
  return {
    ...project,
    buttons: typeof project.buttons === "string" ? JSON.parse(project.buttons) : project.buttons,
  };
}

export async function generateMetadata({ params }) {
  const { name } = await params;
  const project = await getProject(name);

  if (project) {
    const imgUrl = project.img || null;

    return {
      title: project.title,
      description: project.description,
      icons: imgUrl
        ? {
          icon: imgUrl,
          apple: imgUrl,
        }
        : undefined,
    };
  }

  return {
    title: "Project Not Found",
  };
}

export default function ProjectLayout({ children }) {
  return <>{children}</>;
}

import { queryD1 } from "../../../lib/db";

async function getProject(name) {
  if (!name) return null;
  try {
    const rawProjects = await queryD1(
      "SELECT * FROM projects WHERE LOWER(name) = LOWER(?) AND sort_order IS NOT NULL AND sort_order != 0 LIMIT 1",
      [name]
    );
    if (rawProjects.length === 0) return null;
    const p = rawProjects[0];
    return {
      ...p,
      buttons: typeof p.buttons === "string" ? JSON.parse(p.buttons) : p.buttons,
    };
  } catch (error) {
    console.error("Error fetching project in layout:", error);
    return null;
  }
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

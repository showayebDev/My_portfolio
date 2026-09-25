import portfolioData from "@/data/portfolio-data.json";

export async function generateStaticParams() {
  const projects = portfolioData.projects || [];
  return projects.map((p) => ({
    name: p.name,
  }));
}

function parseButtonsSafely(buttons) {
  if (Array.isArray(buttons)) return buttons;
  if (typeof buttons === "string") {
    try {
      const parsed = JSON.parse(buttons);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === "string") return JSON.parse(parsed);
    } catch {
      return [];
    }
  }
  return [];
}

function getProject(name) {
  if (!name) return null;
  const project = (portfolioData.projects || []).find(
    (p) => p.name?.toLowerCase() === name.toLowerCase()
  );
  if (!project) return null;
  return {
    ...project,
    buttons: parseButtonsSafely(project.buttons),
  };
}

export async function generateMetadata({ params }) {
  const { name } = await params;
  const project = getProject(name);

  if (project) {
    const title = `${project.title} – Showayeb Ahamed`;
    const description = project.description || `Explore ${project.title} by Showayeb Ahamed.`;
    const projectUrl = `https://showayeb.dev/project/${project.name}`;

    const rawImg = project.img || null;
    const fullImgUrl = rawImg
      ? (rawImg.startsWith("http") ? rawImg : `https://showayeb.dev${rawImg.startsWith("/") ? "" : "/"}${rawImg}`)
      : "https://showayeb.dev/profile-pic.png";

    const buttonNames = (project.buttons || []).map((b) => b.name).filter(Boolean);
    const keywords = [
      project.title,
      project.name,
      ...buttonNames,
      "Showayeb Ahamed",
      "Portfolio Project",
      "Web Developer",
      "Software Engineer",
      "Open Source",
    ];

    return {
      title,
      description,
      keywords: keywords.join(", "),
      metadataBase: new URL("https://showayeb.dev"),
      alternates: {
        canonical: projectUrl,
      },
      openGraph: {
        title,
        description,
        url: projectUrl,
        siteName: "Showayeb Ahamed's Portfolio",
        images: [
          {
            url: fullImgUrl,
            width: 1200,
            height: 630,
            alt: project.title,
          },
        ],
        locale: "en_US",
        type: "article",
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
        images: [fullImgUrl],
      },
      icons: rawImg
        ? {
            icon: rawImg,
            apple: rawImg,
          }
        : {
            icon: "/favicon.ico",
          },
    };
  }

  return {
    title: "Project Not Found – Showayeb Ahamed",
    description: "The requested project could not be found.",
  };
}

export default async function ProjectLayout({ children, params }) {
  const { name } = await params;
  const project = getProject(name);

  const fullImgUrl = project?.img
    ? (project.img.startsWith("http") ? project.img : `https://showayeb.dev${project.img.startsWith("/") ? "" : "/"}${project.img}`)
    : "https://showayeb.dev/profile-pic.png";

  const jsonLd = project
    ? {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        name: project.title,
        description: project.description,
        url: `https://showayeb.dev/project/${project.name}`,
        image: fullImgUrl,
        author: {
          "@type": "Person",
          name: "Showayeb Ahamed",
          url: "https://showayeb.dev",
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd),
          }}
        />
      )}
      {children}
    </>
  );
}

import fs from "fs";
import path from "path";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "@/components/button";
import MarkdownView from "@/components/MarkdownView";
import ProjectBreadcrumbs from "@/components/ProjectBreadcrumbs";
import { getProjectBySlug, getAllProjects } from "@/lib/getPortfolioData";
import { PROJECT_HERO_IMAGE_CONFIG } from "@/lib/prefetch";
import { marked } from "marked";
import hljs from "highlight.js";

// Custom code block renderer with highlight.js syntax highlighting
const renderer = {
  code({ text, lang }) {
    const validLanguage = lang && hljs.getLanguage(lang) ? lang : null;
    const highlighted = validLanguage
      ? hljs.highlight(text, { language: validLanguage }).value
      : hljs.highlightAuto(text).value;
    const langClass = validLanguage ? ` class="hljs language-${validLanguage}"` : ' class="hljs"';
    return `<pre><code${langClass}>${highlighted}</code></pre>`;
  },
};

marked.use({ renderer, gfm: true, breaks: true });

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  try {
    const { projects } = await getAllProjects();
    return (projects || []).map((p) => ({
      name: p.slug || p.name,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { name } = await params;
  const project = await getProjectBySlug(name);

  if (!project) {
    return {
      title: "Project Not Found",
    };
  }

  const title = `${project.title} – Projects`;
  const description = project.description || "";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
    },
  };
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

function getProjectMarkdown(project) {
  if (project.readmeContent && project.readmeContent.trim().length > 0) {
    return project.readmeContent;
  }

  // Fallback 1: Check project.readme path in public folder
  if (project.readme) {
    try {
      const cleanReadme = project.readme.startsWith("/") ? project.readme.slice(1) : project.readme;
      const fullPath = path.join(process.cwd(), "public", cleanReadme);
      if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath, "utf-8");
      }
    } catch (e) {
      console.warn(`Failed to read local markdown for ${project.name || project.slug}:`, e.message);
    }
  }

  // Fallback 2: Check public/readme/${project.name || project.slug}.md
  const pName = project.slug || project.name;
  if (pName) {
    try {
      const directPath = path.join(process.cwd(), "public", "readme", `${pName}.md`);
      if (fs.existsSync(directPath)) {
        return fs.readFileSync(directPath, "utf-8");
      }
    } catch (e) {}
  }

  return "";
}

export default async function ProjectPage({ params }) {
  const { name } = await params;
  const project = await getProjectBySlug(name);

  if (!project) {
    notFound();
  }

  const formattedProject = {
    ...project,
    buttons: parseButtonsSafely(project.buttons),
  };

  const rawMarkdown = getProjectMarkdown(formattedProject);
  const renderedHtml = rawMarkdown ? marked.parse(rawMarkdown) : "";

  const imgSrc =
    (typeof formattedProject.image === "object" && formattedProject.image?.url)
      ? formattedProject.image.url
      : formattedProject.imageUrl || formattedProject.img || null;

  return (
    <div className="container mx-0 md:mx-auto px-4 py-8 max-w-[1280px]">
      {/* Breadcrumb */}
      <ProjectBreadcrumbs projectTitle={formattedProject.title} />

      <div className="flex flex-col lg:flex-row gap-8 md:items-center lg:items-start">
        <div className="md:w-1/4 lg:sticky top-8">
          {imgSrc && (
            <div>
              <Image
                src={imgSrc}
                alt={formattedProject.title}
                className="rounded-lg shadow-lg w-full"
                width={PROJECT_HERO_IMAGE_CONFIG.width}
                height={PROJECT_HERO_IMAGE_CONFIG.height}
                placeholder="blur"
                blurDataURL={
                  formattedProject.blurDataURL ||
                  "data:image/webp;base64,UklGRjIAAABXRUJQVlA4ICYAAABQAQCdASoKAAoABUB8JZQABAAAAP7uHqfoJXiW+ZLl0iBxIYAAAA=="
                }
                priority
                quality={PROJECT_HERO_IMAGE_CONFIG.quality}
              />
              <div className="mt-4">
                <h1 className="text-2xl font-semibold mb-2">{formattedProject.title}</h1>
                <p className="text-[var(--secondary-text-color)] mb-4">
                  {formattedProject.description}
                </p>
                <div className="flex flex-col gap-3">
                  {formattedProject.buttons?.map((btn, i) => {
                    const isGitHub = (btn.name || "").toLowerCase().includes("github");
                    return (
                      <Button
                        key={i}
                        text={btn.name}
                        link={btn.link}
                        className={`flex items-center justify-center gap-2.5 px-5 py-3 text-sm font-semibold rounded-xl w-full text-center transition-all duration-300 transform active:scale-[0.98] shadow-sm ${
                          isGitHub
                            ? "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white shadow-slate-900/10 hover:shadow-md hover:-translate-y-0.5 border border-transparent font-medium"
                            : "bg-[var(--card-bg-color)] border border-[var(--border-color)] text-[var(--text-color)] hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md hover:-translate-y-0.5 font-medium"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="md:w-3/4">
          {renderedHtml ? (
            <MarkdownView html={renderedHtml} />
          ) : (
            <div className="text-[var(--secondary-text-color)] py-8">
              No README available for this project.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

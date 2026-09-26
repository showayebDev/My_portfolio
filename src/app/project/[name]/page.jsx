import fs from "fs";
import path from "path";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import Button from "@/components/button";
import MarkdownView from "@/components/MarkdownView";
import portfolioData from "@/data/portfolio-data.json";
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

export const dynamic = "force-static";
export const dynamicParams = false;

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
      console.warn(`Failed to read local markdown for ${project.name}:`, e.message);
    }
  }

  // Fallback 2: Check public/readme/${project.name}.md
  try {
    const directPath = path.join(process.cwd(), "public", "readme", `${project.name}.md`);
    if (fs.existsSync(directPath)) {
      return fs.readFileSync(directPath, "utf-8");
    }
  } catch (e) {}

  return "";
}

export default async function ProjectPage({ params }) {
  const { name } = await params;
  const project = (portfolioData.projects || []).find(
    (p) => p.name?.toLowerCase() === (name || "").toLowerCase()
  );

  if (!project) {
    notFound();
  }

  const formattedProject = {
    ...project,
    buttons: parseButtonsSafely(project.buttons),
  };

  const rawMarkdown = getProjectMarkdown(formattedProject);
  const renderedHtml = rawMarkdown ? marked.parse(rawMarkdown) : "";

  const imgSrc = formattedProject.img || null;

  return (
    <div className="container mx-0 md:mx-auto px-4 py-8 max-w-[1280px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--secondary-text-color)] font-medium mb-8">
        <Link href="/" prefetch={false} className="hover:text-[var(--text-color)] hover:underline transition-colors duration-200">
          Home
        </Link>
        <span>/</span>
        <Link href="/project" prefetch={false} className="hover:text-[var(--text-color)] hover:underline transition-colors duration-200">
          Projects
        </Link>
        <span>/</span>
        <span className="text-[var(--text-color)] font-semibold">{formattedProject.title}</span>
      </div>

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
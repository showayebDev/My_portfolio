import fs from "fs";
import path from "path";
import Image from "next/image";
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
    } catch (_e) { }
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
    <div className="container mx-auto px-4 py-8 max-w-7xl min-h-screen">
      {/* Breadcrumb */}
      <ProjectBreadcrumbs projectTitle={formattedProject.title} />

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left: Compact Sticky Project Dossier Card */}
        <div className="w-full lg:w-[325px] xl:w-[340px] shrink-0 lg:sticky top-6 self-start space-y-4">
          <div className="collage-card p-3.5 sm:p-4 relative overflow-visible shadow-sm">
            {/* Washi Tape */}
            <div className="washi-tape washi-tape-center washi-tape-coral !w-[70px] !h-[18px] !-top-2" />


            {/* Square Polaroid Photo Frame */}
            {imgSrc && (
              <div className="flex justify-center mb-3">
                <div className="polaroid-frame !p-2 !pb-3">
                  <div className="w-48 h-48 sm:w-52 sm:h-52 aspect-square overflow-hidden border border-[var(--border-color)] bg-[var(--card-kraft-color)] relative rounded flex items-center justify-center">
                    <Image
                      src={imgSrc}
                      alt={formattedProject.title}
                      className="w-full h-full object-contain transition-transform duration-300 hover:scale-105"
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
                  </div>
                  <div className="polaroid-caption !text-sm !mt-1.5 truncate max-w-[200px]">
                    {formattedProject.title}
                  </div>
                </div>
              </div>
            )}

            {/* Description Note */}
            <div className="mb-3 p-2.5 bg-[var(--card-note-color)] rounded-lg border border-[var(--border-color)] text-[11px] text-[var(--secondary-text-color)] font-medium leading-relaxed">
              <p className="line-clamp-3 hover:line-clamp-none transition-all">{formattedProject.description}</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2">
              {formattedProject.buttons?.map((btn, i) => {
                const isGitHub = (btn.name || "").toLowerCase().includes("github");
                return (
                  <Button
                    key={i}
                    text={btn.name}
                    link={btn.link}
                    className={`tactile-btn flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold w-full text-center transition-all duration-200 ${isGitHub
                        ? "tactile-btn-primary"
                        : "bg-[var(--card-kraft-color)] hover:bg-[var(--card-bg-color)]"
                      }`}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Technical Field Report Document */}
        <div className="w-full flex-1 min-w-0">
          <div className="relative">
            {/* Top Washi Tape on Document */}
            <div className="washi-tape washi-tape-corner-left washi-tape-cyan !w-[75px] !-top-3 !left-6" />

            {/* Header Ribbon */}
            <div className="flex items-center justify-between mb-4 px-2">
              <span className="dymo-label text-[10px]">
                ✦ ARCHIVAL DOCUMENTATION // SPECIFICATION ✦
              </span>
              <span className="collage-handwritten text-lg font-bold text-[var(--link-color)]">
                Field Notes & Guide
              </span>
            </div>

            {renderedHtml ? (
              <MarkdownView html={renderedHtml} />
            ) : (
              <div className="collage-card p-8 text-center text-[var(--secondary-text-color)] collage-mono text-sm">
                No archival README document filed for this exhibit.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

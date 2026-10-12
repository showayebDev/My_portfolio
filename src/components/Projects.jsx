"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AnimatedContent from "@/context/AnimatedContent/AnimatedContent";
import { prefetchProject, prefetchRoute } from "@/lib/prefetch";

const tapeColors = [
  "washi-tape-amber",
  "washi-tape-sage",
  "washi-tape-cyan",
  "washi-tape-coral",
  "washi-tape-lavender",
  "washi-tape-rose",
];

const Projects = ({ projectData = [] }) => {
  const router = useRouter();

  const handlePrefetch = (name, imgSrc) => {
    prefetchProject(router, name, imgSrc);
  };

  const handlePrefetchAll = () => {
    prefetchRoute(router, "/project");
  };

  return (
    <AnimatedContent
      distance={20}
      direction="vertical"
      Zindex={false}
      duration={0.3}
      ease="power2.out"
    >
      <section className="collage-card p-6 sm:p-7 relative overflow-visible" id="project">
        {/* Top Washi Tape */}
        <div className="washi-tape washi-tape-center washi-tape-coral" />

        {/* Section Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-3 border-b-2 border-dashed border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <span className="dymo-label">
              ✦ PROJECTS ✦
            </span>
            <span className="collage-handwritten text-xl font-bold text-[var(--link-color)] -rotate-1 hidden sm:inline">
              Selected Works
            </span>
          </div>
          <Link
            href="/project"
            prefetch={false}
            onMouseEnter={handlePrefetchAll}
            onTouchStart={handlePrefetchAll}
            className="postage-stamp bg-[var(--card-kraft-color)] hover:bg-[var(--card-bg-color)] border-dashed border-[var(--border-color)] text-xs font-bold uppercase tracking-wider text-[var(--link-color)] transition-transform hover:scale-105"
          >
            🎟️ VIEW ARCHIVE →
          </Link>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {projectData
            .filter((p) => p._status !== "draft")
            .map((project, idx) => {
              const slug = project.slug || project.name;
              const imgSrc =
                (typeof project.image === "object" && project.image?.url)
                  ? project.image.url
                  : project.imageUrl || project.img || null;
              const tapeColor = tapeColors[idx % tapeColors.length];

              return (
                <Link
                  key={slug}
                  href={`/project/${slug}`}
                  prefetch={false}
                  className="block group"
                  onMouseEnter={() => handlePrefetch(slug, imgSrc)}
                  onTouchStart={() => handlePrefetch(slug, imgSrc)}
                >
                  <div className="p-4 bg-[var(--card-note-color)] hover:bg-[var(--card-kraft-color)] border-2 border-[var(--border-color)] rounded-xl transition-all duration-250 cursor-pointer shadow-sm relative overflow-visible hover:-translate-y-1.5 hover:shadow-md">
                    {/* Decorative Corner Tape */}
                    <div
                      className={`washi-tape ${tapeColor} !w-[55px] !h-[14px] !top-[-7px] !right-[12px] !transform !rotate-3`}
                    />

                    <div className="flex items-center gap-3.5">
                      {/* Mini Polaroid Photo Frame */}
                      <div className="w-16 h-16 rounded-lg overflow-hidden border-2 border-[var(--border-color)] bg-[var(--card-bg-color)] p-1 shrink-0 shadow-sm relative group-hover:scale-105 group-hover:-rotate-2 transition-transform">
                        {imgSrc ? (
                          <Image
                            src={imgSrc}
                            alt={project.title}
                            width={64}
                            height={64}
                            quality={75}
                            className="w-full h-full object-contain rounded"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl bg-[var(--card-kraft-color)]">
                            🎨
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <h4 className="collage-serif text-base font-bold text-[var(--text-color)] group-hover:text-[var(--link-color)] transition-colors truncate">
                            {project.title}
                          </h4>
                        </div>
                        <p className="text-xs text-[var(--secondary-text-color)] line-clamp-2 mt-0.5 font-medium leading-relaxed">
                          {project.description}
                        </p>
                      </div>

                      {/* Arrow Seal */}
                      <div className="shrink-0 w-8 h-8 rounded-full border border-[var(--border-color)] bg-[var(--card-bg-color)] flex items-center justify-center text-[var(--text-color)] group-hover:bg-[var(--btn-2-bg)] group-hover:text-[var(--btn-2-text)] transition-colors shadow-sm">
                        <svg
                          className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            d="M9 5l7 7-7 7"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2.5"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
        </div>
      </section>
    </AnimatedContent>
  );
};

export default Projects;

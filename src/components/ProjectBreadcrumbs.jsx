"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { prefetchRoute } from "@/lib/prefetch";

export default function ProjectBreadcrumbs({ projectTitle }) {
  const router = useRouter();

  const handlePrefetchHome = () => {
    prefetchRoute(router, "/");
  };

  const handlePrefetchProjects = () => {
    prefetchRoute(router, "/project");
  };

  return (
    <div className="flex items-center flex-wrap gap-2 text-xs collage-mono font-bold text-[var(--secondary-text-color)] mb-6 py-2 px-3 bg-[var(--card-note-color)] border border-[var(--border-color)] rounded-lg shadow-sm w-fit">
      <Link
        href="/"
        prefetch={false}
        onMouseEnter={handlePrefetchHome}
        onTouchStart={handlePrefetchHome}
        className="hover:text-[var(--link-color)] transition-colors hover:underline"
      >
        HOME
      </Link>
      <span className="text-[var(--border-subtle)]">⟶</span>
      <Link
        href="/project"
        prefetch={false}
        onMouseEnter={handlePrefetchProjects}
        onTouchStart={handlePrefetchProjects}
        className="hover:text-[var(--link-color)] transition-colors hover:underline"
      >
        PROJECTS
      </Link>
      <span className="text-[var(--border-subtle)]">⟶</span>
      <span className="text-[var(--text-color)] bg-[var(--card-kraft-color)] px-2 py-0.5 rounded border border-[var(--border-subtle)] truncate max-w-[200px] sm:max-w-none">
        {projectTitle}
      </span>
    </div>
  );
}

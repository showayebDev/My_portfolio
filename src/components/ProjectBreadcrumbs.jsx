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
    <div className="flex items-center gap-2 text-sm text-[var(--secondary-text-color)] font-medium mb-8">
      <Link
        href="/"
        prefetch={false}
        onMouseEnter={handlePrefetchHome}
        onTouchStart={handlePrefetchHome}
        className="hover:text-[var(--text-color)] hover:underline transition-colors duration-200"
      >
        Home
      </Link>
      <span>/</span>
      <Link
        href="/project"
        prefetch={false}
        onMouseEnter={handlePrefetchProjects}
        onTouchStart={handlePrefetchProjects}
        className="hover:text-[var(--text-color)] hover:underline transition-colors duration-200"
      >
        Projects
      </Link>
      <span>/</span>
      <span className="text-[var(--text-color)] font-semibold">{projectTitle}</span>
    </div>
  );
}

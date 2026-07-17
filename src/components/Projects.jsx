"use client";

import Image from "next/image";
import Link from "next/link";
import AnimatedContent from "@/context/AnimatedContent/AnimatedContent";

const Projects = ({ projectData = [] }) => {
  return (
    <>
      <AnimatedContent
        distance={50}
        direction="vertical"
        Zindex={false}
        duration={0.8}
        ease="power3.out"
      >
        <section
          className="bg-[var(--card-bg-color)] border border-[var(--border-color)] rounded-2xl p-6 shadow-md"
          id="project"
        >
          <div className="flex justify-between items-center mb-6 border-b border-[var(--border-color)] pb-2 text-[var(--secondary-text-color)]">
            <span className="text-sm font-semibold tracking-wide text-[var(--text-color)]">
              Projects
            </span>
            <Link
              href="/project"
              className="text-xs font-semibold uppercase tracking-wider text-[var(--link-color)] hover:underline"
            >
              View All
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projectData.slice(0, 4).map((project) => {
              const imgSrc = project.img || null;
              return (
                <Link
                  key={project.name}
                  href={`/project/${project.name}`}
                  passHref
                  className="block"
                >
                  <div className="flex items-center justify-between p-4 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl hover:bg-[var(--border-color)] transition-all duration-300 cursor-pointer group shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden border border-[var(--border-color)] bg-[var(--bg-color)] relative">
                        {imgSrc ? (
                          <Image
                            src={imgSrc}
                            alt={project.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-xl select-none">💻</span>
                        )}
                      </div>
                      <div className="text-left">
                        <h4 className="text-sm font-bold text-[var(--text-color)] transition-colors group-hover:text-[var(--link-color)]">
                          {project.title}
                        </h4>
                        <p className="text-xs text-[var(--secondary-text-color)] line-clamp-1 max-w-[200px] mb-1">
                          {project.description}
                        </p>
                      </div>
                    </div>
                    <svg
                      className="w-4 h-4 text-[var(--secondary-text-color)] group-hover:text-[var(--text-color)] transform translate-x-0 group-hover:translate-x-1 transition-all duration-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        d="M9 5l7 7-7 7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                      ></path>
                    </svg>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      </AnimatedContent>
    </>
  );
};

export default Projects;

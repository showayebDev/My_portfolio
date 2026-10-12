"use client";

import Image from "next/image";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/button";
import AnimatedContent from "@/context/AnimatedContent/AnimatedContent";
import FadeContent from "@/context/FadeContent/FadeContent";
import { BsGithub } from "react-icons/bs";
import { prefetchProject, prefetchRoute, PROJECT_HERO_IMAGE_CONFIG } from "@/lib/prefetch";

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

const tapeColors = [
  "washi-tape-amber",
  "washi-tape-sage",
  "washi-tape-cyan",
  "washi-tape-coral",
  "washi-tape-lavender",
  "washi-tape-rose",
];

export default function ProjectClient({ initialProjects = [], initialProfile = {} }) {
  const router = useRouter();

  const handlePrefetch = (name, imgSrc) => {
    prefetchProject(router, name, imgSrc);
  };

  const handlePrefetchHome = () => {
    prefetchRoute(router, "/");
  };

  const projectData = (initialProjects || [])
    .filter((p) => p._status !== "draft")
    .sort((a, b) => (b.sortOrder ?? b.sort_order ?? 0) - (a.sortOrder ?? a.sort_order ?? 0))
    .map((p) => ({
      ...p,
      name: p.slug || p.name,
      img:
        (typeof p.image === "object" && p.image?.url)
          ? p.image.url
          : p.imageUrl || p.img || null,
      buttons: parseButtonsSafely(p.buttons),
    }));

  const socials = Array.isArray(initialProfile?.socials) ? initialProfile.socials : [];
  const github = socials.find(
    (s) =>
      s.platform?.toLowerCase() === "github" ||
      s.name?.toLowerCase() === "github"
  );
  const githubUrl =
    (github && github.url?.trim()) ||
    (initialProfile?.exploreMoreGitHubUrl &&
    initialProfile.exploreMoreGitHubUrl !== "https://github.com"
      ? initialProfile.exploreMoreGitHubUrl
      : (github?.url || "https://github.com"));

  return (
    <div id="projects" className="relative overflow-visible flex flex-col py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-screen">
      {/* Top Header Bar: Archival Breadcrumb */}
      <div className="flex items-center justify-between gap-4 mb-8">
        {/* Archival Card Catalog Breadcrumb */}
        <div className="flex items-center flex-wrap gap-2 text-xs collage-mono font-bold text-[var(--secondary-text-color)] py-2 px-3.5 bg-[var(--card-note-color)] border-2 border-[var(--border-color)] rounded-xl shadow-sm">
          <Link
            href="/"
            prefetch={false}
            onMouseEnter={handlePrefetchHome}
            onTouchStart={handlePrefetchHome}
            className="hover:text-[var(--link-color)] transition-colors hover:underline flex items-center gap-1.5"
          >
            <span>◄</span>
            <span>HOME</span>
          </Link>
          <span className="text-[var(--border-subtle)]">⟶</span>
          <span className="text-[var(--text-color)] bg-[var(--card-kraft-color)] px-2.5 py-0.5 rounded border border-[var(--border-subtle)] uppercase">
            PROJECTS
          </span>
        </div>
      </div>

      {/* Exhibition Main Header */}
      <AnimatedContent
        distance={20}
        direction="vertical"
        reverse={false}
        duration={0.35}
        ease="power2.out"
        initialOpacity={0.7}
        animateOpacity
        scale={0.99}
        threshold={0.05}
        delay={0}
      >
        <FadeContent blur={false} duration={300} easing="ease-out" initialOpacity={0.7}>
          <div className="text-center mb-10 relative">
            {/* Top Washi Tape */}
            <div className="washi-tape washi-tape-center washi-tape-amber !w-[110px]" />

            <div className="inline-block mb-3 pt-2">
              <span className="dymo-label text-xs sm:text-sm">
                ✦ PROJECTS ✦
              </span>
            </div>
            <h1 className="collage-serif text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--text-color)] tracking-tight">
              Curated Works & Quests
            </h1>
            <p className="collage-handwritten text-xl sm:text-2xl font-bold text-[var(--link-color)] mt-2">
              Inspect recent builds, source code, and live software deployments
            </p>
          </div>
        </FadeContent>
      </AnimatedContent>

      {/* Projects Grid */}
      <div className="w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-stretch">
          {projectData.map((project, index) => {
            const slug = project.slug || project.name;
            const imgSrc = project.img || null;
            const tapeColor = tapeColors[index % tapeColors.length];
            const isAlt = index % 2 === 1;
            const specimenNumber = String(index + 1).padStart(2, "0");

            return (
              <div
                className="w-full"
                key={slug || index}
                onMouseEnter={() => handlePrefetch(slug, imgSrc)}
              >
                <Link
                  href={`/project/${slug}`}
                  prefetch={false}
                  onMouseEnter={() => handlePrefetch(slug, imgSrc)}
                  onTouchStart={() => handlePrefetch(slug, imgSrc)}
                  className="block h-full cursor-pointer group"
                >
                  <AnimatedContent
                    distance={25}
                    direction="vertical"
                    reverse={false}
                    duration={0.35}
                    ease="power2.out"
                    initialOpacity={0.6}
                    animateOpacity
                    scale={0.98}
                    threshold={0.05}
                    delay={0}
                    Zindex={false}
                  >
                    {/* Collage Exhibition Card */}
                    <div
                      className={`collage-card p-4 sm:p-5 min-h-[380px] h-full flex flex-col justify-between relative overflow-visible ${
                        isAlt ? "hover:rotate-1" : "hover:-rotate-1"
                      }`}
                    >
                      {/* Corner Washi Tape */}
                      <div
                        className={`washi-tape ${tapeColor} !w-[65px] !h-[16px] !top-[-8px] !right-[16px] !transform ${
                          isAlt ? "!rotate-4" : "!-rotate-4"
                        }`}
                      />

                      {/* Top: Stage / Specimen Badge + Polaroid Photo */}
                      <div>
                        {/* Card Top Row: Star Badge */}
                        <div className="flex justify-end items-center min-h-[18px] mb-2 px-1">
                          {project.featured !== false && (
                            <span className="text-amber-500 text-xs font-bold">★</span>
                          )}
                        </div>

                        {/* Polaroid Image Frame */}
                        <div className="flex justify-center mb-3">
                          <div className="polaroid-frame !p-2 !pb-3">
                            <div className="w-48 h-48 sm:w-52 sm:h-52 aspect-square overflow-hidden border border-[var(--border-color)] bg-[var(--card-kraft-color)] relative rounded flex items-center justify-center">
                            {imgSrc ? (
                              <Image
                                className="w-full h-full object-contain transition-transform duration-500 ease-in-out group-hover:scale-105"
                                src={imgSrc}
                                alt={project.title}
                                width={500}
                                height={300}
                                placeholder="blur"
                                blurDataURL={
                                  project.blurDataURL ||
                                  "data:image/webp;base64,UklGRjIAAABXRUJQVlA4ICYAAABQAQCdASoKAAoABUB8JZQABAAAAP7uHqfoJXiW+ZLl0iBxIYAAAA=="
                                }
                                quality={PROJECT_HERO_IMAGE_CONFIG.quality}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-4xl">
                                🎨
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                        {/* Title and Short Details */}
                        <div className="px-1 text-left">
                          <h4 className="collage-serif text-lg font-bold text-[var(--text-color)] group-hover:text-[var(--link-color)] transition-colors line-clamp-1">
                            {project.title}
                          </h4>
                          <p className="text-xs text-[var(--secondary-text-color)] line-clamp-2 mt-1.5 font-medium leading-relaxed">
                            {project.description}
                          </p>
                        </div>
                      </div>

                      {/* Bottom Action Badges */}
                      <div
                        className="flex items-center gap-2 flex-wrap pt-3 mt-4 border-t-2 border-dashed border-[var(--border-subtle)]"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                        }}
                      >
                        {project.buttons?.length > 0 ? (
                          project.buttons.map((btn, i) => (
                            <Button
                              key={i}
                              text={btn.name}
                              link={btn.link}
                              className="tactile-btn px-3 py-1.5 text-xs font-bold flex items-center gap-1.5"
                            />
                          ))
                        ) : (
                          <span className="tactile-btn px-3 py-1.5 text-xs font-bold text-[var(--secondary-text-color)]">
                            VIEW DETAILS ⟶
                          </span>
                        )}
                      </div>
                    </div>
                  </AnimatedContent>
                </Link>
              </div>
            );
          })}
        </div>

        {/* Master GitHub Code Vault Showcase (Full-Width Bottom Banner) */}
        <div className="mt-12 w-full">
          <Link
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <AnimatedContent
              distance={25}
              direction="vertical"
              reverse={false}
              duration={0.35}
              ease="power2.out"
              initialOpacity={0.6}
              animateOpacity
              scale={0.99}
              threshold={0.05}
              delay={0}
            >
              <div className="collage-card collage-kraft p-6 sm:p-8 relative overflow-visible hover:shadow-xl transition-all">
                {/* Washi Tapes on Top Corners */}
                <div className="washi-tape washi-tape-corner-left washi-tape-amber !w-[90px]" />
                <div className="washi-tape washi-tape-corner-right washi-tape-sage !w-[90px]" />

                <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
                  {/* Left: GitHub Insignia Stamp + Text */}
                  <div className="flex flex-col md:flex-row items-center gap-5">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-[var(--border-color)] bg-[var(--card-bg-color)] flex items-center justify-center shadow-md shrink-0 relative group-hover:scale-105 group-hover:-rotate-6 transition-transform">
                      <BsGithub className="text-4xl sm:text-5xl text-[var(--text-color)] group-hover:text-[var(--link-color)] transition-colors" />
                      <div className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-[var(--stamp-red)] text-white text-[10px] flex items-center justify-center font-bold border border-[var(--border-color)]">
                        BONUS
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-center md:justify-start gap-2 mb-1.5">
                        <span className="dymo-label text-[10px]">
                          ✦ REPOSITORY VAULT ✦
                        </span>
                      </div>
                      <h3 className="collage-serif text-2xl sm:text-3xl font-bold text-[var(--text-color)]">
                        Explore Complete Open Source Vault
                      </h3>
                      <p className="text-xs sm:text-sm text-[var(--secondary-text-color)] mt-1 max-w-xl font-medium">
                        Visit my GitHub profile for full repositories, code experiments, packages, and developer utilities.
                      </p>
                    </div>
                  </div>

                  {/* Right: Tactile Vault Action Button */}
                  <div className="shrink-0">
                    <span className="tactile-btn tactile-btn-primary inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm uppercase tracking-wider font-extrabold group-hover:scale-105 transition-transform">
                      <span>[ VISIT GITHUB VAULT ↗ ]</span>
                    </span>
                  </div>
                </div>
              </div>
            </AnimatedContent>
          </Link>
        </div>
      </div>
    </div>
  );
}

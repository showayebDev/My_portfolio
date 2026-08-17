"use client";

import Image from "next/image";
import React from "react";
import Link from "next/link";
import Button from "@/components/button";
import AnimatedContent from "@/context/AnimatedContent/AnimatedContent";
import FadeContent from "@/context/FadeContent/FadeContent";
import { BsGithub } from "react-icons/bs";
import portfolioData from "@/data/portfolio-data.json";

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

export default function Project() {
  const rawProjects = portfolioData.projects || [];
  const projectData = rawProjects
    .filter((p) => p.sort_order !== null && p.sort_order !== 0)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map((p) => ({
      ...p,
      buttons: parseButtonsSafely(p.buttons),
    }));

  const socials = portfolioData.social?.socials || [];
  const github = socials.find((s) => s.platform?.toLowerCase() === "github");
  const githubUrl = github ? github.url : "https://github.com";

  return (
    <div id="projects" className="relative overflow-hidden flex flex-col py-8">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 max-w-5xl flex items-center gap-2 text-sm text-[var(--secondary-text-color)] font-medium mb-6">
        <Link href="/" className="hover:text-[var(--text-color)] hover:underline transition-colors duration-200">
          Home
        </Link>
        <span>/</span>
        <span className="text-[var(--text-color)] font-semibold">Projects</span>
      </div>

      {/* Section header */}
      <AnimatedContent
        distance={150}
        direction="vertical"
        reverse={true}
        duration={1.2}
        ease="power3.out"
        initialOpacity={0.2}
        animateOpacity
        scale={0.3}
        threshold={0.2}
        delay={0}
      >
        <FadeContent
          blur={true}
          duration={900}
          easing="ease-out"
          initialOpacity={0}
        >
          <p className="section__text__p1 text-center">Browse My Recent</p>
          <h1 className="title text-5xl text-center">Projects</h1>
        </FadeContent>
      </AnimatedContent>

      <div className="container mx-auto mt-4">
        <div className="flex justify-center flex-wrap gap-3 w-full max-w-5xl relative mx-auto p-1">
          {projectData.map((project, index) => {
            const imgSrc = project.img || null;
            return (
              <div className="w-full max-w-xs" key={project.name || index}>
                <Link href={`/project/${project.name}`} passHref>
                  <AnimatedContent
                    distance={150}
                    direction="vertical"
                    reverse={true}
                    duration={1.2}
                    ease="power3.out"
                    initialOpacity={0.2}
                    animateOpacity
                    scale={0.3}
                    threshold={0.2}
                    delay={0}
                  >
                    {/* Card */}
                    <div className="card shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-500 w-full bg-[var(--card-bg-color)] rounded-2xl h-[400px] overflow-hidden group">
                      <div>
                        {/* Project image */}
                        <div className="w-full h-[300px] overflow-hidden relative">
                          {imgSrc && (
                            <Image
                              className="w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
                              src={imgSrc}
                              alt={project.title}
                              width={500}
                              height={300}
                              quality={100}
                            />
                          )}
                        </div>

                        {/* Card body */}
                        <div className="card-body text-center mt-2">
                          <h4 className="card-title text-[23px] text-[var(--text-color)]">
                            {project.title}
                          </h4>
                          <div className="flex justify-center gap-2 flex-wrap">
                            {project.buttons?.map((btn, i) => (
                              <Button
                                key={i}
                                text={btn.name}
                                link={btn.link}
                                className="flex items-center gap-1.5 border border-[var(--border-color)] px-3 py-1 text-xs font-semibold text-[var(--text-color)] hover:text-indigo-500 hover:border-indigo-500/40 hover:bg-indigo-500/10 hover:shadow-sm transition-all duration-200 rounded-full"
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </AnimatedContent>
                </Link>
              </div>
            );
          })}

          <div className="w-full max-w-xs">
            <Link href={githubUrl} target="_blank" rel="noopener noreferrer" className="block h-full">
              <AnimatedContent
                distance={150}
                direction="vertical"
                reverse={true}
                duration={1.2}
                ease="power3.out"
                initialOpacity={0.2}
                animateOpacity
                scale={0.3}
                threshold={0.2}
                delay={0}
              >
                {/* Card */}
                <div className="card shadow-md hover:shadow-xl hover:-translate-y-2 transition-all duration-500 w-full bg-[var(--card-bg-color)] rounded-2xl h-[400px] overflow-hidden group flex flex-col justify-between">
                  {/* Glowing GitHub Icon Top Section */}
                  <div className="w-full h-[300px] bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.15),transparent_60%)]"></div>
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:20px_20px] [mask-image:radial-gradient(ellipse_at_center,white_60%,transparent_100%)]"></div>
                    <div className="absolute w-36 h-36 rounded-full bg-sky-500/10 blur-xl group-hover:bg-sky-500/20 transition-all duration-500"></div>

                    <div className="relative w-32 h-32 rounded-full border border-sky-500/30 flex items-center justify-center bg-slate-900/60 backdrop-blur-md shadow-[0_0_30px_rgba(56,189,248,0.15)] group-hover:shadow-[0_0_35px_rgba(56,189,248,0.3)] transition-all duration-500">
                      <div className="w-28 h-28 rounded-full border border-sky-400/20 flex items-center justify-center bg-slate-950/80">
                        <BsGithub className="text-[54px] text-white transition-all duration-500 group-hover:scale-110 group-hover:text-sky-400" />
                      </div>
                      <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-slate-900 border border-sky-500/40 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                        <span className="text-yellow-400 text-xs">⭐</span>
                      </div>
                    </div>
                  </div>

                  {/* Card body */}
                  <div className="card-body text-center p-3 flex flex-col justify-between flex-grow">
                    <div>
                      <h4 className="card-title text-[23px] text-[var(--text-color)] font-bold">
                        Explore More
                      </h4>
                      <p className="text-[12px] text-[var(--secondary-text-color)] mt-1 px-4 leading-normal">
                        Check out my full profile and other projects on GitHub
                      </p>
                    </div>
                    <div className="flex justify-center gap-2 flex-wrap mb-1">
                      <span className="border border-[var(--border-color)] px-4 py-1 font-bold text-[13px] text-[var(--text-color)] bg-[var(--card-bg-color)] group-hover:bg-[var(--bg-color)] group-hover:text-[var(--secondary-text-color)] group-hover:shadow transition-all ease-in-out duration-300 rounded-full">
                        GitHub
                      </span>
                    </div>
                  </div>
                </div>
              </AnimatedContent>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

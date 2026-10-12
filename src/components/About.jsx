"use client";

import React from "react";
import Image from "next/image";
import AnimatedContent from "@/context/AnimatedContent/AnimatedContent";
import { FaGraduationCap, FaSchool, FaBookReader, FaUniversity } from "react-icons/fa";

const iconMap = {
  FaGraduationCap,
  FaSchool,
  FaBookReader,
  FaUniversity,
};

const About = ({ educationData = [] }) => {
  const list = [...(educationData || [])].sort(
    (a, b) => (Number(b.sortOrder) || 0) - (Number(a.sortOrder) || 0)
  );

  if (!list.length) return null;

  return (
    <AnimatedContent
      distance={20}
      direction="vertical"
      duration={0.3}
      ease="power2.out"
      scale={0.99}
      delay={0.05}
    >
      <section className="collage-card p-6 sm:p-7 relative overflow-visible">
        {/* Washi Tape Accent */}
        <div className="washi-tape washi-tape-corner-left washi-tape-cyan" />

        {/* Section Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-3 border-b-2 border-dashed border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <span className="dymo-label">
              ✦ EDUCATION ✦
            </span>
          </div>
          <span className="collage-handwritten text-xl font-bold text-[var(--link-color)] -rotate-1">
            Studies & Archival Records
          </span>
        </div>

        {/* Education Index Cards */}
        <div className="space-y-4">
          {list.map((edu, idx) => {
            const imgSrc =
              (typeof edu.logo === "object" && edu.logo?.url)
                ? edu.logo.url
                : edu.logoUrl || (edu.src || null);
            const IconComp = iconMap[edu.icon] || FaGraduationCap;
            const period = edu.period || edu.direction || "";
            const isAlt = idx % 2 === 1;

            return (
              <div
                key={edu.id || idx}
                className={`p-4 bg-[var(--card-note-color)] hover:bg-[var(--card-kraft-color)] border border-[var(--border-color)] rounded-xl transition-all duration-200 group hover:-translate-y-1 shadow-sm relative flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isAlt ? "hover:rotate-[0.5deg]" : "hover:-rotate-[0.5deg]"
                }`}
              >
                {/* Left: Stamp Logo + Content */}
                <div className="flex items-start sm:items-center gap-4">
                  {/* Wax Seal / Circular Stamp Frame */}
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full border border-[var(--border-subtle)] bg-[var(--card-bg-color)] p-1.5 flex items-center justify-center shrink-0 shadow-sm relative group-hover:rotate-6 transition-transform">
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={edu.name}
                        width={50}
                        height={50}
                        className="w-full h-full object-contain select-none rounded-full"
                      />
                    ) : (
                      <IconComp className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    )}
                  </div>

                  <div>
                    <h4 className="collage-serif text-base font-bold text-[var(--text-color)] group-hover:text-[var(--link-color)] transition-colors">
                      {edu.name}
                    </h4>
                    <p className="text-xs text-[var(--secondary-text-color)] mt-0.5 font-medium leading-relaxed">
                      {edu.description}
                    </p>
                  </div>
                </div>

                {/* Right: Date Stamp */}
                {period && (
                  <div className="self-start sm:self-auto shrink-0">
                    <span className="postage-stamp bg-[var(--card-bg-color)] border-dashed border-[var(--border-color)] text-[11px] text-[var(--text-color)]">
                      📅 {period}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </AnimatedContent>
  );
};

export default About;

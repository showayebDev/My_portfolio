"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import AnimatedContent from "@/context/AnimatedContent/AnimatedContent";

const SkillItem = ({ skill, showPercent = false, index = 0 }) => {
  const [percent, setPercent] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const itemRef = useRef(null);

  useEffect(() => {
    if (!showPercent) return;
    const el = itemRef.current;
    if (!el) return;

    if (!window.IntersectionObserver) {
      const id = setTimeout(() => setHasAnimated(true), 0);
      return () => clearTimeout(id);
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasAnimated(true);
          observer.unobserve(el);
        }
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px",
      }
    );

    observer.observe(el);

    return () => {
      if (el) {
        observer.unobserve(el);
      }
    };
  }, [showPercent]);

  const targetPercent = Number(skill.percent) || 0;

  useEffect(() => {
    if (!showPercent || !hasAnimated) return;

    const duration = 1000;
    const start = performance.now();
    let frameId;

    const animate = (time) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = progress * (2 - progress);

      setPercent(Math.round(targetPercent * ease));

      if (progress < 1) {
        frameId = requestAnimationFrame(animate);
      }
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [hasAnimated, targetPercent, showPercent]);

  const iconSrc =
    (typeof skill.icon === "object" && skill.icon?.url)
      ? skill.icon.url
      : skill.iconUrl || skill.src || "";

  const tiltClass =
    index % 4 === 0
      ? "hover:-rotate-2"
      : index % 4 === 1
      ? "hover:rotate-2"
      : index % 4 === 2
      ? "hover:rotate-3"
      : "hover:-rotate-3";

  return (
    <div
      ref={itemRef}
      className={`skill-sticker w-full max-w-[130px] h-fit self-start ${tiltClass}`}
      style={{
        "--skill-color": skill.color || "#f59e0b",
      }}
    >
      {showPercent ? (
        <div
          className="skill-sticker-ring mb-3"
          style={{
            "--skill-percent": `${percent}%`,
          }}
        >
          <div className="skill-sticker-inner">
            {iconSrc && (
              <Image
                src={iconSrc}
                alt={skill.name}
                width={32}
                height={32}
                className="w-8 h-8 object-contain select-none transition-transform duration-300 group-hover:scale-110"
              />
            )}
          </div>
        </div>
      ) : (
        <div className="w-14 h-14 rounded-full border-2 border-[var(--border-color)] bg-[var(--card-note-color)] p-2.5 flex items-center justify-center mb-3 shadow-inner group-hover:rotate-6 transition-transform">
          {iconSrc && (
            <Image
              src={iconSrc}
              alt={skill.name}
              width={34}
              height={34}
              className="w-8.5 h-8.5 object-contain select-none transition-transform duration-300 group-hover:scale-110"
            />
          )}
        </div>
      )}

      <span className="collage-mono text-xs font-bold text-[var(--text-color)] text-center tracking-tight">
        {skill.name}
      </span>

      {showPercent && (
        <span className="collage-handwritten text-sm font-bold text-[var(--link-color)] mt-0.5">
          {percent}% approved
        </span>
      )}
    </div>
  );
};

const Skills = ({
  skillsData = [],
  categoriesData = [],
  showPercent: propShowPercent,
}) => {
  const envShowPercent = process.env.NEXT_PUBLIC_SHOW_PERCENT === "true";

  const showPercent =
    propShowPercent !== undefined ? propShowPercent : envShowPercent;

  const skillCategories = React.useMemo(() => {
    if (Array.isArray(categoriesData) && categoriesData.length > 0) {
      return [
        { id: "all", label: "All Skills" },
        ...categoriesData.map((cat) => ({
          id: cat.slug || cat.id || (cat.name ? cat.name.toLowerCase().replace(/\s+/g, "-") : ""),
          label: cat.name || cat.slug,
        })),
      ];
    }
    return [
      { id: "all", label: "All Skills" },
      { id: "front-end", label: "Front-end" },
      { id: "back-end", label: "Back-end" },
      { id: "framework", label: "Framework" },
      { id: "language", label: "Language" },
      { id: "database", label: "Database" },
      { id: "auth-services", label: "Auth/Services" },
      { id: "tools", label: "Tools" },
    ];
  }, [categoriesData]);

  const [activeCategory, setActiveCategory] = useState("all");

  const getSkillCategoryKeys = (categories) => {
    if (!categories) return [];
    const list = Array.isArray(categories) ? categories : [categories];
    return list.flatMap((c) => {
      if (typeof c === "object" && c !== null) {
        const slug = c.slug?.toString().toLowerCase();
        const id = c.id?.toString().toLowerCase();
        const name = c.name?.toString().toLowerCase();
        return [
          slug,
          slug?.replace(/\//g, "-"),
          id,
          name,
          name?.replace(/\//g, "-"),
        ].filter(Boolean);
      }
      const str = String(c).toLowerCase();
      return [str, str.replace(/\//g, "-")];
    });
  };

  const filteredSkills = skillsData
    .filter((skill) => skill.showInFrontend !== false)
    .filter((skill) => {
      if (activeCategory === "all") return true;
      const skillCatKeys = getSkillCategoryKeys(skill.categories);
      const target = activeCategory.toLowerCase();
      return skillCatKeys.includes(target);
    });

  return (
    <AnimatedContent
      distance={20}
      direction="vertical"
      Zindex={false}
      duration={0.3}
      ease="power2.out"
      delay={0.05}
    >
      <section className="collage-card p-6 sm:p-7 relative overflow-visible" id="experience">
        {/* Washi Tape Accent */}
        <div className="washi-tape washi-tape-corner-right washi-tape-sage" />

        {/* Section Header */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-6 pb-3 border-b-2 border-dashed border-[var(--border-subtle)]">
          <div className="flex items-center gap-2.5">
            <span className="dymo-label">
              ✦ SKILLS ✦
            </span>
          </div>
          <span className="collage-handwritten text-xl font-bold text-[var(--link-color)] -rotate-1">
            Swatches & Proven Tools
          </span>
        </div>

        {/* Category Tabs: Washi Tape / File Folder Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 overflow-x-auto pb-2 border-b border-[var(--border-subtle)]">
          {skillCategories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-lg text-xs collage-mono font-bold tracking-wider uppercase transition-all cursor-pointer border ${
                  isActive
                    ? "bg-[var(--btn-2-bg)] text-[var(--btn-2-text)] border-[var(--border-color)] shadow-sm -rotate-1 scale-105"
                    : "bg-[var(--card-note-color)] text-[var(--secondary-text-color)] border-[var(--border-subtle)] hover:bg-[var(--card-kraft-color)] hover:text-[var(--text-color)]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Skills Grid: Die-Cut Stickers */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6 justify-items-center content-start items-start min-h-[260px]">
          {filteredSkills.map((skill, index) => (
            <SkillItem
              key={`${activeCategory}-${skill.name}`}
              skill={skill}
              showPercent={showPercent}
              index={index}
            />
          ))}
        </div>
      </section>
    </AnimatedContent>
  );
};

export default Skills;

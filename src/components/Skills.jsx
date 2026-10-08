"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import AnimatedContent from "@/context/AnimatedContent/AnimatedContent";

const SkillItem = ({ skill, showPercent = false }) => {
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

  return (
    <div ref={itemRef} className="flex flex-col items-center group">
      <div
        className="skill-ring mb-4 group-hover:scale-105"
        style={{
          "--skill-color": skill.color || "#38bdf8",
          "--skill-percent": showPercent ? `${percent}%` : "0%",
        }}
      >
        <div className="skill-inner shadow-inner">
          {iconSrc && (
            <Image
              src={iconSrc}
              alt={skill.name}
              width={36}
              height={36}
              className="w-9 h-9 object-contain select-none transition-transform duration-500 group-hover:rotate-12"
            />
          )}
        </div>
      </div>
      <span className="text-xs font-semibold text-[var(--text-color)]">
        {skill.name}
      </span>
      {showPercent && (
        <span className="text-[10px] font-bold text-[var(--secondary-text-color)] mt-0.5">
          {percent}%
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

  // Build category list dynamically from categoriesData if provided, or fallback to standard list
  const skillCategories = React.useMemo(() => {
    if (Array.isArray(categoriesData) && categoriesData.length > 0) {
      return [
        { id: "all", label: "All" },
        ...categoriesData.map((cat) => ({
          id: cat.slug || cat.id || (cat.name ? cat.name.toLowerCase().replace(/\s+/g, "-") : ""),
          label: cat.name || cat.slug,
        })),
      ];
    }
    return [
      { id: "all", label: "All" },
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
      <section
        className="bg-[var(--card-bg-color)] border border-[var(--border-color)] rounded-2xl p-6 shadow-md"
        id="experience"
      >
        <div className="flex justify-between items-center mb-6 border-b border-[var(--border-color)] pb-2 text-[var(--secondary-text-color)]">
          <span className="text-sm font-semibold tracking-wide text-[var(--text-color)]">
            Technical Skills
          </span>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-2 mb-10 overflow-x-auto pb-2 border-b border-[var(--border-color)]">
          {skillCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                activeCategory === cat.id
                  ? "bg-[var(--btn-2-bg)] text-[var(--btn-2-text)] shadow-sm"
                  : "bg-[var(--bg-color)] text-[var(--secondary-text-color)] hover:bg-[var(--border-color)]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Skills Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-y-10 gap-x-4 justify-items-center min-h-[300px]">
          {filteredSkills.map((skill) => (
            <SkillItem
              key={`${activeCategory}-${skill.name}`}
              skill={skill}
              showPercent={showPercent}
            />
          ))}
        </div>
      </section>
    </AnimatedContent>
  );
};

export default Skills;

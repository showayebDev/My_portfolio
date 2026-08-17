"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import AnimatedContent from "@/context/AnimatedContent/AnimatedContent";

const SkillItem = ({ skill, activeCategory }) => {
  const [percent, setPercent] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const itemRef = useRef(null);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!hasAnimated) return;

    const duration = 1000; // 1s animation duration
    const start = performance.now();
    let frameId;

    const animate = (time) => {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);

      // Easing: easeOutQuad
      const ease = progress * (2 - progress);

      setPercent(Math.round(skill.percent * ease));

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
  }, [hasAnimated, skill.percent]);

  const showPercent =
    process.env.NEXT_PUBLIC_SHOW_PERCENT !== "false" &&
    process.env.NEXT_PUBLIC_SHOW_PERCENT !== "False";

  const iconSrc = skill.src || "";

  return (
    <div ref={itemRef} className="flex flex-col items-center group">
      <div
        className="skill-ring mb-4 group-hover:scale-105"
        style={{
          "--skill-color": skill.color,
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

const Skills = ({ skillsData = [] }) => {
  // Skill categories list
  const skillCategories = [
    { id: "all", label: "All" },
    { id: "front-end", label: "Front-end" },
    { id: "back-end", label: "Back-end" },
    { id: "framework", label: "Framework" },
    { id: "language", label: "Language" },
    { id: "database", label: "Database" },
    { id: "auth/services", label: "Auth/Services" },
    { id: "tools", label: "Tools" },
  ];

  const [activeCategory, setActiveCategory] = useState("all");

  const filteredSkills = skillsData.filter((skill) =>
    skill.categories.includes(activeCategory)
  );

  return (
    <AnimatedContent
      distance={50}
      direction="vertical"
      Zindex={false}
      duration={0.8}
      ease="power3.out"
      delay={0.1}
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
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${activeCategory === cat.id
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
              activeCategory={activeCategory}
            />
          ))}
        </div>
      </section>
    </AnimatedContent>
  );
};

export default Skills;

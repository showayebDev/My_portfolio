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
  const list = educationData || [];

  if (!list.length) return null;

  return (
    <>
      <AnimatedContent
        distance={100}
        direction="vertical"
        duration={0.8}
        ease="power3.out"
        scale={0.95}
        delay={0.1}
      >
        <section className="bg-[var(--card-bg-color)] border border-[var(--border-color)] rounded-2xl p-6 shadow-md">
          <div className="flex justify-between items-center mb-6 border-b border-[var(--border-color)] pb-2 text-[var(--secondary-text-color)]">
            <span className="text-sm font-semibold tracking-wide text-[var(--text-color)]">
              Education
            </span>
          </div>

          <div className="space-y-4">
            {list.map((edu, idx) => {
              const imgSrc = edu.src || (edu.icon && (edu.icon.startsWith('/') || edu.icon.includes('.')) ? edu.icon : null);
              const IconComp = iconMap[edu.icon] || FaGraduationCap;
              const colorClass = idx === 0 ? "text-sky-400" : "text-emerald-400";

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4 p-3 bg-[var(--bg-color)] border border-[var(--border-color)] rounded-xl hover:border-[var(--secondary-text-color)] transition-all duration-300"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-[100%] flex items-center justify-center border border-[var(--border-color)] bg-[var(--card-bg-color)] p-1.5 overflow-hidden shrink-0 relative shadow-sm">
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={edu.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-contain select-none rounded-[100%] "
                        />
                      ) : (
                        <IconComp className={`w-6 h-6 ${colorClass}`} />
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-color)]">
                        {edu.name}
                      </h4>
                      <p className="text-xs text-[var(--secondary-text-color)] mt-0.5">
                        {edu.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-[var(--secondary-text-color)] whitespace-nowrap bg-[var(--card-bg-color)] px-3 py-1 rounded-full border border-[var(--border-color)]">
                    {edu.direction}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </AnimatedContent>
    </>
  );
};

export default About;


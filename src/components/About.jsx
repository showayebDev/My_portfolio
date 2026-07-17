"use client";

import React from "react";
import AnimatedContent from "@/context/AnimatedContent/AnimatedContent";

// Function to calculate the age
const calculateAge = (birthDate) => {
  // const screenWidth = window.innerWidth;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  const dayDiff = today.getDate() - birthDate.getDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }

  return age;
};

// Function to calculate years of experience
const calculateExperience = (startYear) => {
  const currentYear = new Date().getFullYear();
  return currentYear - startYear;
};

const About = () => {
  const age = calculateAge(new Date(2006, 8, 15)); // Calculate age (birthday: 15th September 2006)
  const experience = calculateExperience(2021) - 1; // Calculate years of experience since 2021

  return (
    <>
      {/* Upper Info Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Languages Block */}
        {/* <AnimatedContent
          distance={100}
          direction="vertical"
          duration={0.8}
          ease="power3.out"
          scale={0.95}
        >
          <div className="bg-[var(--card-bg-color)] border border-[var(--border-color)] rounded-2xl p-6 shadow-md h-full flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6 border-b border-[var(--border-color)] pb-2 text-[var(--secondary-text-color)]">
              <span className="text-sm font-semibold tracking-wide text-[var(--text-color)]">
                Languages
              </span>
            
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-[var(--secondary-text-color)] mb-1">
                  <span>Bengali (Native)</span>
                  <span>100%</span>
                </div>
                <div className="w-full bg-[var(--bg-color)] rounded-full h-2 border border-[var(--border-color)]">
                  <div
                    className="bg-teal-400 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: "100%" }}
                  ></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold text-[var(--secondary-text-color)] mb-1">
                  <span>English (Professional)</span>
                  <span>75%</span>
                </div>
                <div className="w-full bg-[var(--bg-color)] rounded-full h-2 border border-[var(--border-color)]">
                  <div
                    className="bg-indigo-400 h-1.5 rounded-full transition-all duration-1000"
                    style={{ width: "75%" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </AnimatedContent> */}

        {/* Personal Info Block */}
        <AnimatedContent
          distance={100}
          direction="vertical"
          duration={0.8}
          ease="power3.out"
          scale={0.95}
          delay={0.1}
        >
          <div className="bg-[var(--card-bg-color)] border border-[var(--border-color)] rounded-2xl p-6 shadow-md h-full flex flex-col justify-between">
            <div className="flex justify-between items-center mb-6 border-b border-[var(--border-color)] pb-2 text-[var(--secondary-text-color)]">
              <span className="text-sm font-semibold tracking-wide text-[var(--text-color)]">
                Personal Info
              </span>

            </div>
            <div className="space-y-4 text-sm text-[var(--secondary-text-color)]">
              <div className="flex justify-between items-start gap-4">
                <span>Degree</span>
                <span className="text-[var(--text-color)] font-medium text-right">
                  BSc in Computer Science & Engineering (CSE)
                </span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span>Institution</span>
                <span className="text-[var(--text-color)] font-medium text-right">
                  Independent University, Bangladesh (IUB)
                </span>
              </div>
              <div className="flex justify-between items-start gap-4">
                <span>Status</span>
                <span className="text-[var(--text-color)] font-medium text-right">
                  Running (Admitted 2026)
                </span>
              </div>
            </div>
          </div>
        </AnimatedContent>
      </div>
    </>
  );
};

export default About;

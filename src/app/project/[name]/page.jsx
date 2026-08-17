"use client";

import React, { useEffect, useState, useContext } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Button from "@/components/button";
import { ThemeContext } from "@/context/ThemeContext";
import portfolioData from "@/data/portfolio-data.json";

import { marked } from "marked";
import DOMPurify from "dompurify";
import hljs from "highlight.js";
import "github-markdown-css/github-markdown.css";
import "highlight.js/styles/github-dark.css";
import "highlight.js/styles/github.css";

marked.setOptions({
  highlight: function (code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      return hljs.highlight(code, { language: lang }).value;
    }
    return hljs.highlightAuto(code).value;
  },
  langPrefix: "hljs language-",
});

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

export default function ProjectPage() {
  const { name } = useParams();
  const { theme } = useContext(ThemeContext);
  const [effectiveTheme, setEffectiveTheme] = useState("light");
  const [renderedReadme, setRenderedReadme] = useState("");

  const project = (portfolioData.projects || []).find(
    (p) => p.name?.toLowerCase() === (name || "").toLowerCase()
  );

  const formattedProject = project
    ? { ...project, buttons: parseButtonsSafely(project.buttons) }
    : null;

  useEffect(() => {
    const updateTheme = () => {
      if (theme === "auto") {
        const prefersLight = window.matchMedia(
          "(prefers-color-scheme: light)"
        ).matches;
        setEffectiveTheme(prefersLight ? "light" : "dark");
      } else {
        setEffectiveTheme(theme === "dark" ? "dark" : "light");
      }
    };

    updateTheme();

    if (project?.readmeContent) {
      const html = DOMPurify.sanitize(marked.parse(project.readmeContent));
      setRenderedReadme(html);
    }
  }, [name, theme, project]);

  useEffect(() => {
    if (!renderedReadme) return;

    const blocks = document.querySelectorAll("pre > code");
    blocks.forEach((block) => {
      const wrapper = block.parentElement;
      if (!wrapper) return;
      wrapper.style.position = "relative";

      if (wrapper.querySelector(".copy-btn")) return;

      const btn = document.createElement("button");
      btn.innerText = "Copy";
      btn.className =
        "copy-btn absolute top-2 right-2 bg-gray-800 text-white text-xs px-2 py-1 rounded hover:bg-gray-700 transition";
      btn.onclick = () => {
        navigator.clipboard.writeText(block.textContent || "");
        btn.innerText = "Copied!";
        setTimeout(() => (btn.innerText = "Copy"), 1500);
      };
      wrapper.appendChild(btn);
    });
  }, [renderedReadme]);

  if (!formattedProject) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-xl">Project not found.</p>
      </div>
    );
  }

  const imgSrc = formattedProject.img || null;

  return (
    <div className="container mx-0 md:mx-auto px-4 py-8 max-w-[1280px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-[var(--secondary-text-color)] font-medium mb-8">
        <Link href="/" className="hover:text-[var(--text-color)] hover:underline transition-colors duration-200">
          Home
        </Link>
        <span>/</span>
        <Link href="/project" className="hover:text-[var(--text-color)] hover:underline transition-colors duration-200">
          Projects
        </Link>
        <span>/</span>
        <span className="text-[var(--text-color)] font-semibold">{formattedProject.title}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 md:items-center lg:items-start">
        <div className="md:w-1/4 lg:sticky top-8">
          {imgSrc && (
            <div>
              <Image
                src={imgSrc}
                alt={formattedProject.title}
                className="rounded-lg shadow-lg w-full"
                width={1200}
                height={800}
                placeholder="blur"
                blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                quality={100}
              />
              <div className="mt-4">
                <h1 className="text-2xl font-semibold mb-2">{formattedProject.title}</h1>
                <p className="text-[var(--secondary-text-color)] mb-4">
                  {formattedProject.description}
                </p>
                <div className="flex flex-col gap-3">
                  {formattedProject.buttons?.map((btn, i) => {
                    const isGitHub = (btn.name || "").toLowerCase().includes("github");
                    return (
                      <Button
                        key={i}
                        text={btn.name}
                        link={btn.link}
                        className={`flex items-center justify-center gap-2.5 px-5 py-3 text-sm font-semibold rounded-xl w-full text-center transition-all duration-300 transform active:scale-[0.98] shadow-sm ${
                          isGitHub
                            ? "bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-white shadow-slate-900/10 hover:shadow-md hover:-translate-y-0.5 border border-transparent font-medium"
                            : "bg-[var(--card-bg-color)] border border-[var(--border-color)] text-[var(--text-color)] hover:border-indigo-500/50 hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 hover:shadow-md hover:-translate-y-0.5 font-medium"
                        }`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="md:w-3/4">
          {renderedReadme && (
            <div
              className={`markdown-body md:p-8 ${
                effectiveTheme === "dark"
                  ? "dark github-markdown-dark dark-markdown"
                  : "light github-markdown-light light-markdown"
              }`}
              dangerouslySetInnerHTML={{ __html: renderedReadme }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
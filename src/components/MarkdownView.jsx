"use client";

import React, { useEffect, useContext, useRef } from "react";
import { ThemeContext } from "@/context/ThemeContext";
import "github-markdown-css/github-markdown.css";

export default function MarkdownView({ html }) {
  const { theme } = useContext(ThemeContext);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const blocks = containerRef.current.querySelectorAll("pre > code");
    blocks.forEach((block) => {
      const wrapper = block.parentElement;
      if (!wrapper) return;
      wrapper.style.position = "relative";

      if (wrapper.querySelector(".markdown-copy-btn")) return;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "markdown-copy-btn";
      btn.setAttribute("aria-label", "Copy code to clipboard");
      btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy</span>`;

      btn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(block.textContent || "");
          btn.classList.add("copied");
          btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg><span>Copied!</span>`;
          setTimeout(() => {
            btn.classList.remove("copied");
            btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy</span>`;
          }, 2000);
        } catch (_err) {
          btn.innerText = "Failed";
          setTimeout(() => {
            btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><span>Copy</span>`;
          }, 1500);
        }
      };
      wrapper.appendChild(btn);
    });
  }, [html]);

  const currentTheme = theme === "light" ? "light" : "dark";
  const themeClass =
    currentTheme === "dark"
      ? "dark github-markdown-dark dark-markdown"
      : "light github-markdown-light light-markdown";

  return (
    <div
      ref={containerRef}
      data-theme={currentTheme}
      className={`markdown-body md:p-8 ${themeClass}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

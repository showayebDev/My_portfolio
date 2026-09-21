"use client";

import React, { useEffect, useContext, useRef } from "react";
import { ThemeContext } from "@/context/ThemeContext";
import "github-markdown-css/github-markdown.css";
import "highlight.js/styles/github-dark.css";
import "highlight.js/styles/github.css";

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
  }, [html]);

  const themeClass =
    theme === "dark"
      ? "dark github-markdown-dark dark-markdown"
      : "light github-markdown-light light-markdown";

  return (
    <div
      ref={containerRef}
      className={`markdown-body md:p-8 ${themeClass}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

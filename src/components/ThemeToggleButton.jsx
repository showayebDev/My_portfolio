"use client";
import React, { useContext } from "react";
import { ThemeContext } from "@/context/ThemeContext";
import { FaMoon, FaSun } from "react-icons/fa";
import { CgLaptop } from "react-icons/cg";

export default function ThemeToggleButton() {
  const { theme, toggleTheme, showToggle } = useContext(ThemeContext);

  if (!showToggle) return null;

  return (
    <button
      onClick={toggleTheme}
      className="cursor-pointer text-xl text-[var(--secondary-text-color)] hover:text-[var(--text-color)] transition-colors duration-200"
      title="Toggle Theme"
    >
      {theme === "light" ? (
        <FaMoon className="w-5 h-5" />
      ) : theme === "dark" ? (
        <CgLaptop className="w-5 h-5" />
      ) : (
        <FaSun className="w-5 h-5" />
      )}
    </button>
  );
}

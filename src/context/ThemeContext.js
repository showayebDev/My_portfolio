"use client";
import React, { createContext, useState, useEffect } from "react";
export const ThemeContext = createContext();
export const ThemeProvider = ({ children }) => {
  const configTheme = process.env.NEXT_PUBLIC_THEME || "auto";
  const showToggle = configTheme !== "dark" && configTheme !== "light";

  // Hydration-safe initial state (server-safe)
  const [theme, setTheme] = useState(() => {
    if (configTheme === "dark") return "dark";
    if (configTheme === "light") return "light";
    if (configTheme === "a_dark") return "dark";
    if (configTheme === "a_light") return "light";
    return "auto";
  });

  // Load theme from localStorage on client mount
  useEffect(() => {
    if (configTheme === "auto") {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme) {
        const id = setTimeout(() => setTheme(storedTheme), 0);
        return () => clearTimeout(id);
      }
    }
  }, [configTheme]);

  // Apply theme to <html> element
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark");

    let activeTheme = theme;
    if (configTheme === "dark") {
      activeTheme = "dark";
    } else if (configTheme === "light") {
      activeTheme = "light";
    }

    if (activeTheme === "auto") {
      const prefersLight = window.matchMedia(
        "(prefers-color-scheme: light)"
      ).matches;
      root.classList.add(prefersLight ? "light" : "dark");
    } else {
      root.classList.add(activeTheme);
    }

    if (configTheme === "auto") {
      localStorage.setItem("theme", theme);
    }
  }, [theme, configTheme]);

  // Cycle between light → dark → auto
  const toggleTheme = () => {
    if (configTheme === "dark" || configTheme === "light") return;

    setTheme((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "auto";
      return "light";
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, showToggle }}>
      {children}
    </ThemeContext.Provider>
  );
};

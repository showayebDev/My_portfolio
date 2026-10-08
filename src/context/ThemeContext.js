"use client";
import React, { createContext, useState, useEffect } from "react";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children, configTheme: propConfigTheme }) => {
  const configTheme =
    propConfigTheme || process.env.NEXT_PUBLIC_THEME || "dark";
  const showToggle = configTheme !== "dark" && configTheme !== "light";

  // Hydration-safe initial state (server-safe)
  const [theme, setTheme] = useState(() => {
    if (configTheme === "dark") return "dark";
    if (configTheme === "light") return "light";
    if (configTheme === "a_dark") return "dark";
    if (configTheme === "a_light") return "light";
    return "auto";
  });

  // Load user choice from localStorage on client mount if toggling is allowed
  useEffect(() => {
    if (configTheme === "dark" || configTheme === "light") {
      setTheme(configTheme);
      return;
    }

    try {
      const storedTheme = localStorage.getItem("theme");
      if (storedTheme && (storedTheme === "light" || storedTheme === "dark" || storedTheme === "auto")) {
        const id = setTimeout(() => setTheme(storedTheme), 0);
        return () => clearTimeout(id);
      }
    } catch {
      // localStorage may fail in restricted/private browsing
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

    if (configTheme !== "dark" && configTheme !== "light") {
      try {
        localStorage.setItem("theme", theme);
      } catch {
        // ignore
      }
    }
  }, [theme, configTheme]);

  // Toggle theme
  const toggleTheme = () => {
    if (configTheme === "dark" || configTheme === "light") return;

    setTheme((prev) => {
      if (configTheme === "auto") {
        if (prev === "light") return "dark";
        if (prev === "dark") return "auto";
        return "light";
      }

      // For a_dark or a_light, toggle between light and dark
      return prev === "light" ? "dark" : "light";
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, showToggle, configTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

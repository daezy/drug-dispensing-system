"use client";

import { useEffect } from "react";

export default function DarkModeInitializer() {
  useEffect(() => {
    // Load dark mode preference on mount
    const savedDarkMode = localStorage.getItem("darkMode") === "true";
    if (savedDarkMode) {
      document.documentElement.classList.add("dark");
    }

    // Listen for dark mode changes
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "darkMode") {
        if (e.newValue === "true") {
          document.documentElement.classList.add("dark");
        } else {
          document.documentElement.classList.remove("dark");
        }
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  return null;
}

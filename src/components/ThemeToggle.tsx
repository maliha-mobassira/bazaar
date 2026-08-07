"use client";

import { useTheme } from "@/context/ThemeContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      style={{
        padding: "8px 16px",
        background: "var(--card)",
        color: "var(--text-primary)",
        border: "1px solid var(--border)",
        borderRadius: "8px",
        cursor: "pointer",
      }}
    >
      {theme === "light" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}

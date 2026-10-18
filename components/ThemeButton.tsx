"use client";

import { useEffect, useState } from "react";

// Mirrors the reference site's `theme` localStorage key.
export function ThemeButton() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const t = (document.documentElement.dataset.theme as "light" | "dark") || "light";
    setTheme(t);
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem("theme", next); } catch { /* ignore */ }
  }

  return (
    <button className="icon-btn" onClick={toggle} title="Toggle theme" aria-label="Toggle theme">
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}

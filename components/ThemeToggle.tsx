"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-8 h-8" />;

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="p-1.5 rounded-md text-stone-500 hover:text-stone-800 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-800 transition-colors"
      aria-label="Переключить тему"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}

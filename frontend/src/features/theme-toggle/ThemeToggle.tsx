"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label="Переключить тему"
      title="Переключить тему"
      className="
        relative w-8 h-8 flex items-center justify-center
        rounded-md transition-colors duration-150
        text-stone-500 hover:text-stone-800 hover:bg-[var(--hover)]
        dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800
      "
    >
      <Sun
        size={16}
        className="absolute transition-all duration-300 opacity-0 rotate-90 scale-75 dark:opacity-100 dark:rotate-0 dark:scale-100"
      />
      <Moon
        size={16}
        className="absolute transition-all duration-300 opacity-100 rotate-0 scale-100 dark:opacity-0 dark:-rotate-90 dark:scale-75"
      />
    </button>
  );
}

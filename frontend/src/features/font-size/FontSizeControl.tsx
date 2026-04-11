"use client";

import { useEffect, useLayoutEffect, useState } from "react";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

const SIZES = [
  { key: "xs", value: "0.8125rem" },
  { key: "sm", value: "0.9375rem" },
  { key: "md", value: "1.0625rem" },
  { key: "lg", value: "1.1875rem" },
  { key: "xl", value: "1.3125rem" },
] as const;

type SizeKey = (typeof SIZES)[number]["key"];

const LS_KEY = "bible-font-size";

function applySize(key: SizeKey) {
  const size = SIZES.find((s) => s.key === key)!;
  document.documentElement.style.setProperty("--bible-font-size", size.value);
}

export default function FontSizeControl() {
  const [current, setCurrent] = useState<SizeKey>("md");

  useIsomorphicLayoutEffect(() => {
    const stored = localStorage.getItem(LS_KEY) as SizeKey | null;
    const key = SIZES.some((s) => s.key === stored) ? (stored as SizeKey) : "md";
    setCurrent(key);
    applySize(key);
  }, []);

  const change = (delta: -1 | 1) => {
    const idx = SIZES.findIndex((s) => s.key === current);
    const next = SIZES[idx + delta];
    if (!next) return;
    setCurrent(next.key);
    applySize(next.key);
    localStorage.setItem(LS_KEY, next.key);
  };

  const btnClass =
    "w-7 h-7 flex items-center justify-center rounded-md transition-colors duration-150 " +
    "text-stone-500 hover:text-stone-800 hover:bg-[var(--hover)] " +
    "dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800 " +
    "disabled:opacity-30 disabled:cursor-default disabled:hover:bg-transparent disabled:hover:text-stone-500 " +
    "dark:disabled:hover:bg-transparent dark:disabled:hover:text-stone-400";

  return (
    <div className="flex items-center gap-0.5">
      <button
        onClick={() => change(-1)}
        disabled={current === "xs"}
        aria-label="Уменьшить шрифт"
        title="Уменьшить шрифт"
        className={btnClass}
      >
        <span className="font-serif leading-none" style={{ fontSize: "11px", fontWeight: 600 }}>A</span>
      </button>
      <button
        onClick={() => change(1)}
        disabled={current === "xl"}
        aria-label="Увеличить шрифт"
        title="Увеличить шрифт"
        className={btnClass}
      >
        <span className="font-serif leading-none" style={{ fontSize: "15px", fontWeight: 600 }}>A</span>
      </button>
    </div>
  );
}

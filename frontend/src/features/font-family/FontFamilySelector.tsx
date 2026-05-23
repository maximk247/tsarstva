"use client";

import { useEffect, useLayoutEffect, useState, type ChangeEvent } from "react";
import {
  BIBLE_FONT_FAMILY_LS_KEY,
  BIBLE_FONT_FAMILY_OPTIONS,
  DEFAULT_BIBLE_FONT_FAMILY_KEY,
  type TFontFamilyKey,
} from "./constants/fonts";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

function isFontFamilyKey(value: string | null): value is TFontFamilyKey {
  return BIBLE_FONT_FAMILY_OPTIONS.some((font) => font.key === value);
}

function applyFontFamily(key: TFontFamilyKey) {
  const font = BIBLE_FONT_FAMILY_OPTIONS.find((item) => item.key === key)!;
  document.documentElement.style.setProperty("--bible-font-family", font.value);
}

export default function FontFamilySelector() {
  const [current, setCurrent] = useState<TFontFamilyKey>(
    DEFAULT_BIBLE_FONT_FAMILY_KEY,
  );

  useIsomorphicLayoutEffect(() => {
    const stored = localStorage.getItem(BIBLE_FONT_FAMILY_LS_KEY);
    const key = isFontFamilyKey(stored)
      ? stored
      : DEFAULT_BIBLE_FONT_FAMILY_KEY;
    setCurrent(key);
    applyFontFamily(key);
  }, []);

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value;
    if (!isFontFamilyKey(next)) return;

    setCurrent(next);
    applyFontFamily(next);
    localStorage.setItem(BIBLE_FONT_FAMILY_LS_KEY, next);
  };

  return (
    <label className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 font-sans text-[10px] uppercase tracking-widest text-[var(--sidebar-left-muted)] dark:text-stone-500">
        Шрифт
      </span>
      <select
        value={current}
        onChange={handleChange}
        aria-label="Шрифт текста"
        className="min-w-0 flex-1 rounded-md border border-[var(--border)] bg-[var(--card)] px-2 py-1.5 font-sans text-sm text-stone-800 outline-none transition-colors hover:bg-[var(--hover)] focus:border-amber-700 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:hover:bg-stone-800 dark:focus:border-amber-500"
      >
        {BIBLE_FONT_FAMILY_OPTIONS.map((font) => (
          <option key={font.key} value={font.key}>
            {font.label}
          </option>
        ))}
      </select>
    </label>
  );
}

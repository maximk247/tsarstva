"use client";

import Link from "next/link";
import { cn } from "@/shared/utils/cn";

interface Props {
  book: string;
  chapter: number;
  chapters: number[];
  chaptersWithParallels: Set<number>;
  onSelect: () => void;
}

export default function ChapterDropdown({
  book,
  chapter,
  chapters,
  chaptersWithParallels,
  onSelect,
}: Props) {
  return (
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-[var(--card)] dark:bg-stone-900 border border-[var(--border)] dark:border-stone-700 rounded-xl shadow-lg p-3 w-64">
      <p className="text-xs text-stone-400 dark:text-stone-400 font-sans mb-2 text-center">
        Выбрать главу
      </p>
      <div className="grid grid-cols-6 gap-1.5">
        {chapters.map((ch) => (
          <Link
            key={ch}
            href={`/read/${book}/${ch}`}
            onClick={onSelect}
            className={cn(
              "flex flex-col items-center justify-center w-8 h-9 text-sm font-sans rounded-md transition-colors",
              ch === chapter
                ? "bg-amber-900 text-[var(--card)] dark:bg-stone-200 dark:text-stone-900 font-semibold"
                : "text-stone-600 dark:text-stone-300 hover:bg-[var(--hover)] dark:hover:bg-stone-700/40",
            )}
          >
            {ch}
            {chaptersWithParallels.has(ch) ? (
              <span
                className={cn(
                  "w-1 h-1 rounded-full",
                  ch === chapter
                    ? "bg-[var(--accent-subtle)] dark:bg-stone-600"
                    : "bg-[var(--accent-subtle)] dark:bg-amber-400",
                )}
              />
            ) : (
              <span className="w-1 h-1" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}

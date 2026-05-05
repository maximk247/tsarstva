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
    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white dark:bg-stone-900 border border-[#E1DDD8] dark:border-stone-700 rounded-xl shadow-lg p-3 w-64">
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
                ? "bg-amber-900 text-[#FAF9F7] dark:bg-stone-200 dark:text-stone-900 font-semibold"
                : "text-stone-600 dark:text-stone-300 hover:bg-[#F5F2F1] dark:hover:bg-stone-700/40",
            )}
          >
            {ch}
            {chaptersWithParallels.has(ch) ? (
              <span
                className={cn(
                  "w-1 h-1 rounded-full",
                  ch === chapter
                    ? "bg-[#DA8107] dark:bg-stone-600"
                    : "bg-[#DA8107] dark:bg-amber-400",
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

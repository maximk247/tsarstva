"use client";

import Link from "next/link";
import { useMemo } from "react";
import { cn } from "@/shared/lib/cn";
import {
  READER_BOOK_NAMES,
  READER_BOOK_SECTIONS,
  getChaptersWithParallels,
  getChapterCount,
} from "@tsarstva/data";
import { ThemeToggle } from "@/features/theme-toggle";
import { FontSizeControl } from "@/features/font-size";

interface Props {
  currentBook: string;
  currentChapter: number;
}

export default function Sidebar({ currentBook, currentChapter }: Props) {
  const totalChapters = getChapterCount(currentBook);
  const chapters = useMemo(
    () => Array.from({ length: totalChapters }, (_, i) => i + 1),
    [totalChapters],
  );
  const chaptersWithParallels = useMemo(
    () => getChaptersWithParallels(currentBook),
    [currentBook],
  );

  return (
    <aside className="hidden lg:flex flex-col w-52 xl:w-56 shrink-0 h-full border-r border-[#E1DDD8] dark:border-stone-700 bg-[#FAF9F7] dark:bg-stone-950 overflow-hidden">
      <div className="h-14 flex items-center justify-between px-4 border-b border-[#E1DDD8] dark:border-stone-700 shrink-0">
        <p className="font-sans text-sm font-semibold text-stone-800 dark:text-stone-200 tracking-wide">
          Чтение книг
        </p>
        <div className="flex items-center gap-1">
          <FontSizeControl />
          <ThemeToggle />
        </div>
      </div>

      <div className="px-3 py-3 border-b border-[#E1DDD8] dark:border-stone-700 shrink-0">
        <nav className="flex flex-col gap-3">
          {READER_BOOK_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 dark:text-stone-600 font-sans mb-1 px-1">
                {section.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.books.map((abbrev) => {
                  const isActive = currentBook === abbrev;
                  return (
                    <Link
                      key={abbrev}
                      href={`/read/${abbrev}/1`}
                      className={cn(
                        "font-sans text-sm px-3 py-1.5 rounded-md transition-colors",
                        isActive
                          ? "bg-amber-900/10 text-amber-900 dark:bg-stone-800 dark:text-stone-100 font-semibold"
                          : "text-stone-600 hover:text-stone-900 hover:bg-[#F5F2F1] dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-800",
                      )}
                    >
                      {READER_BOOK_NAMES[abbrev]}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="text-[10px] uppercase tracking-widest text-stone-400 dark:text-stone-600 font-sans mb-2.5 px-1">
          Главы
        </p>
        <div className="grid grid-cols-5 gap-1">
          {chapters.map((ch) => {
            const isActive = ch === currentChapter;
            const hasParallels = chaptersWithParallels.has(ch);
            return (
              <Link
                key={ch}
                href={`/read/${currentBook}/${ch}`}
                title={
                  hasParallels
                    ? `Глава ${ch} — есть параллельные места`
                    : `Глава ${ch}`
                }
                className={cn(
                  "flex flex-col items-center justify-center h-9 text-sm font-sans rounded-md transition-colors",
                  isActive
                    ? "bg-amber-900 text-[#FAF9F7] dark:bg-stone-200 dark:text-stone-900 font-semibold"
                    : "text-stone-700 dark:text-stone-300 hover:bg-[#F5F2F1] dark:hover:bg-stone-800",
                )}
              >
                <span>{ch}</span>
                <span
                  className={cn(
                    "w-1 h-1 rounded-full",
                    isActive && hasParallels
                      ? "bg-amber-400/80 dark:bg-stone-500"
                      : !isActive && hasParallels
                        ? "bg-amber-500 dark:bg-amber-500"
                        : "invisible",
                  )}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

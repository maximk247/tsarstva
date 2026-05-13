"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import type { ChapterNavigationIntent } from "@/features/navigate-chapter";
import { cn } from "@/shared/utils/cn";

interface Props {
  currentBook: string;
  currentChapter: number;
  activeChapter: number;
  chapters: number[];
  chaptersWithParallels: Set<number>;
  onNavigate: (
    event: MouseEvent<HTMLAnchorElement>,
    target: ChapterNavigationIntent,
  ) => void;
}

export default function SidebarChapterGrid({
  currentBook,
  currentChapter,
  activeChapter,
  chapters,
  chaptersWithParallels,
  onNavigate,
}: Props) {
  const activeChapterIndex =
    Math.min(Math.max(activeChapter, 1), chapters.length) - 1;
  const activeChapterColumn = activeChapterIndex % 5;
  const activeChapterRow = Math.floor(activeChapterIndex / 5);

  return (
    <div className="relative grid grid-cols-5 gap-1">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 h-9 rounded-md bg-amber-900 shadow-sm transition-transform duration-[300ms] ease-in-out will-change-transform dark:bg-stone-200 motion-reduce:transition-none"
        style={{
          width: "calc(20% - 0.2rem)",
          transform: `translate3d(calc(${activeChapterColumn * 100}% + ${
            activeChapterColumn * 0.25
          }rem), ${activeChapterRow * 2.5}rem, 0)`,
        }}
      />
      {chapters.map((ch) => {
        const isActive = ch === activeChapter;
        const hasParallels = chaptersWithParallels.has(ch);
        return (
          <Link
            key={ch}
            href={`/read/${currentBook}/${ch}`}
            aria-current={ch === currentChapter ? "page" : undefined}
            onClick={(event) => {
              onNavigate(event, {
                book: currentBook,
                chapter: ch,
              });
            }}
            title={
              hasParallels
                ? `Глава ${ch} — есть параллельные места`
                : `Глава ${ch}`
            }
            className={cn(
              "relative z-10 flex flex-col items-center justify-center h-9 text-sm font-sans font-medium rounded-md transition-colors duration-300",
              isActive
                ? "text-[var(--card)] dark:text-stone-900"
                : "text-stone-800 dark:text-stone-300 hover:bg-[var(--sidebar-left-active)] dark:hover:bg-stone-800",
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
  );
}

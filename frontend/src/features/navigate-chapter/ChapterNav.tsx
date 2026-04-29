"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { useState, useRef, useEffect, useMemo } from "react";
import {
  getChapterCount,
  getChaptersWithParallels,
  getBookName,
  KINGS_BOOKS,
} from "@tsarstva/data";

interface Props {
  book: string;
  chapter: number;
  totalChapters: number;
  bookName: string;
}

interface NavTarget {
  book: string;
  chapter: number;
}

function getAdjacentTarget(
  book: string,
  chapter: number,
  direction: -1 | 1,
): NavTarget | null {
  const bookIndex = KINGS_BOOKS.findIndex((item) => item === book);
  if (bookIndex === -1) return null;

  if (direction === -1) {
    if (chapter > 1) return { book, chapter: chapter - 1 };

    const prevBook = KINGS_BOOKS[bookIndex - 1];
    if (!prevBook) return null;

    return { book: prevBook, chapter: getChapterCount(prevBook) };
  }

  const totalChapters = getChapterCount(book);
  if (chapter < totalChapters) return { book, chapter: chapter + 1 };

  const nextBook = KINGS_BOOKS[bookIndex + 1];
  if (!nextBook) return null;

  return { book: nextBook, chapter: 1 };
}

function getTargetHref(target: NavTarget | null) {
  return target ? `/read/${target.book}/${target.chapter}` : "#";
}

export default function ChapterNav({
  book,
  chapter,
  totalChapters,
  bookName,
}: Props) {
  const router = useRouter();
  const prevTarget = useMemo(
    () => getAdjacentTarget(book, chapter, -1),
    [book, chapter],
  );
  const nextTarget = useMemo(
    () => getAdjacentTarget(book, chapter, 1),
    [book, chapter],
  );
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isKeyboardNavigatingRef = useRef(false);

  useEffect(() => {
    isKeyboardNavigatingRef.current = false;
  }, [book, chapter]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return (
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      );
    };

    const handler = (e: KeyboardEvent) => {
      if (
        e.defaultPrevented ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        isTypingTarget(e.target)
      ) {
        return;
      }

      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;

      e.preventDefault();

      if (isKeyboardNavigatingRef.current) return;

      const target = e.key === "ArrowLeft" ? prevTarget : nextTarget;

      if (!target) return;

      isKeyboardNavigatingRef.current = true;
      setOpen(false);
      router.push(getTargetHref(target));
    };

    const resetKeyboardNavigation = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        isKeyboardNavigatingRef.current = false;
      }
    };

    window.addEventListener("keydown", handler);
    window.addEventListener("keyup", resetKeyboardNavigation);
    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("keyup", resetKeyboardNavigation);
    };
  }, [nextTarget, prevTarget, router]);

  const chapters = useMemo(
    () => Array.from({ length: totalChapters }, (_, i) => i + 1),
    [totalChapters],
  );
  const chaptersWithParallels = useMemo(
    () => getChaptersWithParallels(book),
    [book],
  );
  const getTargetLabel = (target: NavTarget | null, fallbackChapter: number) =>
    target
      ? target.book === book
        ? `Гл. ${target.chapter}`
        : `${getBookName(target.book, true)} ${target.chapter}`
      : `Гл. ${fallbackChapter}`;

  return (
    <div className="flex items-center justify-between py-3 px-1">
      <Link
        href={getTargetHref(prevTarget)}
        aria-disabled={!prevTarget}
        className={cn(
          "flex items-center gap-1 text-sm font-sans px-3 py-1.5 rounded-md transition-colors",
          prevTarget
            ? "text-stone-600 hover:text-stone-900 hover:bg-[#F5F2F1] dark:text-stone-300 dark:hover:text-stone-100 dark:hover:bg-stone-700/40"
            : "text-stone-300 dark:text-stone-600 pointer-events-none",
        )}
      >
        <ChevronLeft size={16} />
        <span>{getTargetLabel(prevTarget, 1)}</span>
      </Link>

      <div ref={ref} className="relative text-center">
        <button
          onClick={() => setOpen((v) => !v)}
          className="px-3 py-1 rounded-md hover:bg-[#F5F2F1] dark:hover:bg-stone-800 transition-colors"
        >
          <p className="font-sans font-semibold text-stone-800 dark:text-stone-200 text-base leading-tight">
            {bookName}
          </p>
          <p className="font-sans text-xs text-stone-400 dark:text-stone-400">
            Глава {chapter} из {totalChapters}
          </p>
        </button>

        {open && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white dark:bg-stone-900 border border-[#E1DDD8] dark:border-stone-700 rounded-xl shadow-lg p-3 w-64">
            <p className="text-xs text-stone-400 dark:text-stone-400 font-sans mb-2 text-center">
              Выбрать главу
            </p>
            <div className="grid grid-cols-6 gap-1.5">
              {chapters.map((ch) => (
                <Link
                  key={ch}
                  href={`/read/${book}/${ch}`}
                  onClick={() => setOpen(false)}
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
        )}
      </div>

      <Link
        href={getTargetHref(nextTarget)}
        aria-disabled={!nextTarget}
        className={cn(
          "flex items-center gap-1 text-sm font-sans px-3 py-1.5 rounded-md transition-colors",
          nextTarget
            ? "text-stone-600 hover:text-stone-900 hover:bg-[#F5F2F1] dark:text-stone-300 dark:hover:text-stone-100 dark:hover:bg-stone-700/40"
            : "text-stone-300 dark:text-stone-600 pointer-events-none",
        )}
      >
        <span>{getTargetLabel(nextTarget, totalChapters)}</span>
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}

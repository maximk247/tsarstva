"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useRef, useEffect, useMemo } from "react";
import { getChaptersWithParallels } from "@/lib/crossRefs";

interface Props {
  book: string;
  chapter: number;
  totalChapters: number;
  bookName: string;
}

export default function ChapterNav({ book, chapter, totalChapters, bookName }: Props) {
  const prevChapter = chapter > 1 ? chapter - 1 : null;
  const nextChapter = chapter < totalChapters ? chapter + 1 : null;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const chapters = Array.from({ length: totalChapters }, (_, i) => i + 1);
  const chaptersWithParallels = useMemo(() => getChaptersWithParallels(book), [book]);

  return (
    <div className="flex items-center justify-between py-3 px-1">
      <Link
        href={prevChapter ? `/read/${book}/${prevChapter}` : "#"}
        aria-disabled={!prevChapter}
        className={cn(
          "flex items-center gap-1 text-sm font-sans px-3 py-1.5 rounded-md transition-colors",
          prevChapter
            ? "text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800"
            : "text-stone-300 dark:text-stone-700 pointer-events-none"
        )}
      >
        <ChevronLeft size={16} />
        <span>Гл. {prevChapter ?? 1}</span>
      </Link>

      {/* Chapter picker */}
      <div ref={ref} className="relative text-center">
        <button
          onClick={() => setOpen((v) => !v)}
          className="px-3 py-1 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors"
        >
          <p className="font-sans font-semibold text-stone-800 dark:text-stone-200 text-base leading-tight">
            {bookName}
          </p>
          <p className="font-sans text-xs text-stone-400 dark:text-stone-500">
            Глава {chapter} из {totalChapters}
          </p>
        </button>

        {open && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-xl shadow-lg p-3 min-w-[200px]">
            <p className="text-xs text-stone-400 dark:text-stone-500 font-sans mb-2 text-center">
              Выбрать главу
            </p>
            <div className="grid grid-cols-6 gap-1">
              {chapters.map((ch) => (
                <button
                  key={ch}
                  onClick={() => {
                    setOpen(false);
                    router.push(`/read/${book}/${ch}`);
                  }}
                  className={cn(
                    "relative w-8 h-8 text-sm font-sans rounded-md transition-colors",
                    ch === chapter
                      ? "bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 font-semibold"
                      : "text-stone-600 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-800"
                  )}
                >
                  {ch}
                  {chaptersWithParallels.has(ch) && (
                    <span className={cn(
                      "absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full",
                      ch === chapter ? "bg-stone-300 dark:bg-stone-600" : "bg-stone-400 dark:bg-stone-500"
                    )} />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Link
        href={nextChapter ? `/read/${book}/${nextChapter}` : "#"}
        aria-disabled={!nextChapter}
        className={cn(
          "flex items-center gap-1 text-sm font-sans px-3 py-1.5 rounded-md transition-colors",
          nextChapter
            ? "text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800"
            : "text-stone-300 dark:text-stone-700 pointer-events-none"
        )}
      >
        <span>Гл. {nextChapter ?? totalChapters}</span>
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}

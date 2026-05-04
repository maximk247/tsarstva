"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { getChaptersWithParallels } from "@tsarstva/data";
import { cn } from "@/shared/lib/cn";
import { getAdjacentTarget, getTargetLabel } from "../lib/chapterTargets";
import { isTypingTarget } from "../lib/dom";
import { getChapterHref } from "../lib/navigationLinks";
import { useDeferredChapterNavigation } from "../model/useDeferredChapterNavigation";
import ChapterDropdown from "./ChapterDropdown";

interface Props {
  book: string;
  chapter: number;
  totalChapters: number;
  bookName: string;
}

export default function ChapterNav({
  book,
  chapter,
  totalChapters,
  bookName,
}: Props) {
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
  const navigation = useDeferredChapterNavigation();

  useEffect(() => {
    isKeyboardNavigatingRef.current = false;
    navigation.cancel();
  }, [book, chapter, navigation]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
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

      if (isKeyboardNavigatingRef.current || navigation.isPending()) {
        return;
      }

      const target = e.key === "ArrowLeft" ? prevTarget : nextTarget;
      if (!target) return;

      isKeyboardNavigatingRef.current = true;
      setOpen(false);
      navigation.navigate(target);
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
  }, [navigation, nextTarget, prevTarget]);

  const chapters = useMemo(
    () => Array.from({ length: totalChapters }, (_, i) => i + 1),
    [totalChapters],
  );
  const chaptersWithParallels = useMemo(
    () => getChaptersWithParallels(book),
    [book],
  );

  return (
    <div className="flex items-center justify-between py-3 px-1">
      <Link
        href={getChapterHref(prevTarget)}
        aria-disabled={!prevTarget}
        className={cn(
          "flex items-center gap-1 text-sm font-sans px-3 py-1.5 rounded-md transition-colors",
          prevTarget
            ? "text-stone-600 hover:text-stone-900 hover:bg-[#F5F2F1] dark:text-stone-300 dark:hover:text-stone-100 dark:hover:bg-stone-700/40"
            : "text-stone-300 dark:text-stone-600 pointer-events-none",
        )}
      >
        <ChevronLeft size={16} />
        <span>{getTargetLabel(prevTarget, book, 1)}</span>
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
          <ChapterDropdown
            book={book}
            chapter={chapter}
            chapters={chapters}
            chaptersWithParallels={chaptersWithParallels}
            onSelect={() => setOpen(false)}
          />
        )}
      </div>

      <Link
        href={getChapterHref(nextTarget)}
        aria-disabled={!nextTarget}
        className={cn(
          "flex items-center gap-1 text-sm font-sans px-3 py-1.5 rounded-md transition-colors",
          nextTarget
            ? "text-stone-600 hover:text-stone-900 hover:bg-[#F5F2F1] dark:text-stone-300 dark:hover:text-stone-100 dark:hover:bg-stone-700/40"
            : "text-stone-300 dark:text-stone-600 pointer-events-none",
        )}
      >
        <span>{getTargetLabel(nextTarget, book, totalChapters)}</span>
        <ChevronRight size={16} />
      </Link>
    </div>
  );
}

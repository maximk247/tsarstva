"use client";

import { BookOpen } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getBookName,
  getChapterCount,
  READER_BOOKS,
  type ReaderBook,
} from "@tsarstva/data";
import { cn } from "@/shared/utils/cn";
import {
  getCurrentProgress,
  READING_CURRENT_PROGRESS_UPDATED_EVENT,
  type CurrentReadingProgress,
} from "../progress";

interface Props {
  className?: string;
}

function isReaderBook(book: string): book is ReaderBook {
  return READER_BOOKS.some((item) => item === book);
}

function getValidProgress() {
  const progress = getCurrentProgress();
  if (!progress || !isReaderBook(progress.book)) return null;

  const totalChapters = getChapterCount(progress.book);
  if (progress.chapter > totalChapters) return null;

  return progress;
}

function getProgressPercent(progress: CurrentReadingProgress) {
  const percent = Math.round(progress.scrollRatio * 100);
  return percent > 2 ? ` · ${percent}%` : "";
}

export default function ContinueReadingLink({ className }: Props) {
  const [progress, setProgress] = useState<CurrentReadingProgress | null>(null);

  useEffect(() => {
    const syncProgress = () => setProgress(getValidProgress());

    syncProgress();
    window.addEventListener(
      READING_CURRENT_PROGRESS_UPDATED_EVENT,
      syncProgress,
    );
    window.addEventListener("storage", syncProgress);

    return () => {
      window.removeEventListener(
        READING_CURRENT_PROGRESS_UPDATED_EVENT,
        syncProgress,
      );
      window.removeEventListener("storage", syncProgress);
    };
  }, []);

  if (!progress || !isReaderBook(progress.book)) return null;

  return (
    <Link
      href={`/read/${progress.book}/${progress.chapter}`}
      className={cn(
        "group flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-left shadow-sm transition-all hover:border-amber-400 hover:shadow-md dark:border-stone-700 dark:bg-stone-900",
        className,
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[var(--accent-wash)] text-[var(--accent)] transition-colors group-hover:text-amber-700 dark:text-amber-400">
        <BookOpen size={18} />
      </span>
      <span className="min-w-0">
        <span className="block font-sans text-sm font-semibold text-stone-800 transition-colors group-hover:text-amber-700 dark:text-stone-200 dark:group-hover:text-amber-400">
          Продолжить чтение
        </span>
        <span className="block truncate font-sans text-sm text-[var(--text-secondary)] dark:text-stone-400">
          {getBookName(progress.book)}, глава {progress.chapter}
          {getProgressPercent(progress)}
        </span>
      </span>
    </Link>
  );
}

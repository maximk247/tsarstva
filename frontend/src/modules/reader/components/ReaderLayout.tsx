"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import MainText from "./MainText";
import ParallelPanel from "./ParallelPanel";
import type { PrecomputedParallel } from "@tsarstva/data";

interface Props {
  book: string;
  chapter: number;
  verses: string[];
  bookName: string;
  parallelsMap: Record<number, PrecomputedParallel[]>;
}

export default function ReaderLayout({ book, chapter, verses, bookName, parallelsMap }: Props) {
  const [activeVerse, setActiveVerse] = useState<number | null>(null);

  const versesWithParallels = useMemo(
    () => new Set(Object.keys(parallelsMap).map(Number)),
    [parallelsMap]
  );

  const activeParallels = activeVerse !== null ? (parallelsMap[activeVerse] ?? []) : [];

  const handleVerseClick = useCallback((v: number) => {
    setActiveVerse((prev) => (prev === v ? null : v));
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#v")) {
      const verse = parseInt(hash.slice(2));
      if (!isNaN(verse)) {
        setActiveVerse(verse);
        setTimeout(() => {
          document.getElementById(`v${verse}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    }
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-0 flex-1 overflow-hidden">
      <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto bg-white dark:bg-transparent">
        <MainText
          verses={verses}
          versesWithParallels={versesWithParallels}
          activeVerse={activeVerse}
          onVerseClick={handleVerseClick}
        />
      </div>

      <div className="hidden lg:block w-px bg-[#E1DDD8] dark:bg-stone-700 shrink-0" />

      <div className="lg:w-96 xl:w-[440px] shrink-0 overflow-y-auto px-4 sm:px-6 py-6 border-t border-[#E1DDD8] dark:border-stone-700 lg:border-t-0 bg-[#F1EEE9] dark:bg-stone-950/50">
        <ParallelPanel
          refs={activeParallels}
          activeVerse={activeVerse}
          bookName={bookName}
          chapter={chapter}
        />
      </div>
    </div>
  );
}

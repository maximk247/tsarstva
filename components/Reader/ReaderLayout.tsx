"use client";

import { useState, useEffect, useRef } from "react";
import MainText from "./MainText";
import ParallelPanel from "./ParallelPanel";
import { getParallelsForVerse, getChapterParallels } from "@/lib/crossRefs";
import { markRead } from "@/lib/readingProgress";
import type { CrossRef } from "@/types/bible";

interface Props {
  book: string;
  chapter: number;
  verses: string[];
  bookName: string;
}

export default function ReaderLayout({ book, chapter, verses, bookName }: Props) {
  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [parallels, setParallels] = useState<CrossRef[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  const chapterParallels = getChapterParallels(book, chapter, verses.length);
  const versesWithParallels = new Set(chapterParallels.keys());

  useEffect(() => {
    if (activeVerse !== null) {
      setParallels(getParallelsForVerse(book, chapter, activeVerse));
    } else {
      setParallels([]);
    }
  }, [activeVerse, book, chapter]);

  // Read verse from URL hash (#v15 → verse 15)
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

  // Mark chapter as read when user scrolls to the bottom
  useEffect(() => {
    const el = endRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) markRead(book, chapter); },
      { threshold: 0.5 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [book, chapter]);

  return (
    <div className="flex flex-col lg:flex-row gap-0 flex-1 min-h-0">
      {/* Main text column */}
      <div className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto">
        <MainText
          verses={verses}
          versesWithParallels={versesWithParallels}
          activeVerse={activeVerse}
          onVerseClick={(v) => setActiveVerse((prev) => (prev === v ? null : v))}
        />
        <div ref={endRef} className="h-px mt-8" />
      </div>

      {/* Divider */}
      <div className="hidden lg:block w-px bg-stone-200 dark:bg-stone-700 shrink-0" />

      {/* Parallels column */}
      <div className="lg:w-96 xl:w-[440px] shrink-0 lg:sticky lg:top-14 lg:h-[calc(100vh-3.5rem)] lg:overflow-y-auto px-4 sm:px-6 py-6 border-t border-stone-200 dark:border-stone-700 lg:border-t-0 bg-stone-50/50 dark:bg-stone-950/50">
        <ParallelPanel
          refs={parallels}
          activeVerse={activeVerse}
          bookName={bookName}
          chapter={chapter}
        />
      </div>
    </div>
  );
}

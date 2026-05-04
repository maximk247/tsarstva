"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { Chapter, PrecomputedParallel } from "@tsarstva/data";
import { useParallelPanelSnapshot } from "../model/useParallelPanelSnapshot";
import { useHashVerseScroll } from "../model/useHashVerseScroll";
import { useKeyboardScroll } from "../model/useKeyboardScroll";
import { useReaderVisibility } from "../model/useReaderVisibility";
import { useResizablePanel } from "../model/useResizablePanel";
import { useVerseSelection } from "../model/useVerseSelection";
import ParallelPanel from "./parallel/ParallelPanel";
import ParallelPanelResizeHandle from "./parallel/ParallelPanelResizeHandle";
import VerseSelectionToolbar from "./selection/VerseSelectionToolbar";
import MainText from "./text/MainText";
import { cn } from "@/shared/lib/cn";

interface Props {
  book: string;
  chapter: number;
  verses: Chapter;
  bookName: string;
  parallelsMap: Record<number, PrecomputedParallel[]>;
}

export default function ReaderLayout({
  book,
  chapter,
  verses,
  bookName,
  parallelsMap,
}: Props) {
  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const { textTransition } = useReaderVisibility(book, chapter);
  const { panelTransition } = useParallelPanelSnapshot({
    book,
    chapter,
    activeVerse,
    bookName,
    parallelsMap,
  });
  const verseSelection = useVerseSelection({
    bookName,
    chapter,
    verses,
    scrollRef,
  });
  const resizablePanel = useResizablePanel({
    activeVerse,
    panelRef,
  });

  useKeyboardScroll(scrollRef);
  useHashVerseScroll(setActiveVerse);

  const versesWithParallels = useMemo(
    () => new Set(Object.keys(parallelsMap).map(Number)),
    [parallelsMap],
  );
  const handleVerseClick = useCallback((v: number) => {
    setActiveVerse((prev) => (prev === v ? null : v));
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-6 sm:px-6 lg:px-8 dark:bg-transparent"
      >
        <div
          className={cn(
            "transition-[opacity,transform,filter] ease-in-out motion-reduce:transition-none",
            textTransition.isVisible
              ? "opacity-100 translate-y-0 blur-0"
              : "pointer-events-none opacity-0 translate-y-1 blur-[1px]",
          )}
          style={{ transitionDuration: `${textTransition.durationMs}ms` }}
        >
          <MainText
            verses={verses}
            versesWithParallels={versesWithParallels}
            activeVerse={activeVerse}
            selectedVerses={verseSelection.mainTextProps.selectedVerses}
            onVerseClick={handleVerseClick}
            onCheckStart={verseSelection.mainTextProps.onCheckStart}
          />
        </div>
      </div>

      <div className="hidden lg:block w-px bg-[#E1DDD8] dark:bg-stone-700 shrink-0" />

      <div
        ref={panelRef}
        className={cn(
          "shrink-0 overflow-y-auto border-t border-[#E1DDD8] dark:border-stone-700 lg:border-t-0 bg-[#F1EEE9] dark:bg-stone-950/50",
          "h-[55vh] h-[55dvh] lg:h-auto lg:w-96 xl:w-[440px]",
          activeVerse === null && "hidden lg:block",
        )}
        style={resizablePanel.panelStyle}
      >
        <ParallelPanelResizeHandle {...resizablePanel.resizeHandleProps} />

        <div className="px-4 pt-4 pb-6 sm:px-6 lg:py-6">
          <div
            className={cn(
              "transition-[opacity,transform,filter] ease-in-out motion-reduce:transition-none",
              panelTransition.isVisible
                ? "opacity-100 translate-y-0 blur-0"
                : "pointer-events-none opacity-0 translate-y-1 blur-[1px]",
            )}
            style={{
              transitionDuration: `${panelTransition.durationMs}ms`,
            }}
          >
            <ParallelPanel
              refs={panelTransition.snapshot.refs}
              activeVerse={panelTransition.snapshot.activeVerse}
              bookName={panelTransition.snapshot.bookName}
              chapter={panelTransition.snapshot.chapter}
            />
          </div>
        </div>
      </div>

      <VerseSelectionToolbar {...verseSelection.toolbarProps} />
    </div>
  );
}

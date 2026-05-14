"use client";

import { useCallback, useRef, useState } from "react";
import type { Chapter, PrecomputedParallel } from "@tsarstva/data";
import { useParallelPanelSnapshot } from "../hooks/useParallelPanelSnapshot";
import { useHashVerseScroll } from "../hooks/useHashVerseScroll";
import { useKeyboardScroll } from "../hooks/useKeyboardScroll";
import { useReaderVisibility } from "../hooks/useReaderVisibility";
import { useResizablePanel } from "../hooks/useResizablePanel";
import { useVerseSelection } from "../hooks/useVerseSelection";
import ParallelPanel from "./parallel/ParallelPanel";
import ParallelPanelResizeHandle from "./parallel/ParallelPanelResizeHandle";
import VerseSelectionToolbar from "./selection/VerseSelectionToolbar";
import MainText from "./text/MainText";
import { cn } from "@/shared/utils/cn";

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

  const handleVerseClick = useCallback((v: number) => {
    setActiveVerse((prev) => (prev === v ? null : v));
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto bg-[var(--card)] px-4 py-6 sm:px-6 lg:px-8 dark:bg-transparent"
      >
        <div
          className={cn(
            "reader-wind-transition",
            !textTransition.isVisible && "pointer-events-none",
          )}
          data-visible={textTransition.isVisible ? "true" : "false"}
          style={{ transitionDuration: `${textTransition.durationMs}ms` }}
        >
          <MainText
            verses={verses}
            parallelsMap={parallelsMap}
            activeVerse={activeVerse}
            selectedVerses={verseSelection.mainTextProps.selectedVerses}
            onVerseClick={handleVerseClick}
            onCheckStart={verseSelection.mainTextProps.onCheckStart}
          />
        </div>
      </div>

      <div className="hidden lg:block w-px bg-[var(--border)] dark:bg-stone-700 shrink-0" />

      <div
        ref={panelRef}
        className={cn(
          "shrink-0 overflow-x-hidden overflow-y-auto border-t border-[var(--border)] dark:border-stone-700 lg:border-t-0 bg-[var(--sidebar)] dark:bg-stone-950/50",
          "h-[55vh] h-[55dvh] lg:h-auto lg:w-96 xl:w-[440px]",
          activeVerse === null && "hidden lg:block",
        )}
        style={resizablePanel.panelStyle}
      >
        <ParallelPanelResizeHandle {...resizablePanel.resizeHandleProps} />

        <div className="px-4 pt-4 pb-6 sm:px-6 lg:py-6">
          <ParallelPanel
            refs={panelTransition.snapshot.refs}
            activeVerse={panelTransition.snapshot.activeVerse}
            activeReferenceLabel={panelTransition.snapshot.activeReferenceLabel}
            bookName={panelTransition.snapshot.bookName}
            chapter={panelTransition.snapshot.chapter}
            isReferenceTransitionVisible={panelTransition.isVisible}
            isContentTransitionVisible={panelTransition.isContentVisible}
            transitionDurationMs={panelTransition.durationMs}
          />
        </div>
      </div>

      <VerseSelectionToolbar {...verseSelection.toolbarProps} />
    </div>
  );
}

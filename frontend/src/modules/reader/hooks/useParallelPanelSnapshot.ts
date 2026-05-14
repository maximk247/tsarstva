"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CHAPTER_NAVIGATION_INTENT_EVENT,
  type ChapterNavigationIntent,
} from "@/features/navigate-chapter";
import type { PrecomputedParallel } from "@tsarstva/data";
import { PARALLEL_PANEL_SWAP_DELAY_MS } from "../constants/parallelPanel";

const EMPTY_PARALLELS: PrecomputedParallel[] = [];

export interface ParallelPanelSnapshot {
  refs: PrecomputedParallel[];
  activeVerse: number | null;
  activeReferenceLabel: string | null;
  bookName: string;
  chapter: number;
}

function getPanelSnapshotKey(
  book: string,
  chapter: number,
  activeVerse: number | null,
) {
  return `${book}:${chapter}:${activeVerse ?? "empty"}`;
}

function getPanelContentSnapshotKey(
  activeVerse: number | null,
  refs: PrecomputedParallel[],
) {
  if (activeVerse === null) {
    return "prompt";
  }

  if (refs.length === 0) {
    return "no-parallels";
  }

  return refs
    .map(
      (ref) =>
        `${ref.book}:${ref.chapter}:${ref.verse}:${ref.chapterEnd ?? ""}:${
          ref.verseEnd ?? ""
        }:${ref.sourceChapter ?? ""}:${ref.sourceVerse ?? ""}:${
          ref.sourceChapterEnd ?? ""
        }:${ref.sourceVerseEnd ?? ""}:${ref.theme}:${ref.label}`,
    )
    .join("|");
}

function getActiveReferenceLabel(
  bookName: string,
  chapter: number,
  activeVerse: number | null,
  refs: PrecomputedParallel[],
) {
  if (activeVerse === null) return null;

  const firstRef = refs[0];
  const startChapter = firstRef?.sourceChapter ?? chapter;
  const startVerse = firstRef?.sourceVerse ?? activeVerse;
  const endChapter = firstRef?.sourceChapterEnd ?? startChapter;
  const endVerse = firstRef?.sourceVerseEnd ?? startVerse;

  if (endChapter !== startChapter) {
    return `${bookName} ${startChapter}:${startVerse}–${endChapter}:${endVerse}`;
  }

  if (endVerse !== startVerse) {
    return `${bookName} ${startChapter}:${startVerse}–${endVerse}`;
  }

  return `${bookName} ${chapter}:${activeVerse}`;
}

interface Params {
  book: string;
  chapter: number;
  activeVerse: number | null;
  bookName: string;
  parallelsMap: Record<number, PrecomputedParallel[]>;
}

export function useParallelPanelSnapshot({
  book,
  chapter,
  activeVerse,
  bookName,
  parallelsMap,
}: Params) {
  const [isParallelPanelVisible, setIsParallelPanelVisible] = useState(false);
  const [isParallelContentVisible, setIsParallelContentVisible] =
    useState(false);
  const panelSwapTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const panelVisibilityRafRef = useRef<number>(undefined);
  const panelSnapshotKeyRef = useRef("");
  const panelContentSnapshotKeyRef = useRef("");
  const activeParallels = useMemo(
    () =>
      activeVerse !== null
        ? (parallelsMap[activeVerse] ?? EMPTY_PARALLELS)
        : EMPTY_PARALLELS,
    [activeVerse, parallelsMap],
  );
  const activeReferenceLabel = useMemo(
    () =>
      getActiveReferenceLabel(bookName, chapter, activeVerse, activeParallels),
    [activeParallels, activeVerse, bookName, chapter],
  );
  const [parallelPanelSnapshot, setParallelPanelSnapshot] =
    useState<ParallelPanelSnapshot>(() => ({
      refs: activeParallels,
      activeVerse,
      activeReferenceLabel,
      bookName,
      chapter,
    }));

  useEffect(() => {
    const handleNavigationIntent = (event: Event) => {
      const target = (event as CustomEvent<ChapterNavigationIntent>).detail;
      if (!target || (target.book === book && target.chapter === chapter)) {
        return;
      }

      setIsParallelPanelVisible(false);
      setIsParallelContentVisible(false);
    };

    window.addEventListener(
      CHAPTER_NAVIGATION_INTENT_EVENT,
      handleNavigationIntent,
    );
    return () => {
      window.removeEventListener(
        CHAPTER_NAVIGATION_INTENT_EVENT,
        handleNavigationIntent,
      );
    };
  }, [book, chapter]);

  useEffect(() => {
    const nextKey = getPanelSnapshotKey(book, chapter, activeVerse);
    const nextContentKey = getPanelContentSnapshotKey(
      activeVerse,
      activeParallels,
    );
    const hadPreviousSnapshot = panelSnapshotKeyRef.current !== "";
    const hasSameContent =
      panelContentSnapshotKeyRef.current === nextContentKey;

    clearTimeout(panelSwapTimerRef.current);
    cancelAnimationFrame(panelVisibilityRafRef.current!);

    if (panelSnapshotKeyRef.current === nextKey) {
      panelContentSnapshotKeyRef.current = nextContentKey;
      setParallelPanelSnapshot({
        refs: activeParallels,
        activeVerse,
        activeReferenceLabel,
        bookName,
        chapter,
      });
      setIsParallelPanelVisible(true);
      setIsParallelContentVisible(true);
      return;
    }

    if (hadPreviousSnapshot) {
      setIsParallelPanelVisible(false);

      if (!hasSameContent) {
        setIsParallelContentVisible(false);
      }
    }

    if (hasSameContent) {
      setIsParallelContentVisible(true);
    }

    panelSwapTimerRef.current = setTimeout(
      () => {
        panelSnapshotKeyRef.current = nextKey;
        panelContentSnapshotKeyRef.current = nextContentKey;
        setParallelPanelSnapshot({
          refs: activeParallels,
          activeVerse,
          activeReferenceLabel,
          bookName,
          chapter,
        });
        panelVisibilityRafRef.current = requestAnimationFrame(() => {
          panelVisibilityRafRef.current = requestAnimationFrame(() => {
            setIsParallelPanelVisible(true);
            setIsParallelContentVisible(true);
          });
        });
      },
      hadPreviousSnapshot ? PARALLEL_PANEL_SWAP_DELAY_MS : 0,
    );

    return () => {
      clearTimeout(panelSwapTimerRef.current);
      cancelAnimationFrame(panelVisibilityRafRef.current!);
    };
  }, [
    activeParallels,
    activeReferenceLabel,
    activeVerse,
    book,
    bookName,
    chapter,
  ]);

  return {
    panelTransition: {
      snapshot: parallelPanelSnapshot,
      isVisible: isParallelPanelVisible,
      isContentVisible: isParallelContentVisible,
      durationMs: PARALLEL_PANEL_SWAP_DELAY_MS,
    },
  };
}

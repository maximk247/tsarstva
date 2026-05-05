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
        }:${ref.theme}:${ref.label}`,
    )
    .join("|");
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
  const [parallelPanelSnapshot, setParallelPanelSnapshot] =
    useState<ParallelPanelSnapshot>(() => ({
      refs: activeParallels,
      activeVerse,
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
  }, [activeParallels, activeVerse, book, bookName, chapter]);

  return {
    panelTransition: {
      snapshot: parallelPanelSnapshot,
      isVisible: isParallelPanelVisible,
      isContentVisible: isParallelContentVisible,
      durationMs: PARALLEL_PANEL_SWAP_DELAY_MS,
    },
  };
}

"use client";

import { useEffect, type RefObject } from "react";
import {
  getCurrentProgress,
  saveCurrentProgress,
} from "@/features/reading-progress";

const SAVE_DELAY_MS = 250;

interface Params {
  book: string;
  chapter: number;
  scrollRef: RefObject<HTMLDivElement | null>;
  enabled?: boolean;
}

function hasVerseHash() {
  return window.location.hash.startsWith("#v");
}

function getScrollRatio(container: HTMLDivElement) {
  const maxScrollTop = Math.max(
    0,
    container.scrollHeight - container.clientHeight,
  );
  if (maxScrollTop === 0) return 0;

  return Math.min(1, Math.max(0, container.scrollTop / maxScrollTop));
}

function restoreScrollTop(container: HTMLDivElement, scrollTop: number) {
  const maxScrollTop = Math.max(
    0,
    container.scrollHeight - container.clientHeight,
  );
  container.scrollTop = Math.min(maxScrollTop, Math.max(0, scrollTop));
}

export function useReadingProgressPersistence({
  book,
  chapter,
  scrollRef,
  enabled = true,
}: Params) {
  useEffect(() => {
    if (!enabled) return;

    const container = scrollRef.current;
    if (!container) return;

    let saveTimerId: number | null = null;
    let restoreFrameId: number | null = null;
    let isInitialized = false;

    const persist = () => {
      if (!isInitialized) return;

      saveCurrentProgress({
        book,
        chapter,
        scrollTop: container.scrollTop,
        scrollRatio: getScrollRatio(container),
      });
    };

    const schedulePersist = () => {
      if (saveTimerId !== null) return;

      saveTimerId = window.setTimeout(() => {
        saveTimerId = null;
        persist();
      }, SAVE_DELAY_MS);
    };

    const restore = () => {
      const progress = getCurrentProgress();

      if (
        progress &&
        progress.book === book &&
        progress.chapter === chapter &&
        !hasVerseHash()
      ) {
        restoreScrollTop(container, progress.scrollTop);
      }

      isInitialized = true;
      persist();
    };

    restoreFrameId = window.requestAnimationFrame(() => {
      restoreFrameId = window.requestAnimationFrame(restore);
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") persist();
    };

    container.addEventListener("scroll", schedulePersist, { passive: true });
    window.addEventListener("pagehide", persist);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (saveTimerId !== null) window.clearTimeout(saveTimerId);
      if (restoreFrameId !== null) window.cancelAnimationFrame(restoreFrameId);

      persist();
      container.removeEventListener("scroll", schedulePersist);
      window.removeEventListener("pagehide", persist);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [book, chapter, enabled, scrollRef]);
}

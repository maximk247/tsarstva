"use client";

import { useEffect, useRef, useState } from "react";
import {
  CHAPTER_NAVIGATION_COMMIT_DELAY_MS,
  CHAPTER_NAVIGATION_INTENT_EVENT,
  type ChapterNavigationIntent,
} from "@/features/navigate-chapter";

export function useReaderVisibility(book: string, chapter: number) {
  const [isTextVisible, setIsTextVisible] = useState(false);
  const textVisibilityRafRef = useRef<number>(undefined);

  useEffect(() => {
    setIsTextVisible(false);
    cancelAnimationFrame(textVisibilityRafRef.current!);
    textVisibilityRafRef.current = requestAnimationFrame(() => {
      textVisibilityRafRef.current = requestAnimationFrame(() => {
        setIsTextVisible(true);
      });
    });

    return () => cancelAnimationFrame(textVisibilityRafRef.current!);
  }, [book, chapter]);

  useEffect(() => {
    const handleNavigationIntent = (event: Event) => {
      const target = (event as CustomEvent<ChapterNavigationIntent>).detail;
      if (!target || (target.book === book && target.chapter === chapter)) {
        return;
      }

      setIsTextVisible(false);
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

  return {
    textTransition: {
      isVisible: isTextVisible,
      durationMs: CHAPTER_NAVIGATION_COMMIT_DELAY_MS,
    },
  };
}

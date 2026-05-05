"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { CHAPTER_NAVIGATION_COMMIT_DELAY_MS } from "../constants/navigation";
import { getChapterHref } from "../utils/navigationLinks";
import {
  announceChapterNavigationIntent,
  type ChapterNavigationIntent,
} from "../utils/navigationIntent";

interface Options {
  onIntent?: (target: ChapterNavigationIntent) => void;
}

export function useDeferredChapterNavigation({ onIntent }: Options = {}) {
  const router = useRouter();
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const cancel = useCallback(() => {
    clearTimeout(navigationTimerRef.current);
    navigationTimerRef.current = undefined;
  }, []);

  const isPending = useCallback(
    () => navigationTimerRef.current !== undefined,
    [],
  );

  const navigate = useCallback(
    (target: ChapterNavigationIntent) => {
      clearTimeout(navigationTimerRef.current);
      announceChapterNavigationIntent(target);
      onIntent?.(target);
      navigationTimerRef.current = setTimeout(() => {
        navigationTimerRef.current = undefined;
        router.push(getChapterHref(target));
      }, CHAPTER_NAVIGATION_COMMIT_DELAY_MS);
    },
    [onIntent, router],
  );

  useEffect(() => cancel, [cancel]);

  return useMemo(
    () => ({
      navigate,
      cancel,
      isPending,
    }),
    [cancel, isPending, navigate],
  );
}

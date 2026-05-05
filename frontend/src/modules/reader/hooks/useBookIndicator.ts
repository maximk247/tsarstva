"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  areIndicatorRectsEqual,
  getBookIndicatorRect,
  type IndicatorRect,
} from "../utils/bookIndicator";

export function useBookIndicator(activeBook: string) {
  const [bookIndicatorRect, setBookIndicatorRect] =
    useState<IndicatorRect | null>(null);
  const bookNavRef = useRef<HTMLElement>(null);
  const bookLinkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const bookIndicatorRectRef = useRef<IndicatorRect | null>(null);

  const moveBookIndicatorTo = useCallback((book: string) => {
    const nextRect = getBookIndicatorRect(
      book,
      bookNavRef.current,
      bookLinkRefs.current,
    );

    if (!nextRect) {
      setBookIndicatorRect(null);
      return;
    }

    const prevRect = bookIndicatorRectRef.current;

    if (prevRect && areIndicatorRectsEqual(prevRect, nextRect)) {
      return;
    }

    bookIndicatorRectRef.current = nextRect;
    setBookIndicatorRect(nextRect);
  }, []);

  const updateBookIndicator = useCallback(() => {
    moveBookIndicatorTo(activeBook);
  }, [activeBook, moveBookIndicatorTo]);

  useEffect(() => {
    updateBookIndicator();
  }, [updateBookIndicator]);

  useEffect(() => {
    window.addEventListener("resize", updateBookIndicator);
    return () => window.removeEventListener("resize", updateBookIndicator);
  }, [updateBookIndicator]);

  return useMemo(
    () => ({
      refs: {
        bookNavRef,
        bookLinkRefs,
      },
      indicator: {
        rect: bookIndicatorRect,
        moveTo: moveBookIndicatorTo,
      },
    }),
    [bookIndicatorRect, moveBookIndicatorTo],
  );
}

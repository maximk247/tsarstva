"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  areIndicatorRectsEqual,
  getBookIndicatorRect,
  type IndicatorRect,
} from "../utils/bookIndicator";

interface BookIndicatorState {
  rect: IndicatorRect | null;
  animate: boolean;
}

interface MoveBookIndicatorOptions {
  animate?: boolean;
}

let lastBookIndicatorSnapshot: {
  book: string;
  rect: IndicatorRect;
} | null = null;

export function useBookIndicator(activeBook: string) {
  const [bookIndicator, setBookIndicator] = useState<BookIndicatorState>(() =>
    lastBookIndicatorSnapshot?.book === activeBook
      ? { rect: lastBookIndicatorSnapshot.rect, animate: false }
      : { rect: null, animate: false },
  );
  const bookNavRef = useRef<HTMLElement>(null);
  const bookLinkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const bookIndicatorRectRef = useRef<IndicatorRect | null>(
    bookIndicator.rect,
  );

  const moveBookIndicatorTo = useCallback(
    (book: string, options: MoveBookIndicatorOptions = {}) => {
      const nextRect = getBookIndicatorRect(
        book,
        bookNavRef.current,
        bookLinkRefs.current,
      );

      if (!nextRect) {
        bookIndicatorRectRef.current = null;
        setBookIndicator({ rect: null, animate: false });
        return;
      }

      const prevRect = bookIndicatorRectRef.current;
      const shouldAnimate = options.animate === true && prevRect !== null;

      lastBookIndicatorSnapshot = { book, rect: nextRect };

      if (prevRect && areIndicatorRectsEqual(prevRect, nextRect)) {
        return;
      }

      bookIndicatorRectRef.current = nextRect;
      setBookIndicator({ rect: nextRect, animate: shouldAnimate });
    },
    [],
  );

  const updateBookIndicator = useCallback(() => {
    moveBookIndicatorTo(activeBook, { animate: false });
  }, [activeBook, moveBookIndicatorTo]);

  useLayoutEffect(() => {
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
        rect: bookIndicator.rect,
        animate: bookIndicator.animate,
        moveTo: moveBookIndicatorTo,
      },
    }),
    [bookIndicator, moveBookIndicatorTo],
  );
}

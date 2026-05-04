"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { cn } from "@/shared/lib/cn";
import {
  READER_BOOK_NAMES,
  READER_BOOK_SECTIONS,
  getChaptersWithParallels,
  getChapterCount,
} from "@tsarstva/data";
import {
  CHAPTER_NAVIGATION_COMMIT_DELAY_MS,
  CHAPTER_NAVIGATION_INTENT_EVENT,
  announceChapterNavigationIntent,
  type ChapterNavigationIntent,
} from "@/features/navigate-chapter";
import { ThemeToggle } from "@/features/theme-toggle";
import { FontSizeControl } from "@/features/font-size";

interface Props {
  currentBook: string;
  currentChapter: number;
}

interface IndicatorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

function areIndicatorRectsEqual(a: IndicatorRect, b: IndicatorRect) {
  return (
    a.top === b.top &&
    a.left === b.left &&
    a.width === b.width &&
    a.height === b.height
  );
}

function getBookIndicatorRect(
  book: string,
  container: HTMLElement | null,
  links: Map<string, HTMLAnchorElement>,
) {
  const activeLink = links.get(book);

  if (!container || !activeLink) return null;

  const containerRect = container.getBoundingClientRect();
  const linkRect = activeLink.getBoundingClientRect();
  return {
    top: linkRect.top - containerRect.top + container.scrollTop,
    left: linkRect.left - containerRect.left + container.scrollLeft,
    width: linkRect.width,
    height: linkRect.height,
  };
}

function shouldSkipOptimisticNavigation(event: MouseEvent<HTMLAnchorElement>) {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  );
}

export default function Sidebar({ currentBook, currentChapter }: Props) {
  const [activeTarget, setActiveTarget] = useState({
    book: currentBook,
    chapter: currentChapter,
  });
  const [bookIndicatorRect, setBookIndicatorRect] =
    useState<IndicatorRect | null>(null);
  const router = useRouter();
  const bookNavRef = useRef<HTMLElement>(null);
  const bookLinkRefs = useRef(new Map<string, HTMLAnchorElement>());
  const bookIndicatorRectRef = useRef<IndicatorRect | null>(null);
  const navigationTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const totalChapters = getChapterCount(currentBook);
  const chapters = useMemo(
    () => Array.from({ length: totalChapters }, (_, i) => i + 1),
    [totalChapters],
  );
  const chaptersWithParallels = useMemo(
    () => getChaptersWithParallels(currentBook),
    [currentBook],
  );
  const activeChapter =
    activeTarget.book === currentBook ? activeTarget.chapter : currentChapter;
  const activeBook = activeTarget.book;
  const activeChapterIndex =
    Math.min(Math.max(activeChapter, 1), totalChapters) - 1;
  const activeChapterColumn = activeChapterIndex % 5;
  const activeChapterRow = Math.floor(activeChapterIndex / 5);

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

  const activateTarget = useCallback(
    (target: { book: string; chapter: number }) => {
      setActiveTarget(target);
      moveBookIndicatorTo(target.book);
    },
    [moveBookIndicatorTo],
  );

  const navigateAfterIndicatorMove = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, target: typeof activeTarget) => {
      if (shouldSkipOptimisticNavigation(event)) return;

      event.preventDefault();
      clearTimeout(navigationTimerRef.current);
      announceChapterNavigationIntent(target);
      activateTarget(target);
      navigationTimerRef.current = setTimeout(() => {
        router.push(`/read/${target.book}/${target.chapter}`);
      }, CHAPTER_NAVIGATION_COMMIT_DELAY_MS);
    },
    [activateTarget, router],
  );

  useEffect(() => {
    activateTarget({ book: currentBook, chapter: currentChapter });
  }, [activateTarget, currentBook, currentChapter]);

  useEffect(() => {
    updateBookIndicator();
  }, [updateBookIndicator]);

  useEffect(() => {
    window.addEventListener("resize", updateBookIndicator);
    return () => window.removeEventListener("resize", updateBookIndicator);
  }, [updateBookIndicator]);

  useEffect(() => {
    return () => clearTimeout(navigationTimerRef.current);
  }, []);

  useEffect(() => {
    const handleNavigationIntent = (event: Event) => {
      const target = (event as CustomEvent<ChapterNavigationIntent>).detail;
      if (!target) return;
      activateTarget(target);
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
  }, [activateTarget]);

  return (
    <aside className="hidden lg:flex flex-col w-52 xl:w-56 shrink-0 h-full border-r border-[#E1DDD8] dark:border-stone-700 bg-[#FAF9F7] dark:bg-stone-950 overflow-hidden">
      <div className="h-14 flex items-center justify-between px-4 border-b border-[#E1DDD8] dark:border-stone-700 shrink-0">
        <p className="font-sans text-sm font-semibold text-stone-800 dark:text-stone-200 tracking-wide">
          Чтение книг
        </p>
        <div className="flex items-center gap-1">
          <FontSizeControl />
          <ThemeToggle />
        </div>
      </div>

      <div className="px-3 py-3 border-b border-[#E1DDD8] dark:border-stone-700 shrink-0">
        <nav ref={bookNavRef} className="relative flex flex-col gap-3">
          {bookIndicatorRect && (
            <div
              aria-hidden="true"
              className="pointer-events-none absolute left-0 top-0 rounded-md bg-amber-900/10 transition-transform duration-[300ms] ease-in-out will-change-transform dark:bg-stone-800 motion-reduce:transition-none"
              style={{
                width: bookIndicatorRect.width,
                height: bookIndicatorRect.height,
                transform: `translate3d(${bookIndicatorRect.left}px, ${bookIndicatorRect.top}px, 0)`,
              }}
            />
          )}
          {READER_BOOK_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="text-[10px] uppercase tracking-widest text-stone-400 dark:text-stone-600 font-sans mb-1 px-1">
                {section.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.books.map((abbrev) => {
                  const isActive = activeBook === abbrev;
                  return (
                    <Link
                      key={abbrev}
                      href={`/read/${abbrev}/1`}
                      ref={(node) => {
                        if (node) bookLinkRefs.current.set(abbrev, node);
                        else bookLinkRefs.current.delete(abbrev);
                      }}
                      aria-current={currentBook === abbrev ? "page" : undefined}
                      onClick={(event) => {
                        navigateAfterIndicatorMove(event, {
                          book: abbrev,
                          chapter: 1,
                        });
                      }}
                      className={cn(
                        "relative z-10 font-sans text-sm font-medium px-3 py-1.5 rounded-md transition-colors duration-300",
                        isActive
                          ? "text-amber-900 dark:text-stone-100"
                          : "text-stone-600 hover:text-stone-900 hover:bg-[#F5F2F1] dark:text-stone-400 dark:hover:text-stone-200 dark:hover:bg-stone-800",
                      )}
                    >
                      {READER_BOOK_NAMES[abbrev]}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="text-[10px] uppercase tracking-widest text-stone-400 dark:text-stone-600 font-sans mb-2.5 px-1">
          Главы
        </p>
        <div className="relative grid grid-cols-5 gap-1">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-0 h-9 rounded-md bg-amber-900 shadow-sm transition-transform duration-[300ms] ease-in-out will-change-transform dark:bg-stone-200 motion-reduce:transition-none"
            style={{
              width: "calc(20% - 0.2rem)",
              transform: `translate3d(calc(${activeChapterColumn * 100}% + ${
                activeChapterColumn * 0.25
              }rem), ${activeChapterRow * 2.5}rem, 0)`,
            }}
          />
          {chapters.map((ch) => {
            const isActive = ch === activeChapter;
            const hasParallels = chaptersWithParallels.has(ch);
            return (
              <Link
                key={ch}
                href={`/read/${currentBook}/${ch}`}
                aria-current={ch === currentChapter ? "page" : undefined}
                onClick={(event) => {
                  navigateAfterIndicatorMove(event, {
                    book: currentBook,
                    chapter: ch,
                  });
                }}
                title={
                  hasParallels
                    ? `Глава ${ch} — есть параллельные места`
                    : `Глава ${ch}`
                }
                className={cn(
                  "relative z-10 flex flex-col items-center justify-center h-9 text-sm font-sans font-medium rounded-md transition-colors duration-300",
                  isActive
                    ? "text-[#FAF9F7] dark:text-stone-900"
                    : "text-stone-700 dark:text-stone-300 hover:bg-[#F5F2F1] dark:hover:bg-stone-800",
                )}
              >
                <span>{ch}</span>
                <span
                  className={cn(
                    "w-1 h-1 rounded-full",
                    isActive && hasParallels
                      ? "bg-amber-400/80 dark:bg-stone-500"
                      : !isActive && hasParallels
                        ? "bg-amber-500 dark:bg-amber-500"
                        : "invisible",
                  )}
                />
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
} from "react";
import { getChaptersWithParallels, getChapterCount } from "@tsarstva/data";
import {
  CHAPTER_NAVIGATION_INTENT_EVENT,
  shouldSkipDeferredNavigation,
  useDeferredChapterNavigation,
  type ChapterNavigationIntent,
} from "@/features/navigate-chapter";
import { FontSizeControl } from "@/features/font-size";
import { ThemeToggle } from "@/features/theme-toggle";
import { useBookIndicator } from "../../model/useBookIndicator";
import SidebarBookNav from "./SidebarBookNav";
import SidebarChapterGrid from "./SidebarChapterGrid";

interface Props {
  currentBook: string;
  currentChapter: number;
}

export default function Sidebar({ currentBook, currentChapter }: Props) {
  const [activeTarget, setActiveTarget] = useState({
    book: currentBook,
    chapter: currentChapter,
  });
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
  const bookIndicator = useBookIndicator(activeBook);
  const moveBookIndicatorTo = bookIndicator.indicator.moveTo;

  const activateTarget = useCallback(
    (target: ChapterNavigationIntent) => {
      setActiveTarget(target);
      moveBookIndicatorTo(target.book);
    },
    [moveBookIndicatorTo],
  );
  const navigation = useDeferredChapterNavigation({
    onIntent: activateTarget,
  });

  const navigateAfterIndicatorMove = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, target: ChapterNavigationIntent) => {
      if (shouldSkipDeferredNavigation(event)) return;

      event.preventDefault();
      navigation.navigate(target);
    },
    [navigation],
  );

  useEffect(() => {
    activateTarget({ book: currentBook, chapter: currentChapter });
  }, [activateTarget, currentBook, currentChapter]);

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
        <SidebarBookNav
          activeBook={activeBook}
          currentBook={currentBook}
          bookIndicatorRect={bookIndicator.indicator.rect}
          bookNavRef={bookIndicator.refs.bookNavRef}
          bookLinkRefs={bookIndicator.refs.bookLinkRefs}
          onNavigate={navigateAfterIndicatorMove}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <p className="text-[10px] uppercase tracking-widest text-stone-400 dark:text-stone-600 font-sans mb-2.5 px-1">
          Главы
        </p>
        <SidebarChapterGrid
          currentBook={currentBook}
          currentChapter={currentChapter}
          activeChapter={activeChapter}
          chapters={chapters}
          chaptersWithParallels={chaptersWithParallels}
          onNavigate={navigateAfterIndicatorMove}
        />
      </div>
    </aside>
  );
}

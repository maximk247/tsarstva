"use client";

import Link from "next/link";
import type { MouseEvent, RefObject } from "react";
import { READER_BOOK_NAMES, READER_BOOK_SECTIONS } from "@tsarstva/data";
import type { ChapterNavigationIntent } from "@/features/navigate-chapter";
import { cn } from "@/shared/utils/cn";
import type { IndicatorRect } from "../../utils/bookIndicator";

interface Props {
  activeBook: string;
  currentBook: string;
  bookIndicatorRect: IndicatorRect | null;
  bookNavRef: RefObject<HTMLElement | null>;
  bookLinkRefs: RefObject<Map<string, HTMLAnchorElement>>;
  onNavigate: (
    event: MouseEvent<HTMLAnchorElement>,
    target: ChapterNavigationIntent,
  ) => void;
}

export default function SidebarBookNav({
  activeBook,
  currentBook,
  bookIndicatorRect,
  bookNavRef,
  bookLinkRefs,
  onNavigate,
}: Props) {
  return (
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
                    onNavigate(event, { book: abbrev, chapter: 1 });
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
  );
}

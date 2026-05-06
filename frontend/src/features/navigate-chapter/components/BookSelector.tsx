"use client";

import Link from "next/link";
import { useLayoutEffect, useRef } from "react";
import { cn } from "@/shared/utils/cn";
import { READER_BOOK_SECTIONS, getBookName } from "@tsarstva/data";

let lastBookSelectorBook: string | null = null;
let lastBookSelectorScrollLeft: number | null = null;

function getScrollContainer(nav: HTMLElement | null) {
  return nav?.parentElement ?? null;
}

function getCenteredScrollLeft(container: HTMLElement, link: HTMLElement) {
  const containerRect = container.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  const rawLeft =
    linkRect.left -
    containerRect.left +
    container.scrollLeft -
    (container.clientWidth - linkRect.width) / 2;
  const maxLeft = container.scrollWidth - container.clientWidth;

  return Math.min(Math.max(rawLeft, 0), maxLeft);
}

function shouldReduceMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

interface Props {
  currentBook: string;
}

export default function BookSelector({ currentBook }: Props) {
  const navRef = useRef<HTMLElement | null>(null);
  const activeBookRef = useRef<HTMLAnchorElement | null>(null);

  useLayoutEffect(() => {
    const container = getScrollContainer(navRef.current);
    const activeBook = activeBookRef.current;

    if (!container || !activeBook) return;

    const targetScrollLeft = getCenteredScrollLeft(container, activeBook);
    const previousBook = lastBookSelectorBook;
    const isBookChange = previousBook !== null && previousBook !== currentBook;

    if (isBookChange && lastBookSelectorScrollLeft !== null) {
      container.scrollLeft = lastBookSelectorScrollLeft;
      container.scrollTo({
        left: targetScrollLeft,
        behavior: shouldReduceMotion() ? "auto" : "smooth",
      });
    } else {
      container.scrollLeft =
        previousBook === currentBook && lastBookSelectorScrollLeft !== null
          ? lastBookSelectorScrollLeft
          : targetScrollLeft;
    }

    lastBookSelectorBook = currentBook;
    lastBookSelectorScrollLeft = targetScrollLeft;
  }, [currentBook]);

  useLayoutEffect(() => {
    const container = getScrollContainer(navRef.current);
    if (!container) return;

    const rememberScrollLeft = () => {
      lastBookSelectorScrollLeft = container.scrollLeft;
    };

    rememberScrollLeft();
    container.addEventListener("scroll", rememberScrollLeft, {
      passive: true,
    });

    return () => {
      rememberScrollLeft();
      container.removeEventListener("scroll", rememberScrollLeft);
    };
  }, []);

  return (
    <nav ref={navRef} className="flex items-center gap-1">
      {READER_BOOK_SECTIONS.map((section, sectionIndex) => (
        <div key={section.title} className="flex items-center gap-1">
          {sectionIndex > 0 && (
            <span className="mx-1 h-4 w-px bg-[#E1DDD8] dark:bg-stone-700" />
          )}
          <span className="sr-only">{section.title}</span>
          {section.books.map((abbrev) => {
            const isActive = currentBook === abbrev;
            return (
              <Link
                key={abbrev}
                href={`/read/${abbrev}/1`}
                ref={isActive ? activeBookRef : undefined}
                className={cn(
                  "font-sans text-sm px-2.5 py-1 rounded-md transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-amber-900 text-[#FAF9F7] dark:bg-stone-200 dark:text-stone-900 font-semibold"
                    : "text-stone-600 hover:text-stone-900 hover:bg-[#F5F2F1] dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800",
                )}
              >
                {getBookName(abbrev, true)}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

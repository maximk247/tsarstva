"use client";

import { useCallback, useEffect, useState } from "react";
import type { Chapter, PrecomputedParallel } from "@tsarstva/data";
import { BookSelector, ChapterNav } from "@/features/navigate-chapter";
import { SearchLink } from "@/features/word-search";
import ReaderSettingsMenu from "./settings/ReaderSettingsMenu";
import Sidebar from "./sidebar/Sidebar";
import ReaderLayout from "./ReaderLayout";

interface Props {
  book: string;
  chapter: number;
  verses: Chapter;
  bookName: string;
  totalChapters: number;
  parallelsMap: Record<number, PrecomputedParallel[]>;
}

export default function ReaderShell({
  book,
  chapter,
  verses,
  bookName,
  totalChapters,
  parallelsMap,
}: Props) {
  const [searchQuery, setSearchQuery] = useState<string | null>(null);

  useEffect(() => {
    setSearchQuery(null);
  }, [book, chapter]);

  const openSearch = useCallback(() => {
    setSearchQuery((currentQuery) => currentQuery ?? "");
  }, []);

  const closeSearch = useCallback(() => {
    setSearchQuery(null);
  }, []);

  const handleSidebarSearchChange = useCallback((query: string) => {
    setSearchQuery(query.trim() ? query : null);
  }, []);

  const handleSidebarSearchSubmit = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  return (
    <div className="reader-viewport flex overflow-hidden">
      <Sidebar
        currentBook={book}
        currentChapter={chapter}
        searchQuery={searchQuery ?? ""}
        onSearchQueryChange={handleSidebarSearchChange}
        onSearchSubmit={handleSidebarSearchSubmit}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <header className="lg:hidden shrink-0 z-10 bg-[var(--background-overlay)] dark:bg-stone-950/90 backdrop-blur border-b border-[var(--border)] dark:border-stone-700">
          <div className="px-3 flex items-center h-10 gap-2 border-b border-[var(--border)] dark:border-stone-700">
            <div className="min-w-0 flex-1 overflow-x-auto">
              <BookSelector currentBook={book} />
            </div>
            <div className="shrink-0 flex items-center gap-1">
              <SearchLink onSearchOpen={openSearch} />
              <ReaderSettingsMenu />
            </div>
          </div>
          <ChapterNav
            book={book}
            chapter={chapter}
            totalChapters={totalChapters}
            bookName={bookName}
          />
        </header>

        <main className="flex min-h-0 flex-1 overflow-hidden">
          <ReaderLayout
            book={book}
            chapter={chapter}
            verses={verses}
            bookName={bookName}
            parallelsMap={parallelsMap}
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            onSearchClose={closeSearch}
          />
        </main>
      </div>
    </div>
  );
}

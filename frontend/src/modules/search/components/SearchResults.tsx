"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { SearchVerse } from "@tsarstva/data";
import { ThemeToggle } from "@/features/theme-toggle";
import {
  SearchBox,
  SearchResultList,
  finishSearchTransition,
  searchVerses,
  type SearchResultSet,
} from "@/features/word-search";
import { useDebouncedValue } from "@/features/word-search/hooks/useDebouncedValue";

interface Props {
  verses: SearchVerse[];
}

const RESULT_LIMIT = 80;
const SEARCH_DEBOUNCE_MS = 220;
const EMPTY_RESULT_SET: SearchResultSet = {
  items: [],
  total: 0,
  terms: [],
  isReady: false,
};

export default function SearchResults({ verses }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isReady, setIsReady] = useState(false);
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("q") ?? "");
    setIsReady(true);
    finishSearchTransition();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const params = new URLSearchParams(window.location.search);
    const nextQuery = debouncedQuery.trim();

    if (nextQuery) params.set("q", nextQuery);
    else params.delete("q");

    const search = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}`,
    );
  }, [debouncedQuery, isReady]);

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;
  const resultSet = useMemo(
    () =>
      hasQuery
        ? searchVerses(verses, debouncedQuery, RESULT_LIMIT)
        : EMPTY_RESULT_SET,
    [debouncedQuery, hasQuery, verses],
  );
  const isShortQuery = hasQuery && !resultSet.isReady;
  const isSearchSettling = hasQuery && debouncedQuery !== query;

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <div className="search-page-enter min-h-screen bg-[var(--background)] px-4 py-5 sm:px-6 sm:py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 rounded-md px-2 py-1.5 font-sans text-sm font-medium text-stone-600 transition-colors hover:bg-[var(--hover)] hover:text-stone-950 dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-stone-100"
          >
            <ArrowLeft size={16} />
            Назад
          </button>
          <ThemeToggle />
        </header>

        <main className="flex flex-col gap-5">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-stone-800 dark:text-stone-100 sm:text-4xl">
              Поиск
            </h1>
          </div>

          <SearchBox
            value={query}
            onValueChange={setQuery}
            onSubmit={setQuery}
            autoFocus
            className="w-full"
          />

          <div className="min-h-5 font-sans text-sm text-[var(--muted-foreground)] dark:text-stone-500">
            {isSearchSettling && "Ищу..."}
            {!isSearchSettling &&
              resultSet.isReady &&
              (resultSet.total > 0
                ? `${resultSet.total} совпадений`
                : "Ничего не найдено")}
            {!isSearchSettling && isShortQuery && "Нужно хотя бы 2 буквы"}
          </div>

          <SearchResultList resultSet={resultSet} />
        </main>
      </div>
    </div>
  );
}

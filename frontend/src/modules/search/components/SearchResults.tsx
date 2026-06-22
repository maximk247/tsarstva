"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { SearchVerse } from "@tsarstva/data";
import { ThemeToggle } from "@/features/theme-toggle";
import {
  SearchBox,
  SearchResultList,
  finishSearchTransition,
  searchVerses,
} from "@/features/word-search";

interface Props {
  verses: SearchVerse[];
}

const RESULT_LIMIT = 80;

export default function SearchResults({ verses }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isReady, setIsReady] = useState(false);
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setQuery(params.get("q") ?? "");
    setIsReady(true);
    finishSearchTransition();
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const params = new URLSearchParams(window.location.search);
    const nextQuery = query.trim();

    if (nextQuery) params.set("q", nextQuery);
    else params.delete("q");

    const search = params.toString();
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${search ? `?${search}` : ""}`,
    );
  }, [isReady, query]);

  const resultSet = useMemo(
    () => searchVerses(verses, deferredQuery, RESULT_LIMIT),
    [deferredQuery, verses],
  );
  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;
  const isShortQuery = hasQuery && !resultSet.isReady;

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
            {resultSet.isReady &&
              (resultSet.total > 0
                ? `${resultSet.total} совпадений`
                : "Ничего не найдено")}
            {isShortQuery && "Нужно хотя бы 2 буквы"}
          </div>

          <SearchResultList resultSet={resultSet} />
        </main>
      </div>
    </div>
  );
}

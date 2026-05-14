"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import type { SearchVerse } from "@tsarstva/data";
import { ThemeToggle } from "@/features/theme-toggle";
import {
  SearchBox,
  finishSearchTransition,
  getHighlightedSegments,
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
  const shownCount = resultSet.items.length;

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
                ? `${resultSet.total} совпадений${
                    resultSet.total > shownCount
                      ? `, показано ${shownCount}`
                      : ""
                  }`
                : "Ничего не найдено")}
            {isShortQuery && "Нужно хотя бы 2 буквы"}
          </div>

          <div className="flex flex-col gap-3">
            {resultSet.items.map((result) => (
              <Link
                key={`${result.book}:${result.chapter}:${result.verse}`}
                href={`/read/${result.book}/${result.chapter}#v${result.verse}`}
                className="group rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-amber-400 hover:bg-[var(--hover)] dark:bg-stone-900 dark:hover:bg-stone-800"
              >
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="font-sans text-sm font-semibold text-amber-900 dark:text-amber-400">
                    {result.label}
                  </p>
                  <span className="shrink-0 rounded-md bg-[var(--accent-wash)] px-2 py-0.5 font-sans text-[11px] font-semibold text-[var(--accent)] dark:text-stone-300">
                    {result.bookShortName}
                  </span>
                </div>
                <p className="font-serif text-lg leading-relaxed text-[var(--reader-text)]">
                  {getHighlightedSegments(result.text, resultSet.terms).map(
                    (segment, index) =>
                      segment.isMatch ? (
                        <mark
                          key={index}
                          className="rounded-sm bg-amber-200 px-0.5 text-inherit dark:bg-amber-700/45"
                        >
                          {segment.text}
                        </mark>
                      ) : (
                        <span key={index}>{segment.text}</span>
                      ),
                  )}
                </p>
              </Link>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}

"use client";

import { MoveLeft } from "lucide-react";
import type { MouseEvent } from "react";
import { useEffect, useMemo } from "react";
import {
  SearchBox,
  SearchResultList,
  searchVerses,
} from "@/features/word-search";
import { useDebouncedValue } from "@/features/word-search/hooks/useDebouncedValue";
import { useSearchIndex } from "@/features/word-search/hooks/useSearchIndex";
import type { SearchResultSet } from "@/features/word-search";

const RESULT_LIMIT = 80;
const SEARCH_DEBOUNCE_MS = 220;
const EMPTY_RESULT_SET: SearchResultSet = {
  items: [],
  total: 0,
  terms: [],
  isReady: false,
};

interface Props {
  query: string;
  onQueryChange: (query: string) => void;
  onClose: () => void;
  onResultClick: (
    result: SearchResultSet["items"][number],
    event: MouseEvent<HTMLAnchorElement>,
  ) => void;
}

export default function ReaderSearchPanel({
  query,
  onQueryChange,
  onClose,
  onResultClick,
}: Props) {
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const searchIndex = useSearchIndex(true);
  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;
  const isSearchSettling = hasQuery && debouncedQuery !== query;
  const resultSet = useMemo(
    () =>
      hasQuery && searchIndex.verses
        ? searchVerses(searchIndex.verses, debouncedQuery, RESULT_LIMIT)
        : EMPTY_RESULT_SET,
    [debouncedQuery, hasQuery, searchIndex.verses],
  );
  const isShortQuery = hasQuery && !resultSet.isReady && !searchIndex.isLoading;
  const statusText = !hasQuery
    ? "Введите слово или фразу"
    : searchIndex.isLoading
      ? "Загружаю поиск..."
      : searchIndex.error
        ? "Не удалось загрузить поиск"
        : isSearchSettling
          ? "Ищу..."
        : resultSet.isReady
          ? resultSet.total > 0
            ? `${resultSet.total} совпадений`
            : "Ничего не найдено"
          : isShortQuery
            ? "Нужно хотя бы 2 буквы"
            : "";

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      event.preventDefault();
      onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <header className="flex min-h-9 items-center justify-between gap-3">
        <p className="font-sans text-sm text-[var(--muted-foreground)] dark:text-stone-500">
          {statusText}
        </p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Назад к тексту"
          title="Назад к тексту"
          className="flex h-9 w-12 shrink-0 items-center justify-center rounded-md text-stone-500 transition-colors hover:bg-[var(--hover)] hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
        >
          <MoveLeft size={24} strokeWidth={1.75} />
        </button>
      </header>

      <SearchBox
        value={query}
        onValueChange={onQueryChange}
        onSubmit={onQueryChange}
        autoFocus
        className="w-full lg:hidden"
      />

      <SearchResultList resultSet={resultSet} onResultClick={onResultClick} />
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { SearchVerse } from "@tsarstva/data";

interface SearchIndexState {
  verses: SearchVerse[] | null;
  isLoading: boolean;
  error: Error | null;
}

let cachedSearchIndex: SearchVerse[] | null = null;
let searchIndexPromise: Promise<SearchVerse[]> | null = null;

function loadSearchIndex() {
  if (cachedSearchIndex) return Promise.resolve(cachedSearchIndex);

  searchIndexPromise ??= fetch("/search-index.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Не удалось загрузить поисковый индекс");
      }

      return response.json() as Promise<SearchVerse[]>;
    })
    .then((verses) => {
      cachedSearchIndex = verses;
      return verses;
    })
    .catch((error) => {
      searchIndexPromise = null;
      throw error;
    });

  return searchIndexPromise;
}

export function useSearchIndex(enabled: boolean) {
  const [state, setState] = useState<SearchIndexState>(() => ({
    verses: cachedSearchIndex,
    isLoading: enabled && cachedSearchIndex === null,
    error: null,
  }));

  useEffect(() => {
    if (!enabled) return;
    if (cachedSearchIndex) {
      setState({ verses: cachedSearchIndex, isLoading: false, error: null });
      return;
    }

    let isCancelled = false;
    setState((current) => ({ ...current, isLoading: true, error: null }));

    loadSearchIndex()
      .then((verses) => {
        if (!isCancelled) {
          setState({ verses, isLoading: false, error: null });
        }
      })
      .catch((error: Error) => {
        if (!isCancelled) {
          setState({ verses: null, isLoading: false, error });
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [enabled]);

  return state;
}

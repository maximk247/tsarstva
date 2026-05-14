"use client";

import {
  useEffect,
  useMemo,
  useRef,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Chapter } from "@tsarstva/data";

const STORAGE_KEY_PREFIX = "reader-active-verse";

function getStorageKey(book: string, chapter: number) {
  return `${STORAGE_KEY_PREFIX}:${book}:${chapter}`;
}

function getHashVerse() {
  const hash = window.location.hash;
  if (!hash.startsWith("#v")) return null;

  const verse = parseInt(hash.slice(2));
  return Number.isNaN(verse) ? null : verse;
}

function isVerseInChapter(verses: Chapter, verse: number | null) {
  return verse !== null && verses[verse] !== undefined;
}

function readStoredVerse(storageKey: string) {
  const rawValue = sessionStorage.getItem(storageKey);
  if (!rawValue) return null;

  const verse = parseInt(rawValue);
  return Number.isNaN(verse) ? null : verse;
}

function scrollVerseIntoView(verse: number) {
  window.setTimeout(() => {
    document
      .getElementById(`v${verse}`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, 100);
}

interface Params {
  book: string;
  chapter: number;
  verses: Chapter;
  activeVerse: number | null;
  setActiveVerse: Dispatch<SetStateAction<number | null>>;
}

export function useRememberedActiveVerse({
  book,
  chapter,
  verses,
  activeVerse,
  setActiveVerse,
}: Params) {
  const storageKey = useMemo(
    () => getStorageKey(book, chapter),
    [book, chapter],
  );
  const restoredStorageKeyRef = useRef<string | null>(null);
  const skipNextPersistForKeyRef = useRef<string | null>(null);

  useEffect(() => {
    restoredStorageKeyRef.current = null;
    skipNextPersistForKeyRef.current = storageKey;

    const hashVerse = getHashVerse();
    const storedVerse = hashVerse ?? readStoredVerse(storageKey);
    const nextVerse = isVerseInChapter(verses, storedVerse)
      ? storedVerse
      : null;

    if (storedVerse !== null && nextVerse === null) {
      sessionStorage.removeItem(storageKey);
    }

    setActiveVerse(nextVerse);
    restoredStorageKeyRef.current = storageKey;

    if (hashVerse !== null && nextVerse !== null) {
      scrollVerseIntoView(nextVerse);
    }
  }, [setActiveVerse, storageKey, verses]);

  useEffect(() => {
    if (skipNextPersistForKeyRef.current === storageKey) {
      skipNextPersistForKeyRef.current = null;
      return;
    }

    if (restoredStorageKeyRef.current !== storageKey) return;

    if (!isVerseInChapter(verses, activeVerse)) {
      sessionStorage.removeItem(storageKey);
      return;
    }

    sessionStorage.setItem(storageKey, String(activeVerse));
  }, [activeVerse, storageKey, verses]);
}

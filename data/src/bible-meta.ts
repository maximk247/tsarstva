import type { BibleData, BookMeta, CrossRef } from "./types";

import indexRaw from "../json/bible/index.json";

const bible = indexRaw as BibleData;

export function getBook(abbrev: string): BookMeta | null {
  return bible[abbrev] ?? null;
}

export function getChapterCount(abbrev: string): number {
  return bible[abbrev]?.chapterCount ?? 0;
}

export function formatRef(
  ref: Pick<CrossRef, "book" | "chapter" | "verse" | "verseEnd" | "chapterEnd">,
): string {
  const book = bible[ref.book];
  const name = book?.nameShort ?? ref.book;
  if (ref.chapterEnd && ref.chapterEnd !== ref.chapter) {
    const endVerse = ref.verseEnd ?? 1;
    return `${name} ${ref.chapter}:${ref.verse}–${ref.chapterEnd}:${endVerse}`;
  }
  if (ref.verseEnd && ref.verseEnd !== ref.verse) {
    return `${name} ${ref.chapter}:${ref.verse}–${ref.verseEnd}`;
  }
  return `${name} ${ref.chapter}:${ref.verse}`;
}

export function getBookName(abbrev: string, short = false): string {
  const book = bible[abbrev];
  if (!book) return abbrev;
  return short ? book.nameShort : book.nameRu;
}

export { bible };

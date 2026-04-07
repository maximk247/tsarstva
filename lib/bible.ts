import type { BibleData, BookMeta, CrossRef } from "@/types/bible";

// These are loaded at build time (server-side) or imported as JSON
// Next.js treats JSON imports as static data
import bibleRaw from "@/data/bible/synodal.json";

const bible = bibleRaw as BibleData;

export function getBook(abbrev: string): BookMeta | null {
  return bible[abbrev] ?? null;
}

export function getChapter(abbrev: string, chapter: number): string[] | null {
  const book = bible[abbrev];
  if (!book) return null;
  const verses = book.chapters[chapter - 1];
  return verses ?? null;
}

export function getVerseText(abbrev: string, chapter: number, verse: number): string | null {
  const verses = getChapter(abbrev, chapter);
  if (!verses) return null;
  return verses[verse - 1] ?? null;
}

export function getVerseRange(
  abbrev: string,
  chapter: number,
  from: number,
  to?: number
): string {
  const verses = getChapter(abbrev, chapter);
  if (!verses) return "";
  const end = to ?? from;
  return verses.slice(from - 1, end).join(" ");
}

export function getChapterCount(abbrev: string): number {
  return bible[abbrev]?.chapters.length ?? 0;
}

export function formatRef(ref: Pick<CrossRef, "book" | "chapter" | "verse" | "verseEnd">): string {
  const book = bible[ref.book];
  const name = book?.nameShort ?? ref.book;
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

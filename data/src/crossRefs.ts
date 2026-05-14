import {
  READER_BOOKS,
  type CrossRef,
  type ManualEntry,
  type VerseRef,
} from "./types";

import manualRaw from "../json/cross-refs/manual.json";

const manualData = manualRaw as { refs: ManualEntry[] };

const manualIndex: Record<string, CrossRef[]> = {};
const readerBooks = new Set<string>(READER_BOOKS);

interface VerseRange extends VerseRef {
  verseEnd?: number;
  chapterEnd?: number;
}

function parseVerseRef(ref: string): VerseRef {
  const [book, chapterStr, verseStr] = ref.split(":");
  return {
    book,
    chapter: parseInt(chapterStr),
    verse: parseInt(verseStr),
  };
}

function parseRangeEnd(
  value: number | string | undefined,
): Pick<VerseRange, "verseEnd" | "chapterEnd"> {
  if (typeof value === "number") {
    return { verseEnd: value };
  }

  if (typeof value === "string") {
    const [endChStr, endVStr] = value.split(":");
    if (endVStr === undefined) {
      return { verseEnd: parseInt(endChStr) };
    }
    return {
      chapterEnd: parseInt(endChStr),
      verseEnd: parseInt(endVStr),
    };
  }

  return {};
}

function parseVerseRange(ref: string, end?: number | string): VerseRange {
  return {
    ...parseVerseRef(ref),
    ...parseRangeEnd(end),
  };
}

function getRangeKeys(range: VerseRange): string[] {
  const endChapter = range.chapterEnd ?? range.chapter;
  const endVerse = range.verseEnd ?? range.verse;

  if (endChapter !== range.chapter) {
    return [`${range.book}:${range.chapter}:${range.verse}`];
  }

  const keys: string[] = [];
  for (let verse = range.verse; verse <= endVerse; verse++) {
    keys.push(`${range.book}:${range.chapter}:${verse}`);
  }
  return keys;
}

function addRangeToIndex(range: VerseRange, ref: CrossRef) {
  for (const key of getRangeKeys(range)) {
    addToIndex(key, ref);
  }
}

function addToIndex(key: string, ref: CrossRef) {
  if (!manualIndex[key]) manualIndex[key] = [];
  const exists = manualIndex[key].some(
    (item) =>
      item.book === ref.book &&
      item.chapter === ref.chapter &&
      item.verse === ref.verse &&
      item.verseEnd === ref.verseEnd &&
      item.chapterEnd === ref.chapterEnd &&
      item.sourceBook === ref.sourceBook &&
      item.sourceChapter === ref.sourceChapter &&
      item.sourceVerse === ref.sourceVerse &&
      item.sourceVerseEnd === ref.sourceVerseEnd &&
      item.sourceChapterEnd === ref.sourceChapterEnd &&
      item.theme === ref.theme,
  );
  if (exists) return;
  manualIndex[key].push(ref);
}

function shouldAddReciprocal(fromBook: string, toBook: string): boolean {
  return (
    fromBook !== toBook && readerBooks.has(fromBook) && readerBooks.has(toBook)
  );
}

for (const entry of manualData.refs) {
  const fromRange = parseVerseRange(entry.from, entry.fromEnd);
  const toRange = parseVerseRange(entry.to, entry.toEnd);

  const forwardRef: CrossRef = {
    book: toRange.book,
    chapter: toRange.chapter,
    verse: toRange.verse,
    verseEnd: toRange.verseEnd,
    chapterEnd: toRange.chapterEnd,
    sourceBook: fromRange.book,
    sourceChapter: fromRange.chapter,
    sourceVerse: fromRange.verse,
    sourceVerseEnd: fromRange.verseEnd,
    sourceChapterEnd: fromRange.chapterEnd,
    theme: entry.theme,
    note: entry.note,
  };

  addRangeToIndex(fromRange, forwardRef);

  if (shouldAddReciprocal(fromRange.book, forwardRef.book)) {
    addRangeToIndex(toRange, {
      book: fromRange.book,
      chapter: fromRange.chapter,
      verse: fromRange.verse,
      verseEnd: fromRange.verseEnd,
      chapterEnd: fromRange.chapterEnd,
      sourceBook: toRange.book,
      sourceChapter: toRange.chapter,
      sourceVerse: toRange.verse,
      sourceVerseEnd: toRange.verseEnd,
      sourceChapterEnd: toRange.chapterEnd,
      theme: entry.theme,
      note: entry.note,
    });
  }
}

export function getParallelsForVerse(
  book: string,
  chapter: number,
  verse: number,
): CrossRef[] {
  const key = `${book}:${chapter}:${verse}`;
  return manualIndex[key] ?? [];
}

export function getChaptersWithParallels(book: string): Set<number> {
  const chapters = new Set<number>();
  for (const key of Object.keys(manualIndex)) {
    const [b, ch] = key.split(":");
    if (b === book) chapters.add(parseInt(ch));
  }
  return chapters;
}

export function getChapterParallels(
  book: string,
  chapter: number,
  verseCount: number,
): Map<number, CrossRef[]> {
  const result = new Map<number, CrossRef[]>();
  for (let v = 1; v <= verseCount; v++) {
    const refs = getParallelsForVerse(book, chapter, v);
    if (refs.length > 0) result.set(v, refs);
  }
  return result;
}

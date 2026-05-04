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

function parseVerseRef(ref: string): VerseRef {
  const [book, chapterStr, verseStr] = ref.split(":");
  return {
    book,
    chapter: parseInt(chapterStr),
    verse: parseInt(verseStr),
  };
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
  const from = parseVerseRef(entry.from);

  const [toBook, toChStr, toVStr] = entry.to.split(":");
  const chapter = parseInt(toChStr);

  let verseEnd: number | undefined;
  let chapterEnd: number | undefined;
  if (typeof entry.toEnd === "number") {
    verseEnd = entry.toEnd;
  } else if (typeof entry.toEnd === "string") {
    const [endChStr, endVStr] = entry.toEnd.split(":");
    if (endVStr === undefined) {
      verseEnd = parseInt(endChStr);
    } else {
      chapterEnd = parseInt(endChStr);
      verseEnd = parseInt(endVStr);
    }
  }

  const forwardRef: CrossRef = {
    book: toBook,
    chapter,
    verse: parseInt(toVStr),
    verseEnd,
    chapterEnd,
    theme: entry.theme,
    note: entry.note,
  };

  addToIndex(entry.from, forwardRef);

  if (shouldAddReciprocal(from.book, forwardRef.book)) {
    addToIndex(entry.to, {
      book: from.book,
      chapter: from.chapter,
      verse: from.verse,
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

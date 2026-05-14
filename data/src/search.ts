import { getBookName, getChapterCount } from "./bible-meta";
import { getChapter } from "./bible";
import { READER_BOOKS, type SearchVerse } from "./types";

export function getSearchIndex(): SearchVerse[] {
  const index: SearchVerse[] = [];

  for (const book of READER_BOOKS) {
    const bookName = getBookName(book);
    const bookShortName = getBookName(book, true);
    const totalChapters = getChapterCount(book);

    for (let chapter = 1; chapter <= totalChapters; chapter++) {
      const verses = getChapter(book, chapter);
      if (!verses) continue;

      const verseNumbers = Object.keys(verses)
        .map(Number)
        .sort((a, b) => a - b);

      for (const verse of verseNumbers) {
        const text = verses[verse];
        if (!text) continue;

        index.push({
          book,
          chapter,
          verse,
          text,
          label: `${bookShortName} ${chapter}:${verse}`,
          bookName,
          bookShortName,
        });
      }
    }
  }

  return index;
}

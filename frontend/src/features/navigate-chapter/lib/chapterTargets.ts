import { READER_BOOKS, getBookName, getChapterCount } from "@tsarstva/data";
import type { ChapterNavigationIntent } from "../model/navigationIntent";

export type NavTarget = ChapterNavigationIntent;

export function getAdjacentTarget(
  book: string,
  chapter: number,
  direction: -1 | 1,
): NavTarget | null {
  const bookIndex = READER_BOOKS.findIndex((item) => item === book);
  if (bookIndex === -1) return null;

  if (direction === -1) {
    if (chapter > 1) return { book, chapter: chapter - 1 };

    const prevBook = READER_BOOKS[bookIndex - 1];
    if (!prevBook) return null;

    return { book: prevBook, chapter: getChapterCount(prevBook) };
  }

  const totalChapters = getChapterCount(book);
  if (chapter < totalChapters) return { book, chapter: chapter + 1 };

  const nextBook = READER_BOOKS[bookIndex + 1];
  if (!nextBook) return null;

  return { book: nextBook, chapter: 1 };
}

export function getTargetLabel(
  target: NavTarget | null,
  currentBook: string,
  fallbackChapter: number,
) {
  return target
    ? target.book === currentBook
      ? `Гл. ${target.chapter}`
      : `${getBookName(target.book, true)} ${target.chapter}`
    : `Гл. ${fallbackChapter}`;
}

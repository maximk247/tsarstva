import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  getChapterCount,
  getBookName,
  READER_BOOKS,
  getChapterParallels,
  formatRef,
  type PrecomputedParallel,
} from "@tsarstva/data";
import { getChapter, getVerseItems } from "@tsarstva/data/server";
import ReaderShell from "../components/ReaderShell";

interface PageProps {
  params: Promise<{ book: string; chapter: string }>;
}

export async function generateStaticParams() {
  const params: { book: string; chapter: string }[] = [];
  for (const book of READER_BOOKS) {
    const total = getChapterCount(book);
    for (let ch = 1; ch <= total; ch++) {
      params.push({ book, chapter: String(ch) });
    }
  }
  return params;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { book, chapter } = await params;
  const bookName = getBookName(book);
  return {
    title: `${bookName} ${chapter} — Чтение Царств с параллелями`,
    description: `Параллельное чтение ${bookName}, глава ${chapter}`,
  };
}

export default async function ReaderPage({ params }: PageProps) {
  const { book, chapter: chapterStr } = await params;

  if (!READER_BOOKS.some((item) => item === book)) {
    notFound();
  }

  const chapter = parseInt(chapterStr);
  if (isNaN(chapter) || chapter < 1) notFound();

  const verses = getChapter(book, chapter);
  if (!verses) notFound();

  const bookName = getBookName(book);
  const totalChapters = getChapterCount(book);

  // Precompute all parallel texts at build time so the client never calls readFileSync
  const chapterParallels = getChapterParallels(
    book,
    chapter,
    Object.keys(verses).length,
  );
  const parallelsMap: Record<number, PrecomputedParallel[]> = {};
  for (const [verseNum, refs] of chapterParallels) {
    parallelsMap[verseNum] = refs.map((ref) => {
      const verses = getVerseItems(
        ref.book,
        ref.chapter,
        ref.verse,
        ref.verseEnd,
        ref.chapterEnd,
      );
      return {
        ...ref,
        verses,
        text: verses.map((v) => v.text).join(" "),
        label: formatRef(ref),
      };
    });
  }

  return (
    <ReaderShell
      book={book}
      chapter={chapter}
      verses={verses}
      bookName={bookName}
      totalChapters={totalChapters}
      parallelsMap={parallelsMap}
    />
  );
}

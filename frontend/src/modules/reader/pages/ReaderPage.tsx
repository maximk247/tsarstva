import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ChapterNav, BookSelector } from "@/features/navigate-chapter";
import { ThemeToggle } from "@/features/theme-toggle";
import {
  getChapterCount, getBookName, KINGS_BOOKS,
  getChapterParallels, formatRef,
  type PrecomputedParallel,
} from "@tsarstva/data";
import { getChapter, getVerseRange } from "@tsarstva/data/server";
import ReaderLayout from "../components/ReaderLayout";
import Sidebar from "../components/Sidebar";

interface PageProps {
  params: Promise<{ book: string; chapter: string }>;
}

export async function generateStaticParams() {
  const params: { book: string; chapter: string }[] = [];
  for (const book of KINGS_BOOKS) {
    const total = getChapterCount(book);
    for (let ch = 1; ch <= total; ch++) {
      params.push({ book, chapter: String(ch) });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { book, chapter } = await params;
  const bookName = getBookName(book);
  return {
    title: `${bookName} ${chapter} — Чтение Царств`,
    description: `Параллельное чтение ${bookName}, глава ${chapter}`,
  };
}

export default async function ReaderPage({ params }: PageProps) {
  const { book, chapter: chapterStr } = await params;

  if (!KINGS_BOOKS.includes(book as (typeof KINGS_BOOKS)[number])) {
    notFound();
  }

  const chapter = parseInt(chapterStr);
  if (isNaN(chapter) || chapter < 1) notFound();

  const verses = getChapter(book, chapter);
  if (!verses) notFound();

  const bookName = getBookName(book);
  const totalChapters = getChapterCount(book);

  // Precompute all parallel texts at build time so the client never calls readFileSync
  const chapterParallels = getChapterParallels(book, chapter, verses.length);
  const parallelsMap: Record<number, PrecomputedParallel[]> = {};
  for (const [verseNum, refs] of chapterParallels) {
    parallelsMap[verseNum] = refs.map((ref) => ({
      ...ref,
      text: getVerseRange(ref.book, ref.chapter, ref.verse, ref.verseEnd),
      label: formatRef(ref),
    }));
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar currentBook={book} currentChapter={chapter} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="lg:hidden shrink-0 z-10 bg-[#FAF9F7]/90 dark:bg-stone-950/90 backdrop-blur border-b border-[#E1DDD8] dark:border-stone-700">
          <div className="px-3 flex items-center h-10 gap-2 border-b border-[#E1DDD8] dark:border-stone-700">
            <BookSelector currentBook={book} currentChapter={chapter} />
            <ThemeToggle />
          </div>
          <ChapterNav
            book={book}
            chapter={chapter}
            totalChapters={totalChapters}
            bookName={bookName}
          />
        </header>

        <main className="flex-1 flex overflow-hidden">
          <ReaderLayout
            book={book}
            chapter={chapter}
            verses={verses}
            bookName={bookName}
            parallelsMap={parallelsMap}
          />
        </main>
      </div>
    </div>
  );
}

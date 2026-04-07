import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ReaderLayout from "@/components/Reader/ReaderLayout";
import ChapterNav from "@/components/Nav/ChapterNav";
import BookSelector from "@/components/Nav/BookSelector";
import { getChapter, getChapterCount, getBookName } from "@/lib/bible";
import { KINGS_BOOKS } from "@/types/bible";
import ThemeToggle from "@/components/ThemeToggle";

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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top navigation bar */}
      <header className="sticky top-0 z-10 bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur border-b border-stone-200 dark:border-stone-700">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 gap-4">
          <BookSelector currentBook={book} currentChapter={chapter} />
          <div className="flex items-center gap-2">
            <ChapterNav
              book={book}
              chapter={chapter}
              totalChapters={totalChapters}
              bookName={bookName}
            />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Reader body */}
      <main className="flex-1 flex max-w-screen-xl mx-auto w-full">
        <ReaderLayout
          book={book}
          chapter={chapter}
          verses={verses}
          bookName={bookName}
        />
      </main>
    </div>
  );
}

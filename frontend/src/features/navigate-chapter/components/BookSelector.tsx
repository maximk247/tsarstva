import Link from "next/link";
import { cn } from "@/shared/utils/cn";
import { READER_BOOK_SECTIONS, getBookName } from "@tsarstva/data";

interface Props {
  currentBook: string;
  currentChapter: number;
}

export default function BookSelector({ currentBook, currentChapter }: Props) {
  return (
    <nav className="flex items-center gap-1">
      {READER_BOOK_SECTIONS.map((section, sectionIndex) => (
        <div key={section.title} className="flex items-center gap-1">
          {sectionIndex > 0 && (
            <span className="mx-1 h-4 w-px bg-[#E1DDD8] dark:bg-stone-700" />
          )}
          <span className="sr-only">{section.title}</span>
          {section.books.map((abbrev) => {
            const isActive = currentBook === abbrev;
            return (
              <Link
                key={abbrev}
                href={`/read/${abbrev}/1`}
                className={cn(
                  "font-sans text-sm px-2.5 py-1 rounded-md transition-colors whitespace-nowrap",
                  isActive
                    ? "bg-amber-900 text-[#FAF9F7] dark:bg-stone-200 dark:text-stone-900 font-semibold"
                    : "text-stone-600 hover:text-stone-900 hover:bg-[#F5F2F1] dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800",
                )}
              >
                {getBookName(abbrev, true)}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

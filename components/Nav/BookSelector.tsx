import Link from "next/link";
import { cn } from "@/lib/utils";
import { KINGS_BOOKS, KINGS_NAMES } from "@/types/bible";

interface Props {
  currentBook: string;
  currentChapter: number;
}

export default function BookSelector({ currentBook, currentChapter }: Props) {
  return (
    <nav className="flex items-center gap-1">
      {KINGS_BOOKS.map((abbrev) => {
        const isActive = currentBook === abbrev;
        // Keep chapter number when switching books if it exists in that book, else go to 1
        return (
          <Link
            key={abbrev}
            href={`/read/${abbrev}/1`}
            className={cn(
              "font-sans text-sm px-3 py-1.5 rounded-md transition-colors whitespace-nowrap",
              isActive
                ? "bg-stone-800 text-white dark:bg-stone-200 dark:text-stone-900 font-semibold"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800"
            )}
          >
            {KINGS_NAMES[abbrev]}
          </Link>
        );
      })}
    </nav>
  );
}

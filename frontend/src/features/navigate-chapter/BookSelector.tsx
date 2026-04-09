import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { KINGS_BOOKS, KINGS_NAMES } from "@tsarstva/data";

interface Props {
  currentBook: string;
  currentChapter: number;
}

export default function BookSelector({ currentBook, currentChapter }: Props) {
  return (
    <nav className="flex items-center gap-1">
      {KINGS_BOOKS.map((abbrev) => {
        const isActive = currentBook === abbrev;
        return (
          <Link
            key={abbrev}
            href={`/read/${abbrev}/1`}
            className={cn(
              "font-sans text-sm px-3 py-1.5 rounded-md transition-colors whitespace-nowrap",
              isActive
                ? "bg-amber-900 text-[#FAF9F7] dark:bg-stone-200 dark:text-stone-900 font-semibold"
                : "text-stone-600 hover:text-stone-900 hover:bg-[#F5F2F1] dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800"
            )}
          >
            {KINGS_NAMES[abbrev]}
          </Link>
        );
      })}
    </nav>
  );
}

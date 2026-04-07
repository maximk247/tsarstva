import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatRef, getVerseRange } from "@/lib/bible";
import type { CrossRef, CrossRefTheme } from "@/types/bible";

const THEME_LABELS: Record<CrossRefTheme, string> = {
  same_event: "тот же нарратив",
  prophecy: "пророчество",
  theological: "богословская",
  tsk: "параллель",
};

const THEME_COLORS: Record<CrossRefTheme, string> = {
  same_event: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  prophecy: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  theological: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  tsk: "bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-400",
};

interface Props {
  ref_: CrossRef;
}

export default function ParallelCard({ ref_ }: Props) {
  const text = getVerseRange(ref_.book, ref_.chapter, ref_.verse, ref_.verseEnd);
  const label = formatRef(ref_);
  const href = `/read/${ref_.book}/${ref_.chapter}#v${ref_.verse}`;

  return (
    <div className="rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-3.5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-2 mb-2">
        <Link
          href={href}
          className="font-sans font-semibold text-sm text-stone-800 dark:text-stone-200 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
        >
          {label}
        </Link>
        <span
          className={cn(
            "shrink-0 text-xs font-medium font-sans px-1.5 py-0.5 rounded-full",
            THEME_COLORS[ref_.theme]
          )}
        >
          {THEME_LABELS[ref_.theme]}
        </span>
      </div>

      {text && (
        <p className="bible-text text-sm text-stone-700 dark:text-stone-300 leading-relaxed line-clamp-4">
          {text}
        </p>
      )}

      {ref_.note && (
        <p className="mt-1.5 text-xs font-sans text-stone-400 dark:text-stone-500 italic">
          {ref_.note}
        </p>
      )}
    </div>
  );
}

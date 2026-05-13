import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/shared/utils/cn";
import {
  READER_BOOKS,
  type PrecomputedParallel,
  type CrossRefTheme,
} from "@tsarstva/data";

const NAVIGABLE_BOOKS = new Set<string>(READER_BOOKS);

const THEME_LABELS: Record<CrossRefTheme, string> = {
  same_event: "тот же нарратив",
  fulfillment: "исполнение",
  prophecy: "пророчество",
  theological: "богословская",
  genealogy: "родословная",
  tsk: "параллель",
};

const THEME_COLORS: Record<CrossRefTheme, string> = {
  same_event:
    "bg-[#78350F] text-[var(--card)]  dark:bg-amber-900/50 dark:text-amber-200",
  fulfillment:
    "bg-[#7C2D12] text-[var(--card)]  dark:bg-orange-900/50 dark:text-orange-200",
  prophecy:
    "bg-[#92400E] text-[var(--card)]  dark:bg-amber-800/50 dark:text-amber-300",
  theological:
    "bg-[#44403C] text-[var(--card)]  dark:bg-stone-600/50 dark:text-stone-200",
  genealogy:
    "bg-[var(--active-verse)] text-[#78350F]  dark:bg-amber-900/30 dark:text-amber-300",
  tsk: "bg-[var(--hover)] text-stone-700  dark:bg-stone-800    dark:text-stone-400",
};

interface Props {
  ref_: PrecomputedParallel;
  reportAction?: ReactNode;
}

export default function ParallelCard({ ref_, reportAction }: Props) {
  const { text, label } = ref_;
  const isNavigable = NAVIGABLE_BOOKS.has(ref_.book);
  const href = `/read/${ref_.book}/${ref_.chapter}#v${ref_.verse}`;

  return (
    <div className="group rounded-lg border border-[var(--border)] dark:border-stone-700 bg-[var(--card)] dark:bg-stone-900 p-3.5 shadow-sm hover:shadow-md hover:border-[var(--muted-foreground)] dark:hover:border-stone-600 transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        {isNavigable ? (
          <Link
            href={href}
            className="font-sans font-semibold text-sm text-stone-900 dark:text-stone-200 hover:text-[var(--accent-medium)] dark:hover:text-amber-400 transition-colors"
          >
            {label}
          </Link>
        ) : (
          <span className="font-sans font-semibold text-sm text-stone-900 dark:text-stone-200">
            {label}
          </span>
        )}
        <div className="flex items-center gap-1 shrink-0">
          <span
            className={cn(
              "text-xs font-medium font-sans px-1.5 py-0.5 rounded-full",
              THEME_COLORS[ref_.theme],
            )}
          >
            {THEME_LABELS[ref_.theme]}
          </span>
          {reportAction && (
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">
              {reportAction}
            </span>
          )}
        </div>
      </div>

      {ref_.verses && ref_.verses.length > 0 ? (
        <div className="bible-text text-sm text-[var(--text-secondary)] dark:text-stone-300 leading-relaxed space-y-0.5">
          {ref_.verses.map((v) => (
            <div key={`${v.chapter}-${v.num}`}>
              <span className="select-none inline-block w-5 text-right mr-1.5 text-xs font-sans font-semibold text-[var(--muted-foreground)] dark:text-stone-500 shrink-0 align-top mt-[2px]">
                {v.num}
              </span>
              <span>{v.text}</span>
            </div>
          ))}
        </div>
      ) : text ? (
        <p className="bible-text text-sm text-[var(--text-secondary)] dark:text-stone-300 leading-relaxed">
          {text}
        </p>
      ) : null}

      {ref_.note && (
        <p className="mt-1.5 text-xs font-sans text-[var(--muted-foreground)] dark:text-stone-400 italic">
          {ref_.note}
        </p>
      )}
    </div>
  );
}

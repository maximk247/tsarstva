import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import type { PrecomputedParallel, CrossRefTheme } from "@tsarstva/data";
import { ReportButton } from "@/features/report-issue";

const NAVIGABLE_BOOKS = new Set(["1sm", "2sm", "1kgs", "2kgs"]);

const THEME_LABELS: Record<CrossRefTheme, string> = {
  same_event: "тот же нарратив",
  prophecy: "пророчество",
  theological: "богословская",
  genealogy: "родословная",
  tsk: "параллель",
};

const THEME_COLORS: Record<CrossRefTheme, string> = {
  same_event:  "bg-[#78350F] text-[#FAF9F7]  dark:bg-amber-900/50 dark:text-amber-200",
  prophecy:    "bg-[#92400E] text-[#FAF9F7]  dark:bg-amber-800/50 dark:text-amber-300",
  theological: "bg-[#44403C] text-[#FAF9F7]  dark:bg-stone-600/50 dark:text-stone-200",
  genealogy:   "bg-[#FEF3CC] text-[#78350F]  dark:bg-amber-900/30 dark:text-amber-300",
  tsk:         "bg-[#F5F2F1] text-stone-600  dark:bg-stone-800    dark:text-stone-400",
};

interface Props {
  ref_: PrecomputedParallel;
  sourceRef?: string;
}

export default function ParallelCard({ ref_, sourceRef }: Props) {
  const { text, label } = ref_;
  const isNavigable = NAVIGABLE_BOOKS.has(ref_.book);
  const href = `/read/${ref_.book}/${ref_.chapter}#v${ref_.verse}`;

  return (
    <div className="group rounded-lg border border-[#E1DDD8] dark:border-stone-700 bg-white dark:bg-stone-900 p-3.5 shadow-sm hover:shadow-md hover:border-[#A8A29E] dark:hover:border-stone-600 transition-all">
      <div className="flex items-start justify-between gap-2 mb-2">
        {isNavigable ? (
          <Link
            href={href}
            className="font-sans font-semibold text-sm text-stone-900 dark:text-stone-200 hover:text-[#92400E] dark:hover:text-amber-400 transition-colors"
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
              THEME_COLORS[ref_.theme]
            )}
          >
            {THEME_LABELS[ref_.theme]}
          </span>
          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
            <ReportButton
              type="parallel"
              reference={sourceRef ?? "?"}
              parallelRef={label}
              parallelText={text}
            />
          </span>
        </div>
      </div>

      {text && (
        <p className="bible-text text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
          {text}
        </p>
      )}

      {ref_.note && (
        <p className="mt-1.5 text-xs font-sans text-stone-400 dark:text-stone-400 italic">
          {ref_.note}
        </p>
      )}
    </div>
  );
}

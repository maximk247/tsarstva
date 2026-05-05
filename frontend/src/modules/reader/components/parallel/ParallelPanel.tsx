import { memo } from "react";
import dynamic from "next/dynamic";
import { ParallelCard } from "@/entities/cross-ref";
import type { PrecomputedParallel } from "@tsarstva/data";

const ReportButton = dynamic(
  () => import("@/features/report-issue/ReportButton"),
  { ssr: false },
);

interface Props {
  refs: PrecomputedParallel[];
  activeVerse: number | null;
  bookName: string;
  chapter: number;
}

export default memo(function ParallelPanel({
  refs,
  activeVerse,
  bookName,
  chapter,
}: Props) {
  if (activeVerse === null) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <div className="text-3xl mb-3 opacity-30">⬡</div>
        <p className="font-sans text-sm text-stone-400 dark:text-stone-400">
          Нажмите на любой стих, чтобы увидеть параллельные места
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 pb-3 border-b border-[#E1DDD8] dark:border-stone-700">
        <p className="font-sans text-xs text-stone-400 dark:text-stone-400 uppercase tracking-wider mb-0.5">
          Параллельные места
        </p>
        <div className="flex items-center justify-between gap-2">
          <p className="font-sans font-medium text-stone-600 dark:text-stone-200 text-sm">
            {bookName} {chapter}:{activeVerse}
          </p>
          <ReportButton
            type="verse"
            reference={`${bookName} ${chapter}:${activeVerse}`}
          />
        </div>
      </div>

      {refs.length === 0 ? (
        <p className="font-sans text-sm text-stone-400 dark:text-stone-400 text-center py-8">
          Параллельных мест для этого стиха не найдено
        </p>
      ) : (
        <div className="space-y-3">
          {refs.map((ref) => (
            <ParallelCard
              key={`${ref.book}:${ref.chapter}:${ref.verse}`}
              ref_={ref}
              reportAction={
                <ReportButton
                  type="parallel"
                  reference={`${bookName} ${chapter}:${activeVerse}`}
                  parallelRef={ref.label}
                  parallelText={ref.text}
                />
              }
            />
          ))}
        </div>
      )}
    </div>
  );
});

import { memo, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { ParallelCard } from "@/entities/cross-ref";
import { cn } from "@/shared/utils/cn";
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
  isReferenceTransitionVisible: boolean;
  isContentTransitionVisible: boolean;
  transitionDurationMs: number;
}

interface WindTransitionProps {
  isVisible: boolean;
  durationMs: number;
  className?: string;
  children: ReactNode;
}

function WindTransition({
  isVisible,
  durationMs,
  className,
  children,
}: WindTransitionProps) {
  return (
    <div
      className={cn(
        "reader-wind-transition",
        !isVisible && "pointer-events-none",
        className,
      )}
      data-visible={isVisible ? "true" : "false"}
      style={{ transitionDuration: `${durationMs}ms` }}
    >
      {children}
    </div>
  );
}

export default memo(function ParallelPanel({
  refs,
  activeVerse,
  bookName,
  chapter,
  isReferenceTransitionVisible,
  isContentTransitionVisible,
  transitionDurationMs,
}: Props) {
  if (activeVerse === null) {
    return (
      <WindTransition
        isVisible={isContentTransitionVisible}
        durationMs={transitionDurationMs}
        className="flex h-64 flex-col items-center justify-center px-4 text-center"
      >
        <div className="text-3xl mb-3 opacity-30">⬡</div>
        <p className="font-sans text-sm text-stone-400 dark:text-stone-400">
          Нажмите на любой стих, чтобы увидеть параллельные места
        </p>
      </WindTransition>
    );
  }

  return (
    <div>
      <div className="mb-4 pb-3 border-b border-[#E1DDD8] dark:border-stone-700">
        <p className="font-sans text-xs text-stone-400 dark:text-stone-400 uppercase tracking-wider mb-0.5">
          Параллельные места
        </p>
        <div className="flex items-center justify-between gap-2">
          <WindTransition
            isVisible={isReferenceTransitionVisible}
            durationMs={transitionDurationMs}
            className="min-w-0 flex-1"
          >
            <p className="font-sans font-medium text-stone-600 dark:text-stone-200 text-sm">
              {bookName} {chapter}:{activeVerse}
            </p>
          </WindTransition>
          <ReportButton
            type="verse"
            reference={`${bookName} ${chapter}:${activeVerse}`}
          />
        </div>
      </div>

      <WindTransition
        isVisible={isContentTransitionVisible}
        durationMs={transitionDurationMs}
      >
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
      </WindTransition>
    </div>
  );
});

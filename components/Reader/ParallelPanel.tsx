import ParallelCard from "./ParallelCard";
import type { CrossRef } from "@/types/bible";

interface Props {
  refs: CrossRef[];
  activeVerse: number | null;
  bookName: string;
  chapter: number;
}

export default function ParallelPanel({ refs, activeVerse, bookName, chapter }: Props) {
  if (activeVerse === null) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center px-4">
        <div className="text-3xl mb-3 opacity-30">⬡</div>
        <p className="font-sans text-sm text-stone-400 dark:text-stone-500">
          Нажмите на любой стих, чтобы увидеть параллельные места
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 pb-3 border-b border-stone-200 dark:border-stone-700">
        <p className="font-sans text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-0.5">
          Параллельные места
        </p>
        <p className="font-sans font-medium text-stone-700 dark:text-stone-300 text-sm">
          {bookName} {chapter}:{activeVerse}
        </p>
      </div>

      {refs.length === 0 ? (
        <p className="font-sans text-sm text-stone-400 dark:text-stone-500 text-center py-8">
          Параллельных мест для этого стиха не найдено
        </p>
      ) : (
        <div className="space-y-3">
          {refs.map((ref, i) => (
            <ParallelCard key={i} ref_={ref} />
          ))}
        </div>
      )}
    </div>
  );
}

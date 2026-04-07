"use client";

import { cn } from "@/lib/utils";

interface Props {
  verseNum: number;
  text: string;
  hasParallels: boolean;
  isActive: boolean;
  onClick: (verse: number) => void;
}

export default function VerseItem({ verseNum, text, hasParallels, isActive, onClick }: Props) {
  return (
    <p
      id={`v${verseNum}`}
      onClick={() => onClick(verseNum)}
      className={cn(
        "bible-text relative cursor-pointer rounded px-2 py-0.5 -mx-2 transition-colors duration-150 group",
        isActive
          ? "bg-amber-100 dark:bg-amber-950"
          : "hover:bg-stone-100 dark:hover:bg-stone-800"
      )}
    >
      <span className="select-none text-xs font-sans font-semibold text-stone-400 dark:text-stone-500 mr-1.5 align-top mt-1 inline-block w-5 text-right shrink-0">
        {verseNum}
      </span>
      <span>{text}</span>
      {hasParallels && (
        <span
          className={cn(
            "inline-block ml-1.5 w-1.5 h-1.5 rounded-full align-middle mb-0.5 transition-colors",
            isActive
              ? "bg-amber-500"
              : "bg-stone-300 group-hover:bg-amber-400 dark:bg-stone-600"
          )}
          title="Есть параллельные места"
        />
      )}
    </p>
  );
}

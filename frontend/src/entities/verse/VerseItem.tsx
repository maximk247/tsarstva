"use client";

import { memo } from "react";
import { cn } from "@/shared/utils/cn";

interface Props {
  verseNum: number;
  text: string;
  hasParallels: boolean;
  isActive: boolean;
  isSelected: boolean;
  onClick: (verse: number) => void;
  onCheckStart: (verse: number) => void;
}

export default memo(function VerseItem({
  verseNum,
  text,
  hasParallels,
  isActive,
  isSelected,
  onClick,
  onCheckStart,
}: Props) {
  return (
    <div
      id={`v${verseNum}`}
      onClick={() => onClick(verseNum)}
      className={cn(
        "bible-text relative cursor-pointer rounded-2xl px-5 py-0.5 pr-14 text-[var(--reader-text)] group",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 rounded-2xl",
          isActive
            ? "bg-[var(--active-verse)] dark:bg-amber-800/30"
            : isSelected
              ? "bg-[var(--selected-verse)] dark:bg-amber-900/20"
              : "group-hover:bg-[var(--hover)] dark:group-hover:bg-stone-700/40",
        )}
      />
      <span className="relative z-10 select-none text-xs font-sans font-semibold text-[var(--muted-foreground)] dark:text-stone-500 mr-1.5 align-top mt-1 inline-block w-5 text-right shrink-0">
        {verseNum}
      </span>
      <span className="relative z-10">{text}</span>
      {hasParallels && (
        <span
          className={cn(
            "relative z-10 inline-block ml-1.5 w-1.5 h-1.5 rounded-full align-middle mb-0.5",
            isActive
              ? "bg-[var(--accent-subtle)]"
              : "bg-[var(--accent-subtle)] dark:bg-amber-500",
          )}
          title="Есть параллельные места"
        />
      )}

      {/* Большая область нажатия, кастомный чекбокс */}
      <span
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onCheckStart(verseNum);
        }}
        onClick={(e) => e.stopPropagation()}
        className="absolute right-3 top-0 bottom-0 z-10 w-8 flex items-center justify-center cursor-pointer"
      >
        <span
          className={cn(
            "w-4 h-4 rounded border flex items-center justify-center shrink-0",
            isSelected
              ? "bg-amber-500 border-amber-500"
              : "border-[var(--border)] dark:border-stone-600",
          )}
        >
          {isSelected && (
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path
                d="M1.5 5l2.5 2.5 4-4.5"
                stroke="white"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
      </span>
    </div>
  );
});

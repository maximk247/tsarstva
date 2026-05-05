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
        "bible-text relative cursor-pointer rounded px-2 py-0.5 -mx-2 transition-colors duration-150 group pr-8",
        isActive
          ? "bg-[#FEF3CC] dark:bg-amber-800/30"
          : isSelected
            ? "bg-amber-50 dark:bg-amber-900/20"
            : "hover:bg-[#F5F2F1] dark:hover:bg-stone-700/40",
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
            isActive ? "bg-[#DA8107]" : "bg-[#DA8107] dark:bg-amber-500",
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
        className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-pointer"
      >
        <span
          className={cn(
            "w-4 h-4 rounded border flex items-center justify-center transition-all duration-150 shrink-0",
            isSelected
              ? "bg-amber-500 border-amber-500"
              : "border-stone-300 dark:border-stone-600 opacity-30 group-hover:opacity-70",
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

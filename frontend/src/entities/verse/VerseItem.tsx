"use client";

import { memo } from "react";
import { cn } from "@/shared/lib/cn";

interface Props {
  verseNum: number;
  text: string;
  hasParallels: boolean;
  isActive: boolean;
  onClick: (verse: number) => void;
}

export default memo(function VerseItem({
  verseNum,
  text,
  hasParallels,
  isActive,
  onClick,
}: Props) {
  return (
    <p
      id={`v${verseNum}`}
      onClick={() => onClick(verseNum)}
      className={cn(
        "bible-text relative cursor-pointer rounded px-2 py-0.5 -mx-2 transition-colors duration-150 group",
        isActive
          ? "bg-[#FEF3CC] dark:bg-amber-800/30"
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
    </p>
  );
});

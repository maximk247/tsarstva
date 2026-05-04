"use client";

import { memo } from "react";
import { VerseItem } from "@/entities/verse";
import type { Chapter } from "@tsarstva/data";

interface Props {
  verses: Chapter;
  versesWithParallels: Set<number>;
  activeVerse: number | null;
  selectedVerses: Set<number>;
  onVerseClick: (verse: number) => void;
  onCheckStart: (verse: number) => void;
}

export default memo(function MainText({
  verses,
  versesWithParallels,
  activeVerse,
  selectedVerses,
  onVerseClick,
  onCheckStart,
}: Props) {
  return (
    <div className="space-y-0.5">
      {Object.entries(verses).map(([num, text]) => {
        const verseNum = Number(num);
        return (
          <VerseItem
            key={verseNum}
            verseNum={verseNum}
            text={text}
            hasParallels={versesWithParallels.has(verseNum)}
            isActive={activeVerse === verseNum}
            isSelected={selectedVerses.has(verseNum)}
            onClick={onVerseClick}
            onCheckStart={onCheckStart}
          />
        );
      })}
    </div>
  );
});

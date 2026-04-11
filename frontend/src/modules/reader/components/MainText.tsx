"use client";

import { VerseItem } from "@/entities/verse";

interface Props {
  verses: string[];
  versesWithParallels: Set<number>;
  activeVerse: number | null;
  selectedVerses: Set<number>;
  onVerseClick: (verse: number) => void;
  onCheckStart: (verse: number) => void;
}

export default function MainText({ verses, versesWithParallels, activeVerse, selectedVerses, onVerseClick, onCheckStart }: Props) {
  return (
    <div className="space-y-0.5">
      {verses.map((text, idx) => {
        const verseNum = idx + 1;
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
}

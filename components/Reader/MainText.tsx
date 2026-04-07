"use client";

import VerseItem from "./VerseItem";

interface Props {
  verses: string[];
  versesWithParallels: Set<number>;
  activeVerse: number | null;
  onVerseClick: (verse: number) => void;
}

export default function MainText({ verses, versesWithParallels, activeVerse, onVerseClick }: Props) {
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
            onClick={onVerseClick}
          />
        );
      })}
    </div>
  );
}

"use client";

import { memo, useMemo } from "react";
import { VerseItem } from "@/entities/verse";
import type { Chapter, PrecomputedParallel } from "@tsarstva/data";

type ParallelRangePosition = "single" | "start" | "middle" | "end";

interface ActiveParallelRange {
  start: number;
  end: number;
}

function getSourceStartVerse(ref: PrecomputedParallel, currentVerse: number) {
  return ref.sourceVerse ?? currentVerse;
}

function getSourceEndVerse(ref: PrecomputedParallel, currentVerse: number) {
  const startVerse = getSourceStartVerse(ref, currentVerse);
  const startChapter = ref.sourceChapter ?? ref.chapter;
  const endChapter = ref.sourceChapterEnd ?? startChapter;

  if (endChapter !== startChapter) return startVerse;
  return ref.sourceVerseEnd ?? startVerse;
}

function hasParallelMarker(verseNum: number, parallels: PrecomputedParallel[]) {
  return parallels.some(
    (ref) => getSourceStartVerse(ref, verseNum) === verseNum,
  );
}

function getActiveParallelRange(
  activeVerse: number | null,
  activeParallels: PrecomputedParallel[],
): ActiveParallelRange | null {
  if (activeVerse === null || activeParallels.length === 0) return null;

  const activeRef =
    activeParallels.find(
      (ref) => getSourceStartVerse(ref, activeVerse) === activeVerse,
    ) ??
    activeParallels.find((ref) => {
      const start = getSourceStartVerse(ref, activeVerse);
      const end = getSourceEndVerse(ref, activeVerse);
      return start <= activeVerse && activeVerse <= end;
    }) ??
    activeParallels[0];

  return {
    start: getSourceStartVerse(activeRef, activeVerse),
    end: getSourceEndVerse(activeRef, activeVerse),
  };
}

function getParallelRangePosition(
  verseNum: number,
  range: ActiveParallelRange | null,
): ParallelRangePosition | null {
  if (!range || verseNum < range.start || verseNum > range.end) return null;

  if (range.start === range.end) return "single";
  if (verseNum === range.start) return "start";
  if (verseNum === range.end) return "end";
  return "middle";
}

interface Props {
  verses: Chapter;
  parallelsMap: Record<number, PrecomputedParallel[]>;
  activeVerse: number | null;
  selectedVerses: Set<number>;
  onVerseClick: (verse: number) => void;
  onCheckStart: (verse: number) => void;
}

export default memo(function MainText({
  verses,
  parallelsMap,
  activeVerse,
  selectedVerses,
  onVerseClick,
  onCheckStart,
}: Props) {
  const activeRange = useMemo(
    () =>
      getActiveParallelRange(
        activeVerse,
        activeVerse === null ? [] : (parallelsMap[activeVerse] ?? []),
      ),
    [activeVerse, parallelsMap],
  );

  return (
    <div className="space-y-0.5">
      {Object.entries(verses).map(([num, text]) => {
        const verseNum = Number(num);
        const parallels = parallelsMap[verseNum] ?? [];
        return (
          <VerseItem
            key={verseNum}
            verseNum={verseNum}
            text={text}
            hasParallels={hasParallelMarker(verseNum, parallels)}
            parallelRangePosition={getParallelRangePosition(
              verseNum,
              activeRange,
            )}
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

"use client";

import { memo, useMemo } from "react";
import { VerseItem } from "@/entities/verse";
import type { Chapter, PrecomputedParallel } from "@tsarstva/data";

type ParallelRangePosition = "single" | "start" | "middle" | "end";

interface ActiveParallelRange {
  start: number;
  end: number;
  continuesBefore: boolean;
  continuesAfter: boolean;
}

function getSourceStartChapter(ref: PrecomputedParallel, currentChapter: number) {
  return ref.sourceChapter ?? currentChapter;
}

function getSourceEndChapter(ref: PrecomputedParallel, currentChapter: number) {
  return ref.sourceChapterEnd ?? getSourceStartChapter(ref, currentChapter);
}

function getLocalSourceRange(
  ref: PrecomputedParallel,
  currentVerse: number,
  currentChapter: number,
  chapterFirstVerse: number,
  chapterLastVerse: number,
): ActiveParallelRange | null {
  const startChapter = getSourceStartChapter(ref, currentChapter);
  const endChapter = getSourceEndChapter(ref, currentChapter);

  if (currentChapter < startChapter || currentChapter > endChapter) {
    return null;
  }

  const continuesBefore = currentChapter > startChapter;
  const continuesAfter = currentChapter < endChapter;
  const start = continuesBefore
    ? chapterFirstVerse
    : (ref.sourceVerse ?? currentVerse);
  const end = continuesAfter
    ? chapterLastVerse
    : (ref.sourceVerseEnd ?? start);

  return { start, end, continuesBefore, continuesAfter };
}

function hasParallelMarker(
  verseNum: number,
  chapter: number,
  chapterFirstVerse: number,
  chapterLastVerse: number,
  parallels: PrecomputedParallel[],
) {
  return parallels.some((ref) => {
    const range = getLocalSourceRange(
      ref,
      verseNum,
      chapter,
      chapterFirstVerse,
      chapterLastVerse,
    );
    return range?.start === verseNum;
  });
}

function getRangeLength(range: ActiveParallelRange) {
  return range.end - range.start;
}

function isVerseInRange(verseNum: number, range: ActiveParallelRange) {
  return verseNum >= range.start && verseNum <= range.end;
}

function pickLongerRange(
  bestRange: ActiveParallelRange | null,
  nextRange: ActiveParallelRange,
) {
  return !bestRange || getRangeLength(nextRange) > getRangeLength(bestRange)
    ? nextRange
    : bestRange;
}

function getBestActiveRange(
  activeVerse: number,
  currentChapter: number,
  activeParallels: PrecomputedParallel[],
  chapterFirstVerse: number,
  chapterLastVerse: number,
) {
  return activeParallels.reduce<ActiveParallelRange | null>(
    (bestRange, ref) => {
      const range = getLocalSourceRange(
        ref,
        activeVerse,
        currentChapter,
        chapterFirstVerse,
        chapterLastVerse,
      );
      if (!range || !isVerseInRange(activeVerse, range)) return bestRange;
      return pickLongerRange(bestRange, range);
    },
    null,
  );
}

function getActiveParallelRange(
  activeVerse: number | null,
  currentChapter: number,
  activeParallels: PrecomputedParallel[],
  chapterFirstVerse: number,
  chapterLastVerse: number,
): ActiveParallelRange | null {
  if (activeVerse === null || activeParallels.length === 0) return null;

  // Keep the source-range highlight intact even when the panel shows direct refs.
  return getBestActiveRange(
    activeVerse,
    currentChapter,
    activeParallels,
    chapterFirstVerse,
    chapterLastVerse,
  );
}

function getParallelRangePosition(
  verseNum: number,
  range: ActiveParallelRange | null,
): ParallelRangePosition | null {
  if (!range || verseNum < range.start || verseNum > range.end) return null;

  if (range.start === range.end) {
    if (range.continuesBefore && range.continuesAfter) return "middle";
    if (range.continuesBefore) return "end";
    if (range.continuesAfter) return "start";
    return "single";
  }

  if (verseNum === range.start && range.continuesBefore) return "middle";
  if (verseNum === range.start) return "start";
  if (verseNum === range.end && range.continuesAfter) return "middle";
  if (verseNum === range.end) return "end";
  return "middle";
}

interface Props {
  chapter: number;
  verses: Chapter;
  parallelsMap: Record<number, PrecomputedParallel[]>;
  activeVerse: number | null;
  selectedVerses: Set<number>;
  onVerseClick: (verse: number) => void;
  onCheckStart: (verse: number) => void;
}

export default memo(function MainText({
  chapter,
  verses,
  parallelsMap,
  activeVerse,
  selectedVerses,
  onVerseClick,
  onCheckStart,
}: Props) {
  const chapterFirstVerse = useMemo(
    () => Math.min(...Object.keys(verses).map(Number)),
    [verses],
  );
  const chapterLastVerse = useMemo(
    () => Math.max(...Object.keys(verses).map(Number)),
    [verses],
  );
  const activeRange = useMemo(
    () =>
      getActiveParallelRange(
        activeVerse,
        chapter,
        activeVerse === null ? [] : (parallelsMap[activeVerse] ?? []),
        chapterFirstVerse,
        chapterLastVerse,
      ),
    [activeVerse, chapter, chapterFirstVerse, chapterLastVerse, parallelsMap],
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
            hasParallels={hasParallelMarker(
              verseNum,
              chapter,
              chapterFirstVerse,
              chapterLastVerse,
              parallels,
            )}
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

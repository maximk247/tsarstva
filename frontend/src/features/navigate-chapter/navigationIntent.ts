export interface ChapterNavigationIntent {
  book: string;
  chapter: number;
}

export const CHAPTER_NAVIGATION_INTENT_EVENT =
  "tsarstva:chapter-navigation-intent";
export const CHAPTER_NAVIGATION_COMMIT_DELAY_MS = 300;

export function announceChapterNavigationIntent(
  target: ChapterNavigationIntent,
) {
  window.dispatchEvent(
    new CustomEvent<ChapterNavigationIntent>(CHAPTER_NAVIGATION_INTENT_EVENT, {
      detail: target,
    }),
  );
}

import { CHAPTER_NAVIGATION_INTENT_EVENT } from "../constants/navigation";

export interface ChapterNavigationIntent {
  book: string;
  chapter: number;
}

export function announceChapterNavigationIntent(
  target: ChapterNavigationIntent,
) {
  window.dispatchEvent(
    new CustomEvent<ChapterNavigationIntent>(CHAPTER_NAVIGATION_INTENT_EVENT, {
      detail: target,
    }),
  );
}

export { CHAPTER_NAVIGATION_INTENT_EVENT };

export type {
  BookMeta,
  BibleData,
  CrossRefTheme,
  CrossRef,
  PrecomputedParallel,
  TskEntry,
  ManualEntry,
  VerseRef,
  KingsBook,
  Chapter,
} from "./types";

export { KINGS_BOOKS, KINGS_NAMES } from "./types";

export {
  bible,
  getBook,
  getChapterCount,
  formatRef,
  getBookName,
} from "./bible-meta";

export {
  getParallelsForVerse,
  getChaptersWithParallels,
  getChapterParallels,
} from "./crossRefs";

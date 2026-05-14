export interface BookMeta {
  abbrev: string;
  nameRu: string;
  nameShort: string;
  testament: "OT" | "NT";
  chapterCount: number;
}

export interface BibleData {
  [abbrev: string]: BookMeta;
}

export type CrossRefTheme =
  | "same_event" // тот же нарратив в другой книге
  | "fulfillment" // исполнение пророчества
  | "prophecy" // пророчество / исполнение
  | "theological" // богословская параллель
  | "genealogy" // родословная параллель
  | "tsk"; // из TSK (OpenBible, без метки)

export interface CrossRef {
  book: string;
  chapter: number;
  verse: number;
  verseEnd?: number;
  chapterEnd?: number;
  sourceBook?: string;
  sourceChapter?: number;
  sourceVerse?: number;
  sourceVerseEnd?: number;
  sourceChapterEnd?: number;
  theme: CrossRefTheme;
  note?: string;
  votes?: number;
}

export interface TskEntry {
  book: string;
  chapter: number;
  verse: number;
  verseEnd?: number;
  votes: number;
}

export interface ManualEntry {
  from: string; // "1kgs:1:1"
  fromEnd?: number | string; // number = стих в той же главе; "ch:v" = межглавный конец диапазона
  to: string;
  toEnd?: number | string; // number = стих в той же главе; "ch:v" = межглавный конец диапазона
  theme: CrossRefTheme;
  note?: string;
}

export interface VerseRef {
  book: string;
  chapter: number;
  verse: number;
}

export interface ParallelVerse {
  num: number;
  chapter: number;
  text: string;
}

export interface PrecomputedParallel extends CrossRef {
  text: string;
  label: string;
  verses: ParallelVerse[];
}

export type Chapter = Record<number, string>;

export const KINGS_BOOKS = ["1sm", "2sm", "1kgs", "2kgs"] as const;
export type KingsBook = (typeof KINGS_BOOKS)[number];

export const KINGS_NAMES: Record<KingsBook, string> = {
  "1sm": "1 Царств",
  "2sm": "2 Царств",
  "1kgs": "3 Царств",
  "2kgs": "4 Царств",
};

export const PARALIPOMENON_BOOKS = ["1ch", "2ch"] as const;
export type ParalipomenonBook = (typeof PARALIPOMENON_BOOKS)[number];

export const OTHER_OT_BOOKS = ["ne", "is", "jr"] as const;
export type OtherOtBook = (typeof OTHER_OT_BOOKS)[number];

export const READER_BOOKS = [
  ...KINGS_BOOKS,
  ...PARALIPOMENON_BOOKS,
  ...OTHER_OT_BOOKS,
] as const;
export type ReaderBook = (typeof READER_BOOKS)[number];

export const READER_BOOK_NAMES: Record<ReaderBook, string> = {
  ...KINGS_NAMES,
  "1ch": "1 Паралипоменон",
  "2ch": "2 Паралипоменон",
  ne: "Неемия",
  is: "Исаия",
  jr: "Иеремия",
};

export const READER_BOOK_SECTIONS: ReadonlyArray<{
  title: string;
  books: readonly ReaderBook[];
}> = [
  { title: "Книги Царств", books: KINGS_BOOKS },
  { title: "Паралипоменон", books: PARALIPOMENON_BOOKS },
  { title: "Другие Ветхого Завета", books: OTHER_OT_BOOKS },
];

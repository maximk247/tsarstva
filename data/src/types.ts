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
  | "same_event"       // тот же нарратив в другой книге
  | "prophecy"         // пророчество / исполнение
  | "theological"      // богословская параллель
  | "genealogy"        // родословная параллель
  | "tsk";             // из TSK (OpenBible, без метки)

export interface CrossRef {
  book: string;
  chapter: number;
  verse: number;
  verseEnd?: number;
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
  from: string;         // "1kgs:1:1"
  to: string;
  toEnd?: number;
  theme: CrossRefTheme;
  note?: string;
}

export interface VerseRef {
  book: string;
  chapter: number;
  verse: number;
}

export interface PrecomputedParallel extends CrossRef {
  text: string;
  label: string;
}

export const KINGS_BOOKS = ["1sm", "2sm", "1kgs", "2kgs"] as const;
export type KingsBook = (typeof KINGS_BOOKS)[number];

export const KINGS_NAMES: Record<KingsBook, string> = {
  "1sm": "1 Царств",
  "2sm": "2 Царств",
  "1kgs": "3 Царств",
  "2kgs": "4 Царств",
};

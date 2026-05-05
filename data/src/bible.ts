/// <reference types="node" />
import { readFileSync } from "fs";
import { join } from "path";
import { bible } from "./bible-meta";
import type { Chapter } from "./types";

const BOOKS_DIR = join(process.cwd(), "..", "data", "json", "bible", "books");

function psalmLxxToHebrew(lxx: number): number {
  if (lxx <= 8) return lxx;
  if (lxx === 9) return 9;
  if (lxx <= 112) return lxx + 1;
  if (lxx === 113) return 114;
  if (lxx <= 115) return 116;
  if (lxx <= 145) return lxx + 1;
  if (lxx <= 147) return 147;
  return lxx;
}

export function getChapter(abbrev: string, chapter: number): Chapter | null {
  if (!bible[abbrev]) return null;
  const idx = abbrev === "ps" ? psalmLxxToHebrew(chapter) : chapter;
  try {
    const raw = readFileSync(join(BOOKS_DIR, abbrev, `${idx}.json`), "utf8");
    const verses: Chapter = JSON.parse(raw);
    for (const k in verses) {
      verses[k as unknown as number] = verses[k as unknown as number].replace(
        /^\(\d+:\d+\)\s*/,
        "",
      );
    }
    return verses;
  } catch {
    return null;
  }
}

export function getVerseText(
  abbrev: string,
  chapter: number,
  verse: number,
): string | null {
  const verses = getChapter(abbrev, chapter);
  return verses?.[verse] ?? null;
}

export function getVerseItems(
  abbrev: string,
  chapter: number,
  from: number,
  to?: number,
  chapterEnd?: number,
): Array<{ num: number; chapter: number; text: string }> {
  const items: Array<{ num: number; chapter: number; text: string }> = [];
  const endChapter = chapterEnd ?? chapter;

  for (let ch = chapter; ch <= endChapter; ch++) {
    const verses = getChapter(abbrev, ch);
    if (!verses) continue;
    const verseKeys = Object.keys(verses)
      .map(Number)
      .sort((a, b) => a - b);
    const firstVerse = ch === chapter ? from : (verseKeys[0] ?? 1);
    const lastVerse =
      ch === endChapter
        ? (to ??
          (ch === chapter ? from : (verseKeys[verseKeys.length - 1] ?? 0)))
        : (verseKeys[verseKeys.length - 1] ?? 0);
    for (let v = firstVerse; v <= lastVerse; v++) {
      const text = verses[v];
      if (text) items.push({ num: v, chapter: ch, text });
    }
  }
  return items;
}

export function getVerseRange(
  abbrev: string,
  chapter: number,
  from: number,
  to?: number,
  chapterEnd?: number,
): string {
  return getVerseItems(abbrev, chapter, from, to, chapterEnd)
    .map((i) => i.text)
    .join(" ");
}

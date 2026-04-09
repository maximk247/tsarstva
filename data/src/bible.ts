/// <reference types="node" />
import { readFileSync } from "fs";
import { join } from "path";
import { bible } from "./bible-meta";

const BOOKS_DIR = join(__dirname, "../json/bible/books");

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

export function getChapter(abbrev: string, chapter: number): string[] | null {
  if (!bible[abbrev]) return null;
  const idx = abbrev === "ps" ? psalmLxxToHebrew(chapter) : chapter;
  try {
    const raw = readFileSync(join(BOOKS_DIR, abbrev, `${idx}.json`), "utf8");
    const verses: string[] = JSON.parse(raw);
    return verses.map(v => v.replace(/^\(\d+:\d+\)\s*/, ""));
  } catch {
    return null;
  }
}

export function getVerseText(abbrev: string, chapter: number, verse: number): string | null {
  const verses = getChapter(abbrev, chapter);
  if (!verses) return null;
  return verses[verse - 1] ?? null;
}

export function getVerseRange(
  abbrev: string,
  chapter: number,
  from: number,
  to?: number
): string {
  const verses = getChapter(abbrev, chapter);
  if (!verses) return "";
  const end = to ?? from;
  return verses.slice(from - 1, end).join(" ");
}

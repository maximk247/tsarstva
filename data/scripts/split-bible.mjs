/**
 * Converts synodal_raw.json into split files:
 *   data/json/bible/index.json               — book metadata (no chapter text)
 *   data/json/bible/books/{abbrev}/{n}.json  — one file per chapter
 *
 * Run: node data/scripts/split-bible.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

// Только книги, которые реально используются:
// - читаемые: 1sm 2sm 1kgs 2kgs
// - цели параллельных мест (manual.json): 1ch 2ch is jr lk ne
const BOOKS = {
  "1sm": { nameRu: "1 Царств", nameShort: "1 Цар", testament: "OT" },
  "2sm": { nameRu: "2 Царств", nameShort: "2 Цар", testament: "OT" },
  "1kgs": { nameRu: "3 Царств", nameShort: "3 Цар", testament: "OT" },
  "2kgs": { nameRu: "4 Царств", nameShort: "4 Цар", testament: "OT" },
  "1ch": { nameRu: "1 Паралипоменон", nameShort: "1 Пар", testament: "OT" },
  "2ch": { nameRu: "2 Паралипоменон", nameShort: "2 Пар", testament: "OT" },
  is: { nameRu: "Исаия", nameShort: "Ис", testament: "OT" },
  jr: { nameRu: "Иеремия", nameShort: "Иер", testament: "OT" },
  ne: { nameRu: "Неемия", nameShort: "Неем", testament: "OT" },
  lk: { nameRu: "Луки", nameShort: "Луки", testament: "NT" },
};

let raw = readFileSync("data/json/bible/synodal_raw.json", "utf8");
if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
const rawData = JSON.parse(raw);

const booksDir = "data/json/bible/books";
const index = {};

for (const { abbrev, chapters } of rawData) {
  const book = BOOKS[abbrev];
  if (!book) continue;

  index[abbrev] = {
    abbrev,
    ...book,
    chapterCount: chapters.length,
  };

  const bookDir = join(booksDir, abbrev);
  mkdirSync(bookDir, { recursive: true });

  // Примечание: если добавляется ps (Псалтирь), synodal_raw.json хранит её
  // по еврейской нумерации. Нужно будет переименовать главы в православную (LXX).
  chapters.forEach((verses, i) => {
    writeFileSync(
      join(bookDir, `${i + 1}.json`),
      JSON.stringify(verses),
      "utf8",
    );
  });
}

writeFileSync(
  "data/json/bible/index.json",
  JSON.stringify(index, null, 0),
  "utf8",
);

const totalChapters = Object.values(index).reduce(
  (s, b) => s + b.chapterCount,
  0,
);
console.log(`index.json: ${Object.keys(index).length} книг`);
console.log(`books/: ${totalChapters} файлов глав`);

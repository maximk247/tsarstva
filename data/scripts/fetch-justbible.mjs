/**
 * Syncs local chapter JSON from JustBible API.
 *
 * Default:
 *   bun run --filter @tsarstva/data sync:justbible
 *
 * Limited dry run:
 *   bun run --filter @tsarstva/data sync:justbible -- --books=1ch,2ch --dry-run
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const API_URL = "https://justbible.ru/api/bible";
const TRANSLATION = "rst";

const BOOKS = {
  ex: {
    justBibleBook: 2,
    nameRu: "Исход",
    nameShort: "Исх",
    testament: "OT",
  },
  dt: {
    justBibleBook: 5,
    nameRu: "Второзаконие",
    nameShort: "Втор",
    testament: "OT",
  },
  "1sm": {
    justBibleBook: 9,
    nameRu: "1 Царств",
    nameShort: "1 Цар",
    testament: "OT",
  },
  "2sm": {
    justBibleBook: 10,
    nameRu: "2 Царств",
    nameShort: "2 Цар",
    testament: "OT",
  },
  "1kgs": {
    justBibleBook: 11,
    nameRu: "3 Царств",
    nameShort: "3 Цар",
    testament: "OT",
  },
  "2kgs": {
    justBibleBook: 12,
    nameRu: "4 Царств",
    nameShort: "4 Цар",
    testament: "OT",
  },
  "1ch": {
    justBibleBook: 13,
    nameRu: "1 Паралипоменон",
    nameShort: "1 Пар",
    testament: "OT",
  },
  "2ch": {
    justBibleBook: 14,
    nameRu: "2 Паралипоменон",
    nameShort: "2 Пар",
    testament: "OT",
  },
  ne: {
    justBibleBook: 16,
    nameRu: "Неемия",
    nameShort: "Неем",
    testament: "OT",
  },
  is: {
    justBibleBook: 23,
    nameRu: "Исаия",
    nameShort: "Ис",
    testament: "OT",
  },
  jr: {
    justBibleBook: 24,
    nameRu: "Иеремия",
    nameShort: "Иер",
    testament: "OT",
  },
  lk: {
    justBibleBook: 42,
    nameRu: "Луки",
    nameShort: "Луки",
    testament: "NT",
  },
};

const scriptDir = dirname(fileURLToPath(import.meta.url));
const bibleDir = join(scriptDir, "..", "json", "bible");
const booksDir = join(bibleDir, "books");
const indexPath = join(bibleDir, "index.json");

const booksArg = process.argv.find((arg) => arg.startsWith("--books="));
const dryRun = process.argv.includes("--dry-run");
const selectedBooks = booksArg
  ? booksArg
      .slice("--books=".length)
      .split(",")
      .map((book) => book.trim())
      .filter(Boolean)
  : Object.keys(BOOKS);

for (const book of selectedBooks) {
  if (!BOOKS[book]) {
    throw new Error(
      `Unknown book "${book}". Known books: ${Object.keys(BOOKS).join(", ")}`,
    );
  }
}

function readExistingIndex() {
  try {
    return JSON.parse(readFileSync(indexPath, "utf8"));
  } catch {
    return {};
  }
}

async function fetchBook(abbrev, book) {
  const url = new URL(API_URL);
  url.searchParams.set("translation", TRANSLATION);
  url.searchParams.set("book", String(book.justBibleBook));

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `JustBible ${abbrev} failed: ${response.status} ${response.statusText}`,
    );
  }

  return response.json();
}

const index = readExistingIndex();

for (const abbrev of selectedBooks) {
  const book = BOOKS[abbrev];
  const chapters = await fetchBook(abbrev, book);
  const chapterNumbers = Object.keys(chapters)
    .map(Number)
    .filter(Number.isInteger)
    .sort((a, b) => a - b);

  index[abbrev] = {
    abbrev,
    nameRu: book.nameRu,
    nameShort: book.nameShort,
    testament: book.testament,
    chapterCount: chapterNumbers.length,
  };

  if (!dryRun) {
    const bookDir = join(booksDir, abbrev);
    mkdirSync(bookDir, { recursive: true });
    for (const chapter of chapterNumbers) {
      writeFileSync(
        join(bookDir, `${chapter}.json`),
        `${JSON.stringify(chapters[String(chapter)], null, 2)}\n`,
        "utf8",
      );
    }
  }

  console.log(
    `${dryRun ? "checked" : "synced"} ${abbrev}: ${chapterNumbers.length} chapters`,
  );
}

if (!dryRun) {
  writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`, "utf8");
}

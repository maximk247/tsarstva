import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const scriptDir = path.dirname(fileURLToPath(import.meta.url));
export const dataDir = path.resolve(scriptDir, "..", "..");
export const jsonDir = path.join(dataDir, "json");
export const bibleDir = path.join(jsonDir, "bible");
export const bibleBooksDir = path.join(bibleDir, "books");
export const searchDir = path.join(jsonDir, "search");

export const readerBooks = [
  "1sm",
  "2sm",
  "1kgs",
  "2kgs",
  "1ch",
  "2ch",
  "ne",
  "is",
  "jr",
];

export function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

export function writeJson(filePath, value) {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

export function resolveOutputPath(value) {
  if (!value) return path.join(searchDir, "semantic-corpus.json");
  return path.isAbsolute(value) ? value : path.resolve(process.cwd(), value);
}

export function parseCsv(value, fallback) {
  if (!value) return fallback;
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function parsePositiveInts(value, fallback) {
  const raw = parseCsv(value, []).map(Number);
  const parsed = [...new Set(raw)].filter(
    (item) => Number.isInteger(item) && item > 0,
  );
  return parsed.length > 0 ? parsed.sort((a, b) => a - b) : fallback;
}

export function parseChapterRefs(value) {
  return parseCsv(value, []).map((item) => {
    const match = /^([^:]+):([1-9]\d*)$/.exec(item);
    if (!match) {
      throw new Error(`Chapter ref must match "book:chapter": ${item}`);
    }
    return {
      book: match[1],
      chapter: Number(match[2]),
    };
  });
}

function cleanVerseText(value) {
  return String(value)
    .replace(/^\(\d+:\d+\)\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function refId(book, chapter, verse) {
  return `${book}:${chapter}:${verse}`;
}

function formatLabel(meta, chapter, verse, verseEnd) {
  const prefix = `${meta.nameShort} ${chapter}:`;
  if (verseEnd && verseEnd !== verse) return `${prefix}${verse}-${verseEnd}`;
  return `${prefix}${verse}`;
}

function readChapter(book, chapter) {
  const filePath = path.join(bibleBooksDir, book, `${chapter}.json`);
  if (!existsSync(filePath)) return null;
  return readJson(filePath);
}

export function buildSemanticCorpus({
  books = readerBooks,
  chapters = [],
  windows = [1],
} = {}) {
  const bible = readJson(path.join(bibleDir, "index.json"));
  const docs = [];
  const selectedBooks =
    chapters.length > 0
      ? [...new Set(chapters.map((item) => item.book))]
      : books;

  for (const book of selectedBooks) {
    const meta = bible[book];
    if (!meta) {
      throw new Error(`Unknown book "${book}"`);
    }

    const bookChapters =
      chapters.length > 0
        ? chapters
            .filter((item) => item.book === book)
            .map((item) => item.chapter)
        : Array.from({ length: meta.chapterCount }, (_, index) => index + 1);

    for (const chapter of bookChapters) {
      if (chapter > meta.chapterCount) {
        throw new Error(
          `Chapter ${chapter} is outside ${book} chapter count ${meta.chapterCount}`,
        );
      }

      const chapterData = readChapter(book, chapter);
      if (!chapterData) continue;

      const verses = Object.entries(chapterData)
        .map(([num, text]) => ({
          num: Number(num),
          text: cleanVerseText(text),
        }))
        .filter((verse) => Number.isInteger(verse.num) && verse.text.length > 0)
        .sort((left, right) => left.num - right.num);

      for (let startIndex = 0; startIndex < verses.length; startIndex += 1) {
        for (const windowSize of windows) {
          const endIndex = startIndex + windowSize - 1;
          if (endIndex >= verses.length) continue;

          const start = verses[startIndex];
          const end = verses[endIndex];
          const text = verses
            .slice(startIndex, endIndex + 1)
            .map((verse) => verse.text)
            .join(" ");
          const isVerse = windowSize === 1;
          const id = isVerse
            ? refId(book, chapter, start.num)
            : `${book}:${chapter}:${start.num}-${end.num}:w${windowSize}`;

          docs.push({
            id,
            kind: isVerse ? "verse" : "window",
            window: windowSize,
            book,
            chapter,
            verse: start.num,
            verseEnd: end.num,
            label: formatLabel(meta, chapter, start.num, end.num),
            text,
          });
        }
      }
    }
  }

  return {
    schemaVersion: 1,
    source: "data/json/bible/books",
    books: selectedBooks,
    chapters,
    windows,
    docCount: docs.length,
    docs,
  };
}

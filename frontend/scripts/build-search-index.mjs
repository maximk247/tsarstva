import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(frontendDir, "..");
const bibleDir = path.join(repoRoot, "data", "json", "bible");
const booksDir = path.join(bibleDir, "books");
const publicDir = path.join(frontendDir, "public");
const outputPath = path.join(publicDir, "search-index.json");

const readerBooks = [
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

function readJson(filePath) {
  return JSON.parse(readFileSync(filePath, "utf8"));
}

const bible = readJson(path.join(bibleDir, "index.json"));
const index = [];

for (const book of readerBooks) {
  const meta = bible[book];
  if (!meta) continue;

  for (let chapter = 1; chapter <= meta.chapterCount; chapter++) {
    const verses = readJson(path.join(booksDir, book, `${chapter}.json`));
    const verseNumbers = Object.keys(verses)
      .map(Number)
      .sort((a, b) => a - b);

    for (const verse of verseNumbers) {
      const text = verses[verse]?.replace(/^\(\d+:\d+\)\s*/, "");
      if (!text) continue;

      index.push({
        book,
        chapter,
        verse,
        text,
        label: `${meta.nameShort} ${chapter}:${verse}`,
        bookName: meta.nameRu,
        bookShortName: meta.nameShort,
      });
    }
  }
}

mkdirSync(publicDir, { recursive: true });
writeFileSync(outputPath, `${JSON.stringify(index)}\n`);

console.log(`Built search index: ${index.length} verses -> ${outputPath}`);

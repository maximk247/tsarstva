import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(scriptDir, "..");
const jsonDir = path.join(dataDir, "json");
const bibleDir = path.join(jsonDir, "bible");
const crossRefsDir = path.join(jsonDir, "cross-refs");

const themes = new Set([
  "same_event",
  "fulfillment",
  "prophecy",
  "theological",
  "genealogy",
  "tsk",
]);

const readerBooks = new Set([
  "1sm",
  "2sm",
  "1kgs",
  "2kgs",
  "1ch",
  "2ch",
  "ne",
  "is",
  "jr",
]);

const files = [
  { name: "manual", filename: "manual.json", required: true },
  { name: "candidates", filename: "candidates.json", required: true },
];

const errors = [];
const warnings = [];
const stats = new Map();
const chapterCache = new Map();

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`${filePath}: ${error.message}`);
  }
}

const bible = readJson(path.join(bibleDir, "index.json"));

function location(source, index) {
  return `${source} refs[${index}]`;
}

function addIssue(list, source, index, message) {
  list.push(`${location(source, index)}: ${message}`);
}

function parseRef(value) {
  if (typeof value !== "string") return null;
  const match = /^([^:]+):([1-9]\d*):([1-9]\d*)$/.exec(value);
  if (!match) return null;
  return {
    book: match[1],
    chapter: Number(match[2]),
    verse: Number(match[3]),
  };
}

function parseRangeEnd(value, startChapter, startVerse) {
  if (value === undefined) {
    return { chapter: startChapter, verse: startVerse };
  }

  if (Number.isInteger(value) && value > 0) {
    return { chapter: startChapter, verse: value };
  }

  if (typeof value === "string") {
    const match = /^([1-9]\d*):([1-9]\d*)$/.exec(value);
    if (!match) return null;
    return {
      chapter: Number(match[1]),
      verse: Number(match[2]),
    };
  }

  return null;
}

function getChapter(book, chapter) {
  const key = `${book}:${chapter}`;
  if (chapterCache.has(key)) return chapterCache.get(key);

  const filePath = path.join(bibleDir, "books", book, `${chapter}.json`);
  if (!existsSync(filePath)) {
    chapterCache.set(key, null);
    return null;
  }

  const chapterData = readJson(filePath);
  chapterCache.set(key, chapterData);
  return chapterData;
}

function hasVerse(ref) {
  const chapter = getChapter(ref.book, ref.chapter);
  return Boolean(
    chapter && Object.prototype.hasOwnProperty.call(chapter, ref.verse),
  );
}

function validateRef(source, index, field, ref) {
  if (!ref) {
    addIssue(errors, source, index, `${field} must match "book:chapter:verse"`);
    return false;
  }

  const meta = bible[ref.book];
  if (!meta) {
    addIssue(
      errors,
      source,
      index,
      `${field} references unknown book "${ref.book}"`,
    );
    return false;
  }

  if (ref.chapter > meta.chapterCount) {
    addIssue(
      errors,
      source,
      index,
      `${field} chapter ${ref.chapter} is outside ${ref.book} chapter count ${meta.chapterCount}`,
    );
    return false;
  }

  if (!hasVerse(ref)) {
    addIssue(
      errors,
      source,
      index,
      `${field} references missing verse ${ref.book}:${ref.chapter}:${ref.verse}`,
    );
    return false;
  }

  return true;
}

function compareRefs(left, right) {
  if (left.chapter !== right.chapter) return left.chapter - right.chapter;
  return left.verse - right.verse;
}

function rangeKey(ref, end) {
  if (end.chapter !== ref.chapter) {
    return `${ref.book}:${ref.chapter}:${ref.verse}-${end.chapter}:${end.verse}`;
  }
  if (end.verse !== ref.verse) {
    return `${ref.book}:${ref.chapter}:${ref.verse}-${end.verse}`;
  }
  return `${ref.book}:${ref.chapter}:${ref.verse}`;
}

function entryKey(entry) {
  const from = parseRef(entry.from);
  const to = parseRef(entry.to);
  if (!from || !to) return null;
  const fromEnd = parseRangeEnd(entry.fromEnd, from.chapter, from.verse);
  const toEnd = parseRangeEnd(entry.toEnd, to.chapter, to.verse);
  if (!fromEnd || !toEnd) return null;
  return `${rangeKey(from, fromEnd)}->${rangeKey(to, toEnd)}:${entry.theme}`;
}

function reciprocalKey(entry) {
  const from = parseRef(entry.from);
  const to = parseRef(entry.to);
  if (!from || !to) return null;
  const fromEnd = parseRangeEnd(entry.fromEnd, from.chapter, from.verse);
  const toEnd = parseRangeEnd(entry.toEnd, to.chapter, to.verse);
  if (!fromEnd || !toEnd) return null;
  return `${rangeKey(to, toEnd)}->${rangeKey(from, fromEnd)}:${entry.theme}`;
}

function validateRangeEnd(entry, source, index, field, startRef) {
  const end = parseRangeEnd(entry[field], startRef.chapter, startRef.verse);
  if (!end) {
    addIssue(
      errors,
      source,
      index,
      `${field} must be a positive integer or "chapter:verse"`,
    );
    return null;
  }

  if (compareRefs(end, startRef) < 0) {
    addIssue(errors, source, index, `${field} must not point before its start`);
  }

  if (end.chapter !== startRef.chapter && typeof entry[field] !== "string") {
    addIssue(
      errors,
      source,
      index,
      `cross-chapter ${field} must use "chapter:verse"`,
    );
  }

  if (end.chapter !== startRef.chapter || end.verse !== startRef.verse) {
    validateRef(source, index, field, {
      book: startRef.book,
      chapter: end.chapter,
      verse: end.verse,
    });
  }

  return end;
}

function validateEntry(entry, source, index, seenGlobal, seenBySource) {
  if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
    addIssue(errors, source, index, "entry must be an object");
    return;
  }

  const from = parseRef(entry.from);
  const to = parseRef(entry.to);
  const fromOk = validateRef(source, index, "from", from);
  const toOk = validateRef(source, index, "to", to);

  if (typeof entry.theme !== "string" || !themes.has(entry.theme)) {
    addIssue(
      errors,
      source,
      index,
      `theme must be one of: ${[...themes].join(", ")}`,
    );
  }

  if (entry.note !== undefined && typeof entry.note !== "string") {
    addIssue(errors, source, index, "note must be a string when present");
  }

  if (!to) return;

  if (from) validateRangeEnd(entry, source, index, "fromEnd", from);
  validateRangeEnd(entry, source, index, "toEnd", to);

  if (
    fromOk &&
    toOk &&
    from.book === to.book &&
    from.chapter === to.chapter &&
    from.verse === to.verse
  ) {
    addIssue(warnings, source, index, "from and to point to the same verse");
  }

  if (fromOk && !readerBooks.has(from.book)) {
    addIssue(
      warnings,
      source,
      index,
      `from uses "${from.book}", which is not in READER_BOOKS and will not get a reader page`,
    );
  }

  const key = entryKey(entry);
  if (!key) return;

  const duplicateInSource = seenBySource.has(key);
  if (duplicateInSource) {
    addIssue(
      errors,
      source,
      index,
      "duplicates another entry in the same file",
    );
  } else {
    seenBySource.add(key);
  }

  const previousSource = seenGlobal.get(key);
  if (previousSource && !duplicateInSource) {
    addIssue(
      errors,
      source,
      index,
      `duplicates an entry already present in ${previousSource}`,
    );
  } else {
    seenGlobal.set(key, source);
  }

  const reverse = reciprocalKey(entry);
  if (reverse && seenGlobal.has(reverse)) {
    addIssue(
      warnings,
      source,
      index,
      "looks like a manual reciprocal of another reader-to-reader ref; crossRefs.ts creates reciprocals automatically",
    );
  }
}

const seenGlobal = new Map();

for (const file of files) {
  const filePath = path.join(crossRefsDir, file.filename);
  if (!existsSync(filePath)) {
    if (file.required) errors.push(`${file.filename}: file is missing`);
    continue;
  }

  const data = readJson(filePath);
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    errors.push(`${file.filename}: root must be an object`);
    continue;
  }

  if (!Array.isArray(data.refs)) {
    errors.push(`${file.filename}: refs must be an array`);
    continue;
  }

  stats.set(file.name, data.refs.length);
  const seenBySource = new Set();
  data.refs.forEach((entry, index) => {
    validateEntry(entry, file.name, index, seenGlobal, seenBySource);
  });
}

for (const warning of warnings) {
  console.warn(`warning: ${warning}`);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`error: ${error}`);
  }
  console.error(
    `\nCross-ref validation failed: ${errors.length} error(s), ${warnings.length} warning(s).`,
  );
  process.exit(1);
}

const summary = files
  .map((file) => `${file.name}: ${stats.get(file.name) ?? 0}`)
  .join(", ");

console.log(
  `Cross-ref validation passed (${summary}; ${warnings.length} warning(s)).`,
);

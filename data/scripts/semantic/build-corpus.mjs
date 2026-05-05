import path from "node:path";
import {
  buildSemanticCorpus,
  parseCsv,
  parseChapterRefs,
  parsePositiveInts,
  readerBooks,
  resolveOutputPath,
  writeJson,
} from "./common.mjs";

function parseArgs(argv) {
  const args = {
    books: readerBooks,
    chapters: [],
    out: null,
    windows: [1],
  };

  for (const item of argv) {
    if (item === "--help" || item === "-h") {
      args.help = true;
    } else if (item.startsWith("--books=")) {
      args.books = parseCsv(item.slice("--books=".length), readerBooks);
    } else if (item.startsWith("--chapters=")) {
      args.chapters = parseChapterRefs(item.slice("--chapters=".length));
    } else if (item.startsWith("--out=")) {
      args.out = item.slice("--out=".length);
    } else if (item.startsWith("--windows=")) {
      args.windows = parsePositiveInts(item.slice("--windows=".length), [1]);
    } else {
      throw new Error(`Unknown argument: ${item}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`Build a semantic-search corpus from local Bible JSON.

Usage:
  bun run scripts/semantic/build-corpus.mjs [options]

Options:
  --books=1sm,2sm       Books to include. Defaults to all READER_BOOKS.
  --chapters=1sm:31     Exact chapters to include. Overrides --books.
  --windows=1,3         Verse window sizes. Defaults to 1.
  --out=path            Output JSON. Defaults to data/json/search/semantic-corpus.json.
`);
}

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const outPath = resolveOutputPath(args.out);
const corpus = buildSemanticCorpus({
  books: args.books,
  chapters: args.chapters,
  windows: args.windows,
});

writeJson(outPath, corpus);

console.log(
  `Semantic corpus written: ${path.relative(process.cwd(), outPath)} (${corpus.docCount} docs; windows: ${args.windows.join(",")})`,
);

import { readdirSync, readFileSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";

const root = new URL("../json/bible/books/", import.meta.url).pathname.replace(
  /^\/([A-Za-z]:)/,
  "$1",
);

let converted = 0;
let skipped = 0;

for (const book of readdirSync(root)) {
  const bookDir = join(root, book);
  if (!statSync(bookDir).isDirectory()) continue;
  for (const file of readdirSync(bookDir)) {
    if (!file.endsWith(".json")) continue;
    const path = join(bookDir, file);
    const data = JSON.parse(readFileSync(path, "utf8"));
    if (!Array.isArray(data)) {
      skipped++;
      continue;
    }
    const obj = {};
    data.forEach((v, i) => {
      obj[i + 1] = v;
    });
    writeFileSync(path, JSON.stringify(obj));
    converted++;
  }
}

console.log(`converted: ${converted}, already-object: ${skipped}`);

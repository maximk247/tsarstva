/**
 * Converts OpenBible cross-references to our indexed format.
 * Run: node data/scripts/convert-crossrefs.mjs
 */

import { readFileSync, writeFileSync } from "fs";

const OB_TO_ABBREV = {
  Gen: "gn", Exod: "ex", Lev: "lv", Num: "nm", Deut: "dt",
  Josh: "js", Judg: "jud", Ruth: "rt",
  "1Sam": "1sm", "2Sam": "2sm", "1Kgs": "1kgs", "2Kgs": "2kgs",
  "1Chr": "1ch", "2Chr": "2ch",
  Ezra: "ezr", Neh: "ne", Esth: "et",
  Job: "job", Ps: "ps", Prov: "prv", Eccl: "ec", Song: "so",
  Isa: "is", Jer: "jr", Lam: "lm", Ezek: "ez", Dan: "dn",
  Hos: "ho", Joel: "jl", Amos: "am", Obad: "ob",
  Jonah: "jn", Mic: "mi", Nah: "na", Hab: "hk",
  Zeph: "zp", Hag: "hg", Zech: "zc", Mal: "ml",
  Matt: "mt", Mark: "mk", Luke: "lk", John: "jo",
  Acts: "act", Rom: "rm",
  "1Cor": "1co", "2Cor": "2co",
  Gal: "gl", Eph: "eph", Phil: "ph", Col: "cl",
  "1Thess": "1ts", "2Thess": "2ts", "1Tim": "1tm", "2Tim": "2tm",
  Titus: "tt", Phlm: "phm", Heb: "hb",
  Jas: "jm", "1Pet": "1pe", "2Pet": "2pe",
  "1John": "1jo", "2John": "2jo", "3John": "3jo",
  Jude: "jd", Rev: "re",
};

const KINGS_ABBREVS = new Set(["1sm", "2sm", "1kgs", "2kgs"]);

function parseRef(refStr) {
  const rangeParts = refStr.split("-");
  const from = parseVerse(rangeParts[0]);
  if (!from) return null;
  let toVerse = from.verse;
  if (rangeParts.length > 1) {
    const to = parseVerse(rangeParts[1]);
    if (to && to.book === from.book && to.chapter === from.chapter) toVerse = to.verse;
  }
  return { ...from, toVerse };
}

function parseVerse(verseStr) {
  const parts = verseStr.trim().split(".");
  if (parts.length < 3) return null;
  const chapter = parseInt(parts[1]);
  const verse = parseInt(parts[2]);
  if (isNaN(chapter) || isNaN(verse)) return null;
  const book = OB_TO_ABBREV[parts[0]];
  if (!book) return null;
  return { book, chapter, verse };
}

const lines = readFileSync("data/json/cross-refs/cross_references.txt", "utf8").split("\n");
const index = {};
let total = 0, kept = 0;

for (const line of lines) {
  if (!line.trim() || line.startsWith("From")) continue;
  const cols = line.split("\t");
  if (cols.length < 2) continue;
  const fromRef = parseRef(cols[0]);
  const toRef = parseRef(cols[1]);
  const votes = parseInt(cols[2]) || 0;
  if (!fromRef || !toRef) continue;
  total++;
  const fromIsKings = KINGS_ABBREVS.has(fromRef.book);
  const toIsKings = KINGS_ABBREVS.has(toRef.book);
  if (!fromIsKings && !toIsKings) continue;
  if (fromRef.book === toRef.book && fromRef.chapter === toRef.chapter && fromRef.verse === toRef.verse) continue;
  kept++;

  function addEntry(kingsRef, otherRef) {
    const key = `${kingsRef.book}:${kingsRef.chapter}:${kingsRef.verse}`;
    if (!index[key]) index[key] = [];
    index[key].push({
      book: otherRef.book, chapter: otherRef.chapter, verse: otherRef.verse,
      verseEnd: otherRef.toVerse !== otherRef.verse ? otherRef.toVerse : undefined,
      votes,
    });
  }
  if (fromIsKings) addEntry(fromRef, toRef);
  if (toIsKings) addEntry(toRef, fromRef);
}

for (const key of Object.keys(index)) {
  const seen = new Set();
  index[key] = index[key]
    .filter(r => { const id = `${r.book}:${r.chapter}:${r.verse}`; if (seen.has(id)) return false; seen.add(id); return true; })
    .sort((a, b) => b.votes - a.votes)
    .slice(0, 20);
}

writeFileSync("data/json/cross-refs/tsk-filtered.json", JSON.stringify(index, null, 0), "utf8");
console.log(`Parsed ${total} total refs, kept ${kept}, indexed ${Object.keys(index).length} verses`);

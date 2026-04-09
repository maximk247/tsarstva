/**
 * Converts synodal_raw.json into split files:
 *   data/json/bible/index.json               — book metadata (no chapter text)
 *   data/json/bible/books/{abbrev}/{n}.json  — one file per chapter
 *
 * Run: node data/scripts/split-bible.mjs
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";

const RU_NAMES = {
  gn: "Бытие", ex: "Исход", lv: "Левит", nm: "Числа", dt: "Второзаконие",
  js: "Иисус Навин", jud: "Судьи", rt: "Руфь",
  "1sm": "1 Царств", "2sm": "2 Царств",
  "1kgs": "3 Царств", "2kgs": "4 Царств",
  "1ch": "1 Паралипоменон", "2ch": "2 Паралипоменон",
  ezr: "Ездра", ne: "Неемия", et: "Есфирь",
  job: "Иов", ps: "Псалтирь", prv: "Притчи", ec: "Екклесиаст", so: "Песня Песней",
  is: "Исаия", jr: "Иеремия", lm: "Плач Иеремии",
  ez: "Иезекииль", dn: "Даниил",
  ho: "Осия", jl: "Иоиль", am: "Амос", ob: "Авдий",
  jn: "Иона", mi: "Михей", na: "Наум", hk: "Аввакум",
  zp: "Софония", hg: "Аггей", zc: "Захария", ml: "Малахия",
  mt: "Матфея", mk: "Марка", lk: "Луки", jo: "Иоанна",
  act: "Деяния", rm: "Римлянам",
  "1co": "1 Коринфянам", "2co": "2 Коринфянам",
  gl: "Галатам", eph: "Ефесянам", ph: "Филиппийцам", cl: "Колоссянам",
  "1ts": "1 Фессалоникийцам", "2ts": "2 Фессалоникийцам",
  "1tm": "1 Тимофею", "2tm": "2 Тимофею",
  tt: "Титу", phm: "Филимону", hb: "Евреям",
  jm: "Иакова", "1pe": "1 Петра", "2pe": "2 Петра",
  "1jo": "1 Иоанна", "2jo": "2 Иоанна", "3jo": "3 Иоанна",
  jd: "Иуды", re: "Откровение",
};

const RU_SHORT = {
  "1sm": "1 Цар", "2sm": "2 Цар", "1kgs": "3 Цар", "2kgs": "4 Цар",
  "1ch": "1 Пар", "2ch": "2 Пар",
  is: "Ис", jr: "Иер", ez: "Иез", dn: "Дан",
  ho: "Ос", jl: "Иоил", am: "Ам", mi: "Мих", na: "Наум",
  hk: "Авв", zp: "Соф", hg: "Агг", zc: "Зах", ml: "Мал",
  ps: "Пс", prv: "Прит", ne: "Неем", ezr: "Езд",
};

const OT_BOOKS = new Set([
  "gn","ex","lv","nm","dt","js","jud","rt","1sm","2sm","1kgs","2kgs",
  "1ch","2ch","ezr","ne","et","job","ps","prv","ec","so",
  "is","jr","lm","ez","dn","ho","jl","am","ob","jn","mi","na","hk","zp","hg","zc","ml"
]);

// Только книги, которые реально используются:
// - читаемые: 1sm 2sm 1kgs 2kgs
// - цели параллельных мест (manual.json): 1ch 2ch is jr lk ne
const INCLUDED = new Set(["1sm","2sm","1kgs","2kgs","1ch","2ch","is","jr","lk","ne"]);

let raw = readFileSync("data/json/bible/synodal_raw.json", "utf8");
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
const rawData = JSON.parse(raw);

const booksDir = "data/json/bible/books";
const index = {};

for (const { abbrev, chapters } of rawData) {
  if (!INCLUDED.has(abbrev)) continue;

  index[abbrev] = {
    abbrev,
    nameRu: RU_NAMES[abbrev] || abbrev,
    nameShort: RU_SHORT[abbrev] || RU_NAMES[abbrev] || abbrev,
    testament: OT_BOOKS.has(abbrev) ? "OT" : "NT",
    chapterCount: chapters.length,
  };

  const bookDir = join(booksDir, abbrev);
  mkdirSync(bookDir, { recursive: true });

  // Примечание: если добавляется ps (Псалтирь), synodal_raw.json хранит её
  // по еврейской нумерации. Нужно будет переименовать главы в православную (LXX).
  chapters.forEach((verses, i) => {
    writeFileSync(join(bookDir, `${i + 1}.json`), JSON.stringify(verses), "utf8");
  });
}

writeFileSync("data/json/bible/index.json", JSON.stringify(index, null, 0), "utf8");

const totalChapters = Object.values(index).reduce((s, b) => s + b.chapterCount, 0);
console.log(`index.json: ${Object.keys(index).length} книг`);
console.log(`books/: ${totalChapters} файлов глав`);

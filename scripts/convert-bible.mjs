/**
 * Converts raw synodal Bible JSON to our indexed format.
 * Run: node scripts/convert-bible.mjs
 */

import { readFileSync, writeFileSync } from "fs";

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

// Short display names for compact UI
const RU_SHORT = {
  "1sm": "1 Цар", "2sm": "2 Цар", "1kgs": "3 Цар", "2kgs": "4 Цар",
  "1ch": "1 Пар", "2ch": "2 Пар",
  is: "Ис", jr: "Иер", ez: "Иез", dn: "Дан",
  ho: "Ос", jl: "Иоил", am: "Ам", mi: "Мих", na: "Наум",
  hk: "Авв", zp: "Соф", hg: "Агг", zc: "Зах", ml: "Мал",
  ps: "Пс", prv: "Прит", ne: "Неем", ezr: "Езд",
};

// Testament grouping
const OT_BOOKS = new Set([
  "gn","ex","lv","nm","dt","js","jud","rt","1sm","2sm","1kgs","2kgs",
  "1ch","2ch","ezr","ne","et","job","ps","prv","ec","so",
  "is","jr","lm","ez","dn","ho","jl","am","ob","jn","mi","na","hk","zp","hg","zc","ml"
]);

let raw = readFileSync("data/bible/synodal_raw.json", "utf8");
if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1); // strip BOM

const rawData = JSON.parse(raw);

// Build indexed format: { [abbrev]: { abbrev, nameRu, nameShort, testament, chapters: string[][] } }
const bible = {};
for (const book of rawData) {
  const { abbrev, chapters } = book;
  bible[abbrev] = {
    abbrev,
    nameRu: RU_NAMES[abbrev] || abbrev,
    nameShort: RU_SHORT[abbrev] || RU_NAMES[abbrev] || abbrev,
    testament: OT_BOOKS.has(abbrev) ? "OT" : "NT",
    chapters, // string[][] — chapters[chIdx][verseIdx]
  };
}

writeFileSync(
  "data/bible/synodal.json",
  JSON.stringify(bible, null, 0),
  "utf8"
);

console.log(`Written ${Object.keys(bible).length} books to data/bible/synodal.json`);
console.log("Kings books:");
["1sm","2sm","1kgs","2kgs"].forEach(k => {
  const b = bible[k];
  console.log(` ${b.nameRu}: ${b.chapters.length} глав, ${b.chapters[0].length} ст. в гл.1`);
});

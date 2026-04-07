import Link from "next/link";
import { KINGS_BOOKS, KINGS_NAMES } from "@/types/bible";
import { getChapterCount } from "@/lib/bible";

const BOOK_DESCRIPTIONS: Record<string, string> = {
  "1sm": "Самуил, Саул и Давид. От последнего судьи до воцарения Давида.",
  "2sm": "Царствование Давида. Победы, грех и последствия.",
  "1kgs": "Соломон, разделение царства, пророки Илия и Елисей.",
  "2kgs": "Падение Самарии, реформы Езекии и Иосии, плен.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-stone-800 dark:text-stone-200 mb-4">
            Чтение Царств
          </h1>
          <p className="font-sans text-stone-500 dark:text-stone-400 text-lg leading-relaxed">
            Читайте 1–4 Царств с параллельными местами из пророков,
            Паралипоменона и других книг — всё сразу в одном экране.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {KINGS_BOOKS.map((abbrev) => {
            const totalChapters = getChapterCount(abbrev);
            return (
              <Link
                key={abbrev}
                href={`/read/${abbrev}/1`}
                className="group block rounded-xl border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 p-5 hover:border-amber-400 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <h2 className="font-sans font-semibold text-lg text-stone-800 dark:text-stone-200 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                    {KINGS_NAMES[abbrev]}
                  </h2>
                  <span className="font-sans text-xs text-stone-400 dark:text-stone-500 mt-1">
                    {totalChapters} гл.
                  </span>
                </div>
                <p className="font-sans text-sm text-stone-500 dark:text-stone-400 leading-relaxed">
                  {BOOK_DESCRIPTIONS[abbrev]}
                </p>
              </Link>
            );
          })}
        </div>

        <p className="text-center mt-10 font-sans text-xs text-stone-400 dark:text-stone-600">
          Синодальный перевод · Параллели: OpenBible + ручная разметка
        </p>
      </div>
    </div>
  );
}

import Link from "next/link";
import {
  READER_BOOK_NAMES,
  READER_BOOK_SECTIONS,
  getChapterCount,
  type ReaderBook,
} from "@tsarstva/data";

const BOOK_DESCRIPTIONS: Record<ReaderBook, string> = {
  "1sm": "Самуил, Саул и Давид. От последнего судьи до воцарения Давида.",
  "2sm": "Царствование Давида. Победы, грех и последствия.",
  "1kgs": "Соломон, разделение царства, пророки Илия и Елисей.",
  "2kgs": "Падение Самарии, реформы Езекии и Иосии, плен.",
  "1ch": "Родословия, Давид, служение левитов и подготовка к храму.",
  "2ch": "Соломон, храм и история царей Иудеи до возвращения из плена.",
  ne: "Возвращение из плена, восстановление стен и обновление завета.",
  is: "Пророчества об Иудее, суде, надежде и спасении.",
  jr: "Последние годы Иудеи, падение Иерусалима и надежда нового завета.",
};

export default function BookGrid() {
  return (
    <div className="space-y-8">
      {READER_BOOK_SECTIONS.map((section) => (
        <section key={section.title}>
          <h2 className="font-sans text-sm font-semibold uppercase tracking-widest text-[var(--muted-foreground)] dark:text-stone-500 mb-3">
            {section.title}
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {section.books.map((abbrev) => {
              const totalChapters = getChapterCount(abbrev);
              return (
                <Link
                  key={abbrev}
                  href={`/read/${abbrev}/1`}
                  className="group block rounded-xl border border-[var(--border)] dark:border-stone-700 bg-[var(--card)] dark:bg-stone-900 p-5 hover:border-amber-400 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-sans font-semibold text-lg text-stone-800 dark:text-stone-200 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
                      {READER_BOOK_NAMES[abbrev]}
                    </h3>
                    <span className="font-sans text-xs text-[var(--muted-foreground)] dark:text-stone-500 mt-1">
                      {totalChapters} гл.
                    </span>
                  </div>
                  <p className="font-sans text-sm text-[var(--text-secondary)] dark:text-stone-400 leading-relaxed">
                    {BOOK_DESCRIPTIONS[abbrev]}
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

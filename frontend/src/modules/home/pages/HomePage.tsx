import BookGrid from "../components/BookGrid";

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

        <BookGrid />

        <p className="text-center mt-10 font-sans text-xs text-stone-400 dark:text-stone-600">
          Синодальный перевод · Параллели: OpenBible + ручная разметка
        </p>
      </div>
    </div>
  );
}

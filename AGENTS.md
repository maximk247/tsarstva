# AGENTS.md — Чтение Царств

## Что это

Статическая читалка книг 1–4 Царств (1sm, 2sm, 1kgs, 2kgs), 1–2 Паралипоменон (1ch, 2ch) и ветхозаветных книг, на которые есть параллельные места (ne, is, jr). Деплоится на Vercel как `next export`. Монорепо на Bun workspaces.

## Структура

```
/
├── data/                  # @tsarstva/data — данные и утилиты (Node/server)
│   ├── src/
│   │   ├── types.ts       # Все типы и списки книг: BookMeta, CrossRef, READER_BOOKS и пр.
│   │   ├── index.ts       # Публичный API пакета
│   │   ├── bible-meta.ts  # getBook, getChapterCount, formatRef, getBookName
│   │   ├── crossRefs.ts   # getParallelsForVerse, getChaptersWithParallels, getChapterParallels
│   │   ├── bible.ts       # getChapter, getVerseText, getVerseRange (server-only, readFileSync)
│   │   └── server.ts      # re-export bible.ts для Server Components
│   └── json/
│       ├── bible/index.json        # метаданные всех книг
│       ├── bible/books/            # тексты глав по книгам
│       └── cross-refs/manual.json  # ручная разметка параллелей
│
└── frontend/              # @tsarstva/frontend — Next.js 16, React 19, Tailwind 4
    └── src/
        ├── app/           # App Router: page.tsx — thin re-exports из modules/
        ├── modules/
        │   ├── home/      # HomePage + BookGrid
        │   └── reader/    # ReaderPage, ReaderLayout, MainText, ParallelPanel, Sidebar
        ├── features/
        │   ├── navigate-chapter/   # BookSelector, ChapterNav
        │   ├── reading-progress/   # прогресс чтения
        │   └── theme-toggle/       # ThemeToggle
        ├── entities/
        │   ├── verse/     # VerseItem
        │   └── cross-ref/ # ParallelCard
        └── shared/
            ├── lib/cn.ts           # cn() утилита (clsx + tailwind-merge)
            └── config/theme-provider.tsx
```

## Архитектура — ключевые паттерны

**Статический экспорт.** `next.config.ts` задаёт `output: "export"`. Все данные читаются на этапе сборки через Server Components — клиент не делает запросов к файловой системе.

**Предвычисление параллелей.** `ReaderPage` (Server Component) на этапе сборки:

1. Читает все стихи главы через `getChapter(book, chapter)`
2. Вызывает `getChapterParallels` → получает Map<verse, CrossRef[]>
3. Для каждого ref вызывает `getVerseRange` и `formatRef` → формирует `PrecomputedParallel[]`
4. Передаёт `parallelsMap: Record<number, PrecomputedParallel[]>` как пропс в Client Component `ReaderLayout`

**Важно:** `getChapter`/`getVerseRange` используют `readFileSync` — их можно вызывать **только в Server Components** (через `@tsarstva/data/server`). В клиентских компонентах используй только `@tsarstva/data` (без /server).

**Ref формат.** Ключи в `manual.json` и индексах: `"book:chapter:verse"` → `"1sm:1:1"`. Читаемые книги живут в `READER_BOOKS`: `1sm`, `2sm`, `1kgs`, `2kgs`, `1ch`, `2ch`, `ne`, `is`, `jr`. Новозаветные отсылки остаются в панели параллелей, но не добавляются в библиотеку чтения.

**Тексты Библии.** Локальные JSON можно обновить из JustBible API:

```bash
cd data && bun run sync:justbible
```

**Архитектура компонентов (FSD-подобная):** `app` → `modules` → `features` → `entities` → `shared`. Импорты только вниз по слоям.

## Команды

```bash
# Dev-сервер (из корня монорепо)
bun run dev

# Сборка фронтенда
cd frontend && bun run build

# Установка зависимостей
bun install
```

## Добавление параллелей

Параллели живут в `data/json/cross-refs/manual.json`. Формат записи:

```json
{
  "from": "1kgs:3:5",
  "to": "2ch:1:7",
  "toEnd": 12,
  "theme": "same_event",
  "note": "Описание параллели"
}
```

Темы: `same_event`, `fulfillment`, `prophecy`, `theological`, `genealogy`, `tsk`.

После изменения `manual.json` — пересборка не нужна для dev (файл читается при старте). Для production — `bun run build`.

## Деплой

Vercel, конфиг в `vercel.json`:

- `buildCommand`: `npm run build --workspace=frontend`
- `outputDirectory`: `frontend/out`
- Фреймворк: `null` (не детектить Next.js автоматически — статический экспорт в папку out)

## Стиль кода

- TypeScript, strict
- Tailwind 4 (postcss плагин `@tailwindcss/postcss`)
- `cn()` из `@/shared/lib/cn` для условных классов
- Цветовая схема: stone + amber-900 акценты, `#FAF9F7` фон
- `"use client"` только там, где нужен state/effect (ReaderLayout, Sidebar, и пр.)

## Коммиты

Без `Co-Authored-By` строк.

## Ретроспектива сессии

Перед финальным ответом после длинной или существенной сессии проверь `research/codex-retrospective.md`: кратко оцени, нужно ли улучшить инструкции, скрипты, данные или рабочие заметки. Если пользователь пишет кодовое слово `Ретроспектива`, запусти этот протокол явно. Вноси изменения только когда есть конкретная повторяемая проблема или явно полезное уточнение; не раздувай правила ради правил.

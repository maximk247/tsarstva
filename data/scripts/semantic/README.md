# Semantic search pipeline

Офлайн-пайплайн для поиска возможных параллельных мест по смысловой близости русского текста.

## Быстрый старт

Рекомендуется отдельное Python-окружение: `FlagEmbedding`, `torch` и модельные зависимости тяжёлые.

```bash
python -m venv .venv-semantic
.venv-semantic\Scripts\python -m pip install -r data/scripts/semantic/requirements.txt
```

```bash
bun run --filter @tsarstva/data semantic:corpus
bun run --filter @tsarstva/data semantic:embed
bun run --filter @tsarstva/data semantic:candidates
```

По умолчанию корпус строится по `READER_BOOKS`, один документ = один стих.

## Файлы

- `data/json/search/semantic-corpus.json` — производный корпус для embeddings.
- `data/json/search/semantic-vectors.bge-m3.f16.bin` — бинарный файл нормализованных векторов.
- `data/json/search/semantic-vectors.bge-m3.meta.json` — порядок документов, размерность и параметры модели.
- `data/json/cross-refs/candidates.semantic.json` — машинные кандидаты, требующие ручной проверки.

Эти файлы генерируются локально и не должны редактироваться вручную.

Команда `semantic:corpus` всегда перезаписывает текущий корпус. После тестов с `--chapters` заново запусти `bun run --filter @tsarstva/data semantic:corpus`, если следующий прогон должен идти по полному `READER_BOOKS`.

## Полезные варианты

Добавить окна по 3 стиха:

```bash
bun run --filter @tsarstva/data semantic:corpus -- --windows=1,3
```

Сделать быстрый smoke-test embeddings только на первых 50 документах:

```bash
bun run --filter @tsarstva/data semantic:embed -- --limit=50
bun run --filter @tsarstva/data semantic:candidates -- --from-limit=20 --max-total=50
```

Искать кандидатов только из книг Царств:

```bash
bun run --filter @tsarstva/data semantic:candidates -- --from-books=1sm,2sm,1kgs,2kgs
```

Проверить короткий известный параллельный эпизод без полного корпуса:

```bash
bun run --filter @tsarstva/data semantic:corpus -- --chapters=1sm:31,1ch:10
bun run --filter @tsarstva/data semantic:embed
bun run --filter @tsarstva/data semantic:candidates -- --min-score=0.6
```

## Модель

Основной вариант — `BAAI/bge-m3`. Скрипт использует `FlagEmbedding`, сохраняет dense embeddings и нормализует их для cosine similarity.

Для `next export` модель не попадает во фронтенд: она нужна только для предвычисления кандидатов и будущих статических индексов.

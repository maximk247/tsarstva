from __future__ import annotations

import argparse
import json
import math
import re
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRIPT_DIR.parents[1]
SEARCH_DIR = DATA_DIR / "json" / "search"
CROSS_REFS_DIR = DATA_DIR / "json" / "cross-refs"
DEFAULT_CORPUS = SEARCH_DIR / "semantic-corpus.json"
DEFAULT_META = SEARCH_DIR / "semantic-vectors.bge-m3.meta.json"
DEFAULT_OUT = CROSS_REFS_DIR / "candidates.semantic.json"
DEFAULT_EXISTING = [
    CROSS_REFS_DIR / "manual.json",
    CROSS_REFS_DIR / "candidates.json",
]

TOKEN_RE = re.compile(r"[0-9A-Za-zА-Яа-яЁё]+")
STOPWORDS = {
    "а",
    "без",
    "бы",
    "был",
    "была",
    "были",
    "было",
    "в",
    "во",
    "вот",
    "все",
    "и",
    "из",
    "или",
    "им",
    "к",
    "как",
    "ко",
    "на",
    "не",
    "но",
    "о",
    "об",
    "он",
    "она",
    "они",
    "от",
    "по",
    "с",
    "со",
    "то",
    "у",
    "что",
    "это",
    "я",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Generate semantic cross-reference candidates from embeddings."
    )
    parser.add_argument("--corpus", type=Path, default=DEFAULT_CORPUS)
    parser.add_argument("--meta", type=Path, default=DEFAULT_META)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--from-window", type=int, default=1)
    parser.add_argument("--target-window", type=int, default=1)
    parser.add_argument("--top-k", type=int, default=5)
    parser.add_argument("--pool-size", type=int, default=120)
    parser.add_argument("--min-score", type=float, default=0.72)
    parser.add_argument("--semantic-weight", type=float, default=0.85)
    parser.add_argument("--from-limit", type=int, default=0)
    parser.add_argument("--max-total", type=int, default=1500)
    parser.add_argument("--from-books", default="")
    parser.add_argument("--allow-same-book", action="store_true")
    parser.add_argument("--include-existing", action="store_true")
    return parser.parse_args()


def load_json(path: Path):
    with path.open("r", encoding="utf8") as file:
        return json.load(file)


def ref_of(doc: dict) -> str:
    return f"{doc['book']}:{doc['chapter']}:{doc['verse']}"


def to_end(doc: dict):
    verse = int(doc["verse"])
    verse_end = int(doc.get("verseEnd") or verse)
    if verse_end != verse:
        return verse_end
    return None


def tokens(text: str) -> set[str]:
    return {
        token
        for token in (match.group(0).lower() for match in TOKEN_RE.finditer(text))
        if len(token) > 1 and token not in STOPWORDS
    }


def lexical_score(left: set[str], right: set[str]) -> float:
    if not left or not right:
        return 0.0
    return len(left & right) / math.sqrt(len(left) * len(right))


def same_location(left: dict, right: dict) -> bool:
    if left["book"] != right["book"] or left["chapter"] != right["chapter"]:
        return False
    left_start = int(left["verse"])
    left_end = int(left.get("verseEnd") or left_start)
    right_start = int(right["verse"])
    right_end = int(right.get("verseEnd") or right_start)
    return max(left_start, right_start) <= min(left_end, right_end)


def existing_pairs(paths: list[Path]) -> set[tuple[str, str]]:
    pairs = set()
    for path in paths:
        if not path.exists():
            continue
        data = load_json(path)
        for entry in data.get("refs", []):
            from_ref = entry.get("from")
            to_ref = entry.get("to")
            if isinstance(from_ref, str) and isinstance(to_ref, str):
                pairs.add((from_ref, to_ref))
                pairs.add((to_ref, from_ref))
    return pairs


def load_vectors(meta: dict):
    import numpy as np

    vector_path = Path(meta["vectorPath"])
    if not vector_path.is_absolute():
        vector_path = Path.cwd() / vector_path
    dtype = np.float16 if meta["dtype"] == "float16" else np.float32
    vectors = np.fromfile(vector_path, dtype=dtype)
    vectors = vectors.reshape((int(meta["count"]), int(meta["dim"]))).astype(np.float32)
    if not meta.get("normalized"):
        norms = np.linalg.norm(vectors, axis=1, keepdims=True)
        vectors = vectors / np.clip(norms, 1e-12, None)
    return vectors


def main() -> int:
    args = parse_args()

    import numpy as np

    corpus = load_json(args.corpus)
    meta = load_json(args.meta)
    vectors = load_vectors(meta)
    docs_by_id = {doc["id"]: doc for doc in corpus["docs"]}
    vector_docs = [docs_by_id[doc_id] for doc_id in meta["docIds"]]

    from_books = {item.strip() for item in args.from_books.split(",") if item.strip()}
    from_indices = [
        index
        for index, doc in enumerate(vector_docs)
        if int(doc["window"]) == args.from_window
        and (not from_books or doc["book"] in from_books)
    ]
    if args.from_limit > 0:
        from_indices = from_indices[: args.from_limit]

    target_indices = [
        index
        for index, doc in enumerate(vector_docs)
        if int(doc["window"]) == args.target_window
    ]

    if not from_indices:
        raise ValueError("No source docs matched --from-window/--from-books")
    if not target_indices:
        raise ValueError("No target docs matched --target-window")

    target_vectors = vectors[target_indices].T
    token_cache = {doc["id"]: tokens(doc["text"]) for doc in vector_docs}
    known_pairs = set() if args.include_existing else existing_pairs(DEFAULT_EXISTING)
    semantic_weight = max(0.0, min(1.0, args.semantic_weight))
    lexical_weight = 1.0 - semantic_weight
    refs = []

    for ordinal, from_index in enumerate(from_indices, start=1):
        from_doc = vector_docs[from_index]
        raw_scores = vectors[from_index] @ target_vectors
        pool_size = min(max(args.pool_size, args.top_k), raw_scores.shape[0])
        pool = np.argpartition(raw_scores, -pool_size)[-pool_size:]
        pool = pool[np.argsort(raw_scores[pool])[::-1]]

        added_for_source = 0
        for target_offset in pool:
            target_index = target_indices[int(target_offset)]
            target_doc = vector_docs[target_index]
            from_ref = ref_of(from_doc)
            target_ref = ref_of(target_doc)

            if same_location(from_doc, target_doc):
                continue
            if not args.allow_same_book and from_doc["book"] == target_doc["book"]:
                continue
            if (from_ref, target_ref) in known_pairs:
                continue

            semantic = float(raw_scores[target_offset])
            lexical = lexical_score(
                token_cache[from_doc["id"]],
                token_cache[target_doc["id"]],
            )
            score = semantic_weight * semantic + lexical_weight * lexical
            if score < args.min_score:
                continue

            entry = {
                "from": from_ref,
                "to": target_ref,
                "theme": "tsk",
                "note": f"semantic candidate: {from_doc['label']} -> {target_doc['label']}",
                "score": round(score, 6),
                "semanticScore": round(semantic, 6),
                "lexicalScore": round(lexical, 6),
                "model": meta["model"],
                "fromLabel": from_doc["label"],
                "toLabel": target_doc["label"],
                "fromText": from_doc["text"],
                "toText": target_doc["text"],
                "targetWindow": int(target_doc["window"]),
            }
            end = to_end(target_doc)
            if end is not None:
                entry["toEnd"] = end

            refs.append(entry)
            known_pairs.add((from_ref, target_ref))
            known_pairs.add((target_ref, from_ref))
            added_for_source += 1

            if added_for_source >= args.top_k or len(refs) >= args.max_total:
                break

        if ordinal % 250 == 0:
            print(f"searched {ordinal}/{len(from_indices)} sources; candidates: {len(refs)}")
        if len(refs) >= args.max_total:
            break

    output = {
        "note": (
            "Machine-generated semantic candidates. Review manually before copying "
            "entries into manual.json or candidates.json."
        ),
        "generatedBy": "data/scripts/semantic/generate-candidates.py",
        "model": meta["model"],
        "corpusPath": str(args.corpus.as_posix()),
        "vectorMetaPath": str(args.meta.as_posix()),
        "refs": refs,
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf8") as file:
        json.dump(output, file, ensure_ascii=False, indent=2)
        file.write("\n")

    print(f"semantic candidates written: {args.out} ({len(refs)} refs)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

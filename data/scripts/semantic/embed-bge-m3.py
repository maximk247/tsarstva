from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


SCRIPT_DIR = Path(__file__).resolve().parent
DATA_DIR = SCRIPT_DIR.parents[1]
SEARCH_DIR = DATA_DIR / "json" / "search"
DEFAULT_CORPUS = SEARCH_DIR / "semantic-corpus.json"
DEFAULT_VECTORS = SEARCH_DIR / "semantic-vectors.bge-m3.f16.bin"
DEFAULT_META = SEARCH_DIR / "semantic-vectors.bge-m3.meta.json"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Embed the read_kings semantic corpus with BAAI/bge-m3."
    )
    parser.add_argument("--corpus", type=Path, default=DEFAULT_CORPUS)
    parser.add_argument("--vectors", type=Path, default=DEFAULT_VECTORS)
    parser.add_argument("--meta", type=Path, default=DEFAULT_META)
    parser.add_argument("--model", default="BAAI/bge-m3")
    parser.add_argument("--batch-size", type=int, default=12)
    parser.add_argument("--max-length", type=int, default=512)
    parser.add_argument("--limit", type=int, default=0, help="Embed only first N docs.")
    parser.add_argument(
        "--dtype",
        choices=["float16", "float32"],
        default="float16",
        help="Storage dtype for the vector file.",
    )
    parser.add_argument(
        "--use-fp16",
        action="store_true",
        help="Ask FlagEmbedding to use fp16 inference. Usually useful on GPU.",
    )
    return parser.parse_args()


def load_corpus(path: Path, limit: int) -> list[dict]:
    with path.open("r", encoding="utf8") as file:
        corpus = json.load(file)
    docs = corpus.get("docs")
    if not isinstance(docs, list):
        raise ValueError(f"{path}: expected docs array")
    if limit > 0:
        return docs[:limit]
    return docs


def batched(items: list[str], size: int):
    for index in range(0, len(items), size):
        yield index, items[index : index + size]


def main() -> int:
    args = parse_args()

    try:
        import numpy as np
        from FlagEmbedding import BGEM3FlagModel
    except ImportError as error:
        print(
            "Missing semantic embedding dependencies.\n"
            "Install them with:\n"
            "  python -m pip install -r data/scripts/semantic/requirements.txt",
            file=sys.stderr,
        )
        print(f"\nOriginal import error: {error}", file=sys.stderr)
        return 1

    docs = load_corpus(args.corpus, args.limit)
    if not docs:
        raise ValueError(f"{args.corpus}: no docs to embed")

    texts = [doc["text"] for doc in docs]
    model = BGEM3FlagModel(args.model, use_fp16=args.use_fp16)
    vector_batches = []

    for start, batch in batched(texts, args.batch_size):
        output = model.encode(
            batch,
            batch_size=args.batch_size,
            max_length=args.max_length,
            return_dense=True,
            return_sparse=False,
            return_colbert_vecs=False,
        )
        dense = output["dense_vecs"] if isinstance(output, dict) else output
        vectors = np.asarray(dense, dtype=np.float32)
        norms = np.linalg.norm(vectors, axis=1, keepdims=True)
        vectors = vectors / np.clip(norms, 1e-12, None)
        vector_batches.append(vectors)
        print(f"embedded {min(start + len(batch), len(texts))}/{len(texts)}")

    all_vectors = np.vstack(vector_batches)
    stored_vectors = all_vectors.astype(np.float16 if args.dtype == "float16" else np.float32)

    args.vectors.parent.mkdir(parents=True, exist_ok=True)
    stored_vectors.tofile(args.vectors)

    meta = {
        "schemaVersion": 1,
        "model": args.model,
        "corpusPath": str(args.corpus.as_posix()),
        "vectorPath": str(args.vectors.as_posix()),
        "dtype": args.dtype,
        "dim": int(all_vectors.shape[1]),
        "count": int(all_vectors.shape[0]),
        "normalized": True,
        "maxLength": args.max_length,
        "docIds": [doc["id"] for doc in docs],
    }

    args.meta.parent.mkdir(parents=True, exist_ok=True)
    with args.meta.open("w", encoding="utf8") as file:
        json.dump(meta, file, ensure_ascii=False, indent=2)
        file.write("\n")

    print(f"vectors written: {args.vectors}")
    print(f"metadata written: {args.meta}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

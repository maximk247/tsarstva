"use client";

import Link from "next/link";
import type { MouseEvent } from "react";
import { cn } from "@/shared/utils/cn";
import { getHighlightedSegments, type SearchResultSet } from "../utils/search";

interface Props {
  resultSet: SearchResultSet;
  className?: string;
  onResultClick?: (
    result: SearchResultSet["items"][number],
    event: MouseEvent<HTMLAnchorElement>,
  ) => void;
}

export default function SearchResultList({
  resultSet,
  className,
  onResultClick,
}: Props) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {resultSet.items.map((result) => (
        <Link
          key={`${result.book}:${result.chapter}:${result.verse}`}
          href={`/read/${result.book}/${result.chapter}#v${result.verse}`}
          onClick={(event) => onResultClick?.(result, event)}
          className="group rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:border-amber-400 hover:bg-[var(--hover)] dark:bg-stone-900 dark:hover:bg-stone-800"
        >
          <p className="mb-2 font-sans text-sm font-semibold text-amber-900 dark:text-amber-400">
            {result.label}
          </p>
          <p className="font-serif text-lg leading-relaxed text-[var(--reader-text)]">
            {getHighlightedSegments(result.text, resultSet.terms).map(
              (segment, index) =>
                segment.isMatch ? (
                  <mark
                    key={index}
                    className="rounded-sm bg-amber-200 px-0.5 text-inherit dark:bg-amber-700/45"
                  >
                    {segment.text}
                  </mark>
                ) : (
                  <span key={index}>{segment.text}</span>
                ),
            )}
          </p>
        </Link>
      ))}
    </div>
  );
}

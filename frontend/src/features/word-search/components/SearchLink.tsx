"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { MouseEvent } from "react";
import { cn } from "@/shared/utils/cn";
import { navigateWithSearchTransition } from "../utils/searchTransition";

interface Props {
  className?: string;
  onSearchOpen?: () => void;
}

export default function SearchLink({ className, onSearchOpen }: Props) {
  const router = useRouter();
  const linkClassName = cn(
    "flex h-8 w-8 items-center justify-center rounded-md text-stone-500 transition-colors hover:bg-[var(--hover)] hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100",
    className,
  );

  if (onSearchOpen) {
    return (
      <button
        type="button"
        aria-label="Поиск"
        title="Поиск"
        onClick={onSearchOpen}
        className={linkClassName}
      >
        <Search size={16} />
      </button>
    );
  }

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    navigateWithSearchTransition(router, "/search");
  };

  return (
    <Link
      href="/search"
      aria-label="Поиск"
      title="Поиск"
      onClick={handleClick}
      className={linkClassName}
    >
      <Search size={16} />
    </Link>
  );
}

"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { cn } from "@/shared/utils/cn";
import { navigateWithSearchTransition } from "../utils/searchTransition";

type SearchBoxSize = "regular" | "compact";

interface Props {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  size?: SearchBoxSize;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  onValueChange?: (value: string) => void;
  onSubmit?: (query: string) => void;
}

export default function SearchBox({
  value,
  defaultValue = "",
  placeholder = "Слово или фраза",
  size = "regular",
  autoFocus = false,
  className,
  inputClassName,
  onValueChange,
  onSubmit,
}: Props) {
  const router = useRouter();
  const inputId = useId();
  const isControlled = value !== undefined;
  const [innerValue, setInnerValue] = useState(defaultValue);
  const currentValue = isControlled ? value : innerValue;

  useEffect(() => {
    if (!isControlled) setInnerValue(defaultValue);
  }, [defaultValue, isControlled]);

  const setSearchValue = (nextValue: string) => {
    if (!isControlled) setInnerValue(nextValue);
    onValueChange?.(nextValue);
  };

  const submitSearch = () => {
    const query = currentValue.trim();
    if (onSubmit) {
      onSubmit(query);
      return;
    }

    const href = query ? `/search?q=${encodeURIComponent(query)}` : "/search";
    navigateWithSearchTransition(router, href);
  };

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        submitSearch();
      }}
      className={cn(
        "flex min-w-0 items-center rounded-lg border border-[var(--border)] bg-[var(--card)] text-stone-800 shadow-sm transition-colors focus-within:border-amber-500 dark:bg-stone-900 dark:text-stone-100 dark:focus-within:border-amber-600",
        size === "regular" ? "h-12 px-2" : "h-9 px-1.5",
        className,
      )}
    >
      <label htmlFor={inputId} className="sr-only">
        Поиск
      </label>
      <button
        type="submit"
        aria-label="Найти"
        title="Найти"
        className={cn(
          "flex shrink-0 items-center justify-center rounded-md text-stone-500 transition-colors hover:bg-[var(--hover)] hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100",
          size === "regular" ? "h-8 w-8" : "h-7 w-7",
        )}
      >
        <Search size={size === "regular" ? 18 : 15} />
      </button>
      <input
        id={inputId}
        type="text"
        value={currentValue}
        autoFocus={autoFocus}
        autoComplete="off"
        onChange={(event) => setSearchValue(event.target.value)}
        placeholder={placeholder}
        className={cn(
          "min-w-0 flex-1 bg-transparent font-sans outline-none placeholder:text-[var(--muted-foreground)]",
          size === "regular" ? "px-2 text-base" : "px-1.5 text-sm",
          inputClassName,
        )}
      />
      {currentValue && (
        <button
          type="button"
          aria-label="Очистить"
          title="Очистить"
          onClick={() => setSearchValue("")}
          className={cn(
            "flex shrink-0 items-center justify-center rounded-md text-stone-400 transition-colors hover:bg-[var(--hover)] hover:text-stone-700 dark:hover:bg-stone-800 dark:hover:text-stone-100",
            size === "regular" ? "h-8 w-8" : "h-7 w-7",
          )}
        >
          <X size={size === "regular" ? 17 : 14} />
        </button>
      )}
    </form>
  );
}

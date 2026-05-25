"use client";

import { Settings } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { FontFamilySelector } from "@/features/font-family";
import { FontSizeControl } from "@/features/font-size";
import { ThemeToggle } from "@/features/theme-toggle";
import { cn } from "@/shared/utils/cn";

interface Props {
  className?: string;
  menuClassName?: string;
}

export default function ReaderSettingsMenu({ className, menuClassName }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const root = rootRef.current;
      if (!root || !(event.target instanceof Node)) return;
      if (!root.contains(event.target)) setIsOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-label="Открыть настройки"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls={menuId}
        title="Настройки"
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-150",
          "text-stone-500 hover:bg-[var(--hover)] hover:text-stone-800",
          "dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100",
          isOpen &&
            "bg-[var(--hover)] text-stone-800 dark:bg-stone-800 dark:text-stone-100",
        )}
      >
        <Settings size={16} strokeWidth={1.8} />
      </button>

      {isOpen && (
        <div
          id={menuId}
          role="dialog"
          aria-label="Настройки чтения"
          className={cn(
            "absolute right-0 top-full z-40 mt-2 w-52 max-w-[calc(100vw-1.5rem)] rounded-md border border-[var(--border)] bg-[var(--card)] p-3 shadow-lg shadow-stone-950/10 dark:border-stone-700 dark:bg-stone-950 dark:shadow-black/30",
            menuClassName,
          )}
        >
          <div className="space-y-3">
            <FontFamilySelector />

            <div className="flex items-center justify-between gap-3">
              <span className="shrink-0 font-sans text-[10px] uppercase tracking-widest text-[var(--sidebar-left-muted)] dark:text-stone-500">
                Размер
              </span>
              <FontSizeControl />
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="shrink-0 font-sans text-[10px] uppercase tracking-widest text-[var(--sidebar-left-muted)] dark:text-stone-500">
                Тема
              </span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

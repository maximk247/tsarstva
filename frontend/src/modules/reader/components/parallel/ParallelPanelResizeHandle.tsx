"use client";

import type {
  KeyboardEvent as ReactKeyboardEvent,
  PointerEvent as ReactPointerEvent,
} from "react";

interface Props {
  onPointerDown: (event: ReactPointerEvent<HTMLDivElement>) => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
}

export default function ParallelPanelResizeHandle({
  onPointerDown,
  onKeyDown,
}: Props) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      aria-label="Изменить высоту панели параллелей"
      tabIndex={0}
      className="group lg:hidden sticky top-0 z-10 flex min-h-10 justify-center border-y border-[var(--border)] bg-[var(--sidebar)] py-3 cursor-ns-resize touch-none select-none outline-none transition-colors dark:border-stone-700 dark:bg-stone-950/50 focus-visible:ring-2 focus-visible:ring-amber-900/25 dark:focus-visible:ring-amber-400/30"
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
    >
      <div className="h-2 w-20 rounded-full bg-stone-400/80 shadow-[0_0_0_1px_rgba(120,113,108,0.18)] transition-colors group-active:bg-amber-900/70 dark:bg-stone-500 dark:shadow-[0_0_0_1px_rgba(214,211,209,0.14)] dark:group-active:bg-amber-700" />
    </div>
  );
}

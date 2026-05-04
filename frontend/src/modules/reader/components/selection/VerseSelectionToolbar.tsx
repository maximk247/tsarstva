"use client";

import { Check, Copy, X } from "lucide-react";
import { createPortal } from "react-dom";
import type { TooltipPosition } from "../../model/useVerseSelection";

interface Props {
  visible: boolean;
  tooltipPos: TooltipPosition;
  tooltipLabel: string;
  copied: boolean;
  onCopy: () => void;
  onClear: () => void;
}

export default function VerseSelectionToolbar({
  visible,
  tooltipPos,
  tooltipLabel,
  copied,
  onCopy,
  onClear,
}: Props) {
  if (!visible || tooltipPos === null) return null;

  return createPortal(
    <div
      className="fixed z-[9999] flex items-center gap-0.5 rounded-2xl p-1 shadow-2xl select-none bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
      style={
        tooltipPos === "bottom"
          ? {
              bottom: "1.5rem",
              left: "50%",
              transform: "translateX(-50%)",
            }
          : {
              top: tooltipPos.y,
              left: tooltipPos.left,
              transform: "translateY(-50%)",
            }
      }
    >
      <span className="px-2.5 text-xs font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap">
        {tooltipLabel}
      </span>
      <button
        onClick={onCopy}
        title="Копировать"
        className="cursor-pointer p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-stone-700 dark:text-stone-200"
      >
        {copied ? <Check size={15} /> : <Copy size={15} strokeWidth={1.5} />}
      </button>
      <button
        onClick={onClear}
        title="Снять выделение"
        className="cursor-pointer p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-stone-400 dark:text-stone-500"
      >
        <X size={13} strokeWidth={2} />
      </button>
    </div>,
    document.body,
  );
}

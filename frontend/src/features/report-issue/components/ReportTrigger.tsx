"use client";

import { Flag } from "lucide-react";
import { cn } from "@/shared/utils/cn";

interface Props {
  label: string;
  className?: string;
  onOpen: () => void;
}

export default function ReportTrigger({ label, className, onOpen }: Props) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onOpen();
      }}
      title={`Сообщить об ошибке в ${label}`}
      className={cn(
        "inline-flex items-center justify-center w-5 h-5 rounded",
        "text-stone-300 hover:text-red-400 dark:text-stone-600 dark:hover:text-red-400 transition-colors",
        className,
      )}
    >
      <Flag size={13} strokeWidth={1.6} />
    </button>
  );
}

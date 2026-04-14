"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shared/lib/cn";

// Создай форму на formspree.io и вставь ID сюда
const FORMSPREE_ID = "mqewaqek";

const CATEGORIES: Record<"verse" | "parallel", string[]> = {
  verse: ["Пунктуация / пробелы", "Неточный перевод", "Другое"],
  parallel: ["Пунктуация / пробелы", "Неточный перевод", "Неверная параллель", "Другое"],
};

interface Props {
  type: "verse" | "parallel";
  reference: string;
  parallelRef?: string;
  parallelText?: string;
  className?: string;
}

export default function ReportButton({ type, reference, parallelRef, parallelText, className }: Props) {
  const [open, setOpen] = useState(false);
  const [problem, setProblem] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(closeTimerRef.current), []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setStatus("idle");
    setProblem("");
    setSelected([]);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, handleClose]);

  const toggleCategory = (cat: string) =>
    setSelected((prev) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: type === "verse"
            ? `[Стих] ${reference}`
            : `[Параллель] ${reference} → ${parallelRef}`,
          _gotcha: "",
          type: type === "verse" ? "Стих" : "Параллель",
          reference,
          ...(parallelRef && { parallel: parallelRef }),
          ...(parallelText && { parallel_text: parallelText }),
          categories: selected.join(", ") || "не указано",
          problem,
        }),
      });
      if (res.ok) {
        setStatus("sent");
        closeTimerRef.current = setTimeout(handleClose, 2000);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (!FORMSPREE_ID) return null;

  const label = type === "verse" ? "стихе" : "параллели";

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        title={`Сообщить об ошибке в ${label}`}
        className={cn(
          "inline-flex items-center justify-center w-5 h-5 rounded",
          "text-stone-300 hover:text-red-400 dark:text-stone-600 dark:hover:text-red-400 transition-colors",
          className,
        )}
      >
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="14" x2="3" y2="2" />
          <path d="M3 2l10 3.5-10 3.5z" />
        </svg>
      </button>

      {open && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          onClick={handleClose}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-[#E1DDD8] dark:border-stone-700 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Заголовок */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h2 className="font-sans font-semibold text-stone-800 dark:text-stone-100 text-base">
                Сообщить об ошибке
              </h2>
              <button
                type="button"
                onClick={handleClose}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors p-1 rounded-lg"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 4l8 8M12 4l-8 8" />
                </svg>
              </button>
            </div>

            {/* Ссылка */}
            <div className="px-5 pb-3">
              <p className="font-sans text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-0.5">
                {type === "verse" ? "Стих" : "Параллель"}
              </p>
              <p className="font-sans text-sm font-medium text-stone-700 dark:text-stone-200">
                {type === "verse" ? reference : `${reference} → ${parallelRef}`}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4">
              {/* Категории */}
              <div>
                <p className="font-sans text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">
                  Категория
                </p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES[type].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={cn(
                        "font-sans text-xs px-2.5 py-1 rounded-full border transition-colors",
                        selected.includes(cat)
                          ? "bg-amber-600 border-amber-600 text-white"
                          : "border-[#E1DDD8] dark:border-stone-600 text-stone-500 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500",
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Описание */}
              <div>
                <label className="font-sans text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2 block">
                  Описание
                </label>
                <textarea
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                  required
                  rows={3}
                  placeholder="Опишите проблему…"
                  className="w-full font-sans text-sm rounded-lg border border-[#E1DDD8] dark:border-stone-600 bg-[#FAF9F7] dark:bg-stone-800 text-stone-700 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-600 px-3 py-2 resize-none focus:outline-none focus:border-amber-400 dark:focus:border-amber-600 transition-colors"
                />
              </div>

              {/* Кнопки */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 font-sans text-sm py-2 rounded-xl border border-[#E1DDD8] dark:border-stone-600 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  disabled={status === "sending" || status === "sent"}
                  className="flex-1 font-sans text-sm py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {status === "sending" ? "Отправка…" : status === "sent" ? "Отправлено ✓" : "Отправить"}
                </button>
              </div>

              {status === "error" && (
                <p className="font-sans text-xs text-red-500 text-center">
                  Ошибка отправки. Попробуйте ещё раз.
                </p>
              )}
            </form>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

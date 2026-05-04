"use client";

import { X } from "lucide-react";
import { createPortal } from "react-dom";
import type { FormEvent } from "react";
import { cn } from "@/shared/lib/cn";
import {
  REPORT_CATEGORIES,
  type ReportStatus,
  type ReportType,
} from "../config/report";

interface ReportFormProps {
  problem: string;
  selected: string[];
  status: ReportStatus;
  setProblem: (value: string) => void;
  toggleCategory: (category: string) => void;
  submit: (event: FormEvent<HTMLFormElement>) => void;
}

interface Props {
  type: ReportType;
  reference: string;
  parallelRef?: string;
  reportForm: ReportFormProps;
  onClose: () => void;
}

export default function ReportDialog({
  type,
  reference,
  parallelRef,
  reportForm,
  onClose,
}: Props) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-stone-900 rounded-2xl shadow-2xl border border-[#E1DDD8] dark:border-stone-700 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <h2 className="font-sans font-semibold text-stone-800 dark:text-stone-100 text-base">
            Сообщить об ошибке
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 transition-colors p-1 rounded-lg"
          >
            <X size={14} strokeWidth={2} />
          </button>
        </div>

        <div className="px-5 pb-3">
          <p className="font-sans text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-0.5">
            {type === "verse" ? "Стих" : "Параллель"}
          </p>
          <p className="font-sans text-sm font-medium text-stone-700 dark:text-stone-200">
            {type === "verse" ? reference : `${reference} → ${parallelRef}`}
          </p>
        </div>

        <form onSubmit={reportForm.submit} className="px-5 pb-5 space-y-4">
          <div>
            <p className="font-sans text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2">
              Категория
            </p>
            <div className="flex flex-wrap gap-2">
              {REPORT_CATEGORIES[type].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => reportForm.toggleCategory(cat)}
                  className={cn(
                    "font-sans text-xs px-2.5 py-1 rounded-full border transition-colors",
                    reportForm.selected.includes(cat)
                      ? "bg-amber-600 border-amber-600 text-white"
                      : "border-[#E1DDD8] dark:border-stone-600 text-stone-500 dark:text-stone-400 hover:border-stone-400 dark:hover:border-stone-500",
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="font-sans text-xs text-stone-400 dark:text-stone-500 uppercase tracking-wider mb-2 block">
              Описание
            </label>
            <textarea
              value={reportForm.problem}
              onChange={(e) => reportForm.setProblem(e.target.value)}
              required
              rows={3}
              placeholder="Опишите проблему…"
              className="w-full font-sans text-sm rounded-lg border border-[#E1DDD8] dark:border-stone-600 bg-[#FAF9F7] dark:bg-stone-800 text-stone-700 dark:text-stone-200 placeholder:text-stone-300 dark:placeholder:text-stone-600 px-3 py-2 resize-none focus:outline-none focus:border-amber-400 dark:focus:border-amber-600 transition-colors"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 font-sans text-sm py-2 rounded-xl border border-[#E1DDD8] dark:border-stone-600 text-stone-500 dark:text-stone-400 hover:bg-stone-50 dark:hover:bg-stone-800 transition-colors"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={
                reportForm.status === "sending" || reportForm.status === "sent"
              }
              className="flex-1 font-sans text-sm py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {reportForm.status === "sending"
                ? "Отправка…"
                : reportForm.status === "sent"
                  ? "Отправлено ✓"
                  : "Отправить"}
            </button>
          </div>

          {reportForm.status === "error" && (
            <p className="font-sans text-xs text-red-500 text-center">
              Ошибка отправки. Попробуйте ещё раз.
            </p>
          )}
        </form>
      </div>
    </div>,
    document.body,
  );
}

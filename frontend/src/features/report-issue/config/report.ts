export type ReportType = "verse" | "parallel";
export type ReportStatus = "idle" | "sending" | "sent" | "error";

// Создай форму на formspree.io и вставь ID сюда
export const FORMSPREE_ID = "mqewaqek";

export const REPORT_CATEGORIES: Record<ReportType, string[]> = {
  verse: ["Пунктуация / пробелы", "Неточный перевод", "Другое"],
  parallel: [
    "Пунктуация / пробелы",
    "Неточный перевод",
    "Неверная параллель",
    "Другое",
  ],
};

import type { ReportType } from "../constants/report";

interface Params {
  type: ReportType;
  reference: string;
  parallelRef?: string;
  parallelText?: string;
  selected: string[];
  problem: string;
}

export function buildReportPayload({
  type,
  reference,
  parallelRef,
  parallelText,
  selected,
  problem,
}: Params) {
  return {
    _subject:
      type === "verse"
        ? `[Стих] ${reference}`
        : `[Параллель] ${reference} → ${parallelRef}`,
    _gotcha: "",
    type: type === "verse" ? "Стих" : "Параллель",
    reference,
    ...(parallelRef && { parallel: parallelRef }),
    ...(parallelText && { parallel_text: parallelText }),
    categories: selected.join(", ") || "не указано",
    problem,
  };
}

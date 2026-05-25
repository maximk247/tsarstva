const KEY = "reading-progress";
const CURRENT_PROGRESS_KEY = "reading-current-progress";

export const READING_CURRENT_PROGRESS_UPDATED_EVENT =
  "reading-current-progress-updated";

export interface Progress {
  [bookChapter: string]: true;
}

export interface CurrentReadingProgress {
  book: string;
  chapter: number;
  scrollTop: number;
  scrollRatio: number;
  updatedAt: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isCurrentReadingProgress(
  value: unknown,
): value is CurrentReadingProgress {
  if (!isRecord(value)) return false;

  return (
    typeof value.book === "string" &&
    typeof value.chapter === "number" &&
    Number.isInteger(value.chapter) &&
    value.chapter > 0 &&
    typeof value.scrollTop === "number" &&
    Number.isFinite(value.scrollTop) &&
    value.scrollTop >= 0 &&
    typeof value.scrollRatio === "number" &&
    Number.isFinite(value.scrollRatio) &&
    value.scrollRatio >= 0 &&
    value.scrollRatio <= 1 &&
    typeof value.updatedAt === "number" &&
    Number.isFinite(value.updatedAt)
  );
}

export function getProgress(): Progress {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function markRead(book: string, chapter: number): void {
  const progress = getProgress();
  progress[`${book}:${chapter}`] = true;
  localStorage.setItem(KEY, JSON.stringify(progress));
  window.dispatchEvent(new Event("reading-progress-updated"));
}

export function unmarkRead(book: string, chapter: number): void {
  const progress = getProgress();
  delete progress[`${book}:${chapter}`];
  localStorage.setItem(KEY, JSON.stringify(progress));
  window.dispatchEvent(new Event("reading-progress-updated"));
}

export function isRead(book: string, chapter: number): boolean {
  return !!getProgress()[`${book}:${chapter}`];
}

export function getCurrentProgress(): CurrentReadingProgress | null {
  if (typeof window === "undefined") return null;

  try {
    const rawValue = localStorage.getItem(CURRENT_PROGRESS_KEY);
    if (!rawValue) return null;

    const parsedValue: unknown = JSON.parse(rawValue);
    return isCurrentReadingProgress(parsedValue) ? parsedValue : null;
  } catch {
    return null;
  }
}

export function saveCurrentProgress(
  progress: Omit<CurrentReadingProgress, "updatedAt"> & {
    updatedAt?: number;
  },
): void {
  if (typeof window === "undefined") return;

  const nextProgress: CurrentReadingProgress = {
    ...progress,
    scrollTop: Math.max(0, progress.scrollTop),
    scrollRatio: Math.min(1, Math.max(0, progress.scrollRatio)),
    updatedAt: progress.updatedAt ?? Date.now(),
  };

  localStorage.setItem(CURRENT_PROGRESS_KEY, JSON.stringify(nextProgress));
  window.dispatchEvent(new Event(READING_CURRENT_PROGRESS_UPDATED_EVENT));
}

export function clearCurrentProgress(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem(CURRENT_PROGRESS_KEY);
  window.dispatchEvent(new Event(READING_CURRENT_PROGRESS_UPDATED_EVENT));
}

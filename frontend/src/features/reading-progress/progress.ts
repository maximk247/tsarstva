const KEY = "reading-progress";

export interface Progress {
  [bookChapter: string]: true;
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

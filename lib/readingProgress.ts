const KEY = "reading-progress";

export interface Progress {
  [bookChapter: string]: true; // e.g. "1kgs:3"
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
}

export function isRead(book: string, chapter: number): boolean {
  return !!getProgress()[`${book}:${chapter}`];
}

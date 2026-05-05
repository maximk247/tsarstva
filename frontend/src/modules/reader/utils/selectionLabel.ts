export function getSelectionLabel(
  selectedVerses: Set<number>,
  bookName: string,
  chapter: number,
) {
  if (selectedVerses.size === 0) return "";
  const sorted = Array.from(selectedVerses).sort((a, b) => a - b);
  const ranges: string[] = [];
  let start = sorted[0];
  let end = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === end + 1) {
      end = sorted[i];
    } else {
      ranges.push(start === end ? String(start) : `${start}–${end}`);
      start = sorted[i];
      end = sorted[i];
    }
  }

  ranges.push(start === end ? String(start) : `${start}–${end}`);
  return `${bookName} ${chapter}:${ranges.join(", ")}`;
}

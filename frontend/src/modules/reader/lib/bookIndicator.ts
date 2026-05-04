export interface IndicatorRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function areIndicatorRectsEqual(a: IndicatorRect, b: IndicatorRect) {
  return (
    a.top === b.top &&
    a.left === b.left &&
    a.width === b.width &&
    a.height === b.height
  );
}

export function getBookIndicatorRect(
  book: string,
  container: HTMLElement | null,
  links: Map<string, HTMLAnchorElement>,
) {
  const activeLink = links.get(book);

  if (!container || !activeLink) return null;

  const containerRect = container.getBoundingClientRect();
  const linkRect = activeLink.getBoundingClientRect();
  return {
    top: linkRect.top - containerRect.top + container.scrollTop,
    left: linkRect.left - containerRect.left + container.scrollLeft,
    width: linkRect.width,
    height: linkRect.height,
  };
}

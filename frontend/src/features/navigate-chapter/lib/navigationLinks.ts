import type { MouseEvent as ReactMouseEvent } from "react";
import type { ChapterNavigationIntent } from "../model/navigationIntent";

export function getChapterHref(target: ChapterNavigationIntent | null) {
  return target ? `/read/${target.book}/${target.chapter}` : "#";
}

export function shouldSkipDeferredNavigation(
  event: ReactMouseEvent<HTMLAnchorElement>,
) {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey
  );
}

"use client";

import { useEffect, type Dispatch, type SetStateAction } from "react";

export function useHashVerseScroll(
  setActiveVerse: Dispatch<SetStateAction<number | null>>,
) {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#v")) {
      const verse = parseInt(hash.slice(2));
      if (!isNaN(verse)) {
        setActiveVerse(verse);
        setTimeout(() => {
          document
            .getElementById(`v${verse}`)
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    }
  }, [setActiveVerse]);
}

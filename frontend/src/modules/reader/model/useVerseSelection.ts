"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from "react";
import type { Chapter } from "@tsarstva/data";
import { SELECTION_COPIED_RESET_DELAY_MS } from "../config/selection";
import { getSelectionLabel } from "../lib/selectionLabel";

export type TooltipPosition =
  | {
      y: number;
      left: number;
    }
  | "bottom"
  | null;

interface Params {
  bookName: string;
  chapter: number;
  verses: Chapter;
  scrollRef: RefObject<HTMLDivElement | null>;
}

export function useVerseSelection({
  bookName,
  chapter,
  verses,
  scrollRef,
}: Params) {
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<TooltipPosition>(null);
  const [mounted, setMounted] = useState(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const updatePosRafRef = useRef<number>(undefined);
  const dragValueRef = useRef<boolean | null>(null);

  useEffect(() => setMounted(true), []);

  const handleCheckStart = useCallback((v: number) => {
    document.body.style.userSelect = "none";
    setSelectedVerses((prev) => {
      const newValue = !prev.has(v);
      dragValueRef.current = newValue;
      const next = new Set(prev);
      if (newValue) next.add(v);
      else next.delete(v);
      return next;
    });
  }, []);

  useEffect(() => {
    let lastVerse: number | null = null;

    const onMove = (e: PointerEvent) => {
      const dragValue = dragValueRef.current;
      if (dragValue === null) return;
      const el = e.target instanceof Element ? e.target : null;
      const verseEl = el?.closest("[id^='v']");
      if (!verseEl) return;
      const match = verseEl.id.match(/^v(\d+)$/);
      if (!match) return;
      const v = parseInt(match[1]);
      if (v === lastVerse) return;
      lastVerse = v;
      setSelectedVerses((prev) => {
        const next = new Set(prev);
        if (dragValue) next.add(v);
        else next.delete(v);
        return next;
      });
    };

    const onUp = () => {
      dragValueRef.current = null;
      lastVerse = null;
      document.body.style.userSelect = "";
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, []);

  const handleCopy = useCallback(() => {
    const sorted = Array.from(selectedVerses).sort((a, b) => a - b);
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    const ref =
      sorted.length > 1
        ? `${bookName} ${chapter}:${first}–${last}`
        : `${bookName} ${chapter}:${first}`;
    const lines = sorted.map((v) => `${v} ${verses[v]}`);
    navigator.clipboard.writeText(`${ref}\n\n${lines.join("\n")}`);
    setCopied(true);
    clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = setTimeout(
      () => setCopied(false),
      SELECTION_COPIED_RESET_DELAY_MS,
    );
  }, [selectedVerses, verses, bookName, chapter]);

  useEffect(() => () => clearTimeout(copiedTimerRef.current), []);

  const clearSelection = useCallback(() => setSelectedVerses(new Set()), []);

  useEffect(() => {
    if (selectedVerses.size === 0) {
      setTooltipPos(null);
      return;
    }
    const lastVerse = Math.max(...Array.from(selectedVerses));
    const updatePos = () => {
      cancelAnimationFrame(updatePosRafRef.current!);
      updatePosRafRef.current = requestAnimationFrame(() => {
        const el = document.getElementById(`v${lastVerse}`);
        const container = scrollRef.current;
        if (el && container) {
          if (window.innerWidth < 1024) {
            setTooltipPos("bottom");
          } else {
            const elRect = el.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            setTooltipPos({
              y: elRect.top + elRect.height / 2,
              left: containerRect.right + 8,
            });
          }
        }
      });
    };
    updatePos();
    window.addEventListener("resize", updatePos, { passive: true });
    const container = scrollRef.current;
    container?.addEventListener("scroll", updatePos, { passive: true });
    return () => {
      cancelAnimationFrame(updatePosRafRef.current!);
      window.removeEventListener("resize", updatePos);
      container?.removeEventListener("scroll", updatePos);
    };
  }, [selectedVerses, scrollRef]);

  const tooltipLabel = useMemo(
    () => getSelectionLabel(selectedVerses, bookName, chapter),
    [selectedVerses, bookName, chapter],
  );

  const mainTextProps = useMemo(
    () => ({
      selectedVerses,
      onCheckStart: handleCheckStart,
    }),
    [handleCheckStart, selectedVerses],
  );
  const toolbarProps = useMemo(
    () => ({
      visible: mounted && selectedVerses.size > 0 && tooltipPos !== null,
      tooltipPos,
      tooltipLabel,
      copied,
      onCopy: handleCopy,
      onClear: clearSelection,
    }),
    [
      clearSelection,
      copied,
      handleCopy,
      mounted,
      selectedVerses.size,
      tooltipLabel,
      tooltipPos,
    ],
  );

  return {
    mainTextProps,
    toolbarProps,
  };
}

"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import MainText from "./MainText";
import ParallelPanel from "./ParallelPanel";
import type { PrecomputedParallel } from "@tsarstva/data";
import { cn } from "@/shared/lib/cn";

interface Props {
  book: string;
  chapter: number;
  verses: string[];
  bookName: string;
  parallelsMap: Record<number, PrecomputedParallel[]>;
}

export default function ReaderLayout({ book, chapter, verses, bookName, parallelsMap }: Props) {
  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{ y: number; left: number } | "bottom" | null>(null);
  const [mounted, setMounted] = useState(false);
  const [panelHeight, setPanelHeight] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const versesWithParallels = useMemo(
    () => new Set(Object.keys(parallelsMap).map(Number)),
    [parallelsMap]
  );

  const activeParallels = activeVerse !== null ? (parallelsMap[activeVerse] ?? []) : [];

  const handleVerseClick = useCallback((v: number) => {
    setActiveVerse((prev) => (prev === v ? null : v));
  }, []);

  const dragValueRef = useRef<boolean | null>(null);

  const handleCheckStart = useCallback((v: number) => {
    document.body.style.userSelect = "none";
    setSelectedVerses((prev) => {
      const newValue = !prev.has(v);
      dragValueRef.current = newValue;
      const next = new Set(prev);
      if (newValue) next.add(v); else next.delete(v);
      return next;
    });
  }, []);

  // Drag-select: зажал чекбокс и провёл по стихам
  useEffect(() => {
    let lastVerse: number | null = null;

    const onMove = (e: PointerEvent) => {
      const dv = dragValueRef.current;
      if (dv === null) return;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const verseEl = el?.closest("[id^='v']");
      if (!verseEl) return;
      const match = verseEl.id.match(/^v(\d+)$/);
      if (!match) return;
      const v = parseInt(match[1]);
      if (v === lastVerse) return;
      lastVerse = v;
      setSelectedVerses((prev) => {
        const next = new Set(prev);
        if (dv) next.add(v); else next.delete(v);
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
    const ref = sorted.length > 1 ? `${bookName} ${chapter}:${first}–${last}` : `${bookName} ${chapter}:${first}`;
    const lines = sorted.map((v) => `${v} ${verses[v - 1]}`);
    navigator.clipboard.writeText(`${ref}\n\n${lines.join("\n")}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [selectedVerses, verses, bookName, chapter]);

  const clearSelection = useCallback(() => setSelectedVerses(new Set()), []);

  useEffect(() => {
    if (selectedVerses.size === 0) {
      setTooltipPos(null);
      return;
    }
    const lastVerse = Math.max(...Array.from(selectedVerses));
    const updatePos = () => {
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
    };
    updatePos();
    window.addEventListener("resize", updatePos, { passive: true });
    const container = scrollRef.current;
    container?.addEventListener("scroll", updatePos, { passive: true });
    return () => {
      window.removeEventListener("resize", updatePos);
      container?.removeEventListener("scroll", updatePos);
    };
  }, [selectedVerses]);

  useEffect(() => {
    if (activeVerse === null) setPanelHeight(null);
  }, [activeVerse]);

  const handleResizeStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const startY = e.clientY;
    const startHeight = panelRef.current?.getBoundingClientRect().height ?? 300;
    const handle = e.currentTarget;

    const onMove = (moveE: PointerEvent) => {
      const dy = startY - moveE.clientY;
      const containerH = panelRef.current?.parentElement?.getBoundingClientRect().height ?? window.innerHeight;
      setPanelHeight(Math.max(80, Math.min(startHeight + dy, containerH - 80)));
    };
    const onUp = () => handle.removeEventListener("pointermove", onMove);
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp, { once: true });
    handle.addEventListener("pointercancel", onUp, { once: true });
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith("#v")) {
      const verse = parseInt(hash.slice(2));
      if (!isNaN(verse)) {
        setActiveVerse(verse);
        setTimeout(() => {
          document.getElementById(`v${verse}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 100);
      }
    }
  }, []);

  return (
    <div className="flex flex-col lg:flex-row gap-0 flex-1 overflow-hidden">
      <div ref={scrollRef} className="flex-1 min-w-0 px-4 sm:px-6 lg:px-8 py-6 overflow-y-auto bg-white dark:bg-transparent">
        <MainText
          verses={verses}
          versesWithParallels={versesWithParallels}
          activeVerse={activeVerse}
          selectedVerses={selectedVerses}
          onVerseClick={handleVerseClick}
          onCheckStart={handleCheckStart}
        />
      </div>

      <div className="hidden lg:block w-px bg-[#E1DDD8] dark:bg-stone-700 shrink-0" />

      <div
        ref={panelRef}
        className={cn(
          "shrink-0 overflow-y-auto border-t border-[#E1DDD8] dark:border-stone-700 lg:border-t-0 bg-[#F1EEE9] dark:bg-stone-950/50",
          "lg:w-96 xl:w-[440px]",
          activeVerse === null && "hidden lg:block"
        )}
        style={panelHeight !== null ? { height: panelHeight } : undefined}
      >
        {/* Ручка перетаскивания — только на мобиле */}
        <div
          className="lg:hidden sticky top-0 z-10 flex justify-center pt-3 pb-2 bg-[#F1EEE9] dark:bg-stone-950/50 cursor-ns-resize touch-none select-none"
          onPointerDown={handleResizeStart}
        >
          <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-stone-600" />
        </div>

        <div className="px-4 sm:px-6 pb-6 lg:py-6">
          <ParallelPanel
            refs={activeParallels}
            activeVerse={activeVerse}
            bookName={bookName}
            chapter={chapter}
          />
        </div>
      </div>

      {mounted && selectedVerses.size > 0 && tooltipPos !== null && createPortal(
        <div
          className="fixed z-[9999] flex items-center gap-0.5 rounded-2xl p-1 shadow-2xl select-none bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
          style={
            tooltipPos === "bottom"
              ? { bottom: "1.5rem", left: "50%", transform: "translateX(-50%)" }
              : { top: tooltipPos.y, left: tooltipPos.left, transform: "translateY(-50%)" }
          }
        >
          <span className="px-2.5 text-xs font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap">
            {(() => {
              const sorted = Array.from(selectedVerses).sort((a, b) => a - b);
              const ranges: string[] = [];
              let start = sorted[0], end = sorted[0];
              for (let i = 1; i < sorted.length; i++) {
                if (sorted[i] === end + 1) {
                  end = sorted[i];
                } else {
                  ranges.push(start === end ? String(start) : `${start}–${end}`);
                  start = end = sorted[i];
                }
              }
              ranges.push(start === end ? String(start) : `${start}–${end}`);
              return `${bookName} ${chapter}:${ranges.join(", ")}`;
            })()}
          </span>
          <button
            onClick={handleCopy}
            title="Копировать"
            className="cursor-pointer p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-stone-700 dark:text-stone-200"
          >
            {copied ? (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 8l4 4 6-7" />
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="5" width="9" height="9" rx="1.5" />
                <path d="M11 5V3.5A1.5 1.5 0 0 0 9.5 2H3.5A1.5 1.5 0 0 0 2 3.5V9.5A1.5 1.5 0 0 0 3.5 11H5" />
              </svg>
            )}
          </button>
          <button
            onClick={clearSelection}
            title="Снять выделение"
            className="cursor-pointer p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-stone-400 dark:text-stone-500"
          >
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l8 8M12 4l-8 8" />
            </svg>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

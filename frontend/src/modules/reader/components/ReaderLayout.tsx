"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import MainText from "./MainText";
import ParallelPanel from "./ParallelPanel";
import type { PrecomputedParallel, Chapter } from "@tsarstva/data";
import { cn } from "@/shared/lib/cn";
import {
  CHAPTER_NAVIGATION_COMMIT_DELAY_MS,
  CHAPTER_NAVIGATION_INTENT_EVENT,
  type ChapterNavigationIntent,
} from "@/features/navigate-chapter";

const EMPTY_PARALLELS: PrecomputedParallel[] = [];
const KEYBOARD_SCROLL_SPEED = 560;
const KEYBOARD_SCROLL_INITIAL_VELOCITY = 420;
const KEYBOARD_SCROLL_ACCELERATION = 18;
const KEYBOARD_SCROLL_DECELERATION = 10;
const KEYBOARD_SCROLL_MAX_FRAME = 0.05;
const KEYBOARD_SCROLL_MIN_VELOCITY = 2;
const PARALLEL_PANEL_MIN_HEIGHT = 80;
const PARALLEL_PANEL_RESIZE_KEYBOARD_STEP = 32;
const PARALLEL_PANEL_SWAP_DELAY_MS = Math.round(
  CHAPTER_NAVIGATION_COMMIT_DELAY_MS / 2,
);

type ScrollDirection = -1 | 0 | 1;

interface ParallelPanelSnapshot {
  refs: PrecomputedParallel[];
  activeVerse: number | null;
  bookName: string;
  chapter: number;
}

function getPanelSnapshotKey(
  book: string,
  chapter: number,
  activeVerse: number | null,
) {
  return `${book}:${chapter}:${activeVerse ?? "empty"}`;
}

interface Props {
  book: string;
  chapter: number;
  verses: Chapter;
  bookName: string;
  parallelsMap: Record<number, PrecomputedParallel[]>;
}

export default function ReaderLayout({
  book,
  chapter,
  verses,
  bookName,
  parallelsMap,
}: Props) {
  const [activeVerse, setActiveVerse] = useState<number | null>(null);
  const [selectedVerses, setSelectedVerses] = useState<Set<number>>(new Set());
  const [copied, setCopied] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<
    { y: number; left: number } | "bottom" | null
  >(null);
  const [mounted, setMounted] = useState(false);
  const [panelHeight, setPanelHeight] = useState<number | null>(null);
  const [isTextVisible, setIsTextVisible] = useState(false);
  const [isParallelPanelVisible, setIsParallelPanelVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const updatePosRafRef = useRef<number>(undefined);
  const textVisibilityRafRef = useRef<number>(undefined);
  const panelSwapTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const panelVisibilityRafRef = useRef<number>(undefined);
  const panelSnapshotKeyRef = useRef("");
  const keyboardScrollRafRef = useRef<number>(undefined);
  const keyboardScrollDirectionRef = useRef<ScrollDirection>(0);
  const keyboardScrollVelocityRef = useRef(0);
  const keyboardScrollLastFrameRef = useRef(0);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setIsTextVisible(false);
    cancelAnimationFrame(textVisibilityRafRef.current!);
    textVisibilityRafRef.current = requestAnimationFrame(() => {
      textVisibilityRafRef.current = requestAnimationFrame(() => {
        setIsTextVisible(true);
      });
    });

    return () => cancelAnimationFrame(textVisibilityRafRef.current!);
  }, [book, chapter]);

  useEffect(() => {
    const handleNavigationIntent = (event: Event) => {
      const target = (event as CustomEvent<ChapterNavigationIntent>).detail;
      if (!target || (target.book === book && target.chapter === chapter)) {
        return;
      }

      setIsTextVisible(false);
      setIsParallelPanelVisible(false);
    };

    window.addEventListener(
      CHAPTER_NAVIGATION_INTENT_EVENT,
      handleNavigationIntent,
    );
    return () => {
      window.removeEventListener(
        CHAPTER_NAVIGATION_INTENT_EVENT,
        handleNavigationIntent,
      );
    };
  }, [book, chapter]);

  const versesWithParallels = useMemo(
    () => new Set(Object.keys(parallelsMap).map(Number)),
    [parallelsMap],
  );

  const activeParallels = useMemo(
    () =>
      activeVerse !== null
        ? (parallelsMap[activeVerse] ?? EMPTY_PARALLELS)
        : EMPTY_PARALLELS,
    [activeVerse, parallelsMap],
  );
  const [parallelPanelSnapshot, setParallelPanelSnapshot] =
    useState<ParallelPanelSnapshot>(() => ({
      refs: activeParallels,
      activeVerse,
      bookName,
      chapter,
    }));

  useEffect(() => {
    const nextKey = getPanelSnapshotKey(book, chapter, activeVerse);
    const hadPreviousSnapshot = panelSnapshotKeyRef.current !== "";

    clearTimeout(panelSwapTimerRef.current);
    cancelAnimationFrame(panelVisibilityRafRef.current!);

    if (panelSnapshotKeyRef.current === nextKey) {
      setParallelPanelSnapshot({
        refs: activeParallels,
        activeVerse,
        bookName,
        chapter,
      });
      setIsParallelPanelVisible(true);
      return;
    }

    if (hadPreviousSnapshot) {
      setIsParallelPanelVisible(false);
    }

    panelSwapTimerRef.current = setTimeout(
      () => {
        panelSnapshotKeyRef.current = nextKey;
        setParallelPanelSnapshot({
          refs: activeParallels,
          activeVerse,
          bookName,
          chapter,
        });
        panelVisibilityRafRef.current = requestAnimationFrame(() => {
          panelVisibilityRafRef.current = requestAnimationFrame(() => {
            setIsParallelPanelVisible(true);
          });
        });
      },
      hadPreviousSnapshot ? PARALLEL_PANEL_SWAP_DELAY_MS : 0,
    );

    return () => {
      clearTimeout(panelSwapTimerRef.current);
      cancelAnimationFrame(panelVisibilityRafRef.current!);
    };
  }, [activeParallels, activeVerse, book, bookName, chapter]);

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
      if (newValue) next.add(v);
      else next.delete(v);
      return next;
    });
  }, []);

  // Drag-select: зажал чекбокс и провёл по стихам
  useEffect(() => {
    let lastVerse: number | null = null;

    const onMove = (e: PointerEvent) => {
      const dv = dragValueRef.current;
      if (dv === null) return;
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
        if (dv) next.add(v);
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
    copiedTimerRef.current = setTimeout(() => setCopied(false), 1500);
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
  }, [selectedVerses]);

  useEffect(() => {
    if (activeVerse === null) setPanelHeight(null);
  }, [activeVerse]);

  useEffect(() => {
    const isTypingTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      return (
        target.isContentEditable ||
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT"
      );
    };

    const animateScroll = (time: number) => {
      const container = scrollRef.current;
      if (!container) {
        keyboardScrollRafRef.current = undefined;
        keyboardScrollDirectionRef.current = 0;
        keyboardScrollVelocityRef.current = 0;
        keyboardScrollLastFrameRef.current = 0;
        return;
      }

      const deltaSeconds = Math.min(
        Math.max((time - keyboardScrollLastFrameRef.current) / 1000, 0),
        KEYBOARD_SCROLL_MAX_FRAME,
      );
      keyboardScrollLastFrameRef.current = time;

      const direction = keyboardScrollDirectionRef.current;
      const targetVelocity = direction * KEYBOARD_SCROLL_SPEED;
      const easingRate =
        direction === 0
          ? KEYBOARD_SCROLL_DECELERATION
          : KEYBOARD_SCROLL_ACCELERATION;
      const blend = 1 - Math.exp(-easingRate * deltaSeconds);
      const nextVelocity =
        keyboardScrollVelocityRef.current +
        (targetVelocity - keyboardScrollVelocityRef.current) * blend;
      const maxScrollTop = Math.max(
        0,
        container.scrollHeight - container.clientHeight,
      );
      const nextScrollTop = Math.max(
        0,
        Math.min(
          maxScrollTop,
          container.scrollTop + nextVelocity * deltaSeconds,
        ),
      );
      const hitTop = nextScrollTop <= 0 && nextVelocity < 0;
      const hitBottom = nextScrollTop >= maxScrollTop && nextVelocity > 0;

      container.scrollTop = nextScrollTop;
      keyboardScrollVelocityRef.current =
        hitTop || hitBottom ? 0 : nextVelocity;

      if (hitTop || hitBottom) {
        keyboardScrollDirectionRef.current = 0;
      }

      if (
        keyboardScrollDirectionRef.current !== 0 ||
        Math.abs(keyboardScrollVelocityRef.current) >
          KEYBOARD_SCROLL_MIN_VELOCITY
      ) {
        keyboardScrollRafRef.current = requestAnimationFrame(animateScroll);
      } else {
        keyboardScrollRafRef.current = undefined;
        keyboardScrollVelocityRef.current = 0;
        keyboardScrollLastFrameRef.current = 0;
      }
    };

    const startKeyboardScroll = () => {
      if (keyboardScrollRafRef.current !== undefined) return;

      keyboardScrollLastFrameRef.current = performance.now();
      keyboardScrollRafRef.current = requestAnimationFrame(animateScroll);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.defaultPrevented ||
        e.altKey ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        isTypingTarget(e.target) ||
        (e.key !== "ArrowDown" && e.key !== "ArrowUp")
      ) {
        return;
      }

      const container = scrollRef.current;
      if (!container) return;

      e.preventDefault();
      const direction: ScrollDirection = e.key === "ArrowDown" ? 1 : -1;
      const currentVelocity = keyboardScrollVelocityRef.current;

      keyboardScrollDirectionRef.current = direction;
      if (
        Math.sign(currentVelocity) !== direction ||
        Math.abs(currentVelocity) < KEYBOARD_SCROLL_INITIAL_VELOCITY
      ) {
        keyboardScrollVelocityRef.current =
          direction * KEYBOARD_SCROLL_INITIAL_VELOCITY;
      }
      startKeyboardScroll();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (
        (e.key === "ArrowDown" && keyboardScrollDirectionRef.current === 1) ||
        (e.key === "ArrowUp" && keyboardScrollDirectionRef.current === -1)
      ) {
        keyboardScrollDirectionRef.current = 0;
      }
    };

    const stopKeyboardScroll = () => {
      keyboardScrollDirectionRef.current = 0;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", stopKeyboardScroll);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", stopKeyboardScroll);
      cancelAnimationFrame(keyboardScrollRafRef.current!);
    };
  }, []);

  const tooltipLabel = useMemo(() => {
    if (selectedVerses.size === 0) return "";
    const sorted = Array.from(selectedVerses).sort((a, b) => a - b);
    const ranges: string[] = [];
    let start = sorted[0],
      end = sorted[0];
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
  }, [selectedVerses, bookName, chapter]);

  const getPanelHeightBounds = useCallback(() => {
    const containerH =
      panelRef.current?.parentElement?.getBoundingClientRect().height ??
      window.visualViewport?.height ?? window.innerHeight;
    return {
      min: PARALLEL_PANEL_MIN_HEIGHT,
      max: Math.max(
        PARALLEL_PANEL_MIN_HEIGHT,
        containerH - PARALLEL_PANEL_MIN_HEIGHT,
      ),
    };
  }, []);

  const setPanelHeightWithinBounds = useCallback(
    (height: number) => {
      const { min, max } = getPanelHeightBounds();
      setPanelHeight(Math.max(min, Math.min(height, max)));
    },
    [getPanelHeightBounds],
  );

  const handleResizeStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      const startY = e.clientY;
      const startHeight =
        panelRef.current?.getBoundingClientRect().height ?? 300;
      const handle = e.currentTarget;

      const onMove = (moveE: PointerEvent) => {
        const dy = startY - moveE.clientY;
        setPanelHeightWithinBounds(startHeight + dy);
      };
      const onUp = () => handle.removeEventListener("pointermove", onMove);
      handle.addEventListener("pointermove", onMove);
      handle.addEventListener("pointerup", onUp, { once: true });
      handle.addEventListener("pointercancel", onUp, { once: true });
    },
    [setPanelHeightWithinBounds],
  );

  const handleResizeKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;

      e.preventDefault();
      const currentHeight =
        panelRef.current?.getBoundingClientRect().height ?? panelHeight ?? 300;
      const direction = e.key === "ArrowUp" ? 1 : -1;
      setPanelHeightWithinBounds(
        currentHeight + direction * PARALLEL_PANEL_RESIZE_KEYBOARD_STEP,
      );
    },
    [panelHeight, setPanelHeightWithinBounds],
  );

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
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-y-auto bg-white px-4 py-6 sm:px-6 lg:px-8 dark:bg-transparent"
      >
        <div
          className={cn(
            "transition-[opacity,transform,filter] ease-in-out motion-reduce:transition-none",
            isTextVisible
              ? "opacity-100 translate-y-0 blur-0"
              : "pointer-events-none opacity-0 translate-y-1 blur-[1px]",
          )}
          style={{
            transitionDuration: `${CHAPTER_NAVIGATION_COMMIT_DELAY_MS}ms`,
          }}
        >
          <MainText
            verses={verses}
            versesWithParallels={versesWithParallels}
            activeVerse={activeVerse}
            selectedVerses={selectedVerses}
            onVerseClick={handleVerseClick}
            onCheckStart={handleCheckStart}
          />
        </div>
      </div>

      <div className="hidden lg:block w-px bg-[#E1DDD8] dark:bg-stone-700 shrink-0" />

      <div
        ref={panelRef}
        className={cn(
          "shrink-0 overflow-y-auto border-t border-[#E1DDD8] dark:border-stone-700 lg:border-t-0 bg-[#F1EEE9] dark:bg-stone-950/50",
          "h-[55vh] h-[55dvh] lg:h-auto lg:w-96 xl:w-[440px]",
          activeVerse === null && "hidden lg:block",
        )}
        style={panelHeight !== null ? { height: panelHeight } : undefined}
      >
        {/* Ручка перетаскивания — только на мобиле */}
        <div
          role="separator"
          aria-orientation="horizontal"
          aria-label="Изменить высоту панели параллелей"
          tabIndex={0}
          className="group lg:hidden sticky top-0 z-10 flex min-h-10 justify-center border-y border-[#D8D2CA] bg-[#F1EEE9] py-3 cursor-ns-resize touch-none select-none outline-none transition-colors dark:border-stone-700 dark:bg-stone-950/50 focus-visible:ring-2 focus-visible:ring-amber-900/25 dark:focus-visible:ring-amber-400/30"
          onPointerDown={handleResizeStart}
          onKeyDown={handleResizeKeyDown}
        >
          <div className="h-2 w-20 rounded-full bg-stone-400/80 shadow-[0_0_0_1px_rgba(120,113,108,0.18)] transition-colors group-active:bg-amber-900/70 dark:bg-stone-500 dark:shadow-[0_0_0_1px_rgba(214,211,209,0.14)] dark:group-active:bg-amber-700" />
        </div>

        <div className="px-4 sm:px-6 pb-6 lg:py-6">
          <div
            className={cn(
              "transition-[opacity,transform,filter] ease-in-out motion-reduce:transition-none",
              isParallelPanelVisible
                ? "opacity-100 translate-y-0 blur-0"
                : "pointer-events-none opacity-0 translate-y-1 blur-[1px]",
            )}
            style={{
              transitionDuration: `${PARALLEL_PANEL_SWAP_DELAY_MS}ms`,
            }}
          >
            <ParallelPanel
              refs={parallelPanelSnapshot.refs}
              activeVerse={parallelPanelSnapshot.activeVerse}
              bookName={parallelPanelSnapshot.bookName}
              chapter={parallelPanelSnapshot.chapter}
            />
          </div>
        </div>
      </div>

      {mounted &&
        selectedVerses.size > 0 &&
        tooltipPos !== null &&
        createPortal(
          <div
            className="fixed z-[9999] flex items-center gap-0.5 rounded-2xl p-1 shadow-2xl select-none bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700"
            style={
              tooltipPos === "bottom"
                ? {
                    bottom: "1.5rem",
                    left: "50%",
                    transform: "translateX(-50%)",
                  }
                : {
                    top: tooltipPos.y,
                    left: tooltipPos.left,
                    transform: "translateY(-50%)",
                  }
            }
          >
            <span className="px-2.5 text-xs font-medium text-stone-500 dark:text-stone-400 whitespace-nowrap">
              {tooltipLabel}
            </span>
            <button
              onClick={handleCopy}
              title="Копировать"
              className="cursor-pointer p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors text-stone-700 dark:text-stone-200"
            >
              {copied ? (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 8l4 4 6-7" />
                </svg>
              ) : (
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
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
              <svg
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

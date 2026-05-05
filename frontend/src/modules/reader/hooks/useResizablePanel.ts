"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import {
  PARALLEL_PANEL_MIN_HEIGHT,
  PARALLEL_PANEL_RESIZE_KEYBOARD_STEP,
} from "../constants/parallelPanel";

interface Params {
  activeVerse: number | null;
  panelRef: RefObject<HTMLDivElement | null>;
}

export function useResizablePanel({ activeVerse, panelRef }: Params) {
  const [panelHeight, setPanelHeight] = useState<number | null>(null);

  useEffect(() => {
    if (activeVerse === null) setPanelHeight(null);
  }, [activeVerse]);

  const getPanelHeightBounds = useCallback(() => {
    const containerH =
      panelRef.current?.parentElement?.getBoundingClientRect().height ??
      window.visualViewport?.height ??
      window.innerHeight;
    return {
      min: PARALLEL_PANEL_MIN_HEIGHT,
      max: Math.max(
        PARALLEL_PANEL_MIN_HEIGHT,
        containerH - PARALLEL_PANEL_MIN_HEIGHT,
      ),
    };
  }, [panelRef]);

  const setPanelHeightWithinBounds = useCallback(
    (height: number) => {
      const { min, max } = getPanelHeightBounds();
      setPanelHeight(Math.max(min, Math.min(height, max)));
    },
    [getPanelHeightBounds],
  );

  const handleResizeStart = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
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
    [panelRef, setPanelHeightWithinBounds],
  );

  const handleResizeKeyDown = useCallback(
    (e: ReactKeyboardEvent<HTMLDivElement>) => {
      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;

      e.preventDefault();
      const currentHeight =
        panelRef.current?.getBoundingClientRect().height ?? panelHeight ?? 300;
      const direction = e.key === "ArrowUp" ? 1 : -1;
      setPanelHeightWithinBounds(
        currentHeight + direction * PARALLEL_PANEL_RESIZE_KEYBOARD_STEP,
      );
    },
    [panelHeight, panelRef, setPanelHeightWithinBounds],
  );

  const panelStyle = useMemo(
    () => (panelHeight !== null ? { height: panelHeight } : undefined),
    [panelHeight],
  );
  const resizeHandleProps = useMemo(
    () => ({
      onPointerDown: handleResizeStart,
      onKeyDown: handleResizeKeyDown,
    }),
    [handleResizeKeyDown, handleResizeStart],
  );

  return {
    panelStyle,
    resizeHandleProps,
  };
}

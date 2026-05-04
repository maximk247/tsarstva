"use client";

import { useEffect, useRef, type RefObject } from "react";
import {
  KEYBOARD_SCROLL_ACCELERATION,
  KEYBOARD_SCROLL_DECELERATION,
  KEYBOARD_SCROLL_INITIAL_VELOCITY,
  KEYBOARD_SCROLL_MAX_FRAME,
  KEYBOARD_SCROLL_MIN_VELOCITY,
  KEYBOARD_SCROLL_SPEED,
} from "../config/keyboardScroll";
import { isTypingTarget } from "../lib/dom";

type ScrollDirection = -1 | 0 | 1;

export function useKeyboardScroll(scrollRef: RefObject<HTMLDivElement | null>) {
  const keyboardScrollRafRef = useRef<number>(undefined);
  const keyboardScrollDirectionRef = useRef<ScrollDirection>(0);
  const keyboardScrollVelocityRef = useRef(0);
  const keyboardScrollLastFrameRef = useRef(0);

  useEffect(() => {
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
  }, [scrollRef]);
}

"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * Like motion's `useReducedMotion`, but hydration-safe: it reports `false`
 * while the server HTML hydrates (the server can't know the OS setting), then
 * switches to the real value. Without this, a visitor with "Reduce motion" on
 * gets a hydration mismatch because the server and browser render different
 * starting styles.
 */
export function useReducedMotionSafe(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

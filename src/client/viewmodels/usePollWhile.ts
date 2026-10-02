"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Call `tick` every `intervalMs` while `active` is true, for at most `maxMs`.
 * Returns true once it has given up, so the screen can say so instead of
 * spinning forever. Used to watch a background Assessment finish.
 */
export function usePollWhile(active: boolean, tick: () => void, intervalMs = 3_000, maxMs = 300_000): boolean {
  const latest = useRef(tick);
  const [gaveUp, setGaveUp] = useState(false);
  useEffect(() => {
    latest.current = tick;
  });

  useEffect(() => {
    if (!active) return;
    const started = Date.now();
    const id = setInterval(() => {
      if (Date.now() - started > maxMs) {
        clearInterval(id);
        setGaveUp(true);
      } else latest.current();
    }, intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs, maxMs]);

  return active && gaveUp;
}

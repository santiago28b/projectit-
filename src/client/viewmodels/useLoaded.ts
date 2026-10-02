"use client";

import { useEffect, useState } from "react";

/**
 * Load data once per `key` with abort-on-unmount. Returns the data, an error
 * message, and whether it's still loading.
 */
export function useLoaded<T>(
  key: string,
  load: (signal: AbortSignal) => Promise<T>,
) {
  const [state, setState] = useState<{
    key: string;
    data: T | null;
    error: string;
  }>({ key: "", data: null, error: "" });

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setState({ key, data, error: "" });
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setState({
            key,
            data: null,
            error: reason instanceof Error ? reason.message : "Could not load",
          });
      });
    return () => controller.abort();
    // `load` is recreated every render; `key` says when to reload.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const current = state.key === key;
  return {
    data: current ? state.data : null,
    error: current ? state.error : "",
    isLoading: !current,
  };
}

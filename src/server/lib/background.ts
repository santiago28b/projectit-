import { after } from "next/server";

/**
 * Run work after the response is sent (Next's `after`). Wrapped so
 * controllers can be tested without a Next request scope.
 */
export function runInBackground(task: () => Promise<void>): void {
  after(task);
}

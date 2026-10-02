"use client";

import { useCallback, useState, useTransition } from "react";

import { jobOverviewAction } from "@/server/actions/matching";
import type { JobOverview } from "@/server/services/matching";

/**
 * Company Job page ViewModel — the Job, Candidates who fit, and
 * Projects that test it, each with reasons.
 */
export function useJobMatchesViewModel(jobId: string) {
  const [overview, setOverview] = useState<JobOverview | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const load = useCallback(() => {
    startTransition(async () => {
      try {
        setError(null);
        const result = await jobOverviewAction(jobId);
        setNotFound(result === null);
        setOverview(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    });
  }, [jobId]);

  return { overview, notFound, error, isPending, load };
}

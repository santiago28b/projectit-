"use client";

import { useCallback, useState, useTransition } from "react";

import { ApiError } from "@/client/repos/http";
import {
  matchingService,
  type JobOverview,
} from "@/client/services/matchingService";

/**
 * Company Job page ViewModel — the Job, Candidates who fit, and
 * Projects that test it, each with reasons.
 * Talks to client matchingService → matchingRepo → /api/matching/jobs/[id].
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
        setNotFound(false);
        setOverview(await matchingService.jobOverview(jobId));
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setNotFound(true);
          return;
        }
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    });
  }, [jobId]);

  return { overview, notFound, error, isPending, load };
}

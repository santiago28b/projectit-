"use client";

import { useCallback, useState, useTransition } from "react";

import {
  matchingService,
  type RecommendedProject,
} from "@/client/services/matchingService";

export type { RecommendedProject };

/**
 * Candidate Marketplace ViewModel — loads recommended Projects with reasons.
 * Talks to client matchingService → matchingRepo → /api/* (not server actions).
 */
export function useMarketplaceViewModel(candidateId: string | null) {
  const [recommendations, setRecommendations] = useState<
    RecommendedProject[]
  >([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const loadRecommendations = useCallback(() => {
    if (!candidateId) return;
    startTransition(async () => {
      try {
        setError(null);
        const result =
          await matchingService.recommendForCandidate(candidateId);
        setRecommendations(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      }
    });
  }, [candidateId]);

  return {
    recommendations,
    error,
    isPending,
    loadRecommendations,
  };
}

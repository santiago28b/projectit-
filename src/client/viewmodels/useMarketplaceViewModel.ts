"use client";

import { useCallback, useState, useTransition } from "react";

import { recommendProjectsAction } from "@/server/actions";
import type { Project } from "@/shared/models/domain";

export interface RecommendedProject {
  item: Project;
  reasons: string[];
}

/**
 * Candidate Marketplace ViewModel — loads recommended Projects with reasons.
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
        const result = await recommendProjectsAction(candidateId);
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

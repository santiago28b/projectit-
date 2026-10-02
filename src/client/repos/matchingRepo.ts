import { apiFetch } from "@/client/repos/http";
import type { Project } from "@/shared/models/domain";

export interface RecommendedProject {
  item: Project;
  reasons: string[];
}

export const matchingRepo = {
  recommendForCandidate(candidateId: string, signal?: AbortSignal) {
    const params = new URLSearchParams({ candidateId });
    return apiFetch<{ recommendations: RecommendedProject[] }>(
      `/api/matching/recommendations?${params.toString()}`,
      { signal },
    ).then((data) => data.recommendations);
  },
};

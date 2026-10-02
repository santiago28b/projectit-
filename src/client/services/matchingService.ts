import { matchingRepo } from "@/client/repos/matchingRepo";

export type { RecommendedProject } from "@/client/repos/matchingRepo";

export const matchingService = {
  recommendForCandidate(candidateId: string, signal?: AbortSignal) {
    return matchingRepo.recommendForCandidate(candidateId, signal);
  },
};

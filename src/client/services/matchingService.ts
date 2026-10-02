import { matchingRepo } from "@/client/repos/matchingRepo";

export type { JobOverview, RecommendedProject } from "@/client/repos/matchingRepo";

export const matchingService = {
  recommendForCandidate(candidateId: string, signal?: AbortSignal) {
    return matchingRepo.recommendForCandidate(candidateId, signal);
  },

  jobOverview(jobId: string, signal?: AbortSignal) {
    return matchingRepo.jobOverview(jobId, signal);
  },
};

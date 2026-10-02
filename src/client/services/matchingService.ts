import { matchingRepo } from "@/client/repos/matchingRepo";

export type { JobOverview, RecommendedProject } from "@/client/repos/matchingRepo";

export const matchingService = {
  recommendForCandidate(signal?: AbortSignal) {
    return matchingRepo.recommendForCandidate(signal);
  },

  jobOverview(jobId: string, signal?: AbortSignal) {
    return matchingRepo.jobOverview(jobId, signal);
  },
};

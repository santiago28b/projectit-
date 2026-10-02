import { reviewRepo } from "@/client/repos/reviewRepo";

export const reviewService = {
  getReviewScreen(submissionId: string, signal?: AbortSignal) {
    return reviewRepo.getReviewScreen(submissionId, signal);
  },

  addToShortlist(
    input: {
      companyId: string;
      candidateId: string;
      jobId?: string;
      submissionId?: string;
    },
    signal?: AbortSignal,
  ) {
    return reviewRepo.addToShortlist(input, signal);
  },
};

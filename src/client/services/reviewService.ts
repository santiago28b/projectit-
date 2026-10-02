import { reviewRepo } from "@/client/repos/reviewRepo";

export const reviewService = {
  listSubmissions: reviewRepo.listSubmissions,
  saveEvaluation: reviewRepo.saveEvaluation,
  override: reviewRepo.override,

  getReviewScreen(submissionId: string, signal?: AbortSignal) {
    return reviewRepo.getReviewScreen(submissionId, signal);
  },

  addToShortlist(
    input: {
      companyId: string;
      candidateId: string;
      jobId?: string;
      submissionId?: string;
      reviewerId: string;
    },
    signal?: AbortSignal,
  ) {
    return reviewRepo.addToShortlist(input, signal);
  },
};

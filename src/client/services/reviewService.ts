import { reviewRepo } from "@/client/repos/reviewRepo";

export const reviewService = {
  listSubmissions: reviewRepo.listSubmissions,
  saveEvaluation: reviewRepo.saveEvaluation,
  override: reviewRepo.override,
  removeFromShortlist: reviewRepo.removeFromShortlist,

  getReviewScreen(submissionId: string, signal?: AbortSignal) {
    return reviewRepo.getReviewScreen(submissionId, signal);
  },

  addToShortlist(
    input: {
      candidateId: string;
      jobId?: string;
      submissionId?: string;
    },
    signal?: AbortSignal,
  ) {
    return reviewRepo.addToShortlist(input, signal);
  },
};

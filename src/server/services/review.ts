import type { Evaluation, Shortlist, Submission } from "@/server/models/domain";
import type { EvidenceProfileEntry } from "@/server/services/evidence";

export interface ReviewScreenData {
  submission: Submission;
  evidence: EvidenceProfileEntry[];
  evaluation: Evaluation | null;
  followUpQuestions: string[];
}

export interface ReviewService {
  getReviewScreen(submissionId: string): Promise<ReviewScreenData>;
  saveEvaluation(input: {
    submissionId: string;
    reviewerId: string;
    rubricResults: Record<string, unknown>;
    notes: string;
    interviewRecommended: boolean;
  }): Promise<Evaluation>;
  addToShortlist(input: {
    companyId: string;
    candidateId: string;
    jobId?: string;
    submissionId?: string;
  }): Promise<Shortlist>;
}

export const reviewService: ReviewService = {
  async getReviewScreen() {
    throw new Error("reviewService.getReviewScreen not implemented");
  },
  async saveEvaluation() {
    throw new Error("reviewService.saveEvaluation not implemented");
  },
  async addToShortlist() {
    throw new Error("reviewService.addToShortlist not implemented");
  },
};

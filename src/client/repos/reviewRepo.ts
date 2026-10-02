import { apiFetch } from "@/client/repos/http";
import type {
  EvidenceLevel,
  EvidenceSource,
  Evaluation,
  Shortlist,
  Submission,
} from "@/shared/models/domain";

export interface ReviewEvidenceEntry {
  skill: string;
  level: EvidenceLevel;
  source: EvidenceSource;
  projectId: string;
  projectTitle: string;
}

export interface ReviewScreenResponse {
  submission: Submission;
  evidence: ReviewEvidenceEntry[];
  evaluation: Evaluation | null;
  followUpQuestions: string[];
}

export const reviewRepo = {
  getReviewScreen(submissionId: string, signal?: AbortSignal) {
    return apiFetch<ReviewScreenResponse>(`/api/review/${submissionId}`, {
      signal,
    });
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
    return apiFetch<{ shortlist: Shortlist }>("/api/shortlist", {
      method: "POST",
      body: JSON.stringify(input),
      signal,
    }).then((data) => data.shortlist);
  },
};

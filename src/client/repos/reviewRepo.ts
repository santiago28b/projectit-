import { apiFetch } from "@/client/repos/http";
import type {
  Evidence,
  EvidenceLevel,
  Evaluation,
  Shortlist,
} from "@/shared/models/domain";
import type {
  ReviewScreenData,
  SaveEvaluationInput,
  ShortlistInput,
} from "@/shared/models/review";

export type ReviewScreenResponse = ReviewScreenData;
export interface ReviewListEntry {
  id: string;
  candidateName: string;
  projectTitle: string;
  submittedAt: string;
}

export const reviewRepo = {
  listSubmissions(signal?: AbortSignal) {
    return apiFetch<{ submissions: ReviewListEntry[] }>("/api/review", {
      signal,
    }).then((data) => data.submissions);
  },

  /** Put a failed Assessment back in the queue (it runs in the background). */
  retryAssessment(submissionId: string) {
    return apiFetch<{ assessmentStatus: "pending" }>(`/api/submissions/${submissionId}/assessment`, {
      method: "POST",
    });
  },

  getReviewScreen(submissionId: string, signal?: AbortSignal) {
    return apiFetch<ReviewScreenResponse>(`/api/review/${submissionId}`, {
      cache: "no-store",
      signal,
    });
  },

  saveEvaluation(input: SaveEvaluationInput) {
    return apiFetch<{ evaluation: Evaluation }>(
      `/api/review/${input.submissionId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ ...input, action: "evaluation" }),
      },
    ).then((data) => data.evaluation);
  },

  override(input: {
    submissionId: string;
    skill: string;
    level: EvidenceLevel;
    rationale: string;
  }) {
    return apiFetch<{ evidence: Evidence }>(
      `/api/review/${input.submissionId}`,
      {
        method: "PATCH",
        body: JSON.stringify({ ...input, action: "override" }),
      },
    ).then((data) => data.evidence);
  },

  /** The Company comes from the session, so only the Candidate and Submission are sent. */
  addToShortlist(
    input: Omit<ShortlistInput, "companyId">,
    signal?: AbortSignal,
  ) {
    return apiFetch<{ shortlist: Shortlist }>("/api/shortlist", {
      method: "POST",
      body: JSON.stringify(input),
      signal,
    }).then((data) => data.shortlist);
  },

  removeFromShortlist(shortlistId: string) {
    return apiFetch<void>(`/api/shortlist/${shortlistId}`, {
      method: "DELETE",
    });
  },
};

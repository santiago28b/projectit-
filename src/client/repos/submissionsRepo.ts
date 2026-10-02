import { apiFetch } from "@/client/repos/http";
import type {
  MySubmissionSummary,
  MySubmissionView,
  SubmitProjectInput,
} from "@/shared/models/projects";

export type { SubmitProjectInput };

/** The server reads the Candidate from the role-switcher cookie. */
export const submissionsRepo = {
  submit(input: SubmitProjectInput, signal?: AbortSignal) {
    return apiFetch<{ submission: { id: string } }>("/api/submissions", {
      method: "POST",
      body: JSON.stringify(input),
      signal,
    }).then((data) => data.submission);
  },

  listMine(signal?: AbortSignal) {
    return apiFetch<{ submissions: MySubmissionSummary[] }>("/api/submissions", {
      signal,
    }).then((data) => data.submissions);
  },

  getMine(submissionId: string, signal?: AbortSignal) {
    return apiFetch<MySubmissionView>(`/api/submissions/${submissionId}`, {
      signal,
    });
  },
};

import { apiFetch } from "@/client/repos/http";
import type { Submission } from "@/shared/models/domain";

export interface SubmitProjectInput {
  projectId: string;
  candidateId: string;
  writtenResponse: string;
  repositoryUrl?: string;
  fileUrls?: string[];
  videoUrl: string;
}

export const submissionsRepo = {
  submit(input: SubmitProjectInput, signal?: AbortSignal) {
    return apiFetch<{ submission: Submission }>("/api/submissions", {
      method: "POST",
      body: JSON.stringify(input),
      signal,
    }).then((data) => data.submission);
  },
};

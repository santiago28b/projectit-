"use client";

import { submissionsService } from "@/client/services/submissionsService";
import { useLoaded } from "@/client/viewmodels/useLoaded";

/** A Candidate's own Submission and the Evidence it produced. */
export function useMyEvidenceViewModel(submissionId: string) {
  const { data, error, isLoading } = useLoaded(submissionId, (signal) =>
    submissionsService.getMine(submissionId, signal),
  );
  return { view: data, error, isLoading };
}

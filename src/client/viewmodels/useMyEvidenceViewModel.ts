"use client";

import { useState } from "react";

import { submissionsService } from "@/client/services/submissionsService";
import { useLoaded } from "@/client/viewmodels/useLoaded";
import { usePollWhile } from "@/client/viewmodels/usePollWhile";
import { isAssessing } from "@/shared/models/domain";
import type { MySubmissionView } from "@/shared/models/projects";

/**
 * A Candidate's own Submission and the Evidence it produced. While the
 * background Assessment is still pending or running, it re-checks every
 * few seconds so the Evidence appears on its own.
 */
export function useMyEvidenceViewModel(submissionId: string) {
  const { data, error, isLoading } = useLoaded(submissionId, (signal) =>
    submissionsService.getMine(submissionId, signal),
  );
  const [fresh, setFresh] = useState<{ id: string; view: MySubmissionView } | null>(null);
  const view = fresh?.id === submissionId ? fresh.view : data;

  const stillAssessing = isAssessing(view?.submission.assessmentStatus);
  const tookTooLong = usePollWhile(stillAssessing, () => {
    submissionsService
      .getMine(submissionId)
      .then((next) => setFresh({ id: submissionId, view: next }))
      .catch(() => {
        // Keep showing what we have; the next tick tries again.
      });
  });

  return { view, error, isLoading, tookTooLong };
}

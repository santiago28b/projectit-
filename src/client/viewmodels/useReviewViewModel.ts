"use client";

import { useEffect, useState } from "react";
import { reviewService } from "@/client/services/reviewService";
import { usePollWhile } from "@/client/viewmodels/usePollWhile";
import {
  getSampleReview,
  saveSampleReview,
} from "@/client/services/reviewSample";
import { isAssessing, type EvidenceLevel, type Evaluation } from "@/shared/models/domain";
import type { ReviewScreenData } from "@/shared/models/review";

export function useReviewViewModel(submissionId: string) {
  const [data, setData] = useState<ReviewScreenData | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [reload, setReload] = useState(0);
  const isSample = submissionId === "sample";

  useEffect(() => {
    const controller = new AbortController();
    const pending = isSample
      ? Promise.resolve().then(getSampleReview)
      : reviewService.getReviewScreen(submissionId, controller.signal);
    pending
      .then((screen) => {
        if (!controller.signal.aborted) {
          setData(screen);
          setError("");
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not load this review",
          );
      });
    return () => controller.abort();
  }, [submissionId, isSample, reload]);

  // While the AI Assessment runs in the background, re-check every few seconds.
  const assessing = !isSample && isAssessing(data?.submission.assessmentStatus);
  const assessmentTookTooLong = usePollWhile(assessing, () => {
    reviewService
      .getReviewScreen(submissionId)
      .then(setData)
      .catch(() => {
        // Keep the current screen; the next tick tries again.
      });
  });

  function commit(next: ReviewScreenData) {
    if (isSample) saveSampleReview(next);
    setData(next);
  }

  async function perform(action: () => Promise<void>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      return true;
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Could not save. Please try again.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }

  return {
    data,
    error,
    notice,
    busy,
    isSample,
    retry: () => {
      setError("");
      setReload((value) => value + 1);
    },
    assessing,
    assessmentTookTooLong,
    retryAssessment: () =>
      perform(async () => {
        if (!data || isSample) return;
        await reviewService.retryAssessment(submissionId);
        setData({
          ...data,
          submission: { ...data.submission, assessmentStatus: "pending", assessmentError: null },
        });
        setNotice("AI Assessment restarted. Evidence will update when it finishes.");
      }),
    override: (skill: string, level: EvidenceLevel, rationale: string) =>
      perform(async () => {
        if (!data) return;
        const previous = data.evidence.find((entry) => entry.skill === skill)!;
        const evidence = isSample
          ? {
              ...previous,
              level,
              rationale,
              source: "company" as const,
              updatedAt: new Date().toISOString(),
            }
          : await reviewService.override({
              submissionId,
              skill,
              level,
              rationale,
            });
        commit({
          ...data,
          evidence: data.evidence.map((entry) =>
            entry.skill === skill ? evidence : entry,
          ),
        });
        setNotice(
          isSample
            ? "Sample Evidence saved on this device."
            : "Company-reviewed Evidence saved.",
        );
      }),
    saveEvaluation: (
      rubricResults: Record<string, unknown>,
      notes: string,
      interviewRecommended: boolean,
    ) =>
      perform(async () => {
        if (!data) return;
        const input = {
          submissionId,
          reviewerId: data.reviewer.id,
          rubricResults,
          notes,
          interviewRecommended,
        };
        const evaluation: Evaluation = isSample
          ? {
              ...input,
              id: "sample-evaluation",
              createdAt: data.evaluation?.createdAt ?? new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }
          : await reviewService.saveEvaluation(input);
        commit({ ...data, evaluation });
        setNotice(
          isSample
            ? "Sample Evaluation saved on this device."
            : "Evaluation saved.",
        );
      }),
    shortlist: () =>
      perform(async () => {
        if (!data || data.shortlist) return;
        const input = {
          companyId: data.company.id,
          candidateId: data.candidate.id,
          submissionId,
        };
        const shortlist = isSample
          ? {
              ...input,
              id: "sample-shortlist",
              jobId: null,
              createdAt: new Date().toISOString(),
            }
          : await reviewService.addToShortlist({
              candidateId: input.candidateId,
              submissionId,
            });
        commit({ ...data, shortlist });
        setNotice(
          isSample
            ? "Sample Shortlist saved on this device."
            : `${data.candidateName} added to ${data.company.name}'s Shortlist.`,
        );
      }),
    removeFromShortlist: () =>
      perform(async () => {
        if (!data?.shortlist) return;
        if (!isSample)
          await reviewService.removeFromShortlist(data.shortlist.id);
        commit({ ...data, shortlist: null });
        setNotice(
          `${data.candidateName} removed from ${data.company.name}'s Shortlist.`,
        );
      }),
  };
}

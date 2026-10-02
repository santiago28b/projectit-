"use client";

import Link from "next/link";

import { Badge } from "@/client/components/ui/badge";
import { cn } from "@/client/lib/utils";
import { useMyEvidenceViewModel } from "@/client/viewmodels/useMyEvidenceViewModel";
import { isAssessing, type AssessmentStatus, type EvidenceLevel } from "@/shared/models/domain";

const LEVELS: Record<EvidenceLevel, { label: string; className: string }> = {
  strong: { label: "Strong", className: "bg-candidate text-white" },
  partial: { label: "Partial", className: "bg-candidate-soft text-candidate" },
  not_shown: { label: "Not shown", className: "bg-zinc-100 text-zinc-700" },
  not_assessed: { label: "Not assessed", className: "bg-zinc-50 text-zinc-500" },
};

const dateTime = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

export function MyEvidenceView({ submissionId }: { submissionId: string }) {
  const { view, error, isLoading, tookTooLong } = useMyEvidenceViewModel(submissionId);

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-12">
      <Link href="/candidate" className="text-sm font-medium text-candidate">
        ← Dashboard
      </Link>

      {error && (
        <p role="alert" className="mt-6 text-sm text-red-700">
          {error}
        </p>
      )}
      {isLoading && <p className="mt-6 text-sm text-zinc-500">Loading…</p>}

      {view && (
        <article className="mt-6 space-y-8">
          <header className="space-y-2">
            <p className="text-sm font-medium text-candidate">Submitted</p>
            <h1 className="text-3xl font-semibold text-zinc-900">Your Evidence</h1>
            <p className="text-zinc-600">
              <Link href={`/candidate/projects/${view.project.id}`} className="font-medium hover:underline">
                {view.project.title}
              </Link>{" "}
              · submitted {dateTime.format(new Date(view.submission.submittedAt))}
            </p>
            <p className="text-sm text-zinc-600">
              This is how strongly your Submission shows each skill. It counts
              toward your Matches, and a reviewing Company may update it after
              looking at your work.
            </p>
          </header>

          <AssessmentState
            status={view.submission.assessmentStatus}
            hasEvidence={view.evidence.length > 0}
            tookTooLong={tookTooLong}
          />

          {view.evidence.length > 0 && (
          <ul className="divide-y rounded-xl border border-zinc-200">
            {view.evidence.map((item) => (
              <li key={item.id} className="space-y-2 p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="mr-auto font-semibold text-zinc-900">{item.skill}</h2>
                  <Badge className={cn(LEVELS[item.level].className)}>
                    {LEVELS[item.level].label}
                  </Badge>
                  {item.source === "ai" ? (
                    <Badge className="bg-ai-soft text-ai">AI-assessed</Badge>
                  ) : (
                    <Badge className="bg-company-soft text-company">Company-reviewed</Badge>
                  )}
                </div>
                {item.rationale && <p className="text-sm text-zinc-700">{item.rationale}</p>}
              </li>
            ))}
          </ul>
          )}

          {view.submission.transcript && (
            <details className="rounded-xl border border-zinc-200 p-5">
              <summary className="cursor-pointer text-sm font-semibold text-zinc-900">
                Your Walkthrough Transcript
              </summary>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-700">
                {view.submission.transcript}
              </p>
            </details>
          )}

          <Link href="/candidate/marketplace" className="inline-block text-sm font-medium text-candidate">
            Find another Project →
          </Link>
        </article>
      )}
    </main>
  );
}

function AssessmentState({
  status,
  hasEvidence,
  tookTooLong,
}: {
  status: AssessmentStatus;
  hasEvidence: boolean;
  tookTooLong: boolean;
}) {
  if (tookTooLong)
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        The AI Assessment is taking longer than usual. Your Submission is saved; refresh later to see your Evidence.
      </p>
    );
  if (isAssessing(status))
    return (
      <div role="status" className="flex items-start gap-3 rounded-xl border border-teal-200 bg-ai-soft p-5">
        <span className="mt-1 h-3 w-3 shrink-0 animate-pulse rounded-full bg-teal-600" aria-hidden />
        <div>
          <p className="font-semibold text-zinc-900">Your Walkthrough is being assessed…</p>
          <p className="mt-1 text-sm text-zinc-700">
            The AI is transcribing your Walkthrough and reading your code. Your Evidence will appear here in about a
            minute. You can leave this page.
          </p>
        </div>
      </div>
    );
  if (status === "failed" && !hasEvidence)
    return (
      <p className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
        The AI Assessment didn&apos;t finish. Your Submission is saved, and the reviewing Company can run it again.
      </p>
    );
  return null;
}

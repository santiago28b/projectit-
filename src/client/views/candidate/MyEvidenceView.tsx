"use client";

import Link from "next/link";

import { Badge } from "@/client/components/ui/badge";
import { cn } from "@/client/lib/utils";
import { useMyEvidenceViewModel } from "@/client/viewmodels/useMyEvidenceViewModel";
import type { EvidenceLevel } from "@/shared/models/domain";

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
  const { view, error, isLoading } = useMyEvidenceViewModel(submissionId);

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

          <Link href="/candidate/marketplace" className="inline-block text-sm font-medium text-candidate">
            Find another Project →
          </Link>
        </article>
      )}
    </main>
  );
}

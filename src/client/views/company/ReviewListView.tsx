"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import { reviewService } from "@/client/services/reviewService";
import type { ReviewListEntry } from "@/client/repos/reviewRepo";

export function ReviewListView() {
  const [submissions, setSubmissions] = useState<ReviewListEntry[] | null>(
    null,
  );
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    reviewService
      .listSubmissions(controller.signal)
      .then((entries) => {
        if (!controller.signal.aborted) {
          setSubmissions(entries);
          setError("");
        }
      })
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Could not load Submissions",
          );
      });
    return () => controller.abort();
  }, [reload]);

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-8 font-[family-name:var(--font-geist-sans)] sm:px-8">
      <Link
        href="/company"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600"
      >
        <ArrowLeft size={16} />
        Company portal
      </Link>
      <header className="mt-7 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Company review
          </p>
          <h1 className="mt-2 text-2xl font-semibold">Submissions</h1>
        </div>
        <Link
          href="/company/review/sample"
          className="inline-flex items-center gap-2 text-sm font-medium text-blue-700"
        >
          Sample review
          <ArrowRight size={16} />
        </Link>
      </header>
      {error ? (
        <div
          role="alert"
          className="mt-6 border-l-4 border-amber-500 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <p>{error}</p>
          <button
            onClick={() => {
              setError("");
              setReload((value) => value + 1);
            }}
            className="mt-3 inline-flex items-center gap-2 font-medium"
          >
            <RefreshCw size={15} />
            Try again
          </button>
        </div>
      ) : submissions === null ? (
        <p
          role="status"
          className="flex items-center gap-2 py-12 text-sm text-zinc-500"
        >
          <LoaderCircle className="animate-spin" size={18} />
          Loading Submissions...
        </p>
      ) : submissions.length === 0 ? (
        <div className="py-14 text-center">
          <ClipboardCheck size={32} className="mx-auto text-blue-700" />
          <h2 className="mt-4 text-base font-semibold">
            No Submissions to review yet
          </h2>
          <Link
            href="/company/review/sample"
            className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-700"
          >
            Open sample review
            <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200">
          {submissions.map((entry) => (
            <li key={entry.id}>
              <Link
                href={`/company/review/${entry.id}`}
                className="flex items-center justify-between gap-4 py-5 hover:bg-blue-50"
              >
                <div className="min-w-0">
                  <h2 className="break-words text-base font-semibold">
                    {entry.candidateName}
                  </h2>
                  <p className="mt-1 break-words text-sm text-zinc-600">
                    {entry.projectTitle}
                  </p>
                  <time
                    dateTime={entry.submittedAt}
                    className="mt-1 block text-xs text-zinc-500"
                  >
                    {new Intl.DateTimeFormat("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(entry.submittedAt))}
                  </time>
                </div>
                <ArrowRight size={18} className="shrink-0 text-blue-700" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

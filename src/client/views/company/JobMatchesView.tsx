"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useJobMatchesViewModel } from "@/client/viewmodels/useJobMatchesViewModel";
import type { TrackRecord } from "@/client/services/matchingService";
import type { EvidenceLevel, EvidenceSource } from "@/shared/models/domain";

interface JobMatchesViewProps {
  jobId: string;
  /** Route to the Candidate review screen (Person D, ticket 06). */
  submissionHref?: (submissionId: string) => string;
  /** Route to a Company Project page. Cards aren't links until one exists (ticket 07). */
  projectHref?: (projectId: string) => string;
}

const LEVEL_STYLE: Record<EvidenceLevel, { label: string; className: string }> = {
  strong: { label: "Strong", className: "bg-emerald-50 text-emerald-800 border-emerald-200" },
  partial: { label: "Partial", className: "bg-amber-50 text-amber-800 border-amber-200" },
  not_shown: { label: "Not shown", className: "bg-zinc-50 text-zinc-600 border-zinc-200" },
  not_assessed: { label: "Not assessed", className: "bg-zinc-50 text-zinc-500 border-zinc-200" },
};

const SOURCE_LABEL: Record<EvidenceSource, string> = {
  ai: "AI-assessed",
  company: "Company-reviewed",
};

/**
 * Company Job page: "Candidates who fit" + "Projects that test this Job".
 * Shows reasons and an Evidence summary — never a % or score, and never
 * Submission details from Projects this Company doesn't own or Sponsor.
 */
export function JobMatchesView({
  jobId,
  submissionHref = (id) => `/company/review/${id}`,
  projectHref = (id) => `/company/projects/${id}`,
}: JobMatchesViewProps) {
  const { overview, notFound, error, isPending, load } = useJobMatchesViewModel(jobId);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <Shell>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Couldn&apos;t load this Job: {error}
          <button onClick={load} className="ml-3 font-medium underline">
            Try again
          </button>
        </div>
      </Shell>
    );
  }

  if (notFound) {
    return (
      <Shell>
        <p className="text-zinc-600">This Job doesn&apos;t exist.</p>
      </Shell>
    );
  }

  if (!overview) {
    return (
      <Shell>
        <div className="h-24 animate-pulse rounded-xl bg-zinc-100" />
        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="h-96 animate-pulse rounded-xl bg-zinc-100 lg:col-span-2" />
          <div className="h-96 animate-pulse rounded-xl bg-zinc-100" />
        </div>
      </Shell>
    );
  }

  const { job, candidates, projects, reviewableSubmissions } = overview;

  return (
    <Shell>
      {/* Job header */}
      <header className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          Job {job.status === "closed" && "· Closed"}
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-zinc-900">{job.title}</h1>
        {job.description && (
          <p className="mt-2 max-w-3xl text-sm text-zinc-600">{job.description}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {job.requiredSkills.map((s) => (
            <span key={s} className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800">
              {s}
            </span>
          ))}
          {job.preferredSkills.map((s) => (
            <span key={s} className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">
              {s} · preferred
            </span>
          ))}
        </div>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {/* Candidates who fit */}
        <section className="lg:col-span-2" aria-labelledby="candidates-heading">
          <SectionTitle id="candidates-heading" title="Candidates who fit" note="Matched on Evidence they've shown · more completed Projects rank higher" />
          {candidates.length === 0 ? (
            <Empty text={isPending ? "Loading…" : "No Candidates match this Job yet."} />
          ) : (
            <ol className="space-y-4">
              {candidates.map(({ item, reasons }) => {
                const jobSkills = new Set(
                  [...job.requiredSkills, ...job.preferredSkills].map((s) => s.toLowerCase()),
                );
                const relevant = item.profile.filter((e) => jobSkills.has(e.skill.toLowerCase()));
                const reviewable = reviewableSubmissions[item.candidate.id] ?? [];

                return (
                  <li key={item.candidate.id} className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold text-zinc-900">{item.name}</h3>
                          {item.shortlisted && (
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
                              ★ Shortlisted
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-zinc-500">
                          {[item.candidate.university, item.candidate.region].filter(Boolean).join(" · ")}
                        </p>
                        <TrackRecordStats record={item.trackRecord} />
                      </div>
                      {reviewable.map((r) => (
                        <Link
                          key={r.submissionId}
                          href={submissionHref(r.submissionId)}
                          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
                        >
                          Review: {r.projectTitle}
                        </Link>
                      ))}
                    </div>

                    <div className="mt-4 rounded-lg bg-teal-50 p-3">
                      <p className="text-xs font-semibold text-teal-800">Why they fit</p>
                      <ul className="mt-1.5 space-y-1">
                        {reasons.map((r) => (
                          <li key={r} className="text-sm text-teal-900">{r}</li>
                        ))}
                      </ul>
                    </div>

                    {relevant.length > 0 && (
                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Evidence</p>
                        <ul className="mt-2 flex flex-wrap gap-2">
                          {relevant.map((e) => {
                            const style = LEVEL_STYLE[e.level];
                            return (
                              <li
                                key={e.skill}
                                title={`${SOURCE_LABEL[e.source]} · ${e.projectTitle}`}
                                className={`rounded-md border px-2 py-1 text-xs ${style.className}`}
                              >
                                <span className="font-medium">{e.skill}</span>: {style.label}
                                <span className="opacity-70"> · {SOURCE_LABEL[e.source]}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          )}
        </section>

        {/* Projects that test this Job */}
        <section aria-labelledby="projects-heading">
          <SectionTitle id="projects-heading" title="Projects that test this Job" note="Yours and Platform Projects" />
          {projects.length === 0 ? (
            <Empty text={isPending ? "Loading…" : "No Projects test these skills yet."} />
          ) : (
            <ul className="space-y-3">
              {projects.map(({ item: p, reasons }) => (
                <li key={p.id}>
                  <MaybeLink
                    href={projectHref?.(p.id)}
                    className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-blue-300"
                  >
                    <div className="flex items-center gap-2 text-xs">
                      {p.type === "platform" && (
                        <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
                          Platform Project
                        </span>
                      )}
                      {p.expectedDurationMinutes && (
                        <span className="text-zinc-500">~{p.expectedDurationMinutes} min</span>
                      )}
                    </div>
                    <h3 className="mt-2 font-medium text-zinc-900">{p.title}</h3>
                    {reasons.map((r) => (
                      <p key={r} className="mt-1 text-sm text-teal-800">{r}</p>
                    ))}
                  </MaybeLink>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </Shell>
  );
}

function plural(n: number, word: string) {
  return `${n} ${word}${n === 1 ? "" : "s"}`;
}

/** Hours from the Projects' expected durations, e.g. "~4.5 hrs". */
function formatHours(minutes: number) {
  const hours = Math.round((minutes / 60) * 10) / 10;
  return `~${hours} ${hours === 1 ? "hr" : "hrs"}`;
}

function TrackRecordStats({ record }: { record: TrackRecord }) {
  return (
    <dl className="mt-2 flex flex-wrap gap-2 text-xs">
      <div className="rounded-md bg-zinc-100 px-2 py-1 text-zinc-700">
        <dt className="sr-only">Projects completed</dt>
        <dd>
          <span className="font-semibold text-zinc-900">{plural(record.projectsCompleted, "Project")}</span>{" "}
          completed · {formatHours(record.minutesCompleted)}
        </dd>
      </div>
      <div className="rounded-md bg-zinc-100 px-2 py-1 text-zinc-700">
        <dt className="sr-only">Company Projects completed</dt>
        <dd>
          <span className="font-semibold text-zinc-900">{plural(record.companyProjectsCompleted, "Company Project")}</span>
        </dd>
      </div>
    </dl>
  );
}

function MaybeLink({
  href,
  className,
  children,
}: {
  href?: string;
  className: string;
  children: React.ReactNode;
}) {
  return href ? (
    <Link href={href} className={className}>{children}</Link>
  ) : (
    <div className={className}>{children}</div>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <Link href="/company" className="text-sm font-medium text-blue-700">
        ← Company dashboard
      </Link>
      <div className="mt-4">{children}</div>
    </main>
  );
}

function SectionTitle({ id, title, note }: { id: string; title: string; note: string }) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">AI Match</p>
      <h2 id={id} className="text-lg font-semibold text-zinc-900">{title}</h2>
      <p className="text-sm text-zinc-500">{note}</p>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">{text}</p>
  );
}

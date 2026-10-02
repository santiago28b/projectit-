"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useProjectDashboardViewModel } from "@/client/viewmodels/useProjectDashboardViewModel";

export function ProjectDashboardView({ projectId }: { projectId: string }) {
  const { dashboard, notFound, error, isPending, load, publish } =
    useProjectDashboardViewModel(projectId);

  useEffect(() => {
    load();
  }, [load]);

  if (error) {
    return (
      <Shell>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
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
        <p className="text-zinc-600">
          This Project doesn&apos;t exist, or your Company doesn&apos;t own or
          Sponsor it.
        </p>
      </Shell>
    );
  }

  if (!dashboard) {
    return (
      <Shell>
        <div className="h-28 animate-pulse rounded-xl bg-zinc-100" />
        <div className="mt-6 h-64 animate-pulse rounded-xl bg-zinc-100" />
      </Shell>
    );
  }

  const { project, relationshipType, sponsorNames, invitedCount, submittedCount, submissions, rubric } =
    dashboard;

  return (
    <Shell>
      <header className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-800">
                {relationshipType === "owner" ? "Owned" : "Sponsored"}
              </span>
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600">
                {project.status}
              </span>
              {project.type === "platform" && (
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
                  Platform Project
                </span>
              )}
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600">
                {project.visibility}
                {project.visibilityTarget ? `: ${project.visibilityTarget}` : ""}
              </span>
            </div>
            <h1 className="mt-3 text-2xl font-semibold text-zinc-900">
              {project.title}
            </h1>
            {sponsorNames.length > 0 && (
              <p className="mt-2 text-sm text-zinc-600">
                Sponsored by {sponsorNames.join(", ")}
              </p>
            )}
            <p className="mt-3 max-w-3xl text-sm text-zinc-600">
              {project.scenario}
            </p>
          </div>
          {relationshipType === "owner" && project.status === "draft" && (
            <button
              type="button"
              disabled={isPending}
              onClick={publish}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
            >
              {isPending ? "Publishing…" : "Publish"}
            </button>
          )}
        </div>

        <dl className="mt-6 grid gap-4 sm:grid-cols-3">
          <Stat label="Invited" value={String(invitedCount)} />
          <Stat label="Submitted" value={String(submittedCount)} />
          <Stat
            label="Deadline"
            value={
              project.deadline ? formatDateTime(project.deadline) : "No deadline"
            }
          />
        </dl>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <section className="lg:col-span-2" aria-labelledby="subs-heading">
          <h2 id="subs-heading" className="text-lg font-semibold text-zinc-900">
            Submissions
          </h2>
          {submissions.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">
              No Submissions yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
              {submissions.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={`/company/review/${entry.id}`}
                    className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-blue-50"
                  >
                    <div>
                      <p className="font-medium text-zinc-900">
                        {entry.candidateName}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatDateTime(entry.submittedAt)} · {entry.status}
                      </p>
                    </div>
                    <span className="text-sm font-medium text-blue-700">
                      Review →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Skills
            </h2>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {project.skills.map((skill) => (
                <li
                  key={skill}
                  className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </section>
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
              Rubric
            </h2>
            {rubric.length === 0 ? (
              <p className="mt-2 text-sm text-zinc-500">No Rubric categories.</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {rubric.map((c) => (
                  <li key={c.name} className="text-sm">
                    <p className="font-medium text-zinc-900">{c.name}</p>
                    <p className="text-zinc-600">{c.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
          {project.expectedDurationMinutes && (
            <p className="text-sm text-zinc-500">
              ~{project.expectedDurationMinutes} min
              {project.difficulty ? ` · ${project.difficulty}` : ""}
            </p>
          )}
        </aside>
      </div>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <Link href="/company/projects" className="text-sm font-medium text-blue-700">
        ← Projects
      </Link>
      <div className="mt-6">{children}</div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-zinc-50 px-4 py-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold text-zinc-900">{value}</dd>
    </div>
  );
}

function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

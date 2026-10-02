"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useCompanyProjectsViewModel } from "@/client/viewmodels/useCompanyProjectsViewModel";

export function CompanyProjectsView() {
  const {
    owned,
    sponsorable,
    error,
    isPending,
    sponsoringId,
    load,
    sponsor,
  } = useCompanyProjectsViewModel();

  useEffect(() => {
    load();
  }, [load]);

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <Link href="/company" className="text-sm font-medium text-blue-700">
        ← Company dashboard
      </Link>

      <header className="mt-6 flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200 pb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Company Projects
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-zinc-900">Projects</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Create, publish, and Sponsor Projects your team can review.
          </p>
        </div>
        <Link
          href="/company/projects/new"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
        >
          Create Project
        </Link>
      </header>

      {error && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button onClick={load} className="ml-3 font-medium underline">
            Try again
          </button>
        </div>
      )}

      <section className="mt-8" aria-labelledby="yours-heading">
        <h2 id="yours-heading" className="text-lg font-semibold text-zinc-900">
          Yours and Sponsored
        </h2>
        {!owned ? (
          <p className="mt-4 text-sm text-zinc-500">
            {isPending ? "Loading…" : "No Projects yet."}
          </p>
        ) : owned.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">
            No owned or Sponsored Projects yet. Create one or Sponsor a Platform
            Project below.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {owned.map(
              ({
                project,
                relationshipType,
                sponsorNames,
                invitedCount,
                submittedCount,
              }) => (
                <li key={project.id}>
                  <Link
                    href={`/company/projects/${project.id}`}
                    className="block rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-blue-300"
                  >
                    <div className="flex flex-wrap items-center gap-2 text-xs">
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
                    </div>
                    <h3 className="mt-2 font-semibold text-zinc-900">
                      {project.title}
                    </h3>
                    {sponsorNames.length > 0 && (
                      <p className="mt-1 text-sm text-zinc-600">
                        Sponsored by {sponsorNames.join(", ")}
                      </p>
                    )}
                    <p className="mt-2 text-sm text-zinc-500">
                      {invitedCount} invited · {submittedCount} submitted
                      {project.deadline
                        ? ` · deadline ${formatDate(project.deadline)}`
                        : ""}
                    </p>
                  </Link>
                </li>
              ),
            )}
          </ul>
        )}
      </section>

      <section className="mt-12" aria-labelledby="sponsor-heading">
        <h2 id="sponsor-heading" className="text-lg font-semibold text-zinc-900">
          Platform Projects you can Sponsor
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          One click attaches your Company name and unlocks review of Submissions.
        </p>
        {!sponsorable ? (
          <p className="mt-4 text-sm text-zinc-500">
            {isPending ? "Loading…" : ""}
          </p>
        ) : sponsorable.length === 0 ? (
          <p className="mt-4 rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">
            You already Sponsor every published Platform Project, or none are
            available.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {sponsorable.map(({ project, existingSponsorNames }) => (
              <li
                key={project.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
              >
                <div className="min-w-0">
                  <h3 className="font-semibold text-zinc-900">{project.title}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                    {project.scenario}
                  </p>
                  {existingSponsorNames.length > 0 && (
                    <p className="mt-1 text-xs text-zinc-500">
                      Already Sponsored by {existingSponsorNames.join(", ")}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  disabled={isPending || sponsoringId === project.id}
                  onClick={() => sponsor(project.id)}
                  className="shrink-0 rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-60"
                >
                  {sponsoringId === project.id ? "Sponsoring…" : "Sponsor"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

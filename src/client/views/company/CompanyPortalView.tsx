"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useCompanyDashboardViewModel } from "@/client/viewmodels/useCompanyDashboardViewModel";
import type { CompanyProjectListItem } from "@/shared/models/projects";

export function CompanyPortalView() {
  const { dashboard, unauthorized, error, isPending, load, removeFromShortlist, removing } =
    useCompanyDashboardViewModel();

  useEffect(() => {
    load();
  }, [load]);

  if (unauthorized) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-zinc-900">Company portal</h1>
        <p className="mt-2 text-zinc-600">
          Switch to a Company account in the header to open this dashboard.
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
          <button onClick={load} className="ml-3 font-medium underline">
            Try again
          </button>
        </div>
      </main>
    );
  }

  if (!dashboard) {
    return (
      <main className="mx-auto w-full max-w-5xl px-6 py-12">
        <div className="h-10 w-64 animate-pulse rounded bg-zinc-100" />
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="h-64 animate-pulse rounded-xl bg-zinc-100" />
          <div className="h-64 animate-pulse rounded-xl bg-zinc-100" />
        </div>
        {isPending ? null : null}
      </main>
    );
  }

  const firstName = dashboard.userName.split(" ")[0] ?? dashboard.userName;
  const openJobs = dashboard.jobs.filter((j) => j.status === "open");

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-10">
      <header className="border-b border-zinc-200 pb-6">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
          {dashboard.companyName}
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Projects, Jobs, Submissions, and your Shortlist.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/company/projects/new"
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
          >
            Create Project
          </Link>
          <Link
            href="/company/projects"
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            All Projects
          </Link>
          <Link
            href="/company/review"
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50"
          >
            Review Submissions
          </Link>
        </div>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-4">
        <Stat label="Projects" value={String(dashboard.projects.length)} />
        <Stat label="Open Jobs" value={String(openJobs.length)} />
        <Stat
          label="Submissions"
          value={String(dashboard.submissions.length)}
          hint="in your review queue"
        />
        <Stat label="Shortlist" value={String(dashboard.shortlist.length)} />
      </div>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        {/* Projects */}
        <section aria-labelledby="projects-heading">
          <SectionHeader
            id="projects-heading"
            title="Projects"
            actionHref="/company/projects"
            actionLabel="View all"
          />
          {dashboard.sponsorableCount > 0 && (
            <p className="mt-2 text-sm text-zinc-600">
              {dashboard.sponsorableCount} Platform Project
              {dashboard.sponsorableCount === 1 ? "" : "s"} available to{" "}
              <Link
                href="/company/projects"
                className="font-medium text-blue-700 hover:underline"
              >
                Sponsor
              </Link>
              .
            </p>
          )}
          {dashboard.projects.length === 0 ? (
            <Empty
              text="No owned or Sponsored Projects yet."
              href="/company/projects/new"
              linkLabel="Create your first Project"
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {dashboard.projects.slice(0, 5).map((item) => (
                <ProjectRow key={item.project.id} item={item} />
              ))}
            </ul>
          )}
        </section>

        {/* Jobs */}
        <section aria-labelledby="jobs-heading">
          <SectionHeader
            id="jobs-heading"
            title="Jobs"
            actionHref="/company/jobs/new"
            actionLabel="New Job"
          />
          {openJobs.length === 0 ? (
            <Empty text="No open Jobs yet." />
          ) : (
            <ul className="mt-4 space-y-3">
              {openJobs.map((job) => (
                <li key={job.id}>
                  <Link
                    href={`/company/jobs/${job.id}`}
                    className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-blue-300"
                  >
                    <h3 className="font-semibold text-zinc-900">{job.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                      {job.description || "Open role"}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {job.requiredSkills.slice(0, 4).join(" · ")}
                      {job.requiredSkills.length > 4 ? "…" : ""}
                    </p>
                    <p className="mt-2 text-sm font-medium text-blue-700">
                      Candidates who fit →
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Submissions */}
        <section aria-labelledby="subs-heading">
          <SectionHeader
            id="subs-heading"
            title="Submissions to review"
            actionHref="/company/review"
            actionLabel="Review queue"
          />
          {dashboard.submissions.length === 0 ? (
            <Empty text="No Submissions to review yet." />
          ) : (
            <ul className="mt-4 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white">
              {dashboard.submissions.map((entry) => (
                <li key={entry.id}>
                  <Link
                    href={`/company/review/${entry.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-blue-50"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-900">
                        {entry.candidateName}
                      </p>
                      <p className="truncate text-xs text-zinc-500">
                        {entry.projectTitle} · {formatDate(entry.submittedAt)}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-medium text-blue-700">
                      Review →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Shortlist */}
        <section aria-labelledby="shortlist-heading">
          <SectionHeader id="shortlist-heading" title="Shortlist" />
          {dashboard.shortlist.length === 0 ? (
            <Empty text="No Candidates Shortlisted yet. Add people from a review." />
          ) : (
            <ul className="mt-4 space-y-2 rounded-xl border border-zinc-200 bg-white p-2">
              {dashboard.shortlist.map((entry) => (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm text-zinc-800"
                >
                  <span>
                    <span className="font-medium">{entry.candidateName}</span>
                    {entry.jobTitle && (
                      <span className="text-zinc-500"> · {entry.jobTitle}</span>
                    )}
                  </span>
                  <button
                    onClick={() => removeFromShortlist(entry.id)}
                    disabled={removing === entry.id}
                    aria-label={`Remove ${entry.candidateName} from Shortlist`}
                    className="text-xs font-medium text-zinc-500 hover:text-red-700 hover:underline disabled:opacity-50"
                  >
                    {removing === entry.id ? "Removing…" : "Remove"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function ProjectRow({ item }: { item: CompanyProjectListItem }) {
  const { project, relationshipType, sponsorNames, invitedCount, submittedCount } =
    item;
  return (
    <li>
      <Link
        href={`/company/projects/${project.id}`}
        className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-blue-300"
      >
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-blue-50 px-2 py-0.5 font-medium text-blue-800">
            {relationshipType === "owner" ? "Owned" : "Sponsored"}
          </span>
          <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-zinc-600">
            {project.status}
          </span>
          {project.type === "platform" && (
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
              Platform
            </span>
          )}
        </div>
        <h3 className="mt-2 font-semibold text-zinc-900">{project.title}</h3>
        {sponsorNames.length > 0 && (
          <p className="mt-1 text-xs text-zinc-500">
            Sponsored by {sponsorNames.join(", ")}
          </p>
        )}
        <p className="mt-2 text-sm text-zinc-500">
          {invitedCount} invited · {submittedCount} submitted
          {project.deadline ? ` · due ${formatDate(project.deadline)}` : ""}
        </p>
      </Link>
    </li>
  );
}

function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-zinc-900">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}

function SectionHeader({
  id,
  title,
  actionHref,
  actionLabel,
}: {
  id: string;
  title: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 id={id} className="text-lg font-semibold text-zinc-900">
        {title}
      </h2>
      {actionHref && actionLabel && (
        <Link
          href={actionHref}
          className="text-sm font-medium text-blue-700 hover:underline"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}

function Empty({
  text,
  href,
  linkLabel,
}: {
  text: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">
      <p>{text}</p>
      {href && linkLabel && (
        <Link
          href={href}
          className="mt-2 inline-block font-medium text-blue-700 hover:underline"
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(
    new Date(iso),
  );
}

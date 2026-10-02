"use client";

import Link from "next/link";

import { useCandidateDashboardViewModel } from "@/client/viewmodels/useCandidateDashboardViewModel";
import { ownerLine, TimingLine } from "@/client/views/candidate/ProjectLabels";

const date = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export function CandidatePortalView({ name }: { name: string | null }) {
  const { available, submitted, error, isLoading } = useCandidateDashboardViewModel();

  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-12">
      <p className="text-sm font-medium text-candidate">Candidate portal</p>
      <h1 className="mt-2 text-3xl font-semibold text-zinc-900">
        {name ? `Welcome back, ${name.split(" ")[0]}` : "Dashboard"}
      </h1>

      {error && (
        <p role="alert" className="mt-6 text-sm text-red-700">
          {error}
        </p>
      )}
      {isLoading && <p className="mt-6 text-sm text-zinc-500">Loading…</p>}

      {!isLoading && !error && (
        <div className="mt-10 grid gap-10 md:grid-cols-2">
          <section aria-labelledby="available">
            <div className="flex items-baseline justify-between">
              <h2 id="available" className="text-xl font-semibold text-zinc-900">
                Available Projects
              </h2>
              <Link href="/candidate/marketplace" className="text-sm font-medium text-candidate">
                Marketplace →
              </Link>
            </div>
            {available.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">You&apos;ve taken every open Project.</p>
            ) : (
              <ul className="mt-3 space-y-3">
                {available.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/candidate/projects/${project.id}`}
                      className="block rounded-lg border border-zinc-200 p-4 hover:border-candidate"
                    >
                      <p className="font-medium text-zinc-900">{project.title}</p>
                      <p className="text-sm text-zinc-600">{ownerLine(project)}</p>
                      <TimingLine project={project} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="submitted">
            <h2 id="submitted" className="text-xl font-semibold text-zinc-900">
              Submitted
            </h2>
            {submitted.length === 0 ? (
              <p className="mt-3 text-sm text-zinc-600">
                Nothing yet. Submit a Project to start building Evidence.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {submitted.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/candidate/submissions/${item.id}`}
                      className="block rounded-lg border border-zinc-200 p-4 hover:border-candidate"
                    >
                      <p className="font-medium text-zinc-900">{item.projectTitle}</p>
                      <p className="text-sm text-zinc-600">
                        Submitted {date.format(new Date(item.submittedAt))} · View your Evidence
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

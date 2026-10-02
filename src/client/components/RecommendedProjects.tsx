"use client";

import Link from "next/link";
import { useEffect } from "react";

import { useMarketplaceViewModel } from "@/client/viewmodels/useMarketplaceViewModel";

interface RecommendedProjectsProps {
  /** The signed-in Candidate (from the role switcher). */
  candidateId: string | null;
  /** Where a card links to. Only pass this from another Client Component. */
  projectHref?: (projectId: string) => string;
  /** How many cards to show. */
  limit?: number;
}

/**
 * "Recommended for you" — Projects ranked by the Candidate's skills and
 * Evidence, each with the reasons it was matched. Never shows a % or score.
 * Drop into the Marketplace: <RecommendedProjects candidateId={id} />
 */
export function RecommendedProjects({
  candidateId,
  projectHref = (id) => `/candidate/projects/${id}`,
  limit = 3,
}: RecommendedProjectsProps) {
  const { recommendations, error, isPending, loadRecommendations } =
    useMarketplaceViewModel(candidateId);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  const shown = recommendations.slice(0, limit);

  return (
    <section aria-labelledby="recommended-heading" className="space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
            AI Match
          </p>
          <h2
            id="recommended-heading"
            className="text-xl font-semibold text-zinc-900"
          >
            Recommended for you
          </h2>
        </div>
        <p className="text-sm text-zinc-500">
          Based on your skills and the Evidence you&apos;ve shown
        </p>
      </div>

      {!candidateId && (
        <EmptyState text="Pick a Candidate in the role switcher to see recommendations." />
      )}

      {candidateId && error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Couldn&apos;t load recommendations: {error}
          <button
            onClick={loadRecommendations}
            className="ml-3 font-medium underline"
          >
            Try again
          </button>
        </div>
      )}

      {candidateId && !error && isPending && shown.length === 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: limit }).map((_, i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-xl border border-zinc-200 bg-zinc-50"
            />
          ))}
        </div>
      )}

      {candidateId && !error && !isPending && shown.length === 0 && (
        <EmptyState text="No matches yet. Add skills to your profile or try a Platform Project to build Evidence." />
      )}

      {shown.length > 0 && (
        <ul className="grid gap-4 md:grid-cols-3">
          {shown.map(({ item: project, reasons }) => (
            <li key={project.id}>
              <MaybeLink
                href={projectHref?.(project.id)}
                className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-teal-300 hover:shadow-md"
              >
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {project.type === "platform" && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
                      Platform Project
                    </span>
                  )}
                  {project.expectedDurationMinutes && (
                    <span className="text-zinc-500">
                      ~{formatDuration(project.expectedDurationMinutes)}
                    </span>
                  )}
                </div>

                <h3 className="mt-3 font-semibold text-zinc-900">
                  {project.title}
                </h3>

                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {project.skills.map((skill) => (
                    <li
                      key={skill}
                      className="rounded-md bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700"
                    >
                      {skill}
                    </li>
                  ))}
                </ul>

                <div className="mt-4 flex-1 rounded-lg bg-teal-50 p-3">
                  <p className="text-xs font-semibold text-teal-800">
                    Why this fits you
                  </p>
                  <ul className="mt-1.5 space-y-1">
                    {reasons.map((reason) => (
                      <li key={reason} className="text-sm text-teal-900">
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </MaybeLink>
            </li>
          ))}
        </ul>
      )}
    </section>
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

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-zinc-300 p-6 text-sm text-zinc-500">
      {text}
    </p>
  );
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}
